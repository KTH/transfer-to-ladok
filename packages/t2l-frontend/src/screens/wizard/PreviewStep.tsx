import React from "react";

interface PreviewStepProps {
  onBack: () => void;
  onSubmit: () => void;
}

export default function PreviewStep({ onBack, onSubmit }: PreviewStepProps) {
  return (
    <div>
      This is a preview
      <button onClick={onBack}>Back</button>
      <button onClick={onSubmit}>Submit</button>
    </div>
  );
}
