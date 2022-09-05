import React, { useEffect } from "react";
import DatePicker from "react-datepicker";
import "./ExaminationDateSelector.scss";
import "react-datepicker/dist/react-datepicker.css";

export type ExaminationDate =
  | { option: "fixed-date" }
  | { option: "submission-date" }
  | { option: "manual-date"; date: string };

/**
 * Returns callbacks to manage the properties "option" and "date" separately.
 * It also return the values as if they were independent from eath other.
 */
function useExaminationDate(
  initialOption: ExaminationDate["option"],
  onChange: (value: ExaminationDate) => void
) {
  const [selectedOption, setSelectedOption] =
    React.useState<ExaminationDate["option"]>(initialOption);
  const [manualDate, setManualDate] = React.useState<Date | null>(new Date());
  const manualDateStr = manualDate?.toISOString().split("T")[0] ?? "";

  // Update the actual value whenever selectedOption or manualDate changes
  useEffect(() => {
    if (selectedOption === "manual-date") {
      onChange({
        option: "manual-date",
        date: manualDateStr,
      });
    } else {
      onChange({
        option: selectedOption,
      });
    }
  }, [manualDateStr, selectedOption]);

  return {
    manualDate,
    setManualDate,
    selectedOption,
    setSelectedOption,
  };
}

export default function ExaminationDateSelector({
  fixedOption,
  value,
  onChange,
}: {
  fixedOption?: string;
  value: ExaminationDate;
  onChange(value: ExaminationDate): void;
}) {
  const { manualDate, setManualDate, selectedOption, setSelectedOption } =
    useExaminationDate(value.option, onChange);

  return (
    <div className="DateSelector">
      <div className="label">Examination date</div>
      <ul className="options">
        {fixedOption && (
          <li>
            <input
              type="radio"
              id="fixed-date"
              value="fixed-date"
              checked={selectedOption === "fixed-date"}
              onChange={() => {
                setSelectedOption("fixed-date");
              }}
            />
            <label htmlFor="fixed-date">{fixedOption}</label>
          </li>
        )}
        <li>
          <input
            type="radio"
            id="submission-date"
            value="submission-date"
            checked={selectedOption === "submission-date"}
            onChange={() => {
              setSelectedOption("submission-date");
            }}
          />
          <label htmlFor="submission-date">Submission date in assignment</label>
        </li>
        <li className="manual-date">
          <input
            type="radio"
            id="manual-date"
            value="manual-date"
            checked={selectedOption === "manual-date"}
            onChange={() => {
              setSelectedOption("manual-date");
            }}
          />
          <label htmlFor="manual-date">Custom</label>
          <DatePicker
            dateFormat="yyyy-MM-dd"
            calendarStartDay={1}
            disabled={value.option !== "manual-date"}
            selected={manualDate}
            onChange={(d) => setManualDate(d)}
          />
        </li>
      </ul>
    </div>
  );
}
