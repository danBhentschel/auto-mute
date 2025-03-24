import { jest } from "@jest/globals";

import ListExpert from "../extension/ListExpert.js";

it("should instantiate ListExpert", () => {
  expect(ListExpert).toBeDefined();
});

describe("ListExpert ->", () => {
  let mockOptions;
  /** @type {UrlMatcher} */
  let mockUrlMatcher;
  /** @type {ListExpert} */
  let expert;

  let usingAllowAudioFromOptions = true;
  let allowOrBlockAudioListFromOptions = [];

  /**
   *
   * @param {boolean} usingAllowAudio
   * @param {string[]} list
   */
  function setupList(usingAllowAudio, list) {
    usingAllowAudioFromOptions = usingAllowAudio;
    allowOrBlockAudioListFromOptions = list;
  }

  beforeEach(() => {
    mockOptions = {
      getUsingAllowAudioList: () => {},
      getAllowOrBlockAudioList: () => {},
      getBlockAudioList: () => {},
      setAllowOrBlockAudioList: () => {},
    };

    usingAllowAudioFromOptions = true;
    allowOrBlockAudioListFromOptions = [];

    jest
      .spyOn(mockOptions, "getUsingAllowAudioList")
      .mockImplementation(async () =>
        Promise.resolve(usingAllowAudioFromOptions)
      );
    jest
      .spyOn(mockOptions, "getAllowOrBlockAudioList")
      .mockImplementation(async () =>
        Promise.resolve(allowOrBlockAudioListFromOptions)
      );
    jest
      .spyOn(mockOptions, "setAllowOrBlockAudioList")
      .mockImplementation(async (list) => {
        setupList(true, list);
        return Promise.resolve();
      });

    mockUrlMatcher = {
      urlPatternMatch: () => {},
      isExactUrlInList: () => {},
      isDomainInList: () => {},
      urlsMatch: () => {},
      domainPattern: () => {},
    };

    jest
      .spyOn(mockUrlMatcher, "urlsMatch")
      .mockImplementation((a, b) => a === b);

    expert = new ListExpert(mockOptions, mockUrlMatcher);
  });

  describe("isInList() ->", () => {
    it("should return true for a value in the list", async () => {
      const urlToFind = "http://www.hentschels.com";
      jest
        .spyOn(mockUrlMatcher, "urlPatternMatch")
        .mockImplementation((entry) => entry === urlToFind);

      const list = ["notThisOne", "norThisOne", urlToFind, "anotherNonMatch"];
      const found = await expert.isInList(list, urlToFind);
      expect(found).toBe(true);
    });

    it("should return false for a value not in the list", async () => {
      const urlToFind = "http://www.hentschels.com";
      jest
        .spyOn(mockUrlMatcher, "urlPatternMatch")
        .mockImplementation((entry) => entry === urlToFind);

      const list = ["notThisOne", "norThisOne", "anotherNonMatch"];
      const found = await expert.isInList(list, urlToFind);
      expect(found).toBe(false);
    });
  });

  describe("isExactMatchInList() ->", () => {
    it("should return true for a value in the list", async () => {
      const urlToFind = "http://www.hentschels.com";
      jest
        .spyOn(mockUrlMatcher, "isExactUrlInList")
        .mockImplementation((list, url) => list.includes(url));

      const list = ["notThisOne", "norThisOne", urlToFind, "anotherNonMatch"];
      setupList(true, list);

      const found = await expert.isExactMatchInList(urlToFind);
      expect(found).toBe(true);
    });

    it("should return false for a value not in the list", async () => {
      const urlToFind = "http://www.hentschels.com";
      jest
        .spyOn(mockUrlMatcher, "isExactUrlInList")
        .mockImplementation((list, url) => list.includes(url));

      const list = ["notThisOne", "norThisOne", "anotherNonMatch"];
      setupList(true, list);

      const found = await expert.isExactMatchInList(urlToFind);
      expect(found).toBe(false);
    });
  });

  describe("isDomainInList() ->", () => {
    it("should return true for a value in the list", async () => {
      const urlToFind = "http://www.hentschels.com";
      jest
        .spyOn(mockUrlMatcher, "isDomainInList")
        .mockImplementation((list, url) => list.includes(url));

      const list = ["notThisOne", "norThisOne", urlToFind, "anotherNonMatch"];
      setupList(true, list);

      const found = await expert.isDomainInList(urlToFind);
      expect(found).toBe(true);
    });

    it("should return false for a value not in the list", async () => {
      const urlToFind = "http://www.hentschels.com";
      jest
        .spyOn(mockUrlMatcher, "isDomainInList")
        .mockImplementation((list, url) => list.includes(url));

      const list = ["notThisOne", "norThisOne", "anotherNonMatch"];
      setupList(true, list);

      const found = await expert.isDomainInList(urlToFind);
      expect(found).toBe(false);
    });
  });

  describe("getListInfo() ->", () => {
    it('Should return an "allow audio" list properly', async () => {
      setupList(true, ["urlA", "urlB", "urlC", "urlD"]);

      const listInfo = await expert.getListInfo();
      expect(listInfo.isAllowedAudioList).toBe(true);
      expect(listInfo.listOfPages.length).toBe(4);
      expect(listInfo.listOfPages[2]).toBe("urlC");
    });

    it('Should return a "block audio" list properly', async () => {
      setupList(false, ["urlA", "urlB", "urlC"]);

      const listInfo = await expert.getListInfo();
      expect(listInfo.isAllowedAudioList).toBe(false);
      expect(listInfo.listOfPages.length).toBe(3);
      expect(listInfo.listOfPages[1]).toBe("urlB");
    });
  });

  describe("addOrRemoveUrlInList() ->", () => {
    it("should add a url to a list if it is not there", async () => {
      jest
        .spyOn(mockUrlMatcher, "isExactUrlInList")
        .mockImplementation((list, url) => list.includes(url));
      setupList(true, ["urlA", "urlB", "urlC"]);

      const result = await expert.addOrRemoveUrlInList("urlD");
      const newListInfo = await expert.getListInfo();

      expect(result).toBe(true);
      expect(newListInfo.listOfPages.length).toBe(4);
      expect(newListInfo.listOfPages).toContain("urlD");
    });

    it("should remove a url from a list if it is already there", async () => {
      jest
        .spyOn(mockUrlMatcher, "isExactUrlInList")
        .mockImplementation((list, url) => list.includes(url));
      setupList(true, ["urlA", "urlB", "urlC", "urlD"]);

      const result = await expert.addOrRemoveUrlInList("urlD");
      const newListInfo = await expert.getListInfo();

      expect(result).toBe(false);
      expect(newListInfo.listOfPages.length).toBe(3);
      expect(newListInfo.listOfPages).not.toContain("urlD");
    });
  });

  describe("addOrRemoveDomainInList() ->", () => {
    it("should add a domain to a list if it is not there", async () => {
      jest
        .spyOn(mockUrlMatcher, "isDomainInList")
        .mockImplementation((list, url) => list.includes(url));
      jest.spyOn(mockUrlMatcher, "domainPattern").mockReturnValue("domD");
      setupList(true, ["urlA", "urlB", "urlC"]);

      const result = await expert.addOrRemoveDomainInList("urlD");
      const newListInfo = await expert.getListInfo();

      expect(result).toBe(true);
      expect(newListInfo.listOfPages.length).toBe(4);
      expect(newListInfo.listOfPages).toContain("domD");
    });

    it("should remove a domain from a list if it is already there", async () => {
      jest
        .spyOn(mockUrlMatcher, "isDomainInList")
        .mockImplementation((list, url) => list.includes(url));
      jest.spyOn(mockUrlMatcher, "domainPattern").mockReturnValue("domD");
      setupList(true, ["urlA", "urlB", "urlC", "domD"]);

      const result = await expert.addOrRemoveDomainInList("urlD");
      const newListInfo = await expert.getListInfo();

      expect(result).toBe(false);
      expect(newListInfo.listOfPages.length).toBe(3);
      expect(newListInfo.listOfPages).not.toContain("domD");
    });
  });
});
