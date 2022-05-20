import React from "react";
import { GradesDestination } from "t2l-backend";
import MockedTable from "../components/MockedTable";
import { useAssignments } from "../hooks/apiClient";
import { ArrowRight } from "../utils/icons";
import "./Preview.scss";

interface Params {
  destination: GradesDestination;
}

function AssignmentSelector() {
  const assignmentsQuery = useAssignments();
  if (assignmentsQuery.isLoading) {
    return (
      <select disabled>
        <option>Loading assignments...</option>
      </select>
    );
  }

  if (assignmentsQuery.isSuccess) {
    return (
      <select>
        {assignmentsQuery.data.map((a) => (
          <option>{a.name}</option>
        ))}
      </select>
    );
  }

  return <select></select>;
}

export default function Preview({ destination }: Params) {
  return (
    <div className="Preview">
      <header>
        <div>Select a Canvas assignment to transfer to the Ladok module</div>
        <div className="assignment">
          <AssignmentSelector />
          <ArrowRight />
          <div className="destination">ME1039 TENA: 2021-06-08</div>
        </div>
        <div className="date-selection">
          <div className="label">Options for examination date</div>
          <ul className="options">
            <li>
              <input type="radio" id="D" />
              <label htmlFor="D">Same as submission date in assignment</label>
            </li>
            <li>
              <input type="radio" id="E" />
              <label htmlFor="E">Manual input</label>
            </li>
          </ul>
        </div>
      </header>
      <main>
        <MockedTable />
        <div className="overlay">
          <div>
            Choose an assignment to see a preview of what is going to be
            transferred
          </div>
        </div>
      </main>
      <footer>
        <button>Transfer to Ladok</button>
      </footer>
    </div>
  );
}
