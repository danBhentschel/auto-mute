import { jest } from "@jest/globals";

import UrlMatcher from "../extension/UrlMatcher";

test("should instantiate UrlMatcher", () => {
  expect(UrlMatcher).toBeDefined();
});

describe("URL in list", () => {
  test("should not match empty list", () => {
    const url = "http://www.hentschels.com";
    expect(new UrlMatcher().isExactUrlInList([], url)).toBe(false);
  });

  test("should match two identical URLs", () => {
    const url = "http://www.hentschels.com";
    expect(new UrlMatcher().isExactUrlInList([url], url)).toBe(true);
  });

  test("should not match two different URLs", () => {
    const url1 = "http://www.hentschels.com";
    const url2 = "http://www.codingame.com";
    expect(new UrlMatcher().isExactUrlInList([url1], url2)).toBe(false);
  });

  test("should match URL in list", () => {
    const url1 = "http://www.hentschels.com";
    const url2 = "http://www.codingame.com";
    const url3 = "http://tech.io";
    const list = [url1, url2, url3];
    expect(new UrlMatcher().isExactUrlInList(list, url1)).toBe(true);
    expect(new UrlMatcher().isExactUrlInList(list, url2)).toBe(true);
    expect(new UrlMatcher().isExactUrlInList(list, url3)).toBe(true);
  });

  test("should match two identical URLs other than protocol", () => {
    const url = "www.hentschels.com";
    const protocol = `http://${url}`;
    expect(new UrlMatcher().isExactUrlInList([protocol], url)).toBe(true);
    expect(new UrlMatcher().isExactUrlInList([url], protocol)).toBe(true);
  });
});

describe("Domain pattern in list (no regex)", () => {
  test("should not match empty list", () => {
    const url = "http://www.hentschels.com";
    expect(new UrlMatcher().isDomainInList([], url, false)).toBe(false);
  });

  test("should match domain only", () => {
    const url = "http://www.hentschels.com";
    const pattern = url + "/*";
    expect(new UrlMatcher().isDomainInList([pattern], url, false)).toBe(true);
  });

  test("should match domain with trailing slash", () => {
    const url = "http://www.hentschels.com/";
    const pattern = url + "*";
    expect(new UrlMatcher().isDomainInList([pattern], url, false)).toBe(true);
  });

  test("should not match exact URL", () => {
    const url = "http://www.hentschels.com";
    const pattern = "http://www.hentschels.com";
    expect(new UrlMatcher().isDomainInList([pattern], url, false)).toBe(false);
  });

  test("should not match subdomain", () => {
    const url = "http://sub1.www.hentschels.com";
    const pattern = "http://www.hentschels.com/*";
    expect(new UrlMatcher().isDomainInList([pattern], url, false)).toBe(false);
  });

  test("should not match similar domain", () => {
    const url = "http://www.hentschels.com.us";
    const pattern = "http://www.hentschels.com/*";
    expect(new UrlMatcher().isDomainInList([pattern], url, false)).toBe(false);
  });

  test("should match page within domain", () => {
    const url = "http://www.hentschels.com/photos/index.html";
    const pattern = "http://www.hentschels.com/*";
    expect(new UrlMatcher().isDomainInList([pattern], url, false)).toBe(true);
  });

  test("should match complex page within domain", () => {
    const url =
      "http://uname:passwd@www.hentschels.com:8080/photos/index.html?foo=bar&bar=baz#anchor";
    const pattern = "http://www.hentschels.com/*";
    expect(new UrlMatcher().isDomainInList([pattern], url, false)).toBe(true);
  });
});

describe("Domain pattern in list (regex)", () => {
  test("should not match empty list", () => {
    const url = "http://www.hentschels.com";
    expect(new UrlMatcher().isDomainInList([], url, true)).toBe(false);
  });

  test("should match domain only", () => {
    const url = "http://www.hentschels.com";
    const pattern = url + "/.*";
    expect(new UrlMatcher().isDomainInList([pattern], url, true)).toBe(true);
  });

  test("should match domain with trailing slash", () => {
    const url = "http://www.hentschels.com/";
    const pattern = url + ".*";
    expect(new UrlMatcher().isDomainInList([pattern], url, true)).toBe(true);
  });

  test("should not match exact URL", () => {
    const url = "http://www.hentschels.com";
    const pattern = "http://www.hentschels.com";
    expect(new UrlMatcher().isDomainInList([pattern], url, true)).toBe(false);
  });

  test("should not match subdomain", () => {
    const url = "http://sub1.www.hentschels.com";
    const pattern = "http://www.hentschels.com/.*";
    expect(new UrlMatcher().isDomainInList([pattern], url, true)).toBe(false);
  });

  test("should not match similar domain", () => {
    const url = "http://www.hentschels.com.us";
    const pattern = "http://www.hentschels.com/.*";
    expect(new UrlMatcher().isDomainInList([pattern], url, true)).toBe(false);
  });

  test("should match page within domain", () => {
    const url = "http://www.hentschels.com/photos/index.html";
    const pattern = "http://www.hentschels.com/.*";
    expect(new UrlMatcher().isDomainInList([pattern], url, true)).toBe(true);
  });

  test("should match complex page within domain", () => {
    const url =
      "http://uname:passwd@www.hentschels.com:8080/photos/index.html?foo=bar&bar=baz#anchor";
    const pattern = "http://www.hentschels.com/.*";
    expect(new UrlMatcher().isDomainInList([pattern], url, true)).toBe(true);
  });
});

