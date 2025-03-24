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
  async getUsingAllowAudioList() {
    return (await this.#chrome.storage.sync.get({ usingAllowList: true }))
      .usingAllowList;
  }

  /**
   * @returns {Promise<string[]>}
   */
  async getAllowOrBlockAudioList() {
    return this.#stringToListOfStrings(
      (await this.#chrome.storage.sync.get({ allowOrBlockList: "" }))
        .allowOrBlockList
    );
  }

  /**
   * @param {string[]} list
   * @returns {Promise<void>}
   */
  async setAllowOrBlockAudioList(list) {
    await this.#chrome.storage.sync.set({
      allowOrBlockList: this.#listOfStringsToString(list),
    });
  }

  /**
   * @returns {Promise<void>}
   */
  async switchListType() {
    const usingAllowAudioList = await this.getUsingAllowAudioList();
    await this.#chrome.storage.sync.set({
      usingAllowList: !usingAllowAudioList,
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
