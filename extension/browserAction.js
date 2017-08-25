(function () {
    'use strict';

    var isFirefox = typeof InstallTrigger !== 'undefined';

    function muteAllTabs() {
        window.close();
        chrome.runtime.sendMessage({ command: 'mute-all' });
    }

    function muteOtherTabs() {
        window.close();
        chrome.runtime.sendMessage({ command: 'mute-other' });
    }

    function muteCurrentTab() {
        window.close();
        chrome.runtime.sendMessage({ command: 'mute-tab' });
    }

    function listCurrentPage() {
        window.close();
        chrome.runtime.sendMessage({ command: 'list-page' });
    }

    function listDomain() {
        window.close();
        chrome.runtime.sendMessage({ command: 'list-domain' });
    }

    function switchListType() {
        window.close();
        chrome.runtime.sendMessage({ command: 'switch-list-type' });
    }

    function showOptions() {
        window.close();
        let url = 'chrome://extensions/?options=' + chrome.runtime.id;
        if (isFirefox) {
            url = 'about:addons';
        }
        chrome.tabs.create({ url: url });
    }

    $( document ).ready(() => {
        $('#autoMuteBrowserActionMuteAll').click(muteAllTabs);
        $('#autoMuteBrowserActionMuteOther').click(muteOtherTabs);
        $('#autoMuteBrowserActionMuteTab').click(muteCurrentTab);
        $('#autoMuteBrowserActionListPage').click(listCurrentPage);
        $('#autoMuteBrowserActionListDomain').click(listDomain);
        if (isFirefox) {
            $('#autoMuteBrowserActionShowOptions').hide();
        } else {
            $('#autoMuteBrowserActionShowOptions').click(showOptions);
        }
        chrome.runtime.sendMessage({ command: 'query-using-whitelist' }, response => {
            if (!!response) {
                $('#autoMuteBrowserActionPageWhiteBlack').html(response.usingWhitelist ? 'White' : 'Black');
                $('#autoMuteBrowserActionDomainWhiteBlack').html(response.usingWhitelist ? 'White' : 'Black');
            }
        });

        chrome.runtime.sendMessage({ command: 'query-current-muted' }, response => {
            if (!!response) $('#autoMuteBrowserActionMuteTabMuteUnmute').html(response.muted ? 'Unmute' : 'Mute');
        });
        chrome.runtime.sendMessage({ command: 'query-page-listed' }, response => {
            if (!!response) $('#autoMuteBrowserActionPageListed').html(response.listed ? 'Un&#8209;' : '');
        });
        chrome.runtime.sendMessage({ command: 'query-domain-listed' }, response => {
            if (!!response) $('#autoMuteBrowserActionDomainListed').html(response.listed ? 'Un&#8209;' : '');
        });
        chrome.commands.getAll(commands => {
            commands.forEach(command => {
                switch (command.name) {
                    case 'mute-tab':
                        $('#autoMuteBrowserActionMuteTabShortcut').html(!!command.shortcut ? `&nbsp;(${command.shortcut})` : '');
                        break;

                    case 'mute-other':
                        $('#autoMuteBrowserActionMuteOtherShortcut').html(!!command.shortcut ? `&nbsp;(${command.shortcut})` : '');
                        break;

                    case 'mute-all':
                        $('#autoMuteBrowserActionMuteAllShortcut').html(!!command.shortcut ? `&nbsp;(${command.shortcut})` : '');
                        break;
                }
            });
        });
    });

})();
