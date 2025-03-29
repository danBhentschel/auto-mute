(function (_chrome) {
  let initialEnabled;
  let initialList;
  let initialUsingAllowList;
  let initialIconType;
  let initialIconColor;

  function setControlsEnabled(enabled) {
    document.getElementById("check-enabled").disabled = !enabled;
    document.getElementById("radio-allow").disabled = !enabled;
    document.getElementById("radio-block").disabled = !enabled;
    document.getElementById("url-list").disabled = !enabled;
    document.getElementById("save").disabled = !enabled;
    document.getElementById("radio-static-icon").disabled = !enabled;
    document.getElementById("radio-context-icon").disabled = !enabled;
    document.getElementById("radio-black-icon").disabled = !enabled;
    document.getElementById("radio-white-icon").disabled = !enabled;
    document.getElementById("radio-system-icon").disabled = !enabled;
  }

  function updateIconColorOptionsVisibility() {
    const isContextIcon = document.getElementById("radio-context-icon").checked;
    document.getElementById("icon-color-options").style.display = isContextIcon
      ? "block"
      : "none";
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
    const iconType = document.getElementById("radio-static-icon").checked
      ? "static"
      : "context";

    let iconColor = "black"; // Default
    if (iconType === "context") {
      if (document.getElementById("radio-white-icon").checked) {
        iconColor = "white";
      } else if (document.getElementById("radio-system-icon").checked) {
        iconColor = "system";
      }
    }

    await _chrome.storage.sync.set({
      enabled,
      allowOrBlockList: list,
      usingAllowList,
      iconType,
      iconColor,
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
          iconType: initialIconType,
          iconColor: initialIconColor,
        },
        current: {
          enabled,
          allowOrBlockList: list,
          usingAllowList,
          iconType,
          iconColor,
        },
      },
    });
  }

  async function initializeOptions() {
    const items = await _chrome.storage.sync.get({
      enabled: true,
      allowOrBlockList: "",
      usingAllowList: true,
      iconType: "static",
      iconColor: "system",
    });

    initialEnabled = items.enabled;
    initialList = items.allowOrBlockList;
    initialUsingAllowList = items.usingAllowList;
    initialIconType = items.iconType;
    initialIconColor = items.iconColor;

    document.getElementById("check-enabled").checked = items.enabled;
    document.getElementById("url-list").value = items.allowOrBlockList;
    document.getElementById("radio-allow").checked = items.usingAllowList;
    document.getElementById("radio-block").checked = !items.usingAllowList;

    // Set icon type radio buttons
    document.getElementById("radio-static-icon").checked =
      items.iconType === "static";
    document.getElementById("radio-context-icon").checked =
      items.iconType === "context";

    // Set icon color radio buttons
    document.getElementById("radio-black-icon").checked =
      items.iconColor === "black";
    document.getElementById("radio-white-icon").checked =
      items.iconColor === "white";
    document.getElementById("radio-system-icon").checked =
      items.iconColor === "system";

    // Show/hide icon color options based on selected icon type
    updateIconColorOptionsVisibility();

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

    // Add event listeners for icon type radio buttons
    document
      .getElementById("radio-static-icon")
      .addEventListener("change", updateIconColorOptionsVisibility);
    document
      .getElementById("radio-context-icon")
      .addEventListener("change", updateIconColorOptionsVisibility);
  }

  document.addEventListener("DOMContentLoaded", async () => {
    document.getElementById("save").addEventListener("click", saveOptions);
    await initializeOptions();
  });
})(window.chrome);
