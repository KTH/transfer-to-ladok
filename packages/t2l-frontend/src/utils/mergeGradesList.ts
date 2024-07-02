import type {
  CanvasGrades,
  GradeableStudents,
  PostLadokGradesOutput,
} from "t2l-backend";

export interface GradeWithStatus {
  /**
   * This property indicates if the grade can be sent to Ladok or not.
   *
   * If the grade has not been sent then the possible values are:
   * - `ready` - Grade can be sent
   * - `not_transferable` - Grade cannot be sent
   *
   * If the grade has been try to send to Ladok:
   * - `success` - The grade has been sent to Ladok
   * - `error` - App tried to send the grade to Ladok but failed
   */
  status: "success" | "error" | "ready" | "not_transferable";

  /** Grade in Canvas */
  canvasGrade: string | null;

  /** Student */
  student: {
    id: string;
    sortableName: string;
    personalNumber?: string;
    anonymousCode?: string;
  };

  /** Information that will be sent to Ladok */
  input?: {
    grade: string;
    examinationDate: string;
  };

  /** Error cause. Only available if "status" is "error" or "not_transferable" */
  cause?: {
    code: string;
    message: string;
  };
}

/**
 * Given a list of Canvas grades (in an assignment) and a list of
 * "gradeable students" in Ladok, return a list of grades that
 * can be sent to Ladok.
 */
export function getTransferencePreview(
  canvasGrades: CanvasGrades,
  ladokGradeableStudents: GradeableStudents,
  ladokParticipantsId: string[],
  examinationDate: string
): GradeWithStatus[] {
  return canvasGrades.map<GradeWithStatus>((canvasGrade): GradeWithStatus => {
    const ladokGrade = ladokGradeableStudents.find(
      (ladokGrade) => ladokGrade.student.id === canvasGrade.student.id
    );

    const isParticipant = ladokParticipantsId.find(
      (p) => p === canvasGrade.student.id
    );

    if (!isParticipant) {
      return {
        status: "not_transferable",
        canvasGrade: canvasGrade.grade,
        student: {
          id: canvasGrade.student.id,
          sortableName: canvasGrade.student.sortableName,
        },
        cause: {
          code: "not_participant",
          message:
            "The student does not exist in Ladok (any section in current room)",
        },
      };
    }

    if (!ladokGrade) {
      return {
        status: "not_transferable",
        canvasGrade: canvasGrade.grade,
        student: {
          id: canvasGrade.student.id,
          sortableName: canvasGrade.student.sortableName,
        },
        cause: {
          code: "not_participant_in_selected_section",
          message: "The student does not exist in Ladok (user selection)",
        },
      };
    }

    // The student exist in Ladok
    const student = {
      id: ladokGrade.student.id,
      sortableName: ladokGrade.student.sortableName,
      personalNumber: ladokGrade.student.personalNumber,
      anonymousCode: ladokGrade.anonymousCode,
    };

    // The teacher has no permission in Ladok
    if (!ladokGrade.hasPermission) {
      return {
        status: "not_transferable",
        canvasGrade: canvasGrade.grade,
        student,
        cause: {
          code: "no_permission_in_ladok",
          message: "You have no permission in Ladok",
        },
      };
    }

    // The student has no grade in Canvas
    if (!canvasGrade.grade) {
      return {
        status: "not_transferable",
        canvasGrade: null,
        student,
        cause: {
          code: "no_grade_in_canvas",
          message: "The student has no grade in Canvas",
        },
      };
    }

    if (ladokGrade.draft?.grade === canvasGrade.grade) {
      return {
        status: "not_transferable",
        canvasGrade: canvasGrade.grade,
        student,
        cause: {
          code: "grade_already_in_ladok",
          message: `Grade ${canvasGrade.grade} already in Ladok`,
        },
      };
    }

    // "F" grades
    if (canvasGrade.grade === "F" && ladokGrade.certified?.grade === "F") {
      console.log(
        "This student has certified grades in Ladok",
        student.sortableName
      );
      // return {
      //   status: "not_transferable",
      //   canvasGrade: canvasGrade.grade,
      //   student,
      //   cause: {
      //     code: "grade_f",
      //     message:
      //       "The student has a certified F in Ladok and cannot be given another F",
      //   },
      // };
    }

    // Invalid grade
    if (!ladokGrade.scale.includes(canvasGrade.grade)) {
      return {
        status: "not_transferable",
        canvasGrade: canvasGrade.grade,
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
      status: "ready",
      canvasGrade: canvasGrade.grade,
      student,
      input: {
        grade: canvasGrade.grade,
        examinationDate: examinationDate,
      },
    };
  });
}

/** Get the result of sending results to Ladok */
export function getTransferenceOutcome(
  inputs: GradeWithStatus[],
  output: PostLadokGradesOutput
): GradeWithStatus[] {
  return inputs.map((input) => {
    const ladokResponse = output.results.find((r) => r.id === input.student.id);

    if (!ladokResponse) {
      return input;
    }

    if (ladokResponse.error) {
      return {
        ...input,
        status: "error",
        cause: {
          code: ladokResponse.error.code,
          message: ladokResponse.error.message,
        },
      };
    }

    return {
      ...input,
      status: "success",
    };
  });
}
