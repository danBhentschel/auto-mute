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
            this.#__forTestWrapAsyncCall(async () => {
                await this.#tabTracker.muteIfShould(tab);
            });
        });

        this.#chrome.tabs.onReplaced.addListener((addedTabId, removedTabId) => {
            console.log(removedTabId + ': replaced -> ' + addedTabId);
            this.#__forTestWrapAsyncCall(async () => {
                await this.#tabTracker.onTabReplaced(addedTabId, removedTabId);
            });
        });


        this.#chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
            if (changeInfo.mutedInfo) {
                this.#__forTestWrapAsyncCall(async () => {
                    await this.#tabTracker.updateTabMutedState(tabId, changeInfo.mutedInfo.muted);
                });
            }
            if (changeInfo.url) {
                this.#__forTestWrapAsyncCall(async () => {
                    await this.#tabTracker.onTabUrlChanged(tabId, changeInfo.url);
                });
            }
        });

        this.#chrome.commands.onCommand.addListener(command => {
            this.#handleCommand(command);
        });

        this.#chrome.runtime.onMessage.addListener((request, _unusedSender, sendResponse) => {
            return this.#handleMessage(request.command, sendResponse);
        });

        this.#__forTestWrapAsyncCall(async () => {
            await this.#tabTracker.muteAllTabs(false);
        });
    }

    /**
     * @callback sendResponseCallback
     * @param {Object} data
     */
    /**
     * A return value of true tells the browser to expect that the
     * sendResponse() callback function will be called asynchronously
     * and so it keeps the communication channel open to wait for
     * this response.
     * 
     * @param {string} command 
     * @param {sendResponseCallback} sendResponse 
     * @returns {boolean}
     */
    #handleMessage(command, sendResponse) {
        switch (command) {
            case 'query-current-muted':
                this.#__forTestWrapAsyncCall(async () => {
                    const isMuted = await this.#tabTracker.isCurrentTabMuted();
                    sendResponse({ muted: isMuted });
                });
                return true;

            case 'query-using-should-not-mute-list':
                this.#__forTestWrapAsyncCall(async () => {
                    const usingShouldNotMuteList = await this.#extensionOptions.getUsingShouldNotMuteList();
                    sendResponse({ usingShouldNotMuteList: usingShouldNotMuteList });
                });
                return true;

            case 'query-page-listed':
                this.#__forTestWrapAsyncCall(async () => {
                    const isInList = await this.#tabTracker.isCurrentTabInList();
                    sendResponse({ listed: isInList });
                });
                return true;

            case 'query-domain-listed':
                this.#__forTestWrapAsyncCall(async () => {
                    const isInList = await this.#tabTracker.isDomainOfCurrentTabInList();
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
                this.#__forTestWrapAsyncCall(async () => {
                    await this.#tabTracker.applyMute();
                });
                break;
            case 'mute-all':
                this.#__forTestWrapAsyncCall(async () => {
                    await this.#tabTracker.muteAllTabs(true);
                });
                break;
            case 'mute-tab':
                this.#__forTestWrapAsyncCall(async () => {
                    await this.#tabTracker.toggleMuteOnCurrentTab();
                });
                break;
            case 'mute-other':
                this.#__forTestWrapAsyncCall(async () => {
                    await this.#tabTracker.muteOtherTabs();
                });
                break;
            case 'list-page':
                this.#__forTestWrapAsyncCall(async () => {
                    await this.#tabTracker.addOrRemoveCurrentPageInList();
                });
                break;
            case 'list-domain':
                this.#__forTestWrapAsyncCall(async () => {
                    await this.#tabTracker.addOrRemoveCurrentDomainInList();
                });
                break;
            case 'switch-list-type':
                this.#__forTestWrapAsyncCall(async () => {
                    await this.#extensionOptions.switchListType();
                });
                break;
        }
    }

    // Used in tests
    /** @member {Array<Promise<boolean>>} */
    #__isInUnitTest = false;
    #__forTestListenerPromises = [];

    set __isInUnitTest(value) {
        this.#__isInUnitTest = value;
    }

    async __forTestWaitForAsyncExecutions() {
        const resolved = await Promise.all(this.#__forTestListenerPromises);
        this.#__forTestListenerPromises = [];
        return resolved;
    }

    #__forTestWrapAsyncCall(action) {
        if (this.#__isInUnitTest) {
            this.#__forTestListenerPromises.push(action());
        } else {
            action();
        }
    }

}
