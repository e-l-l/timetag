// Popup script for TimeTag extension

document.addEventListener("DOMContentLoaded", function () {
  const getContentBtn = document.getElementById("getContent");
  const output = document.getElementById("output");

  // Function to get the active tab
  async function getActiveTab() {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    return tab;
  }

  // Function to send message to content script
  async function sendMessageToContentScript(action) {
    try {
      const tab = await getActiveTab();
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: action,
      });
      return response;
    } catch (error) {
      console.error("Error sending message to content script:", error);
      return null;
    }
  }

  // Get page content button
  getContentBtn.addEventListener("click", async () => {
    output.innerHTML = "Loading...";

    const content = await sendMessageToContentScript("getPageContent");

    if (content) {
      output.innerHTML = `
        <strong>Page Content:</strong><br>
        <strong>URL:</strong> ${content.url}<br>
        <strong>Title:</strong> ${content.title}<br>
        <strong>Body Text (first 200 chars):</strong> ${content.bodyText.substring(
          0,
          200
        )}...<br>
        <strong>HTML Length:</strong> ${content.html.length} characters
      `;
    } else {
      output.innerHTML =
        "Error: Could not access page content. Make sure you are on a webpage.";
    }
  });
});
