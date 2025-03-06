class AutoMuteExtension {
  #chrome;
  /** @member {ExtensionOptions} */
  #extensionOptions;
  /** @member {TabTracker} */
  #tabTracker;
  /** @member {Object} */
  #logger;

  /**
   * @param {Object} chromeInstance
   * @param {ExtensionOptions} extensionOptions
   * @param {TabTracker} tabTracker
   * @param {Object} logger
   */
  constructor(chromeInstance, extensionOptions, tabTracker, logger) {
    this.#chrome = chromeInstance;
    this.#extensionOptions = extensionOptions;
    this.#tabTracker = tabTracker;
    this.#logger = logger;
  }

  async start() {
    this.#chrome.tabs.onCreated.addListener(async (tab) => {
      try {
        this.#logger.log(tab.id + ": created");
        await this.#tabTracker.muteIfShould(tab);
      } catch (e) {
        this.#logger.error(e);
      }
    });

    this.#chrome.tabs.onReplaced.addListener(
      async (addedTabId, removedTabId) => {
        try {
          this.#logger.log(removedTabId + ": replaced -> " + addedTabId);
          await this.#tabTracker.onTabReplaced(addedTabId, removedTabId);
        } catch (e) {
          this.#logger.error(e);
        }
      }
    );

    this.#chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
      try {
        if (changeInfo.mutedInfo) {
          await this.#tabTracker.updateTabMutedState(
            tabId,
            changeInfo.mutedInfo.muted
          );
        }
        if (changeInfo.url) {
          await this.#tabTracker.onTabUrlChanged(tabId, changeInfo.url);
        }
      } catch (e) {
        this.#logger.error(e);
      }
    });

    this.#chrome.commands.onCommand.addListener((command) => {
      try {
        this.#handleCommand(command);
      } catch (e) {
        this.#logger.error(e);
      }
    });

    this.#chrome.runtime.onMessage.addListener(
      (request, _unusedSender, sendResponse) => {
        try {
          return this.#handleMessage(request.command, sendResponse);
        } catch (e) {
          this.#logger.error(e);
          return false;
        }
      }
    );

    await this.#tabTracker.muteAllTabs(false);
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
   * @param {sendResponseCallback} sendResponse
   * @returns {boolean}
   */
  #handleMessage(command, sendResponse) {
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

      case "query-using-should-not-mute-list":
        this.#extensionOptions
          .getUsingShouldNotMuteList()
          .then((using) => {
            sendResponse({ usingShouldNotMuteList: using });
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
        await this.#tabTracker.muteAllTabs(true);
        break;
      case "mute-tab":
        await this.#tabTracker.toggleMuteOnCurrentTab();
        break;
      case "mute-other":
        await this.#tabTracker.muteOtherTabs();
        break;
      case "list-page":
        await this.#tabTracker.addOrRemoveCurrentPageInList();
        break;
      case "list-domain":
        await this.#tabTracker.addOrRemoveCurrentDomainInList();
        break;
      case "switch-list-type":
        await this.#extensionOptions.switchListType();
        break;
    }
  }
}

export default AutoMuteExtension;
