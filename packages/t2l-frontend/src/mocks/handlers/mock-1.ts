import { rest } from "msw";
import { faker } from "@faker-js/faker";
import {
  CanvasGrades,
  Columns,
  GradeableStudents,
  PostLadokGradesInput,
  PostLadokGradesOutput,
  Sections,
} from "t2l-backend/src/apiHandlers/utils/types";

const letters = ["A", "B", "C", "D", "E", "F", "FX"];

const students = Array.from({ length: 10 }).map(() => ({
  id: faker.datatype.uuid(),
  sortableName: `${faker.name.lastName()}, ${faker.name.firstName()}`,
}));

const canvasGrades: CanvasGrades = students.map((s) => ({
  student: s,
  grade: faker.helpers.arrayElement(letters),
  gradedAt: null,
  submittedAt: null,
}));

const ladokGrades: GradeableStudents = students.map((s) => ({
  student: s,
  scale: letters,
  hasPermission: true,
  requiresTitle: false,
}));

const prefix = "/transfer-to-ladok/api/courses/mock-1";

const handlers = [
  rest.get(
    "/transfer-to-ladok/api/courses/mock-0/sections",
    (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json<Sections>({
          aktivitetstillfalle: [],
          kurstillfalle: [],
        })
      );
    }
  ),

  rest.get(`${prefix}/sections`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json<Sections>({
        aktivitetstillfalle: [
          {
            id: "09e14f93-5f2d-11eb-a0ce-c629d09c4bde",
            date: "2022-01-01",
            name: "AA0001 TENX 2022-01-01",
          },
        ],
        kurstillfalle: [],
      })
    );
  }),

  rest.get(`${prefix}/columns`, (req, res, ctx) =>
    res(
      ctx.status(200),
      ctx.json<Columns>({
        assignments: [],
        finalGrades: {
          hasLetterGrade: true,
        },
      })
    )
  ),

  rest.get(`${prefix}/ladok-grades`, (req, res, ctx) =>
    res(ctx.status(200), ctx.json<GradeableStudents>(ladokGrades))
  ),

  rest.get("/transfer-to-ladok/api/courses/mock-1/total", (req, res, ctx) =>
    res(ctx.status(200), ctx.json<CanvasGrades>(canvasGrades))
  ),

  rest.post<PostLadokGradesInput>(`${prefix}/ladok-grades`, (req, res, ctx) => {
    const input = req.body.results;

    return res(
      ctx.status(200),
      ctx.json<PostLadokGradesOutput>({
        results: input.map((r) => ({
          id: r.id,
          draft: r.draft,
          status: "success",
        })),
        summary: {
          error: 0,
          success: input.length,
        },
      })
    );
  }),
];

export default handlers;
