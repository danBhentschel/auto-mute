import { jest } from "@jest/globals";

import ListExpert from "../extension/ListExpert";

test("Should instantiate ListExpert", () => {
  expect(ListExpert).toBeDefined();
});

describe("ListExpert ->", () => {
  let mockOptions;
  /** @type {UrlMatcher} */
  let mockUrlMatcher;
  /** @type {ListExpert} */
  let expert;
  let useRegexValue = false;

  let usingShouldNotMuteFromOptions = true;
  let shouldNotMuteListFromOptions = [];
  let shouldMuteListFromOptions = [];

  /**
   *
   * @param {boolean} usingShouldNotMute
   * @param {string[]} list
   */
  function setupList(usingShouldNotMute, list) {
    usingShouldNotMuteFromOptions = usingShouldNotMute;
    if (usingShouldNotMute) {
      shouldNotMuteListFromOptions = list;
    } else {
      shouldMuteListFromOptions = list;
    }
  }

  beforeEach(() => {
    mockOptions = {
      getUseRegex: () => {},
      getUsingShouldNotMuteList: () => {},
      getShouldNotMuteList: () => {},
      getShouldMuteList: () => {},
      setShouldNotMuteList: () => {},
      setShouldMuteList: () => {},
    };

    useRegexValue = false;
    usingShouldNotMuteFromOptions = true;
    shouldNotMuteListFromOptions = [];
    shouldMuteListFromOptions = [];

    jest
      .spyOn(mockOptions, "getUseRegex")
      .mockImplementation(async () => Promise.resolve(useRegexValue));
    jest
      .spyOn(mockOptions, "getUsingShouldNotMuteList")
      .mockImplementation(async () =>
        Promise.resolve(usingShouldNotMuteFromOptions)
      );
    jest
      .spyOn(mockOptions, "getShouldNotMuteList")
      .mockImplementation(async () =>
        Promise.resolve(shouldNotMuteListFromOptions)
      );
    jest
      .spyOn(mockOptions, "getShouldMuteList")
      .mockImplementation(async () =>
        Promise.resolve(shouldMuteListFromOptions)
      );
    jest
      .spyOn(mockOptions, "setShouldNotMuteList")
      .mockImplementation(async (list) => {
        setupList(true, list);
        return Promise.resolve();
      });
    jest
      .spyOn(mockOptions, "setShouldMuteList")
      .mockImplementation(async (list) => {
        setupList(false, list);
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
    test("Should return true for a value in the list", async () => {
      const urlToFind = "http://www.hentschels.com";
      jest
        .spyOn(mockUrlMatcher, "urlPatternMatch")
        .mockImplementation((entry) => entry === urlToFind);

      const list = ["notThisOne", "norThisOne", urlToFind, "anotherNonMatch"];
      const found = await expert.isInList(list, urlToFind);
      expect(found).toBe(true);
    });

    test("Should return false for a value not in the list", async () => {
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
    test("Should return true for a value in the list", async () => {
      const urlToFind = "http://www.hentschels.com";
      jest
        .spyOn(mockUrlMatcher, "isExactUrlInList")
        .mockImplementation((list, url) => list.includes(url));

      const list = ["notThisOne", "norThisOne", urlToFind, "anotherNonMatch"];
      setupList(true, list);

      const found = await expert.isExactMatchInList(urlToFind);
      expect(found).toBe(true);
    });

    test("Should return false for a value not in the list", async () => {
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
    test("Should return true for a value in the list", async () => {
      const urlToFind = "http://www.hentschels.com";
      jest
        .spyOn(mockUrlMatcher, "isDomainInList")
        .mockImplementation((list, url) => list.includes(url));

      const list = ["notThisOne", "norThisOne", urlToFind, "anotherNonMatch"];
      setupList(true, list);

      const found = await expert.isDomainInList(urlToFind);
      expect(found).toBe(true);
    });

    test("Should return false for a value not in the list", async () => {
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
    test('Should return a "should not mute" list properly', async () => {
      setupList(true, ["urlA", "urlB", "urlC", "urlD"]);

      const listInfo = await expert.getListInfo();
      expect(listInfo.isListOfPagesToMute).toBe(false);
      expect(listInfo.listOfPages.length).toBe(4);
      expect(listInfo.listOfPages[2]).toBe("urlC");
    });

    test('Should return a "should mute" list properly', async () => {
      setupList(false, ["urlA", "urlB", "urlC"]);

      const listInfo = await expert.getListInfo();
      expect(listInfo.isListOfPagesToMute).toBe(true);
      expect(listInfo.listOfPages.length).toBe(3);
      expect(listInfo.listOfPages[1]).toBe("urlB");
    });
  });

  describe("addOrRemoveUrlInList() ->", () => {
    test("Should add a url to a list if it is not there", async () => {
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

    test("Should remove a url from a list if it is already there", async () => {
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
    test("Should add a domain to a list if it is not there", async () => {
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

    test("Should remove a domain from a list if it is already there", async () => {
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
