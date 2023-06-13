import React from "react";
import { PostLadokGradesInput, ResultInput, Sections } from "t2l-backend";
import { useTransferResults } from "../hooks/useSendGrades";
import SelectionStep, { UserSelection } from "./wizard/SelectionStep";
import DoneStep from "./wizard/DoneStep";
import PreviewStep from "./wizard/PreviewStep";

import "./Authenticated.scss";
import { InvalidCourseError } from "../utils/errors";
import Loading from "../components/Loading";
import { TG, TransferrableGrade } from "../utils/mergeGradesList";

export default function Authenticated({ sections }: { sections: Sections }) {
  const { aktivitetstillfalle, kurstillfalle } = sections;
  const sendGradesMutation = useTransferResults();
  const [userSelection, setUserSelection] =
    React.useState<UserSelection | null>(null);

  function handleTransfer(resultsToBeTransferred: TG[]) {
    if (!userSelection) {
      return;
    }

    // Grades that will be transferred
    const input: PostLadokGradesInput = {
      destination: userSelection?.destination,
      results: resultsToBeTransferred
        .filter((r): r is TransferrableGrade => r.transferable)
        .map<ResultInput>(
          (r): ResultInput => ({
            id: r.student.id,
            draft: r.draft,
          })
        ),
    };

    sendGradesMutation.mutate(input);
  }

  if (sendGradesMutation.isLoading) {
    return <Loading>Transferring results to Ladok...</Loading>;
  }

  if (sendGradesMutation.isError) {
    throw sendGradesMutation.error;
  }

  if (sendGradesMutation.isSuccess) {
    // `variables` contains the input
    // `data` contains the response
    sendGradesMutation.variables;

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
