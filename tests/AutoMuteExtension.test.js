import { jest } from "@jest/globals";

import AutoMuteExtension from "../extension/AutoMuteExtension";

test("Should instantiate AutoMuteExtension", () => {
  expect(AutoMuteExtension).toBeDefined();
});

describe("AutoMuteExtension ->", () => {
  let mockChrome;
  let mockOptions;
  let mockTracker;
  let mockLogger;
  let extension;

  let onTabCreatedListener;
  let onTabReplacedListener;
  let onTabUpdatedListener;
  let onCommandListener;
  let onMessageListener;

  let tab;

  beforeEach(() => {
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
    };

    onTabCreatedListener = undefined;
    onTabReplacedListener = undefined;
    onTabUpdatedListener = undefined;
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
      .spyOn(mockChrome.commands.onCommand, "addListener")
      .mockImplementation((listener) => {
        onCommandListener = listener;
      });
    jest
      .spyOn(mockChrome.runtime.onMessage, "addListener")
      .mockImplementation((listener) => {
        onMessageListener = listener;
      });

    mockTracker = {
      muteAllTabs: async () => {},
      muteIfShould: async () => {},
      onTabReplaced: async () => {},
      updateTabMutedState: async () => {},
      onTabUrlChanged: async () => {},
      isCurrentTabMuted: async () => {},
      applyMute: async () => {},
    };

    mockLogger = {
      log: () => {},
      error: () => {},
    };

    extension = new AutoMuteExtension(
      mockChrome,
      mockOptions,
      mockTracker,
      mockLogger
    );
    extension.__isInUnitTest = true;
  });

  test("should try to mute all tabs on start", async () => {
    const muteAllTabsSpy = jest.spyOn(mockTracker, "muteAllTabs");
    await extension.start();

    expect(muteAllTabsSpy).toHaveBeenCalled();
  });

  test("should try to mute any newly created tab", async () => {
    const muteIfShouldSpy = jest.spyOn(mockTracker, "muteIfShould");
    extension.start();

    await onTabCreatedListener(tab);

    expect(muteIfShouldSpy).toHaveBeenCalled();
    expect(muteIfShouldSpy.mock.calls[0]).toEqual([tab]);
  });

  test("should call TabTracker.onTabReplaced when a tab is replaced", async () => {
    const onTabReplacedSpy = jest.spyOn(mockTracker, "onTabReplaced");
    extension.start();

    await onTabReplacedListener(42, 43);

    expect(onTabReplacedSpy).toHaveBeenCalled();
    expect(onTabReplacedSpy.mock.calls[0]).toEqual([42, 43]);
  });

  test("should update the tab muted state when a user mutes a tab", async () => {
    const updateTabMutedStateSpy = jest.spyOn(
      mockTracker,
      "updateTabMutedState"
    );
    extension.start();

    await onTabUpdatedListener(tab.id, { mutedInfo: tab.mutedInfo });

    expect(updateTabMutedStateSpy).toHaveBeenCalled();
    expect(updateTabMutedStateSpy.mock.calls[0]).toEqual([
      tab.id,
      tab.mutedInfo.muted,
    ]);
  });

  test("should try to mute a tab when the URL changes", async () => {
    const onTabUrlChangedSpy = jest.spyOn(mockTracker, "onTabUrlChanged");
    extension.start();

    await onTabUpdatedListener(tab.id, { url: tab.url });

    expect(onTabUrlChangedSpy).toHaveBeenCalled();
    expect(onTabUrlChangedSpy.mock.calls[0]).toEqual([tab.id, tab.url]);
  });

  test("should apply mute rules to the current tab for apply-mute command", async () => {
    const applyMuteSpy = jest.spyOn(mockTracker, "applyMute");
    extension.start();

    await onCommandListener("apply-mute");

    expect(applyMuteSpy).toHaveBeenCalled();
  });

  test("should return current tab muted info for query-current-muted message", async () => {
    const isCurrentTabMutedSpy = jest
      .spyOn(mockTracker, "isCurrentTabMuted")
      .mockResolvedValue(true);
    extension.start();

    let isMuted = false;
    const result = await onMessageListener(
      { command: "query-current-muted" },
      "sender",
      (response) => {
        isMuted = response.muted;
      }
    );

    expect(isCurrentTabMutedSpy).toHaveBeenCalled();
    expect(result).toBe(true);
    expect(isMuted).toBe(true);
  });
});
