import {
  createResult,
  getBetyg,
  Resultat,
  updateResult,
} from "../../externalApis/ladokApi";
import { ResultInput, ResultOutput } from "./types";
import { PostResultError, handleError } from "./postOneResultError";
import GradingInformation from "./GradingInformation";
import { trackEvent } from "./applicationInsights";

/** Given a list of `studieResultat`, get the one that belongs to a given `student` */
function getStudentsGradingInformation(
  studentId: string,
  allGradingInformation: GradingInformation[]
) {
  const r = allGradingInformation.find((r) => r.belongsTo(studentId));

  if (!r) {
    throw new PostResultError(
      `Student [${studentId}] is not present in the list of gradeable students. Use endpoint GET /transfer-to-ladok/api/courses/:courseId/ladok-grades to get such list`
    );
  }

  return r;
}

function formatInputForLadok(
  input: ResultInput,
  gradingInformation: GradingInformation
): Resultat {
  const letterGrade = input.draft.grade;
  const scaleId = gradingInformation._obj.Rapporteringskontext.BetygsskalaID;
  const gradeId = getBetyg(scaleId).find(
    (b) => b.Kod.toUpperCase() === letterGrade.toUpperCase()
  )?.ID;

  if (!gradeId) {
    throw new PostResultError(
      `You cannot set the grade [${letterGrade}] to this student. Use endpoint GET /transfer-to-ladok/api/courses/:courseId/ladok-grades to get the list of possible grades`
    );
  }

  return {
    BetygsskalaID: scaleId,
    Betygsgrad: gradeId,
    Examinationsdatum: input.draft.examinationDate,
    Projekttitel:
      gradingInformation._obj.Rapporteringskontext.KravPaProjekttitel &&
      input.draft.projectTitle
        ? {
            Titel: input.draft.projectTitle.title,
            AlternativTitel: input.draft.projectTitle.alternativeTitle,
          }
        : undefined,
  };
}

export function getExistingDraft(gradingInformation: GradingInformation) {
  return gradingInformation._obj.ResultatPaUtbildningar?.find(
    (rpu) => rpu.Arbetsunderlag?.ProcessStatus === 1
  )?.Arbetsunderlag;
}

export default async function postOneResult(
  resultInput: ResultInput,
  allGradingInformation: GradingInformation[]
): Promise<ResultOutput> {
  try {
    const gradingInformation = getStudentsGradingInformation(
      resultInput.id,
      allGradingInformation
    );
    const ladokInput = formatInputForLadok(resultInput, gradingInformation);

    if (!gradingInformation.hasPermission) {
      throw new PostResultError(
        "You don't have permissions to send results to this student"
      );
    }

    const draft = getExistingDraft(gradingInformation);

    if (draft) {
      await updateResult(draft.Uid, ladokInput, draft.SenasteResultatandring);
      trackEvent({ name: "Update result" });
    } else {
      await createResult(
        gradingInformation._obj.Uid,
        gradingInformation._obj.Rapporteringskontext.UtbildningsinstansUID,
        ladokInput
      );
      trackEvent({ name: "Create result" });
    }

    return {
      ...resultInput,
      status: "success",
    };
  } catch (err) {
    const error = handleError(err);
    trackEvent({ name: "Error sending result", properties: error });

    return {
      ...resultInput,
      error,
      status: "error",
    };
  }
}
