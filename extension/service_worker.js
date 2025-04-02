import NotificationsExpert from "./NotificationsExpert.js";
import ExtensionOptions from "./ExtensionOptions.js";
import ListExpert from "./ListExpert.js";
import UrlMatcher from "./UrlMatcher.js";
import TabTracker from "./TabTracker.js";
import AutoMuteExtension from "./AutoMuteExtension.js";
import UpgradeCoordinator from "./UpgradeCoordinator.js";
import IconSwitcher from "./IconSwitcher.js";

let extension;

(function (_chrome, _console) {
  const upgradeCoordinator = new UpgradeCoordinator(_chrome, _console);
  const extensionOptions = new ExtensionOptions(_chrome);
  const urlMatcher = new UrlMatcher(_console);
  const listExpert = new ListExpert(extensionOptions, urlMatcher);

  const tabTracker = new TabTracker(
    _chrome,
    extensionOptions,
    listExpert,
    _console
  );

  const iconSwitcher = new IconSwitcher(
    _chrome,
    tabTracker,
    extensionOptions,
    _console
  );

  extension = new AutoMuteExtension(
    _chrome,
    upgradeCoordinator,
    extensionOptions,
    tabTracker,
    iconSwitcher,
    _console
  );

  extension.start();

  const notificationsExpert = new NotificationsExpert(_chrome);
  notificationsExpert.start();
})(self.chrome, self.console);

export { extension };
