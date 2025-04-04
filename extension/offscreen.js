(function (_chrome, _matchMedia, _setInterval, _console) {
  let last_scheme = "unset";

  async function send_scheme(scheme) {
    _console.log(`Sending system color scheme: ${scheme}`);
    try {
      const response = await _chrome.runtime.sendMessage({
        command: "change-color-scheme",
        data: { scheme },
      });
      _console.log(`Color scheme change response: ${JSON.stringify(response)}`);
      last_scheme = response.systemColorScheme;
    } catch (e) {
      last_scheme = "unset";
      _console.error(e);
    }
  }

  {
    const dark_mode_query = _matchMedia("(prefers-color-scheme: dark)");

    // Send the initial system color scheme setting.
    send_scheme(dark_mode_query.matches ? "dark" : "light");
  }

  // Check for changes to the system color scheme setting every second.
  _setInterval(async () => {
    const dark_mode_query = _matchMedia("(prefers-color-scheme: dark)");
    const current_scheme = dark_mode_query.matches ? "dark" : "light";
    if (current_scheme !== last_scheme) {
      await send_scheme(current_scheme);
    }
  }, 1000);
})(window.chrome, window.matchMedia, window.setInterval, window.console);
