/** Collection of types of all endpoints: query/body parameters and responses */

/**
 * Response of endpoint
 * GET /api/courses/:courseId/sections
 */
export interface Sections {
  /** Sections that are linked with a aktivitetstillfälle in Ladok */
  aktivitetstillfalle: {
    /** Ladok identifier */
    id: string;

    /** Human readable name of the aktivitetstillfälle. Example: `HF0025 TEN1 & ML0025 TEN1 - 2022-01-01` */
    name: string;
  }[];

  /** Sections that are linked with a kurstillfälle in Ladok */
  kurstillfalle: {
    /** Ladok identifier */
    id: string;

    /** Use this parameter to send final grades to this kurstillfälle */
    utbildningsinstansUID: string;

    /** Example: "50071" */
    code: string;

    /** Modules in the kurstillfälle */
    modules: {
      /** Use this identifier to send grades to this specific module */
      utbildningsinstansUID: string;

      /** Human readable short name of the module. Example: "TEN1" */
      code: string;

      /** Human readable name of the module. Example: "Examination" */
      name: string;
    }[];
  }[];
}

// The following types are exported for convinience
export type AktSection = Sections["aktivitetstillfalle"][number];
export type KurSection = Sections["kurstillfalle"][number];

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

  /** Date when the student get the grade */
  gradedAt: string | null;

  /** Date when the student has sent a submission */
  submittedAt: string | null;
}[];
