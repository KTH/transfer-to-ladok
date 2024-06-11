// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../env.d.ts" />
/**
 * This module contains functions to call Canvas API.
 * Functions do not contain any logic
 */
import assert from "assert";
import CanvasAPI, { minimalErrorHandler } from "@kth/canvas-api";
import { Request } from "express";
import { UnauthorizedError } from "../apiHandlers/error";

export interface CanvasCourse {
  grading_standard_id: number | null;
}

export interface CanvasSection {
  sis_section_id: string | null;
  integration_id: string | null;
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
  published: boolean;
  anonymize_students: boolean;
  /**
   * Indicates if there is at least one submission submitted by anyone.
   * If true, users can choose the "submission date" in this assignment as the
   * examination date
   */
  has_submitted_submissions: boolean;
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
    unposted_current_grade: string | null;
  };
  user: {
    integration_id: string;
    sortable_name: string;
  };
}

export default class CanvasClient {
  client: CanvasAPI;

  constructor(req: Request<unknown>) {
    const canvasApiUrl = process.env.CANVAS_API_URL;
    assert(
      typeof canvasApiUrl === "string",
      "Missing environmental variable [CANVAS_API_URL]"
    );
    const token = req.session.accessToken;

    if (!token) {
      throw new UnauthorizedError("Unauthorized. You need to be logged in");
    }

    this.client = new CanvasAPI(canvasApiUrl, token);
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
      .get<{ id: number; login_id?: string }>("users/self")
      .then((r) => r.body);
  }
}
