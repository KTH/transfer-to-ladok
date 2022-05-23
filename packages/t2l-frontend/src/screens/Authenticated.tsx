import React from "react";
import type { Sections, AktSection } from "t2l-backend";
import { SendGradesInput, useSendGrades } from "../hooks/useSendGrades";
import Preview from "./Preview";

function AppWithSelector() {
  // TODO: Implement this
  return <div>There are many things to choose from</div>;
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
    console.log(sendGradesMutation.data);
    return <div>DONE!!!!!!!</div>;
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
  return <AppWithSelector />;
}
