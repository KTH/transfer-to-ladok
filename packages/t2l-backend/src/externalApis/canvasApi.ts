/**
 * This module contains functions to call Canvas API.
 * Functions do not contain any logic
 */
import CanvasAPI, { minimalErrorHandler } from "@kth/canvas-api";
import { Request } from "express";

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

  throw new Error("Invalid token");
}

export default class CanvasClient {
  client: CanvasAPI;

  constructor(req: Request<unknown>) {
    const token =
      req.session.accessToken || getToken(req.headers.authorization);

    this.client = new CanvasAPI(process.env.CANVAS_API_URL!, token);
    this.client.errorHandler = minimalErrorHandler;
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

  getFinalGrades(courseId: string) {
    return this.client
      .listItems<Enrollment>(`courses/${courseId}/enrollments`, {
        include: ["user"],
      })
      .toArray();
  }
}
