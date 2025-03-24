(function (chrome) {
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
      .filter((line) => !!line)
      .join("\n");
    const usingAllowList = document.getElementById("radio-allow").checked;

    await chrome.storage.sync.set({
      enabled,
      allowOrBlockList: list,
      usingAllowList,
    });

    document.getElementById("status").innerHTML = "Saved";

    setTimeout(function () {
      // Clear the status after 750ms
      document.getElementById("status").innerHTML = "";

      // Re-enable the controls
      setControlsEnabled(true);

      // Close the options page
      window.close();

      // Notify the background script of the changes
      chrome.runtime.sendMessage({
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
    }, 750);
  }

  async function initializeOptions() {
    const items = await chrome.storage.sync.get({
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

    document.getElementById("radio-allow").addEventListener("change", (e) => {
      document.getElementById("allow-description").style.display = "block";
      document.getElementById("block-description").style.display = "none";
    });
    document.getElementById("radio-block").addEventListener("change", (e) => {
      document.getElementById("allow-description").style.display = "none";
      document.getElementById("block-description").style.display = "block";
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    document.getElementById("save").addEventListener("click", saveOptions);
    await initializeOptions();
  });
})(chrome);
