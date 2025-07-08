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

// Also expose a function to get price-related elements
function findPriceElements() {
  // Common selectors for price elements
  const priceSelectors = [
    ".price",
    ".Price",
    '[class*="price"]',
    '[class*="Price"]',
    ".cost",
    ".Cost",
    '[class*="cost"]',
    '[class*="Cost"]',
    ".amount",
    ".Amount",
    '[class*="amount"]',
    '[class*="Amount"]',
    ".value",
    ".Value",
    '[class*="value"]',
    '[class*="Value"]',
    // Currency patterns
    'span:contains("$")',
    'div:contains("$")',
    'p:contains("$")',
  ];

  const priceElements = [];

  // Search for elements with price-related classes
  priceSelectors.forEach((selector) => {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => {
        if (element.textContent.match(/\$[\d,]+\.?\d*/)) {
          priceElements.push({
            text: element.textContent,
            tagName: element.tagName,
            className: element.className,
            id: element.id,
          });
        }
      });
    } catch (e) {
      // Skip invalid selectors
    }
  });

  // Also search for any text containing dollar amounts
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  let node;
  while ((node = walker.nextNode())) {
    const text = node.textContent.trim();
    if (text.match(/\$[\d,]+\.?\d*/)) {
      const parent = node.parentElement;
      priceElements.push({
        text: text,
        tagName: parent.tagName,
        className: parent.className,
        id: parent.id,
        fullText: parent.textContent,
      });
    }
  }

  return priceElements;
}

// Add message listener for price elements
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "findPrices") {
    const prices = findPriceElements();
    sendResponse(prices);
  }
});
