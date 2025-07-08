// Popup script for TimeTag extension

document.addEventListener("DOMContentLoaded", function () {
  const getContentBtn = document.getElementById("getContent");
  const findPricesBtn = document.getElementById("findPrices");
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

  // Find price elements button
  findPricesBtn.addEventListener("click", async () => {
    output.innerHTML = "Searching for prices...";

    const prices = await sendMessageToContentScript("findPrices");

    if (prices && prices.length > 0) {
      let priceHtml = `<strong>Found ${prices.length} price elements:</strong><br><br>`;
      prices.forEach((price, index) => {
        priceHtml += `
          <strong>${index + 1}.</strong> ${price.text}<br>
          <em>Tag:</em> ${price.tagName}, <em>Class:</em> ${
          price.className
        }<br><br>
        `;
      });
      output.innerHTML = priceHtml;
    } else {
      output.innerHTML = "No price elements found on this page.";
    }
  });
});
