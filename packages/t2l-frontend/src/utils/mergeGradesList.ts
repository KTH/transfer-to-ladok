import type { CanvasGrades, GradeableStudents } from "t2l-backend";
interface TransferrableGrade {
  transferable: true;

  student: {
    id: string;
    sortableName: string;
  };

  draft: {
    grade: string;
    examinationDate: string;
  };
}

interface NonTransferrableGrade {
  transferable: false;

  student: {
    id: string;
    sortableName: string;
  };

  cause: {
    code: string;
    message: string;
  };
}

type TG = TransferrableGrade | NonTransferrableGrade;

/**
 * Given a list of Canvas grades (in an assignment) and a list of
 * "gradeable students" in Ladok, return a list of grades that
 * can be sent to Ladok.
 */
export function mergeGradesLists(
  canvasGrades: CanvasGrades,
  ladokGradeableStudents: GradeableStudents,
  examinationDate: Date
): TG[] {
  return canvasGrades.map<TG>((canvasGrade): TG => {
    const ladokGrade = ladokGradeableStudents.find(
      (ladokGrade) => ladokGrade.student.id === canvasGrade.student.id
    );

    if (!ladokGrade) {
      return {
        transferable: false,
        student: {
          id: canvasGrade.student.id,
          sortableName: canvasGrade.student.sortableName,
        },
        cause: {
          code: "not_in_ladok",
          message: "The student is not in Ladok",
        },
      };
    }

    // The student exist in Ladok
    const student = {
      id: ladokGrade.student.id,
      sortableName: ladokGrade.student.sortableName,
    };

    // The student has no grade in Canvas
    if (!canvasGrade.grade) {
      return {
        transferable: false,
        student,
        cause: {
          code: "no_grade_in_canvas",
          message: "The student has no grade in Canvas",
        },
      };
    }

    if (ladokGrade.draft?.grade === canvasGrade.grade) {
      return {
        transferable: false,
        student,
        cause: {
          code: "grade_already_in_ladok",
          message: `Grade ${canvasGrade.grade} already in Ladok`,
        },
      };
    }

    // "F" grades
    if (canvasGrade.grade === "F" && ladokGrade.certified?.grade === "F") {
      return {
        transferable: false,
        student,
        cause: {
          code: "grade_f",
          message:
            "The student has a certified F in Ladok and cannot be given another F",
        },
      };
    }

    // Invalid grade
    if (!ladokGrade.scale.includes(canvasGrade.grade)) {
      return {
        transferable: false,
        student,
        cause: {
          code: "invalid_grade",
          message:
            `Grade ${canvasGrade.grade} is not valid in Ladok. ` +
            `Valid grades are ${ladokGrade.scale.join(", ")}`,
        },
      };
    }

    return {
      transferable: true,
      student,
      draft: {
        grade: canvasGrade.grade,
        examinationDate: examinationDate.toISOString().split("T")[0],
      },
    };
  });
}
