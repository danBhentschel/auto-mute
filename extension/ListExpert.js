import ListInfo from "./ListInfo.js";

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
    const matches = list.filter((entry) =>
      this.#urlMatcher.urlPatternMatch(entry, useRegex, url)
    );
    return matches.length > 0;
  }

  /**
   * @param {string} url
   * @returns {Promise<boolean>}
   */
  async isExactMatchInList(url) {
    const listInfo = await this.getListInfo();
    return this.#urlMatcher.isExactUrlInList(listInfo.listOfPages, url);
  }

  /**
   * @param {string} url
   * @returns {Promise<boolean>}
   */
  async isDomainInList(url) {
    const listInfo = await this.getListInfo();
    return this.#urlMatcher.isDomainInList(listInfo.listOfPages, url);
  }

  /**
   * @returns {Promise<ListInfo>}
   */
  async getListInfo() {
    const usingShouldNotMuteList =
      await this.#extensionOptions.getUsingShouldNotMuteList();
    const list = usingShouldNotMuteList
      ? await this.#extensionOptions.getShouldNotMuteList()
      : await this.#extensionOptions.getShouldMuteList();
    return new ListInfo(!usingShouldNotMuteList, list);
  }

  /**
   * @param {string} url
   * @returns {Promise<boolean>}
   */
  async addOrRemoveUrlInList(url) {
    const listInfo = await this.getListInfo();
    const isInList = this.#urlMatcher.isExactUrlInList(
      listInfo.listOfPages,
      url
    );
    await this.#addOrRemoveEntryInList(listInfo, url, isInList);
    return !isInList;
  }

  /**
   * @param {string} url
   * @returns {Promise<boolean>}
   */
  async addOrRemoveDomainInList(url) {
    const useRegex = await this.#extensionOptions.getUseRegex();
    const listInfo = await this.getListInfo();
    const domainPattern = this.#urlMatcher.domainPattern(url, useRegex);
    const isInList = this.#urlMatcher.isDomainInList(
      listInfo.listOfPages,
      domainPattern
    );
    await this.#addOrRemoveEntryInList(listInfo, domainPattern, isInList);
    return !isInList;
  }

  /**
   * @param {ListInfo} listInfo
   * @param {string} entry
   * @param {boolean} isInList
   * @returns {Promise<ListInfo>}
   */
  async #addOrRemoveEntryInList(listInfo, entry, isInList) {
    if (isInList) {
      const newListInfo = new ListInfo(
        listInfo.isListOfPagesToMute,
        listInfo.listOfPages.filter(
          (_) => !this.#urlMatcher.urlsMatch(_, entry)
        )
      );
      await this.#setList(newListInfo);
      return newListInfo;
    } else {
      const list = listInfo.listOfPages;
      list.push(entry);
      const newListInfo = new ListInfo(listInfo.isListOfPagesToMute, list);
      await this.#setList(newListInfo);
      return newListInfo;
    }
  }

  /**
   * @param {ListInfo} listInfo
   * @returns {Promise<void>}
   */
  async #setList(listInfo) {
    if (listInfo.isListOfPagesToMute) {
      await this.#extensionOptions.setShouldMuteList(listInfo.listOfPages);
    } else {
      await this.#extensionOptions.setShouldNotMuteList(listInfo.listOfPages);
    }
  }
}

export default ListExpert;
