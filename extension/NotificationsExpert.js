class NotificationsExpert {
  static get CURRENT_VERSION() {
    return 30200;
  }
  #chrome;

  /**
   * @param {Object} chromeInstance
   */
  constructor(chromeInstance) {
    this.#chrome = chromeInstance;
  }

  start() {
    // Run after 3 seconds to allow the extension to load
    setTimeout(() => {
      this.#run();
    }, 3000);
  }

  async #setCurrentVersion() {
    await this.#chrome.storage.sync.set({
      newFeatures: NotificationsExpert.CURRENT_VERSION,
    });
  }

  async #run() {
    const items = await this.#chrome.storage.sync.get({
      newFeatures: NotificationsExpert.CURRENT_VERSION,
    });
    if (items.newFeatures >= NotificationsExpert.CURRENT_VERSION) {
      await this.#setCurrentVersion();
      return;
    }

    let isFirefox = typeof InstallTrigger !== "undefined";
    let notificationOptions = {
      type: "basic",
      iconUrl: "images/Speaker_128.png",
    };

    if (!isFirefox) {
      notificationOptions.requireInteraction = true;
    }

    if (items.newFeatures < 20000) {
      notificationOptions.title = "New features in AutoMute 2.0";
      notificationOptions.message =
        "AutoMute has new features including a URL whitelist and keyboard shortcuts. Click the speaker button to explore.";

      await this.#chrome.notifications.create(
        "new-features-2.0",
        notificationOptions
      );
    }

    if (items.newFeatures < 20100) {
      notificationOptions.title = "New features in AutoMute 2.1";
      notificationOptions.message =
        "AutoMute has a new feature. You can now switch to blacklist mode, which will only mute the pages you specify.";
      await this.#chrome.notifications.create(
        "new-features-2.1",
        notificationOptions
      );
    }

    if (items.newFeatures < 30000) {
      notificationOptions.title = "New features in AutoMute 3.0";
      notificationOptions.message =
        "Whitelist and blacklist are now just one list. Regular expressions are now supported. Click the speaker button to explore.";
      await this.#chrome.notifications.create(
        "new-features-3.0",
        notificationOptions
      );
    }

    if (items.newFeatures < 30100) {
      notificationOptions.title = "New features in AutoMute 3.1";
      notificationOptions.message =
        'The icon behavior can now be customized in the options page. Click the speaker button and select "AutoMute options" to explore.';
      await this.#chrome.notifications.create(
        "new-features-3.1",
        notificationOptions
      );
    }

    if (items.newFeatures < 30200) {
      notificationOptions.title = "New features in AutoMute 3.2";
      (notificationOptions.message =
        'You can now use the "Report a problem" menu item to report issues.'),
        await this.#chrome.notifications.create(
          "new-features-3.2",
          notificationOptions
        );
    }

    await this.#setCurrentVersion();
  }
}

export default NotificationsExpert;
