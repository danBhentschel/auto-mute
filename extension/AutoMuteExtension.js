class AutoMuteExtension {
  #chrome;
  /** @member {ExtensionOptions} */
  #extensionOptions;
  /** @member {TabTracker} */
  #tabTracker;
  /** @member {IconSwitcher} */
  #iconSwitcher;
  /** @member {Object} */
  #logger;

  /**
   * @param {Object} chromeInstance
   * @param {ExtensionOptions} extensionOptions
   * @param {TabTracker} tabTracker
   * @param {IconSwitcher} iconSwitcher
   * @param {Object} logger
   */
  constructor(
    chromeInstance,
    extensionOptions,
    tabTracker,
    iconSwitcher,
    logger
  ) {
    this.#chrome = chromeInstance;
    this.#extensionOptions = extensionOptions;
    this.#tabTracker = tabTracker;
    this.#iconSwitcher = iconSwitcher;
    this.#logger = logger;
  }

  async start() {
    this.#logger.log("Starting extension");

    this.#chrome.tabs.onCreated.addListener(async (tab) => {
      try {
        this.#logger.log(tab.id + ": created");
        await this.#tabTracker.muteByApplicationLogic(tab);
        await this.#iconSwitcher.updateIcon();
      } catch (e) {
        this.#logger.error(e);
      }
    });

    this.#chrome.tabs.onReplaced.addListener(
      async (addedTabId, removedTabId) => {
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
      try {
        if (changeInfo.url) {
          await this.#tabTracker.onTabUrlChanged(tabId, changeInfo.url);
          await this.#iconSwitcher.updateIcon();
        }
      } catch (e) {
        this.#logger.error(e);
      }
    });

    this.#chrome.tabs.onActivated.addListener(async () => {
      try {
        await this.#iconSwitcher.updateIcon();
      } catch (e) {
        this.#logger.error(e);
      }
    });

    this.#chrome.windows.onFocusChanged.addListener(async () => {
      try {
        await this.#iconSwitcher.updateIcon();
      } catch (e) {
        this.#logger.error(e);
      }
    });

    this.#chrome.commands.onCommand.addListener(async (command) => {
      try {
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

    await this.#tabTracker.muteAllTabsByApplicationLogic();
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
        this.#tabTracker
          .isCurrentTabMuted()
          .then((muted) => {
            sendResponse({ muted });
          })
          .catch((e) => {
            this.#logger.error(e);
            sendResponse({});
          });
        return true;

      case "query-using-should-allow-list":
        this.#extensionOptions
          .getUsingAllowAudioList()
          .then((using) => {
            sendResponse({ usingAllowAudioList: using });
          })
          .catch((e) => {
            this.#logger.error(e);
            sendResponse({});
          });
        return true;

      case "query-page-listed":
        this.#tabTracker
          .isCurrentTabInList()
          .then((listed) => {
            sendResponse({ listed });
          })
          .catch((e) => {
            this.#logger.error(e);
            sendResponse({});
          });
        return true;

      case "query-domain-listed":
        this.#tabTracker
          .isDomainOfCurrentTabInList()
          .then((listed) => {
            sendResponse({ listed });
          })
          .catch((e) => {
            this.#logger.error(e);
            sendResponse({});
          });
        return true;

      case "update-settings":
        this.#tabTracker.updateSettings(data).then(() => {
          this.#iconSwitcher.updateIcon();
        });
        break;

      case "change-color-scheme":
        this.#iconSwitcher
          .setSystemColorScheme(data.scheme)
          .then((systemColorScheme) => {
            sendResponse({ systemColorScheme });
          });
        return true;

      default:
        this.#handleCommand(command);
    }

    return false;
  }

  /**
   * @param {string} command
   * @returns {Promise<void>}
   */
  async #handleCommand(command) {
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
