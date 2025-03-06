const extensionOptions = new ExtensionOptions(chrome);
const urlMatcher = new UrlMatcher();
const listExpert = new ListExpert(extensionOptions, urlMatcher);
const tabTracker = new TabTracker(
  chrome,
  extensionOptions,
  listExpert,
  console
);
const extension = new AutoMuteExtension(
  chrome,
  extensionOptions,
  tabTracker,
  console
);

extension.start();
