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
    return (await this.#chrome.storage.sync.get({ enabled: true })).enabled;
  }

  /**
   * @returns {Promise<boolean>}
   */
  async getUseRegex() {
    return (await this.#chrome.storage.sync.get({ useRegex: false })).useRegex;
  }

  /**
   * @returns {Promise<boolean>}
   */
  async getUsingShouldNotMuteList() {
    return (await this.#chrome.storage.sync.get({ usingWhitelist: true }))
      .usingWhitelist;
  }

  /**
   * @returns {Promise<string[]>}
   */
  async getShouldNotMuteList() {
    return this.#stringToListOfStrings(
      (await this.#chrome.storage.sync.get({ whitelist: "" })).whitelist
    );
  }

  /**
   * @param {string[]} list
   * @returns {Promise<void>}
   */
  async setShouldNotMuteList(list) {
    await this.#chrome.storage.sync.set({
      whitelist: this.#listOfStringsToString(list),
    });
  }

  /**
   * @returns {Promise<string[]>}
   */
  async getShouldMuteList() {
    return this.#stringToListOfStrings(
      (await this.#chrome.storage.sync.get({ blacklist: "" })).blacklist
    );
  }

  /**
   * @param {string[]} list
   * @returns {Promise<void>}
   */
  async setShouldMuteList(list) {
    await this.#chrome.storage.sync.set({
      blacklist: this.#listOfStringsToString(list),
    });
  }

  /**
   * @returns {Promise<void>}
   */
  async switchListType() {
    const usingShouldNotMuteList = await this.getUsingShouldNotMuteList();
    await this.#chrome.storage.sync.set({
      usingWhitelist: !usingShouldNotMuteList,
    });
  }

  /**
   * @param {string} list
   * @returns {string[]}
   */
  #stringToListOfStrings(list) {
    return this.#cleanList(list.split("\n"));
  }

  /**
   * @param {string[]} list
   * @returns {string[]}
   */
  #cleanList(list) {
    return list.map((_) => _.trim()).filter((_) => !!_);
  }

  /**
   * @param {string[]}
   * @returns {string}
   */
  #listOfStringsToString(list) {
    return this.#cleanList(list).join("\n");
  }
}

export default ExtensionOptions;
