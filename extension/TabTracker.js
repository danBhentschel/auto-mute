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
     * @param {number} tabId 
     * @param {boolean} muted 
     * @param {boolean} force 
     */
    setMuteOnTab(tabId, muted, force) {
        this.#extensionOptions.getEnabled(enabled => {
            if (enabled || !!force) {
                this.#chrome.tabs.update(tabId, { muted: muted });
            }
            if (!this.#tabState[tabId]) { this.#tabState[tabId] = {}; }
            this.#tabState[tabId].muted = muted;
            console.log(`${tabId}: muted -> ${muted}`);
        });
    }

    /**
     * @param {Object} tab 
     */
    muteIfShould(tab) {
        this.#listExpert.getListInfo(listInfo => {
            this.#muteIfShouldNoListUpdate(listInfo, tab);
            this.#updateTabIfListed(listInfo, tab);
        });
    }

    /**
     * @param {boolean} force - Specifies whether to ignore lists
     * @param {number} [excludeId] - Used when muting all but current tab
     */
    muteAllTabs(force, excludeId) {
        this.#listExpert.getListInfo(listInfo => {
            this.#chrome.tabs.query({}, (tabs) => {
                if (!tabs) { return; }
                tabs.forEach((tab) => {
                    if (tab.id === excludeId) return;
                    if (force) {
                        this.setMuteOnTab(tab.id, true, true);
                    } else {
                        this.#muteIfShouldNoListUpdate(listInfo, tab);
                    }
                    this.#updateTabIfListed(listInfo, tab);
                });
            });
        });
    }

    toggleMuteCurrentTab() {
        this.#getCurrentTab(tab => {
            if (!!tab) {
                this.setMuteOnTab(tab.id, !tab.mutedInfo.muted, true);
            }
        });
    }

    muteOtherTabs() {
        this.#getCurrentTab(tab => {
            if (!!tab) {
                this.muteAllTabs(true, tab.id);
            } else {
                console.warn('Could not determine current tab');
                this.muteAllTabs(true);
            }
        });
    }

    applyMute() {
        this.#extensionOptions.getEnabled(enabled => {
            if (!enabled) return;
            this.#listExpert.getListInfo(listInfo => {
                this.#chrome.tabs.query({}, (tabs) => {
                    if (!tabs) { return; }
                    tabs.forEach((tab) => {
                        this.#muteIfShouldNoListUpdate(listInfo, tab);
                        this.#updateTabIfListed(listInfo, tab);
                    });
                });
            });
        });
    }

    /**
     * @param {number} addedTabId 
     * @param {number} removedTabId 
     */
    onTabReplaced(addedTabId, removedTabId) {
        if (this.#tabState[removedTabId]) {
            console.log(`${removedTabId}: ${JSON.stringify(this.#tabState[removedTabId])}`);
            this.#tabState[addedTabId] = this.#tabState[removedTabId];
            delete this.#tabState[removedTabId];
        }

        this.#chrome.tabs.get(addedTabId, tab => {
            if (tab) {
                this.#listExpert.getListInfo(listInfo => {
                    this.#listExpert.isInList(listInfo.listOfPages, tab.url)
                        .then(inList => {
                            this.#updateListedTab(addedTabId, inList);
                            if (!tab.mutedInfo || tab.mutedInfo.muted != tabState[tab.id].muted) {
                                this.setMuteOnTab(tab.id, tabState[tab.id].muted);
                            }
                        });
                });
            } else {
                console.log(chrome.runtime.lastError.message);
            }
        });
    }

    /**
     * @param {number} tabId 
     * @param {boolean} isMuted 
     */
    updateTabMutedState(tabId, isMuted) {
        if (!this.#tabState[tabId]) { this.#tabState[tabId] = {}; }
        this.#tabState[tabId].muted = isMuted;
        console.log(tabId + ': muted -> ' + isMuted);
    }

    /**
     * 
     * @param {number} tabId 
     * @param {string} url 
     */
    onTabUrlChanged(tabId, url) {
        this.#listExpert.getListInfo(listInfo => {
            this.#listExpert.isInList(listInfo.list, url)
                .then(inList => this.#updateListedTab(tabId, inList));
        });
    }

    addOrRemoveCurrentPageInList() {
        this.#getCurrentTab(tab => {
            if (!tab) return;
            this.#listExpert.addOrRemoveUrlInList(
                tab.url,
                isInList => this.#updateListedTab(tab.id, isInList)
            );
        });
    }

    addOrRemoveCurrentDomainInList() {
        this.#getCurrentTab(tab => {
            if (!tab) return;
            this.#listExpert.addOrRemoveDomainInList(
                tab.url,
                isInList => this.#updateListedTab(tab.id, isInList)
            );
        });
    }

    /**
     * @callback returnIsMuted
     * @param {boolean} isMuted
     */
    /**
     * @param {returnIsMuted} andCall
     */
    isCurrentTabMuted(andCall) {
        this.#getCurrentTab(tab => {
            andCall(!!tab ? tab.mutedInfo.muted : false);
        });
    }

    /**
     * @param {returnIsInList} andCall
     */
    isDomainOfCurrentTabInList(andCall) {
        this.#getCurrentTab(tab => {
            this.#listExpert.isDomainInList(tab.url)
                .then(isInList => andCall(isInList));
        });
    }

    /**
     * @callback returnIsInList
     * @param {boolean} isInList
     */
    /**
     * @param {returnIsInList} andCall
     */
    isCurrentTabInList(andCall) {
        this.#getCurrentTab(tab => {
            this.#listExpert.isExactMatchInList(tab.url)
                .then(isInList => andCall(isInList));
        });
    }

    /**
     * @param {ListInfo} listInfo 
     * @param {Object} tab 
     */
    #muteIfShouldNoListUpdate(listInfo, tab) {
        this.#shouldMute(listInfo, tab.url)
            .then(shouldMute => this.setMuteOnTab(tab.id, shouldMute));
    }

    /**
     * @param {ListInfo} listInfo 
     * @param {Object} tab 
     */
    #updateTabIfListed(listInfo, tab) {
        this.#listExpert.isInList(listInfo.listOfPages, tab.url)
            .then(isInList => this.#updateListedTab(tab.id, isInList));
    }

    /**
     * @param {number} tabId 
     * @param {boolean} isInList 
     */
    #updateListedTab(tabId, isInList) {
        this.#extensionOptions.getUsingWhitelist(usingWhitelist => {
            if (!this.#tabState[tabId]) { this.#tabState[tabId] = { muted: usingWhitelist }; }
            if (this.#tabState[tabId].isInList === isInList) return;
            this.#tabState[tabId].isInList = isInList;
            console.log(`${tabId}: isInList -> ${isInList}`);
            if (isInList) {
                this.#tabState[tabId].changeWhenLeavingListed = this.#tabState[tabId].muted == usingWhitelist;
                this.setMuteOnTab(tabId, !usingWhitelist);
            } else {
                if (this.#tabState[tabId].changeWhenLeavingListed) {
                    this.setMuteOnTab(tabId, usingWhitelist);
                    this.#tabState[tabId].changeWhenLeavingListed = false;
                }
            }
            console.log(`${tabId}: ${JSON.stringify(this.#tabState[tabId])}`);
        });
    }

    /**
     * @callback returnTab
     * @param {Object} tab
     */
    /**
     * @param {returnTab} andCall 
     */
    #getCurrentTab(andCall) {
        this.#chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
            if (tabs.length) andCall(tabs[0]);
            else andCall(null);
        });
    }

    /**
     * @param {ListInfo} listInfo 
     * @param {string} url 
     * @returns {Promise<boolean>}
     */
    async #shouldMute(listInfo, url) {
        const inList = await this.#listExpert.isInList(listInfo.list, url);
        return (listInfo.isListOfPagesToMute && inList)
            || (!listInfo.isListOfPagesToMute && !inList);
    }

}
