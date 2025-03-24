(function (_chrome) {
  let initialEnabled;
  let initialList;
  let initialUsingAllowList;

  function setControlsEnabled(enabled) {
    document.getElementById("check-enabled").disabled = !enabled;
    document.getElementById("radio-allow").disabled = !enabled;
    document.getElementById("radio-block").disabled = !enabled;
    document.getElementById("url-list").disabled = !enabled;
    document.getElementById("save").disabled = !enabled;
  }

  async function saveOptions() {
    setControlsEnabled(false);

    const enabled = document.getElementById("check-enabled").checked;
    const list = document
      .getElementById("url-list")
      .value.split("\n")
      .map((line) => line.trim())
      .filter((line) => !!line)
      .join("\n");
    const usingAllowList = document.getElementById("radio-allow").checked;

    await _chrome.storage.sync.set({
      enabled,
      allowOrBlockList: list,
      usingAllowList,
    });

    document.getElementById("status").innerHTML = "Options saved.";

    // We want to show the status for a bit before closing the options page
    setTimeout(function () {
      // Clear the status after 750ms
      document.getElementById("status").innerHTML = "";

      // Re-enable the controls
      setControlsEnabled(true);

      // Close the options page
      window.close();
    }, 750);

    // Notify the background script of the changes
    await _chrome.runtime.sendMessage({
      command: "update-settings",
      data: {
        initial: {
          enabled: initialEnabled,
          allowOrBlockList: initialList,
          usingAllowList: initialUsingAllowList,
        },
        current: {
          enabled,
          allowOrBlockList: list,
          usingAllowList,
        },
      },
    });
  }

  async function initializeOptions() {
    const items = await _chrome.storage.sync.get({
      enabled: true,
      allowOrBlockList: "",
      usingAllowList: true,
    });

    initialEnabled = items.enabled;
    initialList = items.allowOrBlockList;
    initialUsingAllowList = items.usingAllowList;

    document.getElementById("check-enabled").checked = items.enabled;
    document.getElementById("url-list").value = items.allowOrBlockList;
    document.getElementById("radio-allow").checked = items.usingAllowList;
    document.getElementById("radio-block").checked = !items.usingAllowList;

    if (items.usingAllowList) {
      document.getElementById("allow-description").style.display = "block";
      document.getElementById("block-description").style.display = "none";
    } else {
      document.getElementById("allow-description").style.display = "none";
      document.getElementById("block-description").style.display = "block";
    }

    setControlsEnabled(true);

    document.getElementById("radio-allow").addEventListener("change", () => {
      document.getElementById("allow-description").style.display = "block";
      document.getElementById("block-description").style.display = "none";
    });
    document.getElementById("radio-block").addEventListener("change", () => {
      document.getElementById("allow-description").style.display = "none";
      document.getElementById("block-description").style.display = "block";
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    document.getElementById("save").addEventListener("click", saveOptions);
    await initializeOptions();
  });
})(window.chrome);
