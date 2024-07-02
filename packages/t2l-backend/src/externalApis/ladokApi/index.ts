/**
 * This module are functions to call Ladok API. They do not contain any logic.
 *
 * NOTE: Some functions are strange because how Ladok works.
 *
 * @see {@link https://www.integrationstest.ladok.se/restdoc/resultat.html}
 */
import got from "got";
import type {
  Aktivitetstillfalle,
  AutentiseradAnvandare,
  Behorighetsprofil,
  Betygsgrad,
  Kurstillfalle,
  ParticipantIds,
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
    Accept: [
      "application/vnd.ladok-resultat+json",
      "application/vnd.ladok-studiedeltagande+json",
    ].join(","),
  },
  responseType: "json",
  https: {
    pfx: Buffer.from(process.env.LADOK_API_PFX_BASE64 as string, "base64"),
    passphrase: process.env.LADOK_API_PFX_PASSPHRASE,
  },
});

// This got client is used to call the "Kataloginformation API".
// Note that it requires a specific `Accept` header
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

/**
 * Get information of "ourselves"
 */
export async function getAutentiserad() {
  return gotClientKatalog
    .get<AutentiseradAnvandare>(`kataloginformation/anvandare/autentiserad`)
    .then((response) => response.body);
}

/**
 * Get information of a single activity round (aktivitetstillfälle)
 * @see {@link https://www.integrationstest.ladok.se/restdoc/resultat.html#h%C3%A4mta}
 */
export async function getAktivitetstillfalle(aktivitetstillfalleUID: string) {
  return gotClient
    .get<Aktivitetstillfalle>(
      `resultat/aktivitetstillfalle/${aktivitetstillfalleUID}`
    )
    .then((response) => response.body);
}

/**
 * Get all the course rounds (kurstillfälle) that are associated with an activity round
 * (aktivitetstillfalle). Only course rounds with some registered students
 * are returned.
 * @see {@link https://www.integrationstest.ladok.se/restdoc/resultat.html#listaKurstillf%C3%A4llenF%C3%B6rEttAktivitetstillf%C3%A4lleD%C3%A4rDetFinnsStudenterKoppladeTillTillf%C3%A4llenaOchAktivitetstillf%C3%A4llet}
 */
export function getSkaFinnasStudenter(aktivitetstillfalleUID: string) {
  return gotClient
    .get<SkaFinnasStudenter>(
      `resultat/kurstillfalle/aktivitetstillfalle/skafinnasstudenter/${aktivitetstillfalleUID}`
    )
    .then((response) => response.body);
}

/**
 * Get participants in a single aktivitetstillfalle
 */
export async function getAktivitetstillfalleParticipants(
  aktivitetstillfalleUID: string
) {
  return gotClient
    .get<ParticipantIds>(
      `aktivitetstillfallesmojlighet/filtrera/studentidentiteter?aktivitetstillfalleUID=${aktivitetstillfalleUID}`
    )
    .then((response) => response.body);
}

/**
 * Get the structure of a course round (kurstillfälle)
 * @see {@link https://www.integrationstest.ladok.se/restdoc/resultat.html#h%C3%A4mtaIng%C3%A5endeMomentF%C3%B6rKurstillf%C3%A4lle}
 */
export async function getKurstillfalleStructure(kurstillfalleUID: string) {
  return gotClient
    .get<Kurstillfalle>(`resultat/kurstillfalle/${kurstillfalleUID}/moment`)
    .then((response) => response.body)
    .catch((e) => {
      const errorBody = e.response.body;
      if (
        errorBody.Detaljkod === "resultat.fel.detaljkod.utbildningstillfalle" &&
        errorBody.Felgrupp === "commons.fel.grupp.obligatoriskt_varde_saknas"
      ) {
        // This looks like the course round doesn't exist in Ladok. Ignore it.
        return null;
      } else {
        throw e;
      }
    });
}

export async function getKurstillfalleParticipants(kurstillfalleUID: string[]) {
  return gotClient
    .put<ParticipantIds>(
      `studiedeltagande/deltagare/kurstillfalle/studentidentiter`,
      {
        json: {
          utbildningstillfalleUID: kurstillfalleUID,
          deltagaretillstand: [
            "EJ_PABORJAD",
            "REGISTRERAD",
            "AVKLARAD",
            "AVBROTT",
            "ATERBUD",
          ],
        },
      }
    )
    .then((r) => r.body);
}

/**
 * Get all Studieresultat given some filters
 *
 * @see {@link https://www.integrationstest.ladok.se/restdoc/resultat.html#s%C3%B6kStudieresultatF%C3%B6rRapporteringMedRequestbody} for documentation
 * when type is "utbildningsinstans" and
 * @see {@link https://www.integrationstest.ladok.se/restdoc/resultat.html#s%C3%B6kStudieresultatAttRapporteraP%C3%A5Aktivitetstillf%C3%A4lleMedRequestbody} for documentation
 * when type is "aktivitetstillfalle"
 */
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
        OrderBy: ["PERSONNUMMER_ASC", "ANONYMKOD_ASC"],
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

/**
 * Returns a list of permissions that a user has
 * @see {@link https://www.integrationstest.ladok.se/restdoc/resultat.html#harR%C3%A4ttighetAttRapporteraResultatF%C3%B6r}
 */
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

/**
 * Creates one result in Ladok as draft (utkast)
 * @see {@link https://www.integrationstest.ladok.se/restdoc/resultat.html#skapaResultat}
 */
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

/**
 * Updates a result in Ladok
 * @see {@link https://www.integrationstest.ladok.se/restdoc/resultat.html#uppdateraResultat}
 */
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

/** Get the grades given a scale */
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
