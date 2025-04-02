class AutoMuteExtension {
  #chrome;
  /** @member {UpgradeCoordinator} */
  #upgradeCoordinator;
  /** @member {ExtensionOptions} */
  #extensionOptions;
  /** @member {TabTracker} */
  #tabTracker;
  /** @member {IconSwitcher} */
  #iconSwitcher;
  /** @member {Object} */
  #logger;

  /** @member {Promise<void>} */
  #initPromise;
  #resolveInit;

  /**
   * @param {Object} chromeInstance
   * @param {UpgradeCoordinator} upgradeCoordinator
   * @param {ExtensionOptions} extensionOptions
   * @param {TabTracker} tabTracker
   * @param {IconSwitcher} iconSwitcher
   * @param {Object} logger
   */
  constructor(
    chromeInstance,
    upgradeCoordinator,
    extensionOptions,
    tabTracker,
    iconSwitcher,
    logger
  ) {
    this.#chrome = chromeInstance;
    this.#upgradeCoordinator = upgradeCoordinator;
    this.#extensionOptions = extensionOptions;
    this.#tabTracker = tabTracker;
    this.#iconSwitcher = iconSwitcher;
    this.#logger = logger;
    this.#initPromise = new Promise((resolve) => {
      this.#resolveInit = resolve;
    });
  }

  /**
   * @returns {Promise<void>}
   */
  __forTests_getInitPromise() {
    return this.#initPromise;
  }

  start() {
    this.#logger.log("Starting extension");

    // Start all async operations in the proper order and then
    // resolve the init promise when all of them are done.
    (async () => {
      await this.#upgradeCoordinator.upgrade();
      await this.#tabTracker.start();
      await this.#iconSwitcher.start();

      // Only run this the first time the service worker is started.
      const shouldMuteAllTabs = (
        await this.#chrome.storage.session.get({
          shouldMuteAllTabs: true,
        })
      ).shouldMuteAllTabs;

      if (shouldMuteAllTabs) {
        await this.#tabTracker.muteAllTabsByApplicationLogic();
        await this.#chrome.storage.session.set({ shouldMuteAllTabs: false });
      }

      await this.#iconSwitcher.updateIcon();

      this.#logger.log("Extension started");

      // Resolve the init promise to indicate that the extension is ready.
      this.#resolveInit();
    })();

    this.#chrome.tabs.onCreated.addListener(async (tab) => {
      try {
        await this.#initPromise; // Wait for the init promise to be resolved

        this.#logger.log(tab.id + ": created");
        await this.#tabTracker.muteByApplicationLogic(tab);
        await this.#iconSwitcher.updateIcon();
      } catch (e) {
        this.#logger.error(e);
      }
    });

    this.#chrome.tabs.onReplaced.addListener(
      async (addedTabId, removedTabId) => {
        await this.#initPromise; // Wait for the init promise to be resolved

        try {
          this.#logger.log(removedTabId + ": replaced -> " + addedTabId);
          await this.#tabTracker.onTabReplaced(addedTabId, removedTabId);
          await this.#iconSwitcher.updateIcon();
        } catch (e) {
          this.#logger.error(e);
        }
      }
    );

    this.#chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
      await this.#initPromise; // Wait for the init promise to be resolved

      try {
        if (changeInfo.url) {
          this.#logger.log(tabId + ": updated -> " + changeInfo.url);
          await this.#tabTracker.onTabUrlChanged(tabId, changeInfo.url);
          await this.#iconSwitcher.updateIcon();
        }
      } catch (e) {
        this.#logger.error(e);
      }
    });

    this.#chrome.tabs.onActivated.addListener(async () => {
      await this.#initPromise; // Wait for the init promise to be resolved

      try {
        this.#logger.log("Tab activated");
        await this.#iconSwitcher.updateIcon();
      } catch (e) {
        this.#logger.error(e);
      }
    });

    this.#chrome.tabs.onRemoved.addListener(async (tabId) => {
      await this.#initPromise; // Wait for the init promise to be resolved

      try {
        this.#logger.log(tabId + ": removed");
        await this.#tabTracker.onTabRemoved(tabId);
      } catch (e) {
        this.#logger.error(e);
      }
    });

    this.#chrome.windows.onFocusChanged.addListener(async () => {
      await this.#initPromise; // Wait for the init promise to be resolved

      try {
        this.#logger.log("Window focus changed");
        await this.#iconSwitcher.updateIcon();
      } catch (e) {
        this.#logger.error(e);
      }
    });

    this.#chrome.commands.onCommand.addListener(async (command) => {
      await this.#initPromise; // Wait for the init promise to be resolved

      try {
        this.#logger.log(`Command: ${command}`);
        await this.#handleCommand(command);
      } catch (e) {
        this.#logger.error(e);
      }
    });

    this.#chrome.runtime.onMessage.addListener(
      (request, _unusedSender, sendResponse) => {
        try {
          return this.#handleMessage(
            request.command,
            request.data,
            sendResponse
          );
        } catch (e) {
          this.#logger.error(e);
          return false;
        }
      }
    );
  }

  /**
   * @callback sendResponseCallback
   * @param {Object} data
   */
  /**
   * A return value of true tells the browser to expect that the
   * sendResponse() callback function will be called asynchronously
   * and so it keeps the communication channel open to wait for
   * this response.
   *
   * @param {string} command
   * @param {Object} data
   * @param {sendResponseCallback} sendResponse
   * @returns {boolean}
   */
  #handleMessage(command, data, sendResponse) {
    switch (command) {
      case "query-current-muted":
        (async () => {
          await this.#initPromise; // Wait for the init promise to be resolved

          try {
            const muted = await this.#tabTracker.isCurrentTabMuted();
            sendResponse({ muted });
          } catch (e) {
            this.#logger.error(e);
            sendResponse({});
          }
        })();
        return true;

      case "query-using-should-allow-list":
        (async () => {
          await this.#initPromise; // Wait for the init promise to be resolved

          try {
            const using = await this.#extensionOptions.getUsingAllowAudioList();
            sendResponse({ usingAllowAudioList: using });
          } catch (e) {
            this.#logger.error(e);
            sendResponse({});
          }
        })();
        return true;

      case "query-page-listed":
        (async () => {
          await this.#initPromise; // Wait for the init promise to be resolved

          try {
            const listed = await this.#tabTracker.isCurrentTabInList();
            sendResponse({ listed });
          } catch (e) {
            this.#logger.error(e);
            sendResponse({});
          }
        })();
        return true;

      case "query-domain-listed":
        (async () => {
          await this.#initPromise; // Wait for the init promise to be resolved

          try {
            const listed = await this.#tabTracker.isDomainOfCurrentTabInList();
            sendResponse({ listed });
          } catch (e) {
            this.#logger.error(e);
            sendResponse({});
          }
        })();
        return true;

      case "update-settings":
        (async () => {
          await this.#initPromise; // Wait for the init promise to be resolved
          await this.#tabTracker.updateSettings(data);
          await this.#iconSwitcher.updateIcon();
        })();
        return false;

      case "change-color-scheme":
        (async () => {
          await this.#initPromise; // Wait for the init promise to be resolved

          const systemColorScheme =
            await this.#iconSwitcher.setSystemColorScheme(data.scheme);
          sendResponse({ systemColorScheme });
        })();
        return true;

      default:
        this.#handleCommand(command);
        return false;
    }
  }

  /**
   * @param {string} command
   * @returns {Promise<void>}
   */
  async #handleCommand(command) {
    await this.#initPromise; // Wait for the init promise to be resolved

    switch (command) {
      case "apply-mute":
        await this.#tabTracker.applyMute();
        break;
      case "mute-all":
        await this.#tabTracker.muteAllTabsByUserRequest();
        break;
      case "mute-tab":
        await this.#tabTracker.toggleMuteOnCurrentTabByUserRequest();
        break;
      case "mute-other":
        await this.#tabTracker.muteOtherTabsByUserRequest();
        break;
      case "list-page":
        await this.#tabTracker.addOrRemoveCurrentPageInList();
        break;
      case "list-domain":
        await this.#tabTracker.addOrRemoveCurrentDomainInList();
        break;
    }

    await this.#iconSwitcher.updateIcon();
  }
}

export default AutoMuteExtension;
