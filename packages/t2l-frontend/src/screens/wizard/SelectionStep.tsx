import React from "react";
import DatePicker from "react-datepicker";

export default function SelectionStep() {
  return (
    <div>
      <h1>Select assignment and date</h1>
      <p>
        To be able to transfer grades from Canvas to Ladok, you need to map a
        Canvas assignment to a Ladok module or examination. Please select both a
        Canvas assignment as source, a Ladok module as target and an examination
        date for the grades to be transfered, before you can proceed.
      </p>

      <h2>Canvas assignment</h2>
      <p>Only letter grades will be transferred to Ladok: A-F grades or P/F</p>

      <h2>Ladok module</h2>
      <p>To which module do you want the grades to be transferred</p>

      <h2>Examination date</h2>
      <p>
        When transferring to Ladok, all affected grades will receive the same
        Examination Date. If you need to set a different date on an individual
        level, please change it in Ladok after transferring.
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
