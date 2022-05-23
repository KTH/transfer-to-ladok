import type { CanvasGrades, GradeableStudents } from "t2l-backend";
import {
  GradesDestination,
  PostLadokGradesInput,
  PostLadokGradesOutput,
} from "t2l-backend/src/types";

interface TransferableResult {
  student: {
    id: string;
    sortableName: string;
  };
  message: string;
  transferrable: true;
  draft: {
    grade: string;
    examinationDate: string;
  };
}

interface NonTransferrableResult {
  student: {
    id: string;
    sortableName: string;
  };
  message: string;
  transferrable: false;
  draft?: {
    grade: string;
    examinationDate: string;
  };
}

interface TransferredResult {
  student: {
    id: string;
    sortableName: string;
  };
  transferrable: true;
  draft: {
    grade: string;
    examinationDate: string;
  };
  status: "success" | "error";
  error?: {
    code: string;
    message: string;
  };
}

export type PreviewTableRow = TransferableResult | NonTransferrableResult;
export type TransferredTableRow = NonTransferrableResult | TransferredResult;

/**
 *
 * @param canvasGrades Grades taken from Canvas
 * @param ladokGradeableStudents List of students that can have grades
 * @returns a list of transferrable results
 */
export function getResultsToBeTransferred(
  canvasGrades: CanvasGrades,
  ladokGradeableStudents: GradeableStudents
): PreviewTableRow[] {
  if (canvasGrades.length === 0) {
    return [];
  }
  return ladokGradeableStudents.map((ladokGrade) => {
    const canvasGrade = canvasGrades.find(
      (g) => g.student.id === ladokGrade.student.id
    );

    if (!canvasGrade) {
      return {
        student: ladokGrade.student,
        transferrable: false,
        message: "This student is not present in Canvas.",
      };
    }

    if (!canvasGrade?.grade) {
      return {
        student: ladokGrade.student,
        transferrable: false,
        message: "This student has no grade in Canvas",
      };
    }

    if (canvasGrade.grade === "F") {
      return {
        student: ladokGrade.student,
        transferrable: false,
        message: "Will not be transferred",
      };
    }

    if (!ladokGrade.scale.includes(canvasGrade.grade)) {
      return {
        student: ladokGrade.student,
        transferrable: false,
        draft: {
          grade: canvasGrade.grade,
          examinationDate: "",
        },
        message: `Will not be transferred. "${canvasGrade.grade}" is not valid`,
      };
    }

    return {
      student: ladokGrade.student,
      transferrable: true,
      draft: {
        grade: canvasGrade.grade,
        examinationDate: "2022-01-01",
      },
      message: ladokGrade.draft
        ? "Current draft in Ladok will be overwritten"
        : "",
    };
  });
}

export function convertToApiInput(
  destination: GradesDestination,
  results: PreviewTableRow[]
): PostLadokGradesInput {
  return {
    destination,
    results: results
      .filter((r): r is TransferableResult => r.transferrable)
      .map((r) => ({
        id: r.student.id,
        draft: r.draft,
      })),
  };
}

export function processApiOutput(
  input: PreviewTableRow[],
  output: PostLadokGradesOutput
): TransferredTableRow[] {
  return input.map((row) => {
    if (!row.transferrable) {
      return {
        ...row,
        message: "Not transferred to Ladok",
      };
    }

    const o = output.results.find((r) => r.id === row.student.id);

    if (o) {
      return {
        transferrable: true,
        student: row.student,
        status: o.status,
        draft: o.draft,
        message: "Error when attempting to transfer",
        error: o.error,
      };
    }

    return {
      transferrable: true,
      student: row.student,
      draft: row.draft,
      status: "error",
      error: {
        message: "Unknown error",
        code: "unknown",
      },
    };
  });
}
