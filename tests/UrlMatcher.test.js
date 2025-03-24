import { jest } from "@jest/globals";

import UrlMatcher from "../extension/UrlMatcher";

describe("UrlMatcher ->", () => {
  let mockLogger;

  beforeEach(() => {
    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
    };
  });

  it("should instantiate UrlMatcher", () => {
    expect(UrlMatcher).toBeDefined();
  });

  describe("URL in list", () => {
    it("should not match empty list", () => {
      const url = "http://www.hentschels.com";
      expect(new UrlMatcher(mockLogger).isExactUrlInList([], url)).toBe(false);
    });

    it("should match two identical URLs", () => {
      const url = "http://www.hentschels.com";
      expect(new UrlMatcher(mockLogger).isExactUrlInList([url], url)).toBe(
        true
      );
    });

    it("should not match two different URLs", () => {
      const url1 = "http://www.hentschels.com";
      const url2 = "http://www.codingame.com";
      expect(new UrlMatcher(mockLogger).isExactUrlInList([url1], url2)).toBe(
        false
      );
    });

    it("should match URL in list", () => {
      const url1 = "http://www.hentschels.com";
      const url2 = "http://www.codingame.com";
      const url3 = "http://tech.io";
      const list = [url1, url2, url3];
      expect(new UrlMatcher(mockLogger).isExactUrlInList(list, url1)).toBe(
        true
      );
      expect(new UrlMatcher(mockLogger).isExactUrlInList(list, url2)).toBe(
        true
      );
      expect(new UrlMatcher(mockLogger).isExactUrlInList(list, url3)).toBe(
        true
      );
    });

    it("should match two identical URLs other than protocol", () => {
      const url = "www.hentschels.com";
      const protocol = `http://${url}`;
      expect(new UrlMatcher(mockLogger).isExactUrlInList([protocol], url)).toBe(
        true
      );
      expect(new UrlMatcher(mockLogger).isExactUrlInList([url], protocol)).toBe(
        true
      );
    });
  });

  describe("Domain pattern in list", () => {
    it("should not match empty list", () => {
      const url = "http://www.hentschels.com";
      expect(new UrlMatcher(mockLogger).isDomainInList([], url, false)).toBe(
        false
      );
    });

    it("should match domain only", () => {
      const url = "http://www.hentschels.com";
      const pattern = url + "/*";
      expect(new UrlMatcher(mockLogger).isDomainInList([pattern], url)).toBe(
        true
      );
    });

    it("should match domain with trailing slash", () => {
      const url = "http://www.hentschels.com/";
      const pattern = url + "*";
      expect(new UrlMatcher(mockLogger).isDomainInList([pattern], url)).toBe(
        true
      );
    });

    it("should not match exact URL", () => {
      const url = "http://www.hentschels.com";
      const pattern = "http://www.hentschels.com";
      expect(new UrlMatcher(mockLogger).isDomainInList([pattern], url)).toBe(
        false
      );
    });

    it("should not match subdomain", () => {
      const url = "http://sub1.www.hentschels.com";
      const pattern = "http://www.hentschels.com/*";
      expect(new UrlMatcher(mockLogger).isDomainInList([pattern], url)).toBe(
        false
      );
    });

    it("should not match similar domain", () => {
      const url = "http://www.hentschels.com.us";
      const pattern = "http://www.hentschels.com/*";
      expect(new UrlMatcher(mockLogger).isDomainInList([pattern], url)).toBe(
        false
      );
    });

    it("should match page within domain", () => {
      const url = "http://www.hentschels.com/photos/index.html";
      const pattern = "http://www.hentschels.com/*";
      expect(new UrlMatcher(mockLogger).isDomainInList([pattern], url)).toBe(
        true
      );
    });

    it("should match complex page within domain", () => {
      const url =
        "http://uname:passwd@www.hentschels.com:8080/photos/index.html?foo=bar&bar=baz#anchor";
      const pattern = "http://www.hentschels.com/*";
      expect(new UrlMatcher(mockLogger).isDomainInList([pattern], url)).toBe(
        true
      );
    });
  });

  describe("Url pattern match", () => {
    it("should match exact URL", () => {
      const url = "http://www.hentschels.com";
      const pattern = "http://www.hentschels.com";
      expect(new UrlMatcher(mockLogger).urlPatternMatch(pattern, url)).toBe(
        true
      );
    });

    it("should match simple domain pattern", () => {
      const url = "http://www.hentschels.com";
      const pattern = url + "/*";
      expect(new UrlMatcher(mockLogger).urlPatternMatch(pattern, url)).toBe(
        true
      );
    });

    it("should match domain with partial path", () => {
      const pattern = "http://www.hentschels.com/some/partial/path/*";
      const url =
        "http://www.hentschels.com/some/partial/path/under/that/index.html";
      expect(new UrlMatcher(mockLogger).urlPatternMatch(pattern, url)).toBe(
        true
      );
    });

    it("should not match subdomain", () => {
      const url = "http://sub1.www.hentschels.com";
      const pattern = "http://www.hentschels.com/*";
      expect(new UrlMatcher(mockLogger).urlPatternMatch(pattern, url)).toBe(
        false
      );
    });

    it("should match subdomain against wildcard", () => {
      const url = "http://sub1.www.hentschels.com";
      const pattern = "http://*.www.hentschels.com/*";
      expect(new UrlMatcher(mockLogger).urlPatternMatch(pattern, url)).toBe(
        true
      );
    });

    it("should not match similar domain", () => {
      const url = "http://www.hentschels.com.us";
      const pattern = "http://www.hentschels.com/*";
      expect(new UrlMatcher(mockLogger).urlPatternMatch(pattern, url)).toBe(
        false
      );
    });

    it("should match similar domain against wildcard", () => {
      const url = "http://www.hentschels.com.us";
      const pattern = "http://www.hentschels.*/*";
      expect(new UrlMatcher(mockLogger).urlPatternMatch(pattern, url)).toBe(
        true
      );
    });

    it("should match similar domain against wildcard with port specified", () => {
      const url = "http://www.hentschels.com.us:8080";
      const pattern = "http://www.hentschels.*:8080/*";
      expect(new UrlMatcher(mockLogger).urlPatternMatch(pattern, url)).toBe(
        true
      );
    });

    it("should not match similar domain against wildcard when ports mismatch", () => {
      const url = "http://www.hentschels.com.us:8000";
      const pattern = "http://www.hentschels.*:8080/*";
      expect(new UrlMatcher(mockLogger).urlPatternMatch(pattern, url)).toBe(
        false
      );
    });

    it("should match similar domain against wildcard with wildcard port", () => {
      const url = "http://www.hentschels.com.us:8080";
      const pattern = "http://www.hentschels.*:8*/*";
      expect(new UrlMatcher(mockLogger).urlPatternMatch(pattern, url)).toBe(
        true
      );
    });

    it("should match complex URL", () => {
      const url =
        "http://uname:pass@www.hentschels.com.us:8080/the/path?foo=baz&x=y&meaning=42#link";
      const pattern = "http://www.hentschels.*:8*/*";
      expect(new UrlMatcher(mockLogger).urlPatternMatch(pattern, url)).toBe(
        true
      );
    });
  });

  describe("Url pattern match (regex)", () => {
    it("should match exact URL", () => {
      const url = "http://www.hentschels.com";
      const pattern = "`http://www.hentschels.com`";
      expect(
        new UrlMatcher(mockLogger).urlPatternMatch(pattern, url, true)
      ).toBe(true);
    });

    it("should match simple domain pattern", () => {
      const url = "http://www.hentschels.com/";
      const pattern = `\`${url}.*\``;
      expect(
        new UrlMatcher(mockLogger).urlPatternMatch(pattern, url, true)
      ).toBe(true);
    });

    it("should match simple domain pattern with ^ and $", () => {
      const url = "http://www.hentschels.com/";
      const pattern = `\`^${url}.*$\``;
      expect(
        new UrlMatcher(mockLogger).urlPatternMatch(pattern, url, true)
      ).toBe(true);
    });

    it("should match domain with partial path", () => {
      const url =
        "http://www.hentschels.com/some/partial/path/under/that/index.html";
      const pattern = "`http://www.hentschels.com/some/partial/path/.*`";
      expect(
        new UrlMatcher(mockLogger).urlPatternMatch(pattern, url, true)
      ).toBe(true);
    });

    it("should match domain with partial path and ^ and $", () => {
      const url =
        "http://www.hentschels.com/some/partial/path/under/that/index.html";
      const pattern = "`^http://www.hentschels.com/some/partial/path/.*$`";
      expect(
        new UrlMatcher(mockLogger).urlPatternMatch(pattern, url, true)
      ).toBe(true);
    });

    it("should not match subdomain", () => {
      const url = "http://sub1.www.hentschels.com/";
      const pattern = "`http://www.hentschels.com/.*`";
      expect(
        new UrlMatcher(mockLogger).urlPatternMatch(pattern, url, true)
      ).toBe(false);
    });

    it("should match subdomain against wildcard", () => {
      const url = "http://sub1.www.hentschels.com/";
      const pattern = "`http://.*.www.hentschels.com/.*`";
      expect(
        new UrlMatcher(mockLogger).urlPatternMatch(pattern, url, true)
      ).toBe(true);
    });

    it("should match subdomain against wildcard with ^ and $", () => {
      const url = "http://sub1.www.hentschels.com/";
      const pattern = "`^http://.*.www.hentschels.com/.*$`";
      expect(
        new UrlMatcher(mockLogger).urlPatternMatch(pattern, url, true)
      ).toBe(true);
    });

    it("should not match similar domain", () => {
      const url = "http://www.hentschels.com.us";
      const pattern = "`http://www.hentschels.com/.*`";
      expect(
        new UrlMatcher(mockLogger).urlPatternMatch(pattern, url, true)
      ).toBe(false);
    });

    it("should match similar domain against wildcard", () => {
      const url = "http://www.hentschels.com.us";
      const pattern = "`http://www.hentschels..*/.*`";
      expect(
        new UrlMatcher(mockLogger).urlPatternMatch(pattern, url, true)
      ).toBe(true);
    });

    it("should match similar domain against wildcard with port specified", () => {
      const url = "http://www.hentschels.com.us:8080";
      const pattern = "`http://www.hentschels..*:8080/.*`";
      expect(
        new UrlMatcher(mockLogger).urlPatternMatch(pattern, url, true)
      ).toBe(true);
    });

    it("should not match similar domain against wildcard when ports mismatch", () => {
      const url = "http://www.hentschels.com.us:8000";
      const pattern = "`http://www.hentschels..*:8080/.*`";
      expect(
        new UrlMatcher(mockLogger).urlPatternMatch(pattern, url, true)
      ).toBe(false);
    });

    it("should match similar domain against wildcard with wildcard port", () => {
      const url = "http://www.hentschels.com.us:8080";
      const pattern = "`http://www.hentschels..*:8.*/.*`";
      expect(
        new UrlMatcher(mockLogger).urlPatternMatch(pattern, url, true)
      ).toBe(true);
    });

    it("should match complex URL", () => {
      const url =
        "http://uname:pass@www.hentschels.com.us:8080/the/path?foo=baz&x=y&meaning=42#link";
      const pattern = "`http://www.hentschels..*:8.*/.*`";
      expect(
        new UrlMatcher(mockLogger).urlPatternMatch(pattern, url, true)
      ).toBe(true);
    });

    it("should match complex URL with lots of regex", () => {
      const url =
        "http://uname:pass@www.hentschels.com.us:8080/the/path?foo=baz&x=y&meaning=42#link";
      const pattern =
        "`^http://www\\.hentschels\\..*(\\.us|\\.de):8\\d{3}/.*$`";
      expect(
        new UrlMatcher(mockLogger).urlPatternMatch(pattern, url, true)
      ).toBe(true);
    });
  });
});
