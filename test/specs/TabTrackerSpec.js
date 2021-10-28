'use strict';

it('Should instantiate TabTracker', function () {
    expect(TabTracker).toBeDefined();
});

describe('Something', function () {

    var mockChrome;
    var tabMuteStates;
    var extensionOptions;

    /**
     * @param {boolean} value 
     */
    function setValueForEnabledInStorage(value) {
        spyOn(mockChrome.storage.sync, 'get').and.callFake(function (_, callback) {
            callback({ enabled: value });
        });
    }

    beforeEach(function () {
        mockChrome = {
            tabs: {
                update: function () { }
            },
            storage: {
                sync: {
                    get: function () { }
                }
            }
        };
        tabMuteStates = {};

        extensionOptions = new ExtensionOptions(mockChrome);

        spyOn(mockChrome.tabs, 'update').and.callFake(function (tabId, state) {
            tabMuteStates[tabId] = state.muted;
        });
    });

    it('Should mute the tab if extension is enabled', function () {
        const tracker = new TabTracker(mockChrome, extensionOptions);
        setValueForEnabledInStorage(true);

        tracker.setMuteOnTab(22, true, false);

        expect(tabMuteStates[22]).toBeTrue();
    });

    it('Should not mute the tab if extension is disabled', function () {
        const tracker = new TabTracker(mockChrome, extensionOptions);
        setValueForEnabledInStorage(false);

        tracker.setMuteOnTab(22, true, false);

        expect(tabMuteStates[22]).not.toBeTrue();
    });

    it('Should mute the tab if extension is disabled but force is specified', function () {
        const tracker = new TabTracker(mockChrome, extensionOptions);
        setValueForEnabledInStorage(false);

        tracker.setMuteOnTab(22, true, true);

        expect(tabMuteStates[22]).toBeTrue();
    });

});
