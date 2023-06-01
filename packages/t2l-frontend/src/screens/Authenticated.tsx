import React from "react";
import { Sections } from "t2l-backend";
import { useSendGrades } from "../hooks/useSendGrades";
import SelectionStep, { UserSelection } from "./wizard/SelectionStep";
import DoneStep from "./wizard/DoneStep";
import PreviewStep from "./wizard/PreviewStep";

import "./Authenticated.scss";
import { InvalidCourseError } from "../utils/errors";
import Loading from "../components/Loading";

export default function Authenticated({ sections }: { sections: Sections }) {
  const { aktivitetstillfalle, kurstillfalle } = sections;
  const sendGradesMutation = useSendGrades();
  const [userSelection, setUserSelection] =
    React.useState<UserSelection | null>(null);

  if (sendGradesMutation.isLoading) {
    return <Loading>Transferring results to Ladok...</Loading>;
  }

  if (sendGradesMutation.isError) {
    throw sendGradesMutation.error;
  }

  if (sendGradesMutation.isSuccess) {
    return <DoneStep />;
  }

  // If there are no aktivitetstillfälle or kurstillfälle, then
  // this course cannot be used with Transfer to Ladok
  if (aktivitetstillfalle.length === 0 && kurstillfalle.length === 0) {
    throw new InvalidCourseError();
  }

  // Preview Step
  if (userSelection) {
    return (
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      <PreviewStep onBack={() => setUserSelection(null)} onSubmit={() => {}} />
    );
  }

  // Selection Step
  return <SelectionStep onSubmit={setUserSelection} />;
}
