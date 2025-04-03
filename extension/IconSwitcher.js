class IconSwitcher {
  /** @member {Object} */
  #chrome;
  /** @member {TabTracker} */
  #tabTracker;
  /** @member {Object} */
  #logger;
  /** @member {ExtensionOptions} */
  #options;
  /** @member {'dark' | 'light' | 'unset'} */
  #systemColorScheme;

  /**
   * @param {Object} chromeInstance
   * @param {TabTracker} tabTracker
   * @param {ExtensionOptions} options
   * @param {Object} logger
   */
  constructor(chromeInstance, tabTracker, options, logger) {
    this.#chrome = chromeInstance;
    this.#tabTracker = tabTracker;
    this.#options = options;
    this.#logger = logger;
    this.#systemColorScheme = "unset";
  }

  /**
   * @returns {Promise<void>}
   */
  async start() {
    await this.#getSystemColorScheme();
    if (!(await this.#chrome.offscreen.hasDocument())) {
      this.#logger.log("Creating offscreen document");
      await this.#chrome.offscreen.createDocument({
        url: "offscreen.html",
        reasons: ["MATCH_MEDIA"],
        justification: "Detect system color scheme",
      });
      this.#logger.log("Offscreen document created");
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
    const iconType = await this.#options.getIconType();
    const iconColor = await this.#options.getIconColor();
    const isMuted = await this.#tabTracker.isCurrentTabMutedByExtension();
    const onOrOff = isMuted ? "off" : "on";

    let path;

    if (iconType === "static") {
      // Use static Speaker_19.png icon
      path = "images/Speaker_19.png";
    } else {
      // Use dynamic icons based on color preference
      let colorScheme;

      if (iconColor === "system") {
        // Use system color scheme
        colorScheme = await this.#getSystemColorScheme();

        if (colorScheme === "unset") {
          this.#logger.log(
            "System color scheme is unset. Assuming light mode for icon."
          );
          colorScheme = "light";
        }
      } else {
        // Use user's explicit preference
        colorScheme = iconColor === "black" ? "light" : "dark";
      }

      path = `images/${colorScheme}_${onOrOff}_16.png`;
    }

    this.#logger.log(`Setting icon to ${path}`);
    await this.#chrome.action.setIcon({
      path,
    });
  }

  /**
   * @returns {Promise<Object>}
   */
  async getDebugInfo() {
    const systemColorScheme = await this.#getSystemColorScheme();

    return {
      systemColorScheme,
    };
  }
}

export default IconSwitcher;
