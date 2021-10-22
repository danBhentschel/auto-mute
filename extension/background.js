(function (chrome) {
    'use strict';

    var tabState = {};

    function getEnabled(andCall) {
        chrome.storage.sync.get({ enabled: true }, items => {
            andCall(items.enabled);
        });
    }

    function muteTab(tabId, muted, force) {
        getEnabled(enabled => {
            if (enabled || !!force) {
                chrome.tabs.update(tabId, { muted: muted });
            }
            if (!tabState[tabId]) { tabState[tabId] = {}; }
            tabState[tabId].muted = muted;
            console.log(`${tabId}: muted -> ${muted}`);
        });
    }

    chrome.tabs.onCreated.addListener((tab) => {
        console.log(tab.id + ': created');
        muteIfShould(tab);
    });

    function muteIfShould(tab) {
        getListInfo(listInfo => {
            muteIfShouldNoListUpdate(listInfo, tab);
            updateTabIfListed(listInfo, tab);
        });
    }

    function muteIfShouldNoListUpdate(listInfo, tab) {
        shouldMute(listInfo, tab.url)
            .then(mute => muteTab(tab.id, mute));
    }

    function updateTabIfListed(listInfo, tab) {
        isInList(listInfo.list, tab.url)
            .then(inList => updateListedTab(tab.id, inList));
    }

    chrome.tabs.onReplaced.addListener((addedTabId, removedTabId) => {
        console.log(removedTabId + ': replaced -> ' + addedTabId);
        getUsingWhitelist(usingWhitelist => {
            if (tabState[removedTabId]) {
                console.log(`${removedTabId}: ${JSON.stringify(tabState[removedTabId])}`);
                tabState[addedTabId] = tabState[removedTabId];
                delete tabState[removedTabId];
            }

            chrome.tabs.get(addedTabId, tab => {
                if (tab) {
                    getListInfo(listInfo => {
                        isInList(listInfo.list, tab.url)
                            .then(inList => {
                                updateListedTab(addedTabId, inList);
                                if (!tab.mutedInfo || tab.mutedInfo.muted != tabState[tab.id].muted) {
                                    muteTab(tab.id, tabState[tab.id].muted);
                                }
                            });
                    });
                } else {
                    console.log(chrome.runtime.lastError.message);
                }
            });
        });
    });

    chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
        if (changeInfo.mutedInfo) {
            if (!tabState[tabId]) { tabState[tabId] = {}; }
            var muted = changeInfo.mutedInfo.muted;
            tabState[tabId].muted = muted;
            console.log(tabId + ': muted -> ' + muted);
        }
        if (changeInfo.url) {
            getListInfo(listInfo => {
                isInList(listInfo.list, changeInfo.url)
                    .then(inList => updateListedTab(tabId, inList));
            });
        }
    });

    function muteAllTabs(force, excludeId) {
        getListInfo(listInfo => {
            chrome.tabs.query({}, (tabs) => {
                if (!tabs) { return; }
                tabs.forEach((tab) => {
                    if (tab.id === excludeId) return;
                    if (force) {
                        muteTab(tab.id, true, true);
                    } else {
                        muteIfShouldNoListUpdate(listInfo, tab);
                    }
                    updateTabIfListed(listInfo, tab);
                });
            });
        });
    }

    function getCurrentTab(andCall) {
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
            if (tabs.length) andCall(tabs[0]);
            else andCall(null);
        });
    }

    function toggleMuteCurrentTab() {
        getCurrentTab(tab => {
            if (!!tab) muteTab(tab.id, !tab.mutedInfo.muted, true);
        });
    }

    function muteOtherTabs() {
        getCurrentTab(tab => {
            if (!!tab) muteAllTabs(true, tab.id);
            else muteAllTabs();
        });
    }

    function applyMute() {
        getEnabled(enabled => {
            if (!enabled) return;
            getListInfo(listInfo => {
                chrome.tabs.query({}, (tabs) => {
                    if (!tabs) { return; }
                    tabs.forEach((tab) => {
                        muteIfShouldNoListUpdate(listInfo, tab);
                        updateTabIfListed(listInfo, tab);
                    });
                });
            });
        });
    }

    function getListInfo(andCall) {
        getUsingWhitelist(usingWhitelist => {
            if (usingWhitelist) {
                getWhitelist(whitelist => {
                    andCall({ usingWhitelist: true, list: whitelist });
                });
            } else {
                getBlacklist(blacklist => {
                    andCall({ usingWhitelist: false, list: blacklist });
                });
            }
        });
    }

    function getUsingWhitelist(andCall) {
        chrome.storage.sync.get({ usingWhitelist: true }, items => {
            andCall(items.usingWhitelist);
        });
    }

    function getWhitelist(andCall) {
        chrome.storage.sync.get({ whitelist: '' }, items => {
            var whitelist = cleanList(items.whitelist.split('\n'));
            andCall(whitelist);
        });
    }

    function cleanList(list) {
        return list.map(_ => _.trim()).filter(_ => !!_);
    }

    function setWhitelist(whitelist) {
        chrome.storage.sync.set({ whitelist: whitelist.filter(_ => !!_).join('\n') });
    }

    function getBlacklist(andCall) {
        chrome.storage.sync.get({ blacklist: '' }, items => {
            var blacklist = cleanList(items.blacklist.split('\n'));
            andCall(blacklist);
        });
    }

    function setBlacklist(blacklist) {
        chrome.storage.sync.set({ blacklist: blacklist.filter(_ => !!_).join('\n') });
    }

    function setList(listInfo) {
        if (listInfo.usingWhitelist) {
            setWhitelist(listInfo.list);
        } else {
            setBlacklist(listInfo.list);
        }
    }

    function switchListType() {
        getUsingWhitelist(usingWhitelist => {
            chrome.storage.sync.set({ usingWhitelist: !usingWhitelist });
        });
    }

    function stripProtocol(url) {
        return url.replace(/^\w+:\/+/, '');
    }

    function urlsMatch(a, b) {
        return stripProtocol(a) === stripProtocol(b);
    }

    function urlPatternMatch(pattern, useRegex, url) {
        let regex = stripProtocol(pattern);
        if (!useRegex) {
            regex = stripProtocol(pattern).replace(/\*/g, '[^ ]*');
        }

        return new RegExp(regex).test(stripProtocol(url));
    }

    function isExactUrlInList(list, url) {
        return list.filter(_ => urlsMatch(_, url)).length > 0;
    }

    function isDomainInList(list, url) {
        var domPattern = domainPattern(url);
        return list.filter(_ => urlsMatch(_, domPattern)).length > 0;
    }

    function isInList(list, url) {
        return new Promise(resolve => {
            chrome.storage.sync.get({ useRegex: false }, items => {
                resolve(list.filter(_ => urlPatternMatch(_, items.useRegex, url)).length > 0);
            });
        });
    }

    async function shouldMute(listInfo, url) {
        var inList = await isInList(listInfo.list, url);
        return (listInfo.usingWhitelist && !inList)
            || (!listInfo.usingWhitelist && inList);
    }

    function addOrRemoveCurrentPageInList() {
        getCurrentTab(tab => {
            if (!tab) return;
            getListInfo(listInfo => {
                if (isExactUrlInList(listInfo.list, tab.url)) {
                    listInfo.list = listInfo.list.filter(_ => !urlsMatch(_, tab.url));
                    setList(listInfo);
                    updateListedTab(tab.id, false);
                } else {
                    listInfo.list.push(stripProtocol(tab.url));
                    setList(listInfo);
                    updateListedTab(tab.id, true);
                }
            });
        });
    }

    function getDomainOf(url) {
        return stripProtocol(url).split('/')[0].split(':')[0];
    }

    function domainPattern(url) {
        return getDomainOf(url) + '/*';
    }

    function addOrRemoveCurrentDomainInList() {
        getCurrentTab(tab => {
            if (!tab) return;
            getListInfo(listInfo => {
                if (isDomainInList(listInfo.list, tab.url)) {
                    var domPattern = domainPattern(tab.url);
                    listInfo.list = listInfo.list.filter(_ => !urlsMatch(_, domPattern));
                    setList(listInfo);
                    updateListedTab(tab.id, false);
                } else {
                    listInfo.list.push(domainPattern(tab.url));
                    setList(listInfo);
                    updateListedTab(tab.id, true);
                }
            });
        });
    }

    function updateListedTab(tabId, isListed) {
        getUsingWhitelist(usingWhitelist => {
            if (!tabState[tabId]) { tabState[tabId] = { muted: usingWhitelist }; }
            if (tabState[tabId].isListed === isListed) return;
            tabState[tabId].isListed = isListed;
            console.log(`${tabId}: isListed -> ${isListed}`);
            if (isListed) {
                tabState[tabId].changeWhenLeavingListed = tabState[tabId].muted == usingWhitelist;
                muteTab(tabId, !usingWhitelist);
            } else {
                if (tabState[tabId].changeWhenLeavingListed) {
                    muteTab(tabId, usingWhitelist);
                    tabState[tabId].changeWhenLeavingListed = false;
                }
            }
            console.log(`${tabId}: ${JSON.stringify(tabState[tabId])}`);
        });
    }

    function handleCommand(command) {
        switch (command) {
            case 'apply-mute':
                applyMute();
                break;
            case 'mute-all':
                muteAllTabs(true);
                break;
            case 'mute-tab':
                toggleMuteCurrentTab();
                break;
            case 'mute-other':
                muteOtherTabs();
                break;
            case 'list-page':
                addOrRemoveCurrentPageInList();
                break;
            case 'list-domain':
                addOrRemoveCurrentDomainInList();
                break;
            case 'switch-list-type':
                switchListType();
                break;
        }
    }

    chrome.commands.onCommand.addListener(handleCommand);

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        switch (request.command) {
            case 'query-current-muted':
                getCurrentTab(tab => {
                    var muted = !!tab ? tab.mutedInfo.muted : false;
                    sendResponse({ muted: muted });
                });
                return true;

            case 'query-using-whitelist':
                getUsingWhitelist(usingWhitelist => {
                    sendResponse({ usingWhitelist: usingWhitelist });
                });
                return true;

            case 'query-page-listed':
                getListInfo(listInfo => {
                    getCurrentTab(tab => {
                        sendResponse({ listed: isExactUrlInList(listInfo.list, tab.url) });
                    });
                });
                return true;

            case 'query-domain-listed':
                getListInfo(listInfo => {
                    getCurrentTab(tab => {
                        sendResponse({ listed: isDomainInList(listInfo.list, tab.url) });
                    });
                });
                return true;

            default:
                handleCommand(request.command);
                break;
        }

        return false;
    });

    muteAllTabs();

})(chrome);
