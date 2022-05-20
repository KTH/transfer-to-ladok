import type { CanvasGrades, GradeableStudents } from "t2l-backend";

export interface TransferableResult {
  student: {
    id: string;
    sortableName: string;
  };
  transferrable: boolean;
  draft?: {
    grade: string;
    examinationDate: string;
  };
  message: string;
}

/**
 *
 * @param canvasGrades Grades taken from Canvas
 * @param ladokGradeableStudents List of students that can have grades
 * @returns a list of transferrable results
 */
export default function getResultsToBeTransferred(
  canvasGrades: CanvasGrades,
  ladokGradeableStudents: GradeableStudents
): TransferableResult[] {
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
        message: "'F' will not be transferred",
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
        message: `Grade "${canvasGrade.grade}" is not part of the Ladok grading scale`,
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
