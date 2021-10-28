'use strict';

class ListExpert {
    /** @member {ExtensionOptions} */
    #extensionOptions;
    /** @member {UrlMatcher} */
    #urlMatcher;

    /**
     * @param {Object} chromeInstance
     * @param {ExtensionOptions} chromeInstance
     * @param {UrlMatcher} urlMatcher
     */
    constructor(chromeInstance, extensionOptions, urlMatcher) {
        this.#chrome = chromeInstance;
        this.#extensionOptions = extensionOptions;
        this.#urlMatcher = urlMatcher;
    }

    /**
     * @param {string[]} list 
     * @param {string} url 
     * @returns {Promise<boolean>} 
     */
    isInList(list, url) {
        return new Promise(resolve => {
            this.#extensionOptions.getUseRegex(useRegex => {
                const matches = list.filter(
                    entry => this.#urlMatcher.urlPatternMatch(entry, useRegex, url)
                );
                resolve(matches.length > 0);
            });
        });
    }

    /**
     * @param {string} url 
     * @returns {Promise<boolean>} 
     */
    isExactMatchInList(url) {
        return new Promise(resolve => {
            this.#extensionOptions.getListInfo(listInfo => {
                resolve(this.#urlMatcher.isExactUrlInList(listInfo.listOfPages, url));
            });
        });
    }

    /**
     * @param {string} url 
     * @returns {Promise<boolean>} 
     */
    isDomainInList(url) {
        return new Promise(resolve => {
            this.#extensionOptions.getListInfo(listInfo => {
                resolve(this.#urlMatcher.isDomainList(listInfo.listOfPages, url));
            });
        });
    }

    /**
     * @callback returnListInfo
     * @param {ListInfo} listInfo
     */
    /**
     * @param {returnListInfo} andCall 
     */
    getListInfo(andCall) {
        this.#extensionOptions.getUsingWhitelist(usingWhitelist => {
            if (usingWhitelist) {
                this.#extensionOptions.getWhitelist(whitelist => {
                    andCall(new ListInfo(false, whitelist));
                });
            } else {
                this.#extensionOptions.getBlacklist(blacklist => {
                    andCall(new ListInfo(true, blacklist));
                });
            }
        });
    }

    /**
     * @callback returnIsInList
     * @param {boolean} isInList
     */
    /**
     * @param {string} url
     * @param {returnIsInList} andCall 
     */
    addOrRemoveUrlInList(url, andCall) {
        this.getListInfo(listInfo => {
            const isInList = this.#urlMatcher.isExactUrlInList(listInfo.listOfPages, url);
            this.#addOrRemoveEntryInList(listInfo, url, isInList);
            andCall(!isInList);
        });
    }

    /**
     * @param {string} url
     * @param {returnIsInList} andCall 
     */
    addOrRemoveDomainInList(url, andCall) {
        this.#extensionOptions.getUseRegex(useRegex => {
            this.getListInfo(listInfo => {
                const domainPattern = this.#urlMatcher.domainPattern(url, useRegex);
                const isInList = this.#urlMatcher.isDomainInList(listInfo.listOfPages, url);
                this.#addOrRemoveEntryInList(listInfo, domainPattern, isInList);
                andCall(!isInList);
            });
        });
    }

    /**
     * @param {ListInfo} listInfo 
     * @param {string} entry 
     * @param {boolean} isInList 
     */
    #addOrRemoveEntryInList(listInfo, entry, isInList) {
        if (isInList) {
            const newListInfo = new ListInfo(
                listInfo.isListOfPagesToMute,
                listInfo.listOfPages.filter(_ => !this.#urlMatcher.urlsMatch(_, entry))
            );
            this.#extensionOptions.setList(newListInfo);
        } else {
            const list = listInfo.listOfPages;
            list.push(domainPattern);
            const newListInfo = new ListInfo(listInfo.isListOfPagesToMute, list);
            this.#extensionOptions.setList(newListInfo);
        }
    }
}
