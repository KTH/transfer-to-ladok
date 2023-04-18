import { GradesDestination, Sections } from "t2l-backend";

export default function ladokUrl(
  sections: Sections,
  destination: GradesDestination
): string {
  if ("aktivitetstillfalle" in destination) {
    return `https://www.integrationstest.ladok.se/gui/app/gui/#/studiedokumentation/aktivitetstillfalleshantering/${destination.aktivitetstillfalle}/rapportering`;
  }

  const selectedKurstillfalle = sections.kurstillfalle.find(
    (k) => k.id === destination.kurstillfalle
  );

  const parentUtbildningsinstans = selectedKurstillfalle?.utbildningsinstans;

  return `https://www.integrationstest.ladok.se/gui/app/gui/#/studiedokumentation/resultathantering/${parentUtbildningsinstans}/rapportering/rapportera/${destination.utbildningsinstans}?valtKurstillfalle=${destination.kurstillfalle}`;
}
