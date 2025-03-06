import { jest } from "@jest/globals";

import TabTracker from "../extension/TabTracker.js";
import ListInfo from "../extension/ListInfo.js";

test("Should instantiate TabTracker", () => {
  expect(TabTracker).toBeDefined();
});

describe("TabTracker ->", () => {
  let mockChrome;
  let mockExtensionOptions;
  let mockListExpert;
  let mockLogger;
  let tabs = [];

  /**
   * @param {boolean} value
   */
  function setValueForEnabledInOptions(value) {
    jest.spyOn(mockExtensionOptions, "getEnabled").mockResolvedValue(value);
  }

  function getTab(id) {
    return tabs.find((t) => t.id === id);
  }

  function getTabMuteState(id) {
    return tabs.find((t) => t.id === id).properties?.muted ?? false;
  }

  beforeEach(() => {
    mockChrome = {
      tabs: {
        update: (tabId, updateProperties) => {
          const tab = getTab(tabId);
          tab.properties = { ...tab.properties, ...updateProperties };
        },
        query: () => {},
        get: () => {},
      },
    };

    mockExtensionOptions = {
      getEnabled: async () => {},
      getUsingShouldNotMuteList: async () => {},
    };

    mockListExpert = {
      getListInfo: async () => {},
      isInList: async () => {},
      addOrRemoveUrlInList: async () => {},
      addOrRemoveDomainInList: async () => {},
    };

    mockLogger = {
      log: () => {},
      error: () => {},
    };

    tabs = [];
  });

  describe("muteIfShould() ->", () => {
    let tab = {};

    beforeEach(() => {
      tab = {
        id: 42,
        url: "http://www.youtube.com",
        mutedInfo: { muted: false },
      };
      tabs.push(tab);
    });

    describe("when the extension is enabled ->", () => {
      beforeEach(() => {
        setValueForEnabledInOptions(true);
      });

      describe('and using a "should mute" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(true, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingShouldNotMuteList")
            .mockResolvedValue(false);
        });

        test("should mute the specified tab if the page is in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.muteIfShould(tab);

          expect(getTabMuteState(tab.id)).toBe(true);
        });

        test("should not mute the specified tab if the page is not in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(false);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.muteIfShould(tab);

          expect(getTabMuteState(tab.id)).toBe(false);
        });
      });

      describe('and using a "should not mute" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(false, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingShouldNotMuteList")
            .mockResolvedValue(true);
        });

        test("should not mute the specified tab if the page is in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.muteIfShould(tab);

          expect(getTabMuteState(tab.id)).toBe(false);
        });

        test("should mute the specified tab if the page is not in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(false);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.muteIfShould(tab);

          expect(getTabMuteState(tab.id)).toBe(true);
        });
      });
    });

    describe("when the extension is disabled ->", () => {
      beforeEach(() => {
        setValueForEnabledInOptions(false);
      });

      describe('and using a "should mute" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(true, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingShouldNotMuteList")
            .mockResolvedValue(false);
        });

        test("should not mute the specified tab if the page is in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.muteIfShould(tab);

          expect(getTabMuteState(tab.id)).toBe(false);
        });

        test("should not mute the specified tab if the page is not in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(false);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.muteIfShould(tab);

          expect(getTabMuteState(tab.id)).toBe(false);
        });
      });

      describe('and using a "should not mute" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(false, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingShouldNotMuteList")
            .mockResolvedValue(true);
        });

        test("should not mute the specified tab if the page is in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.muteIfShould(tab);

          expect(getTabMuteState(tab.id)).toBe(false);
        });

        test("should not mute the specified tab if the page is not in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(false);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.muteIfShould(tab);

          expect(getTabMuteState(tab.id)).toBe(false);
        });
      });
    });
  });

  describe("muteAllTabs() ->", () => {
    beforeEach(() => {
      tabs.push({
        id: 42,
        url: "http://www.youtube.com",
        mutedInfo: { muted: false },
      });
      tabs.push({
        id: 128,
        url: "http://google.com",
        mutedInfo: { muted: false },
      });

      jest.spyOn(mockChrome.tabs, "query").mockImplementation((_, callback) => {
        callback(tabs);
      });

      jest
        .spyOn(mockListExpert, "isInList")
        .mockImplementation(async (_, url) => {
          return await new Promise((resolve) => {
            resolve(url === tabs[0].url);
          });
        });
    });

    describe("when the extension is enabled ->", () => {
      beforeEach(() => {
        setValueForEnabledInOptions(true);
      });

      describe('and using a "should mute" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(true, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingShouldNotMuteList")
            .mockResolvedValue(false);
        });

        test("should mute a tab if the page is in the list and otherwise not", async () => {
          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.muteAllTabs(false);

          expect(mockExtensionOptions.getEnabled).toHaveBeenCalled();
          expect(getTabMuteState(tabs[0].id)).toBe(true);
          expect(getTabMuteState(tabs[1].id)).toBe(false);
        });

        test("should mute all tabs if force is set", async () => {
          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.muteAllTabs(true);

          expect(mockExtensionOptions.getEnabled).not.toHaveBeenCalled();
          expect(getTabMuteState(tabs[0].id)).toBe(true);
          expect(getTabMuteState(tabs[1].id)).toBe(true);
        });

        test("should not mute a tab if it is excluded", async () => {
          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.muteAllTabs(false, tabs[0].id);

          expect(mockExtensionOptions.getEnabled).toHaveBeenCalled();
          expect(getTabMuteState(tabs[0].id)).toBe(false);
          expect(getTabMuteState(tabs[1].id)).toBe(false);
        });
      });

      describe('and using a "should not mute" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(false, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingShouldNotMuteList")
            .mockResolvedValue(true);
        });

        test("should not mute a tab if the page is in the list and otherwise should", async () => {
          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.muteAllTabs(false);

          expect(mockExtensionOptions.getEnabled).toHaveBeenCalled();
          expect(getTabMuteState(tabs[0].id)).toBe(false);
          expect(getTabMuteState(tabs[1].id)).toBe(true);
        });

        test("should mute all tabs if force is set", async () => {
          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.muteAllTabs(true);

          expect(mockExtensionOptions.getEnabled).not.toHaveBeenCalled();
          expect(getTabMuteState(tabs[0].id)).toBe(true);
          expect(getTabMuteState(tabs[1].id)).toBe(true);
        });

        test("should not mute a tab if it is excluded", async () => {
          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.muteAllTabs(false, tabs[1].id);

          expect(mockExtensionOptions.getEnabled).toHaveBeenCalled();
          expect(getTabMuteState(tabs[0].id)).toBe(false);
          expect(getTabMuteState(tabs[1].id)).toBe(false);
        });
      });
    });

    describe("when the extension is disabled ->", () => {
      beforeEach(() => {
        setValueForEnabledInOptions(false);
      });

      describe('and using a "should mute" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(true, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingShouldNotMuteList")
            .mockResolvedValue(false);
        });

        test("should not mute any tabs", async () => {
          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.muteAllTabs(false);

          expect(mockExtensionOptions.getEnabled).toHaveBeenCalled();
          expect(getTabMuteState(tabs[0].id)).toBe(false);
          expect(getTabMuteState(tabs[1].id)).toBe(false);
        });

        test("should mute all tabs if force is set", async () => {
          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.muteAllTabs(true);

          expect(mockExtensionOptions.getEnabled).not.toHaveBeenCalled();
          expect(getTabMuteState(tabs[0].id)).toBe(true);
          expect(getTabMuteState(tabs[1].id)).toBe(true);
        });
      });

      describe('and using a "should not mute" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(false, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingShouldNotMuteList")
            .mockResolvedValue(true);
        });

        test("should not mute any tabs", async () => {
          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.muteAllTabs(false);

          expect(mockExtensionOptions.getEnabled).toHaveBeenCalled();
          expect(getTabMuteState(tabs[0].id)).toBe(false);
          expect(getTabMuteState(tabs[1].id)).toBe(false);
        });

        test("should mute all tabs if force is set", async () => {
          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.muteAllTabs(true);

          expect(mockExtensionOptions.getEnabled).not.toHaveBeenCalled();
          expect(getTabMuteState(tabs[0].id)).toBe(true);
          expect(getTabMuteState(tabs[1].id)).toBe(true);
        });
      });
    });
  });

  describe("toggleMuteOnCurrentTab() ->", () => {
    let tab = {};

    beforeEach(() => {
      tab = {
        id: 42,
        url: "http://www.youtube.com",
        mutedInfo: { muted: false },
      };

      tabs.push(tab);

      jest.spyOn(mockChrome.tabs, "query").mockImplementation((_, callback) => {
        callback([tab]);
      });
    });

    describe("when the extension is enabled ->", () => {
      beforeEach(() => {
        setValueForEnabledInOptions(true);
      });

      describe('and using a "should mute" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(true, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingShouldNotMuteList")
            .mockResolvedValue(false);
        });

        test("should mute the current tab if it is not already muted and the page is in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.toggleMuteOnCurrentTab();

          expect(mockExtensionOptions.getEnabled).not.toHaveBeenCalled();
          expect(getTabMuteState(tab.id)).toBe(true);
        });

        test("should unmute the current tab if it is already muted and the page is in the list", async () => {
          tab.mutedInfo.muted = true;
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.toggleMuteOnCurrentTab();

          expect(mockExtensionOptions.getEnabled).not.toHaveBeenCalled();
          expect(getTabMuteState(tab.id)).toBe(false);
        });

        test("should mute the current tab if it is not already muted and the page is not in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(false);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.toggleMuteOnCurrentTab();

          expect(mockExtensionOptions.getEnabled).not.toHaveBeenCalled();
          expect(getTabMuteState(tab.id)).toBe(true);
        });

        test("should unmute the current tab if it is already muted and the page is not in the list", async () => {
          tab.mutedInfo.muted = true;
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(false);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.toggleMuteOnCurrentTab();

          expect(mockExtensionOptions.getEnabled).not.toHaveBeenCalled();
          expect(getTabMuteState(tab.id)).toBe(false);
        });
      });

      describe('and using a "should not mute" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(false, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingShouldNotMuteList")
            .mockResolvedValue(true);
        });

        test("should mute the current tab if it is not already muted and the page is in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.toggleMuteOnCurrentTab();

          expect(mockExtensionOptions.getEnabled).not.toHaveBeenCalled();
          expect(getTabMuteState(tab.id)).toBe(true);
        });

        test("should unmute the current tab if it is already muted and the page is in the list", async () => {
          tab.mutedInfo.muted = true;
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.toggleMuteOnCurrentTab();

          expect(mockExtensionOptions.getEnabled).not.toHaveBeenCalled();
          expect(getTabMuteState(tab.id)).toBe(false);
        });

        test("should mute the current tab if it is not already muted and the page is not in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(false);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.toggleMuteOnCurrentTab();

          expect(mockExtensionOptions.getEnabled).not.toHaveBeenCalled();
          expect(getTabMuteState(tab.id)).toBe(true);
        });

        test("should unmute the current tab if it is already muted and the page is not in the list", async () => {
          tab.mutedInfo.muted = true;
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(false);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.toggleMuteOnCurrentTab();

          expect(mockExtensionOptions.getEnabled).not.toHaveBeenCalled();
          expect(getTabMuteState(tab.id)).toBe(false);
        });
      });
    });

    describe("when the extension is disabled ->", () => {
      beforeEach(() => {
        setValueForEnabledInOptions(false);
      });

      describe('and using a "should mute" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(true, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingShouldNotMuteList")
            .mockResolvedValue(false);
        });

        test("should mute the current tab if it is not already muted and the page is in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.toggleMuteOnCurrentTab();

          expect(getTabMuteState(tab.id)).toBe(true);
        });

        test("should unmute the current tab if it is already muted and the page is in the list", async () => {
          tab.mutedInfo.muted = true;
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.toggleMuteOnCurrentTab();

          expect(getTabMuteState(tab.id)).toBe(false);
        });

        test("should mute the current tab if it is not already muted and the page is not in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(false);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.toggleMuteOnCurrentTab();

          expect(getTabMuteState(tab.id)).toBe(true);
        });

        test("should unmute the current tab if it is already muted and the page is not in the list", async () => {
          tab.mutedInfo.muted = true;
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(false);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.toggleMuteOnCurrentTab();

          expect(getTabMuteState(tab.id)).toBe(false);
        });
      });

      describe('and using a "should not mute" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(false, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingShouldNotMuteList")
            .mockResolvedValue(true);
        });

        test("should mute the current tab if it is not already muted and the page is in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.toggleMuteOnCurrentTab();

          expect(getTabMuteState(tab.id)).toBe(true);
        });

        test("should unmute the current tab if it is already muted and the page is in the list", async () => {
          tab.mutedInfo.muted = true;
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.toggleMuteOnCurrentTab();

          expect(getTabMuteState(tab.id)).toBe(false);
        });

        test("should mute the current tab if it is not already muted and the page is not in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(false);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.toggleMuteOnCurrentTab();

          expect(getTabMuteState(tab.id)).toBe(true);
        });

        test("should unmute the current tab if it is already muted and the page is not in the list", async () => {
          tab.mutedInfo.muted = true;
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(false);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.toggleMuteOnCurrentTab();

          expect(getTabMuteState(tab.id)).toBe(false);
        });
      });
    });
  });

  describe("muteOtherTabs() ->", () => {
    beforeEach(() => {
      tabs.push({
        id: 42,
        url: "http://www.youtube.com",
        mutedInfo: { muted: false },
      });
      tabs.push({
        id: 128,
        url: "http://google.com",
        mutedInfo: { muted: false },
      });

      jest
        .spyOn(mockChrome.tabs, "query")
        .mockImplementation((queryInfo, callback) => {
          if (queryInfo && queryInfo.active) {
            callback([tabs[0]]);
          } else {
            callback(tabs);
          }
        });

      jest
        .spyOn(mockListExpert, "isInList")
        .mockImplementation(async (_, url) => {
          return await new Promise((resolve) => {
            resolve(url === tabs[0].url);
          });
        });
    });

    describe("when the extension is enabled ->", () => {
      beforeEach(() => {
        setValueForEnabledInOptions(true);
      });

      describe('and using a "should mute" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(true, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingShouldNotMuteList")
            .mockResolvedValue(false);
        });

        test("should mute other tabs", async () => {
          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.muteOtherTabs();

          expect(getTabMuteState(tabs[0].id)).toBe(false);
          expect(getTabMuteState(tabs[1].id)).toBe(true);
        });
      });

      describe('and using a "should not mute" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(false, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingShouldNotMuteList")
            .mockResolvedValue(true);
        });

        test("should mute other tabs", async () => {
          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.muteOtherTabs();

          expect(getTabMuteState(tabs[0].id)).toBe(false);
          expect(getTabMuteState(tabs[1].id)).toBe(true);
        });
      });
    });

    describe("when the extension is disabled ->", () => {
      beforeEach(() => {
        setValueForEnabledInOptions(false);
      });

      describe('and using a "should mute" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(true, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingShouldNotMuteList")
            .mockResolvedValue(false);
        });

        test("should mute other tabs", async () => {
          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.muteOtherTabs();

          expect(getTabMuteState(tabs[0].id)).toBe(false);
          expect(getTabMuteState(tabs[1].id)).toBe(true);
        });
      });

      describe('and using a "should not mute" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(false, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingShouldNotMuteList")
            .mockResolvedValue(true);
        });

        test("should mute other tabs", async () => {
          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.muteOtherTabs();

          expect(getTabMuteState(tabs[0].id)).toBe(false);
          expect(getTabMuteState(tabs[1].id)).toBe(true);
        });
      });
    });
  });

  describe("applyMuteRulesToAllTabs() ->", () => {
    beforeEach(() => {
      tabs.push({
        id: 42,
        url: "http://www.youtube.com",
        mutedInfo: { muted: false },
      });
      tabs.push({
        id: 128,
        url: "http://google.com",
        mutedInfo: { muted: false },
      });

      jest.spyOn(mockChrome.tabs, "query").mockImplementation((_, callback) => {
        callback(tabs);
      });

      jest
        .spyOn(mockListExpert, "isInList")
        .mockImplementation(async (_, url) => {
          return await new Promise((resolve) => {
            resolve(url === tabs[0].url);
          });
        });
    });

    describe("when the extension is enabled ->", () => {
      beforeEach(() => {
        setValueForEnabledInOptions(true);
      });

      describe('and using a "should mute" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(true, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingShouldNotMuteList")
            .mockResolvedValue(false);
        });

        test("should mute a tab if the page is in the list and otherwise not", async () => {
          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.applyMuteRulesToAllTabs();

          expect(getTabMuteState(tabs[0].id)).toBe(true);
          expect(getTabMuteState(tabs[1].id)).toBe(false);
        });
      });

      describe('and using a "should not mute" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(false, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingShouldNotMuteList")
            .mockResolvedValue(true);
        });

        test("should not mute a tab if the page is in the list and otherwise should", async () => {
          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.applyMuteRulesToAllTabs();

          expect(getTabMuteState(tabs[0].id)).toBe(false);
          expect(getTabMuteState(tabs[1].id)).toBe(true);
        });
      });
    });

    describe("when the extension is disabled ->", () => {
      beforeEach(() => {
        setValueForEnabledInOptions(false);
      });

      describe('and using a "should mute" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(true, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingShouldNotMuteList")
            .mockResolvedValue(false);
        });

        test("should not mute any tabs", async () => {
          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.applyMuteRulesToAllTabs();

          expect(getTabMuteState(tabs[0].id)).toBe(false);
          expect(getTabMuteState(tabs[1].id)).toBe(false);
        });
      });

      describe('and using a "should not mute" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(false, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingShouldNotMuteList")
            .mockResolvedValue(true);
        });

        test("should not mute any tabs", async () => {
          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.applyMuteRulesToAllTabs();

          expect(getTabMuteState(tabs[0].id)).toBe(false);
          expect(getTabMuteState(tabs[1].id)).toBe(false);
        });
      });
    });
  });

  describe("onTabReplaced() ->", () => {
    let tab = {};

    beforeEach(() => {
      tab = {
        id: 42,
        url: "http://www.youtube.com",
        mutedInfo: { muted: false },
      };
      tabs.push(tab);

      jest
        .spyOn(mockChrome.tabs, "get")
        .mockImplementation((tabId, callback) => {
          callback(getTab(tabId));
        });
    });

    describe("when the extension is enabled ->", () => {
      beforeEach(() => {
        setValueForEnabledInOptions(true);
      });

      describe('and using a "should mute" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(true, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingShouldNotMuteList")
            .mockResolvedValue(false);
        });

        test("should mute the specified tab if the page is in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.onTabReplaced(tab.id);

          expect(getTabMuteState(tab.id)).toBe(true);
        });

        test("should not mute the specified tab if the page is not in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(false);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.onTabReplaced(tab.id);

          expect(getTabMuteState(tab.id)).toBe(false);
        });
      });

      describe('and using a "should not mute" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(false, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingShouldNotMuteList")
            .mockResolvedValue(true);
        });

        test("should not mute the specified tab if the page is in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.onTabReplaced(tab.id);

          expect(getTabMuteState(tab.id)).toBe(false);
        });

        test("should mute the specified tab if the page is not in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(false);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.onTabReplaced(tab.id);

          expect(getTabMuteState(tab.id)).toBe(true);
        });
      });
    });

    describe("when the extension is disabled ->", () => {
      beforeEach(() => {
        setValueForEnabledInOptions(false);
      });

      describe('and using a "should mute" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(true, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingShouldNotMuteList")
            .mockResolvedValue(false);
        });

        test("should not mute the specified tab if the page is in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.onTabReplaced(tab.id);

          expect(getTabMuteState(tab.id)).toBe(false);
        });

        test("should not mute the specified tab if the page is not in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(false);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.onTabReplaced(tab.id);

          expect(getTabMuteState(tab.id)).toBe(false);
        });
      });

      describe('and using a "should not mute" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(false, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingShouldNotMuteList")
            .mockResolvedValue(true);
        });

        test("should not mute the specified tab if the page is in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.onTabReplaced(tab.id);

          expect(getTabMuteState(tab.id)).toBe(false);
        });

        test("should not mute the specified tab if the page is not in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(false);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.onTabReplaced(tab.id);

          expect(getTabMuteState(tab.id)).toBe(false);
        });
      });
    });
  });

  describe("onTabUrlChanged() ->", () => {
    let tab = {};

    beforeEach(() => {
      tab = {
        id: 42,
        url: "http://www.youtube.com",
        mutedInfo: { muted: false },
      };
      tabs.push(tab);

      jest
        .spyOn(mockChrome.tabs, "get")
        .mockImplementation((tabId, callback) => {
          callback(getTab(tabId));
        });
    });

    describe("when the extension is enabled ->", () => {
      beforeEach(() => {
        setValueForEnabledInOptions(true);
      });

      describe('and using a "should mute" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(true, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingShouldNotMuteList")
            .mockResolvedValue(false);
        });

        test("should mute the specified tab if the page is in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.onTabUrlChanged(tab.id);

          expect(getTabMuteState(tab.id)).toBe(true);
        });

        test("should not mute the specified tab if the page is not in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(false);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.onTabUrlChanged(tab.id);

          expect(getTabMuteState(tab.id)).toBe(false);
        });
      });

      describe('and using a "should not mute" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(false, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingShouldNotMuteList")
            .mockResolvedValue(true);
        });

        test("should not mute the specified tab if the page is in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.onTabUrlChanged(tab.id);

          expect(getTabMuteState(tab.id)).toBe(false);
        });

        test("should mute the specified tab if the page is not in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(false);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.onTabUrlChanged(tab.id);

          expect(getTabMuteState(tab.id)).toBe(true);
        });
      });
    });

    describe("when the extension is disabled ->", () => {
      beforeEach(() => {
        setValueForEnabledInOptions(false);
      });

      describe('and using a "should mute" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(true, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingShouldNotMuteList")
            .mockResolvedValue(false);
        });

        test("should not mute the specified tab if the page is in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.onTabUrlChanged(tab.id);

          expect(getTabMuteState(tab.id)).toBe(false);
        });

        test("should not mute the specified tab if the page is not in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(false);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.onTabUrlChanged(tab.id);

          expect(getTabMuteState(tab.id)).toBe(false);
        });
      });

      describe('and using a "should not mute" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(false, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingShouldNotMuteList")
            .mockResolvedValue(true);
        });

        test("should not mute the specified tab if the page is in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.onTabUrlChanged(tab.id);

          expect(getTabMuteState(tab.id)).toBe(false);
        });

        test("should not mute the specified tab if the page is not in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(false);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.onTabUrlChanged(tab.id);

          expect(getTabMuteState(tab.id)).toBe(false);
        });
      });
    });
  });

  describe("addOrRemoveCurrentPageInList() ->", () => {
    let tab = {};

    beforeEach(() => {
      tab = {
        id: 42,
        url: "http://www.youtube.com",
        mutedInfo: { muted: false },
      };
      tabs.push(tab);

      jest
        .spyOn(mockChrome.tabs, "query")
        .mockImplementation((queryInfo, callback) => {
          if (queryInfo && queryInfo.active) {
            callback([tabs[0]]);
          } else {
            callback(tabs);
          }
        });
    });

    describe("when the extension is enabled ->", () => {
      beforeEach(() => {
        setValueForEnabledInOptions(true);
      });

      describe('and using a "should mute" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(true, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingShouldNotMuteList")
            .mockResolvedValue(false);
        });

        test("should add the current tab URL to the list", async () => {
          jest
            .spyOn(mockListExpert, "addOrRemoveUrlInList")
            .mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.addOrRemoveCurrentPageInList();

          expect(mockListExpert.addOrRemoveUrlInList).toHaveBeenCalled();
          expect(mockListExpert.addOrRemoveUrlInList.mock.calls[0]).toEqual([
            tab.url,
          ]);
        });
      });

      describe('and using a "should not mute" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(false, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingShouldNotMuteList")
            .mockResolvedValue(true);
        });

        test("should add the current tab URL to the list", async () => {
          jest
            .spyOn(mockListExpert, "addOrRemoveUrlInList")
            .mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.addOrRemoveCurrentPageInList();

          expect(mockListExpert.addOrRemoveUrlInList).toHaveBeenCalled();
          expect(mockListExpert.addOrRemoveUrlInList.mock.calls[0]).toEqual([
            tab.url,
          ]);
        });
      });
    });

    describe("when the extension is disabled ->", () => {
      beforeEach(() => {
        setValueForEnabledInOptions(false);
      });

      describe('and using a "should mute" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(true, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingShouldNotMuteList")
            .mockResolvedValue(false);
        });

        test("should add the current tab URL to the list", async () => {
          jest
            .spyOn(mockListExpert, "addOrRemoveUrlInList")
            .mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.addOrRemoveCurrentPageInList();

          expect(mockListExpert.addOrRemoveUrlInList).toHaveBeenCalled();
          expect(mockListExpert.addOrRemoveUrlInList.mock.calls[0]).toEqual([
            tab.url,
          ]);
        });
      });

      describe('and using a "should not mute" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(false, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingShouldNotMuteList")
            .mockResolvedValue(true);
        });

        test("should add the current tab URL to the list", async () => {
          jest
            .spyOn(mockListExpert, "addOrRemoveUrlInList")
            .mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.addOrRemoveCurrentPageInList();

          expect(mockListExpert.addOrRemoveUrlInList).toHaveBeenCalled();
          expect(mockListExpert.addOrRemoveUrlInList.mock.calls[0]).toEqual([
            tab.url,
          ]);
        });
      });
    });
  });

  describe("addOrRemoveCurrentDomainInList() ->", () => {
    let tab = {};

    beforeEach(() => {
      tab = {
        id: 42,
        url: "http://www.youtube.com",
        mutedInfo: { muted: false },
      };
      tabs.push(tab);

      jest
        .spyOn(mockChrome.tabs, "query")
        .mockImplementation((queryInfo, callback) => {
          if (queryInfo && queryInfo.active) {
            callback([tabs[0]]);
          } else {
            callback(tabs);
          }
        });
    });

    describe("when the extension is enabled ->", () => {
      beforeEach(() => {
        setValueForEnabledInOptions(true);
      });

      describe('and using a "should mute" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(true, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingShouldNotMuteList")
            .mockResolvedValue(false);
        });

        test("should add the current tab domain to the list", async () => {
          jest
            .spyOn(mockListExpert, "addOrRemoveDomainInList")
            .mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.addOrRemoveCurrentDomainInList();

          expect(mockListExpert.addOrRemoveDomainInList).toHaveBeenCalled();
          expect(mockListExpert.addOrRemoveDomainInList.mock.calls[0]).toEqual([
            tab.url,
          ]);
        });
      });

      describe('and using a "should not mute" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(false, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingShouldNotMuteList")
            .mockResolvedValue(true);
        });

        test("should add the current tab domain to the list", async () => {
          jest
            .spyOn(mockListExpert, "addOrRemoveDomainInList")
            .mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.addOrRemoveCurrentDomainInList();

          expect(mockListExpert.addOrRemoveDomainInList).toHaveBeenCalled();
          expect(mockListExpert.addOrRemoveDomainInList.mock.calls[0]).toEqual([
            tab.url,
          ]);
        });
      });
    });

    describe("when the extension is disabled ->", () => {
      beforeEach(() => {
        setValueForEnabledInOptions(false);
      });

      describe('and using a "should mute" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(true, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingShouldNotMuteList")
            .mockResolvedValue(false);
        });

        test("should add the current tab domain to the list", async () => {
          jest
            .spyOn(mockListExpert, "addOrRemoveDomainInList")
            .mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.addOrRemoveCurrentDomainInList();

          expect(mockListExpert.addOrRemoveDomainInList).toHaveBeenCalled();
          expect(mockListExpert.addOrRemoveDomainInList.mock.calls[0]).toEqual([
            tab.url,
          ]);
        });
      });

      describe('and using a "should not mute" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(false, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingShouldNotMuteList")
            .mockResolvedValue(true);
        });

        test("should add the current tab domain to the list", async () => {
          jest
            .spyOn(mockListExpert, "addOrRemoveDomainInList")
            .mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.addOrRemoveCurrentDomainInList();

          expect(mockListExpert.addOrRemoveDomainInList).toHaveBeenCalled();
          expect(mockListExpert.addOrRemoveDomainInList.mock.calls[0]).toEqual([
            tab.url,
          ]);
        });
      });
    });
  });
});
