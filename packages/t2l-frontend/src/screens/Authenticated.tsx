import React from "react";
import { Sections, AktSection, GradesDestination } from "t2l-backend/src/types";
import { SendGradesInput, useSendGrades } from "../hooks/useSendGrades";
import Preview from "./Preview";
import Done from "./Done";
import ModuleSelector from "./ModuleSelector";

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
    <Preview
      destination={destination}
      destinationName={getName(sections, destination) || ""}
      fixedExaminationDate={getDate(sections, destination)}
      onSubmit={onSubmit}
    />
  );
}

function AppWithoutSelector({
  akt,
  onSubmit,
}: {
  akt: AktSection;
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

  if (sendGradesMutation.isLoading) {
    return <div>We are sending things to Ladok now!</div>;
  }

  if (sendGradesMutation.isError) {
    return <div>ERRORRRRRRRR</div>;
  }

  if (sendGradesMutation.isSuccess) {
    return <Done results={sendGradesMutation.data} />;
  }

  // If there are no aktivitetstillfälle or kurstillfälle, then
  // this course cannot be used with Transfer to Ladok
  if (aktivitetstillfalle.length === 0 && kurstillfalle.length === 0) {
    throw new Error("Cannot use here!");
  }

  // If there is only one section and it is a aktivitetstillfälle,
  // we don't show any selector
  if (aktivitetstillfalle.length === 1 && kurstillfalle.length === 0) {
    return (
      <AppWithoutSelector
        akt={aktivitetstillfalle[0]}
        onSubmit={sendGradesMutation.mutate}
      />
    );
  }

  // Otherwise the user needs to choose a destination
  return (
    <AppWithSelector sections={sections} onSubmit={sendGradesMutation.mutate} />
  );
}
