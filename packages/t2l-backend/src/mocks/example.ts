/**
 * This is an example of how to write mocks using msw
 */
import { rest } from "msw";
import { setupServer } from "msw/node";
import { CanvasSection } from "../externalApis/canvasApi";
import { Kurstillfalle, SokResultat } from "../externalApis/ladokApi";

export const handlers = [
  rest.get(
    "https://kth.test.instructure.com/api/v1/courses/1/sections",
    (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json<CanvasSection[]>([
          {
            name: "AA0000 XXXXX",
            sis_section_id: "9da73275-05c4-42d4-a9b7-8f0647db253f",
            integration_id: null,
          },
        ])
      );
    }
  ),

  rest.get(
    "https://api.integrationstest.ladok.se/resultat/kurstillfalle/9da73275-05c4-42d4-a9b7-8f0647db253f/moment",
    (req, res, ctx) =>
      res(
        ctx.status(200),
        ctx.json<Kurstillfalle>({
          Benamning: {
            en: "Example",
            sv: "Exempel",
          },
          Betygsskala: 131656,
          IngaendeMoment: [],
          KravPaProjekttitel: false,
          Kurstillfalleskod: "1234",
          ResultatrapporteringMojlig: true,
          UtbildningsinstansUID: "60c0fce8-22dc-48fa-aa78-87be393d2acf",
          Utbildningskod: "AA0000",
          Versionsnummer: 1,
        })
      )
  ),

  rest.get(
    "https://kth.test.instructure.com/api/v1/users/self",
    (req, res, ctx) => res(ctx.status(200), ctx.json({ id: 2323 }))
  ),

  rest.get(
    "https://kth.test.instructure.com/api/v1/users/2323",
    (req, res, ctx) =>
      res(
        ctx.status(200),
        ctx.json({
          login_id: "myuser@kth.se",
        })
      )
  ),

  rest.put(
    "https://api.integrationstest.ladok.se/resultat/studieresultat/rapportera/utbildningsinstans/60c0fce8-22dc-48fa-aa78-87be393d2acf/sok",
    (req, res, ctx) =>
      res(
        ctx.status(200),
        ctx.json<SokResultat>({
          Resultat: [],
          TotaltAntalPoster: 0,
        })
      )
  ),
];

export const mockedServices = setupServer(...handlers);
