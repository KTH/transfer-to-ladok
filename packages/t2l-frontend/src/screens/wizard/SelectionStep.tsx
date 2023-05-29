import React from "react";
import DatePicker from "react-datepicker";

export default function SelectionStep() {
  return (
    <div>
      <h1>Select assignment and date</h1>
      <p>
        In this step you map a Canvas assignment to a Ladok module or
        examination.
      </p>

      <h2>Canvas assignment</h2>
      <p>Only letter grades will be transferred to Ladok: A-F grades or P/F</p>

      <h2>Ladok module</h2>
      <p>To which module do you want the grades to be transferred</p>

      <h2>Examination date</h2>
      <p>
        All affected grades will receive the same Examination Date. To set a
        different date on an individual level, change it in Ladok after
        transferring.
      </p>
      <DatePicker
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        onChange={() => {}}
        dateFormat="yyyy-MM-dd"
        calendarStartDay={1}
      />

      <button>Continue</button>
    </div>
  );
}
