import React from "react";
import type { Sections, AktSection } from "t2l-backend";

function AppWithSelector() {
  // TODO: Implement this
  return <div>There are many things to choose from</div>;
}

function AppWithoutSelector({ akt }: { akt: AktSection }) {
  return <div>Transfer to Ladok for {akt.name}</div>;
}

export default function Authenticated({ sections }: { sections: Sections }) {
  const { aktivitetstillfalle, kurstillfalle } = sections;

  // If there are no aktivitetstillfälle or kurstillfälle, then
  // this course cannot be used with Transfer to Ladok
  if (aktivitetstillfalle.length === 0 && kurstillfalle.length === 0) {
    throw new Error("Cannot use here!");
  }

  // If there is only one section and it is a aktivitetstillfälle,
  // we don't show any selector
  if (aktivitetstillfalle.length === 1 && kurstillfalle.length === 0) {
    return <AppWithoutSelector akt={aktivitetstillfalle[0]} />;
  }

  // Otherwise the user needs to choose a destination
  return <AppWithSelector />;
}
