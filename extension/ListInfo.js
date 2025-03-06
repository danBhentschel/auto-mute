class ListInfo {
  /** @member {boolean} */
  #isListOfPagesToMute;

  /** @member {string[]} */
  #listOfPages;

  /**
   * @param {boolean} isListOfPagesToMute
   * @param {string[]} listOfPages
   */
  constructor(isListOfPagesToMute, listOfPages) {
    this.#isListOfPagesToMute = isListOfPagesToMute;
    this.#listOfPages = listOfPages;
  }

  /**
   * @returns {boolean}
   */
  get isListOfPagesToMute() {
    return this.#isListOfPagesToMute;
  }

  /**
   * @returns {string[]}
   */
  get listOfPages() {
    return this.#listOfPages;
  }
}

export default ListInfo;
