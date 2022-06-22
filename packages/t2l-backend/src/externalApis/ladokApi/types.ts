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

/**
 * Represents the format required by Ladok when creating or updating a result
 */
export interface Resultat {
  Betygsgrad: number;
  BetygsskalaID: number;
  Examinationsdatum: string;
  Projekttitel?: {
    Titel: string;
    AlternativTitel: string;
  };
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

    KravPaProjekttitel: boolean;
  };

  /** All "utkast" or "klarmarkerade" grades for the student and the latest "attesterade" result */
  ResultatPaUtbildningar?: Array<{
    /** This object is present if there is a grade as "utkast" or "klarmarkerade" */
    Arbetsunderlag?: {
      Betygsgradsobjekt: {
        ID: number;
        Kod: string;
      };

      Projekttitel: {
        Titel: string;
        AlternativTitel: string;
      };

      SenasteResultatandring: string;

      Examinationsdatum: string;

      /** Value 1 if the status if "utkast"; 2 if "klarmarkerade" */
      ProcessStatus: 1 | 2;

      /**
       * This is the "ResultatUID" that you need to send to Ladok in order to
       * update or delete a result
       */
      Uid: string;
    };

    /** Latest "atesterade" resultat if any */
    SenastAttesteradeResultat?: {
      Betygsgradsobjekt: {
        ID: number;
        Kod: string;
      };
      Examinationsdatum: string;
      UtbildningsinstansUID: string;
    };
  }>;
}

export interface SokResultat {
  TotaltAntalPoster: number;
  Resultat: Array<Studieresultat>;
}

export interface RapporteringsMojlighetInput {
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
