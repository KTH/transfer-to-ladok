import type { CanvasGrades, GradeableStudents } from "t2l-backend";

interface TransferrableResult {
  student: {
    id: string;
    sortableName: string;
  };
  transferrable: boolean;
  draft?: {
    grade: string;
    examinationDate: string;
  };
  message?: string;
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
): TransferrableResult[] {
  return ladokGradeableStudents.map((ladokGrade) => {
    const canvasGrade = canvasGrades.find(
      (g) => g.student.id === ladokGrade.student.id
    );

    if (!canvasGrade?.grade) {
      return {
        student: ladokGrade.student,
        transferrable: false,
        message: "No grade in Canvas",
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
    };
  });
}
