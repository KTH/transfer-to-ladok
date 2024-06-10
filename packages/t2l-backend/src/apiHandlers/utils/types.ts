/** Collection of types of all endpoints: query/body parameters and responses */

/**
 * Response of endpoint `GET /api/courses/:courseId/sections`
 *
 * Object with two lists `aktivitetstillfälle` and `kurstillfälle` that contains
 * the sections in a course separated by type.
 */
export interface Sections {
  /** Sections that are linked with a aktivitetstillfälle in Ladok */
  aktivitetstillfalle: AktivitetstillfalleSection[];

  /** Sections that are linked with a kurstillfälle in Ladok */
  kurstillfalle: KurstillfalleSection[];
}

/** A Canvas Section linked with a Ladok aktivitetstillfälle */
export interface AktivitetstillfalleSection {
  /** Ladok identifier for the Aktivitetstillfälle */
  id: string;

  /** Human readable name of the aktivitetstillfälle. Example: `HF0025 TEN1 & ML0025 TEN1 - 2022-01-01` */
  name: string;

  /** Date when the aktivitetstillfälle is held. Example: 2022-01-01 */
  date: string;

  /** Go to this URL to report grades in this Aktivitetstillfälle  */
  url: string;

}

/** A Canvas Section linked with a Ladok kurstillfalle  */
export type KurstillfalleSection = {
  /** Ladok identifier for the Kurstillfälle */
  id: string;

  /** Use this parameter to send final grades to this kurstillfälle */
  utbildningsinstans: string;

  /** Course code: "SF1624" */
  courseCode: string;

  /** Code for kurstillfälle: "50071" */
  roundCode: string;

  /** Go to this URL to report final grades of this kurstillfälle */
  url: string;

  /** Modules in the kurstillfälle */
  modules: {
    /** Use this identifier to send grades to this specific module */
    utbildningsinstans: string;

    /** Human readable short name of the module. Example: "TEN1" */
    code: string;

    /** Human readable name of the module. Example: "Examination" */
    name: string;

    /** Go to this URL to report grades for this module */
    url: string;
  }[];
};

/**
 * Response of endpoint
 * GET /api/courses/:courseId/columns
 */
export type Columns = {
  assignments: Assignment[];
  finalGrades: {
    hasLetterGrade: boolean;
  };
};

export interface Assignment {
  /** Unique identifier in Canvas */
  id: string;

  /** Assignment name in Canvas */
  name: string;

  /** Grading type in Canvas */
  gradingType: "gpa_scale" | "points" | "letter_grade";

  /** Assignment due date in ISO format */
  dueAt: string | null;

  /** Assignment "unlock" date in ISO format */
  unlockAt: string | null;

  /** Assignment "lock" date in ISO format */
  lockAt: string | null;

  hasSubmissions: boolean;

  published: boolean;

  postedGrades: boolean;
}

/**
 * Response of endpoints
 * GET /api/courses/:courseId/assignments/:assignmentId/grades
 * GET /api/courses/:courseId/grades
 */
export type CanvasGrades = {
  student: {
    /** Ladok student identifier */
    id: string;

    /** Sortable name according to Canvas */
    sortableName: string;
  };

  /** Letter grade in Canvas. Available only if the assignment contains some letter grade */
  grade: string | null;

  /** Date when the teacher has written the grade. Note: this field will be always null for course grades */
  gradedAt: string | null;

  /** Date when the student has sent a submission. Note: this field will be always null for course grades */
  submittedAt: string | null;
}[];

/**
 * Specifies where will the user send grades to. It can be either:
 * - Kursinstans + Kurstillfälle
 * - Aktivitetstillfälle
 */
export type GradesDestination =
  | {
      utbildningsinstans: string;
      kurstillfalle: string;
    }
  | {
      aktivitetstillfalle: string;
    };

/** Represents one result that the user wants to send to Ladok */
export interface ResultInput {
  /** Ladok Student UID */
  id: string;

  /** Grade to be sent as "utkast" */
  draft: {
    /** Letter grade */
    grade: string;

    /** Examination date */
    examinationDate: string;

    projectTitle?: {
      title: string;
      alternativeTitle: string;
    };
  };
}

/** Represents the outcome of the operation of sending one result to Ladok */
export interface ResultOutput {
  /** Ladok student ID */
  id: string;

  /** "success" if the Ladok Result was successfully sent to Ladok */
  status: "success" | "error";

  /** Grade that the user wanted to send to Ladok */
  draft: {
    grade: string;
    examinationDate: string;
  };

  /** Object containing details of a failed operation */
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Response of endpoint
 * GET /api/courses/:courseId/ladok-grades
 */
export type GradeableStudents = {
  /** Student data */
  student: {
    /** Ladok ID */
    id: string;

    /**
     * Last name and first name. This is returned in this format for
     * consistency with `CanvasGrades`
     */
    sortableName: string;

    /** Student personal number. Only returned if the teacher has permissions to send grades to this student */
    personalNumber?: string;
  };

  anonymousCode?: string;
  /** List of grades you can set */
  scale: string[];

  /** True if the teacher has permissions to send grades to this student */
  hasPermission: boolean;

  requiresTitle: boolean;

  /** Grade in "utkast" if any */
  draft?: {
    grade: string;
    examinationDate: string;
    projectTitle?: {
      title: string;
      alternativeTitle: string;
    };
  };

  /** Grade in "klarmarkerade" if any */
  markedAsReady?: {
    grade: string;
    examinationDate: string;
  };

  /** Latest grade as "attesterade" if any  */
  certified?: {
    grade: string;
    examinationDate: string;
  };
}[];

/**
 * Body request of endpoint
 * POST /api/courses/:courseId/ladok-grades
 */
export interface PostLadokGradesInput {
  destination: GradesDestination;
  results: ResultInput[];
}

export interface PostLadokGradesOutput {
  summary: {
    success: number;
    error: number;
  };
  results: ResultOutput[];
}

/**
 * Information meant to be stored about one transfer operation made by a user.
 * It contains information about the parameters given by the user and the
 * outcome of that operation
 *
 * (Note: it is named "Transference" instead of "Transfer" to avoid confusions
 * with the verb)
 */
export interface Transference {
  parameters: {
    courseId: string;
    destination: GradesDestination;
  };
  user: {
    canvasId: number;
    email: string;
  };
  results: ResultOutput[];
  summary: {
    success: number;
    error: number;
  };
  _id: string;
  createdAt: Date;
}

/** Error response of any endpoint */
export interface ApiError<Codes = string> {
  code: Codes;
  message: string;
}
