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
  #rejectInit;

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
    this.#initPromise = new Promise((resolve, reject) => {
      this.#resolveInit = resolve;
      this.#rejectInit = reject;
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
      try {
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
      } catch (e) {
        this.#logger.error(`Error starting extension: ${JSON.stringify(e)}`);
        this.#rejectInit(e);
      }
    })();

    this.#chrome.tabs.onCreated.addListener(async (tab) => {
      try {
        await this.#initPromise; // Wait for the init promise to be resolved

        this.#logger.log(tab.id + ": created");
        await this.#tabTracker.muteByApplicationLogic(tab);
        await this.#iconSwitcher.updateIcon();
      } catch (e) {
        this.#logger.error(`Error in onCreated: ${JSON.stringify(e)}`);
      }
    });

    this.#chrome.tabs.onReplaced.addListener(
      async (addedTabId, removedTabId) => {
        try {
          await this.#initPromise; // Wait for the init promise to be resolved

          this.#logger.log(removedTabId + ": replaced -> " + addedTabId);
          await this.#tabTracker.onTabReplaced(addedTabId, removedTabId);
          await this.#iconSwitcher.updateIcon();
        } catch (e) {
          this.#logger.error(`Error in onReplaced: ${JSON.stringify(e)}`);
        }
      }
    );

    this.#chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
      try {
        await this.#initPromise; // Wait for the init promise to be resolved

        if (changeInfo.url) {
          this.#logger.log(tabId + ": updated -> " + changeInfo.url);
          await this.#tabTracker.onTabUrlChanged(tabId, changeInfo.url);
          await this.#iconSwitcher.updateIcon();
        }
      } catch (e) {
        this.#logger.error(`Error in onUpdated: ${JSON.stringify(e)}`);
      }
    });

    this.#chrome.tabs.onActivated.addListener(async () => {
      try {
        await this.#initPromise; // Wait for the init promise to be resolved

        this.#logger.log("Tab activated");
        await this.#iconSwitcher.updateIcon();
      } catch (e) {
        this.#logger.error(`Error in onActivated: ${JSON.stringify(e)}`);
      }
    });

    this.#chrome.tabs.onRemoved.addListener(async (tabId) => {
      try {
        await this.#initPromise; // Wait for the init promise to be resolved

        this.#logger.log(tabId + ": removed");
        await this.#tabTracker.onTabRemoved(tabId);
      } catch (e) {
        this.#logger.error(`Error in onRemoved: ${JSON.stringify(e)}`);
      }
    });

    this.#chrome.windows.onFocusChanged.addListener(async () => {
      try {
        await this.#initPromise; // Wait for the init promise to be resolved

        this.#logger.log("Window focus changed");
        await this.#iconSwitcher.updateIcon();
      } catch (e) {
        this.#logger.error(`Error in onFocusChanged: ${JSON.stringify(e)}`);
      }
    });

    this.#chrome.commands.onCommand.addListener(async (command) => {
      try {
        await this.#initPromise; // Wait for the init promise to be resolved

        this.#logger.log(`Command: ${command}`);
        await this.#handleCommand(command);
      } catch (e) {
        this.#logger.error(`Error in onCommand: ${JSON.stringify(e)}`);
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
          this.#logger.error(`Error in onMessage: ${JSON.stringify(e)}`);
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
          try {
            await this.#initPromise; // Wait for the init promise to be resolved

            const muted = await this.#tabTracker.isCurrentTabMuted();
            sendResponse({ muted });
          } catch (e) {
            this.#logger.error(
              `Error in query-current-muted: ${JSON.stringify(e)}`
            );
            sendResponse({});
          }
        })();
        return true;

      case "query-using-should-allow-list":
        (async () => {
          try {
            await this.#initPromise; // Wait for the init promise to be resolved

            const using = await this.#extensionOptions.getUsingAllowAudioList();
            sendResponse({ usingAllowAudioList: using });
          } catch (e) {
            this.#logger.error(
              `Error in query-using-should-allow-list: ${JSON.stringify(e)}`
            );
            sendResponse({});
          }
        })();
        return true;

      case "query-page-listed":
        (async () => {
          try {
            await this.#initPromise; // Wait for the init promise to be resolved

            const listed = await this.#tabTracker.isCurrentTabInList();
            sendResponse({ listed });
          } catch (e) {
            this.#logger.error(
              `Error in query-page-listed: ${JSON.stringify(e)}`
            );
            sendResponse({});
          }
        })();
        return true;

      case "query-domain-listed":
        (async () => {
          try {
            await this.#initPromise; // Wait for the init promise to be resolved

            const listed = await this.#tabTracker.isDomainOfCurrentTabInList();
            sendResponse({ listed });
          } catch (e) {
            this.#logger.error(
              `Error in query-domain-listed: ${JSON.stringify(e)}`
            );
            sendResponse({});
          }
        })();
        return true;

      case "query-debug-info":
        (async () => {
          try {
            await this.#initPromise; // Wait for the init promise to be resolved

            const tabInfo = await this.#tabTracker.getDebugInfo();
            const iconInfo = await this.#iconSwitcher.getDebugInfo();
            const optionsInfo = await this.#extensionOptions.getDebugInfo();
            const logBuffer = await this.#logger.getLogBuffer();

            const debugInfo = `
Extension ID: ${this.#chrome.runtime.id}
Version: ${this.#chrome.runtime.getManifest().version}

Tab Tracker:
${JSON.stringify(tabInfo, null, 2)}

Icon Switcher:
${JSON.stringify(iconInfo, null, 2)}

Options:
${JSON.stringify(optionsInfo, null, 2)}

Log Buffer:
${logBuffer.join("\n")}
`;

            sendResponse({ debugInfo });
          } catch (e) {
            this.#logger.error(
              `Error in query-debug-info: ${JSON.stringify(e)}`
            );
            sendResponse({ debugInfo: "Could not get debug info" });
          }
        })();
        return true;

      case "update-settings":
        (async () => {
          try {
            await this.#initPromise; // Wait for the init promise to be resolved
            await this.#tabTracker.updateSettings(data);
            await this.#iconSwitcher.updateIcon();
          } catch (e) {
            this.#logger.error(
              `Error in update-settings: ${JSON.stringify(e)}`
            );
          }
        })();
        return false;

      case "change-color-scheme":
        (async () => {
          try {
            await this.#initPromise; // Wait for the init promise to be resolved

            const systemColorScheme =
              await this.#iconSwitcher.setSystemColorScheme(data.scheme);
            sendResponse({ systemColorScheme });
          } catch (e) {
            this.#logger.error(
              `Error in change-color-scheme: ${JSON.stringify(e)}`
            );
            sendResponse({});
          }
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
    try {
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

        default:
          this.#logger.warn("Unknown command: " + command);
          break;
      }

      await this.#iconSwitcher.updateIcon();
    } catch (e) {
      this.#logger.error(`Error in handleCommand: ${JSON.stringify(e)}`);
    }
  }
}

export default AutoMuteExtension;
