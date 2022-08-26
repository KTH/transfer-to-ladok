import { rest } from "msw";
import {
  CanvasGrades,
  Columns,
  GradeableStudents,
  Sections,
} from "t2l-backend/src/apiHandlers/utils/types";

function sleep(t: number) {
  return new Promise((resolve) => setTimeout(resolve, t));
}

const prefix = "/transfer-to-ladok/api/courses/mock-sf1624";

const handlers = [
  rest.get(`${prefix}/sections`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json<Sections>({
        aktivitetstillfalle: [],
        kurstillfalle: [
          {
            courseCode: "SF1624",
            roundCode: "example1",
            id: "0000-0000",
            utbildningsinstans: "0000-0000",
            modules: [
              {
                code: "TEN1",
                name: "Tentamen",
                utbildningsinstans: "0000-0001",
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

  rest.get(`${prefix}/ladok-grades`, async (req, res, ctx) => {
    await sleep(4000);
    return res(ctx.status(200), ctx.json<GradeableStudents>([]));
  }),

  rest.get(`${prefix}/total`, async (req, res, ctx) => {
    await sleep(60 * 1000);
    return res(ctx.status(200), ctx.json<CanvasGrades>([]));
  }),
];

export default handlers;
