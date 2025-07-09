// Popup script for TimeTag extension

document.addEventListener("DOMContentLoaded", function () {
  const salaryInput = document.getElementById("salary");
  const periodSelect = document.getElementById("period");
  const workDetailsDiv = document.getElementById("workDetails");
  const workDaysInput = document.getElementById("workDays");
  const workHoursInput = document.getElementById("workHours");
  const calculateBtn = document.getElementById("calculateBtn");
  const resultDiv = document.getElementById("result");
  const rateText = document.getElementById("rateText");
  const statusDiv = document.getElementById("status");

  // Load saved configuration on popup open
  loadSavedConfig();

  // Handle period change to show/hide work details
  periodSelect.addEventListener("change", function () {
    if (periodSelect.value === "month" || periodSelect.value === "year") {
      workDetailsDiv.classList.remove("hidden");
    } else {
      workDetailsDiv.classList.add("hidden");
    }
  });

  // Calculate button click handler
  calculateBtn.addEventListener("click", async () => {
    const salary = parseFloat(salaryInput.value);
    const period = periodSelect.value;

    if (!salary || salary <= 0) {
      showStatus("Please enter a valid salary amount", "error");
      return;
    }

    // Validate work details for monthly/yearly calculations
    if (period === "month" || period === "year") {
      const workDays = parseInt(workDaysInput.value);
      const workHours = parseInt(workHoursInput.value);

      if (!workDays || workDays <= 0 || workDays > 31) {
        showStatus("Please enter valid working days (1-31)", "error");
        return;
      }

      if (!workHours || workHours <= 0 || workHours > 24) {
        showStatus("Please enter valid working hours (1-24)", "error");
        return;
      }
    }

    // Calculate hourly rate based on period
    let hourlyRate;
    switch (period) {
      case "hour":
        hourlyRate = salary;
        break;
      case "month":
        const workDays = parseInt(workDaysInput.value);
        const workHours = parseInt(workHoursInput.value);
        hourlyRate = salary / (workHours * workDays);
        break;
      case "year":
        const workDaysYear = parseInt(workDaysInput.value);
        const workHoursYear = parseInt(workHoursInput.value);
        hourlyRate = salary / (workHoursYear * workDaysYear * 12);
        break;
      default:
        hourlyRate = salary;
    }

    // Save to Chrome storage
    const config = {
      hourlyRate: hourlyRate,
      salary: salary,
      period: period,
      workDays:
        period === "month" || period === "year"
          ? parseInt(workDaysInput.value)
          : null,
      workHours:
        period === "month" || period === "year"
          ? parseInt(workHoursInput.value)
          : null,
      lastUpdated: new Date().toISOString(),
    };

    try {
      await chrome.storage.sync.set({ timetagConfig: config });

      // Update the result display
      rateText.textContent = `₹${hourlyRate.toFixed(2)} per hour`;
      resultDiv.classList.remove("hidden");

      showStatus("Configuration saved successfully!", "success");

      // Notify content script to update the conversion rate
      await updateContentScriptRate(hourlyRate);
    } catch (error) {
      console.error("Error saving configuration:", error);
      showStatus("Error saving configuration", "error");
    }
  });

  // Load saved configuration
  async function loadSavedConfig() {
    try {
      const result = await chrome.storage.sync.get("timetagConfig");
      const config = result.timetagConfig;

      if (config) {
        salaryInput.value = config.salary || "";
        periodSelect.value = config.period || "hour";

        // Load work details if they exist
        if (config.workDays && config.workHours) {
          workDaysInput.value = config.workDays;
          workHoursInput.value = config.workHours;
        }

        // Show work details section if period requires it
        if (config.period === "month" || config.period === "year") {
          workDetailsDiv.classList.remove("hidden");
        }

        if (config.hourlyRate) {
          rateText.textContent = `₹${config.hourlyRate.toFixed(2)} per hour`;
          resultDiv.classList.remove("hidden");
        }
      }
    } catch (error) {
      console.error("Error loading configuration:", error);
    }
  }

  // Update content script with new rate
  async function updateContentScriptRate(hourlyRate) {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (tab) {
        await chrome.tabs.sendMessage(tab.id, {
          action: "updateRate",
          hourlyRate: hourlyRate,
        });
      }
    } catch (error) {
      console.error("Error updating content script:", error);
    }
  }

  // Show status message
  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.classList.remove("hidden");

    // Hide status after 3 seconds
    setTimeout(() => {
      statusDiv.classList.add("hidden");
    }, 3000);
  }
});
