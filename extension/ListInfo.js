class ListInfo {
  /** @member {boolean} */
  #isAllowedAudioList;

  /** @member {string[]} */
  #listOfPages;

  /**
   * @param {boolean} isAllowedAudioList
   * @param {string[]} listOfPages
   */
  constructor(isAllowedAudioList, listOfPages) {
    this.#isAllowedAudioList = isAllowedAudioList;
    this.#listOfPages = listOfPages;
  }

  /**
   * @returns {boolean}
   */
  get isAllowedAudioList() {
    return this.#isAllowedAudioList;
  }

  /**
   * @returns {string[]}
   */
  get listOfPages() {
    return this.#listOfPages;
  }
}

export default ListInfo;
