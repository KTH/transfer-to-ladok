import React from "react";
import { GradesDestination, Sections } from "t2l-backend/src/types";

import "./ModuleSelector.scss";

export default function ModuleSelector({
  sections,
  onSelect,
}: {
  sections: Sections;
  onSelect(destination: GradesDestination): void;
}) {
  return (
    <div className="ModuleSelector">
      <header>
        <h2>Select a module</h2>
        <p>Select which module in Ladok you want to transfer results to</p>
      </header>
      {sections.aktivitetstillfalle.length > 0 && (
        <section>
          <ul>
            {sections.aktivitetstillfalle.map((a) => (
              <a
                href=""
                onClick={(e) => {
                  e.preventDefault();
                  onSelect({
                    aktivitetstillfalle: a.id,
                  });
                }}
              >
                {a.name}
              </a>
            ))}
          </ul>
        </section>
      )}
      {sections.kurstillfalle.map((ktf) => (
        <section>
          <h3>
            {ktf.courseCode} ({ktf.roundCode})
          </h3>
          <ul>
            {ktf.modules.map((m) => (
              <li>
                <a
                  href=""
                  onClick={(e) => {
                    e.preventDefault();
                    onSelect({
                      kurstillfalle: ktf.id,
                      utbildningsinstans: m.utbildningsinstans,
                    });
                  }}
                >
                  {m.code}
                  <small>{m.name}</small>
                </a>
              </li>
            ))}
            <li>
              <a
                href=""
                onClick={(e) => {
                  e.preventDefault();
                  onSelect({
                    kurstillfalle: ktf.id,
                    utbildningsinstans: ktf.utbildningsinstans,
                  });
                }}
              >
                Final grade
              </a>
            </li>
          </ul>
        </section>
      ))}
    </div>
  );
}
