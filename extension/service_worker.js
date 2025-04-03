import NotificationsExpert from "./NotificationsExpert.js";
import ExtensionOptions from "./ExtensionOptions.js";
import ListExpert from "./ListExpert.js";
import UrlMatcher from "./UrlMatcher.js";
import TabTracker from "./TabTracker.js";
import AutoMuteExtension from "./AutoMuteExtension.js";
import UpgradeCoordinator from "./UpgradeCoordinator.js";
import IconSwitcher from "./IconSwitcher.js";
import ReportLogger from "./ReportLogger.js";

let extension;
let reportLogger;

(function (_chrome, _console) {
  reportLogger = new ReportLogger(_console);
  try {
    const upgradeCoordinator = new UpgradeCoordinator(_chrome, reportLogger);
    const extensionOptions = new ExtensionOptions(_chrome, reportLogger);
    const urlMatcher = new UrlMatcher(reportLogger);
    const listExpert = new ListExpert(extensionOptions, urlMatcher);

    const tabTracker = new TabTracker(
      _chrome,
      extensionOptions,
      listExpert,
      reportLogger
    );

    const iconSwitcher = new IconSwitcher(
      _chrome,
      tabTracker,
      extensionOptions,
      reportLogger
    );

    extension = new AutoMuteExtension(
      _chrome,
      upgradeCoordinator,
      extensionOptions,
      tabTracker,
      iconSwitcher,
      reportLogger
    );

    extension.start();

    const notificationsExpert = new NotificationsExpert(_chrome);
    notificationsExpert.start();
  } catch (error) {
    reportLogger.error(`Error in service worker: ${JSON.stringify(error)}`);
  }
})(self.chrome, self.console);

export { extension, reportLogger };
