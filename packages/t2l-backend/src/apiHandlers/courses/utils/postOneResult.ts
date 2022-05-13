import { HTTPError } from "got";
import {
  createResult,
  getBetyg,
  getRapportor,
  Studieresultat,
  updateResult,
} from "../../../externalApis/ladokApi";
import { isLadokApiError } from "./asserts";
import { GradeResult, ResultOutput } from "./types";

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
      `Student [${studentId}] is not present in the list of gradeable students`
    );
  }

  return r;
}

function formatInputForLadok(
  input: GradeResult,
  studieresultat: Studieresultat
) {
  const letterGrade = input.draft.grade;
  const scaleId = studieresultat.Rapporteringskontext.BetygsskalaID;
  const gradeId = getBetyg(scaleId).find((b) => b.Kod === letterGrade)?.ID;

  if (!gradeId) {
    throw new PostResultError(
      `The grade [${letterGrade}] is not present in the list of grades for student [${studieresultat.Student.Uid}]`
    );
  }

  return {
    BetygsskalaID: scaleId,
    Betygsgrad: gradeId,
    Examinationsdatum: input.draft.examinationDate,
  };
}

function getExistingDraft(studentResultat: Studieresultat) {
  const arbetsunderlag = studentResultat.ResultatPaUtbildningar?.find(
    (rpu) => rpu.Arbetsunderlag
  )?.Arbetsunderlag;

  return arbetsunderlag;
}

/**
 * Checks if a user has permission to send grades to the given utbildningsinstansUID
 * according to Ladok.
 */
async function checkPermission(email: string, utbildningsinstansUID: string) {
  const rapportorer = await getRapportor(utbildningsinstansUID);
  const isRapportor = rapportorer.Anvandare.some(
    (rapportor) => rapportor.Anvandarnamn === email
  );

  if (!isRapportor) {
    throw new PostResultError(
      `You don't have 'rapportor' permissions in utbilidningsinstans [${utbildningsinstansUID}]`
    );
  }
}

function handleError(err: unknown): ResultOutput["error"] {
  if (err instanceof PostResultError) {
    return {
      code: "input_error",
      message: err.message,
    };
  }

  if (err instanceof HTTPError) {
    const body = err.response.body;

    if (isLadokApiError(body)) {
      return {
        code: "unprocessed_ladok_error",
        message: body.Meddelande,
      };
    }

    if (typeof err.response.body === "string") {
      return {
        code: "unknown_ladok_error",
        message: `Unknown problem in Ladok: ${err.response.body}`,
      };
    }

    return {
      code: "unknown_ladok_error",
      message:
        "Unknown problem in Ladok. No readable error is returned by Ladok",
    };
  }

  // Unknown error
  return {
    code: "unknown_error",
    message: "Unknown problem. No error object is thrown",
  };
}

/**
 * Sends one result to Ladok. It returns the result of the operation
 *
 * @param input Object containing the grade to be sent
 * @param email Sender e-mail. We use this to check if the sender has permissions
 * @param allStudieresultat A collection of "Studieresultat" from Ladok.
 */
export default async function postOneResult(
  input: GradeResult,
  email: string,
  allStudieresultat: Studieresultat[]
): Promise<ResultOutput> {
  try {
    const oneStudieResultat = getStudentsStudieresultat(
      input.id,
      allStudieresultat
    );
    const ladokInput = formatInputForLadok(input, oneStudieResultat);
    const utbildningsinstansUID =
      oneStudieResultat.Rapporteringskontext.UtbildningsinstansUID;

    await checkPermission(email, utbildningsinstansUID);

    const draft = getExistingDraft(oneStudieResultat);
    if (draft) {
      await updateResult(draft.Uid, ladokInput, draft.SenasteResultatandring);

      return {
        id: input.id,
        draft: input.draft,
        status: "success",
      };
    } else {
      await createResult(
        oneStudieResultat.Uid,
        utbildningsinstansUID,
        ladokInput
      );

      return {
        id: input.id,
        draft: input.draft,
        status: "success",
      };
    }
  } catch (err) {
    return {
      id: input.id,
      draft: input.draft,
      status: "error",
      error: handleError(err),
    };
  }
}
