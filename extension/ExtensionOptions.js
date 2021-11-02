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
     * @returns {Promise}
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
     * @returns {Promise}
     */
    async setShouldMuteList(list) {
        return await new Promise(resolve => {
            this.#chrome.storage.sync.set(
                {
                    blacklist: this.#listOfStringsToString(list)
                },
                () => {
                    resolve();
                }
            );
        })
            .catch(err => { throw err; });
    }

    /**
     * @param {ListInfo} listInfo 
     * @returns {Promise}
     */
    async setList(listInfo) {
        if (listInfo.isListOfPagesToMute) {
            await this.setShouldMuteList(listInfo.listOfPages);
        } else {
            await this.setShouldNotMuteList(listInfo.listOfPages);
        }
    }

    switchListType() {
        this.getUsingShouldNotMuteList(usingShouldNotMuteList => {
            this.#chrome.storage.sync.set({ usingWhitelist: usingShouldNotMuteList });
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
