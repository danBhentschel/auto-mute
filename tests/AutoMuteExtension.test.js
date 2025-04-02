import { jest } from "@jest/globals";

import AutoMuteExtension from "../extension/AutoMuteExtension";

it("should instantiate AutoMuteExtension", () => {
  expect(AutoMuteExtension).toBeDefined();
});

describe("AutoMuteExtension ->", () => {
  let mockChrome;
  let mockCoordinator;
  let mockOptions;
  let mockTracker;
  let mockSwitcher;
  let mockLogger;
  let extension;

  let onTabCreatedListener;
  let onTabReplacedListener;
  let onTabUpdatedListener;
  let onTabActivatedListener;
  let onTabRemovedListener;
  let onWindowFocusChangedListener;
  let onCommandListener;
  let onMessageListener;

  let tab;
  let shouldMuteAllTabs;

  beforeEach(() => {
    shouldMuteAllTabs = true;

    tab = {
      id: 42,
      url: "http://www.youtube.com",
      mutedInfo: { muted: false },
    };

    mockChrome = {
      tabs: {
        onCreated: {
          addListener: () => {},
        },
        onReplaced: {
          addListener: () => {},
        },
        onUpdated: {
          addListener: () => {},
        },
        onActivated: {
          addListener: () => {},
        },
        onRemoved: {
          addListener: () => {},
        },
      },
      commands: {
        onCommand: {
          addListener: () => {},
        },
      },
      runtime: {
        onMessage: {
          addListener: () => {},
        },
      },
      windows: {
        onFocusChanged: {
          addListener: () => {},
        },
      },
      storage: {
        session: {
          set: async () => {},
          get: async () => {
            return { shouldMuteAllTabs };
          },
        },
      },
    };

    onTabCreatedListener = undefined;
    onTabReplacedListener = undefined;
    onTabUpdatedListener = undefined;
    onTabActivatedListener = undefined;
    onTabRemovedListener = undefined;
    onCommandListener = undefined;
    onMessageListener = undefined;

    jest
      .spyOn(mockChrome.tabs.onCreated, "addListener")
      .mockImplementation((listener) => {
        onTabCreatedListener = listener;
      });
    jest
      .spyOn(mockChrome.tabs.onReplaced, "addListener")
      .mockImplementation((listener) => {
        onTabReplacedListener = listener;
      });
    jest
      .spyOn(mockChrome.tabs.onUpdated, "addListener")
      .mockImplementation((listener) => {
        onTabUpdatedListener = listener;
      });
    jest
      .spyOn(mockChrome.tabs.onActivated, "addListener")
      .mockImplementation((listener) => {
        onTabActivatedListener = listener;
      });
    jest
      .spyOn(mockChrome.tabs.onRemoved, "addListener")
      .mockImplementation((listener) => {
        onTabRemovedListener = listener;
      });
    jest
      .spyOn(mockChrome.windows.onFocusChanged, "addListener")
      .mockImplementation((listener) => {
        onWindowFocusChangedListener = listener;
      });
    jest
      .spyOn(mockChrome.commands.onCommand, "addListener")
      .mockImplementation((listener) => {
        onCommandListener = listener;
      });
    jest
      .spyOn(mockChrome.runtime.onMessage, "addListener")
      .mockImplementation((listener) => {
        onMessageListener = listener;
      });

    mockCoordinator = {
      upgrade: async () => {},
    };

    mockOptions = {
      getUsingAllowAudioList: async () => {},
    };

    mockTracker = {
      muteAllTabsByApplicationLogic: async () => {},
      muteAllTabsByUserRequest: async () => {},
      muteOtherTabsByUserRequest: async () => {},
      muteByApplicationLogic: async () => {},
      addOrRemoveCurrentPageInList: async () => {},
      addOrRemoveCurrentDomainInList: async () => {},
      onTabReplaced: async () => {},
      onTabUrlChanged: async () => {},
      onTabRemoved: async () => {},
      isCurrentTabMuted: async () => {},
      applyMute: async () => {},
      isCurrentTabInList: async () => {},
      isDomainOfCurrentTabInList: async () => {},
      updateSettings: async () => {},
      start: async () => {},
    };

    mockSwitcher = {
      setSystemColorScheme: async () => {},
      updateIcon: async () => {},
      start: async () => {},
    };

    mockLogger = {
      log: () => {},
      error: () => {},
    };

    extension = new AutoMuteExtension(
      mockChrome,
      mockCoordinator,
      mockOptions,
      mockTracker,
      mockSwitcher,
      mockLogger
    );
    extension.__isInUnitTest = true;
  });

  it("should try to mute all tabs on start", async () => {
    const muteAllTabsSpy = jest.spyOn(
      mockTracker,
      "muteAllTabsByApplicationLogic"
    );
    extension.start();
    await new Promise(process.nextTick); // Wait for promises to resolve

    expect(muteAllTabsSpy).toHaveBeenCalled();
  });

  it("should not try to mute all tabs on start if storage is set", async () => {
    shouldMuteAllTabs = false;

    const muteAllTabsSpy = jest.spyOn(
      mockTracker,
      "muteAllTabsByApplicationLogic"
    );
    extension.start();
    await new Promise(process.nextTick); // Wait for promises to resolve

    expect(muteAllTabsSpy).not.toHaveBeenCalled();
  });

  it("should try to mute any newly created tab", async () => {
    const muteByApplicationLogicSpy = jest.spyOn(
      mockTracker,
      "muteByApplicationLogic"
    );
    extension.start();

    await onTabCreatedListener(tab);

    expect(muteByApplicationLogicSpy).toHaveBeenCalled();
    expect(muteByApplicationLogicSpy.mock.calls[0]).toEqual([tab]);
  });

  it("should update the icon for any newly created tab", async () => {
    extension.start();

    const updateIconSpy = jest.spyOn(mockSwitcher, "updateIcon");
    await onTabCreatedListener(tab);

    expect(updateIconSpy).toHaveBeenCalled();
  });

  it("should call TabTracker.onTabReplaced when a tab is replaced", async () => {
    const onTabReplacedSpy = jest.spyOn(mockTracker, "onTabReplaced");
    extension.start();

    await onTabReplacedListener(42, 43);

    expect(onTabReplacedSpy).toHaveBeenCalled();
    expect(onTabReplacedSpy.mock.calls[0]).toEqual([42, 43]);
  });

  it("should update the icon when a tab is replaced", async () => {
    extension.start();

    const updateIconSpy = jest.spyOn(mockSwitcher, "updateIcon");
    await onTabReplacedListener(42, 43);

    expect(updateIconSpy).toHaveBeenCalled();
  });

  it("should call TabTracker.onTabRemoved when a tab is removed", async () => {
    const onTabRemovedSpy = jest.spyOn(mockTracker, "onTabRemoved");
    extension.start();

    await onTabRemovedListener(tab.id);

    expect(onTabRemovedSpy).toHaveBeenCalled();
    expect(onTabRemovedSpy.mock.calls[0]).toEqual([tab.id]);
  });

  it("should try to mute a tab when the URL changes", async () => {
    const onTabUrlChangedSpy = jest.spyOn(mockTracker, "onTabUrlChanged");
    extension.start();

    await onTabUpdatedListener(tab.id, { url: tab.url });

    expect(onTabUrlChangedSpy).toHaveBeenCalled();
    expect(onTabUrlChangedSpy.mock.calls[0]).toEqual([tab.id, tab.url]);
  });

  it("should update the icon when the URL changes", async () => {
    extension.start();

    const updateIconSpy = jest.spyOn(mockSwitcher, "updateIcon");
    await onTabUpdatedListener(tab.id, { url: tab.url });

    expect(updateIconSpy).toHaveBeenCalled();
  });

  it("should update the icon when the activated tab changes", async () => {
    extension.start();

    const updateIconSpy = jest.spyOn(mockSwitcher, "updateIcon");
    await onTabActivatedListener();

    expect(updateIconSpy).toHaveBeenCalled();
  });

  it("should update the icon when the focused window changes", async () => {
    extension.start();

    const updateIconSpy = jest.spyOn(mockSwitcher, "updateIcon");
    await onWindowFocusChangedListener();

    expect(updateIconSpy).toHaveBeenCalled();
  });

  it("should apply mute rules to the current tab for apply-mute command", async () => {
    extension.start();

    const applyMuteSpy = jest.spyOn(mockTracker, "applyMute");
    await onCommandListener("apply-mute");

    expect(applyMuteSpy).toHaveBeenCalled();
  });

  it("should update the icon for apply-mute command", async () => {
    extension.start();

    const updateIconSpy = jest.spyOn(mockSwitcher, "updateIcon");
    await onCommandListener("apply-mute");

    expect(updateIconSpy).toHaveBeenCalled();
  });

  it("should mute all tabs for mute-all command", async () => {
    extension.start();

    const muteAllSpy = jest.spyOn(mockTracker, "muteAllTabsByUserRequest");
    await onCommandListener("mute-all");

    expect(muteAllSpy).toHaveBeenCalled();
  });

  it("should update the icon for mute-all command", async () => {
    extension.start();

    const updateIconSpy = jest.spyOn(mockSwitcher, "updateIcon");
    await onCommandListener("mute-all");

    expect(updateIconSpy).toHaveBeenCalled();
  });

  it("should mute other tabs for mute-other command", async () => {
    extension.start();

    const muteOtherSpy = jest.spyOn(mockTracker, "muteOtherTabsByUserRequest");
    await onCommandListener("mute-other");

    expect(muteOtherSpy).toHaveBeenCalled();
  });

  it("should update the icon for mute-other command", async () => {
    extension.start();

    const updateIconSpy = jest.spyOn(mockSwitcher, "updateIcon");
    await onCommandListener("mute-other");

    expect(updateIconSpy).toHaveBeenCalled();
  });

  it("should update the list for list-page command", async () => {
    extension.start();

    const listPageSpy = jest.spyOn(mockTracker, "addOrRemoveCurrentPageInList");
    await onCommandListener("list-page");

    expect(listPageSpy).toHaveBeenCalled();
  });

  it("should update the icon for list-page command", async () => {
    extension.start();

    const updateIconSpy = jest.spyOn(mockSwitcher, "updateIcon");
    await onCommandListener("list-page");

    expect(updateIconSpy).toHaveBeenCalled();
  });

  it("should update the list for list-domain command", async () => {
    extension.start();

    const listDomainSpy = jest.spyOn(
      mockTracker,
      "addOrRemoveCurrentDomainInList"
    );
    await onCommandListener("list-domain");

    expect(listDomainSpy).toHaveBeenCalled();
  });

  it("should update the icon for list-domain command", async () => {
    extension.start();

    const updateIconSpy = jest.spyOn(mockSwitcher, "updateIcon");
    await onCommandListener("list-domain");

    expect(updateIconSpy).toHaveBeenCalled();
  });

  it("should apply mute rules to the current tab for apply-mute message", async () => {
    extension.start();

    const applyMuteSpy = jest.spyOn(mockTracker, "applyMute");
    const result = onMessageListener({ command: "apply-mute" });
    expect(result).toBe(false);

    // Wait for promises to resolve
    await new Promise(process.nextTick);

    expect(applyMuteSpy).toHaveBeenCalled();
  });

  it("should update the icon for apply-mute message", async () => {
    extension.start();

    const updateIconSpy = jest.spyOn(mockSwitcher, "updateIcon");
    onMessageListener({ command: "apply-mute" });

    // Wait for promises to resolve
    await new Promise(process.nextTick);

    expect(updateIconSpy).toHaveBeenCalled();
  });

  it("should mute all tabs for mute-all message", async () => {
    extension.start();

    const muteAllSpy = jest.spyOn(mockTracker, "muteAllTabsByUserRequest");
    const result = onMessageListener({ command: "mute-all" });
    expect(result).toBe(false);

    // Wait for promises to resolve
    await new Promise(process.nextTick);

    expect(muteAllSpy).toHaveBeenCalled();
  });

  it("should update the icon for mute-all message", async () => {
    extension.start();

    const updateIconSpy = jest.spyOn(mockSwitcher, "updateIcon");
    onMessageListener({ command: "mute-all" });

    // Wait for promises to resolve
    await new Promise(process.nextTick);

    expect(updateIconSpy).toHaveBeenCalled();
  });

  it("should mute other tabs for mute-other message", async () => {
    extension.start();

    const muteOtherSpy = jest.spyOn(mockTracker, "muteOtherTabsByUserRequest");
    const result = onMessageListener({ command: "mute-other" });
    expect(result).toBe(false);

    // Wait for promises to resolve
    await new Promise(process.nextTick);

    expect(muteOtherSpy).toHaveBeenCalled();
  });

  it("should update the icon for mute-other message", async () => {
    extension.start();

    const updateIconSpy = jest.spyOn(mockSwitcher, "updateIcon");
    onMessageListener({ command: "mute-other" });

    // Wait for promises to resolve
    await new Promise(process.nextTick);

    expect(updateIconSpy).toHaveBeenCalled();
  });

  it("should update the list for list-page message", async () => {
    extension.start();

    const listPageSpy = jest.spyOn(mockTracker, "addOrRemoveCurrentPageInList");
    const result = onMessageListener({ command: "list-page" });
    expect(result).toBe(false);

    // Wait for promises to resolve
    await new Promise(process.nextTick);

    expect(listPageSpy).toHaveBeenCalled();
  });

  it("should update the icon for list-page message", async () => {
    extension.start();

    const updateIconSpy = jest.spyOn(mockSwitcher, "updateIcon");
    onMessageListener({ command: "list-page" });

    // Wait for promises to resolve
    await new Promise(process.nextTick);

    expect(updateIconSpy).toHaveBeenCalled();
  });

  it("should update the list for list-domain message", async () => {
    extension.start();

    const listDomainSpy = jest.spyOn(
      mockTracker,
      "addOrRemoveCurrentDomainInList"
    );
    const result = onMessageListener({ command: "list-domain" });
    expect(result).toBe(false);

    // Wait for promises to resolve
    await new Promise(process.nextTick);

    expect(listDomainSpy).toHaveBeenCalled();
  });

  it("should update the icon for list-domain message", async () => {
    extension.start();

    const updateIconSpy = jest.spyOn(mockSwitcher, "updateIcon");
    onMessageListener("list-domain");

    // Wait for promises to resolve
    await new Promise(process.nextTick);

    expect(updateIconSpy).toHaveBeenCalled();
  });

  it("should return current tab muted info for query-current-muted message", async () => {
    const isCurrentTabMutedSpy = jest
      .spyOn(mockTracker, "isCurrentTabMuted")
      .mockResolvedValue(true);
    extension.start();

    let isMuted = false;
    const result = onMessageListener(
      { command: "query-current-muted" },
      "sender",
      (response) => {
        isMuted = response.muted;
      }
    );
    expect(result).toBe(true);

    // Wait for promises to resolve
    await new Promise(process.nextTick);

    expect(isCurrentTabMutedSpy).toHaveBeenCalled();
    expect(isMuted).toBe(true);
  });

  it("should return current allow/block list setting for query-using-should-allow-list message", async () => {
    const getUsingAllowAudioListSpy = jest
      .spyOn(mockOptions, "getUsingAllowAudioList")
      .mockResolvedValue(true);
    extension.start();

    let isAllowList = false;
    const result = onMessageListener(
      { command: "query-using-should-allow-list" },
      "sender",
      (response) => {
        isAllowList = response.usingAllowAudioList;
      }
    );
    expect(result).toBe(true);

    // Wait for promises to resolve
    await new Promise(process.nextTick);

    expect(getUsingAllowAudioListSpy).toHaveBeenCalled();
    expect(isAllowList).toBe(true);
  });

  it("should return whether the page is in the list for query-page-listed message", async () => {
    const isPageListedSpy = jest
      .spyOn(mockTracker, "isCurrentTabInList")
      .mockResolvedValue(true);
    extension.start();

    let isPageListed = false;
    const result = onMessageListener(
      { command: "query-page-listed" },
      "sender",
      (response) => {
        isPageListed = response.listed;
      }
    );
    expect(result).toBe(true);

    // Wait for promises to resolve
    await new Promise(process.nextTick);

    expect(isPageListedSpy).toHaveBeenCalled();
    expect(isPageListed).toBe(true);
  });

  it("should return whether the domain is in the list for query-domain-listed message", async () => {
    const isDomainListedSpy = jest
      .spyOn(mockTracker, "isDomainOfCurrentTabInList")
      .mockResolvedValue(true);
    extension.start();

    let isDomainListed = false;
    const result = onMessageListener(
      { command: "query-domain-listed" },
      "sender",
      (response) => {
        isDomainListed = response.listed;
      }
    );
    expect(result).toBe(true);

    // Wait for promises to resolve
    await new Promise(process.nextTick);

    expect(isDomainListedSpy).toHaveBeenCalled();
    expect(isDomainListed).toBe(true);
  });

  it("should update the settings for update-settings message", async () => {
    extension.start();

    const updateSettingsSpy = jest.spyOn(mockTracker, "updateSettings");
    const result = onMessageListener({ command: "update-settings" });
    expect(result).toBe(false);

    // Wait for promises to resolve
    await new Promise(process.nextTick);

    expect(updateSettingsSpy).toHaveBeenCalled();
  });

  it("should respond properly to a change-color-scheme message", async () => {
    jest.spyOn(mockSwitcher, "setSystemColorScheme").mockResolvedValue("dark");
    extension.start();

    let systemColorScheme = "unset";
    const result = onMessageListener(
      { command: "change-color-scheme", data: { scheme: "dark" } },
      "sender",
      (response) => {
        systemColorScheme = response.systemColorScheme;
      }
    );
    expect(result).toBe(true);

    // Wait for promises to resolve
    await new Promise(process.nextTick);

    expect(systemColorScheme).toBe("dark");
  });
});
