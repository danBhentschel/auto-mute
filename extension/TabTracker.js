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
   * Initializes the tab tracker by reading the current state of all tabs
   * and populating the tabState map.
   * @returns {Promise<void>}
   */
  async start() {
    const tabs = await this.#getAllTabs();
    if (!tabs) {
      this.#logger.log("No tabs found on startup");
      return;
    }

    const tabState = (
      await this.#chrome.storage.session.get({
        tabState: {},
      })
    ).tabState;
    if (Object.keys(tabState).length > 0) {
      this.#logger.log("Tab state already initialized, skipping...");
      return;
    }

    // Populate the tabState map with current tab information
    for (const tab of tabs) {
      if (tab.id && tab.url) {
        tabState[`${tab.id}`] = { url: tab.url };
        this.#logger.log(`Initialized tab ${tab.id} with URL: ${tab.url}`);
      }
    }

    // Store the tab URLs in session storage
    await this.#chrome.storage.session.set({ tabState });
    this.#logger.log(`TabTracker initialized with ${tabs.length} tabs`);
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
   * @param {number} tabId
   */
  async onTabCreated(tab) {
    this.#removeCachedTab(tab.id);
    this.#setCachedUrlForTab(tab.id, tab.url);
    this.muteByApplicationLogic(tab);
  }

  /**
   * @param {number} addedTabId
   * @param {number} removedTabId
   */
  async onTabReplaced(addedTabId, removedTabId) {
    this.#removeCachedTab(removedTabId);

    const tab = await this.#getTabById(addedTabId);
    if (!tab) {
      this.#logger.warn(`Tab ${addedTabId} not found`);
      return;
    }

    this.#setCachedUrlForTab(addedTabId, tab.url);
    await this.muteByApplicationLogic(tab);
  }

  /**
   *
   * @param {number} tabId
   * @param {string} url
   */
  async onTabUrlChanged(tabId, url) {
    const oldUrl = await this.#getCachedUrlForTab(tabId);
    this.#logger.log(`Tab ${tabId} URL changed from ${oldUrl} to ${url}`);

    // If the URL hasn't changed, do nothing
    if (oldUrl && this.#urlsHaveSameDomain(oldUrl, url)) {
      this.#logger.log(`Tab ${tabId} URL did not change`);
      return;
    }

    const tab = await this.#getTabById(tabId);
    if (!tab) {
      this.#logger.warn(`Tab ${tabId} not found`);
      return;
    }

    this.#setCachedUrlForTab(tabId, url);
    await this.muteByApplicationLogic(tab);
  }

  /**
   * @param {number} tabId
   */
  async onTabRemoved(tabId) {
    this.#removeCachedTab(tabId);
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
   * Compares two URLs and returns true if they have the same base domain,
   * ignoring subdomains, protocol, path, and query parameters.
   * For example, "https://music.youtube.com/watch?v=123" and
   * "http://youtube.com/channel/abc" would return true.
   *
   * @param {string} url1 - The first URL to compare
   * @param {string} url2 - The second URL to compare
   * @returns {boolean} - True if the URLs have the same base domain, false otherwise
   */
  #urlsHaveSameDomain(url1, url2) {
    if (!url1 || !url2) {
      return false; // If either URL is null or undefined, return false
    }

    try {
      // Parse the URLs
      const parsedUrl1 = new URL(url1);
      const parsedUrl2 = new URL(url2);

      // Extract the base domains by getting the hostname and removing subdomains
      const domain1 = this.#extractBaseDomain(parsedUrl1.hostname);
      const domain2 = this.#extractBaseDomain(parsedUrl2.hostname);

      // Compare the base domains
      return domain1 === domain2;
    } catch (error) {
      // If URL parsing fails, return false
      console.error("Error comparing domains:", error);
      return false;
    }
  }

  /**
   * Extracts the base domain from a hostname by removing subdomains.
   * For example, "music.youtube.com" becomes "youtube.com"
   *
   * @param {string} hostname - The hostname to extract the base domain from
   * @returns {string} - The base domain
   * @private
   */
  #extractBaseDomain(hostname) {
    // Split the hostname by dots
    const parts = hostname.split(".");

    // If we have only two parts (like "example.com") or fewer, return the whole hostname
    if (parts.length <= 2) {
      return hostname;
    }

    // For special cases like co.uk, com.au, etc., we need to handle differently
    // This is a simplified approach - for a production environment, consider using a library
    // that handles all TLDs properly
    const tld = parts[parts.length - 1];
    const sld = parts[parts.length - 2];

    // Check for common country-specific second-level domains
    if (
      (sld === "co" ||
        sld === "com" ||
        sld === "org" ||
        sld === "net" ||
        sld === "gov" ||
        sld === "edu") &&
      tld.length === 2
    ) {
      // Country code TLDs are typically 2 characters
      // For domains like example.co.uk, return the last 3 parts
      if (parts.length >= 3) {
        return `${parts[parts.length - 3]}.${sld}.${tld}`;
      }
    }

    // For normal domains, return the last 2 parts
    return `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
  }

  async #getCachedUrlForTab(tabId) {
    const tabState = (
      await this.#chrome.storage.session.get({
        tabState: {},
      })
    ).tabState;
    return tabState[`${tabId}`]?.url;
  }

  async #setCachedUrlForTab(tabId, url) {
    const tabState = (
      await this.#chrome.storage.session.get({
        tabState: {},
      })
    ).tabState;
    if (!tabState[`${tabId}`]) {
      tabState[`${tabId}`] = {};
    }
    tabState[`${tabId}`].url = url;
    await this.#chrome.storage.session.set({ tabState });
  }

  async #removeCachedTab(tabId) {
    const tabState = (
      await this.#chrome.storage.session.get({
        tabState: {},
      })
    ).tabState;
    delete tabState[`${tabId}`];
    await this.#chrome.storage.session.set({ tabState });
  }

  async getDebugInfo() {
    const tabState = (
      await this.#chrome.storage.session.get({
        tabState: {},
      })
    ).tabState;
    return {
      tabState,
    };
  }
}

export default TabTracker;
