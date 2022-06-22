/**
 * This error is thrown when the user access to a course that cannot be used
 * in Transfer to Ladok
 */
export class InvalidCourseError extends Error {
  details: string;

  constructor() {
    super();
    this.name = "InvalidCourse";
    this.message = "Invalid course";
    this.details =
      "You can only use KTH Transfer to Ladok in official course rooms or examination rooms. You cannot use it in intern nor sandbox courses.";
  }
}

export class ApiError extends Error {
  code: string;
  endpoint: string;

  constructor(endpoint: string, response: Response, body?: any) {
    // If we are lucky and the "body" is legible means that we have written
    // the error
    if (body?.message && body?.code) {
      super(body.message);
      this.code = body.code;
    } else {
      // Otherwise, we do our best to parse the response
      super(response.statusText);
      this.code = response.status.toString(10);
    }

    this.endpoint = endpoint;
  }
}
