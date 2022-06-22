import React, { useState } from "react";
import {
  Sections,
  AktivitetstillfalleSection,
  GradesDestination,
} from "t2l-backend/src/types";
import { SendGradesInput, useSendGrades } from "../hooks/useSendGrades";
import Preview from "./Preview";
import Done from "./Done";
import ModuleSelector from "./ModuleSelector";
import { ArrowLeft } from "../utils/icons";

import "./Authenticated.scss";
import { InvalidCourseError } from "../utils/errors";
import Loading from "../components/Loading";
import getLadokUrl from "../utils/ladokUrl";

function getName(sections: Sections, destination: GradesDestination) {
  if ("aktivitetstillfalle" in destination) {
    const akt = sections.aktivitetstillfalle.find(
      (a) => a.id === destination.aktivitetstillfalle
    );

    return akt?.name;
  }

  const ktf = sections.kurstillfalle.find(
    (k) => k.id === destination.kurstillfalle
  );

  if (ktf) {
    if (ktf.utbildningsinstans === destination.utbildningsinstans) {
      return `${ktf.courseCode} (${ktf.roundCode}) - Final grade`;
    }

    const mod = ktf.modules.find(
      (m) => m.utbildningsinstans === destination.utbildningsinstans
    );

    if (mod) {
      return `${ktf.courseCode} (${ktf.roundCode}) – ${mod.code}`;
    }
  }
}

function getDate(sections: Sections, destination: GradesDestination) {
  if ("aktivitetstillfalle" in destination) {
    const akt = sections.aktivitetstillfalle.find(
      (a) => a.id === destination.aktivitetstillfalle
    );

    return akt?.date;
  }
}

function AppWithSelector({
  sections,
  onSubmit,
}: {
  sections: Sections;
  onSubmit(results: SendGradesInput): void;
}) {
  const [destination, setDestination] = React.useState<GradesDestination>();

  if (!destination) {
    return <ModuleSelector sections={sections} onSelect={setDestination} />;
  }

  return (
    <div className="Authenticated">
      <header className="header">
        <a
          href=""
          className="with-icon"
          onClick={(e) => {
            e.preventDefault();
            setDestination(undefined);
          }}
        >
          <ArrowLeft />
          <span className="label">Back to module selection</span>
        </a>
      </header>
      <Preview
        destination={destination}
        destinationName={getName(sections, destination) || ""}
        fixedExaminationDate={getDate(sections, destination)}
        onSubmit={onSubmit}
      />
    </div>
  );
}

function AppWithoutSelector({
  akt,
  onSubmit,
}: {
  akt: AktivitetstillfalleSection;
  onSubmit(results: SendGradesInput): void;
}) {
  return (
    <Preview
      destination={{ aktivitetstillfalle: akt.id }}
      destinationName={akt.name}
      fixedExaminationDate={akt.date}
      onSubmit={onSubmit}
    />
  );
}

export default function Authenticated({ sections }: { sections: Sections }) {
  const { aktivitetstillfalle, kurstillfalle } = sections;
  const sendGradesMutation = useSendGrades();
  const [ladokUrl, setLadokUrl] = useState("");

  function koooor(input: SendGradesInput) {
    setLadokUrl(getLadokUrl(sections, input.destination));
    sendGradesMutation.mutate(input);
  }

  if (sendGradesMutation.isLoading) {
    return <Loading>Transferring results to Ladok...</Loading>;
  }

  if (sendGradesMutation.isError) {
    throw sendGradesMutation.error;
  }

  if (sendGradesMutation.isSuccess) {
    return <Done ladokUrl={ladokUrl} results={sendGradesMutation.data} />;
  }

  // If there are no aktivitetstillfälle or kurstillfälle, then
  // this course cannot be used with Transfer to Ladok
  if (aktivitetstillfalle.length === 0 && kurstillfalle.length === 0) {
    throw new InvalidCourseError();
  }

  // If there is only one section and it is a aktivitetstillfälle,
  // we don't show any selector
  if (aktivitetstillfalle.length === 1 && kurstillfalle.length === 0) {
    return (
      <AppWithoutSelector akt={aktivitetstillfalle[0]} onSubmit={koooor} />
    );
  }

  // Otherwise the user needs to choose a destination
  return <AppWithSelector sections={sections} onSubmit={koooor} />;
}
