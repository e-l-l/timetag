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

// Function to inject hours display into the HTML
function injectHoursDisplay(priceElement, hours) {
  // Check if we already added a time display to this element
  const existingTimeDisplay = priceElement.parentElement.querySelector(
    ".timetag-hours-display"
  );
  if (existingTimeDisplay) {
    // Update existing display
    existingTimeDisplay.textContent = `${hours.toFixed(2)} hours`;
    return;
  }

  // Create the hours display element
  const timeDisplay = document.createElement("div");
  timeDisplay.className = "timetag-hours-display";
  timeDisplay.textContent = `${hours.toFixed(2)} hours`;
  timeDisplay.style.cssText = `
    color:rgb(103, 48, 255);
    font-size: 0.75em;
    margin-top: 2px;
    font-style: italic;
  `;

  // Insert the display after the price element
  // Try to insert after the price element itself, or after its parent if needed
  const insertAfter = priceElement.nextSibling || priceElement.parentElement;
  if (insertAfter) {
    insertAfter.parentNode.insertBefore(timeDisplay, insertAfter.nextSibling);
  } else {
    // Fallback: append to the price element's parent
    priceElement.parentElement.appendChild(timeDisplay);
  }

  // Mark this price element as processed to prevent infinite loops
  priceElement.setAttribute("data-timetag-processed", "true");
}

// Function to find and extract prices from a-price-whole elements
function findAndExtractPrices() {
  const priceElements = document.querySelectorAll(".a-price-whole");

  if (priceElements.length === 0) {
    return;
  }

  priceElements.forEach((element, index) => {
    // Skip if already processed
    if (element.hasAttribute("data-timetag-processed")) {
      return;
    }

    const price = extractPriceFromElement(element);
    const originalText = element.textContent || element.innerText || "";

    if (price !== null) {
      const hours = price / RUPEES_PER_HOUR;

      // Inject the hours display into the HTML
      injectHoursDisplay(element, hours);
    } else {
      console.log("Could not extract numeric value from: ", originalText);
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
      mutation.type === "childList" &&
      mutation.addedNodes.length > 0 &&
      // Only trigger if the added nodes contain price elements or are not our own injected elements
      Array.from(mutation.addedNodes).some((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Skip if it's our own injected element
          if (
            node.classList &&
            node.classList.contains("timetag-hours-display")
          ) {
            return false;
          }
          // Check if it contains price elements
          return node.querySelector && node.querySelector(".a-price-whole");
        }
        return false;
      })
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
