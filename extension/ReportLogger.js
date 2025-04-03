class ReportLogger {
  /** @type {number} */
  #maxLines;
  /** @type {string} */
  #storageKey;
  /** @type {string[]} */
  #buffer;
  /** @type {number | null} */
  #timer;
  /** @type {number} */
  #unsavedLines = 0;
  /** @type {Promise<void>} */
  #initPromise;
  /** @type {Object} */
  #logger;
  /** @type {boolean} */
  #storeToSession;

  constructor(logger, maxLines = 2000, storageKey = "logBuffer") {
    this.#logger = logger;
    this.#maxLines = maxLines;
    this.#storageKey = storageKey;
    this.#buffer = [];
    // We don't want to store logs in the test environment.
    if (typeof process !== "undefined" && process.env) {
      this.#storeToSession = process.env.NODE_ENV !== "test";
    } else {
      this.#storeToSession = true;
    }
    // Begin loading the persisted buffer.
    this.#initPromise = this.#loadBuffer();
  }

  /**
   * Returns the current timestamp string in ISO format.
   *
   * @returns {string} The timestamp.
   */
  #getTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Loads the log buffer from chrome.storage.session.
   *
   * @returns {Promise<void>}
   */
  async #loadBuffer() {
    try {
      const result = (
        await chrome.storage.session.get({ [this.#storageKey]: [] })
      )[this.#storageKey];
      this.#buffer = result;
    } catch (error) {
      this.#logger.error("Error loading log buffer:", error);
    }
  }

  /**
   * Saves the in-memory buffer to chrome.storage.session.
   *
   * @returns {Promise<void>}
   */
  async #saveBuffer() {
    const toStore = { [this.#storageKey]: this.#buffer };
    try {
      await chrome.storage.session.set(toStore);
      // Reset the unsaved lines counter after a successful save.
      this.#unsavedLines = 0;
    } catch (error) {
      this.#logger.error("Error saving log buffer:", error);
    }
  }

  /**
   * Starts a timer to save the buffer in 5 seconds. If there's already
   * a timer, it clears it. If more than 100 unsaved lines exist, save immediately.
   */
  #startTimer() {
    if (!this.#storeToSession) {
      this.#logger.log("Not storing logs to session. Timer not started.");
      // If we are not storing to session, do not start the timer.
      return;
    }

    if (this.#timer) {
      clearTimeout(this.#timer);
    }

    if (this.#unsavedLines > 100) {
      // Trigger an immediate save.
      this.#saveBuffer();
      return;
    }

    this.#timer = setTimeout(() => {
      this.#saveBuffer();
      this.#timer = null;
    }, 5000);
  }

  /**
   * Adds a new log message to the circular buffer.
   *
   * @param {string} message The log message.
   * @returns {Promise<void>}
   */
  async #addToBuffer(message) {
    // Ensure the buffer is loaded before adding a message.
    await this.#initPromise;

    if (this.#buffer.length >= this.#maxLines) {
      // Remove the oldest entry if the buffer is full.
      this.#buffer.shift();
    }
    this.#buffer.push(message);
    this.#unsavedLines++;
    this.#startTimer();
  }

  /**
   * Logs a message with a timestamp by calling console.log.
   *
   * @param {...any} args Data to log.
   */
  log(...args) {
    const timestamp = this.#getTimestamp();
    const message = `[${timestamp}] INFO  ${args.join(" ")}`;

    this.#logger.log(message);
    this.#addToBuffer(message);
  }

  /**
   * Logs a warning with a timestamp by calling console.warn.
   *
   * @param {...any} args Data to log.
   */
  warn(...args) {
    const timestamp = this.#getTimestamp();
    const message = `[${timestamp}] WARN  ${args.join(" ")}`;

    this.#logger.warn(message);
    this.#addToBuffer(message);
  }

  /**
   * Logs an error with a timestamp by calling console.error.
   *
   * @param {...any} args Data to log.
   */
  error(...args) {
    const timestamp = this.#getTimestamp();
    const message = `[${timestamp}] ERROR ${args.join(" ")}`;

    this.#logger.error(message);
    this.#addToBuffer(message);
  }

  /**
   * Retrieves the current log buffer.
   *
   * @returns {Promise<string[]>} The array of log messages.
   */
  async getLogBuffer() {
    // Ensure the buffer is loaded before returning it.
    await this.#initPromise;
    return this.#buffer;
  }
}

export default ReportLogger;
