class ExtensionOptions {
  #chrome;
  /** @member {Object} */
  #logger;

  /**
   * @param {Object} chromeInstance
   */
  constructor(chromeInstance, logger) {
    this.#chrome = chromeInstance;
    this.#logger = logger;
  }

  /**
   * @returns {Promise<boolean>}
   */
  async getEnabled() {
    const { enabled } = await this.#chrome.storage.sync.get({ enabled: true });
    if (typeof enabled !== "boolean") {
      this.#logger.error(`Invalid enabled: ${enabled}`);
      return true;
    }

    return enabled;
  }

  /**
   * @returns {Promise<boolean>}
   */
  async getUsingAllowAudioList() {
    const { usingAllowList } = await this.#chrome.storage.sync.get({
      usingAllowList: true,
    });
    if (typeof usingAllowList !== "boolean") {
      this.#logger.error(`Invalid usingAllowList: ${usingAllowList}`);
      return true;
    }

    return usingAllowList;
  }

  /**
   * @returns {Promise<string[]>}
   */
  async getAllowOrBlockAudioList() {
    const { allowOrBlockList } = await this.#chrome.storage.sync.get({
      allowOrBlockList: "",
    });
    if (typeof allowOrBlockList !== "string") {
      this.#logger.error(`Invalid allowOrBlockList: ${allowOrBlockList}`);
      return [];
    }

    return this.#stringToListOfStrings(allowOrBlockList);
  }

  /**
   * @returns {Promise<string>}
   */
  async getIconType() {
    const { iconType } = await this.#chrome.storage.sync.get({
      iconType: "static",
    });
    if (typeof iconType !== "string") {
      this.#logger.error(`Invalid iconType: ${iconType}`);
      return "static";
    }

    return iconType;
  }

  /**
   * @returns {Promise<string>}
   */
  async getIconColor() {
    const { iconColor } = await this.#chrome.storage.sync.get({
      iconColor: "system",
    });
    if (typeof iconColor !== "string") {
      this.#logger.error(`Invalid iconColor: ${iconColor}`);
      return "system";
    }

    return iconColor;
  }

  /**
   * @param {string[]} list
   * @returns {Promise<void>}
   */
  async setAllowOrBlockAudioList(list) {
    if (!Array.isArray(list)) {
      this.#logger.error(`Invalid list: ${list}`);
      return;
    }

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

  /**
   * @returns {Promise<Object>}
   */
  async getDebugInfo() {
    return await this.#chrome.storage.sync.get(null);
  }
}

export default ExtensionOptions;
