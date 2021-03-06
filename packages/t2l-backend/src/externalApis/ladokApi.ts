/**
 * This module are functions to call Ladok API. They do not contain any logic
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

export interface Aktivitetstillfallesmojlighet {
  TotalAntalPoster: number;
  Resultat: Array<{
    KurstillfalleStudentenArRegistreradPa: string;
  }>;
}

export interface SokResultat {
  TotalAntalPoster: number;
  Resultat: Array<{
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

    /** Present if there is a grade in form of utkast */
    ResultatPaUtbildningar?: Array<{
      Arbetsunderlag: {
        Betygsgradobjekt: {
          ID: number;
          Kod: string;
        };
        /**
         * This is the "ResultatUID" that you need to send to Ladok in order to
         * update or delete a result
         */
        Uid: string;
      };
    }>;
  }>;
}

export async function getAktivitetstillfalle(aktivitetstillfalleUID: string) {
  return gotClient
    .get<Aktivitetstillfalle>(
      `resultat/aktivitetstillfalle/${aktivitetstillfalleUID}`
    )
    .then((response) => response.body);
}

export function getAktivitetstillfallesmojlighet(
  aktivitetstillfalleUID: string
) {
  return gotClient.get<Aktivitetstillfallesmojlighet>(
    `resultat/aktivitetstillfallesmojlighet/aktivitetstillfallesmojlighet/filtrera/utananonymbehorighet?aktivitetstillfalleUID=${aktivitetstillfalleUID}&page=1&limit=400`
  );
}

export function getKurstillfalleStructure(kurstillfalleUID: string) {
  return gotClient
    .get<Kurstillfalle>(`resultat/kurstillfalle${kurstillfalleUID}/moment`)
    .then((response) => response.body);
}

export function searchModulesStudieresultat(
  utbildningsinstansUID: string,
  status: "OBEHANDLADE" | "UTKAST",
  KurstillfallenUID: string[]
) {
  return gotClient.put<SokResultat>(
    `resultat/studieresultat/rapportera/utbildningsinstans/${utbildningsinstansUID}/sok`,
    {
      json: {
        Filtrering: [status],
        KurstillfallenUID,
      },
    }
  );
}

export function searchExaminationsStudieresultat(
  aktivitetstillfalleUID: string,
  status: "OBEHANDLADE" | "UTKAST",
  KurstillfallenUID: string[]
) {
  return gotClient.put<SokResultat>(
    `resultat/studieresultat/rapportera/aktivitetstillfalle/${aktivitetstillfalleUID}/sok`,
    {
      json: {
        Filtrering: [status],
        KurstillfallenUID,
      },
    }
  );
}

export function createResult(
  studieresultatUID: string,
  utbildningsinstansUID: string,
  resultat: Resultat
) {
  return gotClient.post<any>(
    `resultat/studieresultat/${studieresultatUID}/utbildning/${utbildningsinstansUID}/resultat`,
    {
      json: resultat,
    }
  );
}

export function updateResult(
  resultatUID: string,
  newValue: Resultat,
  currentDate?: Date
) {
  return gotClient.put<any>(
    `resultat/studieresultat/resultat/${resultatUID}/`,
    {
      json: {
        ...newValue,
        SenasteResultatandring: (currentDate || new Date()).toISOString(),
      },
    }
  );
}
