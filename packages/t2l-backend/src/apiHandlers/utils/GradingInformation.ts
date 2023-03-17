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
export async function _getAllPermissions(
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
export async function _getAllStudieresultat(
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

export async function getGradingInformation(
  destination: GradesDestination,
  teacherEmail: string
) {
  const allStudieresultat = await _getAllStudieresultat(destination);
  const allPermissions = await _getAllPermissions(
    allStudieresultat,
    teacherEmail
  );

  return allStudieresultat.map(
    (s) => new GradingInformation(s, allPermissions)
  );
}

export default class GradingInformation {
  _obj: Studieresultat;
  hasPermission: boolean;

  constructor(
    obj: Studieresultat,
    allPermissions: RapporteringsMojlighetOutput
  ) {
    this._obj = obj;
    this.hasPermission = this._containsPermission(obj, allPermissions);
  }

  _containsPermission(
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

  belongsTo(studentId: string) {
    return this._obj.Student.Uid === studentId;
  }

  _draft() {
    const utkast = this._obj.ResultatPaUtbildningar?.find(
      (rpu) => rpu.Arbetsunderlag?.ProcessStatus === 1
    )?.Arbetsunderlag;

    if (!utkast || !this.hasPermission) {
      return;
    }

    // Ladok returns all utkast for a student in a course, even outside of
    // the current module. We need to filter-out it
    if (
      utkast?.UtbildningsinstansUID !==
      this._obj.Rapporteringskontext.UtbildningsinstansUID
    ) {
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

  _certified() {
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

  _ready() {
    const klarmarkerade = this._obj.ResultatPaUtbildningar?.find(
      (rpu) => rpu.Arbetsunderlag?.ProcessStatus === 2
    )?.Arbetsunderlag;

    if (!klarmarkerade || !this.hasPermission) {
      return;
    }

    return {
      grade: klarmarkerade.Betygsgradsobjekt.Kod,
      examinationDate: klarmarkerade.Examinationsdatum,
    };
  }

  toObject(): GradeableStudents[number] {
    return {
      student: {
        id: this._obj.Student.Uid,
        sortableName: `${this._obj.Student.Efternamn}, ${this._obj.Student.Fornamn}`,
      },
      scale: getBetyg(this._obj.Rapporteringskontext.BetygsskalaID).map(
        (b) => b.Kod
      ),
      hasPermission: this.hasPermission,
      requiresTitle: this._obj.Rapporteringskontext.KravPaProjekttitel,
      draft: this._draft(),
      markedAsReady: this._ready(),
      certified: this._certified(),
    };
  }
}
