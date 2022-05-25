import type { CanvasGrades, GradeableStudents } from "t2l-backend/src/types";
import {
  GradesDestination,
  PostLadokGradesInput,
  PostLadokGradesOutput,
} from "t2l-backend/src/types";

interface Row {
  student: {
    id: string;
    sortableName: string;
  };
  draft: {
    grade: string;
    examinationDate: string;
  };
  warning?: {
    code: string;
    message: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface RowBefore extends Row {
  status: "transferable" | "not_transferable";
}

export interface RowAfter extends Row {
  status: "not_transferred" | "success" | "error";
}

/**
 *
 * @param canvasGrades Grades taken from Canvas
 * @param ladokGradeableStudents List of students that can have grades
 * @returns a list of transferrable results
 */
export function getResultsToBeTransferred(
  canvasGrades: CanvasGrades,
  ladokGradeableStudents: GradeableStudents,
  getExaminationDate: (grade: CanvasGrades[number]) => string
): RowBefore[] {
  if (canvasGrades.length === 0) {
    return [];
  }
  return ladokGradeableStudents.map((ladokGrade): RowBefore => {
    const canvasGrade = canvasGrades.find(
      (g) => g.student.id === ladokGrade.student.id
    );

    if (!ladokGrade.hasPermission) {
      return {
        student: ladokGrade.student,
        status: "not_transferable",
        draft: {
          grade: "",
          examinationDate: "",
        },
        error: {
          code: "no_permission",
          message: "You don't have permission to set grades in Ladok",
        },
      };
    }

    if (!canvasGrade) {
      return {
        student: ladokGrade.student,
        status: "not_transferable",
        draft: {
          grade: "",
          examinationDate: "",
        },
        error: {
          code: "missing_in_canvas",
          message: "Student is not present in Canvas",
        },
      };
    }

    if (!canvasGrade?.grade) {
      return {
        student: ladokGrade.student,
        status: "not_transferable",
        draft: {
          grade: "",
          examinationDate: "",
        },
        error: {
          code: "missing_grade_in_canvas",
          message: "This student has no grade in Canvas",
        },
      };
    }

    if (canvasGrade.grade === "F") {
      return {
        student: ladokGrade.student,
        status: "not_transferable",
        draft: {
          grade: canvasGrade.grade,
          examinationDate: "",
        },
        error: {
          code: "grade_f",
          message: "Will not be transferred",
        },
      };
    }

    if (!ladokGrade.scale.includes(canvasGrade.grade)) {
      return {
        student: ladokGrade.student,
        status: "not_transferable",
        draft: {
          grade: canvasGrade.grade,
          examinationDate: "",
        },
        error: {
          code: "non_valid_grade",
          message: `Will not be transferred. "${canvasGrade.grade}" is not valid`,
        },
      };
    }

    const warning =
      ladokGrade.draft?.grade !== canvasGrade.grade
        ? {
            code: "overwritten",
            message: "Draft in Ladok will be overwritten",
          }
        : undefined;

    return {
      student: ladokGrade.student,
      status: "transferable",
      draft: {
        grade: canvasGrade.grade,
        examinationDate: getExaminationDate(canvasGrade),
      },
      warning,
    };
  });
}

export function convertToApiInput(
  destination: GradesDestination,
  results: RowBefore[]
): PostLadokGradesInput {
  return {
    destination,
    results: results
      .filter((r) => r.status === "transferable")
      .map((r) => ({
        id: r.student.id,
        draft: r.draft,
      })),
  };
}

export function processApiOutput(
  input: RowBefore[],
  output: PostLadokGradesOutput
): RowAfter[] {
  return input.map((inputRow): RowAfter => {
    if (inputRow.status === "not_transferable") {
      return {
        ...inputRow,
        status: "not_transferred",
        error: {
          code: "not_transferred",
          message: "Not transferred",
        },
      };
    }

    const o = output.results.find((r) => r.id === inputRow.student.id);
    if (!o) {
      return {
        student: inputRow.student,
        status: "error",
        draft: {
          grade: "",
          examinationDate: "",
        },
        error: {
          code: "unknown",
          message: "Unknown problem",
        },
      };
    }

    if (o.status === "error") {
      return {
        ...inputRow,
        status: "error",
        error: o.error,
      };
    }

    return {
      ...inputRow,
      status: "success",
    };
  });
}
