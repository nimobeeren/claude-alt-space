#!/usr/bin/env node

// Required parameters:
// @raycast.schemaVersion 1
// @raycast.title Claude Prompt
// @raycast.mode silent

// Optional parameters:
// @raycast.icon 🧠
// @raycast.argument1 { "type": "text", "placeholder": "prompt"}

// Documentation:
// @raycast.description Open Claude in Chrome browser and submit a prompt
// @raycast.author Nimo Beeren
// @raycast.authorURL https://github.com/nimobeeren

const { execSync } = require("child_process");

const prompt = process.argv[2];

process.env.OUTPUT_FORMAT = "json";

const { tabs } = JSON.parse(execSync("chrome-cli list tabs").toString());
let claudeTab = tabs.find((tab) => tab.url.startsWith("https://claude.ai/new"));
if (!claudeTab) {
  claudeTab = JSON.parse(
    execSync("chrome-cli open 'https://claude.ai/' -n").toString()
  );
}

const sendMessage = function (prompt) {
  // TODO: wait for page to load

  const p = document.createElement("p");
  p.textContent = prompt;
  document
    .querySelector('[aria-label="Write your prompt to Claude"] > div')
    .replaceChildren(p);

  setTimeout(() => {
    document.querySelector('[aria-label="Send Message"]').click();
  }, 1000);
};

const functionString = sendMessage.toString().replaceAll(`'`, `'"'"'`); // escape single quotes for bash
const promptString = prompt.replaceAll(`'`, `'"'"'`); // TODO: escape double quotes?
execSync(
  `chrome-cli execute '(${functionString})("${promptString}")' -t ${claudeTab.id}`
);
