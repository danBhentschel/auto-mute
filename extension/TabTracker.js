class TabTracker {
  #chrome;
  /** @member {ExtensionOptions} */
  #extensionOptions;
  /** @member {ListExpert} */
  #listExpert;
  /** @member {Object} */
  #logger;

  /**
   * @param {Object} chromeInstance
   * @param {ExtensionOptions} extensionOptions
   * @param {ListExpert} listExpert
   * @param {Object} logger
   */
  constructor(chromeInstance, extensionOptions, listExpert, logger) {
    this.#chrome = chromeInstance;
    this.#extensionOptions = extensionOptions;
    this.#listExpert = listExpert;
    this.#logger = logger;
  }

  /**
   * @param {Object} tab
   */
  async muteByApplicationLogic(tab) {
    const listInfo = await this.#listExpert.getListInfo();
    await this.#mute(listInfo, tab);
  }

  async muteAllTabsByApplicationLogic() {
    await this.#muteAllTabs(false);
  }

  async muteAllTabsByUserRequest() {
    await this.#muteAllTabs(true);
  }

  async toggleMuteOnCurrentTabByUserRequest() {
    const tab = await this.#getCurrentTab();
    if (!!tab) {
      await this.#setMuteOnTab(tab.id, !tab.mutedInfo.muted, true);
    }
  }

  async muteOtherTabsByUserRequest() {
    const tab = await this.#getCurrentTab();
    if (!!tab) {
      await this.#muteAllTabs(true, tab.id);
    } else {
      this.#logger.warn("Could not determine current tab");
      await this.#muteAllTabs(true);
    }
  }

  /**
   * @param {number} addedTabId
   * @param {number} removedTabId
   */
  async onTabReplaced(addedTabId, removedTabId) {
    await this.#muteById(addedTabId);
  }

  /**
   *
   * @param {number} tabId
   * @param {string} url
   */
  async onTabUrlChanged(tabId) {
    await this.#muteById(tabId);
  }

  async addOrRemoveCurrentPageInList() {
    const tab = await this.#getCurrentTab();
    if (!tab) return;
    await this.#listExpert.addOrRemoveUrlInList(tab.url);
    await this.#unmuteAllTabs();
    await this.muteAllTabsByApplicationLogic();
  }

  async addOrRemoveCurrentDomainInList() {
    const tab = await this.#getCurrentTab();
    if (!tab) return;
    await this.#listExpert.addOrRemoveDomainInList(tab.url);
    await this.#unmuteAllTabs();
    await this.muteAllTabsByApplicationLogic();
  }

  /**
   * @returns {Promise<boolean>}
   */
  async isCurrentTabMuted() {
    const tab = await this.#getCurrentTab();
    return tab?.mutedInfo?.muted ?? false;
  }

  /**
   * @returns {Promise<boolean>}
   */
  async isCurrentTabMutedByExtension() {
    const tab = await this.#getCurrentTab();
    return (
      (tab?.mutedInfo?.muted ?? false) &&
      tab?.mutedInfo?.extensionId === this.#chrome.runtime.id
    );
  }

  /**
   * @returns {Promise<boolean>}
   */
  async isDomainOfCurrentTabInList() {
    const tab = await this.#getCurrentTab();
    return await this.#listExpert.isDomainInList(tab.url);
  }

  /**
   * @returns {Promise<boolean>}
   */
  async isCurrentTabInList() {
    const tab = await this.#getCurrentTab();
    return await this.#listExpert.isExactMatchInList(tab.url);
  }

  async updateSettings(settingsInfo) {
    if (!settingsInfo) {
      return;
    }

    if (settingsInfo.initial?.enabled !== settingsInfo.current?.enabled) {
      if (settingsInfo.current.enabled) {
        await this.muteAllTabsByApplicationLogic();
      } else {
        await this.#unmuteAllTabs();
      }
    }

    if (
      settingsInfo.initial?.allowOrBlockList !==
      settingsInfo.current?.allowOrBlockList
    ) {
      await this.#unmuteAllTabs();
      await this.muteAllTabsByApplicationLogic();
    }

    if (
      settingsInfo.initial?.usingAllowList !==
      settingsInfo.current?.usingAllowList
    ) {
      await this.#unmuteAllTabs();
      await this.muteAllTabsByApplicationLogic();
    }
  }

  async #muteAllTabs(byUserRequest, excludeId) {
    const listInfo = await this.#listExpert.getListInfo();
    const tabs = await this.#getAllTabs();
    if (!tabs) {
      return;
    }
    for (const tab of tabs) {
      if (tab.id === excludeId) continue;
      if (byUserRequest) {
        await this.#setMuteOnTab(tab.id, true, true);
      } else {
        await this.#mute(listInfo, tab);
      }
    }
  }

  async #unmuteAllTabs() {
    const extensionId = this.#chrome.runtime.id;
    const tabs = await this.#getAllTabs();
    if (!tabs) {
      return;
    }
    for (const tab of tabs) {
      if (tab.mutedInfo.extensionId === extensionId) {
        await this.#setMuteOnTab(tab.id, false, true);
      }
    }
  }

  /**
   * @param {number} tabId
   * @param {boolean} muted
   * @param {boolean} force
   */
  async #setMuteOnTab(tabId, muted, force) {
    const shouldMute = !!force || (await this.#extensionOptions.getEnabled());
    if (shouldMute) {
      const tab = await this.#getTabById(tabId);
      // I don't think this check is necessary, but it's difficult to verify
      // that setting the mute state to the same value will not update the
      // tab's extensionId. So, I'm going to leave this check in place.
      if (tab?.mutedInfo?.muted !== muted) {
        await this.#chrome.tabs.update(tabId, { muted });
      }
    }
    this.#logger.log(`${tabId}: muted -> ${muted}`);
  }

  /**
   * @param {ListInfo} listInfo
   * @param {Object} tab
   */
  async #mute(listInfo, tab) {
    const shouldMute = await this.#shouldMute(listInfo, tab.url);
    await this.#setMuteOnTab(tab.id, shouldMute);
  }

  /**
   * @param {number} tabId
   * @returns {Promise<Object>}
   */
  async #getTabById(tabId) {
    return await this.#chrome.tabs.get(tabId);
  }

  /**
   * @returns {Promise<Object>}
   */
  async #getCurrentTab() {
    const tabs = await this.#chrome.tabs.query({
      active: true,
      lastFocusedWindow: true,
    });
    return tabs?.length ? tabs[0] : null;
  }

  /**
   * @returns {Promise<List<Object>>}
   */
  async #getAllTabs() {
    return await this.#chrome.tabs.query({});
  }

  /**
   * @param {ListInfo} listInfo
   * @param {string} url
   * @returns {Promise<boolean>}
   */
  async #shouldMute(listInfo, url) {
    this.#logger.log(`Checking ${url} against ${listInfo.listOfPages}`);
    const inList = await this.#listExpert.isInList(listInfo.listOfPages, url);
    return (
      (!listInfo.isAllowedAudioList && inList) ||
      (listInfo.isAllowedAudioList && !inList)
    );
  }

  /**
   * @param {number} tabId
   */
  async #muteById(tabId) {
    const tab = await this.#getTabById(tabId);
    if (tab) {
      await this.muteByApplicationLogic(tab);
    } else {
      this.#logger.log(this.#chrome.runtime.lastError.message);
    }
  }
}

export default TabTracker;
