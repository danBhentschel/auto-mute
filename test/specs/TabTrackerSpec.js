'use strict';

it('Should instantiate TabTracker', function () {
    expect(TabTracker).toBeDefined();
});

describe('TabTracker ->', function () {

    let mockChrome;
    let extensionOptions;
    let listExpert;
    let tabs = [];

    /**
     * @param {boolean} value 
     */
    function setValueForEnabledInOptions(value) {
        spyOn(extensionOptions, 'getEnabled').and.resolveTo(value);
    }

    function getTab(id) {
        return tabs.find(t => t.id === id);
    }

    function getTabMuteState(id) {
        return tabs.find(t => t.id === id).mutedInfo.muted;
    }

    beforeEach(function () {
        mockChrome = {
            tabs: {
                update: function () { },
                query: function () { },
                get: function () { }
            },
            storage: {
                sync: {
                    get: function () { }
                }
            }
        };

        extensionOptions = {
            getEnabled: async function () { },
            getUsingShouldNotMuteList: async function () { }
        };

        listExpert = {
            getListInfo: async function () { },
            isInList: async function () { },
            addOrRemoveUrlInList: async function () { },
            addOrRemoveDomainInList: async function () { },
        };

        spyOn(mockChrome.tabs, 'update').and.callFake(function (tabId, state) {
            getTab(tabId).mutedInfo = state;
        });

        tabs = [];
    });

    describe('muteIfShould() ->', function () {

        let tab = {};

        beforeEach(function () {
            tab = {
                id: 42,
                url: 'http://www.youtube.com',
                mutedInfo: { muted: false }
            };

            tabs.push(tab);
        });

        describe('when the extension is enabled ->', function () {

            beforeEach(function () {
                setValueForEnabledInOptions(true);
            });

            describe('and using a "should mute" list ->', function () {

                beforeEach(function () {
                    spyOn(listExpert, 'getListInfo').and.resolveTo(new ListInfo(true, []));
                    spyOn(extensionOptions, 'getUsingShouldNotMuteList').and.resolveTo(false);
                });

                it('should mute the specified tab if the page is in the list', async function () {
                    spyOn(listExpert, 'isInList').and.resolveTo(true);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.muteIfShould(tab);

                    expect(getTabMuteState(tab.id)).toBeTrue();
                });

                it('should not mute the specified tab if the page is not in the list', async function () {
                    spyOn(listExpert, 'isInList').and.resolveTo(false);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.muteIfShould(tab);

                    expect(getTabMuteState(tab.id)).toBeFalse();
                });

            });

            describe('and using a "should not mute" list ->', function () {

                beforeEach(function () {
                    spyOn(listExpert, 'getListInfo').and.resolveTo(new ListInfo(false, []));
                    spyOn(extensionOptions, 'getUsingShouldNotMuteList').and.resolveTo(true);
                });

                it('should not mute the specified tab if the page is in the list', async function () {
                    spyOn(listExpert, 'isInList').and.resolveTo(true);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.muteIfShould(tab);

                    expect(getTabMuteState(tab.id)).toBeFalse();
                });

                it('should mute the specified tab if the page is not in the list', async function () {
                    spyOn(listExpert, 'isInList').and.resolveTo(false);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.muteIfShould(tab);

                    expect(getTabMuteState(tab.id)).toBeTrue();
                });

            });

        });

        describe('when the extension is disabled ->', function () {

            beforeEach(function () {
                setValueForEnabledInOptions(false);
            });

            describe('and using a "should mute" list ->', function () {

                beforeEach(function () {
                    spyOn(listExpert, 'getListInfo').and.resolveTo(new ListInfo(true, []));
                    spyOn(extensionOptions, 'getUsingShouldNotMuteList').and.resolveTo(false);
                });

                it('should not mute the specified tab if the page is in the list', async function () {
                    spyOn(listExpert, 'isInList').and.resolveTo(true);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.muteIfShould(tab);

                    expect(getTabMuteState(tab.id)).toBeFalse();
                });

                it('should not mute the specified tab if the page is not in the list', async function () {
                    spyOn(listExpert, 'isInList').and.resolveTo(false);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.muteIfShould(tab);

                    expect(getTabMuteState(tab.id)).toBeFalse();
                });

            });

            describe('and using a "should not mute" list ->', function () {

                beforeEach(function () {
                    spyOn(listExpert, 'getListInfo').and.resolveTo(new ListInfo(false, []));
                    spyOn(extensionOptions, 'getUsingShouldNotMuteList').and.resolveTo(true);
                });

                it('should not mute the specified tab if the page is in the list', async function () {
                    spyOn(listExpert, 'isInList').and.resolveTo(true);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.muteIfShould(tab);

                    expect(getTabMuteState(tab.id)).toBeFalse();
                });

                it('should not mute the specified tab if the page is not in the list', async function () {
                    spyOn(listExpert, 'isInList').and.resolveTo(false);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.muteIfShould(tab);

                    expect(getTabMuteState(tab.id)).toBeFalse();
                });

            });

        });

    });

    describe('muteAllTabs() ->', function () {

        beforeEach(function () {
            tabs.push({
                id: 42,
                url: 'http://www.youtube.com',
                mutedInfo: { muted: false }
            });
            tabs.push({
                id: 128,
                url: 'http://google.com',
                mutedInfo: { muted: false }
            });

            spyOn(mockChrome.tabs, 'query').and.callFake(function (_, callback) {
                callback(tabs);
            });

            spyOn(listExpert, 'isInList').and.callFake(async function (_, url) {
                return await new Promise(resolve => {
                    resolve(url === tabs[0].url);
                });
            });
        });

        describe('when the extension is enabled ->', function () {

            beforeEach(function () {
                setValueForEnabledInOptions(true);
            });

            describe('and using a "should mute" list ->', function () {

                beforeEach(function () {
                    spyOn(listExpert, 'getListInfo').and.resolveTo(new ListInfo(true, []));
                    spyOn(extensionOptions, 'getUsingShouldNotMuteList').and.resolveTo(false);
                });

                it('should mute a tab if the page is in the list and otherwise not', async function () {
                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.muteAllTabs(false);

                    expect(extensionOptions.getEnabled).toHaveBeenCalled();
                    expect(getTabMuteState(tabs[0].id)).toBeTrue();
                    expect(getTabMuteState(tabs[1].id)).toBeFalse();
                });

                it('should mute all tabs if force is set', async function () {
                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.muteAllTabs(true);

                    expect(extensionOptions.getEnabled).not.toHaveBeenCalled();
                    expect(getTabMuteState(tabs[0].id)).toBeTrue();
                    expect(getTabMuteState(tabs[1].id)).toBeTrue();
                });

                it('should not mute a tab if it is excluded', async function () {
                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.muteAllTabs(false, tabs[0].id);

                    expect(extensionOptions.getEnabled).toHaveBeenCalled();
                    expect(getTabMuteState(tabs[0].id)).toBeFalse();
                    expect(getTabMuteState(tabs[1].id)).toBeFalse();
                });

            });

            describe('and using a "should not mute" list ->', function () {

                beforeEach(function () {
                    spyOn(listExpert, 'getListInfo').and.resolveTo(new ListInfo(false, []));
                    spyOn(extensionOptions, 'getUsingShouldNotMuteList').and.resolveTo(true);
                });

                it('should not mute a tab if the page is in the list and otherwise should', async function () {
                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.muteAllTabs(false);

                    expect(extensionOptions.getEnabled).toHaveBeenCalled();
                    expect(getTabMuteState(tabs[0].id)).toBeFalse();
                    expect(getTabMuteState(tabs[1].id)).toBeTrue();
                });

                it('should mute all tabs if force is set', async function () {
                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.muteAllTabs(true);

                    expect(extensionOptions.getEnabled).not.toHaveBeenCalled();
                    expect(getTabMuteState(tabs[0].id)).toBeTrue();
                    expect(getTabMuteState(tabs[1].id)).toBeTrue();
                });


                it('should not mute a tab if it is excluded', async function () {
                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.muteAllTabs(false, tabs[1].id);

                    expect(extensionOptions.getEnabled).toHaveBeenCalled();
                    expect(getTabMuteState(tabs[0].id)).toBeFalse();
                    expect(getTabMuteState(tabs[1].id)).toBeFalse();
                });
            });

        });

        describe('when the extension is disabled ->', function () {

            beforeEach(function () {
                setValueForEnabledInOptions(false);
            });

            describe('and using a "should mute" list ->', function () {

                beforeEach(function () {
                    spyOn(listExpert, 'getListInfo').and.resolveTo(new ListInfo(true, []));
                    spyOn(extensionOptions, 'getUsingShouldNotMuteList').and.resolveTo(false);
                });

                it('should not mute any tabs', async function () {
                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.muteAllTabs(false);

                    expect(extensionOptions.getEnabled).toHaveBeenCalled();
                    expect(getTabMuteState(tabs[0].id)).toBeFalse();
                    expect(getTabMuteState(tabs[1].id)).toBeFalse();
                });

                it('should mute all tabs if force is set', async function () {
                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.muteAllTabs(true);

                    expect(extensionOptions.getEnabled).not.toHaveBeenCalled();
                    expect(getTabMuteState(tabs[0].id)).toBeTrue();
                    expect(getTabMuteState(tabs[1].id)).toBeTrue();
                });

            });

            describe('and using a "should not mute" list ->', function () {

                beforeEach(function () {
                    spyOn(listExpert, 'getListInfo').and.resolveTo(new ListInfo(false, []));
                    spyOn(extensionOptions, 'getUsingShouldNotMuteList').and.resolveTo(true);
                });

                it('should not mute any tabs', async function () {
                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.muteAllTabs(false);

                    expect(extensionOptions.getEnabled).toHaveBeenCalled();
                    expect(getTabMuteState(tabs[0].id)).toBeFalse();
                    expect(getTabMuteState(tabs[1].id)).toBeFalse();
                });

                it('should mute all tabs if force is set', async function () {
                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.muteAllTabs(true);

                    expect(extensionOptions.getEnabled).not.toHaveBeenCalled();
                    expect(getTabMuteState(tabs[0].id)).toBeTrue();
                    expect(getTabMuteState(tabs[1].id)).toBeTrue();
                });

            });

        });

    });

    describe('toggleMuteOnCurrentTab() ->', function () {

        let tab = {};

        beforeEach(function () {
            tab = {
                id: 42,
                url: 'http://www.youtube.com',
                mutedInfo: { muted: false }
            };

            tabs.push(tab);

            spyOn(mockChrome.tabs, 'query').and.callFake(function (_, callback) {
                callback([tab]);
            });
        });

        describe('when the extension is enabled ->', function () {

            beforeEach(function () {
                setValueForEnabledInOptions(true);
            });

            describe('and using a "should mute" list ->', function () {

                beforeEach(function () {
                    spyOn(listExpert, 'getListInfo').and.resolveTo(new ListInfo(true, []));
                    spyOn(extensionOptions, 'getUsingShouldNotMuteList').and.resolveTo(false);
                });

                it('should mute the current tab if it is not already muted and the page is in the list', async function () {
                    spyOn(listExpert, 'isInList').and.resolveTo(true);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.toggleMuteOnCurrentTab();

                    expect(extensionOptions.getEnabled).not.toHaveBeenCalled();
                    expect(getTabMuteState(tab.id)).toBeTrue();
                });

                it('should unmute the current tab if it is already muted and the page is in the list', async function () {
                    tab.mutedInfo.muted = true;
                    spyOn(listExpert, 'isInList').and.resolveTo(true);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.toggleMuteOnCurrentTab();

                    expect(extensionOptions.getEnabled).not.toHaveBeenCalled();
                    expect(getTabMuteState(tab.id)).toBeFalse();
                });

                it('should mute the current tab if it is not already muted and the page is not in the list', async function () {
                    spyOn(listExpert, 'isInList').and.resolveTo(false);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.toggleMuteOnCurrentTab();

                    expect(extensionOptions.getEnabled).not.toHaveBeenCalled();
                    expect(getTabMuteState(tab.id)).toBeTrue();
                });

                it('should unmute the current tab if it is already muted and the page is not in the list', async function () {
                    tab.mutedInfo.muted = true;
                    spyOn(listExpert, 'isInList').and.resolveTo(false);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.toggleMuteOnCurrentTab();

                    expect(extensionOptions.getEnabled).not.toHaveBeenCalled();
                    expect(getTabMuteState(tab.id)).toBeFalse();
                });

            });

            describe('and using a "should not mute" list ->', function () {

                beforeEach(function () {
                    spyOn(listExpert, 'getListInfo').and.resolveTo(new ListInfo(false, []));
                    spyOn(extensionOptions, 'getUsingShouldNotMuteList').and.resolveTo(true);
                });

                it('should mute the current tab if it is not already muted and the page is in the list', async function () {
                    spyOn(listExpert, 'isInList').and.resolveTo(true);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.toggleMuteOnCurrentTab();

                    expect(extensionOptions.getEnabled).not.toHaveBeenCalled();
                    expect(getTabMuteState(tab.id)).toBeTrue();
                });

                it('should unmute the current tab if it is already muted and the page is in the list', async function () {
                    tab.mutedInfo.muted = true;
                    spyOn(listExpert, 'isInList').and.resolveTo(true);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.toggleMuteOnCurrentTab();

                    expect(extensionOptions.getEnabled).not.toHaveBeenCalled();
                    expect(getTabMuteState(tab.id)).toBeFalse();
                });

                it('should mute the current tab if it is not already muted and the page is not in the list', async function () {
                    spyOn(listExpert, 'isInList').and.resolveTo(false);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.toggleMuteOnCurrentTab();

                    expect(extensionOptions.getEnabled).not.toHaveBeenCalled();
                    expect(getTabMuteState(tab.id)).toBeTrue();
                });

                it('should unmute the current tab if it is already muted and the page is not in the list', async function () {
                    tab.mutedInfo.muted = true;
                    spyOn(listExpert, 'isInList').and.resolveTo(false);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.toggleMuteOnCurrentTab();

                    expect(extensionOptions.getEnabled).not.toHaveBeenCalled();
                    expect(getTabMuteState(tab.id)).toBeFalse();
                });

            });

        });

        describe('when the extension is disabled ->', function () {

            beforeEach(function () {
                setValueForEnabledInOptions(false);
            });

            describe('and using a "should mute" list ->', function () {

                beforeEach(function () {
                    spyOn(listExpert, 'getListInfo').and.resolveTo(new ListInfo(true, []));
                    spyOn(extensionOptions, 'getUsingShouldNotMuteList').and.resolveTo(false);
                });

                it('should mute the current tab if it is not already muted and the page is in the list', async function () {
                    spyOn(listExpert, 'isInList').and.resolveTo(true);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.toggleMuteOnCurrentTab();

                    expect(getTabMuteState(tab.id)).toBeTrue();
                });

                it('should unmute the current tab if it is already muted and the page is in the list', async function () {
                    tab.mutedInfo.muted = true;
                    spyOn(listExpert, 'isInList').and.resolveTo(true);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.toggleMuteOnCurrentTab();

                    expect(getTabMuteState(tab.id)).toBeFalse();
                });

                it('should mute the current tab if it is not already muted and the page is not in the list', async function () {
                    spyOn(listExpert, 'isInList').and.resolveTo(false);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.toggleMuteOnCurrentTab();

                    expect(getTabMuteState(tab.id)).toBeTrue();
                });

                it('should unmute the current tab if it is already muted and the page is not in the list', async function () {
                    tab.mutedInfo.muted = true;
                    spyOn(listExpert, 'isInList').and.resolveTo(false);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.toggleMuteOnCurrentTab();

                    expect(getTabMuteState(tab.id)).toBeFalse();
                });

            });

            describe('and using a "should not mute" list ->', function () {

                beforeEach(function () {
                    spyOn(listExpert, 'getListInfo').and.resolveTo(new ListInfo(false, []));
                    spyOn(extensionOptions, 'getUsingShouldNotMuteList').and.resolveTo(true);
                });

                it('should mute the current tab if it is not already muted and the page is in the list', async function () {
                    spyOn(listExpert, 'isInList').and.resolveTo(true);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.toggleMuteOnCurrentTab();

                    expect(getTabMuteState(tab.id)).toBeTrue();
                });

                it('should unmute the current tab if it is already muted and the page is in the list', async function () {
                    tab.mutedInfo.muted = true;
                    spyOn(listExpert, 'isInList').and.resolveTo(true);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.toggleMuteOnCurrentTab();

                    expect(getTabMuteState(tab.id)).toBeFalse();
                });

                it('should mute the current tab if it is not already muted and the page is not in the list', async function () {
                    spyOn(listExpert, 'isInList').and.resolveTo(false);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.toggleMuteOnCurrentTab();

                    expect(getTabMuteState(tab.id)).toBeTrue();
                });

                it('should unmute the current tab if it is already muted and the page is not in the list', async function () {
                    tab.mutedInfo.muted = true;
                    spyOn(listExpert, 'isInList').and.resolveTo(false);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.toggleMuteOnCurrentTab();

                    expect(getTabMuteState(tab.id)).toBeFalse();
                });

            });

        });

    });

    describe('muteOtherTabs() ->', function () {

        beforeEach(function () {
            tabs.push({
                id: 42,
                url: 'http://www.youtube.com',
                mutedInfo: { muted: false }
            });
            tabs.push({
                id: 128,
                url: 'http://google.com',
                mutedInfo: { muted: false }
            });

            spyOn(mockChrome.tabs, 'query').and.callFake(function (queryInfo, callback) {
                if (!!queryInfo && queryInfo.active) {
                    callback([tabs[0]]);
                } else {
                    callback(tabs);
                }
            });

            spyOn(listExpert, 'isInList').and.callFake(async function (_, url) {
                return await new Promise(resolve => {
                    resolve(url === tabs[0].url);
                });
            });
        });

        describe('when the extension is enabled ->', function () {

            beforeEach(function () {
                setValueForEnabledInOptions(true);
            });

            describe('and using a "should mute" list ->', function () {

                beforeEach(function () {
                    spyOn(listExpert, 'getListInfo').and.resolveTo(new ListInfo(true, []));
                    spyOn(extensionOptions, 'getUsingShouldNotMuteList').and.resolveTo(false);
                });

                it('should mute other tabs', async function () {
                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.muteOtherTabs();

                    expect(getTabMuteState(tabs[0].id)).toBeFalse();
                    expect(getTabMuteState(tabs[1].id)).toBeTrue();
                });

            });

            describe('and using a "should not mute" list ->', function () {

                beforeEach(function () {
                    spyOn(listExpert, 'getListInfo').and.resolveTo(new ListInfo(false, []));
                    spyOn(extensionOptions, 'getUsingShouldNotMuteList').and.resolveTo(true);
                });

                it('should mute other tabs', async function () {
                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.muteOtherTabs();

                    expect(getTabMuteState(tabs[0].id)).toBeFalse();
                    expect(getTabMuteState(tabs[1].id)).toBeTrue();
                });

            });

        });

        describe('when the extension is disabled ->', function () {

            beforeEach(function () {
                setValueForEnabledInOptions(false);
            });

            describe('and using a "should mute" list ->', function () {

                beforeEach(function () {
                    spyOn(listExpert, 'getListInfo').and.resolveTo(new ListInfo(true, []));
                    spyOn(extensionOptions, 'getUsingShouldNotMuteList').and.resolveTo(false);
                });

                it('should mute other tabs', async function () {
                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.muteOtherTabs();

                    expect(getTabMuteState(tabs[0].id)).toBeFalse();
                    expect(getTabMuteState(tabs[1].id)).toBeTrue();
                });

            });

            describe('and using a "should not mute" list ->', function () {

                beforeEach(function () {
                    spyOn(listExpert, 'getListInfo').and.resolveTo(new ListInfo(false, []));
                    spyOn(extensionOptions, 'getUsingShouldNotMuteList').and.resolveTo(true);
                });

                it('should mute other tabs', async function () {
                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.muteOtherTabs();

                    expect(getTabMuteState(tabs[0].id)).toBeFalse();
                    expect(getTabMuteState(tabs[1].id)).toBeTrue();
                });

            });

        });

    });

    describe('applyMuteRulesToAllTabs() ->', function () {

        beforeEach(function () {
            tabs.push({
                id: 42,
                url: 'http://www.youtube.com',
                mutedInfo: { muted: false }
            });
            tabs.push({
                id: 128,
                url: 'http://google.com',
                mutedInfo: { muted: false }
            });

            spyOn(mockChrome.tabs, 'query').and.callFake(function (_, callback) {
                callback(tabs);
            });

            spyOn(listExpert, 'isInList').and.callFake(async function (_, url) {
                return await new Promise(resolve => {
                    resolve(url === tabs[0].url);
                });
            });
        });

        describe('when the extension is enabled ->', function () {

            beforeEach(function () {
                setValueForEnabledInOptions(true);
            });

            describe('and using a "should mute" list ->', function () {

                beforeEach(function () {
                    spyOn(listExpert, 'getListInfo').and.resolveTo(new ListInfo(true, []));
                    spyOn(extensionOptions, 'getUsingShouldNotMuteList').and.resolveTo(false);
                });

                it('should mute a tab if the page is in the list and otherwise not', async function () {
                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.applyMuteRulesToAllTabs();

                    expect(getTabMuteState(tabs[0].id)).toBeTrue();
                    expect(getTabMuteState(tabs[1].id)).toBeFalse();
                });

            });

            describe('and using a "should not mute" list ->', function () {

                beforeEach(function () {
                    spyOn(listExpert, 'getListInfo').and.resolveTo(new ListInfo(false, []));
                    spyOn(extensionOptions, 'getUsingShouldNotMuteList').and.resolveTo(true);
                });

                it('should not mute a tab if the page is in the list and otherwise should', async function () {
                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.applyMuteRulesToAllTabs();

                    expect(getTabMuteState(tabs[0].id)).toBeFalse();
                    expect(getTabMuteState(tabs[1].id)).toBeTrue();
                });

            });

        });

        describe('when the extension is disabled ->', function () {

            beforeEach(function () {
                setValueForEnabledInOptions(false);
            });

            describe('and using a "should mute" list ->', function () {

                beforeEach(function () {
                    spyOn(listExpert, 'getListInfo').and.resolveTo(new ListInfo(true, []));
                    spyOn(extensionOptions, 'getUsingShouldNotMuteList').and.resolveTo(false);
                });

                it('should not mute any tabs', async function () {
                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.applyMuteRulesToAllTabs();

                    expect(getTabMuteState(tabs[0].id)).toBeFalse();
                    expect(getTabMuteState(tabs[1].id)).toBeFalse();
                });

            });

            describe('and using a "should not mute" list ->', function () {

                beforeEach(function () {
                    spyOn(listExpert, 'getListInfo').and.resolveTo(new ListInfo(false, []));
                    spyOn(extensionOptions, 'getUsingShouldNotMuteList').and.resolveTo(true);
                });

                it('should not mute any tabs', async function () {
                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.applyMuteRulesToAllTabs();

                    expect(getTabMuteState(tabs[0].id)).toBeFalse();
                    expect(getTabMuteState(tabs[1].id)).toBeFalse();
                });

            });

        });

    });

    describe('onTabReplaced() ->', function () {

        let tab = {};

        beforeEach(function () {
            tab = {
                id: 42,
                url: 'http://www.youtube.com',
                mutedInfo: { muted: false }
            };

            tabs.push(tab);


            spyOn(mockChrome.tabs, 'get').and.callFake(function (tabId, callback) {
                callback(getTab(tabId));
            });
        });

        describe('when the extension is enabled ->', function () {

            beforeEach(function () {
                setValueForEnabledInOptions(true);
            });

            describe('and using a "should mute" list ->', function () {

                beforeEach(function () {
                    spyOn(listExpert, 'getListInfo').and.resolveTo(new ListInfo(true, []));
                    spyOn(extensionOptions, 'getUsingShouldNotMuteList').and.resolveTo(false);
                });

                it('should mute the specified tab if the page is in the list', async function () {
                    spyOn(listExpert, 'isInList').and.resolveTo(true);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.onTabReplaced(tab.id);

                    expect(getTabMuteState(tab.id)).toBeTrue();
                });

                it('should not mute the specified tab if the page is not in the list', async function () {
                    spyOn(listExpert, 'isInList').and.resolveTo(false);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.onTabReplaced(tab.id);

                    expect(getTabMuteState(tab.id)).toBeFalse();
                });

            });

            describe('and using a "should not mute" list ->', function () {

                beforeEach(function () {
                    spyOn(listExpert, 'getListInfo').and.resolveTo(new ListInfo(false, []));
                    spyOn(extensionOptions, 'getUsingShouldNotMuteList').and.resolveTo(true);
                });

                it('should not mute the specified tab if the page is in the list', async function () {
                    spyOn(listExpert, 'isInList').and.resolveTo(true);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.onTabReplaced(tab.id);

                    expect(getTabMuteState(tab.id)).toBeFalse();
                });

                it('should mute the specified tab if the page is not in the list', async function () {
                    spyOn(listExpert, 'isInList').and.resolveTo(false);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.onTabReplaced(tab.id);

                    expect(getTabMuteState(tab.id)).toBeTrue();
                });

            });

        });

        describe('when the extension is disabled ->', function () {

            beforeEach(function () {
                setValueForEnabledInOptions(false);
            });

            describe('and using a "should mute" list ->', function () {

                beforeEach(function () {
                    spyOn(listExpert, 'getListInfo').and.resolveTo(new ListInfo(true, []));
                    spyOn(extensionOptions, 'getUsingShouldNotMuteList').and.resolveTo(false);
                });

                it('should not mute the specified tab if the page is in the list', async function () {
                    spyOn(listExpert, 'isInList').and.resolveTo(true);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.onTabReplaced(tab.id);

                    expect(getTabMuteState(tab.id)).toBeFalse();
                });

                it('should not mute the specified tab if the page is not in the list', async function () {
                    spyOn(listExpert, 'isInList').and.resolveTo(false);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.onTabReplaced(tab.id);

                    expect(getTabMuteState(tab.id)).toBeFalse();
                });

            });

            describe('and using a "should not mute" list ->', function () {

                beforeEach(function () {
                    spyOn(listExpert, 'getListInfo').and.resolveTo(new ListInfo(false, []));
                    spyOn(extensionOptions, 'getUsingShouldNotMuteList').and.resolveTo(true);
                });

                it('should not mute the specified tab if the page is in the list', async function () {
                    spyOn(listExpert, 'isInList').and.resolveTo(true);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.onTabReplaced(tab.id);

                    expect(getTabMuteState(tab.id)).toBeFalse();
                });

                it('should not mute the specified tab if the page is not in the list', async function () {
                    spyOn(listExpert, 'isInList').and.resolveTo(false);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.onTabReplaced(tab.id);

                    expect(getTabMuteState(tab.id)).toBeFalse();
                });

            });

        });

    });

    describe('onTabUrlChanged() ->', function () {

        let tab = {};

        beforeEach(function () {
            tab = {
                id: 42,
                url: 'http://www.youtube.com',
                mutedInfo: { muted: false }
            };

            tabs.push(tab);


            spyOn(mockChrome.tabs, 'get').and.callFake(function (tabId, callback) {
                callback(getTab(tabId));
            });
        });

        describe('when the extension is enabled ->', function () {

            beforeEach(function () {
                setValueForEnabledInOptions(true);
            });

            describe('and using a "should mute" list ->', function () {

                beforeEach(function () {
                    spyOn(listExpert, 'getListInfo').and.resolveTo(new ListInfo(true, []));
                    spyOn(extensionOptions, 'getUsingShouldNotMuteList').and.resolveTo(false);
                });

                it('should mute the specified tab if the page is in the list', async function () {
                    spyOn(listExpert, 'isInList').and.resolveTo(true);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.onTabUrlChanged(tab.id);

                    expect(getTabMuteState(tab.id)).toBeTrue();
                });

                it('should not mute the specified tab if the page is not in the list', async function () {
                    spyOn(listExpert, 'isInList').and.resolveTo(false);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.onTabUrlChanged(tab.id);

                    expect(getTabMuteState(tab.id)).toBeFalse();
                });

            });

            describe('and using a "should not mute" list ->', function () {

                beforeEach(function () {
                    spyOn(listExpert, 'getListInfo').and.resolveTo(new ListInfo(false, []));
                    spyOn(extensionOptions, 'getUsingShouldNotMuteList').and.resolveTo(true);
                });

                it('should not mute the specified tab if the page is in the list', async function () {
                    spyOn(listExpert, 'isInList').and.resolveTo(true);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.onTabUrlChanged(tab.id);

                    expect(getTabMuteState(tab.id)).toBeFalse();
                });

                it('should mute the specified tab if the page is not in the list', async function () {
                    spyOn(listExpert, 'isInList').and.resolveTo(false);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.onTabUrlChanged(tab.id);

                    expect(getTabMuteState(tab.id)).toBeTrue();
                });

            });

        });

        describe('when the extension is disabled ->', function () {

            beforeEach(function () {
                setValueForEnabledInOptions(false);
            });

            describe('and using a "should mute" list ->', function () {

                beforeEach(function () {
                    spyOn(listExpert, 'getListInfo').and.resolveTo(new ListInfo(true, []));
                    spyOn(extensionOptions, 'getUsingShouldNotMuteList').and.resolveTo(false);
                });

                it('should not mute the specified tab if the page is in the list', async function () {
                    spyOn(listExpert, 'isInList').and.resolveTo(true);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.onTabUrlChanged(tab.id);

                    expect(getTabMuteState(tab.id)).toBeFalse();
                });

                it('should not mute the specified tab if the page is not in the list', async function () {
                    spyOn(listExpert, 'isInList').and.resolveTo(false);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.onTabUrlChanged(tab.id);

                    expect(getTabMuteState(tab.id)).toBeFalse();
                });

            });

            describe('and using a "should not mute" list ->', function () {

                beforeEach(function () {
                    spyOn(listExpert, 'getListInfo').and.resolveTo(new ListInfo(false, []));
                    spyOn(extensionOptions, 'getUsingShouldNotMuteList').and.resolveTo(true);
                });

                it('should not mute the specified tab if the page is in the list', async function () {
                    spyOn(listExpert, 'isInList').and.resolveTo(true);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.onTabUrlChanged(tab.id);

                    expect(getTabMuteState(tab.id)).toBeFalse();
                });

                it('should not mute the specified tab if the page is not in the list', async function () {
                    spyOn(listExpert, 'isInList').and.resolveTo(false);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.onTabUrlChanged(tab.id);

                    expect(getTabMuteState(tab.id)).toBeFalse();
                });

            });

        });

    });

    describe('addOrRemoveCurrentPageInList() ->', function () {

        let tab = {};

        beforeEach(function () {
            tab = {
                id: 42,
                url: 'http://www.youtube.com',
                mutedInfo: { muted: false }
            };

            tabs.push(tab);


            spyOn(mockChrome.tabs, 'query').and.callFake(function (queryInfo, callback) {
                if (!!queryInfo && queryInfo.active) {
                    callback([tabs[0]]);
                } else {
                    callback(tabs);
                }
            });
        });

        describe('when the extension is enabled ->', function () {

            beforeEach(function () {
                setValueForEnabledInOptions(true);
            });

            describe('and using a "should mute" list ->', function () {

                beforeEach(function () {
                    spyOn(listExpert, 'getListInfo').and.resolveTo(new ListInfo(true, []));
                    spyOn(extensionOptions, 'getUsingShouldNotMuteList').and.resolveTo(false);
                });

                it('should add the current tab URL to the list', async function () {
                    spyOn(listExpert, 'addOrRemoveUrlInList').and.resolveTo(true);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.addOrRemoveCurrentPageInList();

                    expect(listExpert.addOrRemoveUrlInList).toHaveBeenCalled();
                    expect(listExpert.addOrRemoveUrlInList.calls.argsFor(0)).toEqual([tab.url]);
                });

            });

            describe('and using a "should not mute" list ->', function () {

                beforeEach(function () {
                    spyOn(listExpert, 'getListInfo').and.resolveTo(new ListInfo(false, []));
                    spyOn(extensionOptions, 'getUsingShouldNotMuteList').and.resolveTo(true);
                });

                it('should add the current tab URL to the list', async function () {
                    spyOn(listExpert, 'addOrRemoveUrlInList').and.resolveTo(true);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.addOrRemoveCurrentPageInList();

                    expect(listExpert.addOrRemoveUrlInList).toHaveBeenCalled();
                    expect(listExpert.addOrRemoveUrlInList.calls.argsFor(0)).toEqual([tab.url]);
                });

            });

        });

        describe('when the extension is disabled ->', function () {

            beforeEach(function () {
                setValueForEnabledInOptions(false);
            });

            describe('and using a "should mute" list ->', function () {

                beforeEach(function () {
                    spyOn(listExpert, 'getListInfo').and.resolveTo(new ListInfo(true, []));
                    spyOn(extensionOptions, 'getUsingShouldNotMuteList').and.resolveTo(false);
                });

                it('should add the current tab URL to the list', async function () {
                    spyOn(listExpert, 'addOrRemoveUrlInList').and.resolveTo(true);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.addOrRemoveCurrentPageInList();

                    expect(listExpert.addOrRemoveUrlInList).toHaveBeenCalled();
                    expect(listExpert.addOrRemoveUrlInList.calls.argsFor(0)).toEqual([tab.url]);
                });

            });

            describe('and using a "should not mute" list ->', function () {

                beforeEach(function () {
                    spyOn(listExpert, 'getListInfo').and.resolveTo(new ListInfo(false, []));
                    spyOn(extensionOptions, 'getUsingShouldNotMuteList').and.resolveTo(true);
                });

                it('should add the current tab URL to the list', async function () {
                    spyOn(listExpert, 'addOrRemoveUrlInList').and.resolveTo(true);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.addOrRemoveCurrentPageInList();

                    expect(listExpert.addOrRemoveUrlInList).toHaveBeenCalled();
                    expect(listExpert.addOrRemoveUrlInList.calls.argsFor(0)).toEqual([tab.url]);
                });

            });

        });

    });

    describe('addOrRemoveCurrentDomainInList() ->', function () {

        let tab = {};

        beforeEach(function () {
            tab = {
                id: 42,
                url: 'http://www.youtube.com',
                mutedInfo: { muted: false }
            };

            tabs.push(tab);


            spyOn(mockChrome.tabs, 'query').and.callFake(function (queryInfo, callback) {
                if (!!queryInfo && queryInfo.active) {
                    callback([tabs[0]]);
                } else {
                    callback(tabs);
                }
            });
        });

        describe('when the extension is enabled ->', function () {

            beforeEach(function () {
                setValueForEnabledInOptions(true);
            });

            describe('and using a "should mute" list ->', function () {

                beforeEach(function () {
                    spyOn(listExpert, 'getListInfo').and.resolveTo(new ListInfo(true, []));
                    spyOn(extensionOptions, 'getUsingShouldNotMuteList').and.resolveTo(false);
                });

                it('should add the current tab domain to the list', async function () {
                    spyOn(listExpert, 'addOrRemoveDomainInList').and.resolveTo(true);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.addOrRemoveCurrentDomainInList();

                    expect(listExpert.addOrRemoveDomainInList).toHaveBeenCalled();
                    expect(listExpert.addOrRemoveDomainInList.calls.argsFor(0)).toEqual([tab.url]);
                });

            });

            describe('and using a "should not mute" list ->', function () {

                beforeEach(function () {
                    spyOn(listExpert, 'getListInfo').and.resolveTo(new ListInfo(false, []));
                    spyOn(extensionOptions, 'getUsingShouldNotMuteList').and.resolveTo(true);
                });

                it('should add the current tab domain to the list', async function () {
                    spyOn(listExpert, 'addOrRemoveDomainInList').and.resolveTo(true);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.addOrRemoveCurrentDomainInList();

                    expect(listExpert.addOrRemoveDomainInList).toHaveBeenCalled();
                    expect(listExpert.addOrRemoveDomainInList.calls.argsFor(0)).toEqual([tab.url]);
                });

            });

        });

        describe('when the extension is disabled ->', function () {

            beforeEach(function () {
                setValueForEnabledInOptions(false);
            });

            describe('and using a "should mute" list ->', function () {

                beforeEach(function () {
                    spyOn(listExpert, 'getListInfo').and.resolveTo(new ListInfo(true, []));
                    spyOn(extensionOptions, 'getUsingShouldNotMuteList').and.resolveTo(false);
                });

                it('should add the current tab domain to the list', async function () {
                    spyOn(listExpert, 'addOrRemoveDomainInList').and.resolveTo(true);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.addOrRemoveCurrentDomainInList();

                    expect(listExpert.addOrRemoveDomainInList).toHaveBeenCalled();
                    expect(listExpert.addOrRemoveDomainInList.calls.argsFor(0)).toEqual([tab.url]);
                });

            });

            describe('and using a "should not mute" list ->', function () {

                beforeEach(function () {
                    spyOn(listExpert, 'getListInfo').and.resolveTo(new ListInfo(false, []));
                    spyOn(extensionOptions, 'getUsingShouldNotMuteList').and.resolveTo(true);
                });

                it('should add the current tab domain to the list', async function () {
                    spyOn(listExpert, 'addOrRemoveDomainInList').and.resolveTo(true);

                    const tabTracker = new TabTracker(mockChrome, extensionOptions, listExpert);
                    await tabTracker.addOrRemoveCurrentDomainInList();

                    expect(listExpert.addOrRemoveDomainInList).toHaveBeenCalled();
                    expect(listExpert.addOrRemoveDomainInList.calls.argsFor(0)).toEqual([tab.url]);
                });

            });

        });

    });

});
