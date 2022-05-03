/**
 * This module are functions to call Ladok API. They do not contain any logic
 */
import got, {
  HTTPError,
  Method,
  Headers,
  OptionsOfJSONResponseBody,
} from "got";

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

export class LadokApiError extends Error {
  public options?: {
    headers: Headers;
    url: string;
    method: Method;
  };

  public response?: {
    body: unknown;
    headers: Headers;
    ip?: string;
    retryCount: number;
    statusCode: number;
    statusMessage?: string;
  };

  public code: number;

  constructor(gotError: HTTPError) {
    super(gotError.message);
    Error.captureStackTrace(this);
    this.code = gotError.response.statusCode;
    this.name = "LadokApiError";
    this.options = {
      headers: gotError.options.headers,
      url: gotError.options.url.toString(),
      method: gotError.options.method,
    };
    this.response = gotError.response;

    this.options.headers.authorization = "[HIDDEN]";
  }
}

const minimalErrorHandler = (err2: Error) => (err: unknown) => {
  if (err instanceof HTTPError) {
    const error = new LadokApiError(err);
    error.response = {
      body: err.response.body,
      headers: err.response.headers,
      ip: err.response.ip,
      retryCount: err.response.retryCount,
      statusCode: err.response.statusCode,
      statusMessage: err.response.statusMessage,
    };
    error.stack = err2.stack;

    throw error;
  }

  throw err;
};

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
    /** Kurstillfalle UID */
    Uid: string;
  }[];
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

    Rapporteringskontext: {
      /** Use this to check if a user is "rapportor" or not */
      UtbildningsinstansUID: string;
    };

    /** Present if there is a grade in form of utkast */
    ResultatPaUtbildningar?: Array<{
      Arbetsunderlag?: {
        Betygsgradobjekt: {
          ID: number;
          Kod: string;
        };

        Examinationsdatum: string;
        /**
         * This is the "ResultatUID" that you need to send to Ladok in order to
         * update or delete a result
         */
        Uid: string;
      };
    }>;
  }>;
}

function ladokGet<T>(endpoint: string) {
  const err = new Error();
  return gotClient
    .get<T>(endpoint)
    .then((response) => response.body)
    .catch(minimalErrorHandler(err));
}

function ladokPut<T>(endpoint: string, options: OptionsOfJSONResponseBody) {
  const err = new Error();
  return gotClient
    .put<T>(endpoint, options)
    .then((response) => response.body)
    .catch(minimalErrorHandler(err));
}

export interface Rapportor {
  Anvandare: {
    Uid: string;
    Anvandarnamn: string;
    Efternamn: string;
    Fornamn: string;
  }[];
}

export async function getAktivitetstillfalle(aktivitetstillfalleUID: string) {
  return ladokGet<Aktivitetstillfalle>(
    `resultat/aktivitetstillfalle/${aktivitetstillfalleUID}`
  );
}

export function getSkaFinnasStudenter(aktivitetstillfalleUID: string) {
  return ladokGet<SkaFinnasStudenter>(
    `resultat/kurstillfalle/aktivitetstillfalle/skafinnasstudenter/${aktivitetstillfalleUID}`
  );
}

export function getKurstillfalleStructure(kurstillfalleUID: string) {
  return ladokGet<Kurstillfalle>(
    `resultat/kurstillfalle/${kurstillfalleUID}/momaaaent`
  );
}

export function searchUtbildningsinstansStudieresultat(
  utbildningsinstansUID: string,
  KurstillfallenUID: string[],
  page: number = 1
) {
  return ladokPut<SokResultat>(
    `resultat/studieresultat/rapportera/utbildningsinstans/${utbildningsinstansUID}/sok`,
    {
      json: {
        Filtrering: ["OBEHANDLADE", "UTKAST"],
        KurstillfallenUID,
        Page: page,
      },
    }
  );
}

export function searchAktivitetstillfalleStudieresultat(
  aktivitetstillfalleUID: string,
  KurstillfallenUID: string[],
  page: number = 1
) {
  return ladokPut<SokResultat>(
    `resultat/studieresultat/rapportera/aktivitetstillfalle/${aktivitetstillfalleUID}/sok`,
    {
      json: {
        Filtrering: ["OBEHANDLADE", "UTKAST"],
        KurstillfallenUID,
        Page: page,
      },
    }
  );
}

export function getRapportor(utbildningsinstansUID: string) {
  return ladokGet<Rapportor>(
    `resultat/anvandare/resultatrattighet/utbildningsinstans?utbildningsinstansUID=${utbildningsinstansUID}`
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
