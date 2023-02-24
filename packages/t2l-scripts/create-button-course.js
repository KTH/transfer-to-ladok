// @ts-check
const inquirer = require("inquirer");
const Canvas = require("@kth/canvas-api").default;

async function start() {
  console.log(
    'This is the "create-button-course" script.\n\n' +
      "Here you will create or edit a button for the Transfer to Ladok app\n" +
      "in one course. It means that the button is visible only there\n\n" +
      'If you want to use the app in an account, use "create-button" instead'
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
  const { courseId } = await inquirer.prompt({
    name: "courseId",
    message: "Write the course ID",
  });

  const { body: course } = await canvas.get(`courses/${courseId}`);

  console.log(`Course: ${course.name} (${course.id})`);
  console.log();

  const tools = (
    await canvas.get(`courses/${courseId}/external_tools?per_page=100`)
  ).body.map((tool) => ({
    short: tool.id,
    name: `Edit the button "${tool.name}" (${tool.url})`,
    value: tool.id,
  }));

  tools.unshift(new inquirer.Separator());
  tools.unshift({
    short: "new",
    name: "Create a new button",
    value: "new",
  });

  const { buttonId } = await inquirer.prompt({
    type: "list",
    name: "buttonId",
    message: "Choose a button to edit or create a new one",
    choices: tools,
  });

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
    defaultName = "Transfer to Ladok - localdev.kth.se";
  } else if (
    buttonUrl === "https://app-r.referens.sys.kth.se/transfer-to-ladok"
  ) {
    defaultName = "Transfer to Ladok - referens";
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

  if (buttonId === "new") {
    console.log();
    console.log(JSON.stringify(body, null, 2));
    console.log();
    console.log("You are going to make a POST request");
    console.log(`to ${canvasRoot}api/v1/courses/${courseId}/external_tools`);
    console.log("with the body printed above");
    const { proceed } = await inquirer.prompt({
      type: "confirm",
      name: "proceed",
      message: `Is it correct?`,
    });

    if (!proceed) return;

    await canvas.requestUrl(`courses/${courseId}/external_tools`, "POST", body);

    console.log(
      `New button created. You can see it in any course at ${canvasRoot}courses/${courseId}`
    );
  } else {
    console.log();
    console.log(JSON.stringify(body, null, 2));
    console.log();
    console.log("You are going to make a PUT request");
    console.log(
      `to ${canvasRoot}api/v1/courses/${courseId}/external_tools/${buttonId}`
    );
    console.log("with the body printed above");
    const { proceed } = await inquirer.prompt({
      type: "confirm",
      name: "proceed",
      message: `Is it correct?`,
    });

    if (!proceed) return;

    await canvas.requestUrl(
      `courses/${courseId}/external_tools/${buttonId}`,
      "PUT",
      body
    );

    console.log(
      `Button edited. You can see it in any course at ${canvasRoot}courses/${courseId}`
    );
  }
}

start();
