'use strict';

it('Should instantiate AutoMuteExtension', function () {
    expect(AutoMuteExtension).toBeDefined();
});

describe('AutoMuteExtension ->', function () {

    let mockChrome;
    /** @var {ExtensionOptions} */
    let mockOptions;
    /** @var {TabTracker} */
    let mockTracker;
    /** @var {AutoMuteExtension} */
    let extension;

    let onTabCreatedListener;
    let onTabReplacedListener;
    let onTabUpdatedListener;
    let onCommandListener;
    let onMessageListener;

    let tab = {};

    beforeEach(function () {
        tab = {
            id: 42,
            url: 'http://www.youtube.com',
            mutedInfo: { muted: false }
        };

        mockChrome = {
            tabs: {
                onCreated: {
                    addListener: function () { }
                },
                onReplaced: {
                    addListener: function () { }
                },
                onUpdated: {
                    addListener: function () { }
                }
            },
            commands: {
                onCommand: {
                    addListener: function () { }
                }
            },
            runtime: {
                onMessage: {
                    addListener: function () { }
                }
            }
        };

        onTabCreatedListener = undefined;
        onTabReplacedListener = undefined;
        onTabUpdatedListener = undefined;
        onCommandListener = undefined;
        onMessageListener = undefined;

        spyOn(mockChrome.tabs.onCreated, 'addListener').and.callFake(function (listener) {
            onTabCreatedListener = listener;
        });
        spyOn(mockChrome.tabs.onReplaced, 'addListener').and.callFake(function (listener) {
            onTabReplacedListener = listener;
        });
        spyOn(mockChrome.tabs.onUpdated, 'addListener').and.callFake(function (listener) {
            onTabUpdatedListener = listener;
        });
        spyOn(mockChrome.commands.onCommand, 'addListener').and.callFake(function (listener) {
            onCommandListener = listener;
        });
        spyOn(mockChrome.runtime.onMessage, 'addListener').and.callFake(function (listener) {
            onMessageListener = listener;
        });

        mockTracker = {
            muteAllTabs: async function () { },
            muteIfShould: async function () { },
            onTabReplaced: async function () { },
            updateTabMutedState: async function () { },
            onTabUrlChanged: async function () { },
            isCurrentTabMuted: async function () { },
            applyMute: async function () { }
        };

        extension = new AutoMuteExtension(mockChrome, mockOptions, mockTracker);
        extension.__isInUnitTest = true;
    });

    it('Should try to mute all tabs on start', async function () {
        spyOn(mockTracker, 'muteAllTabs');
        extension.start();

        await extension.__forTestWaitForAsyncExecutions();

        expect(mockTracker.muteAllTabs).toHaveBeenCalled();
    });

    it('Should try to mute any newly created tab', async function () {
        spyOn(mockTracker, 'muteIfShould');
        extension.start();

        onTabCreatedListener(tab);

        await extension.__forTestWaitForAsyncExecutions();

        expect(mockTracker.muteIfShould).toHaveBeenCalled();
        expect(mockTracker.muteIfShould.calls.argsFor(0)).toEqual([tab]);
    });

    it('Should call TabTracker.onTabReplaced when a tab is replaced', async function () {
        spyOn(mockTracker, 'onTabReplaced');
        extension.start();

        onTabReplacedListener(42, 43);

        await extension.__forTestWaitForAsyncExecutions();

        expect(mockTracker.onTabReplaced).toHaveBeenCalled();
        expect(mockTracker.onTabReplaced.calls.argsFor(0)).toEqual([42, 43]);
    });

    it('Should update the tab muted state when a user mutes a tab', async function () {
        spyOn(mockTracker, 'updateTabMutedState');
        extension.start();

        onTabUpdatedListener(tab.id, { mutedInfo: tab.mutedInfo });

        await extension.__forTestWaitForAsyncExecutions();

        expect(mockTracker.updateTabMutedState).toHaveBeenCalled();
        expect(mockTracker.updateTabMutedState.calls.argsFor(0)).toEqual([tab.id, tab.mutedInfo.muted]);
    });

    it('Should try to mute a tab when the URL changes', async function () {
        spyOn(mockTracker, 'onTabUrlChanged');
        extension.start();

        onTabUpdatedListener(tab.id, { url: tab.url });

        await extension.__forTestWaitForAsyncExecutions();

        expect(mockTracker.onTabUrlChanged).toHaveBeenCalled();
        expect(mockTracker.onTabUrlChanged.calls.argsFor(0)).toEqual([tab.id, tab.url]);
    });

    it('Should apply mute rules to the current tab for apply-mute command', async function () {
        spyOn(mockTracker, 'applyMute');
        extension.start();

        onCommandListener('apply-mute');

        await extension.__forTestWaitForAsyncExecutions();

        expect(mockTracker.applyMute).toHaveBeenCalled();
    });

    it('Should return current tab muted info for query-current-muted message', async function () {
        spyOn(mockTracker, 'isCurrentTabMuted').and.resolveTo(true);
        extension.start();

        let isMuted = false;
        const result = onMessageListener({ command: 'query-current-muted' }, 'sender', response => {
            isMuted = response.muted;
        });

        await extension.__forTestWaitForAsyncExecutions();

        expect(mockTracker.isCurrentTabMuted).toHaveBeenCalled();
        expect(result).toBeTrue();
        expect(isMuted).toBeTrue();
    });

});
