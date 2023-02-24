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

const prefix = "/transfer-to-ladok/api/courses/mock-2";

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

const handlers = [
  rest.get(`${prefix}/sections`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json<Sections>({
        aktivitetstillfalle: [],
        kurstillfalle: [
          {
            id: "xxxx",
            courseCode: "AA0001",
            utbildningsinstans: "xx",
            roundCode: "12345",
            modules: [
              {
                code: "TEN1",
                name: "Tentamen",
                utbildningsinstans: "xy",
              },
            ],
          },
        ],
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
    res(ctx.status(200), ctx.json<GradeableStudents>([]))
  ),

  rest.get(`${prefix}/total`, (req, res, ctx) =>
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
          status: "error",
          error: {
            code: "input_errror",
            message: `Student [${r.id}] is not present in the list of gradeable students`,
          },
        })),
        summary: {
          error: input.length,
          success: 0,
        },
      })
    );
  }),
];

export default handlers;