describe("Url pattern match", () => {
  test("should match exact URL", () => {
    const url = "http://www.hentschels.com";
    const pattern = "http://www.hentschels.com";
    expect(new UrlMatcher().urlPatternMatch(pattern, url, false)).toBe(true);
  });

  test("should match simple domain pattern", () => {
    const url = "http://www.hentschels.com";
    const pattern = url + "/*";
    expect(new UrlMatcher().urlPatternMatch(pattern, url, false)).toBe(true);
  });

  test("should match domain with partial path", () => {
    const pattern = "http://www.hentschels.com/some/partial/path/*";
    const url =
      "http://www.hentschels.com/some/partial/path/under/that/index.html";
    expect(new UrlMatcher().urlPatternMatch(pattern, url, false)).toBe(true);
  });

  test("should not match subdomain", () => {
    const url = "http://sub1.www.hentschels.com";
    const pattern = "http://www.hentschels.com/*";
    expect(new UrlMatcher().urlPatternMatch(pattern, url, false)).toBe(false);
  });

  test("should match subdomain against wildcard", () => {
    const url = "http://sub1.www.hentschels.com";
    const pattern = "http://*.www.hentschels.com/*";
    expect(new UrlMatcher().urlPatternMatch(pattern, url, false)).toBe(true);
  });

  test("should not match similar domain", () => {
    const url = "http://www.hentschels.com.us";
    const pattern = "http://www.hentschels.com/*";
    expect(new UrlMatcher().urlPatternMatch(pattern, url, false)).toBe(false);
  });

  test("should match similar domain against wildcard", () => {
    const url = "http://www.hentschels.com.us";
    const pattern = "http://www.hentschels.*/*";
    expect(new UrlMatcher().urlPatternMatch(pattern, url, false)).toBe(true);
  });

  test("should match similar domain against wildcard with port specified", () => {
    const url = "http://www.hentschels.com.us:8080";
    const pattern = "http://www.hentschels.*:8080/*";
    expect(new UrlMatcher().urlPatternMatch(pattern, url, false)).toBe(true);
  });

  test("should not match similar domain against wildcard when ports mismatch", () => {
    const url = "http://www.hentschels.com.us:8000";
    const pattern = "http://www.hentschels.*:8080/*";
    expect(new UrlMatcher().urlPatternMatch(pattern, url, false)).toBe(false);
  });

  test("should match similar domain against wildcard with wildcard port", () => {
    const url = "http://www.hentschels.com.us:8080";
    const pattern = "http://www.hentschels.*:8*/*";
    expect(new UrlMatcher().urlPatternMatch(pattern, url, false)).toBe(true);
  });

  test("should match complex URL", () => {
    const url =
      "http://uname:pass@www.hentschels.com.us:8080/the/path?foo=baz&x=y&meaning=42#link";
    const pattern = "http://www.hentschels.*:8*/*";
    expect(new UrlMatcher().urlPatternMatch(pattern, url, false)).toBe(true);
  });
});

describe("Url pattern match (regex)", () => {
  test("should match exact URL", () => {
    const url = "http://www.hentschels.com";
    const pattern = "http://www.hentschels.com";
    expect(new UrlMatcher().urlPatternMatch(pattern, url, true)).toBe(true);
  });

  test("should match simple domain pattern", () => {
    const url = "http://www.hentschels.com/";
    const pattern = url + ".*";
    expect(new UrlMatcher().urlPatternMatch(pattern, url, true)).toBe(true);
  });

  test("should match domain with partial path", () => {
    const pattern = "http://www.hentschels.com/some/partial/path/.*";
    const url =
      "http://www.hentschels.com/some/partial/path/under/that/index.html";
    expect(new UrlMatcher().urlPatternMatch(pattern, url, true)).toBe(true);
  });

  test("should not match subdomain", () => {
    const url = "http://sub1.www.hentschels.com/";
    const pattern = "http://www.hentschels.com/.*";
    expect(new UrlMatcher().urlPatternMatch(pattern, url, true)).toBe(false);
  });

  test("should match subdomain against wildcard", () => {
    const url = "http://sub1.www.hentschels.com/";
    const pattern = "http://.*.www.hentschels.com/.*";
    expect(new UrlMatcher().urlPatternMatch(pattern, url, true)).toBe(true);
  });

  test("should not match similar domain", () => {
    const url = "http://www.hentschels.com.us";
    const pattern = "http://www.hentschels.com/.*";
    expect(new UrlMatcher().urlPatternMatch(pattern, url, true)).toBe(false);
  });

  test("should match similar domain against wildcard", () => {
    const url = "http://www.hentschels.com.us";
    const pattern = "http://www.hentschels..*/.*";
    expect(new UrlMatcher().urlPatternMatch(pattern, url, true)).toBe(true);
  });

  test("should match similar domain against wildcard with port specified", () => {
    const url = "http://www.hentschels.com.us:8080";
    const pattern = "http://www.hentschels..*:8080/.*";
    expect(new UrlMatcher().urlPatternMatch(pattern, url, true)).toBe(true);
  });

  test("should not match similar domain against wildcard when ports mismatch", () => {
    const url = "http://www.hentschels.com.us:8000";
    const pattern = "http://www.hentschels..*:8080/.*";
    expect(new UrlMatcher().urlPatternMatch(pattern, url, true)).toBe(false);
  });

  test("should match similar domain against wildcard with wildcard port", () => {
    const url = "http://www.hentschels.com.us:8080";
    const pattern = "http://www.hentschels..*:8.*/.*";
    expect(new UrlMatcher().urlPatternMatch(pattern, url, true)).toBe(true);
  });

  test("should match complex URL", () => {
    const url =
      "http://uname:pass@www.hentschels.com.us:8080/the/path?foo=baz&x=y&meaning=42#link";
    const pattern = "http://www.hentschels..*:8.*/.*";
    expect(new UrlMatcher().urlPatternMatch(pattern, url, true)).toBe(true);
  });
});
