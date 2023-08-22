import React from "react";
import { GradesDestination, Sections } from "t2l-backend";
import { Select, Option, OptionGroup } from "@kth/style";

interface LadokModulesSelectProps {
  onChange: (value: GradesDestination | null) => void;
  value: GradesDestination | null;
  error: string | undefined;
  ladokModules: Sections;
}

export default function LadokModuleSelect({
  onChange,
  value,
  error,
  ladokModules,
}: LadokModulesSelectProps) {
  const examinationLength = ladokModules.aktivitetstillfalle.length;
  const firstExamination = ladokModules.aktivitetstillfalle[0]?.id;

  React.useEffect(() => {
    if (examinationLength === 1) {
      onChange({
        aktivitetstillfalle: firstExamination,
      });
    }
  }, [examinationLength, firstExamination]);

  return (
    <Select
      name="ladok-module"
      value={JSON.stringify(value)}
      onChange={(value) => onChange(JSON.parse(value))}
      error={error}
      label="Ladok module"
      description="To which module do you want the grades to be transferred"
    >
      <Option value="null">Select module</Option>
      {ladokModules.aktivitetstillfalle.map((a) => (
        <Option
          key={JSON.stringify({
            aktivitetstillfalle: a.id,
          })}
          value={JSON.stringify({
            aktivitetstillfalle: a.id,
          })}
        >
          {a.name}
        </Option>
      ))}

      {ladokModules.kurstillfalle.map((section) => (
        <OptionGroup label={`${section.courseCode} - (${section.roundCode})`}>
          {section.modules.map((m) => (
            <Option
              key={JSON.stringify({
                kurstillfalle: section.id,
                utbildningsinstans: m.utbildningsinstans,
              })}
              value={JSON.stringify({
                kurstillfalle: section.id,
                utbildningsinstans: m.utbildningsinstans,
              })}
            >
              {m.code} - {m.name}
            </Option>
          ))}
          {/*
              This option, to report the final grades on the course, is not tested yet and should not be released until tested. Hide this option until it is tested and verified that it works as intended.
              <Option
            value={JSON.stringify({
              kurstillfalle: section.id,
              utbildningsinstans: section.utbildningsinstans,
            })}
          >
            Final grade
          </Option>*/}
        </OptionGroup>
      ))}
    </Select>
  );
}
