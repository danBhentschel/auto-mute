'use strict';

const extensionOptions = new ExtensionOptions(chrome);
const urlMatcher = new UrlMatcher();
const listExpert = new ListExpert(chrome, extensionOptions);
const tabTracker = new TabTracker(chrome, extensionOptions, listExpert);

chrome.tabs.onCreated.addListener((tab) => {
    console.log(tab.id + ': created');
    tabTracker.muteIfShould(tab);
});

chrome.tabs.onReplaced.addListener((addedTabId, removedTabId) => {
    console.log(removedTabId + ': replaced -> ' + addedTabId);
    tabTracker.onTabReplaced(addedTabId, removedTabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.mutedInfo) {
        tabTracker.updateTabMutedState(tabId, changeInfo.mutedInfo.muted);
    }
    if (changeInfo.url) {
        tabTracker.onTabUrlChanged(tabId, changeInfo.url);
    }
});

function handleCommand(command) {
    switch (command) {
        case 'apply-mute':
            tabTracker.applyMute();
            break;
        case 'mute-all':
            tabTracker.muteAllTabs(true);
            break;
        case 'mute-tab':
            tabTracker.toggleMuteCurrentTab();
            break;
        case 'mute-other':
            tabTracker.muteOtherTabs();
            break;
        case 'list-page':
            tabTracker.addOrRemoveCurrentPageInList();
            break;
        case 'list-domain':
            tabTracker.addOrRemoveCurrentDomainInList();
            break;
        case 'switch-list-type':
            extensionOptions.switchListType();
            break;
    }
}

chrome.commands.onCommand.addListener(handleCommand);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.command) {
        case 'query-current-muted':
            tabTracker.isCurrentTabMuted(isMuted => {
                sendResponse({ muted: isMuted });
            });
            return true;

        case 'query-using-whitelist':
            extensionOptions.getUsingWhitelist(usingWhitelist => {
                sendResponse({ usingWhitelist: usingWhitelist });
            });
            return true;

        case 'query-page-listed':
            tabTracker.isCurrentTabInList(isInList => {
                sendResponse({ listed: isInList });
            });
            return true;

        case 'query-domain-listed':
            tabTracker.isDomainOfCurrentTabInList(isInList => {
                sendResponse({ listed: isInList });
            });
            return true;

        default:
            handleCommand(request.command);
            break;
    }

    return false;
});

tabTracker.muteAllTabs(false);
