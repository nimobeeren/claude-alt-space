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

// Find the Claude tab if one is already open
let tabs = JSON.parse(execSync("chrome-cli list tabs").toString()).tabs;
let claudeTab = tabs.find((tab) => tab.url.startsWith("https://claude.ai/new"));

// If there is a Claude tab open, get its info. Otherwise, open Claude in a new
// window.
let claudeTabInfo;
if (claudeTab) {
  claudeTabInfo = JSON.parse(execSync(`chrome-cli info -t ${claudeTab.id}`));
} else {
  claudeTabInfo = JSON.parse(
    execSync("chrome-cli open 'https://claude.ai/' -n").toString()
  );
}

// Wait for the tab to be loaded, then execute the script
let interval = setInterval(() => {
  if (claudeTabInfo.loading) {
    claudeTabInfo = JSON.parse(
      execSync(`chrome-cli info -t ${claudeTabInfo.id}`)
    );
  } else {
    clearInterval(interval);
    executeScript();
  }
}, 100);

function executeScript() {
  const script = async function (prompt) {
    // Wait for prompt element to be on the page
    let promptElement;
    await new Promise((resolve) => {
      let interval = setInterval(() => {
        promptElement = document.querySelector(
          '[aria-label="Write your prompt to Claude"] > div'
        );
        if (promptElement) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });

    // Set the prompt
    const p = document.createElement("p");
    p.textContent = prompt;
    promptElement.replaceChildren(p);

    // Wait for submit button to be on the page
    let submitButton;
    await new Promise((resolve) => {
      let interval = setInterval(() => {
        submitButton = document.querySelector('[aria-label="Send Message"]');
        if (submitButton) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });

    // Submit the prompt
    submitButton.click();
  };

  const functionString = script.toString().replaceAll(`'`, `'"'"'`); // escape single quotes for bash
  const promptString = prompt.replaceAll(`'`, `'"'"'`); // TODO: escape double quotes?
  execSync(
    `chrome-cli execute '(${functionString})("${promptString}")' -t ${claudeTabInfo.id}`
  );
}
