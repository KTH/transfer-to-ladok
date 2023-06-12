import { formatDate, parseDate } from "./ExaminationDateSelect";

describe("formatDate", () => {
  test("formats a date correctly", () => {
    const date = new Date("2022-01-01T00:00:00");
    const formattedDate = formatDate(date);
    expect(formattedDate).toBe("2022-01-01");
  });
});

describe("parseDate", () => {
  test("parses a date correctly", () => {
    const str = "2022-01-01";
    const date = parseDate(str);
    expect(date.toISOString()).toBe("2022-01-01T00:00:00.000");
  });
});
