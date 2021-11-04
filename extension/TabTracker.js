'use strict';

class TabTracker {
    #chrome;
    /** @member {ExtensionOptions} */
    #extensionOptions;
    /** @member {ListExpert} */
    #listExpert;
    #tabState = {};

    /**
     * @param {Object} chromeInstance
     * @param {ExtensionOptions} extensionOptions
     * @param {ListExpert} listExpert
     */
    constructor(chromeInstance, extensionOptions, listExpert) {
        this.#chrome = chromeInstance;
        this.#extensionOptions = extensionOptions;
        this.#listExpert = listExpert;
    }

    /**
     * @param {Object} tab 
     */
    async muteIfShould(tab) {
        const listInfo = await this.#listExpert.getListInfo();
        await this.#muteIfShouldNoListUpdate(listInfo, tab);
        await this.#updateTabIfListed(listInfo, tab);
    }

    /**
     * @param {boolean} force - Specifies whether to ignore lists
     * @param {number} [excludeId] - Used when muting all but current tab
     */
    async muteAllTabs(force, excludeId) {
        const listInfo = await this.#listExpert.getListInfo();
        const tabs = await this.#getAllTabs();
        if (!tabs) { return; }
        for (const tab of tabs) {
            if (tab.id === excludeId) continue;
            if (force) {
                await this.#setMuteOnTab(tab.id, true, true);
            } else {
                await this.#muteIfShouldNoListUpdate(listInfo, tab);
            }
            await this.#updateTabIfListed(listInfo, tab);
        }
    }

    async toggleMuteOnCurrentTab() {
        const tab = await this.#getCurrentTab();
        if (!!tab) {
            await this.#setMuteOnTab(tab.id, !tab.mutedInfo.muted, true);
        }
    }

    async muteOtherTabs() {
        const tab = await this.#getCurrentTab();
        if (!!tab) {
            await this.muteAllTabs(true, tab.id);
        } else {
            console.warn('Could not determine current tab');
            await this.muteAllTabs(true);
        }
    }

    async applyMuteRulesToAllTabs() {
        await this.muteAllTabs(false);
    }

    /**
     * @param {number} addedTabId 
     * @param {number} removedTabId 
     */
    async onTabReplaced(addedTabId, removedTabId) {
        if (this.#tabState[removedTabId]) {
            console.log(`${removedTabId}: ${JSON.stringify(this.#tabState[removedTabId])}`);
            this.#tabState[addedTabId] = this.#tabState[removedTabId];
            delete this.#tabState[removedTabId];
        }

        await this.#muteIfShouldById(addedTabId);
    }

    /**
     * 
     * @param {number} tabId 
     * @param {string} url 
     */
    async onTabUrlChanged(tabId) {
        await this.#muteIfShouldById(tabId);
    }

    /**
     * @param {number} tabId 
     * @param {boolean} isMuted 
     */
    onTabMutedByUser(tabId, isMuted) {
        if (!this.#tabState[tabId]) { this.#tabState[tabId] = {}; }
        this.#tabState[tabId].muted = isMuted;
        console.log(tabId + ': muted -> ' + isMuted);
    }

    async addOrRemoveCurrentPageInList() {
        const tab = await this.#getCurrentTab();
        if (!tab) return;
        const isInList = await this.#listExpert.addOrRemoveUrlInList(tab.url);
        await this.#updateListedTab(tab.id, isInList)
    }

    async addOrRemoveCurrentDomainInList() {
        const tab = await this.#getCurrentTab();
        if (!tab) return;
        const isInList = await this.#listExpert.addOrRemoveDomainInList(tab.url);
        await this.#updateListedTab(tab.id, isInList)
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

    /**
     * @param {number} tabId 
     * @param {boolean} muted 
     * @param {boolean} force 
     */
    async #setMuteOnTab(tabId, muted, force) {
        const shouldMute = !!force || await this.#extensionOptions.getEnabled();
        if (shouldMute) {
            this.#chrome.tabs.update(tabId, { muted: muted });
        }
        if (!this.#tabState[tabId]) { this.#tabState[tabId] = {}; }
        this.#tabState[tabId].muted = muted;
        console.log(`${tabId}: muted -> ${muted}`);
    }

    /**
     * @param {ListInfo} listInfo 
     * @param {Object} tab 
     */
    async #muteIfShouldNoListUpdate(listInfo, tab) {
        const shouldMute = await this.#shouldMute(listInfo, tab.url)
        await this.#setMuteOnTab(tab.id, shouldMute);
    }

    /**
     * @param {ListInfo} listInfo 
     * @param {Object} tab 
     */
    async #updateTabIfListed(listInfo, tab) {
        const isInList = await this.#listExpert.isInList(listInfo.listOfPages, tab.url);
        await this.#updateListedTab(tab.id, isInList);
    }

    /**
     * @param {number} tabId 
     * @param {boolean} isInList 
     */
    async #updateListedTab(tabId, isInList) {
        const usingShouldNotMuteList = await this.#extensionOptions.getUsingShouldNotMuteList();
        if (!this.#tabState[tabId]) { this.#tabState[tabId] = { muted: !usingShouldNotMuteList }; }
        if (this.#tabState[tabId].isInList === isInList) return;
        this.#tabState[tabId].isInList = isInList;
        console.log(`${tabId}: isInList -> ${isInList}`);
        /*
        if (isInList) {
            this.#tabState[tabId].changeWhenLeavingListed = this.#tabState[tabId].muted !== usingShouldNotMuteList;
            await this.#setMuteOnTab(tabId, usingShouldNotMuteList);
        } else {
            if (this.#tabState[tabId].changeWhenLeavingListed) {
                await this.#setMuteOnTab(tabId, !usingShouldNotMuteList);
                this.#tabState[tabId].changeWhenLeavingListed = false;
            }
        }
        */
        console.log(`${tabId}: ${JSON.stringify(this.#tabState[tabId])}`);
    }

    /**
     * @param {number} tabId
     * @returns {Promise<Object>}
     */
    async #getTabById(tabId) {
        return await new Promise(resolve => {
            this.#chrome.tabs.get(tabId, tab => {
                resolve(tab);
            });
        })
            .catch(err => { throw err; });
    }

    /**
     * @returns {Promise<Object>}
     */
    async #getCurrentTab() {
        return await new Promise(resolve => {
            this.#chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
                resolve(tabs?.length ? tabs[0] : null);
            });
        })
            .catch(err => { throw err; });
    }

    /**
     * @returns {Promise<List<Object>>}
     */
    async #getAllTabs() {
        return await new Promise(resolve => {
            this.#chrome.tabs.query({}, (tabs) => {
                resolve(tabs);
            });
        })
            .catch(err => { throw err; });
    }

    /**
     * @param {ListInfo} listInfo 
     * @param {string} url 
     * @returns {Promise<boolean>}
     */
    async #shouldMute(listInfo, url) {
        const inList = await this.#listExpert.isInList(listInfo.listOfPages, url);
        return (listInfo.isListOfPagesToMute && inList)
            || (!listInfo.isListOfPagesToMute && !inList);
    }

    /**
     * @param {number} tabId
     */
    async #muteIfShouldById(tabId) {
        const tab = await this.#getTabById(tabId);
        if (tab) {
            await this.muteIfShould(tab);
        } else {
            console.log(this.#chrome.runtime.lastError.message);
        }
    }
}
