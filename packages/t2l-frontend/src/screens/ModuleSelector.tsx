import React from "react";
import { GradesDestination, Sections } from "t2l-backend/src/types";

export default function ModuleSelector({
  sections,
  onSelect,
}: {
  sections: Sections;
  onSelect(destination: GradesDestination): void;
}) {
  return (
    <div>
      <h2>Select which module in Ladok you want to transfer results to</h2>
      {sections.aktivitetstillfalle.length > 0 && <h3>Examinations</h3>}
      {sections.kurstillfalle.map((ktf) => (
        <section>
          <h3>{ktf.code}</h3>
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
                  {m.code} {m.name}
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
