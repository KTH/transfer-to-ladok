import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function ExaminationDateSelector({
  value,
  onChange,
}: {
  fixedOption?: string;
  value: Date | null;
  onChange(value: Date | null): void;
}) {
  return (
    <div className="t2l-datepicker">
      <label htmlFor="examination-date">Examination date</label>
      <DatePicker
        id="examination-date"
        dateFormat="yyyy-MM-dd"
        calendarStartDay={1}
        selected={value}
        onChange={(d) => onChange(d)}
      />
    </div>
  );
}
