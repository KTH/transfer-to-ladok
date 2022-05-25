/**
 * This module are functions to call Ladok API. They do not contain any logic.
 *
 * NOTE: Some functions are strange because how Ladok works.
 */
import got from "got";

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

export interface Aktivitetstillfalle {
  Aktiviteter: {
    Kursinstans: {
      Utbildningskod: string;
    };
    Utbildningsinstans: {
      Utbildningskod: string;
    };
  }[];
  Datumperiod: {
    Startdatum: string;
  };
}

export interface Resultat {
  Betygsgrad: number;
  BetygsskalaID: number;
  Examinationsdatum: string;
}

export interface Kurstillfalle {
  Benamning: {
    sv: string;
    en: string;
  };
  Betygsskala: number;
  KravPaProjekttitel: boolean;
  Kurstillfalleskod: string;
  ResultatrapporteringMojlig: boolean;
  UtbildningsinstansUID: string;
  Utbildningskod: string;
  Versionsnummer: number;

  IngaendeMoment: Array<{
    Benamning: {
      sv: string;
      en: string;
    };
    BetygsskalaID: number;
    KravPaProjekttitel: boolean;
    Omfattning: number;
    ResultatrapporteringMojlig: boolean;
    UtbildningsinstansUID: string;
    Utbildningskod: string;
  }>;
}

export interface SkaFinnasStudenter {
  Utbildningstillfalle: {
    /** Here is the Kurstillfalle UID */
    Uid: string;
  }[];
}

/**
 * An object that contains information to create or edit grades in Ladok
 */
export interface Studieresultat {
  Avbrott?: {
    Avbrottsdatum: string;
  };
  Student: {
    Efternamn: string;
    Fornamn: string;

    /** Use this ID to match the student in Ladok with same person in Canvas */
    Uid: string;
  };
  /**
   * This is the "StudieresultatUID" that you need to send to Ladok to create
   * a result in Ladok
   */
  Uid: string;

  Rapporteringskontext: {
    /** Use this to check if a user is "rapportor" or not */
    UtbildningsinstansUID: string;

    BetygsskalaID: number;
  };

  /** Present if there is a grade in form of utkast */
  ResultatPaUtbildningar?: Array<{
    Arbetsunderlag?: {
      Betygsgradsobjekt: {
        ID: number;
        Kod: string;
      };

      SenasteResultatandring: string;

      Examinationsdatum: string;
      /**
       * This is the "ResultatUID" that you need to send to Ladok in order to
       * update or delete a result
       */
      Uid: string;
    };
  }>;
}

export interface SokResultat {
  TotalAntalPoster: number;
  Resultat: Array<Studieresultat>;
}

interface RapporteringsMojlighetInput {
  UtbildningsinstansAttRapporteraPaUID: string;
  StudieresultatUID: string;
}

export interface RapporteringsMojlighetOutput {
  KontrolleraRapporteringsrattighetlista: [
    {
      HarRattighet: boolean;
      StudieresultatUID: string;
      UtbildningsinstansAttRapporteraPaUID: string;
    }
  ];
}

export interface Betygsgrad {
  ID: number;
  Kod: string;
}

export interface LadokApiError {
  Detaljkod: string;
  FelUID: string;
  Meddelande: string;
}

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

export function searchUtbildningsinstansStudieresultat(
  utbildningsinstansUID: string,
  KurstillfallenUID: string[],
  page: number = 1
) {
  return gotClient
    .put<SokResultat>(
      `resultat/studieresultat/rapportera/utbildningsinstans/${utbildningsinstansUID}/sok`,
      {
        json: {
          Filtrering: ["OBEHANDLADE", "UTKAST"],
          KurstillfallenUID,
          Page: page,
        },
      }
    )
    .then((r) => r.body);
}

export function searchAktivitetstillfalleStudieresultat(
  aktivitetstillfalleUID: string,
  KurstillfallenUID: string[],
  page: number = 1
) {
  return gotClient
    .put<SokResultat>(
      `resultat/studieresultat/rapportera/aktivitetstillfalle/${aktivitetstillfalleUID}/sok`,
      {
        json: {
          Filtrering: ["OBEHANDLADE", "UTKAST"],
          KurstillfallenUID,
          Page: page,
        },
      }
    )
    .then((r) => r.body);
}

export function searchRapporteringsMojlighet(
  Anvandarnamn: string,
  KontrolleraRapporteringsrattighetlista: RapporteringsMojlighetInput[]
) {
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
    .post<any>(
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
  return gotClient.put<any>(
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
      {
        ID: 131658,
        Kod: "P",
      },
      {
        ID: 131663,
        Kod: "F",
      },
    ];
  }

  if (betygsskalaID === 131657) {
    return [
      {
        ID: 131661,
        Kod: "A",
      },
      {
        ID: 131667,
        Kod: "B",
      },
      {
        ID: 131673,
        Kod: "C",
      },
      {
        ID: 131679,
        Kod: "D",
      },
      {
        ID: 131691,
        Kod: "E",
      },
      {
        ID: 131696,
        Kod: "FX",
      },
      {
        ID: 131697,
        Kod: "F",
      },
    ];
  }

  return [];
}
