import { ResponseComposition, rest, RestContext, RestRequest } from "msw";
import type {
  PostLadokGradesInput,
  PostLadokGradesOutput,
} from "t2l-backend/src/apiHandlers/utils/types";
const ids = [39861, 39862];
const datas = [require("./data.json"), require("./data2.json")];

async function mirrorAll(
  req: RestRequest<PostLadokGradesInput>,
  res: ResponseComposition,
  ctx: RestContext
) {
  const input = req.body.results;
  await sleep(4000);

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
}

function sleep(t: number) {
  return new Promise((resolve) => setTimeout(resolve, t));
}

export const handlers = datas.flatMap((data, i) => {
  const prefix = `/transfer-to-ladok/api/courses/mock-${ids[i]}`;
  return [
    rest.get(`${prefix}/sections`, async (req, res, ctx) => {
      await sleep(1000);
      return res(ctx.status(200), ctx.json(data.sections));
    }),

    rest.get(`${prefix}/columns`, async (req, res, ctx) => {
      await sleep(1000);
      return res(ctx.status(200), ctx.json(data.columns));
    }),

    rest.get(`${prefix}/assignments/:id`, async (req, res, ctx) => {
      await sleep(1000);
      return res(ctx.status(200), ctx.json(data.canvasGrades));
    }),

    rest.get(`${prefix}/total`, async (req, res, ctx) => {
      await sleep(1000);
      return res(ctx.status(200), ctx.json(data.canvasGrades));
    }),

    rest.get(`${prefix}/ladok-grades`, async (req, res, ctx) => {
      await sleep(1000);
      return res(ctx.status(200), ctx.json(data.ladokGrades));
    }),

    rest.post(`${prefix}/ladok-grades`, mirrorAll),
  ];
});
