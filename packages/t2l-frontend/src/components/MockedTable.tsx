import React from "react";
import "./GradesTable.scss";

const students = [
  "Ahmed, Cecilia",
  "Bengtsson, Klara",
  "Berglund, Kristina",
  "Bergström, Erik",
  "Bergström, Sven",
  "Björklund, Sara",
  "Blom, Anette",
  "Claesson, Johan",
  "Ekström, Viktoria",
  "Falk, Mona",
  "Forsberg, Maja",
  "Fredriksson, Pontus",
  "Gunnarsson, Emilia",
  "Gunnarsson, Liam",
  "Hansson, Karolina",
  "Henriksson, Olivia",
  "Holmgren, Göran",
  "Isaksson, David",
  "Jakobsson, Louise",
  "Lindström, Jonathan",
];

export default function MockedTable() {
  return (
    <div style={{ height: 240, overflow: "hidden" }}>
      <table className="GradesTable mocked">
        <thead>
          <tr>
            <th></th>
            <th>Student</th>
            <th>Grade</th>
            <th>Examination date</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, i) => (
            <tr>
              <td className="id">{i + 1}</td>
              <td className="name">{student}</td>
              <td className="grade">C</td>
              <td className="date">2021-01-01</td>
              <td>Will not be transferred</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
