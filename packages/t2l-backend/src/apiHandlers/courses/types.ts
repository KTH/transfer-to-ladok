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

    /** Human readable name of the aktivitetstillfälle */
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
