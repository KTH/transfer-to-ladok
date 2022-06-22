import React, { useEffect } from "react";
import DatePicker from "react-datepicker";
import "./DateSelector.scss";
import "react-datepicker/dist/react-datepicker.css";

export type Values =
  | { option: "fixed-date" }
  | { option: "submission-date" }
  | { option: "manual-date"; date: string };

export default function DateSelector({
  fixedOption,
  value,
  onChange,
}: {
  fixedOption?: string;
  value: Values;
  onChange(value: Values): void;
}) {
  // Inside this component, values for "option" and "date" are controlled
  // by two separate components. Therefore we use two states internally
  const [selectedOption, setSelectedOption] = React.useState<Values["option"]>(
    value.option
  );
  const [manualDate, setManualDate] = React.useState<Date | null>(new Date());
  const manualDateStr = manualDate?.toISOString().split("T")[0] ?? "";

  // We use this hook to merge the two states into a single value
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
  }, [manualDate, selectedOption]);

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
