import { jest } from "@jest/globals";

import TabTracker from "../extension/TabTracker";
import ListInfo from "../extension/ListInfo";

it("should instantiate TabTracker", () => {
  expect(TabTracker).toBeDefined();
});

describe("TabTracker ->", () => {
  let mockChrome;
  let mockExtensionOptions;
  let mockListExpert;
  let mockLogger;
  let tabs = [];
  let storage = {};
  const extensionId = "myExtensionId";

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
    return tabs.find((t) => t.id === id).mutedInfo?.muted ?? false;
  }

  async function getStorage(storageObj, values) {
    // If values is an object, return the values of the keys in the object
    if (typeof values === "object") {
      const result = {};
      for (const [key, value] of Object.entries(values)) {
        if (!Object.prototype.hasOwnProperty.call(storageObj, key)) {
          storageObj[key] = value;
        }
        result[key] = storageObj[key];
      }

      return result;
    }

    return storageObj[values];
  }

  async function setStorage(storageObj, values) {
    for (const [key, value] of Object.entries(values)) {
      storageObj[key] = value;
    }
  }

  beforeEach(() => {
    storage = {};

    mockChrome = {
      tabs: {
        update: (tabId, updateProperties) => {
          const tab = getTab(tabId);
          tab.mutedInfo.muted = updateProperties.muted;
          if (updateProperties.muted) {
            tab.mutedInfo.extensionId = extensionId;
          } else {
            delete tab.mutedInfo.extensionId;
          }
        },
        query: () => {},
        get: () => {},
      },
      runtime: {
        id: extensionId,
      },
      storage: {
        session: {
          get: async (values) => {
            return await getStorage(storage, values);
          },
          set: async (values) => {
            await setStorage(storage, values);
          },
        },
      },
    };

    mockExtensionOptions = {
      getEnabled: async () => {},
      getUsingAllowAudioList: async () => {},
    };

    mockListExpert = {
      getListInfo: async () => {},
      isInList: async () => {},
      isDomainInList: async () => {},
      addOrRemoveUrlInList: async () => {},
      addOrRemoveDomainInList: async () => {},
    };

    mockLogger = {
      log: () => {},
      error: () => {},
    };
  });

  afterEach(() => {
    tabs = [];
  });

  describe("muteByApplicationLogic() ->", () => {
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

      describe('and using a "block audio" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(false, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingAllowAudioList")
            .mockResolvedValue(false);
        });

        it("should mute the specified tab if the page is in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.muteByApplicationLogic(tab);

          expect(getTabMuteState(tab.id)).toBe(true);
        });

        it("should not mute the specified tab if the page is not in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(false);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.muteByApplicationLogic(tab);

          expect(getTabMuteState(tab.id)).toBe(false);
        });
      });

      describe('and using an "allow audio" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(true, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingAllowAudioList")
            .mockResolvedValue(true);
        });

        it("should not mute the specified tab if the page is in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.muteByApplicationLogic(tab);

          expect(getTabMuteState(tab.id)).toBe(false);
        });

        it("should mute the specified tab if the page is not in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(false);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.muteByApplicationLogic(tab);

          expect(getTabMuteState(tab.id)).toBe(true);
        });
      });
    });

    describe("when the extension is disabled ->", () => {
      beforeEach(() => {
        setValueForEnabledInOptions(false);
      });

      describe('and using a "block audio" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(false, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingAllowAudioList")
            .mockResolvedValue(false);
        });

        it("should not mute the specified tab if the page is in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.muteByApplicationLogic(tab);

          expect(getTabMuteState(tab.id)).toBe(false);
        });

        it("should not mute the specified tab if the page is not in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(false);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.muteByApplicationLogic(tab);

          expect(getTabMuteState(tab.id)).toBe(false);
        });
      });

      describe('and using an "allow audio" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(true, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingAllowAudioList")
            .mockResolvedValue(true);
        });

        it("should not mute the specified tab if the page is in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.muteByApplicationLogic(tab);

          expect(getTabMuteState(tab.id)).toBe(false);
        });

        it("should not mute the specified tab if the page is not in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(false);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.muteByApplicationLogic(tab);

          expect(getTabMuteState(tab.id)).toBe(false);
        });
      });
    });
  });

  describe("muteAllTabsByApplicationLogic() ->", () => {
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
      tabs.push({
        id: 1024,
        url: "http://open.spotify.com",
        mutedInfo: { muted: false },
      });

      jest.spyOn(mockChrome.tabs, "query").mockResolvedValue(tabs);

      jest
        .spyOn(mockListExpert, "isInList")
        .mockImplementation(async (_, url) => url !== tabs[1].url);
    });

    describe("when the extension is enabled ->", () => {
      beforeEach(() => {
        setValueForEnabledInOptions(true);
      });

      describe('and using a "block audio" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(false, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingAllowAudioList")
            .mockResolvedValue(false);
        });

        it("should mute a tab if the page is in the list and otherwise not", async () => {
          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.muteAllTabsByApplicationLogic(false);

          expect(mockExtensionOptions.getEnabled).toHaveBeenCalled();
          expect(getTabMuteState(tabs[0].id)).toBe(true);
          expect(getTabMuteState(tabs[1].id)).toBe(false);
          expect(getTabMuteState(tabs[2].id)).toBe(true);
        });

        it("should mute all tabs if requested by user", async () => {
          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.muteAllTabsByUserRequest();

          expect(mockExtensionOptions.getEnabled).not.toHaveBeenCalled();
          expect(getTabMuteState(tabs[0].id)).toBe(true);
          expect(getTabMuteState(tabs[1].id)).toBe(true);
          expect(getTabMuteState(tabs[2].id)).toBe(true);
        });
      });

      describe('and using an "allow audio" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(true, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingAllowAudioList")
            .mockResolvedValue(true);
        });

        it("should not mute a tab if the page is in the list and otherwise should", async () => {
          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.muteAllTabsByApplicationLogic(false);

          expect(mockExtensionOptions.getEnabled).toHaveBeenCalled();
          expect(getTabMuteState(tabs[0].id)).toBe(false);
          expect(getTabMuteState(tabs[1].id)).toBe(true);
          expect(getTabMuteState(tabs[2].id)).toBe(false);
        });

        it("should mute all tabs if by user request", async () => {
          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.muteAllTabsByUserRequest();

          expect(mockExtensionOptions.getEnabled).not.toHaveBeenCalled();
          expect(getTabMuteState(tabs[0].id)).toBe(true);
          expect(getTabMuteState(tabs[1].id)).toBe(true);
          expect(getTabMuteState(tabs[2].id)).toBe(true);
        });
      });
    });

    describe("when the extension is disabled ->", () => {
      beforeEach(() => {
        setValueForEnabledInOptions(false);
      });

      describe('and using a "block audio" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(false, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingAllowAudioList")
            .mockResolvedValue(false);
        });

        it("should not mute any tabs", async () => {
          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.muteAllTabsByApplicationLogic(false);

          expect(mockExtensionOptions.getEnabled).toHaveBeenCalled();
          expect(getTabMuteState(tabs[0].id)).toBe(false);
          expect(getTabMuteState(tabs[1].id)).toBe(false);
          expect(getTabMuteState(tabs[2].id)).toBe(false);
        });

        it("should mute all tabs if by user request", async () => {
          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.muteAllTabsByUserRequest();

          expect(mockExtensionOptions.getEnabled).not.toHaveBeenCalled();
          expect(getTabMuteState(tabs[0].id)).toBe(true);
          expect(getTabMuteState(tabs[1].id)).toBe(true);
          expect(getTabMuteState(tabs[2].id)).toBe(true);
        });
      });

      describe('and using an "allow audio" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(true, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingAllowAudioList")
            .mockResolvedValue(true);
        });

        it("should not mute any tabs", async () => {
          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.muteAllTabsByApplicationLogic(false);

          expect(mockExtensionOptions.getEnabled).toHaveBeenCalled();
          expect(getTabMuteState(tabs[0].id)).toBe(false);
          expect(getTabMuteState(tabs[1].id)).toBe(false);
          expect(getTabMuteState(tabs[2].id)).toBe(false);
        });

        it("should mute all tabs if by user request", async () => {
          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.muteAllTabsByUserRequest();

          expect(mockExtensionOptions.getEnabled).not.toHaveBeenCalled();
          expect(getTabMuteState(tabs[0].id)).toBe(true);
          expect(getTabMuteState(tabs[1].id)).toBe(true);
          expect(getTabMuteState(tabs[2].id)).toBe(true);
        });
      });
    });
  });

  describe("toggleMuteOnCurrentTabByUserRequest() ->", () => {
    let tab = {};

    beforeEach(() => {
      tab = {
        id: 42,
        url: "http://www.youtube.com",
        mutedInfo: { muted: false },
      };

      tabs.push(tab);

      jest.spyOn(mockChrome.tabs, "query").mockResolvedValue([tab]);
    });

    describe("when the extension is enabled ->", () => {
      beforeEach(() => {
        setValueForEnabledInOptions(true);
      });

      describe('and using a "block audio" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(false, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingAllowAudioList")
            .mockResolvedValue(false);
        });

        it("should mute the current tab if it is not already muted and the page is in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.toggleMuteOnCurrentTabByUserRequest();

          expect(mockExtensionOptions.getEnabled).not.toHaveBeenCalled();
          expect(getTabMuteState(tab.id)).toBe(true);
        });

        it("should unmute the current tab if it is already muted and the page is in the list", async () => {
          tab.mutedInfo.muted = true;
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.toggleMuteOnCurrentTabByUserRequest();

          expect(mockExtensionOptions.getEnabled).not.toHaveBeenCalled();
          expect(getTabMuteState(tab.id)).toBe(false);
        });

        it("should mute the current tab if it is not already muted and the page is not in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(false);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.toggleMuteOnCurrentTabByUserRequest();

          expect(mockExtensionOptions.getEnabled).not.toHaveBeenCalled();
          expect(getTabMuteState(tab.id)).toBe(true);
        });

        it("should unmute the current tab if it is already muted and the page is not in the list", async () => {
          tab.mutedInfo.muted = true;
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(false);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.toggleMuteOnCurrentTabByUserRequest();

          expect(mockExtensionOptions.getEnabled).not.toHaveBeenCalled();
          expect(getTabMuteState(tab.id)).toBe(false);
        });
      });

      describe('and using an "allow audio" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(true, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingAllowAudioList")
            .mockResolvedValue(true);
        });

        it("should mute the current tab if it is not already muted and the page is in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.toggleMuteOnCurrentTabByUserRequest();

          expect(mockExtensionOptions.getEnabled).not.toHaveBeenCalled();
          expect(getTabMuteState(tab.id)).toBe(true);
        });

        it("should unmute the current tab if it is already muted and the page is in the list", async () => {
          tab.mutedInfo.muted = true;
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.toggleMuteOnCurrentTabByUserRequest();

          expect(mockExtensionOptions.getEnabled).not.toHaveBeenCalled();
          expect(getTabMuteState(tab.id)).toBe(false);
        });

        it("should mute the current tab if it is not already muted and the page is not in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(false);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.toggleMuteOnCurrentTabByUserRequest();

          expect(mockExtensionOptions.getEnabled).not.toHaveBeenCalled();
          expect(getTabMuteState(tab.id)).toBe(true);
        });

        it("should unmute the current tab if it is already muted and the page is not in the list", async () => {
          tab.mutedInfo.muted = true;
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(false);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.toggleMuteOnCurrentTabByUserRequest();

          expect(mockExtensionOptions.getEnabled).not.toHaveBeenCalled();
          expect(getTabMuteState(tab.id)).toBe(false);
        });
      });
    });

    describe("when the extension is disabled ->", () => {
      beforeEach(() => {
        setValueForEnabledInOptions(false);
      });

      describe('and using a "block audio" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(false, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingAllowAudioList")
            .mockResolvedValue(false);
        });

        it("should mute the current tab if it is not already muted and the page is in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.toggleMuteOnCurrentTabByUserRequest();

          expect(getTabMuteState(tab.id)).toBe(true);
        });

        it("should unmute the current tab if it is already muted and the page is in the list", async () => {
          tab.mutedInfo.muted = true;
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.toggleMuteOnCurrentTabByUserRequest();

          expect(getTabMuteState(tab.id)).toBe(false);
        });

        it("should mute the current tab if it is not already muted and the page is not in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(false);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.toggleMuteOnCurrentTabByUserRequest();

          expect(getTabMuteState(tab.id)).toBe(true);
        });

        it("should unmute the current tab if it is already muted and the page is not in the list", async () => {
          tab.mutedInfo.muted = true;
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(false);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.toggleMuteOnCurrentTabByUserRequest();

          expect(getTabMuteState(tab.id)).toBe(false);
        });
      });

      describe('and using an "allow audio" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(true, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingAllowAudioList")
            .mockResolvedValue(true);
        });

        it("should mute the current tab if it is not already muted and the page is in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.toggleMuteOnCurrentTabByUserRequest();

          expect(getTabMuteState(tab.id)).toBe(true);
        });

        it("should unmute the current tab if it is already muted and the page is in the list", async () => {
          tab.mutedInfo.muted = true;
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.toggleMuteOnCurrentTabByUserRequest();

          expect(getTabMuteState(tab.id)).toBe(false);
        });

        it("should mute the current tab if it is not already muted and the page is not in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(false);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.toggleMuteOnCurrentTabByUserRequest();

          expect(getTabMuteState(tab.id)).toBe(true);
        });

        it("should unmute the current tab if it is already muted and the page is not in the list", async () => {
          tab.mutedInfo.muted = true;
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(false);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.toggleMuteOnCurrentTabByUserRequest();

          expect(getTabMuteState(tab.id)).toBe(false);
        });
      });
    });
  });

  describe("muteOtherTabsByUserRequest() ->", () => {
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
      tabs.push({
        id: 1024,
        url: "http://open.spotify.com",
        mutedInfo: { muted: false },
      });

      jest
        .spyOn(mockChrome.tabs, "query")
        .mockImplementation(async (queryInfo) => {
          if (queryInfo && queryInfo.active) {
            return [tabs[0]];
          } else {
            return tabs;
          }
        });

      jest
        .spyOn(mockListExpert, "isInList")
        .mockImplementation(async (_, url) => url !== tabs[1].url);
    });

    describe("when the extension is enabled ->", () => {
      beforeEach(() => {
        setValueForEnabledInOptions(true);
      });

      describe('and using a "block audio" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(false, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingAllowAudioList")
            .mockResolvedValue(false);
        });

        it("should mute other tabs", async () => {
          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.muteOtherTabsByUserRequest();

          expect(getTabMuteState(tabs[0].id)).toBe(false);
          expect(getTabMuteState(tabs[1].id)).toBe(true);
          expect(getTabMuteState(tabs[2].id)).toBe(true);
        });
      });

      describe('and using an "allow audio" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(true, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingAllowAudioList")
            .mockResolvedValue(true);
        });

        it("should mute other tabs", async () => {
          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.muteOtherTabsByUserRequest();

          expect(getTabMuteState(tabs[0].id)).toBe(false);
          expect(getTabMuteState(tabs[1].id)).toBe(true);
          expect(getTabMuteState(tabs[2].id)).toBe(true);
        });
      });
    });

    describe("when the extension is disabled ->", () => {
      beforeEach(() => {
        setValueForEnabledInOptions(false);
      });

      describe('and using a "block audio" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(false, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingAllowAudioList")
            .mockResolvedValue(false);
        });

        it("should mute other tabs", async () => {
          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.muteOtherTabsByUserRequest();

          expect(getTabMuteState(tabs[0].id)).toBe(false);
          expect(getTabMuteState(tabs[1].id)).toBe(true);
          expect(getTabMuteState(tabs[2].id)).toBe(true);
        });
      });

      describe('and using an "allow audio" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(true, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingAllowAudioList")
            .mockResolvedValue(true);
        });

        it("should mute other tabs", async () => {
          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.muteOtherTabsByUserRequest();

          expect(getTabMuteState(tabs[0].id)).toBe(false);
          expect(getTabMuteState(tabs[1].id)).toBe(true);
          expect(getTabMuteState(tabs[2].id)).toBe(true);
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
        .mockImplementation(async (tabId) => getTab(tabId));
    });

    describe("when the extension is enabled ->", () => {
      beforeEach(() => {
        setValueForEnabledInOptions(true);
      });

      describe('and using a "block audio" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(false, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingAllowAudioList")
            .mockResolvedValue(false);
        });

        it("should mute the specified tab if the page is in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.onTabReplaced(tab.id);

          expect(getTabMuteState(tab.id)).toBe(true);
        });

        it("should not mute the specified tab if the page is not in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(false);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.onTabReplaced(tab.id);

          expect(getTabMuteState(tab.id)).toBe(false);
        });
      });

      describe('and using an "allow audio" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(true, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingAllowAudioList")
            .mockResolvedValue(true);
        });

        it("should not mute the specified tab if the page is in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.onTabReplaced(tab.id);

          expect(getTabMuteState(tab.id)).toBe(false);
        });

        it("should mute the specified tab if the page is not in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(false);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.onTabReplaced(tab.id);

          expect(getTabMuteState(tab.id)).toBe(true);
        });
      });
    });

    describe("when the extension is disabled ->", () => {
      beforeEach(() => {
        setValueForEnabledInOptions(false);
      });

      describe('and using a "block audio" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(false, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingAllowAudioList")
            .mockResolvedValue(false);
        });

        it("should not mute the specified tab if the page is in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.onTabReplaced(tab.id);

          expect(getTabMuteState(tab.id)).toBe(false);
        });

        it("should not mute the specified tab if the page is not in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(false);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.onTabReplaced(tab.id);

          expect(getTabMuteState(tab.id)).toBe(false);
        });
      });

      describe('and using an "allow audio" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(true, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingAllowAudioList")
            .mockResolvedValue(true);
        });

        it("should not mute the specified tab if the page is in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.onTabReplaced(tab.id);

          expect(getTabMuteState(tab.id)).toBe(false);
        });

        it("should not mute the specified tab if the page is not in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(false);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
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
        .mockImplementation(async (tabId) => getTab(tabId));
    });

    describe("when the extension is enabled ->", () => {
      beforeEach(() => {
        setValueForEnabledInOptions(true);
      });

      describe('and using a "block audio" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(false, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingAllowAudioList")
            .mockResolvedValue(false);
        });

        it("should mute the specified tab if the page is in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.onTabUrlChanged(tab.id, tab.url);

          expect(getTabMuteState(tab.id)).toBe(true);
        });

        it("should not mute the specified tab if the domain doesn't change", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);
          jest.spyOn(mockChrome.tabs, "query").mockResolvedValue([tab]);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          tab.url = "http://www.google.com/";
          await tabTracker.start();
          tab.url = "http://www.youtube.com/watch?v=12345";
          await tabTracker.onTabUrlChanged(tab.id, tab.url);

          // Sanity check to ensure the tab is muted at this point
          expect(getTabMuteState(tab.id)).toBe(true);

          await tabTracker.toggleMuteOnCurrentTabByUserRequest();

          // Sanity check to ensure the tab is not muted
          expect(getTabMuteState(tab.id)).toBe(false);

          // Now only change the query string
          tab.url = "http://www.youtube.com/channel/12345?foo=bar";
          await tabTracker.onTabUrlChanged(tab.id, tab.url);

          // Should still be unmuted
          expect(getTabMuteState(tab.id)).toBe(false);
        });

        it("should not mute the specified tab if the page is not in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(false);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.onTabUrlChanged(tab.id, tab.url);

          expect(getTabMuteState(tab.id)).toBe(false);
        });
      });

      describe('and using an "allow audio" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(true, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingAllowAudioList")
            .mockResolvedValue(true);
        });

        it("should not mute the specified tab if the page is in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.onTabUrlChanged(tab.id, tab.url);

          expect(getTabMuteState(tab.id)).toBe(false);
        });

        it("should mute the specified tab if the page is not in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(false);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.onTabUrlChanged(tab.id, tab.url);

          expect(getTabMuteState(tab.id)).toBe(true);
        });
      });
    });

    describe("when the extension is disabled ->", () => {
      beforeEach(() => {
        setValueForEnabledInOptions(false);
      });

      describe('and using a "block audio" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(false, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingAllowAudioList")
            .mockResolvedValue(false);
        });

        it("should not mute the specified tab if the page is in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.onTabUrlChanged(tab.id, tab.url);

          expect(getTabMuteState(tab.id)).toBe(false);
        });

        it("should not mute the specified tab if the page is not in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(false);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.onTabUrlChanged(tab.id, tab.url);

          expect(getTabMuteState(tab.id)).toBe(false);
        });
      });

      describe('and using an "allow audio" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(true, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingAllowAudioList")
            .mockResolvedValue(true);
        });

        it("should not mute the specified tab if the page is in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.onTabUrlChanged(tab.id, tab.url);

          expect(getTabMuteState(tab.id)).toBe(false);
        });

        it("should not mute the specified tab if the page is not in the list", async () => {
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(false);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.onTabUrlChanged(tab.id, tab.url);

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
        .mockImplementation(async (queryInfo) => {
          if (queryInfo && queryInfo.active) {
            return [tabs[0]];
          } else {
            return tabs;
          }
        });
    });

    describe("when the extension is enabled ->", () => {
      beforeEach(() => {
        setValueForEnabledInOptions(true);
      });

      describe('and using a "block audio" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(false, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingAllowAudioList")
            .mockResolvedValue(false);
        });

        it("should add the current tab URL to the list and mute the tab", async () => {
          jest
            .spyOn(mockListExpert, "addOrRemoveUrlInList")
            .mockResolvedValue(true);
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.addOrRemoveCurrentPageInList();

          expect(mockListExpert.addOrRemoveUrlInList).toHaveBeenCalled();
          expect(mockListExpert.addOrRemoveUrlInList.mock.calls[0]).toEqual([
            tab.url,
          ]);
          expect(getTabMuteState(tab.id)).toBe(true);
        });
      });

      describe('and using an "allow audio" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(true, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingAllowAudioList")
            .mockResolvedValue(true);
        });

        it("should add the current tab URL to the list and unmute the tab", async () => {
          jest
            .spyOn(mockListExpert, "addOrRemoveUrlInList")
            .mockResolvedValue(true);
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);
          tab.mutedInfo.muted = true;

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.addOrRemoveCurrentPageInList();

          expect(mockListExpert.addOrRemoveUrlInList).toHaveBeenCalled();
          expect(mockListExpert.addOrRemoveUrlInList.mock.calls[0]).toEqual([
            tab.url,
          ]);
          expect(getTabMuteState(tab.id)).toBe(false);
        });
      });
    });

    describe("when the extension is disabled ->", () => {
      beforeEach(() => {
        setValueForEnabledInOptions(false);
      });

      describe('and using a "block audio" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(false, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingAllowAudioList")
            .mockResolvedValue(false);
        });

        it("should add the current tab URL to the list and not mute the tab", async () => {
          jest
            .spyOn(mockListExpert, "addOrRemoveUrlInList")
            .mockResolvedValue(true);
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.addOrRemoveCurrentPageInList();

          expect(mockListExpert.addOrRemoveUrlInList).toHaveBeenCalled();
          expect(mockListExpert.addOrRemoveUrlInList.mock.calls[0]).toEqual([
            tab.url,
          ]);
          expect(getTabMuteState(tab.id)).toBe(false);
        });
      });

      describe('and using an "allow audio" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(true, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingAllowAudioList")
            .mockResolvedValue(true);
        });

        it("should add the current tab URL to the list and not unmute the tab", async () => {
          jest
            .spyOn(mockListExpert, "addOrRemoveUrlInList")
            .mockResolvedValue(true);
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);
          tab.mutedInfo.muted = true;

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.addOrRemoveCurrentPageInList();

          expect(mockListExpert.addOrRemoveUrlInList).toHaveBeenCalled();
          expect(mockListExpert.addOrRemoveUrlInList.mock.calls[0]).toEqual([
            tab.url,
          ]);
          expect(getTabMuteState(tab.id)).toBe(true);
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
        .mockImplementation(async (queryInfo) => {
          if (queryInfo && queryInfo.active) {
            return [tabs[0]];
          } else {
            return tabs;
          }
        });
    });

    describe("when the extension is enabled ->", () => {
      beforeEach(() => {
        setValueForEnabledInOptions(true);
      });

      describe('and using a "block audio" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(false, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingAllowAudioList")
            .mockResolvedValue(false);
        });

        it("should add the current tab domain to the list and mute the tab", async () => {
          jest
            .spyOn(mockListExpert, "addOrRemoveDomainInList")
            .mockResolvedValue(true);
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.addOrRemoveCurrentDomainInList();

          expect(mockListExpert.addOrRemoveDomainInList).toHaveBeenCalled();
          expect(mockListExpert.addOrRemoveDomainInList.mock.calls[0]).toEqual([
            tab.url,
          ]);
          expect(getTabMuteState(tab.id)).toBe(true);
        });
      });

      describe('and using an "allow audio" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(true, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingAllowAudioList")
            .mockResolvedValue(true);
        });

        it("should add the current tab domain to the list and unmute the tab", async () => {
          jest
            .spyOn(mockListExpert, "addOrRemoveDomainInList")
            .mockResolvedValue(true);
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);
          tab.mutedInfo.muted = true;

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.addOrRemoveCurrentDomainInList();

          expect(mockListExpert.addOrRemoveDomainInList).toHaveBeenCalled();
          expect(mockListExpert.addOrRemoveDomainInList.mock.calls[0]).toEqual([
            tab.url,
          ]);
          expect(getTabMuteState(tab.id)).toBe(false);
        });
      });
    });

    describe("when the extension is disabled ->", () => {
      beforeEach(() => {
        setValueForEnabledInOptions(false);
      });

      describe('and using a "block audio" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(false, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingAllowAudioList")
            .mockResolvedValue(false);
        });

        it("should add the current tab domain to the list and not mute the tab", async () => {
          jest
            .spyOn(mockListExpert, "addOrRemoveDomainInList")
            .mockResolvedValue(true);
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.addOrRemoveCurrentDomainInList();

          expect(mockListExpert.addOrRemoveDomainInList).toHaveBeenCalled();
          expect(mockListExpert.addOrRemoveDomainInList.mock.calls[0]).toEqual([
            tab.url,
          ]);
          expect(getTabMuteState(tab.id)).toBe(false);
        });
      });

      describe('and using an "allow audio" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(true, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingAllowAudioList")
            .mockResolvedValue(true);
        });

        it("should add the current tab domain to the list and not unmute the tab", async () => {
          jest
            .spyOn(mockListExpert, "addOrRemoveDomainInList")
            .mockResolvedValue(true);
          jest.spyOn(mockListExpert, "isInList").mockResolvedValue(true);
          tab.mutedInfo.muted = true;

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );
          await tabTracker.start();
          await tabTracker.addOrRemoveCurrentDomainInList();

          expect(mockListExpert.addOrRemoveDomainInList).toHaveBeenCalled();
          expect(mockListExpert.addOrRemoveDomainInList.mock.calls[0]).toEqual([
            tab.url,
          ]);
          expect(getTabMuteState(tab.id)).toBe(true);
        });
      });
    });
  });

  describe("updateSettings", () => {
    describe("disabled to enabled", () => {
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
        tabs.push({
          id: 1024,
          url: "http://open.spotify.com",
          mutedInfo: { muted: false },
        });

        jest.spyOn(mockChrome.tabs, "query").mockResolvedValue(tabs);

        jest
          .spyOn(mockListExpert, "isInList")
          .mockImplementation(async (_, url) => url !== tabs[1].url);

        setValueForEnabledInOptions(true);
      });

      describe('and using a "block audio" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(false, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingAllowAudioList")
            .mockResolvedValue(false);
        });

        it("should mute a tab if the page is in the list and otherwise not", async () => {
          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );

          await tabTracker.start();
          await tabTracker.updateSettings({
            initial: {
              enabled: false,
              allowOrBlockList: "http://google.com",
              usingAllowList: false,
            },
            current: {
              enabled: true,
              allowOrBlockList: "http://google.com",
              usingAllowList: false,
            },
          });

          expect(getTabMuteState(tabs[0].id)).toBe(true);
          expect(getTabMuteState(tabs[1].id)).toBe(false);
          expect(getTabMuteState(tabs[2].id)).toBe(true);
        });
      });

      describe('and using an "allow audio" list ->', () => {
        beforeEach(() => {
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(true, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingAllowAudioList")
            .mockResolvedValue(true);
        });

        it("should not mute a tab if the page is in the list and otherwise should", async () => {
          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );

          await tabTracker.start();
          await tabTracker.updateSettings({
            initial: {
              enabled: false,
              allowOrBlockList: "http://google.com",
              usingAllowList: true,
            },
            current: {
              enabled: true,
              allowOrBlockList: "http://google.com",
              usingAllowList: true,
            },
          });

          expect(getTabMuteState(tabs[0].id)).toBe(false);
          expect(getTabMuteState(tabs[1].id)).toBe(true);
          expect(getTabMuteState(tabs[2].id)).toBe(false);
        });
      });
    });

    describe("enabled to disabled", () => {
      beforeEach(() => {
        tabs.push({
          id: 42,
          url: "http://www.youtube.com",
          mutedInfo: { muted: true, extensionId },
        });
        tabs.push({
          id: 128,
          url: "http://google.com",
          mutedInfo: { muted: true }, // Muted by chrome itself
        });
        tabs.push({
          id: 1024,
          url: "http://open.spotify.com",
          mutedInfo: { muted: true, extensionId },
        });

        jest.spyOn(mockChrome.tabs, "query").mockResolvedValue(tabs);

        jest
          .spyOn(mockListExpert, "isInList")
          .mockImplementation(async (_, url) => url !== tabs[1].url);

        setValueForEnabledInOptions(false);

        jest
          .spyOn(mockListExpert, "getListInfo")
          .mockResolvedValue(new ListInfo(true, []));
        jest
          .spyOn(mockExtensionOptions, "getUsingAllowAudioList")
          .mockResolvedValue(false);
      });

      it("should unmute any tabs muted by the extension", async () => {
        const tabTracker = new TabTracker(
          mockChrome,
          mockExtensionOptions,
          mockListExpert,
          mockLogger
        );

        await tabTracker.start();
        await tabTracker.updateSettings({
          initial: {
            enabled: true,
            allowOrBlockList: "http://google.com",
            usingAllowList: false,
          },
          current: {
            enabled: false,
            allowOrBlockList: "http://google.com",
            usingAllowList: false,
          },
        });

        expect(getTabMuteState(tabs[0].id)).toBe(false);
        expect(getTabMuteState(tabs[1].id)).toBe(true);
        expect(getTabMuteState(tabs[2].id)).toBe(false);
      });
    });

    describe("listed to not listed", () => {
      beforeEach(() => {
        tabs.push({
          id: 42,
          url: "http://www.youtube.com",
          mutedInfo: { muted: false },
        });
        tabs.push({
          id: 128,
          url: "http://google.com",
          mutedInfo: { muted: true, extensionId },
        });
        tabs.push({
          id: 1024,
          url: "http://open.spotify.com",
          mutedInfo: { muted: false },
        });

        jest.spyOn(mockChrome.tabs, "query").mockResolvedValue(tabs);

        setValueForEnabledInOptions(true);
      });

      describe('and using a "block audio" list ->', () => {
        it("should unmute any tabs muted by the extension", async () => {
          // After the update, the list will be empty
          jest
            .spyOn(mockListExpert, "isInList")
            .mockImplementation(async (_, url) => false);
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(false, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingAllowAudioList")
            .mockResolvedValue(false);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );

          await tabTracker.start();
          await tabTracker.updateSettings({
            initial: {
              enabled: true,
              allowOrBlockList: "http://google.com",
              usingAllowList: false,
            },
            current: {
              enabled: true,
              allowOrBlockList: "",
              usingAllowList: false,
            },
          });

          expect(getTabMuteState(tabs[0].id)).toBe(false);
          expect(getTabMuteState(tabs[1].id)).toBe(false);
          expect(getTabMuteState(tabs[2].id)).toBe(false);
        });
      });

      describe('and using an "allow audio" list ->', () => {
        it("should mute any tabs removed from the list", async () => {
          // After the update, only the last tab will be in the list
          jest
            .spyOn(mockListExpert, "isInList")
            .mockImplementation(async (_, url) => url === tabs[2].url);

          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(true, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingAllowAudioList")
            .mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );

          await tabTracker.start();
          await tabTracker.updateSettings({
            initial: {
              enabled: true,
              allowOrBlockList:
                "http://www.youtube.com\nhttp://open.spotify.com",
              usingAllowList: true,
            },
            current: {
              enabled: true,
              allowOrBlockList: "http://open.spotify.com",
              usingAllowList: true,
            },
          });

          expect(getTabMuteState(tabs[0].id)).toBe(true);
          expect(getTabMuteState(tabs[1].id)).toBe(true);
          expect(getTabMuteState(tabs[2].id)).toBe(false);
        });
      });
    });

    describe("not listed to listed", () => {
      beforeEach(() => {
        tabs.push({
          id: 42,
          url: "http://www.youtube.com",
          mutedInfo: { muted: true, extensionId },
        });
        tabs.push({
          id: 128,
          url: "http://google.com",
          mutedInfo: { muted: false },
        });
        tabs.push({
          id: 1024,
          url: "http://open.spotify.com",
          mutedInfo: { muted: true, extensionId },
        });

        jest.spyOn(mockChrome.tabs, "query").mockResolvedValue(tabs);

        setValueForEnabledInOptions(true);
      });

      describe('and using a "block audio" list ->', () => {
        it("should mute any tabs added to the list", async () => {
          // After the update, the list will contain all tabs
          jest
            .spyOn(mockListExpert, "isInList")
            .mockImplementation(async (_, url) => true);
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(false, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingAllowAudioList")
            .mockResolvedValue(false);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );

          await tabTracker.start();
          await tabTracker.updateSettings({
            initial: {
              enabled: true,
              allowOrBlockList:
                "http://www.youtube.com\nhttp://open.spotify.com",
              usingAllowList: false,
            },
            current: {
              enabled: true,
              allowOrBlockList:
                "http://www.youtube.com\nhttp://google.com\nhttp://open.spotify.com",
              usingAllowList: false,
            },
          });

          expect(getTabMuteState(tabs[0].id)).toBe(true);
          expect(getTabMuteState(tabs[1].id)).toBe(true);
          expect(getTabMuteState(tabs[2].id)).toBe(true);
        });
      });

      describe('and using an "allow audio" list ->', () => {
        it("should unmute any tabs added to the list", async () => {
          // After the update, all but the last tab will be in the list
          jest
            .spyOn(mockListExpert, "isInList")
            .mockImplementation(async (_, url) => url !== tabs[2].url);
          jest
            .spyOn(mockListExpert, "getListInfo")
            .mockResolvedValue(new ListInfo(true, []));
          jest
            .spyOn(mockExtensionOptions, "getUsingAllowAudioList")
            .mockResolvedValue(true);

          const tabTracker = new TabTracker(
            mockChrome,
            mockExtensionOptions,
            mockListExpert,
            mockLogger
          );

          await tabTracker.start();
          await tabTracker.updateSettings({
            initial: {
              enabled: true,
              allowOrBlockList: "http://google.com",
              usingAllowList: true,
            },
            current: {
              enabled: true,
              allowOrBlockList: "http://www.youtube.com\nhttp://google.com",
              usingAllowList: true,
            },
          });

          expect(getTabMuteState(tabs[0].id)).toBe(false);
          expect(getTabMuteState(tabs[1].id)).toBe(false);
          expect(getTabMuteState(tabs[2].id)).toBe(true);
        });
      });
    });

    describe(`"block list" switched to "allow list"`, () => {
      beforeEach(() => {
        tabs.push({
          id: 42,
          url: "http://www.youtube.com",
          mutedInfo: { muted: false },
        });
        tabs.push({
          id: 128,
          url: "http://google.com",
          mutedInfo: { muted: true, extensionId },
        });
        tabs.push({
          id: 1024,
          url: "http://open.spotify.com",
          mutedInfo: { muted: false },
        });

        jest
          .spyOn(mockListExpert, "isInList")
          .mockImplementation(async (_, url) => url === tabs[1].url);

        jest.spyOn(mockChrome.tabs, "query").mockResolvedValue(tabs);

        jest
          .spyOn(mockListExpert, "getListInfo")
          .mockResolvedValue(new ListInfo(true, []));

        jest
          .spyOn(mockExtensionOptions, "getUsingAllowAudioList")
          .mockResolvedValue(true);

        setValueForEnabledInOptions(true);
      });

      it("should switch all tab mute values", async () => {
        const tabTracker = new TabTracker(
          mockChrome,
          mockExtensionOptions,
          mockListExpert,
          mockLogger
        );

        await tabTracker.start();
        await tabTracker.updateSettings({
          initial: {
            enabled: true,
            allowOrBlockList: "http://google.com",
            usingAllowList: false,
          },
          current: {
            enabled: true,
            allowOrBlockList: "http://google.com",
            usingAllowList: true,
          },
        });

        expect(getTabMuteState(tabs[0].id)).toBe(true);
        expect(getTabMuteState(tabs[1].id)).toBe(false);
        expect(getTabMuteState(tabs[2].id)).toBe(true);
      });
    });

    describe(`"allow list" switched to "block list"`, () => {
      beforeEach(() => {
        tabs.push({
          id: 42,
          url: "http://www.youtube.com",
          mutedInfo: { muted: true, extensionId },
        });
        tabs.push({
          id: 128,
          url: "http://google.com",
          mutedInfo: { muted: false },
        });
        tabs.push({
          id: 1024,
          url: "http://open.spotify.com",
          mutedInfo: { muted: true, extensionId },
        });

        jest
          .spyOn(mockListExpert, "isInList")
          .mockImplementation(async (_, url) => url === tabs[1].url);

        jest.spyOn(mockChrome.tabs, "query").mockResolvedValue(tabs);

        jest
          .spyOn(mockListExpert, "getListInfo")
          .mockResolvedValue(new ListInfo(false, []));

        jest
          .spyOn(mockExtensionOptions, "getUsingAllowAudioList")
          .mockResolvedValue(false);

        setValueForEnabledInOptions(true);
      });

      it("should switch all tab mute values", async () => {
        const tabTracker = new TabTracker(
          mockChrome,
          mockExtensionOptions,
          mockListExpert,
          mockLogger
        );

        await tabTracker.start();
        await tabTracker.updateSettings({
          initial: {
            enabled: true,
            allowOrBlockList: "http://google.com",
            usingAllowList: true,
          },
          current: {
            enabled: true,
            allowOrBlockList: "http://google.com",
            usingAllowList: false,
          },
        });

        expect(getTabMuteState(tabs[0].id)).toBe(false);
        expect(getTabMuteState(tabs[1].id)).toBe(true);
        expect(getTabMuteState(tabs[2].id)).toBe(false);
      });
    });
  });
});
