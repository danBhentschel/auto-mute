var UrlMatcher =
(function () {
    'use strict';

    function stripProtocol(url) {
        return url.replace(/^\w+:\/+/, '');
    }

    function urlsMatch(a, b) {
        return stripProtocol(a) === stripProtocol(b);
    }

    function urlPatternMatch(pattern, useRegex, url) {
        let regex = stripProtocol(pattern);
        if (!useRegex) {
            regex = stripProtocol(pattern).replace(/\*/g, '[^ ]*');
        }

        return new RegExp(regex).test(stripProtocol(url));
    }

    function isExactUrlInList(list, url) {
        return list.filter(_ => urlsMatch(_, url)).length > 0;
    }

    function isDomainInList(list, url, useRegex) {
        var domPattern = domainPattern(url, useRegex);
        return list.filter(_ => urlsMatch(_, domPattern)).length > 0;
    }

    function getDomainOf(url) {
        return stripProtocol(url).split('/')[0].split(':')[0];
    }

    function domainPattern(url, useRegex) {
        return getDomainOf(url) + (useRegex ? '/.*' : '/*');
    }

    return new function() {
        let matcher = this;

        matcher.isExactUrlInList = isExactUrlInList;
        matcher.isDomainInList = isDomainInList;
    };

})();
