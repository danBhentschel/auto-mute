(function (_chrome) {
  let isFirefox = typeof InstallTrigger !== "undefined";

  async function muteAllTabs() {
    window.close();
    await _chrome.runtime.sendMessage({ command: "mute-all" });
  }

  async function muteOtherTabs() {
    window.close();
    await _chrome.runtime.sendMessage({ command: "mute-other" });
  }

  async function muteCurrentTab() {
    window.close();
    await _chrome.runtime.sendMessage({ command: "mute-tab" });
  }

  async function listCurrentPage() {
    window.close();
    await _chrome.runtime.sendMessage({ command: "list-page" });
  }

  async function listDomain() {
    window.close();
    await _chrome.runtime.sendMessage({ command: "list-domain" });
  }

  async function showOptions() {
    window.close();
    let url = "chrome://extensions/?options=" + _chrome.runtime.id;
    if (isFirefox) {
      url = "about:addons";
    }
    await _chrome.tabs.create({ url: url });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    document
      .getElementById("autoMuteBrowserActionMuteAll")
      .addEventListener("click", muteAllTabs);
    document
      .getElementById("autoMuteBrowserActionMuteOther")
      .addEventListener("click", muteOtherTabs);
    document
      .getElementById("autoMuteBrowserActionMuteTab")
      .addEventListener("click", muteCurrentTab);
    document
      .getElementById("autoMuteBrowserActionListPage")
      .addEventListener("click", listCurrentPage);
    document
      .getElementById("autoMuteBrowserActionListDomain")
      .addEventListener("click", listDomain);

    if (isFirefox) {
      document.getElementById(
        "autoMuteBrowserActionShowOptions"
      ).style.display = "none";
    } else {
      document
        .getElementById("autoMuteBrowserActionShowOptions")
        .addEventListener("click", showOptions);
    }
    const usingAllowListResponse = await _chrome.runtime.sendMessage({
      command: "query-using-should-allow-list",
    });
    const pageInListResponse = await _chrome.runtime.sendMessage({
      command: "query-page-listed",
    });
    const domainInListResponse = await _chrome.runtime.sendMessage({
      command: "query-domain-listed",
    });
    if (usingAllowListResponse && pageInListResponse) {
      document.getElementById(
        "autoMuteBrowserActionPageNeverOrAlways"
      ).innerHTML = usingAllowListResponse.usingAllowAudioList
        ? pageInListResponse.listed
          ? "Always&nbsp;mute&nbsp;this&nbsp;page"
          : "Never&nbsp;mute&nbsp;this&nbsp;page"
        : pageInListResponse.listed
        ? "Never&nbsp;mute&nbsp;this&nbsp;page"
        : "Always&nbsp;mute&nbsp;this&nbsp;page";
      document.getElementById(
        "autoMuteBrowserActionDomainNeverOrAlways"
      ).innerHTML = usingAllowListResponse.usingAllowAudioList
        ? domainInListResponse.listed
          ? "Always&nbsp;mute&nbsp;this&nbsp;domain"
          : "Never&nbsp;mute&nbsp;this&nbsp;domain"
        : domainInListResponse.listed
        ? "Never&nbsp;mute&nbsp;this&nbsp;domain"
        : "Always&nbsp;mute&nbsp;this&nbsp;domain";
    }

    const currentlyMutedResponse = await _chrome.runtime.sendMessage({
      command: "query-current-muted",
    });
    if (currentlyMutedResponse) {
      document.getElementById(
        "autoMuteBrowserActionMuteTabMuteUnmute"
      ).innerHTML = currentlyMutedResponse.muted ? "Unmute" : "Mute";
    }

    const commands = await _chrome.commands.getAll();
    for (const command of commands) {
      switch (command.name) {
        case "mute-tab":
          document.getElementById(
            "autoMuteBrowserActionMuteTabShortcut"
          ).innerHTML = command.shortcut ? `&nbsp;(${command.shortcut})` : "";
          break;

        case "mute-other":
          document.getElementById(
            "autoMuteBrowserActionMuteOtherShortcut"
          ).innerHTML = command.shortcut ? `&nbsp;(${command.shortcut})` : "";
          break;

        case "mute-all":
          document.getElementById(
            "autoMuteBrowserActionMuteAllShortcut"
          ).innerHTML = command.shortcut ? `&nbsp;(${command.shortcut})` : "";
          break;
      }
    }
  });
})(window.chrome);
