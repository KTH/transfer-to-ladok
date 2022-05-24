import React from "react";
import DatePicker from "react-datepicker";
import "./DateSelector.scss";
import "react-datepicker/dist/react-datepicker.css";

type Values =
  | {
      option: "default-date";
    }
  | { option: "submission-date" }
  | { option: "manual"; date: string };

export default function DateSelector({
  defaultValue,
  value,
  onChange,
}: {
  defaultValue?: string;
  value: Values;
  onChange(value: Values): void;
}) {
  const [manualDate, setManualDate] = React.useState<Date | null>(new Date());

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
          <input type="radio" id="E" />
          <label htmlFor="E">Custom</label>
          <DatePicker
            selected={manualDate}
            onChange={(d) => setManualDate(d)}
          />
        </li>
      </ul>
    </div>
  );
}
