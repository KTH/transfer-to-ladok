/**
 * This is an example of how to write mocks using msw
 */
import { rest } from "msw";
import { setupServer } from "msw/node";
import { CanvasSection } from "../externalApis/canvasApi";
import {
  Kurstillfalle,
  RapporteringsMojlighetOutput,
  SokResultat,
} from "../externalApis/ladokApi";

const STUDENTS = [
  "Abrahamsson, Elsa",
  "Ali, Håkan",
  "Ali, Louise",
  "Berggren, Christoffer",
  "Berggren, Pontus",
  "Bergström, Nils",
  "Björklund, Martin",
  "Björklund, Monica",
  "Claesson, Nils",
  "Claesson, Roger",
  "Ek, Mona",
  "Eliasson, Bo",
  "Engström, Elias",
  "Eriksson, Ali",
  "Eriksson, Tommy",
  "Falk, Edvin",
  "Falk, Hugo",
  "Gunnarsson, Johan",
  "Gunnarsson, Susanne",
  "Hansson, Jenny",
  "Hedlund, Linn",
];
const STUDENTS_UID = STUDENTS.map(
  (_, i) => `e9c325fd-5a13-4b84-99e3-${i.toString(16).padStart(12, "a")}`
);
const STUDIERESULTAT_UID = STUDENTS.map(
  (_, i) => `7cbdf5b3-f129-42ba-9221-${i.toString(16).padStart(12, "a")}`
);
const UTBILDNINGSINSTANS_UID = "60c0fce8-22dc-48fa-aa78-87be393d2acf";

export const handlers = [
  rest.get(
    "https://kth.test.instructure.com/api/v1/courses/mock-1/sections",
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
          UtbildningsinstansUID: UTBILDNINGSINSTANS_UID,
          Utbildningskod: "AA0000",
          Versionsnummer: 1,
        })
      )
  ),

  rest.get(
    "https://kth.test.instructure.com/api/v1/users/self",
    (req, res, ctx) => res(ctx.status(200), ctx.json({ id: -1 }))
  ),

  rest.get(
    "https://kth.test.instructure.com/api/v1/users/-1",
    (req, res, ctx) =>
      res(
        ctx.status(200),
        ctx.json({
          login_id: "rick-astley@kth.se",
        })
      )
  ),

  rest.put(
    "https://api.integrationstest.ladok.se/resultat/studieresultat/rapportera/utbildningsinstans/60c0fce8-22dc-48fa-aa78-87be393d2acf/sok",
    (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json<SokResultat>({
          Resultat: STUDENTS.map((s, i) => ({
            Student: {
              Efternamn: s.split(",")[0],
              Fornamn: s.split(",")[1].slice(1),
              Uid: STUDENTS_UID[i],
            },
            Uid: STUDIERESULTAT_UID[i],
            Rapporteringskontext: {
              UtbildningsinstansUID: UTBILDNINGSINSTANS_UID,
              BetygsskalaID: 131657,
              KravPaProjekttitel: false,
            },
          })),
          TotaltAntalPoster: STUDENTS.length,
        })
      );
    }
  ),

  rest.put(
    "https://api.integrationstest.ladok.se/resultat/resultatrattighet/kontrollerarapporteringsmojlighet",
    (req, res, ctx) =>
      res(
        ctx.status(200),
        ctx.json<RapporteringsMojlighetOutput>({
          KontrolleraRapporteringsrattighetlista: STUDIERESULTAT_UID.map(
            (uid) => ({
              HarRattighet: true,
              StudieresultatUID: uid,
              UtbildningsinstansAttRapporteraPaUID: UTBILDNINGSINSTANS_UID,
            })
          ),
        })
      )
  ),
];

export const mockedServices = setupServer(...handlers);
