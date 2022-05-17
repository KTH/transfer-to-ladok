/** Collection of types of all endpoints: query/body parameters and responses */

/**
 * Response of endpoint `GET /api/courses/:courseId/sections`
 *
 * Object with two lists `aktivitetstillfälle` and `kurstillfälle` that contains
 * the sections in a course separated by type.
 */
export interface Sections {
  /** Sections that are linked with a aktivitetstillfälle in Ladok */
  aktivitetstillfalle: AktSection[];

  /** Sections that are linked with a kurstillfälle in Ladok */
  kurstillfalle: KurSection[];
}

/** A Canvas Section linked with a Ladok aktivitetstillfälle */
export interface AktSection {
  /** Ladok identifier for the Aktivitetstillfälle */
  id: string;

  /** Human readable name of the aktivitetstillfälle. Example: `HF0025 TEN1 & ML0025 TEN1 - 2022-01-01` */
  name: string;
}

/** A Canvas Section linked with a Ladok kurstillfalle  */
export type KurSection = {
  /** Ladok identifier for the Kurstillfälle */
  id: string;

  /** Use this parameter to send final grades to this kurstillfälle */
  utbildningsinstans: string;

  /** Example: "50071" */
  code: string;

  /** Modules in the kurstillfälle */
  modules: {
    /** Use this identifier to send grades to this specific module */
    utbildningsinstans: string;

    /** Human readable short name of the module. Example: "TEN1" */
    code: string;

    /** Human readable name of the module. Example: "Examination" */
    name: string;
  }[];
};

/**
 * Response of endpoint
 * GET /api/courses/:courseId/assignments
 */
export type Assignments = {
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
}[];

/**
 * Response of endpoints
 * GET /api/courses/:courseId/assignments/:assignmentId/grades
 * GET /api/courses/:courseId/grades
 */
export type CanvasGrades = {
  /** Ladok student identifier */
  id: string;

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

/** Represents one result to be sent to Ladok */
export interface GradeResult {
  /** Ladok Student UID */
  id: string;

  /** Grade to be sent as "utkast" */
  draft: {
    /** Letter grade */
    grade: string;

    /** Examination date */
    examinationDate: string;
  };
}

/**
 * Query request of endpoint
 * GET /api/courses/:courseId/ladok-grades
 */
export type GetLadokGradesInput = GradesDestination;

/**
 * Response of endpoint
 * GET /api/courses/:courseId/ladok-grades
 */
export type GradeableStudents = {
  /** Student ID */
  id: string;

  /** List of grades you can set */
  scale: string[];

  /** Grade in "utkast" if any */
  draft?: {
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
  results: GradeResult[];
}

export interface ResultOutput {
  id: string;
  status: "success" | "error";
  draft: {
    grade: string;
    examinationDate: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface PostLadokGradesOutput {
  summary: {
    success: number;
    error: number;
  };
  results: ResultOutput[];
}
