/**
 * This module contains functions to call Canvas API.
 * Functions do not contain any logic
 */
import CanvasAPI, {
  CanvasApiError,
  minimalErrorHandler,
} from "@kth/canvas-api";
import { Request } from "express";
import { UnauthorizedError } from "../error";

export interface CanvasCourse {
  grading_standard_id: number | null;
}

export interface CanvasSection {
  sis_section_id: string;
  integration_id: string;
  name: string;
}

export interface Assignment {
  id: number;
  name: string;
  grading_type: "gpa_scale" | "points" | "letter_grade";
  grading_standard_id: number | null;
  due_at: string | null;
  unlock_at: string | null;
  lock_at: string | null;
}

export interface Submission {
  id: number;
  grade: string | null;
  score: number | null;
  graded_at: string | null;
  submitted_at: string | null;
  user: {
    integration_id: string;
    sortable_name: string;
  };
}

export interface Enrollment {
  /**
   * An object containing canvas "final grades" for a student
   *
   * NOTE: There are four different values inside `grades` object but we have
   * decided at this moment that `unposted_current_grade` is the correct value.
   * The other returned values are omitted in this type definition on purpose.
   */
  grades: {
    unposted_current_grade: string;
  };
  user: {
    integration_id: string;
    sortable_name: string;
  };
}

function getToken(token: string = "") {
  if (token.startsWith("Bearer ")) {
    return token.substring(7);
  }

  throw new UnauthorizedError(
    "Unauthorized. You must access this endpoint either with a session or an authorization header"
  );
}

export default class CanvasClient {
  client: CanvasAPI;

  constructor(req: Request<unknown>) {
    const token =
      req.session.accessToken || getToken(req.headers.authorization);

    this.client = new CanvasAPI(process.env.CANVAS_API_URL!, token);
    this.client.errorHandler = minimalErrorHandler;
  }

  getCourse(courseId: string) {
    return this.client
      .get<CanvasCourse>(`courses/${courseId}`)
      .then((r) => r.body);
  }

  getSections(courseId: string) {
    return this.client
      .listItems<CanvasSection>(`courses/${courseId}/sections`)
      .toArray();
  }

  getAssignments(courseId: string) {
    return this.client
      .listItems<Assignment>(`courses/${courseId}/assignments`)
      .toArray();
  }

  getSubmissions(courseId: string, assignmentId: string) {
    return this.client
      .listItems<Submission>(
        `courses/${courseId}/assignments/${assignmentId}/submissions`,
        {
          per_page: 100,
          include: ["user"],
        }
      )
      .toArray();
  }

  getEnrollments(courseId: string) {
    return this.client
      .listItems<Enrollment>(`courses/${courseId}/enrollments`, {
        include: ["user"],
      })
      .toArray();
  }

  getSelf() {
    return this.client
      .get<{ login_id: string }>("users/self")
      .then((r) => r.body);
  }
}
