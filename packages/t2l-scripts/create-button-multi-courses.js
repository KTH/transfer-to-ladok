// @ts-check
const inquirer = require("inquirer");
const Canvas = require("@kth/canvas-api").default;

/** Course IDs to install the app */
const courseIds = [
  // Linda:
  34769, 34768, 35088, 35292, 35087, 36066, 35714, 38003, 37553, 37555, 37008,
  // Nihad:
  35116, 37743,
];

async function start() {
  console.log(
    'This is the "create-button-multi-course" script.\n\n' +
      `Here you will add Transfer to Ladok to a given set of ${courseIds.length} courses.\n` +
      "It means that the button is visible to them.\n\n" +
      "Edit this file to change the list of courses\n\n" +
      "Use 'create-button-course' or 'create-button-account' for installing the\n" +
      "for installing the app in one course or account"
  );

  const { answer } = await inquirer.prompt({
    type: "confirm",
    message: "Do you want to continue?",
    name: "answer",
  });

  if (!answer) return;

  const { canvasRoot } = await inquirer.prompt({
    type: "list",
    name: "canvasRoot",
    message: "Select a Canvas instance",
    choices: [
      {
        name: "Canvas test (kth.test.instructure.com)",
        value: "https://kth.test.instructure.com/",
        short: "test",
      },
      {
        name: "Canvas beta (kth.beta.instructure.com)",
        value: "https://kth.beta.instructure.com/",
        short: "beta",
      },
      {
        name: "Canvas production (canvas.kth.se)",
        value: "https://canvas.kth.se/",
        short: "production",
      },
    ],
  });

  console.log();
  console.log(`Go to ${canvasRoot}profile/settings to get a Canvas API token.`);

  const { canvasApiToken } = await inquirer.prompt({
    name: "canvasApiToken",
    message: `Paste the API token here`,
    type: "password",
  });

  const canvas = new Canvas(`${canvasRoot}api/v1`, canvasApiToken);

  const { buttonUrl } = await inquirer.prompt({
    type: "list",
    name: "buttonUrl",
    message: "What application do you want to open with the button?",
    choices: [
      {
        name: "localdev.kth.se",
        value: "https://localdev.kth.se:4443/transfer-to-ladok",
      },
      {
        name: "stage (referens)",
        value: "https://app-r.referens.sys.kth.se/transfer-to-ladok",
      },
      {
        name: "production (app.kth.se)",
        value: "https://app.kth.se/transfer-to-ladok",
      },
    ],
  });

  let defaultName = "KTH Transfer to Ladok 2.0 (beta)";

  if (buttonUrl === "https://localdev.kth.se:4443/transfer-to-ladok") {
    defaultName = "Transfer to Ladok 2.0 - localdev.kth.se";
  } else if (
    buttonUrl === "https://app-r.referens.sys.kth.se/transfer-to-ladok"
  ) {
    defaultName = "Transfer to Ladok 2.0 - referens";
  }

  const { buttonName } = await inquirer.prompt({
    name: "buttonName",
    message: "Write a name for the button",
    default: defaultName,
  });

  const body = {
    name: buttonName,
    consumer_key: "not_used",
    shared_secret: "not_used",
    url: buttonUrl,
    privacy_level: "public",
    course_navigation: {
      enabled: true,
      text: buttonName,
      visibility: "admins",
      windowTarget: "_self",
    },
    custom_fields: {
      domain: "$Canvas.api.domain",
      courseId: "$Canvas.course.id",
    },
  };

  console.log();
  console.log(JSON.stringify(body, null, 2));
  console.log();
  console.log("You are going to make a POST request");
  console.log(`to ${canvasRoot}api/v1/courses/<courseId>/external_tools`);
  console.log(`to ${courseIds.length} courses`);
  console.log("with the body printed above");
  const { proceed } = await inquirer.prompt({
    type: "confirm",
    name: "proceed",
    message: `Is it correct?`,
  });

  if (!proceed) return;

  for (const course of courseIds) {
    await canvas.requestUrl(`courses/${course}/external_tools`, "POST", body);
    console.log(`New button created in ${canvasRoot}courses/${course}`);
  }
}

start();
