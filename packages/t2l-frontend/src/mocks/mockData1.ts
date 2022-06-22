import { faker } from "@faker-js/faker";
import {
  CanvasGrades,
  GradeableStudents,
} from "t2l-backend/src/apiHandlers/utils/types";

const letters = ["A", "B", "C", "D", "E", "F", "FX"];

const students = Array.from({ length: 10 }).map(() => ({
  id: faker.datatype.uuid(),
  sortableName: `${faker.name.lastName()}, ${faker.name.firstName()}`,
}));

export const canvasGrades: CanvasGrades = students.map((s) => ({
  student: s,
  grade: faker.helpers.arrayElement(letters),
  gradedAt: null,
  submittedAt: null,
}));

export const ladokGrades: GradeableStudents = students.map((s) => ({
  student: s,
  scale: letters,
  hasPermission: true,
  requiresTitle: false,
}));
