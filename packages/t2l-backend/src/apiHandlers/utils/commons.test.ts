import { splitSections } from "./commons";

describe("splitSections", () => {
  it("should ignore non-Ladok sections", () => {
    const input = [
      {
        name: "Section 1",
        sis_section_id: "app.katalog3.T",
        integration_id: null,
      },
      {
        name: "Section 2",
        sis_section_id: "vuvuvu",
        integration_id: null,
      },
    ];
    const expected = {
      aktivitetstillfalleIds: [],
      kurstillfalleIds: [],
    };
    const actual = splitSections(input);
    expect(actual).toEqual(expected);
  });

  it("should return work with cross-listed courserooms", () => {
    const input = [
      {
        name: "Section 1",
        sis_section_id: "2d4c09d8-1462-48da-add9-13cae41decca",
        integration_id: null,
      },
      {
        name: "Section 2",
        sis_section_id: "f91b3974-38ec-4716-8f1b-5658cc945578",
        integration_id: null,
      },
    ];
    const expected = {
      aktivitetstillfalleIds: [],
      kurstillfalleIds: [
        "2d4c09d8-1462-48da-add9-13cae41decca",
        "f91b3974-38ec-4716-8f1b-5658cc945578",
      ],
    };
    const actual = splitSections(input);
    expect(actual).toEqual(expected);
  });

  it("should return work with cross-listed courserooms that contain manual sections", () => {
    const input = [
      {
        name: "Section 1",
        sis_section_id: "2d4c09d8-1462-48da-add9-13cae41decca",
        integration_id: null,
      },
      {
        name: "Section 2",
        sis_section_id: "f91b3974-38ec-4716-8f1b-5658cc945578",
        integration_id: null,
      },
      {
        name: "Section 3",
        sis_section_id: null,
        integration_id: null,
      },
    ];
    const expected = {
      aktivitetstillfalleIds: [],
      kurstillfalleIds: [
        "2d4c09d8-1462-48da-add9-13cae41decca",
        "f91b3974-38ec-4716-8f1b-5658cc945578",
      ],
    };
    const actual = splitSections(input);
    expect(actual).toEqual(expected);
  });

  it("should treat 'suffixed' sections in examrooms as equal", () => {
    const input = [
      {
        name: "Section 1",
        sis_section_id: "AKT.d90616d4-9641-46c7-b781-759d73c28398",
        integration_id: null,
      },
      {
        name: "Section 2",
        sis_section_id: "AKT.d90616d4-9641-46c7-b781-759d73c28398.suffix",
        integration_id: null,
      },
    ];
    const expected = {
      aktivitetstillfalleIds: ["d90616d4-9641-46c7-b781-759d73c28398"],
      kurstillfalleIds: [],
    };
    const actual = splitSections(input);
    expect(actual).toEqual(expected);
  });

  it("should work for mixed courseroom/examroom", () => {
    const input = [
      {
        name: "Section 1",
        sis_section_id: "AKT.2d4c09d8-1462-48da-add9-13cae41decca",
        integration_id: null,
      },
      {
        name: "Section 2",
        sis_section_id: "f91b3974-38ec-4716-8f1b-5658cc945578",
        integration_id: null,
      },
    ];
    const expected = {
      aktivitetstillfalleIds: ["2d4c09d8-1462-48da-add9-13cae41decca"],
      kurstillfalleIds: ["f91b3974-38ec-4716-8f1b-5658cc945578"],
    };
    const actual = splitSections(input);
    expect(actual).toEqual(expected);
  });
});
