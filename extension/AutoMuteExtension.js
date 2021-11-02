'use strict';

class AutoMuteExtension {
    #chrome;
    /** @member {ExtensionOptions} */
    #extensionOptions;
    /** @member {TabTracker} */
    #tabTracker;

    /**
     * @param {Object} chromeInstance
     * @param {ExtensionOptions} extensionOptions
     * @param {TabTracker} tabTracker
     */
    constructor(chromeInstance, extensionOptions, tabTracker) {
        this.#chrome = chromeInstance;
        this.#extensionOptions = extensionOptions;
        this.#tabTracker = tabTracker;
    }

    start() {
        this.#chrome.tabs.onCreated.addListener((tab) => {
            console.log(tab.id + ': created');
            this.#tabTracker.muteIfShould(tab);
        });

        this.#chrome.tabs.onReplaced.addListener((addedTabId, removedTabId) => {
            console.log(removedTabId + ': replaced -> ' + addedTabId);
            this.#tabTracker.onTabReplaced(addedTabId, removedTabId);
        });

        this.#chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
            if (changeInfo.mutedInfo) {
                this.#tabTracker.updateTabMutedState(tabId, changeInfo.mutedInfo.muted);
            }
            if (changeInfo.url) {
                this.#tabTracker.onTabUrlChanged(tabId, changeInfo.url);
            }
        });

        this.#chrome.commands.onCommand.addListener(this.#handleCommand);

        this.#chrome.runtime.onMessage.addListener((request, _unusedSender, sendResponse) => {
            return this.#handleMessage(request.command, sendResponse);
        });

        this.#tabTracker.muteAllTabs(false);
    }

    #handleMessage(command, sendResponse) {
        switch (command) {
            case 'query-current-muted':
                this.#tabTracker.isCurrentTabMuted(isMuted => {
                    sendResponse({ muted: isMuted });
                });
                return true;

            case 'query-using-should-not-mute-list':
                this.#extensionOptions.getUsingShouldNotMuteList(usingShouldNotMuteList => {
                    sendResponse({ usingShouldNotMuteList: usingShouldNotMuteList });
                });
                return true;

            case 'query-page-listed':
                this.#tabTracker.isCurrentTabInList(isInList => {
                    sendResponse({ listed: isInList });
                });
                return true;

            case 'query-domain-listed':
                this.#tabTracker.isDomainOfCurrentTabInList(isInList => {
                    sendResponse({ listed: isInList });
                });
                return true;

            default:
                this.#handleCommand(command);
                break;
        }

        return false;
    }

    #handleCommand(command) {
        switch (command) {
            case 'apply-mute':
                this.#tabTracker.applyMute();
                break;
            case 'mute-all':
                this.#tabTracker.muteAllTabs(true);
                break;
            case 'mute-tab':
                this.#tabTracker.toggleMuteOnCurrentTab();
                break;
            case 'mute-other':
                this.#tabTracker.muteOtherTabs();
                break;
            case 'list-page':
                this.#tabTracker.addOrRemoveCurrentPageInList();
                break;
            case 'list-domain':
                this.#tabTracker.addOrRemoveCurrentDomainInList();
                break;
            case 'switch-list-type':
                this.#extensionOptions.switchListType();
                break;
        }
    }

}
