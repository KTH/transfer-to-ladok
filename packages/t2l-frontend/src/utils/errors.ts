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
