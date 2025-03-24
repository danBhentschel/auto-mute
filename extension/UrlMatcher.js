class UrlMatcher {
  /** @member {Object} */
  #logger;

  /**
   * @param {Object} logger
   */
  constructor(logger) {
    this.#logger = logger;
  }

  /**
   * @param {string} url
   * @returns string
   */
  stripProtocol(url) {
    return url.replace(/^\w+:\/+/, "");
  }

  /**
   * @param {string} a
   * @param {string} b
   * @returns boolean
   */
  urlsMatch(a, b) {
    return this.stripProtocol(a) === this.stripProtocol(b);
  }

  /**
   * @param {string} pattern
   * @param {string} url
   * @returns boolean
   */
  urlPatternMatch(pattern, url) {
    // If the pattern is surrounded by '`' backticks, it's a regex
    const useRegex = pattern.startsWith("`") && pattern.endsWith("`");
    if (useRegex) {
      pattern = pattern.substring(1, pattern.length - 1);
    }

    let hostnameRegex = this.#getHostnameOf(pattern);
    let pathRegex = this.#getPathOf(pattern) || "/";
    let portRegex = this.#getPortOf(pattern) || "";
    const hostname = this.#getHostnameOf(url);
    const path = this.#getPathOf(url) || "/";
    const port = this.#getPortOf(url) || "";

    if (!useRegex) {
      hostnameRegex = this.#toRegex(hostnameRegex);
      pathRegex = this.#toRegex(pathRegex);
      portRegex = this.#toRegex(portRegex);
    }

    return (
      new RegExp(`^${hostnameRegex}$`).test(this.stripProtocol(hostname)) &&
      new RegExp(`^${pathRegex}$`).test(path) &&
      new RegExp(`^${portRegex}$`).test(port)
    );
  }

  /**
   *
   * @param {string[]} list
   * @param {string} url
   * @returns boolean
   */
  isExactUrlInList(list, url) {
    return list.filter((_) => this.urlsMatch(_, url)).length > 0;
  }

  /**
   * @param {string[]} list
   * @param {string} url
   * @returns boolean
   */
  isDomainInList(list, url) {
    const domPattern = this.domainPattern(url);
    return (
      list.filter((listItem) => this.urlsMatch(listItem, domPattern)).length > 0
    );
  }

  /**
   * @param {string} url
   * @returns string
   */
  domainPattern(url) {
    return this.#getHostnameOf(url) + "/*";
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
  #getUrlParts(url) {
    const protoRx = "(?:(.+):\\/+)?";
    const userPassRx = "(?:([^:]+):?([^@]+)?@)?";
    const hostRx = "([^:\\/]+)";
    const portRx = "(?::([^\\/]+))?";
    const pathRx = "(\\/[^?]*)?";
    const paramRx = "(?:\\?([^#]+))?";
    const hashRx = "(?:#(.*))?";
    const urlRegEx = `${protoRx}${userPassRx}${hostRx}${portRx}${pathRx}${paramRx}${hashRx}`;
    const match = url.match(urlRegEx);
    if (!match) {
      this.#logger.log(`Failed to parse URL: ${url}`);
      return {};
    }

    return {
      protocol: match[1],
      username: match[2],
      password: match[3],
      host: match[4],
      port: match[5],
      path: match[6],
      parameters: match[7],
      hash: match[8],
    };
  }

  #getHostnameOf(url) {
    return this.#getUrlParts(url)["host"];
  }

  #getPathOf(url) {
    return this.#getUrlParts(url)["path"];
  }

  #getPortOf(url) {
    return this.#getUrlParts(url)["port"];
  }

  #toRegex(pattern) {
    let regex = pattern.replace(/[-[\]{}()+?.,\\^$|#\s]/g, "\\$&");
    regex = regex.replace(/\*/g, "[^ ]*");
    return regex;
  }
}

export default UrlMatcher;
