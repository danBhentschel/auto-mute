'use strict';

it('Should instantiate ExtensionOptions', function () {
    expect(ExtensionOptions).toBeDefined();
});

describe('The Extension Enabled Option', function () {

    var mockChrome;

    beforeEach(function () {
        mockChrome = {
            storage: {
                sync: {
                    get: function () { }
                }
            }
        };
    });

    /**
     * @param {boolean} value 
     */
    function setValueForEnabledInStorage(value) {
        spyOn(mockChrome.storage.sync, 'get').and.callFake(function (_, callback) {
            callback({ enabled: value });
        });
    }

    it('Should return the enabled value from storage', function () {
        const options = new ExtensionOptions(mockChrome);
        setValueForEnabledInStorage(false);

        let enabled;
        options.getEnabled(function (value) {
            enabled = value;
        });

        expect(mockChrome.storage.sync.get).toHaveBeenCalled();
        expect(enabled).toBeFalse();
    });


});
