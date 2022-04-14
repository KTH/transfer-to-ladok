/**
 * This module contains functions to call Canvas API.
 * Functions do not contain any logic
 */
import Canvas from "@kth/canvas-api";

const canvas = new Canvas(
  process.env.CANVAS_API_URL!,
  process.env.CANVAS_API_TOKEN!
);

export interface Section {
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
}

export interface Enrollment {
  grades: {
    unposted_current_grade: string;
  };
  user: {
    integration_id: string;
  };
}

export function getCanvasSections(courseId: string) {
  return canvas.listItems<Section>(`courses/${courseId}/sections`).toArray();
}

export function getAssignments(courseId: string) {
  return canvas.listItems<Assignment>(`courses/${courseId}/assignments`);
}

export function getSubmissions(courseId: string, assignmentId: string) {
  return canvas.listItems<Submission>(
    `courses/${courseId}/assignments/${assignmentId}/submissions`
  );
}

export function getFinalGrades(courseId: string) {
  return canvas.listItems<Enrollment>(`courses/${courseId}/enrollments`);
}
