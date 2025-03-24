import { jest } from "@jest/globals";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("service_worker.js", () => {
  let storage = {};
  let tabs = [];
  const extensionId = "my-extension-id";
  let colorScheme = "light";
  let offscreenDocumentLoaded = false;

  let tabOnCreatedListener = async () => {};
  let tabOnReplacedListener = async () => {};
  let commandsOnCommandListener = async () => {};
  let runtimeOnMessageListener = async () => {};
  let intervalListener = async () => {};

  let mockChrome = {
    storage: {
      sync: {
        get: (values) => {
          // If values is an object, return the values of the keys in the object
          if (typeof values === "object") {
            const result = {};
            for (const [key, value] of Object.entries(values)) {
              if (!Object.prototype.hasOwnProperty.call(storage, key)) {
                storage[key] = value;
              }
              result[key] = storage[key];
            }

            return Promise.resolve(result);
          }

          return Promise.resolve(storage[values]);
        },
        set: (values) => {
          for (const [key, value] of Object.entries(values)) {
            storage[key] = value;
          }

          return Promise.resolve();
        },
        remove: (keys) => {
          if (Array.isArray(keys)) {
            keys.forEach((key) => {
              delete storage[key];
            });
          } else {
            delete storage[keys];
          }
        },
        getKeys: () => {
          return Promise.resolve(Object.keys(storage));
        },
      },
    },
    tabs: {
      onCreated: {
        addListener: (listener) => {
          tabOnCreatedListener = listener;
        },
      },
      onReplaced: {
        addListener: (listener) => {
          tabOnReplacedListener = listener;
        },
      },
      onUpdated: {
        addListener: jest.fn(),
      },
      onActivated: {
        addListener: jest.fn(),
      },
      get: (tabId) => {
        return tabs.find((tab) => tab.id === tabId);
      },
      query: (queryInfo) => {
        return tabs.filter((tab) => {
          for (const key in queryInfo) {
            if (queryInfo[key] !== tab[key]) {
              return false;
            }
          }

          return true;
        });
      },
      update: (tabId, updateProperties) => {
        const tab = tabs.find((tab) => tab.id === tabId);
        if (!tab.mutedInfo) {
          tab.mutedInfo = {};
        }
        tab.mutedInfo.muted = updateProperties.muted;
      },
    },
    commands: {
      onCommand: {
        addListener: (listener) => {
          commandsOnCommandListener = listener;
        },
      },
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
    runtime: {
      sendMessage: (message) => {
        return new Promise((resolve) => {
          if (!runtimeOnMessageListener(message, "", resolve)) {
            resolve();
          }
        });
      },
      onMessage: {
        addListener: (listener) => {
          runtimeOnMessageListener = listener;
        },
      },
      id: extensionId,
    },
    offscreen: {
      hasDocument: () => Promise.resolve(offscreenDocumentLoaded),
      createDocument: async () => {
        await import("../extension/offscreen.js");
        offscreenDocumentLoaded = true;
        await new Promise(process.nextTick);
      },
    },
    action: {
      setIcon: jest.fn(),
    },
    windows: {
      onFocusChanged: {
        addListener: jest.fn(),
      },
    },
  };

  const logger = {
    log: jest.fn(),
    error: jest.fn(),
  };

  async function startExtension() {
    await import("../extension/service_worker.js");
    // Wait for everything in the service worker to settle
    await new Promise(process.nextTick);
  }

  async function loadBrowserAction() {
    const browserActionHtml = fs.readFileSync(
      path.resolve(__dirname, "../extension/browserAction.html"),
      "utf8"
    );
    document.body.innerHTML = browserActionHtml.toString();

    await import("../extension/browserAction.js");
    document.dispatchEvent(new Event("DOMContentLoaded"));
    // Wait for the content loaded event to be processed
    await new Promise(process.nextTick);
  }

  let savedSelfChrome;
  let savedSelfConsole;
  let savedWindowChrome;
  let savedWindowConsole;
  let savedWindowMatchMedia;
  let savedWindowSetInterval;
  let savedWindowClose;

  beforeEach(async () => {
    savedSelfChrome = self.chrome;
    savedSelfConsole = self.console;
    savedWindowChrome = window.chrome;
    savedWindowConsole = window.console;
    savedWindowMatchMedia = window.matchMedia;
    savedWindowSetInterval = window.setInterval;
    savedWindowClose = window.close;

    self.chrome = mockChrome;
    self.console = logger;
    window.chrome = mockChrome;
    window.console = logger;
    window.matchMedia = (query) => {
      if (query === "(prefers-color-scheme: dark)") {
        return {
          matches: colorScheme === "dark",
        };
      }
    };
    window.setInterval = (listener) => {
      intervalListener = listener;
    };
    window.close = () => {};
  });

  afterEach(() => {
    storage = {};
    tabs = [];
    colorScheme = "light";
    offscreenDocumentLoaded = false;
    tabOnCreatedListener = () => {};
    tabOnReplacedListener = () => {};
    commandsOnCommandListener = () => {};
    jest.resetModules();

    self.chrome = savedSelfChrome;
    self.console = savedSelfConsole;
    window.chrome = savedWindowChrome;
    window.console = savedWindowConsole;
    window.matchMedia = savedWindowMatchMedia;
    window.setInterval = savedWindowSetInterval;
    window.close = savedWindowClose;

    tabOnCreatedListener = async () => {};
    tabOnReplacedListener = async () => {};
    commandsOnCommandListener = async () => {};
    runtimeOnMessageListener = async () => {};
    intervalListener = async () => {};

    document.body.innerHTML = "";
  });

  it("should start the extension", async () => {
    await startExtension();
    expect(logger.log).toHaveBeenCalled();
  });

  it("should upgrade from an old extension version", async () => {
    storage = {
      enabled: true,
      whitelist: "www.youtube.com\ngoogle.com",
      blacklist: "www.facebook.com",
      usingWhitelist: true,
    };
    await startExtension();

    expect(storage).toMatchInlineSnapshot(`
{
  "allowOrBlockList": "www.youtube.com
google.com",
  "enabled": true,
  "usingAllowList": true,
}
`);
  });

  it("should mute all existing tabs on start", async () => {
    tabs = [
      { id: 1, url: "https://www.youtube.com", mutedInfo: { muted: false } },
      { id: 2, url: "https://www.google.com", mutedInfo: { muted: false } },
      { id: 3, url: "https://www.facebook.com", mutedInfo: { muted: false } },
    ];
    await startExtension();

    expect(tabs[0].mutedInfo.muted).toBe(true);
    expect(tabs[1].mutedInfo.muted).toBe(true);
    expect(tabs[2].mutedInfo.muted).toBe(true);
  });

  it("should not mute all tabs on start if not enabled", async () => {
    tabs = [
      { id: 1, url: "https://www.youtube.com", mutedInfo: { muted: false } },
      { id: 2, url: "https://www.google.com", mutedInfo: { muted: false } },
      { id: 3, url: "https://www.facebook.com", mutedInfo: { muted: false } },
    ];
    storage.enabled = false;
    await startExtension();

    expect(tabs[0].mutedInfo.muted).toBe(false);
    expect(tabs[1].mutedInfo.muted).toBe(false);
    expect(tabs[2].mutedInfo.muted).toBe(false);
  });

  it("should mute tabs that are not in an allow list", async () => {
    storage.usingAllowList = true;
    storage.allowOrBlockList = "https://www.youtube.com";
    tabs = [
      { id: 1, url: "https://www.youtube.com", mutedInfo: { muted: false } },
      { id: 2, url: "https://www.google.com", mutedInfo: { muted: false } },
    ];
    await startExtension();

    expect(tabs[0].mutedInfo.muted).toBe(false);
    expect(tabs[1].mutedInfo.muted).toBe(true);
  });

  it("should mute tabs that are in a block list", async () => {
    storage.usingAllowList = false;
    storage.allowOrBlockList = "www.youtube.com";
    tabs = [
      { id: 1, url: "https://www.youtube.com", mutedInfo: { muted: false } },
      { id: 2, url: "https://www.google.com", mutedInfo: { muted: false } },
    ];
    await startExtension();

    expect(tabs[0].mutedInfo.muted).toBe(true);
    expect(tabs[1].mutedInfo.muted).toBe(false);
  });

  it("should mute a new tab", async () => {
    await startExtension();

    const tab = {
      id: 1,
      url: "https://www.youtube.com",
      mutedInfo: { muted: false },
    };
    tabs.push(tab);
    await tabOnCreatedListener(tab);

    expect(tab.mutedInfo.muted).toBe(true);
  });

  it("should mute a replaced tab", async () => {
    await startExtension();

    const tab = {
      id: 1,
      url: "https://www.youtube.com",
      mutedInfo: { muted: false },
    };
    tabs.push(tab);
    await tabOnCreatedListener(tab);

    const newTab = {
      id: 2,
      url: "https://www.youtube.com",
      mutedInfo: { muted: false },
    };
    tabs = [newTab];
    await tabOnReplacedListener(2, 1);

    expect(newTab.mutedInfo.muted).toBe(true);
  });

  it("should unmute a muted tab when the page is added to the allow list", async () => {
    storage.usingAllowList = true;
    storage.allowOrBlockList = "";
    tabs = [
      {
        id: 1,
        url: "https://www.youtube.com/",
        mutedInfo: { muted: false },
        active: true,
        lastFocusedWindow: true,
      },
    ];
    await startExtension();
    await loadBrowserAction();

    // Sanity check
    expect(tabs[0].mutedInfo.muted).toBe(true);

    document
      .getElementById("autoMuteBrowserActionListPage")
      .dispatchEvent(new MouseEvent("click"));

    // Wait for the click event to be processed
    await new Promise(process.nextTick);

    expect(storage.allowOrBlockList).toBe("https://www.youtube.com/");

    expect(tabs[0].mutedInfo.muted).toBe(false);
  });

  it("should mute an unmuted tab when the page is removed from the allow list", async () => {
    storage.usingAllowList = true;
    storage.allowOrBlockList = "https://www.youtube.com/";
    tabs = [
      {
        id: 1,
        url: "https://www.youtube.com/",
        mutedInfo: { muted: false },
        active: true,
        lastFocusedWindow: true,
      },
    ];
    await startExtension();
    await loadBrowserAction();

    // Sanity check
    expect(tabs[0].mutedInfo.muted).toBe(false);

    document
      .getElementById("autoMuteBrowserActionListPage")
      .dispatchEvent(new MouseEvent("click"));

    // Wait for the click event to be processed
    await new Promise(process.nextTick);

    expect(storage.allowOrBlockList).toBe("");

    expect(tabs[0].mutedInfo.muted).toBe(true);
  });

  it("should unmute a muted tab when the domain is added to the allow list", async () => {
    storage.usingAllowList = true;
    storage.allowOrBlockList = "";
    tabs = [
      {
        id: 1,
        url: "https://www.youtube.com/",
        mutedInfo: { muted: false },
        active: true,
        lastFocusedWindow: true,
      },
    ];
    await startExtension();
    await loadBrowserAction();

    // Sanity check
    expect(tabs[0].mutedInfo.muted).toBe(true);

    document
      .getElementById("autoMuteBrowserActionListDomain")
      .dispatchEvent(new MouseEvent("click"));

    // Wait for the click event to be processed
    await new Promise(process.nextTick);

    expect(storage.allowOrBlockList).toBe("www.youtube.com/*");

    expect(tabs[0].mutedInfo.muted).toBe(false);
  });

  it("should mute an unmuted tab when the domain is removed from the allow list", async () => {
    storage.usingAllowList = true;
    storage.allowOrBlockList = "www.youtube.com/*";
    tabs = [
      {
        id: 1,
        url: "https://www.youtube.com/",
        mutedInfo: { muted: false },
        active: true,
        lastFocusedWindow: true,
      },
    ];
    await startExtension();
    await loadBrowserAction();

    // Sanity check
    expect(tabs[0].mutedInfo.muted).toBe(false);

    document
      .getElementById("autoMuteBrowserActionListDomain")
      .dispatchEvent(new MouseEvent("click"));

    // Wait for the click event to be processed
    await new Promise(process.nextTick);

    expect(storage.allowOrBlockList).toBe("");

    expect(tabs[0].mutedInfo.muted).toBe(true);
  });

  it("should mute an unmuted tab when the page is added to the block list", async () => {
    storage.usingAllowList = false;
    storage.allowOrBlockList = "";
    tabs = [
      {
        id: 1,
        url: "https://www.youtube.com/",
        mutedInfo: { muted: false },
        active: true,
        lastFocusedWindow: true,
      },
    ];
    await startExtension();
    await loadBrowserAction();

    // Sanity check
    expect(tabs[0].mutedInfo.muted).toBe(false);

    document
      .getElementById("autoMuteBrowserActionListPage")
      .dispatchEvent(new MouseEvent("click"));

    // Wait for the click event to be processed
    await new Promise(process.nextTick);

    expect(storage.allowOrBlockList).toBe("https://www.youtube.com/");

    expect(tabs[0].mutedInfo.muted).toBe(true);
  });

  it("should unmute a muted tab when the page is removed from the block list", async () => {
    storage.usingAllowList = false;
    storage.allowOrBlockList = "https://www.youtube.com/";
    tabs = [
      {
        id: 1,
        url: "https://www.youtube.com/",
        mutedInfo: { muted: false },
        active: true,
        lastFocusedWindow: true,
      },
    ];
    await startExtension();

    // Sanity check
    expect(tabs[0].mutedInfo.muted).toBe(true);

    await commandsOnCommandListener("list-page");

    expect(storage.allowOrBlockList).toBe("");

    expect(tabs[0].mutedInfo.muted).toBe(false);
  });

  it("should mute an unmuted tab when the domain is added to the block list", async () => {
    storage.usingAllowList = false;
    storage.allowOrBlockList = "";
    tabs = [
      {
        id: 1,
        url: "https://www.youtube.com/",
        mutedInfo: { muted: false },
        active: true,
        lastFocusedWindow: true,
      },
    ];
    await startExtension();

    // Sanity check
    expect(tabs[0].mutedInfo.muted).toBe(false);

    await commandsOnCommandListener("list-domain");

    expect(storage.allowOrBlockList).toBe("www.youtube.com/*");

    expect(tabs[0].mutedInfo.muted).toBe(true);
  });

  it("should unmute a muted tab when the domain is removed from the block list", async () => {
    storage.usingAllowList = false;
    storage.allowOrBlockList = "www.youtube.com/*";
    tabs = [
      {
        id: 1,
        url: "https://www.youtube.com/",
        mutedInfo: { muted: false },
        active: true,
        lastFocusedWindow: true,
      },
    ];
    await startExtension();

    // Sanity check
    expect(tabs[0].mutedInfo.muted).toBe(true);

    await commandsOnCommandListener("list-domain");

    expect(storage.allowOrBlockList).toBe("");

    expect(tabs[0].mutedInfo.muted).toBe(false);
  });

  describe("offscreen document", () => {
    it("should select the proper icon for dark system color scheme", async () => {
      colorScheme = "dark";
      await startExtension();

      expect(mockChrome.action.setIcon).toHaveBeenCalledWith({
        path: "images/dark_on_16.png",
      });
    });

    it("should select the proper icon for light system color scheme", async () => {
      colorScheme = "light";
      await startExtension();

      expect(mockChrome.action.setIcon).toHaveBeenCalledWith({
        path: "images/light_on_16.png",
      });
    });

    it("should respond to a color scheme change", async () => {
      colorScheme = "light";
      await startExtension();

      // Sanity check
      expect(mockChrome.action.setIcon).toHaveBeenCalledWith({
        path: "images/light_on_16.png",
      });

      colorScheme = "dark";
      await intervalListener();

      await new Promise(process.nextTick);

      expect(mockChrome.action.setIcon).toHaveBeenCalledWith({
        path: "images/dark_on_16.png",
      });
    });
  });
});
