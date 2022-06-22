import { rest } from "msw";
import {
  Columns,
  GradeableStudents,
  Sections,
} from "t2l-backend/src/apiHandlers/utils/types";

export const handlers = [
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

  rest.get(
    "/transfer-to-ladok/api/courses/mock-1/sections",
    (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json<Sections>({
          aktivitetstillfalle: [
            {
              id: "0000-000-000",
              date: "2022-01-01",
              name: "AKT 01",
            },
          ],
          kurstillfalle: [],
        })
      );
    }
  ),

  rest.get("/transfer-to-ladok/api/courses/mock-1/columns", (req, res, ctx) =>
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

  rest.get(
    "/transfer-to-ladok/api/courses/mock-1/ladok-grades",
    (req, res, ctx) => res(ctx.status(200), ctx.json<GradeableStudents>([]))
  ),
];
