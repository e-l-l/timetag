// Content script that runs on web pages
console.log("TimeTag extension content script loaded");

// Function to get all text content from the page
function getPageContent() {
  return {
    url: window.location.href,
    title: document.title,
    bodyText: document.body.innerText,
    html: document.documentElement.outerHTML,
  };
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getPageContent") {
    const content = getPageContent();
    sendResponse(content);
  }
});
