import { beforeEach, describe, expect, it, jest } from "@jest/globals";

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
  let timeoutListener = async () => {};
  let tabOnUpdatedListener = async () => {};
  let tabOnActivatedListener = async () => {};
  let windowsOnFocusChangedListener = async () => {};

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
        addListener: (listener) => {
          tabOnUpdatedListener = listener;
        },
      },
      onActivated: {
        addListener: (listener) => {
          tabOnActivatedListener = listener;
        },
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
        if (tab.mutedInfo.muted) {
          tab.mutedInfo.extensionId = extensionId;
        } else {
          delete tab.mutedInfo.extensionId;
        }
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
        addListener: (listener) => {
          windowsOnFocusChangedListener = listener;
        },
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

    // We want to intercept the DOMContentLoaded event
    // because it can result in multiple listeners being
    // registered across multiple tests
    const domContentEventListeners = [];
    const savedAddEventListener = document.addEventListener;

    document.addEventListener = (event, listener) => {
      if (event === "DOMContentLoaded") {
        domContentEventListeners.push(listener);
      } else {
        savedAddEventListener(event, listener);
      }
    };

    await import("../extension/browserAction.js");
    for (const listener of domContentEventListeners) {
      listener();
    }
    // Wait for the content loaded event to be processed
    await new Promise(process.nextTick);
  }

  async function loadOptions() {
    const optionsHtml = fs.readFileSync(
      path.resolve(__dirname, "../extension/options.html"),
      "utf8"
    );
    document.body.innerHTML = optionsHtml.toString();

    // We want to intercept the DOMContentLoaded event
    // because it can result in multiple listeners being
    // registered across multiple tests
    const domContentEventListeners = [];
    const savedAddEventListener = document.addEventListener;

    document.addEventListener = (event, listener) => {
      if (event === "DOMContentLoaded") {
        domContentEventListeners.push(listener);
      } else {
        savedAddEventListener(event, listener);
      }
    };

    await import("../extension/options.js");
    for (const listener of domContentEventListeners) {
      listener();
    }
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
  let savedWindowSetTimeout;

  beforeEach(async () => {
    savedSelfChrome = self.chrome;
    savedSelfConsole = self.console;
    savedWindowChrome = window.chrome;
    savedWindowConsole = window.console;
    savedWindowMatchMedia = window.matchMedia;
    savedWindowSetInterval = window.setInterval;
    savedWindowClose = window.close;
    savedWindowSetTimeout = window.setTimeout;

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
    window.setTimeout = (listener) => {
      timeoutListener = listener;
    };
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
    window.setTimeout = savedWindowSetTimeout;

    tabOnCreatedListener = async () => {};
    tabOnReplacedListener = async () => {};
    commandsOnCommandListener = async () => {};
    runtimeOnMessageListener = async () => {};
    intervalListener = async () => {};
    timeoutListener = async () => {};
    tabOnUpdatedListener = async () => {};
    tabOnActivatedListener = async () => {};
    windowsOnFocusChangedListener = async () => {};

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

  it("should not mute a new tab if disabled", async () => {
    storage.enabled = false;
    await startExtension();

    const tab = {
      id: 1,
      url: "https://www.youtube.com",
      mutedInfo: { muted: false },
    };
    tabs.push(tab);
    await tabOnCreatedListener(tab);

    expect(tab.mutedInfo.muted).toBe(false);
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

  it("should not mute a replaced tab if disabled", async () => {
    storage.enabled = false;
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

    expect(newTab.mutedInfo.muted).toBe(false);
  });

  it("should mute a tab when the url changes", async () => {
    storage.usingAllowList = true;
    storage.allowOrBlockList = "https://www.youtube.com";
    tabs = [
      {
        id: 1,
        url: "https://www.youtube.com",
        mutedInfo: { muted: false },
      },
    ];
    await startExtension();

    // Sanity check
    expect(tabs[0].mutedInfo.muted).toBe(false);

    tabs[0].url = "https://www.google.com";
    await tabOnUpdatedListener(1, { url: "https://www.google.com" });

    // Wait for everything to settle
    await new Promise(process.nextTick);

    expect(tabs[0].mutedInfo.muted).toBe(true);
  });

  it("should unmute a tab when the url changes", async () => {
    storage.usingAllowList = true;
    storage.allowOrBlockList = "https://www.youtube.com";
    tabs = [
      {
        id: 1,
        url: "https://www.google.com",
        mutedInfo: { muted: false },
      },
    ];
    await startExtension();

    // Sanity check
    expect(tabs[0].mutedInfo.muted).toBe(true);

    tabs[0].url = "https://www.youtube.com";
    await tabOnUpdatedListener(1, { url: "https://www.youtube.com" });

    // Wait for everything to settle
    await new Promise(process.nextTick);

    expect(tabs[0].mutedInfo.muted).toBe(false);
  });

  it("should not mute a tab when the url changes if disabled", async () => {
    storage.enabled = false;
    storage.usingAllowList = true;
    storage.allowOrBlockList = "https://www.youtube.com";
    tabs = [
      {
        id: 1,
        url: "https://www.youtube.com",
        mutedInfo: { muted: false },
      },
    ];
    await startExtension();

    // Sanity check
    expect(tabs[0].mutedInfo.muted).toBe(false);

    tabs[0].url = "https://www.google.com";
    await tabOnUpdatedListener(1, { url: "https://www.google.com" });

    // Wait for everything to settle
    await new Promise(process.nextTick);

    expect(tabs[0].mutedInfo.muted).toBe(false);
  });

  describe("the icon", () => {
    it("should update when a muted tab is activated", async () => {
      storage.usingAllowList = true;
      storage.allowOrBlockList = "https://www.youtube.com";
      tabs = [
        {
          id: 1,
          url: "https://www.youtube.com",
          mutedInfo: { muted: false },
          active: true,
          lastFocusedWindow: true,
        },
        {
          id: 2,
          url: "https://www.google.com",
          mutedInfo: { muted: false },
          active: false,
          lastFocusedWindow: true,
        },
      ];
      await startExtension();

      // Sanity check
      expect(mockChrome.action.setIcon).toHaveBeenCalledWith({
        path: "images/light_on_16.png",
      });
      mockChrome.action.setIcon.mockClear();

      tabs[0].active = false;
      tabs[1].active = true;
      await tabOnActivatedListener();

      // Wait for everything to settle
      await new Promise(process.nextTick);

      expect(mockChrome.action.setIcon).toHaveBeenCalledWith({
        path: "images/light_off_16.png",
      });
    });

    it("should update when an unmuted tab is activated", async () => {
      storage.usingAllowList = true;
      storage.allowOrBlockList = "https://www.google.com";
      tabs = [
        {
          id: 1,
          url: "https://www.youtube.com",
          mutedInfo: { muted: false },
          active: true,
          lastFocusedWindow: true,
        },
        {
          id: 2,
          url: "https://www.google.com",
          mutedInfo: { muted: false },
          active: false,
          lastFocusedWindow: true,
        },
      ];
      await startExtension();

      // Sanity check
      expect(mockChrome.action.setIcon).toHaveBeenCalledWith({
        path: "images/light_off_16.png",
      });
      mockChrome.action.setIcon.mockClear();

      tabs[0].active = false;
      tabs[1].active = true;
      await tabOnActivatedListener();

      // Wait for everything to settle
      await new Promise(process.nextTick);

      expect(mockChrome.action.setIcon).toHaveBeenCalledWith({
        path: "images/light_on_16.png",
      });
    });

    it("should update when a window with an active unmuted tab is focused", async () => {
      storage.usingAllowList = true;
      storage.allowOrBlockList = "https://www.google.com";
      tabs = [
        {
          id: 1,
          url: "https://www.youtube.com",
          mutedInfo: { muted: false },
          active: true,
          lastFocusedWindow: true,
        },
        {
          id: 2,
          url: "https://www.google.com",
          mutedInfo: { muted: false },
          active: true,
          lastFocusedWindow: false,
        },
      ];
      await startExtension();

      // Sanity check
      expect(mockChrome.action.setIcon).toHaveBeenCalledWith({
        path: "images/light_off_16.png",
      });
      mockChrome.action.setIcon.mockClear();

      tabs[0].lastFocusedWindow = false;
      tabs[1].lastFocusedWindow = true;
      await windowsOnFocusChangedListener();

      // Wait for everything to settle
      await new Promise(process.nextTick);

      expect(mockChrome.action.setIcon).toHaveBeenCalledWith({
        path: "images/light_on_16.png",
      });
    });

    it("should update when a window with an active muted tab is focused", async () => {
      storage.usingAllowList = true;
      storage.allowOrBlockList = "https://www.google.com";
      tabs = [
        {
          id: 1,
          url: "https://www.youtube.com",
          mutedInfo: { muted: false },
          active: true,
          lastFocusedWindow: false,
        },
        {
          id: 2,
          url: "https://www.google.com",
          mutedInfo: { muted: false },
          active: true,
          lastFocusedWindow: true,
        },
      ];
      await startExtension();

      // Sanity check
      expect(mockChrome.action.setIcon).toHaveBeenCalledWith({
        path: "images/light_on_16.png",
      });
      mockChrome.action.setIcon.mockClear();

      tabs[0].lastFocusedWindow = true;
      tabs[1].lastFocusedWindow = false;
      await windowsOnFocusChangedListener();

      // Wait for everything to settle
      await new Promise(process.nextTick);

      expect(mockChrome.action.setIcon).toHaveBeenCalledWith({
        path: "images/light_off_16.png",
      });
    });

    it("should update to muted when the url changes", async () => {
      storage.usingAllowList = true;
      storage.allowOrBlockList = "https://www.youtube.com";
      tabs = [
        {
          id: 1,
          url: "https://www.youtube.com",
          mutedInfo: { muted: false },
          active: true,
          lastFocusedWindow: true,
        },
      ];
      await startExtension();

      // Sanity check
      expect(mockChrome.action.setIcon).toHaveBeenCalledWith({
        path: "images/light_on_16.png",
      });
      mockChrome.action.setIcon.mockClear();

      tabs[0].url = "https://www.google.com";
      await tabOnUpdatedListener(1, { url: "https://www.google.com" });

      // Wait for everything to settle
      await new Promise(process.nextTick);

      expect(mockChrome.action.setIcon).toHaveBeenCalledWith({
        path: "images/light_off_16.png",
      });
    });

    it("should update to unmuted when the url changes", async () => {
      storage.usingAllowList = true;
      storage.allowOrBlockList = "https://www.youtube.com";
      tabs = [
        {
          id: 1,
          url: "https://www.google.com",
          mutedInfo: { muted: false },
          active: true,
          lastFocusedWindow: true,
        },
      ];
      await startExtension();

      // Sanity check
      expect(mockChrome.action.setIcon).toHaveBeenCalledWith({
        path: "images/light_off_16.png",
      });
      mockChrome.action.setIcon.mockClear();

      tabs[0].url = "https://www.youtube.com";
      await tabOnUpdatedListener(1, { url: "https://www.youtube.com" });

      // Wait for everything to settle
      await new Promise(process.nextTick);

      expect(mockChrome.action.setIcon).toHaveBeenCalledWith({
        path: "images/light_on_16.png",
      });
    });
  });

  describe("commands", () => {
    it("should unmute a muted tab when the mute shortcut keys are pressed", async () => {
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
        {
          id: 2,
          url: "https://www.youtube.com/",
          mutedInfo: { muted: false },
          active: false,
          lastFocusedWindow: true,
        },
      ];
      await startExtension();

      // Sanity check
      expect(tabs[0].mutedInfo.muted).toBe(true);
      expect(tabs[1].mutedInfo.muted).toBe(true);

      await commandsOnCommandListener("mute-tab");

      // Wait for the click event to be processed
      await new Promise(process.nextTick);

      expect(tabs[0].mutedInfo.muted).toBe(false);
      expect(tabs[1].mutedInfo.muted).toBe(true);
    });

    it("should mute an unmuted tab when the mute shortcut keys are pressed", async () => {
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
        {
          id: 2,
          url: "https://www.youtube.com/",
          mutedInfo: { muted: false },
          active: false,
          lastFocusedWindow: true,
        },
      ];
      await startExtension();

      // Sanity check
      expect(tabs[0].mutedInfo.muted).toBe(false);
      expect(tabs[1].mutedInfo.muted).toBe(false);

      await commandsOnCommandListener("mute-tab");

      // Wait for the click event to be processed
      await new Promise(process.nextTick);

      expect(tabs[0].mutedInfo.muted).toBe(true);
      expect(tabs[1].mutedInfo.muted).toBe(false);
    });

    it("should mute all unmuted tabs when the mute all shortcut keys are pressed", async () => {
      storage.usingAllowList = true;
      storage.allowOrBlockList =
        "https://www.youtube.com/\nhttps://google.com/";
      tabs = [
        {
          id: 1,
          url: "https://www.youtube.com/",
          mutedInfo: { muted: false },
          active: true,
          lastFocusedWindow: true,
        },
        {
          id: 2,
          url: "https://www.youtube.com/",
          mutedInfo: { muted: false },
          active: false,
          lastFocusedWindow: true,
        },
        {
          id: 3,
          url: "https://www.notyoutube.com/",
          mutedInfo: { muted: false },
          active: false,
          lastFocusedWindow: true,
        },
        {
          id: 4,
          url: "https://google.com/",
          mutedInfo: { muted: false },
          active: false,
          lastFocusedWindow: true,
        },
      ];
      await startExtension();

      // Sanity check
      expect(tabs[0].mutedInfo.muted).toBe(false);
      expect(tabs[1].mutedInfo.muted).toBe(false);
      expect(tabs[2].mutedInfo.muted).toBe(true);
      expect(tabs[3].mutedInfo.muted).toBe(false);

      await commandsOnCommandListener("mute-all");

      // Wait for the click event to be processed
      await new Promise(process.nextTick);

      expect(tabs[0].mutedInfo.muted).toBe(true);
      expect(tabs[1].mutedInfo.muted).toBe(true);
      expect(tabs[2].mutedInfo.muted).toBe(true);
      expect(tabs[3].mutedInfo.muted).toBe(true);
    });

    it("should mute all inactive tabs when the mute other shortcut keys are pressed", async () => {
      storage.usingAllowList = true;
      storage.allowOrBlockList =
        "https://www.youtube.com/\nhttps://google.com/";
      tabs = [
        {
          id: 1,
          url: "https://www.youtube.com/",
          mutedInfo: { muted: false },
          active: false,
          lastFocusedWindow: true,
        },
        {
          id: 2,
          url: "https://www.youtube.com/",
          mutedInfo: { muted: false },
          active: true,
          lastFocusedWindow: true,
        },
        {
          id: 3,
          url: "https://www.notyoutube.com/",
          mutedInfo: { muted: false },
          active: false,
          lastFocusedWindow: true,
        },
        {
          id: 4,
          url: "https://google.com/",
          mutedInfo: { muted: false },
          active: true,
          lastFocusedWindow: false,
        },
      ];
      await startExtension();

      // Sanity check
      expect(tabs[0].mutedInfo.muted).toBe(false);
      expect(tabs[1].mutedInfo.muted).toBe(false);
      expect(tabs[2].mutedInfo.muted).toBe(true);
      expect(tabs[3].mutedInfo.muted).toBe(false);

      await commandsOnCommandListener("mute-other");

      // Wait for the click event to be processed
      await new Promise(process.nextTick);

      expect(tabs[0].mutedInfo.muted).toBe(true);
      expect(tabs[1].mutedInfo.muted).toBe(false);
      expect(tabs[2].mutedInfo.muted).toBe(true);
      expect(tabs[3].mutedInfo.muted).toBe(true);
    });
  });

  describe("browserAction", () => {
    describe("'Mute/Unmute current tab' menu item", () => {
      it("should unmute a muted tab when clicked", async () => {
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
          {
            id: 2,
            url: "https://www.youtube.com/",
            mutedInfo: { muted: false },
            active: false,
            lastFocusedWindow: true,
          },
        ];
        await startExtension();
        await loadBrowserAction();

        // Sanity check
        expect(tabs[0].mutedInfo.muted).toBe(true);
        expect(tabs[1].mutedInfo.muted).toBe(true);

        document
          .getElementById("autoMuteBrowserActionMuteTab")
          .dispatchEvent(new MouseEvent("click"));

        // Wait for the click event to be processed
        await new Promise(process.nextTick);

        expect(tabs[0].mutedInfo.muted).toBe(false);
        expect(tabs[1].mutedInfo.muted).toBe(true);
      });

      it("should mute an unmuted tab when clicked", async () => {
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
          {
            id: 2,
            url: "https://www.youtube.com/",
            mutedInfo: { muted: false },
            active: false,
            lastFocusedWindow: true,
          },
        ];
        await startExtension();
        await loadBrowserAction();

        // Sanity check
        expect(tabs[0].mutedInfo.muted).toBe(false);
        expect(tabs[1].mutedInfo.muted).toBe(false);

        document
          .getElementById("autoMuteBrowserActionMuteTab")
          .dispatchEvent(new MouseEvent("click"));

        // Wait for the click event to be processed
        await new Promise(process.nextTick);

        expect(tabs[0].mutedInfo.muted).toBe(true);
        expect(tabs[1].mutedInfo.muted).toBe(false);
      });

      it("should show 'Mute' when the tab is not muted", async () => {
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

        expect(
          document.getElementById("autoMuteBrowserActionMuteTabMuteUnmute")
            .innerHTML
        ).toBe("Mute");
      });

      it("should show 'Unmute' when the tab is muted", async () => {
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

        expect(
          document.getElementById("autoMuteBrowserActionMuteTabMuteUnmute")
            .innerHTML
        ).toBe("Unmute");
      });

      it("should show the correct shortcut keys", async () => {
        await startExtension();
        await loadBrowserAction();

        expect(
          document.getElementById("autoMuteBrowserActionMuteTabShortcut")
            .innerHTML
        ).toBe("&nbsp;(Ctrl+Shift+M)");
      });
    });

    describe("'Mute all tabs' menu item", () => {
      it("should mute all unmuted tabs when clicked", async () => {
        storage.usingAllowList = true;
        storage.allowOrBlockList =
          "https://www.youtube.com/\nhttps://google.com/";
        tabs = [
          {
            id: 1,
            url: "https://www.youtube.com/",
            mutedInfo: { muted: false },
            active: true,
            lastFocusedWindow: true,
          },
          {
            id: 2,
            url: "https://www.youtube.com/",
            mutedInfo: { muted: false },
            active: false,
            lastFocusedWindow: true,
          },
          {
            id: 3,
            url: "https://www.notyoutube.com/",
            mutedInfo: { muted: false },
            active: false,
            lastFocusedWindow: true,
          },
          {
            id: 4,
            url: "https://google.com/",
            mutedInfo: { muted: false },
            active: false,
            lastFocusedWindow: true,
          },
        ];
        await startExtension();
        await loadBrowserAction();

        // Sanity check
        expect(tabs[0].mutedInfo.muted).toBe(false);
        expect(tabs[1].mutedInfo.muted).toBe(false);
        expect(tabs[2].mutedInfo.muted).toBe(true);
        expect(tabs[3].mutedInfo.muted).toBe(false);

        document
          .getElementById("autoMuteBrowserActionMuteAll")
          .dispatchEvent(new MouseEvent("click"));

        // Wait for the click event to be processed
        await new Promise(process.nextTick);

        expect(tabs[0].mutedInfo.muted).toBe(true);
        expect(tabs[1].mutedInfo.muted).toBe(true);
        expect(tabs[2].mutedInfo.muted).toBe(true);
        expect(tabs[3].mutedInfo.muted).toBe(true);
      });

      it("should show the correct shortcut keys", async () => {
        await startExtension();
        await loadBrowserAction();

        expect(
          document.getElementById("autoMuteBrowserActionMuteAllShortcut")
            .innerHTML
        ).toBe("&nbsp;(Ctrl+Shift+A)");
      });
    });

    describe("'Mute other tabs' menu item", () => {
      it("should mute all inactive tabs when clicked", async () => {
        storage.usingAllowList = true;
        storage.allowOrBlockList =
          "https://www.youtube.com/\nhttps://google.com/";
        tabs = [
          {
            id: 1,
            url: "https://www.youtube.com/",
            mutedInfo: { muted: false },
            active: false,
            lastFocusedWindow: true,
          },
          {
            id: 2,
            url: "https://www.youtube.com/",
            mutedInfo: { muted: false },
            active: true,
            lastFocusedWindow: true,
          },
          {
            id: 3,
            url: "https://www.notyoutube.com/",
            mutedInfo: { muted: false },
            active: false,
            lastFocusedWindow: true,
          },
          {
            id: 4,
            url: "https://google.com/",
            mutedInfo: { muted: false },
            active: true,
            lastFocusedWindow: false,
          },
        ];
        await startExtension();
        await loadBrowserAction();

        // Sanity check
        expect(tabs[0].mutedInfo.muted).toBe(false);
        expect(tabs[1].mutedInfo.muted).toBe(false);
        expect(tabs[2].mutedInfo.muted).toBe(true);
        expect(tabs[3].mutedInfo.muted).toBe(false);

        document
          .getElementById("autoMuteBrowserActionMuteOther")
          .dispatchEvent(new MouseEvent("click"));

        // Wait for the click event to be processed
        await new Promise(process.nextTick);

        expect(tabs[0].mutedInfo.muted).toBe(true);
        expect(tabs[1].mutedInfo.muted).toBe(false);
        expect(tabs[2].mutedInfo.muted).toBe(true);
        expect(tabs[3].mutedInfo.muted).toBe(true);
      });

      it("should show the correct shortcut keys", async () => {
        await startExtension();
        await loadBrowserAction();

        expect(
          document.getElementById("autoMuteBrowserActionMuteOtherShortcut")
            .innerHTML
        ).toBe("&nbsp;(Ctrl+Shift+O)");
      });
    });

    describe("using an allow list", () => {
      beforeEach(() => {
        storage.usingAllowList = true;
      });

      describe("'Never/Always mute this page' menu item", () => {
        it("should unmute a muted tab when clicked", async () => {
          storage.allowOrBlockList = "";
          tabs = [
            {
              id: 1,
              url: "https://www.youtube.com/",
              mutedInfo: { muted: false },
              active: true,
              lastFocusedWindow: true,
            },
            {
              id: 2,
              url: "https://www.youtube.com/",
              mutedInfo: { muted: false },
              active: false,
              lastFocusedWindow: true,
            },
            {
              id: 3,
              url: "https://www.notyoutube.com/",
              mutedInfo: { muted: false },
              active: false,
              lastFocusedWindow: true,
            },
          ];
          await startExtension();
          await loadBrowserAction();

          // Sanity check
          expect(tabs[0].mutedInfo.muted).toBe(true);
          expect(tabs[1].mutedInfo.muted).toBe(true);
          expect(tabs[2].mutedInfo.muted).toBe(true);

          document
            .getElementById("autoMuteBrowserActionListPage")
            .dispatchEvent(new MouseEvent("click"));

          // Wait for the click event to be processed
          await new Promise(process.nextTick);

          expect(storage.allowOrBlockList).toBe("https://www.youtube.com/");

          expect(tabs[0].mutedInfo.muted).toBe(false);
          expect(tabs[1].mutedInfo.muted).toBe(false);
          expect(tabs[2].mutedInfo.muted).toBe(true);
        });

        it("should mute an unmuted tab when clicked", async () => {
          storage.allowOrBlockList =
            "https://www.youtube.com/\nhttps://www.notyoutube.com/";
          tabs = [
            {
              id: 1,
              url: "https://www.youtube.com/",
              mutedInfo: { muted: false },
              active: true,
              lastFocusedWindow: true,
            },
            {
              id: 2,
              url: "https://www.youtube.com/",
              mutedInfo: { muted: false },
              active: false,
              lastFocusedWindow: true,
            },
            {
              id: 3,
              url: "https://www.notyoutube.com/",
              mutedInfo: { muted: false },
              active: false,
              lastFocusedWindow: true,
            },
          ];
          await startExtension();
          await loadBrowserAction();

          // Sanity check
          expect(tabs[0].mutedInfo.muted).toBe(false);
          expect(tabs[1].mutedInfo.muted).toBe(false);
          expect(tabs[2].mutedInfo.muted).toBe(false);

          document
            .getElementById("autoMuteBrowserActionListPage")
            .dispatchEvent(new MouseEvent("click"));

          // Wait for the click event to be processed
          await new Promise(process.nextTick);

          expect(storage.allowOrBlockList).toBe("https://www.notyoutube.com/");

          expect(tabs[0].mutedInfo.muted).toBe(true);
          expect(tabs[1].mutedInfo.muted).toBe(true);
          expect(tabs[2].mutedInfo.muted).toBe(false);
        });

        it("should show 'Always' when the page is in the list", async () => {
          storage.allowOrBlockList = "https://www.youtube.com/";
          tabs = [
            {
              id: 1,
              url: "https://www.youtube.com/",
              mutedInfo: { muted: false },
              active: true,
              lastFocusedWindow: true,
            },
            {
              id: 2,
              url: "https://www.notyoutube.com/",
              mutedInfo: { muted: false },
              active: false,
              lastFocusedWindow: true,
            },
          ];
          await startExtension();
          await loadBrowserAction();

          expect(
            document.getElementById("autoMuteBrowserActionPageNeverOrAlways")
              .innerHTML
          ).toBe("Always&nbsp;mute&nbsp;this&nbsp;page");
        });

        it("should show 'Never' when the page is not in the list", async () => {
          storage.allowOrBlockList = "https://www.notyoutube.com/";
          tabs = [
            {
              id: 1,
              url: "https://www.youtube.com/",
              mutedInfo: { muted: false },
              active: true,
              lastFocusedWindow: true,
            },
            {
              id: 2,
              url: "https://www.notyoutube.com/",
              mutedInfo: { muted: false },
              active: false,
              lastFocusedWindow: true,
            },
          ];
          await startExtension();
          await loadBrowserAction();

          expect(
            document.getElementById("autoMuteBrowserActionPageNeverOrAlways")
              .innerHTML
          ).toBe("Never&nbsp;mute&nbsp;this&nbsp;page");
        });
      });

      describe("'Never/Always mute this domain' menu item", () => {
        it("should unmute a muted tab when clicked", async () => {
          storage.allowOrBlockList = "";
          tabs = [
            {
              id: 1,
              url: "https://www.youtube.com/",
              mutedInfo: { muted: false },
              active: true,
              lastFocusedWindow: true,
            },
            {
              id: 2,
              url: "https://www.youtube.com/watch?v=some_id",
              mutedInfo: { muted: false },
              active: false,
              lastFocusedWindow: true,
            },
            {
              id: 3,
              url: "https://www.notyoutube.com/",
              mutedInfo: { muted: false },
              active: false,
              lastFocusedWindow: true,
            },
          ];
          await startExtension();
          await loadBrowserAction();

          // Sanity check
          expect(tabs[0].mutedInfo.muted).toBe(true);
          expect(tabs[1].mutedInfo.muted).toBe(true);
          expect(tabs[2].mutedInfo.muted).toBe(true);

          document
            .getElementById("autoMuteBrowserActionListDomain")
            .dispatchEvent(new MouseEvent("click"));

          // Wait for the click event to be processed
          await new Promise(process.nextTick);

          expect(storage.allowOrBlockList).toBe("www.youtube.com/*");

          expect(tabs[0].mutedInfo.muted).toBe(false);
          expect(tabs[1].mutedInfo.muted).toBe(false);
          expect(tabs[2].mutedInfo.muted).toBe(true);
        });

        it("should mute an unmuted tab when clicked", async () => {
          storage.allowOrBlockList = "www.youtube.com/*\nwww.notyoutube.com/*";
          tabs = [
            {
              id: 1,
              url: "https://www.youtube.com/",
              mutedInfo: { muted: false },
              active: true,
              lastFocusedWindow: true,
            },
            {
              id: 2,
              url: "https://www.youtube.com/watch?v=some_id",
              mutedInfo: { muted: false },
              active: false,
              lastFocusedWindow: true,
            },
            {
              id: 3,
              url: "https://www.notyoutube.com/",
              mutedInfo: { muted: false },
              active: false,
              lastFocusedWindow: true,
            },
          ];
          await startExtension();
          await loadBrowserAction();

          // Sanity check
          expect(tabs[0].mutedInfo.muted).toBe(false);
          expect(tabs[1].mutedInfo.muted).toBe(false);
          expect(tabs[2].mutedInfo.muted).toBe(false);

          document
            .getElementById("autoMuteBrowserActionListDomain")
            .dispatchEvent(new MouseEvent("click"));

          // Wait for the click event to be processed
          await new Promise(process.nextTick);

          expect(storage.allowOrBlockList).toBe("www.notyoutube.com/*");

          expect(tabs[0].mutedInfo.muted).toBe(true);
          expect(tabs[1].mutedInfo.muted).toBe(true);
          expect(tabs[2].mutedInfo.muted).toBe(false);
        });

        it("should show 'Always' when the domain is in the list", async () => {
          storage.allowOrBlockList = "www.youtube.com/*";
          tabs = [
            {
              id: 1,
              url: "https://www.youtube.com/",
              mutedInfo: { muted: false },
              active: true,
              lastFocusedWindow: true,
            },
            {
              id: 2,
              url: "https://www.notyoutube.com/",
              mutedInfo: { muted: false },
              active: false,
              lastFocusedWindow: true,
            },
          ];
          await startExtension();
          await loadBrowserAction();

          expect(
            document.getElementById("autoMuteBrowserActionDomainNeverOrAlways")
              .innerHTML
          ).toBe("Always&nbsp;mute&nbsp;this&nbsp;domain");
        });

        it("should show 'Never' when the domain is not in the list", async () => {
          storage.allowOrBlockList = "www.notyoutube.com/*";
          tabs = [
            {
              id: 1,
              url: "https://www.youtube.com/",
              mutedInfo: { muted: false },
              active: true,
              lastFocusedWindow: true,
            },
            {
              id: 2,
              url: "https://www.notyoutube.com/",
              mutedInfo: { muted: false },
              active: false,
              lastFocusedWindow: true,
            },
          ];
          await startExtension();
          await loadBrowserAction();

          expect(
            document.getElementById("autoMuteBrowserActionDomainNeverOrAlways")
              .innerHTML
          ).toBe("Never&nbsp;mute&nbsp;this&nbsp;domain");
        });
      });
    });

    describe("using a block list", () => {
      beforeEach(() => {
        storage.usingAllowList = false;
      });

      describe("'Never/Always mute this page' menu item", () => {
        it("should mute an unmuted tab when clicked", async () => {
          storage.allowOrBlockList = "";
          tabs = [
            {
              id: 1,
              url: "https://www.youtube.com/",
              mutedInfo: { muted: false },
              active: true,
              lastFocusedWindow: true,
            },
            {
              id: 2,
              url: "https://www.youtube.com/",
              mutedInfo: { muted: false },
              active: false,
              lastFocusedWindow: true,
            },
            {
              id: 3,
              url: "https://www.notyoutube.com/",
              mutedInfo: { muted: false },
              active: false,
              lastFocusedWindow: true,
            },
          ];
          await startExtension();
          await loadBrowserAction();

          // Sanity check
          expect(tabs[0].mutedInfo.muted).toBe(false);
          expect(tabs[1].mutedInfo.muted).toBe(false);
          expect(tabs[2].mutedInfo.muted).toBe(false);

          document
            .getElementById("autoMuteBrowserActionListPage")
            .dispatchEvent(new MouseEvent("click"));

          // Wait for the click event to be processed
          await new Promise(process.nextTick);

          expect(storage.allowOrBlockList).toBe("https://www.youtube.com/");

          expect(tabs[0].mutedInfo.muted).toBe(true);
          expect(tabs[1].mutedInfo.muted).toBe(true);
          expect(tabs[2].mutedInfo.muted).toBe(false);
        });

        it("should unmute a muted tab when clicked", async () => {
          storage.allowOrBlockList =
            "https://www.youtube.com/\nhttps://www.notyoutube.com/";
          tabs = [
            {
              id: 1,
              url: "https://www.youtube.com/",
              mutedInfo: { muted: false },
              active: true,
              lastFocusedWindow: true,
            },
            {
              id: 2,
              url: "https://www.youtube.com/",
              mutedInfo: { muted: false },
              active: false,
              lastFocusedWindow: true,
            },
            {
              id: 3,
              url: "https://www.notyoutube.com/",
              mutedInfo: { muted: false },
              active: false,
              lastFocusedWindow: true,
            },
          ];
          await startExtension();
          await loadBrowserAction();

          // Sanity check
          expect(tabs[0].mutedInfo.muted).toBe(true);
          expect(tabs[1].mutedInfo.muted).toBe(true);
          expect(tabs[2].mutedInfo.muted).toBe(true);

          document
            .getElementById("autoMuteBrowserActionListPage")
            .dispatchEvent(new MouseEvent("click"));

          // Wait for the click event to be processed
          await new Promise(process.nextTick);

          expect(storage.allowOrBlockList).toBe("https://www.notyoutube.com/");

          expect(tabs[0].mutedInfo.muted).toBe(false);
          expect(tabs[1].mutedInfo.muted).toBe(false);
          expect(tabs[2].mutedInfo.muted).toBe(true);
        });

        it("should show 'Always' when the page is not in the list", async () => {
          storage.allowOrBlockList = "https://www.notyoutube.com/";
          tabs = [
            {
              id: 1,
              url: "https://www.youtube.com/",
              mutedInfo: { muted: false },
              active: true,
              lastFocusedWindow: true,
            },
            {
              id: 2,
              url: "https://www.notyoutube.com/",
              mutedInfo: { muted: false },
              active: false,
              lastFocusedWindow: true,
            },
          ];
          await startExtension();
          await loadBrowserAction();

          expect(
            document.getElementById("autoMuteBrowserActionPageNeverOrAlways")
              .innerHTML
          ).toBe("Always&nbsp;mute&nbsp;this&nbsp;page");
        });

        it("should show 'Never' when the page is in the list", async () => {
          storage.allowOrBlockList = "https://www.youtube.com/";
          tabs = [
            {
              id: 1,
              url: "https://www.youtube.com/",
              mutedInfo: { muted: false },
              active: true,
              lastFocusedWindow: true,
            },
            {
              id: 2,
              url: "https://www.notyoutube.com/",
              mutedInfo: { muted: false },
              active: false,
              lastFocusedWindow: true,
            },
          ];
          await startExtension();
          await loadBrowserAction();

          expect(
            document.getElementById("autoMuteBrowserActionPageNeverOrAlways")
              .innerHTML
          ).toBe("Never&nbsp;mute&nbsp;this&nbsp;page");
        });
      });

      describe("'Never/Always mute this domain' menu item", () => {
        it("should mute an unmuted tab when clicked", async () => {
          storage.allowOrBlockList = "";
          tabs = [
            {
              id: 1,
              url: "https://www.youtube.com/",
              mutedInfo: { muted: false },
              active: true,
              lastFocusedWindow: true,
            },
            {
              id: 2,
              url: "https://www.youtube.com/watch?v=some_id",
              mutedInfo: { muted: false },
              active: false,
              lastFocusedWindow: true,
            },
            {
              id: 3,
              url: "https://www.notyoutube.com/",
              mutedInfo: { muted: false },
              active: false,
              lastFocusedWindow: true,
            },
          ];
          await startExtension();
          await loadBrowserAction();

          // Sanity check
          expect(tabs[0].mutedInfo.muted).toBe(false);
          expect(tabs[1].mutedInfo.muted).toBe(false);
          expect(tabs[2].mutedInfo.muted).toBe(false);

          document
            .getElementById("autoMuteBrowserActionListDomain")
            .dispatchEvent(new MouseEvent("click"));

          // Wait for the click event to be processed
          await new Promise(process.nextTick);

          expect(storage.allowOrBlockList).toBe("www.youtube.com/*");

          expect(tabs[0].mutedInfo.muted).toBe(true);
          expect(tabs[1].mutedInfo.muted).toBe(true);
          expect(tabs[2].mutedInfo.muted).toBe(false);
        });

        it("should unmute a muted tab when clicked", async () => {
          storage.allowOrBlockList = "www.youtube.com/*\nwww.notyoutube.com/*";
          tabs = [
            {
              id: 1,
              url: "https://www.youtube.com/",
              mutedInfo: { muted: false },
              active: true,
              lastFocusedWindow: true,
            },
            {
              id: 2,
              url: "https://www.youtube.com/watch?v=some_id",
              mutedInfo: { muted: false },
              active: false,
              lastFocusedWindow: true,
            },
            {
              id: 3,
              url: "https://www.notyoutube.com/",
              mutedInfo: { muted: false },
              active: false,
              lastFocusedWindow: true,
            },
          ];
          await startExtension();
          await loadBrowserAction();

          // Sanity check
          expect(tabs[0].mutedInfo.muted).toBe(true);
          expect(tabs[1].mutedInfo.muted).toBe(true);
          expect(tabs[2].mutedInfo.muted).toBe(true);

          document
            .getElementById("autoMuteBrowserActionListDomain")
            .dispatchEvent(new MouseEvent("click"));

          // Wait for the click event to be processed
          await new Promise(process.nextTick);

          expect(storage.allowOrBlockList).toBe("www.notyoutube.com/*");

          expect(tabs[0].mutedInfo.muted).toBe(false);
          expect(tabs[1].mutedInfo.muted).toBe(false);
          expect(tabs[2].mutedInfo.muted).toBe(true);
        });

        it("should show 'Always' when the domain is not in the list", async () => {
          storage.allowOrBlockList = "www.notyoutube.com/*";
          tabs = [
            {
              id: 1,
              url: "https://www.youtube.com/",
              mutedInfo: { muted: false },
              active: true,
              lastFocusedWindow: true,
            },
            {
              id: 2,
              url: "https://www.notyoutube.com/",
              mutedInfo: { muted: false },
              active: false,
              lastFocusedWindow: true,
            },
          ];
          await startExtension();
          await loadBrowserAction();

          expect(
            document.getElementById("autoMuteBrowserActionDomainNeverOrAlways")
              .innerHTML
          ).toBe("Always&nbsp;mute&nbsp;this&nbsp;domain");
        });

        it("should show 'Never' when the domain is in the list", async () => {
          storage.allowOrBlockList = "www.youtube.com/*";
          tabs = [
            {
              id: 1,
              url: "https://www.youtube.com/",
              mutedInfo: { muted: false },
              active: true,
              lastFocusedWindow: true,
            },
            {
              id: 2,
              url: "https://www.notyoutube.com/",
              mutedInfo: { muted: false },
              active: false,
              lastFocusedWindow: true,
            },
          ];
          await startExtension();
          await loadBrowserAction();

          expect(
            document.getElementById("autoMuteBrowserActionDomainNeverOrAlways")
              .innerHTML
          ).toBe("Never&nbsp;mute&nbsp;this&nbsp;domain");
        });
      });
    });
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

  describe("options page", () => {
    describe("enabled checkbox", () => {
      it("should set the initial state when the extension is enabled", async () => {
        storage.enabled = true;
        await startExtension();
        await loadOptions();

        expect(document.getElementById("check-enabled").checked).toBeTruthy();
      });

      it("should set the initial state when the extension is disabled", async () => {
        storage.enabled = false;
        await startExtension();
        await loadOptions();

        expect(document.getElementById("check-enabled").checked).toBeFalsy();
      });

      it("should set the new value and update tabs when enabled is saved", async () => {
        storage.enabled = false;
        tabs = [
          {
            id: 1,
            url: "https://www.youtube.com",
            mutedInfo: { muted: false },
          },
          { id: 2, url: "https://www.google.com", mutedInfo: { muted: false } },
          {
            id: 3,
            url: "https://www.facebook.com",
            mutedInfo: { muted: false },
          },
        ];
        await startExtension();
        await loadOptions();

        // Sanity check
        expect(tabs[0].mutedInfo.muted).toBe(false);
        expect(tabs[1].mutedInfo.muted).toBe(false);
        expect(tabs[2].mutedInfo.muted).toBe(false);

        document.getElementById("check-enabled").checked = true;
        document.getElementById("save").dispatchEvent(new MouseEvent("click"));

        // Wait for the click event to be processed
        await new Promise(process.nextTick);

        expect(storage.enabled).toBeTruthy();
        expect(tabs[0].mutedInfo.muted).toBe(true);
        expect(tabs[1].mutedInfo.muted).toBe(true);
        expect(tabs[2].mutedInfo.muted).toBe(true);
      });

      it("should set the new value and update tabs when disabled is saved", async () => {
        storage.enabled = true;
        tabs = [
          {
            id: 1,
            url: "https://www.youtube.com",
            mutedInfo: { muted: false },
          },
          // This tab was already muted before the extension was enabled, so it should remain muted
          { id: 2, url: "https://www.google.com", mutedInfo: { muted: true } },
          {
            id: 3,
            url: "https://www.facebook.com",
            mutedInfo: { muted: false },
          },
        ];
        await startExtension();
        await loadOptions();

        // Sanity check
        expect(tabs[0].mutedInfo.muted).toBe(true);
        expect(tabs[1].mutedInfo.muted).toBe(true);
        expect(tabs[2].mutedInfo.muted).toBe(true);

        document.getElementById("check-enabled").checked = false;
        document.getElementById("save").dispatchEvent(new MouseEvent("click"));

        // Wait for the click event to be processed
        await new Promise(process.nextTick);

        expect(storage.enabled).toBeFalsy();
        expect(tabs[0].mutedInfo.muted).toBe(false);
        expect(tabs[1].mutedInfo.muted).toBe(true);
        expect(tabs[2].mutedInfo.muted).toBe(false);
      });
    });

    describe("allow/block radio buttons", () => {
      it("should set the initial state when allow is set", async () => {
        storage.usingAllowList = true;
        await startExtension();
        await loadOptions();

        expect(document.getElementById("radio-allow").checked).toBeTruthy();
        expect(document.getElementById("radio-block").checked).toBeFalsy();
      });

      it("should set the initial state when block is set", async () => {
        storage.usingAllowList = false;
        await startExtension();
        await loadOptions();

        expect(document.getElementById("radio-allow").checked).toBeFalsy();
        expect(document.getElementById("radio-block").checked).toBeTruthy();
      });

      it("should show the correct initial description when allow is set", async () => {
        storage.usingAllowList = true;
        await startExtension();
        await loadOptions();

        expect(document.getElementById("allow-description").style.display).toBe(
          "block"
        );
        expect(document.getElementById("block-description").style.display).toBe(
          "none"
        );
      });

      it("should show the correct initial description when block is set", async () => {
        storage.usingAllowList = false;
        await startExtension();
        await loadOptions();

        expect(document.getElementById("allow-description").style.display).toBe(
          "none"
        );
        expect(document.getElementById("block-description").style.display).toBe(
          "block"
        );
      });

      it("should show the correct description when block is selected", async () => {
        storage.usingAllowList = true;
        await startExtension();
        await loadOptions();

        document.getElementById("radio-allow").checked = false;
        document.getElementById("radio-block").checked = true;
        document
          .getElementById("radio-block")
          .dispatchEvent(new Event("change"));

        expect(document.getElementById("allow-description").style.display).toBe(
          "none"
        );
        expect(document.getElementById("block-description").style.display).toBe(
          "block"
        );
      });

      it("should show the correct description when allow is selected", async () => {
        storage.usingAllowList = false;
        await startExtension();
        await loadOptions();

        document.getElementById("radio-allow").checked = true;
        document.getElementById("radio-block").checked = false;
        document
          .getElementById("radio-allow")
          .dispatchEvent(new Event("change"));

        expect(document.getElementById("allow-description").style.display).toBe(
          "block"
        );
        expect(document.getElementById("block-description").style.display).toBe(
          "none"
        );
      });

      it("should set the new value and update tabs when allow is saved", async () => {
        storage.usingAllowList = false;
        storage.allowOrBlockList = "https://www.youtube.com";
        tabs = [
          {
            id: 1,
            url: "https://www.youtube.com",
            mutedInfo: { muted: false },
          },
          { id: 2, url: "https://www.google.com", mutedInfo: { muted: false } },
          {
            id: 3,
            url: "https://www.facebook.com",
            mutedInfo: { muted: false },
          },
        ];
        await startExtension();
        await loadOptions();

        // Sanity check
        expect(tabs[0].mutedInfo.muted).toBe(true);
        expect(tabs[1].mutedInfo.muted).toBe(false);
        expect(tabs[2].mutedInfo.muted).toBe(false);

        document.getElementById("radio-allow").checked = true;
        document.getElementById("radio-block").checked = false;
        document.getElementById("save").dispatchEvent(new MouseEvent("click"));

        // Wait for the click event to be processed
        await new Promise(process.nextTick);

        expect(storage.usingAllowList).toBeTruthy();
        expect(tabs[0].mutedInfo.muted).toBe(false);
        expect(tabs[1].mutedInfo.muted).toBe(true);
        expect(tabs[2].mutedInfo.muted).toBe(true);
      });

      it("should set the new value and update tabs when block is saved", async () => {
        storage.usingAllowList = true;
        storage.allowOrBlockList = "https://www.youtube.com";
        tabs = [
          {
            id: 1,
            url: "https://www.youtube.com",
            mutedInfo: { muted: false },
          },
          { id: 2, url: "https://www.google.com", mutedInfo: { muted: false } },
          {
            id: 3,
            url: "https://www.facebook.com",
            mutedInfo: { muted: false },
          },
        ];
        await startExtension();
        await loadOptions();

        // Sanity check
        expect(tabs[0].mutedInfo.muted).toBe(false);
        expect(tabs[1].mutedInfo.muted).toBe(true);
        expect(tabs[2].mutedInfo.muted).toBe(true);

        document.getElementById("radio-allow").checked = false;
        document.getElementById("radio-block").checked = true;
        document.getElementById("save").dispatchEvent(new MouseEvent("click"));

        // Wait for the click event to be processed
        await new Promise(process.nextTick);

        expect(storage.usingAllowList).toBeFalsy();
        expect(tabs[0].mutedInfo.muted).toBe(true);
        expect(tabs[1].mutedInfo.muted).toBe(false);
        expect(tabs[2].mutedInfo.muted).toBe(false);
      });
    });

    describe("list text area", () => {
      it("should set the initial value", async () => {
        storage.allowOrBlockList = "www.youtube.com\nwww.google.com";
        await startExtension();
        await loadOptions();

        expect(document.getElementById("url-list").value).toBe(
          "www.youtube.com\nwww.google.com"
        );
      });

      it("should set the new value and update tabs when saved", async () => {
        storage.allowOrBlockList = "www.youtube.com\nwww.google.com";
        tabs = [
          {
            id: 1,
            url: "https://www.youtube.com",
            mutedInfo: { muted: false },
          },
          { id: 2, url: "https://www.google.com", mutedInfo: { muted: false } },
          {
            id: 3,
            url: "https://www.facebook.com",
            mutedInfo: { muted: false },
          },
        ];
        await startExtension();
        await loadOptions();

        // Sanity check
        expect(tabs[0].mutedInfo.muted).toBe(false);
        expect(tabs[1].mutedInfo.muted).toBe(false);
        expect(tabs[2].mutedInfo.muted).toBe(true);

        document.getElementById("url-list").value =
          "www.youtube.com\nwww.facebook.com";
        document.getElementById("save").dispatchEvent(new MouseEvent("click"));

        // Wait for the click event to be processed
        await new Promise(process.nextTick);

        expect(storage.allowOrBlockList).toBe(
          "www.youtube.com\nwww.facebook.com"
        );
        expect(tabs[0].mutedInfo.muted).toBe(false);
        expect(tabs[1].mutedInfo.muted).toBe(true);
        expect(tabs[2].mutedInfo.muted).toBe(false);
      });

      it("should strip whitespace when saving", async () => {
        await startExtension();
        await loadOptions();

        document.getElementById("url-list").value =
          "  www.youtube.com \n\nwww.facebook.com  \n  ";
        document.getElementById("save").dispatchEvent(new MouseEvent("click"));

        // Wait for the click event to be processed
        await new Promise(process.nextTick);

        expect(storage.allowOrBlockList).toBe(
          "www.youtube.com\nwww.facebook.com"
        );
      });
    });

    describe("save behavior", () => {
      it("should show a success message when saved", async () => {
        await startExtension();
        await loadOptions();

        document.getElementById("save").dispatchEvent(new MouseEvent("click"));

        // Wait for the click event to be processed
        await new Promise(process.nextTick);

        expect(document.getElementById("status").innerHTML).toBe(
          "Options saved."
        );
      });

      it("should disable all controls when saving", async () => {
        await startExtension();
        await loadOptions();

        document.getElementById("save").dispatchEvent(new MouseEvent("click"));

        // Wait for the click event to be processed
        await new Promise(process.nextTick);

        expect(document.getElementById("check-enabled").disabled).toBeTruthy();
        expect(document.getElementById("radio-allow").disabled).toBeTruthy();
        expect(document.getElementById("radio-block").disabled).toBeTruthy();
        expect(document.getElementById("url-list").disabled).toBeTruthy();
        expect(document.getElementById("save").disabled).toBeTruthy();
      });

      it("should remove the success message after a delay", async () => {
        await startExtension();
        await loadOptions();

        document.getElementById("save").dispatchEvent(new MouseEvent("click"));

        // Wait for the click event to be processed
        await new Promise(process.nextTick);

        // Sanity check
        expect(document.getElementById("status").innerHTML).toBe(
          "Options saved."
        );

        await timeoutListener();

        expect(document.getElementById("status").innerHTML).toBe("");
      });

      it("should re-enable all controls after a delay", async () => {
        await startExtension();
        await loadOptions();

        document.getElementById("save").dispatchEvent(new MouseEvent("click"));

        // Wait for the click event to be processed
        await new Promise(process.nextTick);

        // Sanity check
        expect(document.getElementById("check-enabled").disabled).toBeTruthy();
        expect(document.getElementById("radio-allow").disabled).toBeTruthy();
        expect(document.getElementById("radio-block").disabled).toBeTruthy();
        expect(document.getElementById("url-list").disabled).toBeTruthy();
        expect(document.getElementById("save").disabled).toBeTruthy();

        await timeoutListener();

        expect(document.getElementById("check-enabled").disabled).toBeFalsy();
        expect(document.getElementById("radio-allow").disabled).toBeFalsy();
        expect(document.getElementById("radio-block").disabled).toBeFalsy();
        expect(document.getElementById("url-list").disabled).toBeFalsy();
        expect(document.getElementById("save").disabled).toBeFalsy();
      });

      it("should close the options page after a delay", async () => {
        jest.spyOn(window, "close");
        await startExtension();
        await loadOptions();

        document.getElementById("save").dispatchEvent(new MouseEvent("click"));

        // Wait for the click event to be processed
        await new Promise(process.nextTick);

        // Sanity check
        expect(window.close).not.toHaveBeenCalled();

        await timeoutListener();

        expect(window.close).toHaveBeenCalled();
      });
    });
  });

  describe("notifications", () => {});
});
