'use strict';

class ListExpert {
    /** @member {ExtensionOptions} */
    #extensionOptions;
    /** @member {UrlMatcher} */
    #urlMatcher;

    /**
     * @param {ExtensionOptions} extensionOptions
     * @param {UrlMatcher} urlMatcher
     */
    constructor(extensionOptions, urlMatcher) {
        this.#extensionOptions = extensionOptions;
        this.#urlMatcher = urlMatcher;
    }

    /**
     * @param {string[]} list 
     * @param {string} url 
     * @returns {Promise<boolean>} 
     */
    async isInList(list, url) {
        const useRegex = await this.#extensionOptions.getUseRegex();
        const matches = list.filter(
            entry => this.#urlMatcher.urlPatternMatch(entry, useRegex, url)
        );
        return matches.length > 0;
    }

    /**
     * @param {string} url 
     * @returns {Promise<boolean>} 
     */
    async isExactMatchInList(url) {
        return await new Promise(resolve => {
            this.#extensionOptions.getListInfo(listInfo => {
                resolve(this.#urlMatcher.isExactUrlInList(listInfo.listOfPages, url));
            });
        });
    }

    /**
     * @param {string} url 
     * @returns {Promise<boolean>} 
     */
    async isDomainInList(url) {
        return await new Promise(resolve => {
            this.#extensionOptions.getListInfo(listInfo => {
                resolve(this.#urlMatcher.isDomainList(listInfo.listOfPages, url));
            });
        });
    }

    /**
     * @returns {Promise<ListInfo>}
     */
    async getListInfo() {
        const usingShouldNotMuteList = await this.#extensionOptions.getUsingShouldNotMuteList();
        return await new Promise(resolve => {
            if (usingShouldNotMuteList) {
                this.#extensionOptions.getShouldNotMuteList(list => {
                    resolve(new ListInfo(false, list));
                });
            } else {
                this.#extensionOptions.getShouldMuteList(list => {
                    resolve(new ListInfo(true, list));
                });
            }
        })
            .catch(err => { throw err });
    }

    /**
     * @param {string} url
     * @returns {Promise<boolean>}
     */
    async addOrRemoveUrlInList(url) {
        const listInfo = await this.getListInfo();
        const isInList = this.#urlMatcher.isExactUrlInList(listInfo.listOfPages, url);
        await this.#addOrRemoveEntryInList(listInfo, url, isInList);
        return isInList;
    }

    /**
     * @param {string} url
     * @returns {Promise<boolean>}
     */
    async addOrRemoveDomainInList(url) {
        const useRegex = await this.#extensionOptions.getUseRegex();
        const listInfo = await this.getListInfo();
        const domainPattern = this.#urlMatcher.domainPattern(url, useRegex);
        const isInList = this.#urlMatcher.isDomainInList(listInfo.listOfPages, url);
        await this.#addOrRemoveEntryInList(listInfo, domainPattern, isInList);
        return listInfo;
    }

    /**
     * @param {ListInfo} listInfo 
     * @param {string} entry 
     * @param {boolean} isInList 
     */
    async #addOrRemoveEntryInList(listInfo, entry, isInList) {
        if (isInList) {
            const newListInfo = new ListInfo(
                listInfo.isListOfPagesToMute,
                listInfo.listOfPages.filter(_ => !this.#urlMatcher.urlsMatch(_, entry))
            );
            await this.#extensionOptions.setList(newListInfo);
        } else {
            const list = listInfo.listOfPages;
            list.push(domainPattern);
            const newListInfo = new ListInfo(listInfo.isListOfPagesToMute, list);
            await this.#extensionOptions.setList(newListInfo);
        }
    }
}
