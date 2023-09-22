import React from "react";
import { Sections } from "t2l-backend";
import { useTransfer } from "../hooks/useSendGrades";
import SelectionStep, { UserSelection } from "./wizard/SelectionStep";
import DoneStep from "./wizard/DoneStep";
import PreviewStep from "./wizard/PreviewStep";

import "./Authenticated.scss";
import { InvalidCourseError } from "../utils/errors";
import Loading from "../components/Loading";
import { GradeWithStatus } from "../utils/mergeGradesList";

export default function Authenticated({ sections }: { sections: Sections }) {
  const { aktivitetstillfalle, kurstillfalle } = sections;
  const [userSelection, setUserSelection] =
    React.useState<UserSelection | null>(null);

  // This is the "mutation" object that is used to transfer results to Ladok.
  // Depending on the state of the mutation, we render different steps.
  // - If the mutation is "Done", we show the "Done" step.
  // - If the mutatton is "Idle" (i.e. not started), we show the "Selection" step.
  const sendGradesMutation = useTransfer(userSelection);

  function handleRestart() {
    sendGradesMutation.reset();
    setUserSelection(null);
  }

  // This function is called when the user clicks the "Transfer" button
  function handleTransfer(resultsToBeTransferred: GradeWithStatus[]) {
    if (!userSelection) {
      return;
    }

    sendGradesMutation.mutate(resultsToBeTransferred);
  }

  if (sendGradesMutation.isLoading) {
    return <Loading>Transferring results to Ladok...</Loading>;
  }

  if (sendGradesMutation.isError) {
    throw sendGradesMutation.error;
  }

  if (sendGradesMutation.isSuccess) {
    return (
      <DoneStep
        userSelection={userSelection}
        response={sendGradesMutation.data}
        onRestart={handleRestart}
      />
    );
  }

  // From here, we know that the mutation is "Idle" (i.e. not started).

  // If there are no aktivitetstillfälle or kurstillfälle, then
  // this course cannot be used with Transfer to Ladok
  if (aktivitetstillfalle.length === 0 && kurstillfalle.length === 0) {
    throw new InvalidCourseError();
  }

  // Preview Step
  if (userSelection) {
    return (
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      <PreviewStep
        onBack={() => setUserSelection(null)}
        onSubmit={handleTransfer}
        userSelection={userSelection}
      />
    );
  }

  // Selection Step
  return <SelectionStep onSubmit={setUserSelection} />;
}
