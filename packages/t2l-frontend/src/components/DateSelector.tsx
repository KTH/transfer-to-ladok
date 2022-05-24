import React from "react";
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
  const [manualDate, setManualDate] = React.useState<Date | null>(new Date());
  const manualDateStr = manualDate?.toISOString().split("T")[0] ?? "";

  return (
    <div className="DateSelector">
      <div className="label">Examination date</div>
      <ul className="options">
        <li>
          <input
            type="radio"
            id="submission-date"
            value="submission-date"
            checked={value.option === "submission-date"}
            onChange={() => {
              onChange({ option: "submission-date" });
            }}
          />
          <label htmlFor="submission-date">Submission date in assignment</label>
        </li>
        <li className="manual-date">
          <input
            type="radio"
            id="manual-date"
            value="manual-date"
            checked={value.option === "manual-date"}
            onChange={() => {
              onChange({ option: "manual-date", date: manualDateStr });
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
