(function () {
    'use strict';

    it('Should instantiate UrlMatcher', function () {
        expect(UrlMatcher).toBeDefined();
    });

    describe('URL in list', function () {

        it('Should not match empty list', function () {
            let url = 'http://www.hentschels.com';
            expect(UrlMatcher.isExactUrlInList([], url)).toBe(false);
        });

        it('Should match two identical URLs', function () {
            let url = 'http://www.hentschels.com';
            expect(UrlMatcher.isExactUrlInList([url], url)).toBe(true);
        });

        it('Should not match two different URLs', function () {
            let url1 = 'http://www.hentschels.com';
            let url2 = 'http://www.codingame.com';
            expect(UrlMatcher.isExactUrlInList([url1], url2)).toBe(false);
        });

        it('Should match URL in list', function () {
            let url1 = 'http://www.hentschels.com';
            let url2 = 'http://www.codingame.com';
            let url3 = 'http://tech.io';
            let list = [url1, url2, url3];
            expect(UrlMatcher.isExactUrlInList(list, url1)).toBe(true);
            expect(UrlMatcher.isExactUrlInList(list, url2)).toBe(true);
            expect(UrlMatcher.isExactUrlInList(list, url3)).toBe(true);
        });

        it('Should match two identical URLs other than protocol', function () {
            let url = 'www.hentschels.com';
            let protocol = `http://${url}`;
            expect(UrlMatcher.isExactUrlInList([protocol], url)).toBe(true);
            expect(UrlMatcher.isExactUrlInList([url], protocol)).toBe(true);
        });

    });

    describe('Domain pattern in list (no regex)', function () {

        it('Should not match empty list', function () {
            let url = 'http://www.hentschels.com';
            expect(UrlMatcher.isDomainInList([], url, false)).toBe(false);
        });

        it('Should match domain only', function () {
            let url = 'http://www.hentschels.com';
            let pattern = url + '/*';
            expect(UrlMatcher.isDomainInList([pattern], url, false)).toBe(true);
        });

        it('Should match domain with trailing slash', function () {
            let url = 'http://www.hentschels.com/';
            let pattern = url + '*';
            expect(UrlMatcher.isDomainInList([pattern], url, false)).toBe(true);
        });

        it('Should not match exact URL', function () {
            let url = 'http://www.hentschels.com';
            let pattern = 'http://www.hentschels.com';
            expect(UrlMatcher.isDomainInList([pattern], url, false)).toBe(false);
        });

        it('Should not match subdomain', function () {
            let url = 'http://sub1.www.hentschels.com';
            let pattern = 'http://www.hentschels.com/*';
            expect(UrlMatcher.isDomainInList([pattern], url, false)).toBe(false);
        });

        it('Should not match similar domain', function () {
            let url = 'http://www.hentschels.com.us';
            let pattern = 'http://www.hentschels.com/*';
            expect(UrlMatcher.isDomainInList([pattern], url, false)).toBe(false);
        });

        it('Should match page within domain', function () {
            let url = 'http://www.hentschels.com/photos/index.html';
            let pattern = 'http://www.hentschels.com/*';
            expect(UrlMatcher.isDomainInList([pattern], url, false)).toBe(true);
        });

    });

    describe('Domain pattern in list (regex)', function () {

        it('Should not match empty list', function () {
            let url = 'http://www.hentschels.com';
            expect(UrlMatcher.isDomainInList([], url, true)).toBe(false);
        });

        it('Should match domain only', function () {
            let url = 'http://www.hentschels.com';
            let pattern = url + '/.*';
            expect(UrlMatcher.isDomainInList([pattern], url, true)).toBe(true);
        });

        it('Should match domain with trailing slash', function () {
            let url = 'http://www.hentschels.com/';
            let pattern = url + '.*';
            expect(UrlMatcher.isDomainInList([pattern], url, true)).toBe(true);
        });

        it('Should not match exact URL', function () {
            let url = 'http://www.hentschels.com';
            let pattern = 'http://www.hentschels.com';
            expect(UrlMatcher.isDomainInList([pattern], url, true)).toBe(false);
        });

        it('Should not match subdomain', function () {
            let url = 'http://sub1.www.hentschels.com';
            let pattern = 'http://www.hentschels.com/.*';
            expect(UrlMatcher.isDomainInList([pattern], url, true)).toBe(false);
        });

        it('Should not match similar domain', function () {
            let url = 'http://www.hentschels.com.us';
            let pattern = 'http://www.hentschels.com/.*';
            expect(UrlMatcher.isDomainInList([pattern], url, true)).toBe(false);
        });

        it('Should match page within domain', function () {
            let url = 'http://www.hentschels.com/photos/index.html';
            let pattern = 'http://www.hentschels.com/.*';
            expect(UrlMatcher.isDomainInList([pattern], url, true)).toBe(true);
        });

    });

    describe('Url pattern match', function () {

        it('Should match exact URL', function () {
            let url = 'http://www.hentschels.com';
            let pattern = 'http://www.hentschels.com';
            expect(UrlMatcher.urlPatternMatch(pattern, url, false)).toBe(true);
        });

        it('Should match simple domain pattern', function () {
            let url = 'http://www.hentschels.com';
            let pattern = url + '/*';
            expect(UrlMatcher.urlPatternMatch(pattern, url, false)).toBe(true);
        });

        it('Should match domain with partial path', function () {
            let pattern = 'http://www.hentschels.com/some/partial/path/*';
            let url = 'http://www.hentschels.com/some/partial/path/under/that/index.html';
            expect(UrlMatcher.urlPatternMatch(pattern, url, false)).toBe(true);
        });

        it('Should not match subdomain', function () {
            let url = 'http://sub1.www.hentschels.com';
            let pattern = 'http://www.hentschels.com/*';
            expect(UrlMatcher.urlPatternMatch(pattern, url, false)).toBe(false);
        });

        it('Should match subdomain against wildcard', function () {
            let url = 'http://sub1.www.hentschels.com';
            let pattern = 'http://*.www.hentschels.com/*';
            expect(UrlMatcher.urlPatternMatch(pattern, url, false)).toBe(true);
        });

        it('Should not match similar domain', function () {
            let url = 'http://www.hentschels.com.us';
            let pattern = 'http://www.hentschels.com/*';
            expect(UrlMatcher.urlPatternMatch(pattern, url, false)).toBe(false);
        });

        it('Should match similar domain against wildcard', function () {
            let url = 'http://www.hentschels.com.us';
            let pattern = 'http://www.hentschels.*/*';
            expect(UrlMatcher.urlPatternMatch(pattern, url, false)).toBe(true);
        });

        it('Should match similar domain against wildcard with port specified', function () {
            let url = 'http://www.hentschels.com.us:8080';
            let pattern = 'http://www.hentschels.*:8080/*';
            expect(UrlMatcher.urlPatternMatch(pattern, url, false)).toBe(true);
        });

        it('Should not match similar domain against wildcard when ports mismatch', function () {
            let url = 'http://www.hentschels.com.us:8000';
            let pattern = 'http://www.hentschels.*:8080/*';
            expect(UrlMatcher.urlPatternMatch(pattern, url, false)).toBe(false);
        });

        it('Should match similar domain against wildcard with wildcard port', function () {
            let url = 'http://www.hentschels.com.us:8080';
            let pattern = 'http://www.hentschels.*:8*/*';
            expect(UrlMatcher.urlPatternMatch(pattern, url, false)).toBe(true);
        });

    });

    describe('Url pattern match (regex)', function () {

        it('Should match exact URL', function () {
            let url = 'http://www.hentschels.com';
            let pattern = 'http://www.hentschels.com';
            expect(UrlMatcher.urlPatternMatch(pattern, url, true)).toBe(true);
        });

        it('Should match simple domain pattern', function () {
            let url = 'http://www.hentschels.com/';
            let pattern = url + '.*';
            expect(UrlMatcher.urlPatternMatch(pattern, url, true)).toBe(true);
        });

        it('Should match domain with partial path', function () {
            let pattern = 'http://www.hentschels.com/some/partial/path/.*';
            let url = 'http://www.hentschels.com/some/partial/path/under/that/index.html';
            expect(UrlMatcher.urlPatternMatch(pattern, url, true)).toBe(true);
        });

        it('Should not match subdomain', function () {
            let url = 'http://sub1.www.hentschels.com/';
            let pattern = 'http://www.hentschels.com/.*';
            expect(UrlMatcher.urlPatternMatch(pattern, url, true)).toBe(false);
        });

        it('Should match subdomain against wildcard', function () {
            let url = 'http://sub1.www.hentschels.com/';
            let pattern = 'http://.*.www.hentschels.com/.*';
            expect(UrlMatcher.urlPatternMatch(pattern, url, true)).toBe(true);
        });

        it('Should not match similar domain', function () {
            let url = 'http://www.hentschels.com.us';
            let pattern = 'http://www.hentschels.com/.*';
            expect(UrlMatcher.urlPatternMatch(pattern, url, true)).toBe(false);
        });

        it('Should match similar domain against wildcard', function () {
            let url = 'http://www.hentschels.com.us';
            let pattern = 'http://www.hentschels..*/.*';
            expect(UrlMatcher.urlPatternMatch(pattern, url, true)).toBe(true);
        });

        it('Should match similar domain against wildcard with port specified', function () {
            let url = 'http://www.hentschels.com.us:8080';
            let pattern = 'http://www.hentschels..*:8080/.*';
            expect(UrlMatcher.urlPatternMatch(pattern, url, true)).toBe(true);
        });

        it('Should not match similar domain against wildcard when ports mismatch', function () {
            let url = 'http://www.hentschels.com.us:8000';
            let pattern = 'http://www.hentschels..*:8080/.*';
            expect(UrlMatcher.urlPatternMatch(pattern, url, true)).toBe(false);
        });

        it('Should match similar domain against wildcard with wildcard port', function () {
            let url = 'http://www.hentschels.com.us:8080';
            let pattern = 'http://www.hentschels..*:8.*/.*';
            expect(UrlMatcher.urlPatternMatch(pattern, url, true)).toBe(true);
        });

    });

})();
