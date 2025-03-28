class IconSwitcher {
  /** @member {Object} */
  #chrome;
  /** @member {TabTracker} */
  #tabTracker;
  /** @member {Object} */
  #logger;
  /** @member {'dark' | 'light' | 'unset'} */
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
    this.#systemColorScheme = "unset";
    this.#getSystemColorScheme();
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
    await this.#setSystemColorScheme(scheme);
    await this.updateIcon();
    return scheme;
  }

  /**
   * @param {'dark' | 'light'} scheme
   * @returns {Promise<void>}
   */
  async #setSystemColorScheme(scheme) {
    // We need to set the system color scheme in the storage to persist it
    // because the service worker is not always running, so in-memory state
    // will sometimes be lost.
    await this.#chrome.storage.local.set({
      systemColorScheme: scheme,
    });
    this.#systemColorScheme = scheme;
  }

  /**
   * @returns {Promise<'dark' | 'light' | 'unset'>}
   */
  async #getSystemColorScheme() {
    // If the system color scheme is unset, we need to fetch it from storage
    // because the service worker is not always running, so in-memory state
    // will sometimes be lost.
    if (this.#systemColorScheme === "unset") {
      this.#logger.log("Fetching system color scheme from storage");
      this.#systemColorScheme = (
        await this.#chrome.storage.local.get({
          systemColorScheme: "unset",
        })
      ).systemColorScheme;
      this.#logger.log(
        `System color scheme fetched from storage: ${this.#systemColorScheme}`
      );
    }
    return this.#systemColorScheme || "unset";
  }

  /**
   * @returns {Promise<void>}
   */
  async updateIcon() {
    let systemColorScheme = await this.#getSystemColorScheme();

    if (systemColorScheme === "unset") {
      this.#logger.log(
        "System color scheme is unset. Assuming light mode for icon."
      );
      systemColorScheme = "light";
    }

    const onOrOff = (await this.#tabTracker.isCurrentTabMutedByExtension())
      ? "off"
      : "on";

    const path = `images/${systemColorScheme}_${onOrOff}_16.png`;
    this.#logger.log(`Setting icon to ${path}`);
    await this.#chrome.action.setIcon({
      path,
    });
  }
}

export default IconSwitcher;
