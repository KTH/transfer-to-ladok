import sectionsHandler from "./sections";

// Test: it works with courses without sections
test("It works in courses without sections", () => {
  expect(process.env.CANVAS_API_URL).toBe("http://canvas.dev");
});

// Test: works with courses without "Ladok" sections
// Test: works with courses with AKT sections
// Test: works with courses with KTF sections
// Error handling:
// Test: 404 if course does not exist
// Test: ??? if Canvas returns a 40x
// Test: ??? if Canvas returns a 50x
// Test: ??? if Ladok returns a 40x
// Test: ??? if Ladok returns a 50x
