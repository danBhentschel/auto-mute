'use strict';

class ExtensionOptions {
    #chrome;

    /**
     * @param {Object} chromeInstance
     */
    constructor(chromeInstance) {
        this.#chrome = chromeInstance;
    }

    /**
     * @callback returnEnabledValue
     * @param {boolean} enabled
     */
    /**
     * @param {returnEnabledValue} andCall 
     */
    getEnabled(andCall) {
        this.#chrome.storage.sync.get({ enabled: true }, items => {
            andCall(items.enabled);
        });
    }

    /**
     * @callback returnUseRegexValue
     * @param {boolean} useRegex
     */
    /**
     * @param {returnUseRegexValue} andCall 
     */
    getUseRegex(andCall) {
        this.#chrome.storage.sync.get({ useRegex: false }, items => {
            andCall(items.useRegex);
        });
    }

    /**
     * @callback returnUsingWhitelistValue
     * @param {boolean} usingWhitelist
     */
    /**
     * @param {returnUsingWhitelistValue} andCall 
     */
    getUsingWhitelist(andCall) {
        this.#chrome.storage.sync.get({ usingWhitelist: true }, items => {
            andCall(items.usingWhitelist);
        });
    }

    /**
     * @callback returnListValue
     * @param {string[]} list
     */
    /**
     * @param {returnListValue} andCall 
     */
    getWhitelist(andCall) {
        this.#chrome.storage.sync.get({ whitelist: '' }, items => {
            andCall(this.#stringToListOfStrings(items.whitelist));
        });
    }

    /**
     * @param {string[]} whitelist 
     */
    setWhitelist(whitelist) {
        this.#chrome.storage.sync.set({
            whitelist: this.#listOfStringsToString(whitelist)
        });
    }

    /**
     * @param {returnListValue} andCall 
     */
    getBlacklist(andCall) {
        this.#chrome.storage.sync.get({ blacklist: '' }, items => {
            andCall(this.#stringToListOfStrings(items.blacklist));
        });
    }

    /**
     * @param {string[]} blacklist 
     */
    setBlacklist(blacklist) {
        chrome.storage.sync.set({
            blacklist: this.#listOfStringsToString(blacklist)
        });
    }

    /**
     * @param {ListInfo} listInfo 
     */
    setList(listInfo) {
        if (listInfo.isListOfPagesToMute) {
            this.setBlacklist(listInfo.listOfPages);
        } else {
            this.setWhitelist(listInfo.listOfPages);
        }
    }

    switchListType() {
        this.getUsingWhitelist(usingWhitelist => {
            this.#chrome.storage.sync.set({ usingWhitelist: !usingWhitelist });
        });
    }

    /**
     * @param {string} list
     * @returns {string[]}
     */
    #stringToListOfStrings(list) {
        return this.#cleanList(list.split('\n'));
    }

    /**
     * @param {string[]} list
     * @returns {string[]} 
     */
    #cleanList(list) {
        return list.map(_ => _.trim()).filter(_ => !!_);
    }

    /**
     * @param {string[]}
     * @returns {string}
     */
    #listOfStringsToString(list) {
        return list.filter(_ => !!_).join('\n');
    }

}
