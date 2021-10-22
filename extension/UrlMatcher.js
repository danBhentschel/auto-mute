var UrlMatcher =
    (function () {
        'use strict';

        /**
         * @param {string} url 
         * @returns string
         */
        function stripProtocol(url) {
            return url.replace(/^\w+:\/+/, '');
        }

        /**
         * @param {string} a 
         * @param {string} b 
         * @returns boolean
         */
        function urlsMatch(a, b) {
            return stripProtocol(a) === stripProtocol(b);
        }

        /**
         * @param {string} pattern 
         * @param {string} url 
         * @param {boolean} useRegex 
         * @returns boolean
         */
        function urlPatternMatch(pattern, url, useRegex) {
            let hostnameRegex = getHostnameOf(pattern);
            let pathRegex = getPathOf(pattern) || '/';
            let portRegex = getPortOf(pattern) || '';
            const hostname = getHostnameOf(url);
            const path = getPathOf(url) || '/';
            const port = getPortOf(url) || '';

            if (!useRegex) {
                hostnameRegex = toRegex(hostnameRegex);
                pathRegex = toRegex(pathRegex);
                portRegex = toRegex(portRegex);
            }

            return new RegExp(`^${hostnameRegex}$`).test(stripProtocol(hostname)) &&
                new RegExp(`^${pathRegex}$`).test(path) &&
                new RegExp(`^${portRegex}$`).test(port);
        }

        /**
         * 
         * @param {string[]} list 
         * @param {string} url 
         * @returns boolean
         */
        function isExactUrlInList(list, url) {
            return list.filter(_ => urlsMatch(_, url)).length > 0;
        }

        /**
         * @param {string[]} list 
         * @param {string} url 
         * @param {boolean} useRegex 
         * @returns boolean
         */
        function isDomainInList(list, url, useRegex) {
            const domPattern = domainPattern(url, useRegex);
            return list.filter(_ => urlsMatch(_, domPattern)).length > 0;
        }

        /**
         * @param {string} url 
         * @param {boolean} useRegex 
         * @returns string
         */
        function domainPattern(url, useRegex) {
            return getHostnameOf(url) + (useRegex ? '/.*' : '/*');
        }

        /**
         * It's pretty much impossible to always "correctly" parse a
         * URL that may contain regex. The JS URL() object refuses to
         * do so, mangling the regex horribly.
         * 
         * This is a best effort to work properly for the majority of
         * cases. New situations should be added to the unit test as
         * they come up.
         * 
         * @param {string} url 
         * @returns Object
         */
        function getUrlParts(url) {
            const protoRx = '(?:(.+):\\/+)?';
            const userPassRx = '(?:([^:]+):?([^@]+)?@)?';
            const hostRx = '([^:\\/]+)';
            const portRx = '(?::([^\\/]+))?';
            const pathRx = '(\\/[^?]*)?';
            const paramRx = '(?:\\?([^#]+))?';
            const hashRx = '(?:#(.*))?'
            const urlRegEx = `${protoRx}${userPassRx}${hostRx}${portRx}${pathRx}${paramRx}${hashRx}`;
            const match = url.match(urlRegEx);

            return {
                protocol: match[1],
                username: match[2],
                password: match[3],
                host: match[4],
                port: match[5],
                path: match[6],
                parameters: match[7],
                hash: match[8]
            };
        }

        function getHostnameOf(url) {
            return getUrlParts(url)['host'];
        }

        function getPathOf(url) {
            return getUrlParts(url)['path'];
        }

        function getPortOf(url) {
            return getUrlParts(url)['port'];
        }

        function toRegex(pattern) {
            let regex = pattern.replace(/[-[\]{}()+?.,\\^$|#\s]/g, '\\$&');
            regex = regex.replace(/\*/g, '[^ ]*');
            return regex;
        }

        return new function () {
            const matcher = this;

            matcher.isExactUrlInList = isExactUrlInList;
            matcher.isDomainInList = isDomainInList;
            matcher.urlPatternMatch = urlPatternMatch;
        };

    })();
