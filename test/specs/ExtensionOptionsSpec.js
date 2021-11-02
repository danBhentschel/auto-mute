'use strict';

it('Should instantiate ExtensionOptions', function () {
    expect(ExtensionOptions).toBeDefined();
});

describe('ExtensionOptions ->', function () {

    let mockChrome;
    let options;
    let storage = {};

    beforeEach(function () {
        mockChrome = {
            storage: {
                sync: {
                    get: function () { },
                    set: function () { }
                }
            }
        };

        storage = {};

        spyOn(mockChrome.storage.sync, 'get').and.callFake(function (values, callback) {
            for (const [key, value] of Object.entries(values)) {
                if (!storage.hasOwnProperty(key)) {
                    storage[key] = value;
                }
            }
            callback(storage);
        });

        spyOn(mockChrome.storage.sync, 'set').and.callFake(function (values, callback) {
            for (const [key, value] of Object.entries(values)) {
                storage[key] = value;
            }
            callback();
        });

        options = new ExtensionOptions(mockChrome);
    });

    it('Should return the enabled value from storage', async function () {
        storage.enabled = false;
        let enabled = await options.getEnabled();
        expect(mockChrome.storage.sync.get).toHaveBeenCalled();
        expect(enabled).toBeFalse();

        storage.enabled = true;
        enabled = await options.getEnabled()
        expect(enabled).toBeTrue();
    });

    it('Enabled value in storage should default to true', async function () {
        let enabled = await options.getEnabled();
        expect(mockChrome.storage.sync.get).toHaveBeenCalled();
        expect(enabled).toBeTrue();
    });

    it('Should return the useRegex value from storage', async function () {
        storage.useRegex = false;
        let useRegex = await options.getUseRegex()
        expect(mockChrome.storage.sync.get).toHaveBeenCalled();
        expect(useRegex).toBeFalse();

        storage.useRegex = true;
        useRegex = await options.getUseRegex();
        expect(useRegex).toBeTrue();
    });

    it('UseRegex value in storage should default to false', async function () {
        let useRegex = await options.getUseRegex();
        expect(mockChrome.storage.sync.get).toHaveBeenCalled();
        expect(useRegex).toBeFalse();
    });

    it('Should return the type of list from storage', async function () {
        storage.usingWhitelist = false;
        let usingShouldNotMuteList = await options.getUsingShouldNotMuteList();
        expect(mockChrome.storage.sync.get).toHaveBeenCalled();
        expect(usingShouldNotMuteList).toBeFalse();

        storage.usingWhitelist = true;
        usingShouldNotMuteList = await options.getUsingShouldNotMuteList();
        expect(usingShouldNotMuteList).toBeTrue();
    });

    it('Type of list in storage should default to "should not mute"', async function () {
        let usingShouldNotMuteList = await options.getUsingShouldNotMuteList();
        expect(mockChrome.storage.sync.get).toHaveBeenCalled();
        expect(usingShouldNotMuteList).toBeTrue();
    });

    it('Should return the "should not mute" list from storage', async function () {
        storage.whitelist = 'urlA\nurlB\nurlC';
        let list = await options.getShouldNotMuteList();
        expect(mockChrome.storage.sync.get).toHaveBeenCalled();
        expect(list.length).toBe(3);
        expect(list[0]).toBe('urlA');
        expect(list[1]).toBe('urlB');
        expect(list[2]).toBe('urlC');
    });

    it('Should prune whitespace from the "should not mute" list', async function () {
        storage.whitelist = 'urlA\n\n\nurlB\n  \n urlC  ';
        let list = await options.getShouldNotMuteList();
        expect(mockChrome.storage.sync.get).toHaveBeenCalled();
        expect(list.length).toBe(3);
        expect(list[0]).toBe('urlA');
        expect(list[1]).toBe('urlB');
        expect(list[2]).toBe('urlC');
    });

    it('Should not mute list in storage should default to empty', async function () {
        let list = await options.getShouldNotMuteList();
        expect(mockChrome.storage.sync.get).toHaveBeenCalled();
        expect(list.length).toBe(0);
    });

    it('Should return the "should mute" list from storage', async function () {
        storage.blacklist = 'urlA\nurlB\nurlC';
        let list = await options.getShouldMuteList();
        expect(mockChrome.storage.sync.get).toHaveBeenCalled();
        expect(list.length).toBe(3);
        expect(list[0]).toBe('urlA');
        expect(list[1]).toBe('urlB');
        expect(list[2]).toBe('urlC');
    });

    it('Should prune whitespace from the "should mute" list', async function () {
        storage.blacklist = 'urlA\n\n\nurlB\n  \n urlC  ';
        let list = await options.getShouldMuteList();
        expect(mockChrome.storage.sync.get).toHaveBeenCalled();
        expect(list.length).toBe(3);
        expect(list[0]).toBe('urlA');
        expect(list[1]).toBe('urlB');
        expect(list[2]).toBe('urlC');
    });

    it('Should mute list in storage should default to empty', async function () {
        let list = await options.getShouldMuteList();
        expect(mockChrome.storage.sync.get).toHaveBeenCalled();
        expect(list.length).toBe(0);
    });

    it('Should set the "should not mute" list contents in storage', async function () {
        await options.setShouldNotMuteList(['urlAA', 'urlBB', 'urlCC']);
        expect(mockChrome.storage.sync.set).toHaveBeenCalled();
        expect(storage.whitelist).toBe('urlAA\nurlBB\nurlCC');
    });

    it('Should set the "should mute" list contents in storage', async function () {
        await options.setShouldMuteList(['urlAA', 'urlBB', 'urlCC']);
        expect(mockChrome.storage.sync.set).toHaveBeenCalled();
        expect(storage.blacklist).toBe('urlAA\nurlBB\nurlCC');
    });

    it('Should toggle the list type in storage', async function () {
        await options.switchListType();
        expect(mockChrome.storage.sync.set).toHaveBeenCalled();
        expect(storage.usingWhitelist).toBe(false);

        await options.switchListType();
        expect(storage.usingWhitelist).toBe(true);

        await options.switchListType();
        expect(storage.usingWhitelist).toBe(false);
    });

});
