import React from "react";
import { ArrowRight } from "../utils/icons";
import "./Preview.scss";

export default function Preview() {
  return (
    <div className="Preview">
      <header>
        <div>Select a Canvas assignment to transfer to the Ladok module</div>
        <div className="assignment">
          <select>
            <option>Select an assignment</option>
          </select>
          <ArrowRight />
          <div className="destination">ME1039 TENA: 2021-06-08</div>
        </div>
        <div className="date">
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
        <table>
          <tr>
            <td>Mocked student</td>
          </tr>
        </table>
        <div>
          Choose an assignment to see a preview of what is going to be
          transferred
        </div>
      </main>
    </div>
  );
}
