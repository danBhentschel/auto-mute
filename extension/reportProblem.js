(function (_chrome) {
  document.addEventListener("DOMContentLoaded", async () => {
    const debugInfoResponse = await _chrome.runtime.sendMessage({
      command: "query-debug-info",
    });
    const debugInfo = debugInfoResponse?.debugInfo;

    const debugInfoElement = document.getElementById("debug-info");
    if (debugInfo) {
      debugInfoElement.textContent = debugInfo;
      debugInfoElement.style.whiteSpace = "pre-wrap";
    } else {
      console.error("Failed to retrieve debug info.");
      debugInfoElement.textContent = "Failed to retrieve debug info.";
    }

    // Copy to clipboard button
    const copyBtn = document.getElementById("copy-btn");
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(debugInfo);
        copyBtn.textContent = "Copied";
        setTimeout(() => {
          copyBtn.textContent = "Copy";
        }, 2000);
      } catch (err) {
        console.error("Failed to copy debug info:", err);
      }
    });
  });
})(window.chrome);
