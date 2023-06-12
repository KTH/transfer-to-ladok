import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

/** Return a YYYY-MM-DD representation of the date */
export function formatDate(date: Date): string {
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
}

/** Return a date from a YYYY-MM-DD string */
export function parseDate(str: string): Date {
  return new Date(`${str}T00:00:00`);
}

export default function ExaminationDateSelector({
  value,
  onChange,
}: {
  fixedOption?: string;
  /** YY-MM-DDDD representation of the date */
  value: string | null;
  onChange(value: string | null): void;
}) {
  // Convert date to string and vice-versa
  const dateValue = value ? parseDate(value) : null;

  function handleChange(date: Date | null) {
    if (date === null) {
      onChange(null);
    } else {
      onChange(formatDate(date));
    }
  }

  // TODO: Style this component
  return (
    <div className="kth-input">
      <label htmlFor="examination-date">Examination date</label>
      <DatePicker
        autoComplete="off"
        id="examination-date"
        dateFormat="yyyy-MM-dd"
        calendarStartDay={1}
        selected={dateValue}
        onChange={handleChange}
      />
    </div>
  );
}
