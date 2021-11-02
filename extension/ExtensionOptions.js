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
     * @returns {Promise<boolean>}
     */
    async getEnabled() {
        return await new Promise(resolve => {
            this.#chrome.storage.sync.get({ enabled: true }, items => {
                resolve(items.enabled);
            });
        })
            .catch(err => { throw err; });
    }

    /**
     * @returns {Promise<boolean>}
     */
    async getUseRegex() {
        return await new Promise(resolve => {
            this.#chrome.storage.sync.get({ useRegex: false }, items => {
                resolve(items.useRegex);
            });
        })
            .catch(err => { throw err; });
    }

    /**
     * @returns {Promise<boolean>}
     */
    async getUsingShouldNotMuteList() {
        return await new Promise(resolve => {
            this.#chrome.storage.sync.get({ usingWhitelist: true }, items => {
                resolve(items.usingWhitelist);
            });
        })
            .catch(err => { throw err; });
    }

    /**
     * @returns {Promise<string[]>}
     */
    async getShouldNotMuteList() {
        return await new Promise(resolve => {
            this.#chrome.storage.sync.get({ whitelist: '' }, items => {
                resolve(this.#stringToListOfStrings(items.whitelist));
            });
        })
            .catch(err => { throw err; });
    }

    /**
     * @param {string[]} list 
     */
    async setShouldNotMuteList(list) {
        return await new Promise(resolve => {
            this.#chrome.storage.sync.set(
                {
                    whitelist: this.#listOfStringsToString(list)
                },
                () => {
                    resolve();
                }
            );
        })
            .catch(err => { throw err; });
    }

    /**
     * @returns {Promise<string[]>}
     */
    async getShouldMuteList() {
        return await new Promise(resolve => {
            this.#chrome.storage.sync.get({ blacklist: '' }, items => {
                resolve(this.#stringToListOfStrings(items.blacklist));
            });
        })
            .catch(err => { throw err; });
    }

    /**
     * @param {string[]} list 
     */
    async setShouldMuteList(list) {
        return await new Promise(resolve => {
            this.#chrome.storage.sync.set(
                {
                    blacklist: this.#listOfStringsToString(list)
                },
                () => { resolve(); }
            );
        })
            .catch(err => { throw err; });
    }

    async switchListType() {
        const usingShouldNotMuteList = await this.getUsingShouldNotMuteList();
        return await new Promise(resolve => {
            this.#chrome.storage.sync.set(
                {
                    usingWhitelist: !usingShouldNotMuteList
                },
                () => { resolve(); }
            );
        })
            .catch(err => { throw err; });
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
