import { jest } from "@jest/globals";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("browserAction", () => {
  let isDomainInList = true;
  let isPageInList = true;
  let usingAllowAudioList = true;
  let isCurrentPageMuted = true;
  let savedWindowChrome;

  beforeEach(async () => {
    const html = fs.readFileSync(
      path.resolve(__dirname, "../extension/browserAction.html"),
      "utf8"
    );
    document.documentElement.innerHTML = html.toString();

    savedWindowChrome = window.chrome;

    window.chrome = {
      runtime: {
        id: "my-extension-id",
        sendMessage: jest.fn((message) => {
          switch (message.command) {
            case "query-using-should-allow-list":
              return Promise.resolve({ usingAllowAudioList });
            case "query-page-listed":
              return Promise.resolve({ listed: isPageInList });
            case "query-domain-listed":
              return Promise.resolve({ listed: isDomainInList });
            case "query-current-muted":
              return Promise.resolve({ muted: isCurrentPageMuted });
            default:
              return Promise.resolve();
          }
        }),
      },
      tabs: {
        create: jest.fn(() => Promise.resolve()),
      },
      commands: {
        getAll: () => [
          {
            name: "mute-tab",
            shortcut: "Ctrl+Shift+M",
          },
          {
            name: "mute-other",
            shortcut: "Ctrl+Shift+O",
          },
          {
            name: "mute-all",
            shortcut: "Ctrl+Shift+A",
          },
        ],
      },
    };

    jest.spyOn(window, "close").mockImplementation(() => {});

    await import("../extension/browserAction.js");
  });

  afterEach(() => {
    window.close.mockRestore();
    jest.resetModules();

    window.chrome = savedWindowChrome;
  });

  it("should load the HTML in the test", () => {
    expect(document.title).toBe("AutoMute Menu");
  });

  it("should show 'Mute' for the toggle mute current tab menu item", async () => {
    isCurrentPageMuted = false;
    document.dispatchEvent(new Event("DOMContentLoaded"));

    // Wait for the content loaded event to be processed
    await new Promise(process.nextTick);

    expect(
      document.getElementById("autoMuteBrowserActionMuteTabMuteUnmute")
        .innerHTML
    ).toBe("Mute");
  });

  it("should show 'Unmute' for the toggle mute current tab menu item", async () => {
    isCurrentPageMuted = true;
    document.dispatchEvent(new Event("DOMContentLoaded"));

    // Wait for the content loaded event to be processed
    await new Promise(process.nextTick);

    expect(
      document.getElementById("autoMuteBrowserActionMuteTabMuteUnmute")
        .innerHTML
    ).toBe("Unmute");
  });

  it("should show 'Always mute this page' for the page list menu item when using an allow list", async () => {
    usingAllowAudioList = true;
    isPageInList = true;
    document.dispatchEvent(new Event("DOMContentLoaded"));

    // Wait for the content loaded event to be processed
    await new Promise(process.nextTick);

    expect(
      document.getElementById("autoMuteBrowserActionPageNeverOrAlways")
        .innerHTML
    ).toBe("Always&nbsp;mute&nbsp;this&nbsp;page");
  });

  it("should show 'Never mute this page' for the page list menu item when using an allow list", async () => {
    usingAllowAudioList = true;
    isPageInList = false;
    document.dispatchEvent(new Event("DOMContentLoaded"));

    // Wait for the content loaded event to be processed
    await new Promise(process.nextTick);

    expect(
      document.getElementById("autoMuteBrowserActionPageNeverOrAlways")
        .innerHTML
    ).toBe("Never&nbsp;mute&nbsp;this&nbsp;page");
  });

  it("should show 'Always mute this page' for the page list menu item when using a block list", async () => {
    usingAllowAudioList = false;
    isPageInList = false;
    document.dispatchEvent(new Event("DOMContentLoaded"));

    // Wait for the content loaded event to be processed
    await new Promise(process.nextTick);

    expect(
      document.getElementById("autoMuteBrowserActionPageNeverOrAlways")
        .innerHTML
    ).toBe("Always&nbsp;mute&nbsp;this&nbsp;page");
  });

  it("should show 'Never mute this page' for the page list menu item when using a block list", async () => {
    usingAllowAudioList = false;
    isPageInList = true;
    document.dispatchEvent(new Event("DOMContentLoaded"));

    // Wait for the content loaded event to be processed
    await new Promise(process.nextTick);

    expect(
      document.getElementById("autoMuteBrowserActionPageNeverOrAlways")
        .innerHTML
    ).toBe("Never&nbsp;mute&nbsp;this&nbsp;page");
  });

  it("should show 'Always mute this domain' for the domain list menu item when using an allow list", async () => {
    usingAllowAudioList = true;
    isDomainInList = true;
    document.dispatchEvent(new Event("DOMContentLoaded"));

    // Wait for the content loaded event to be processed
    await new Promise(process.nextTick);

    expect(
      document.getElementById("autoMuteBrowserActionDomainNeverOrAlways")
        .innerHTML
    ).toBe("Always&nbsp;mute&nbsp;this&nbsp;domain");
  });

  it("should show 'Never mute this domain' for the domain list menu item when using an allow list", async () => {
    usingAllowAudioList = true;
    isDomainInList = false;
    document.dispatchEvent(new Event("DOMContentLoaded"));

    // Wait for the content loaded event to be processed
    await new Promise(process.nextTick);

    expect(
      document.getElementById("autoMuteBrowserActionDomainNeverOrAlways")
        .innerHTML
    ).toBe("Never&nbsp;mute&nbsp;this&nbsp;domain");
  });

  it("should show 'Always mute this domain' for the domain list menu item when using a block list", async () => {
    usingAllowAudioList = false;
    isDomainInList = false;
    document.dispatchEvent(new Event("DOMContentLoaded"));

    // Wait for the content loaded event to be processed
    await new Promise(process.nextTick);

    expect(
      document.getElementById("autoMuteBrowserActionDomainNeverOrAlways")
        .innerHTML
    ).toBe("Always&nbsp;mute&nbsp;this&nbsp;domain");
  });

  it("should show 'Never mute this domain' for the domain list menu item when using a block list", async () => {
    usingAllowAudioList = false;
    isDomainInList = true;
    document.dispatchEvent(new Event("DOMContentLoaded"));

    // Wait for the content loaded event to be processed
    await new Promise(process.nextTick);

    expect(
      document.getElementById("autoMuteBrowserActionDomainNeverOrAlways")
        .innerHTML
    ).toBe("Never&nbsp;mute&nbsp;this&nbsp;domain");
  });

  it("should show the toggle mute current tab shortcut keys in the menu", async () => {
    document.dispatchEvent(new Event("DOMContentLoaded"));

    // Wait for the content loaded event to be processed
    await new Promise(process.nextTick);

    expect(
      document.getElementById("autoMuteBrowserActionMuteTabShortcut").innerHTML
    ).toBe("&nbsp;(Ctrl+Shift+M)");
  });

  it("should show the mute other tabs shortcut keys in the menu", async () => {
    document.dispatchEvent(new Event("DOMContentLoaded"));

    // Wait for the content loaded event to be processed
    await new Promise(process.nextTick);

    expect(
      document.getElementById("autoMuteBrowserActionMuteOtherShortcut")
        .innerHTML
    ).toBe("&nbsp;(Ctrl+Shift+O)");
  });

  it("should show the mute all tabs shortcut keys in the menu", async () => {
    document.dispatchEvent(new Event("DOMContentLoaded"));

    // Wait for the content loaded event to be processed
    await new Promise(process.nextTick);

    expect(
      document.getElementById("autoMuteBrowserActionMuteAllShortcut").innerHTML
    ).toBe("&nbsp;(Ctrl+Shift+A)");
  });

  it("should send the mute-tab command when the menu item is clicked", async () => {
    document.dispatchEvent(new Event("DOMContentLoaded"));

    // Wait for the content loaded event to be processed
    await new Promise(process.nextTick);

    document
      .getElementById("autoMuteBrowserActionMuteTab")
      .dispatchEvent(new MouseEvent("click"));

    // Wait for the click event to be processed
    await new Promise(process.nextTick);

    expect(window.chrome.runtime.sendMessage).toHaveBeenCalledWith({
      command: "mute-tab",
    });
    expect(window.close).toHaveBeenCalled();
  });

  it("should send the mute-all command when the menu item is clicked", async () => {
    document.dispatchEvent(new Event("DOMContentLoaded"));

    // Wait for the content loaded event to be processed
    await new Promise(process.nextTick);

    document
      .getElementById("autoMuteBrowserActionMuteAll")
      .dispatchEvent(new MouseEvent("click"));

    // Wait for the click event to be processed
    await new Promise(process.nextTick);

    expect(window.chrome.runtime.sendMessage).toHaveBeenCalledWith({
      command: "mute-all",
    });
    expect(window.close).toHaveBeenCalled();
  });

  it("should send the mute-other command when the menu item is clicked", async () => {
    document.dispatchEvent(new Event("DOMContentLoaded"));

    // Wait for the content loaded event to be processed
    await new Promise(process.nextTick);

    document
      .getElementById("autoMuteBrowserActionMuteOther")
      .dispatchEvent(new MouseEvent("click"));

    // Wait for the click event to be processed
    await new Promise(process.nextTick);

    expect(window.chrome.runtime.sendMessage).toHaveBeenCalledWith({
      command: "mute-other",
    });
    expect(window.close).toHaveBeenCalled();
  });

  it("should send the list-page command when the menu item is clicked", async () => {
    document.dispatchEvent(new Event("DOMContentLoaded"));

    // Wait for the content loaded event to be processed
    await new Promise(process.nextTick);

    document
      .getElementById("autoMuteBrowserActionListPage")
      .dispatchEvent(new MouseEvent("click"));

    // Wait for the click event to be processed
    await new Promise(process.nextTick);

    expect(window.chrome.runtime.sendMessage).toHaveBeenCalledWith({
      command: "list-page",
    });
    expect(window.close).toHaveBeenCalled();
  });

  it("should send the list-domain command when the menu item is clicked", async () => {
    document.dispatchEvent(new Event("DOMContentLoaded"));

    // Wait for the content loaded event to be processed
    await new Promise(process.nextTick);

    document
      .getElementById("autoMuteBrowserActionListDomain")
      .dispatchEvent(new MouseEvent("click"));

    // Wait for the click event to be processed
    await new Promise(process.nextTick);

    expect(window.chrome.runtime.sendMessage).toHaveBeenCalledWith({
      command: "list-domain",
    });
    expect(window.close).toHaveBeenCalled();
  });

  it("should show the options page when the menu item is clicked", async () => {
    document.dispatchEvent(new Event("DOMContentLoaded"));

    // Wait for the content loaded event to be processed
    await new Promise(process.nextTick);

    document
      .getElementById("autoMuteBrowserActionShowOptions")
      .dispatchEvent(new MouseEvent("click"));

    // Wait for the click event to be processed
    await new Promise(process.nextTick);

    expect(window.chrome.tabs.create).toHaveBeenCalledWith({
      url: "chrome://extensions/?options=my-extension-id",
    });
    expect(window.close).toHaveBeenCalled();
  });
});
