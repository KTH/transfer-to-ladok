/**
 * This module are functions to call Ladok API. They do not contain any logic.
 *
 * NOTE: Some functions are strange because how Ladok works.
 */
import got from "got";
import type {
  Aktivitetstillfalle,
  Behorighetsprofil,
  Betygsgrad,
  Kurstillfalle,
  RapporteringsMojlighetInput,
  RapporteringsMojlighetOutput,
  Resultat,
  SkaFinnasStudenter,
  SokResultat,
} from "./types";
export * from "./types";

const gotClient = got.extend({
  prefixUrl: process.env.LADOK_API_BASEURL,
  headers: {
    Accept: "application/vnd.ladok-resultat+json",
  },
  responseType: "json",
  https: {
    pfx: Buffer.from(process.env.LADOK_API_PFX_BASE64 as string, "base64"),
    passphrase: process.env.LADOK_API_PFX_PASSPHRASE,
  },
});

const gotClientKatalog = got.extend({
  prefixUrl: process.env.LADOK_API_BASEURL,
  headers: {
    Accept: "application/vnd.ladok-kataloginformation+json",
  },
  responseType: "json",
  https: {
    pfx: Buffer.from(process.env.LADOK_API_PFX_BASE64 as string, "base64"),
    passphrase: process.env.LADOK_API_PFX_PASSPHRASE,
  },
});

export async function getAktivitetstillfalle(aktivitetstillfalleUID: string) {
  return gotClient
    .get<Aktivitetstillfalle>(
      `resultat/aktivitetstillfalle/${aktivitetstillfalleUID}`
    )
    .then((response) => response.body);
}

export function getSkaFinnasStudenter(aktivitetstillfalleUID: string) {
  return gotClient
    .get<SkaFinnasStudenter>(
      `resultat/kurstillfalle/aktivitetstillfalle/skafinnasstudenter/${aktivitetstillfalleUID}`
    )
    .then((response) => response.body);
}

export function getKurstillfalleStructure(kurstillfalleUID: string) {
  return gotClient
    .get<Kurstillfalle>(`resultat/kurstillfalle/${kurstillfalleUID}/moment`)
    .then((response) => response.body);
}

export function searchStudieresultat(
  type: "utbildningsinstans" | "aktivitetstillfalle",
  UID: string,
  KurstillfallenUID: string[],
  page = 1
) {
  return gotClient
    .put<SokResultat>(`resultat/studieresultat/rapportera/${type}/${UID}/sok`, {
      json: {
        Filtrering: ["OBEHANDLADE", "UTKAST", "KLARMARKERADE"],
        KurstillfallenUID,
        // NOTE: OrderBy MUST be included always.
        // Otherwise the pagination will be broken because Ladok does not sort
        // things consistently by default
        OrderBy: ["PERSONNUMMER_ASC"],
        Page: page,
      },
    })
    .then((r) => r.body);
}

/** Get people with the behorighetsprofil "Resultatrapportor - Lärare" */
export function getBehorighetsprofil(): Promise<Behorighetsprofil> {
  const behorighetsprofilUID = "0997fd42-7488-11e8-920e-2de0ccaf48ac";

  return gotClientKatalog
    .get<Behorighetsprofil>(
      `kataloginformation/behorighetsprofil/${behorighetsprofilUID}/koppladeanvandare`
    )
    .then((r) => r.body);
}

export function searchRapporteringsMojlighet(
  Anvandarnamn: string,
  KontrolleraRapporteringsrattighetlista: RapporteringsMojlighetInput[]
): Promise<RapporteringsMojlighetOutput> {
  if (KontrolleraRapporteringsrattighetlista.length === 0) {
    return Promise.resolve({
      KontrolleraRapporteringsrattighetlista: [],
    });
  }

  return gotClient
    .put<RapporteringsMojlighetOutput>(
      `resultat/resultatrattighet/kontrollerarapporteringsmojlighet`,
      {
        json: {
          Anvandarnamn,
          KontrolleraRapporteringsrattighetlista,
        },
      }
    )
    .then((response) => response.body);
}

export function createResult(
  studieresultatUID: string,
  utbildningsinstansUID: string,
  resultat: Resultat
) {
  return gotClient
    .post<unknown>(
      `resultat/studieresultat/${studieresultatUID}/utbildning/${utbildningsinstansUID}/resultat`,
      {
        json: resultat,
      }
    )
    .then((response) => response.body);
}

export function updateResult(
  resultatUID: string,
  newValue: Resultat,
  SenasteResultatandring: string
) {
  return gotClient.put<unknown>(
    `resultat/studieresultat/resultat/${resultatUID}/`,
    {
      json: {
        ...newValue,
        SenasteResultatandring,
      },
    }
  );
}

export function getBetyg(betygsskalaID: number): Betygsgrad[] {
  // Define constants as global vars?
  if (betygsskalaID === 131656) {
    return [
      { ID: 131658, Kod: "P" },
      { ID: 131663, Kod: "F" },
    ];
  }

  if (betygsskalaID === 131657) {
    return [
      { ID: 131661, Kod: "A" },
      { ID: 131667, Kod: "B" },
      { ID: 131673, Kod: "C" },
      { ID: 131679, Kod: "D" },
      { ID: 131691, Kod: "E" },
      { ID: 131696, Kod: "FX" },
      { ID: 131697, Kod: "F" },
    ];
  }

  return [];
}
