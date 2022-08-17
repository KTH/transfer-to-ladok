import {
  createResult,
  getBetyg,
  RapporteringsMojlighetOutput,
  Resultat,
  Studieresultat,
  updateResult,
} from "../../externalApis/ladokApi";
import { containsPermission, getExistingDraft } from "./commons";
import { ResultInput, ResultOutput } from "./types";
import { handleError } from "./postOneResultError";

/** Errors when posting results that are detected by us */
class PostResultError extends Error {
  message: string;

  constructor(message: string) {
    super(message);
    this.message = message;
  }
}

/** Given a list of `studieResultat`, get the one that belongs to a given `student` */
function getStudentsStudieresultat(
  studentId: string,
  sokResultat: Studieresultat[]
) {
  const r = sokResultat.find((r) => r.Student.Uid === studentId);

  if (!r) {
    throw new PostResultError(
      `Student [${studentId}] is not present in the list of gradeable students. Use endpoint GET /transfer-to-ladok/api/courses/:courseId/ladok-grades to get such list`
    );
  }

  return r;
}

function formatInputForLadok(
  input: ResultInput,
  studieresultat: Studieresultat
): Resultat {
  const letterGrade = input.draft.grade;
  const scaleId = studieresultat.Rapporteringskontext.BetygsskalaID;
  const gradeId = getBetyg(scaleId).find((b) => b.Kod === letterGrade)?.ID;

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
      studieresultat.Rapporteringskontext.KravPaProjekttitel &&
      input.draft.projectTitle
        ? {
            Titel: input.draft.projectTitle.title,
            AlternativTitel: input.draft.projectTitle.alternativeTitle,
          }
        : undefined,
  };
}

function assertPermission(
  studieresultat: Studieresultat,
  allPermissions: RapporteringsMojlighetOutput
) {
  const hasPermission = containsPermission(studieresultat, allPermissions);

  if (!hasPermission) {
    throw new PostResultError(
      "You don't have permissions to send results to this student"
    );
  }
}

export default async function postOneResult(
  resultInput: ResultInput,
  allStudieresultat: Studieresultat[],
  allPermissions: RapporteringsMojlighetOutput
): Promise<ResultOutput> {
  try {
    const studieresultat = getStudentsStudieresultat(
      resultInput.id,
      allStudieresultat
    );
    const ladokInput = formatInputForLadok(resultInput, studieresultat);
    assertPermission(studieresultat, allPermissions);

    const draft = getExistingDraft(studieresultat);

    if (draft) {
      await updateResult(draft.Uid, ladokInput, draft.SenasteResultatandring);
    } else {
      await createResult(
        studieresultat.Uid,
        studieresultat.Rapporteringskontext.UtbildningsinstansUID,
        ladokInput
      );
    }

    return {
      ...resultInput,
      status: "success",
    };
  } catch (err) {
    return {
      ...resultInput,
      status: "error",
      error: handleError(err),
    };
  }
}
