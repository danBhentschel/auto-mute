class IconSwitcher {
  /** @member {Object} */
  #chrome;
  /** @member {TabTracker} */
  #tabTracker;
  /** @member {Object} */
  #logger;
  /** @member {'dark' | 'light'} */
  #systemColorScheme;

  /**
   * @param {Object} chromeInstance
   * @param {TabTracker} tabTracker
   * @param {Object} logger
   */
  constructor(chromeInstance, tabTracker, logger) {
    this.#chrome = chromeInstance;
    this.#tabTracker = tabTracker;
    this.#logger = logger;
    this.#systemColorScheme = "light";
  }

  /**
   * @returns {Promise<void>}
   */
  async start() {
    if (!(await this.#chrome.offscreen.hasDocument())) {
      this.#logger.log("Creating offscreen document");
      await this.#chrome.offscreen.createDocument({
        url: "offscreen.html",
        reasons: ["MATCH_MEDIA"],
        justification: "Detect system color scheme",
      });
    }
  }

  /**
   * @param {'dark' | 'light'} scheme
   * @returns {Promise<void>}
   */
  async setSystemColorScheme(scheme) {
    this.#logger.log(`System color scheme changed to ${scheme}`);
    this.#systemColorScheme = scheme;
    await this.#updateIcon();
  }

  /**
   * @returns {Promise<void>}
   */
  async updateIcon() {
    await this.start();
    await this.#updateIcon();
  }

  /**
   * @returns {Promise<void>}
   */
  async #updateIcon() {
    const onOrOff = (await this.#tabTracker.isCurrentTabMutedByExtension())
      ? "off"
      : "on";

    const path = `images/${this.#systemColorScheme}_${onOrOff}_16.png`;
    this.#logger.log(`Setting icon to ${path}`);
    await this.#chrome.action.setIcon({
      path,
    });
  }
}

export default IconSwitcher;
