// Content script that runs on web pages
console.log("TimeTag extension content script loaded");

// Conversion rate: rupees to hours
const RUPEES_PER_HOUR = 942.77;

// Function to extract numeric content from price elements
function extractPriceFromElement(element) {
  if (!element) return null;

  // Get the text content
  const textContent = element.textContent || element.innerText || "";

  // Remove commas and any non-numeric characters except decimal points
  const numericContent = textContent.replace(/[^\d.,]/g, "");

  // Handle different decimal separators (comma vs period)
  let price;
  if (numericContent.includes(",") && numericContent.includes(".")) {
    // Format like "1,234.56" - remove commas
    price = parseFloat(numericContent.replace(/,/g, ""));
  } else if (numericContent.includes(",")) {
    // Format like "1,234" or "1,234,56" - check if comma is decimal separator
    const parts = numericContent.split(",");
    if (parts.length === 2 && parts[1].length <= 2) {
      // Likely decimal separator (e.g., "1,234,56" -> 1234.56)
      price = parseFloat(parts[0] + "." + parts[1]);
    } else {
      // Likely thousands separator (e.g., "1,234" -> 1234)
      price = parseFloat(numericContent.replace(/,/g, ""));
    }
  } else {
    // Simple numeric format
    price = parseFloat(numericContent);
  }

  return isNaN(price) ? null : price;
}

// Function to find and extract prices from a-price-whole elements
function findAndExtractPrices() {
  const priceElements = document.querySelectorAll(".a-price-whole");

  if (priceElements.length === 0) {
    console.log(
      'TimeTag: No elements with class "a-price-whole" found on this page'
    );
    return;
  }

  console.log(`TimeTag: Found ${priceElements.length} price element(s)`);

  priceElements.forEach((element, index) => {
    const price = extractPriceFromElement(element);
    const originalText = element.textContent || element.innerText || "";

    if (price !== null) {
      const hours = price / RUPEES_PER_HOUR;
      console.log(
        `TimeTag: Price ${
          index + 1
        } - Original: "${originalText.trim()}" → ₹${price} → ${hours.toFixed(
          2
        )} hours`
      );
    } else {
      console.log(
        `TimeTag: Price ${
          index + 1
        } - Could not extract numeric value from: "${originalText.trim()}"`
      );
    }
  });
}

// Run the price extraction when the page loads
findAndExtractPrices();

// Also run when the DOM changes (for dynamic content)
const observer = new MutationObserver((mutations) => {
  // Check if any new nodes were added that might contain price elements
  const hasNewContent = mutations.some(
    (mutation) =>
      mutation.type === "childList" && mutation.addedNodes.length > 0
  );

  if (hasNewContent) {
    // Small delay to ensure new content is fully loaded
    setTimeout(findAndExtractPrices, 100);
  }
});

// Start observing DOM changes
observer.observe(document.body, {
  childList: true,
  subtree: true,
});

// Listen for messages from the popup (keeping for compatibility)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getPageContent") {
    // Return current page content if needed
    sendResponse({
      html: document.documentElement.outerHTML,
      prices: Array.from(document.querySelectorAll(".a-price-whole")).map(
        (el) => ({
          text: el.textContent || el.innerText || "",
          price: extractPriceFromElement(el),
        })
      ),
    });
  }
});
