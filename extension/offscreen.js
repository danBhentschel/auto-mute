(function (_chrome, _matchMedia, _setInterval) {
  let last_scheme = "light";

  async function send_scheme(scheme) {
    last_scheme = scheme;
    await _chrome.runtime.sendMessage({
      command: "change-color-scheme",
      data: { scheme },
    });
  }

  {
    const dark_mode_query = _matchMedia("(prefers-color-scheme: dark)");

    // Send the initial theme setting.
    send_scheme(dark_mode_query.matches ? "dark" : "light");
  }

  // Check for changes to the theme setting every second.
  _setInterval(async () => {
    const dark_mode_query = _matchMedia("(prefers-color-scheme: dark)");
    const current_scheme = dark_mode_query.matches ? "dark" : "light";
    if (current_scheme !== last_scheme) {
      await send_scheme(current_scheme);
    }
  }, 1000);
})(window.chrome, window.matchMedia, window.setInterval);
