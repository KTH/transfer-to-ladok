import {
  getBetyg,
  getSkaFinnasStudenter,
  searchRapporteringsMojlighet,
  searchStudieresultat,
} from "../../externalApis/ladokApi";
import { GradeableStudents, GradesDestination } from "./types";
import {
  RapporteringsMojlighetOutput,
  Studieresultat,
} from "../../externalApis/ladokApi/types";

/**
 * Calls {@link searchStudieresultat} and fetches all pages of results.
 */
export async function _searchAllStudieresultat(
  type: "utbildningsinstans" | "aktivitetstillfalle",
  UID: string,
  KurstillfallenUID: string[]
) {
  let page = 1;
  const allResults: Studieresultat[] = [];
  const result = await searchStudieresultat(type, UID, KurstillfallenUID, page);
  allResults.push(...result.Resultat);

  while (result.TotaltAntalPoster > allResults.length) {
    page++;
    const result = await searchStudieresultat(
      type,
      UID,
      KurstillfallenUID,
      page
    );
    allResults.push(...result.Resultat);
  }

  return allResults;
}

/**
 * Given a list of {@link Studieresultat}, get a list of which ones the user
 * has permissions to send grades to.
 */
export async function getAllPermissions(
  allStudieresultat: Studieresultat[],
  email: string
) {
  return searchRapporteringsMojlighet(
    email,
    allStudieresultat.map((s) => ({
      StudieresultatUID: s.Uid,
      UtbildningsinstansAttRapporteraPaUID:
        s.Rapporteringskontext.UtbildningsinstansUID,
    }))
  );
}

/**
 * Given a destination ({@link GradesDestination}), get a list of all
 * {@link Studieresultat} in that destination
 */
export async function getAllStudieresultat(
  destination: GradesDestination
): Promise<Studieresultat[]> {
  if ("aktivitetstillfalle" in destination) {
    // We use this function only to get all Kurstillfälle that are linked with a given aktivitetstillfälle.
    const kurstillfalleUID = await getSkaFinnasStudenter(
      destination.aktivitetstillfalle
    ).then((s) => s.Utbildningstillfalle.map((u) => u.Uid));

    return _searchAllStudieresultat(
      "aktivitetstillfalle",
      destination.aktivitetstillfalle,
      kurstillfalleUID
    );
  } else {
    return _searchAllStudieresultat(
      "utbildningsinstans",
      destination.utbildningsinstans,
      [destination.kurstillfalle]
    );
  }
}

/**
 * Utility class that wraps a {@link Studieresultat}.
 */
export default class GradingInformation {
  _obj: Studieresultat;
  hasPermission: boolean;

  /**
   *
   * @param obj the {@link Studieresultat} to wrap
   * @param allPermissions an object containing all permissions for the user
   */
  constructor(
    studieresultat: Studieresultat,
    allPermissions: RapporteringsMojlighetOutput
  ) {
    this._obj = studieresultat;
    this.hasPermission = this._containsPermission(
      studieresultat,
      allPermissions
    );
  }

  private _containsPermission(
    studieresultat: Studieresultat,
    allPermissions: RapporteringsMojlighetOutput
  ) {
    return allPermissions.KontrolleraRapporteringsrattighetlista.some(
      (r) =>
        r.StudieresultatUID === studieresultat.Uid &&
        r.UtbildningsinstansAttRapporteraPaUID ===
          studieresultat.Rapporteringskontext.UtbildningsinstansUID &&
        r.HarRattighet
    );
  }

  /** @returns true if this result refers to a given student */
  belongsTo(studentId: string) {
    return this._obj.Student.Uid === studentId;
  }

  draft() {
    const utkast = this._obj.ResultatPaUtbildningar?.find(
      (rpu) =>
        rpu.Arbetsunderlag?.ProcessStatus === 1 &&
        // For some strange reason, the API returns results from other completely
        // unrelated modules (¯\_(ツ)_/¯)
        // We need to filter out things to prevent bugs
        rpu.Arbetsunderlag?.UtbildningsinstansUID ===
          this._obj.Rapporteringskontext.UtbildningsinstansUID
    )?.Arbetsunderlag;

    if (!utkast || !this.hasPermission) {
      return;
    }

    return {
      id: utkast.Uid,
      updatedAt: utkast.SenasteResultatandring,
      grade: utkast.Betygsgradsobjekt?.Kod,
      examinationDate: utkast.Examinationsdatum,
      projektTitle: utkast.Projekttitel && {
        title: utkast.Projekttitel.Titel,
        alternativeTitle: utkast.Projekttitel.AlternativTitel,
      },
    };
  }

  private _certified() {
    const attesterade = this._obj.ResultatPaUtbildningar?.find(
      (rpu) =>
        // For some strange reason, the API returns results from other completely
        // unrelated modules (¯\_(ツ)_/¯)
        // We need to filter out things to prevent bugs
        rpu.SenastAttesteradeResultat?.UtbildningsinstansUID ===
        this._obj.Rapporteringskontext.UtbildningsinstansUID
    )?.SenastAttesteradeResultat;

    if (!attesterade || !this.hasPermission) {
      return;
    }

    return {
      grade: attesterade.Betygsgradsobjekt.Kod,
      examinationDate: attesterade.Examinationsdatum,
    };
  }

  private _ready() {
    const klarmarkerade = this._obj.ResultatPaUtbildningar?.find(
      (rpu) =>
        rpu.Arbetsunderlag?.ProcessStatus === 2 &&
        // For some strange reason, the API returns results from other completely
        // unrelated modules (¯\_(ツ)_/¯)
        // We need to filter out things to prevent bugs
        rpu.SenastAttesteradeResultat?.UtbildningsinstansUID ===
          this._obj.Rapporteringskontext.UtbildningsinstansUID
    )?.Arbetsunderlag;

    if (!klarmarkerade || !this.hasPermission) {
      return;
    }

    return {
      grade: klarmarkerade.Betygsgradsobjekt.Kod,
      examinationDate: klarmarkerade.Examinationsdatum,
    };
  }

  /** Returns the personal number of a student */
  private _personalNumber(): string | undefined {
    if (this.hasPermission) {
      return this._obj.Student.Personnummer;
    }
  }

  /** Returns a readable representation of a gradeable student */
  toObject(): GradeableStudents[number] {
    return {
      student: {
        id: this._obj.Student.Uid,
        sortableName: `${this._obj.Student.Efternamn}, ${this._obj.Student.Fornamn}`,
        personalNumber: this._personalNumber(),
      },
      scale: getBetyg(this._obj.Rapporteringskontext.BetygsskalaID).map(
        (b) => b.Kod
      ),
      hasPermission: this.hasPermission,
      requiresTitle: this._obj.Rapporteringskontext.KravPaProjekttitel,
      draft: this.draft(),
      markedAsReady: this._ready(),
      certified: this._certified(),
    };
  }
}
