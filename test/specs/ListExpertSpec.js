'use strict';

it('Should instantiate ListExpert', function () {
    expect(ListExpert).toBeDefined();
});

describe('ListExpert ->', function () {

    let mockOptions;
    /** @type {UrlMatcher} */
    let mockUrlMatcher;
    /** @type {ListExpert} */
    let expert;
    let useRegexValue = false;

    let usingShouldNotMuteFromOptions = true;
    let shouldNotMuteListFromOptions = [];
    let shouldMuteListFromOptions = [];

    /**
     * 
     * @param {boolean} usingShouldNotMute
     * @param {string[]} list 
     */
    function setupList(usingShouldNotMute, list) {
        usingShouldNotMuteFromOptions = usingShouldNotMute;
        if (usingShouldNotMute) {
            shouldNotMuteListFromOptions = list;
        } else {
            shouldMuteListFromOptions = list;
        }
    }

    beforeEach(function () {
        mockOptions = {
            getUseRegex: function () { },
            getUsingShouldNotMuteList: function () { },
            getShouldNotMuteList: function () { },
            getShouldMuteList: function () { },
            setShouldNotMuteList: function () { },
            setShouldMuteList: function () { }
        };

        useRegexValue = false;
        usingShouldNotMuteFromOptions = true;
        shouldNotMuteListFromOptions = [];
        shouldMuteListFromOptions = [];
        spyOn(mockOptions, 'getUseRegex').and.callFake(async () => {
            return Promise.resolve(useRegexValue);
        });
        spyOn(mockOptions, 'getUsingShouldNotMuteList').and.callFake(async () => {
            return Promise.resolve(usingShouldNotMuteFromOptions);
        });
        spyOn(mockOptions, 'getShouldNotMuteList').and.callFake(async () => {
            return Promise.resolve(shouldNotMuteListFromOptions);
        });
        spyOn(mockOptions, 'getShouldMuteList').and.callFake(async () => {
            return Promise.resolve(shouldMuteListFromOptions);
        });
        spyOn(mockOptions, 'setShouldNotMuteList').and.callFake(async list => {
            setupList(true, list);
            return Promise.resolve();
        });
        spyOn(mockOptions, 'setShouldMuteList').and.callFake(async list => {
            setupList(false, list);
            return Promise.resolve();
        });

        mockUrlMatcher = {
            urlPatternMatch: function () { },
            isExactUrlInList: function () { },
            isDomainInList: function () { },
            urlsMatch: function () { },
            domainPattern: function () { }
        };

        spyOn(mockUrlMatcher, 'urlsMatch').and.callFake((a, b) => {
            return a === b;
        });

        expert = new ListExpert(mockOptions, mockUrlMatcher);
    });

    describe('isInList() ->', function () {

        it('Should return true for a value in the list', async function () {
            const urlToFind = 'http://www.hentschels.com';
            spyOn(mockUrlMatcher, 'urlPatternMatch').and.callFake((entry) => {
                return entry === urlToFind;
            });

            const list = [
                'notThisOne',
                'norThisOne',
                urlToFind,
                'anotherNonMatch'
            ];
            const found = await expert.isInList(list, urlToFind);
            expect(found).toBeTrue();
        });

        it('Should return false for a value not in the list', async function () {
            const urlToFind = 'http://www.hentschels.com';
            spyOn(mockUrlMatcher, 'urlPatternMatch').and.callFake((entry) => {
                return entry === urlToFind;
            });

            const list = [
                'notThisOne',
                'norThisOne',
                'anotherNonMatch'
            ];
            const found = await expert.isInList(list, urlToFind);
            expect(found).toBeFalse();
        });

    });

    describe('isExactMatchInList() ->', function () {

        it('Should return true for a value in the list', async function () {
            const urlToFind = 'http://www.hentschels.com';
            spyOn(mockUrlMatcher, 'isExactUrlInList').and.callFake((list, url) => {
                return list.includes(url);
            });

            const list = [
                'notThisOne',
                'norThisOne',
                urlToFind,
                'anotherNonMatch'
            ];
            setupList(true, list);

            const found = await expert.isExactMatchInList(urlToFind);
            expect(found).toBeTrue();
        });

        it('Should return false for a value not in the list', async function () {
            const urlToFind = 'http://www.hentschels.com';
            spyOn(mockUrlMatcher, 'isExactUrlInList').and.callFake((list, url) => {
                return list.includes(url);
            });

            const list = [
                'notThisOne',
                'norThisOne',
                'anotherNonMatch'
            ];
            setupList(true, list);

            const found = await expert.isExactMatchInList(urlToFind);
            expect(found).toBeFalse();
        });

    });

    describe('isDomainInList() ->', function () {

        it('Should return true for a value in the list', async function () {
            const urlToFind = 'http://www.hentschels.com';
            spyOn(mockUrlMatcher, 'isDomainInList').and.callFake((list, url) => {
                return list.includes(url);
            });

            const list = [
                'notThisOne',
                'norThisOne',
                urlToFind,
                'anotherNonMatch'
            ];
            setupList(true, list);

            const found = await expert.isDomainInList(urlToFind);
            expect(found).toBeTrue();
        });

        it('Should return false for a value not in the list', async function () {
            const urlToFind = 'http://www.hentschels.com';
            spyOn(mockUrlMatcher, 'isDomainInList').and.callFake((list, url) => {
                return list.includes(url);
            });

            const list = [
                'notThisOne',
                'norThisOne',
                'anotherNonMatch'
            ];
            setupList(true, list);

            const found = await expert.isDomainInList(urlToFind);
            expect(found).toBeFalse();
        });

    });

    describe('getListInfo() ->', function () {

        it('Should return a "should not mute" list properly', async function () {
            setupList(true, ['urlA', 'urlB', 'urlC', 'urlD']);

            const listInfo = await expert.getListInfo();
            expect(listInfo.isListOfPagesToMute).toBeFalse();
            expect(listInfo.listOfPages.length).toBe(4);
            expect(listInfo.listOfPages[2]).toBe('urlC');
        });

        it('Should return a "should mute" list properly', async function () {
            setupList(false, ['urlA', 'urlB', 'urlC']);

            const listInfo = await expert.getListInfo();
            expect(listInfo.isListOfPagesToMute).toBeTrue();
            expect(listInfo.listOfPages.length).toBe(3);
            expect(listInfo.listOfPages[1]).toBe('urlB');
        });

    });

    describe('addOrRemoveUrlInList() ->', function () {

        it('Should add a url to a list if it is not there', async function () {
            spyOn(mockUrlMatcher, 'isExactUrlInList').and.callFake((list, url) => {
                return list.includes(url);
            });
            setupList(true, ['urlA', 'urlB', 'urlC']);

            const result = await expert.addOrRemoveUrlInList('urlD');
            const newListInfo = await expert.getListInfo();

            expect(result).toBeTrue();
            expect(newListInfo.listOfPages.length).toBe(4);
            expect(newListInfo.listOfPages).toContain('urlD');
        });

        it('Should remove a url from a list if it is already there', async function () {
            spyOn(mockUrlMatcher, 'isExactUrlInList').and.callFake((list, url) => {
                return list.includes(url);
            });
            setupList(true, ['urlA', 'urlB', 'urlC', 'urlD']);

            const result = await expert.addOrRemoveUrlInList('urlD');
            const newListInfo = await expert.getListInfo();

            expect(result).toBeFalse();
            expect(newListInfo.listOfPages.length).toBe(3);
            expect(newListInfo.listOfPages).not.toContain('urlD');
        });

    });

    describe('addOrRemoveDomainInList() ->', function () {

        it('Should add a domain to a list if it is not there', async function () {
            spyOn(mockUrlMatcher, 'isDomainInList').and.callFake((list, url) => {
                return list.includes(url);
            });
            spyOn(mockUrlMatcher, 'domainPattern').and.returnValue('domD');
            setupList(true, ['urlA', 'urlB', 'urlC']);

            const result = await expert.addOrRemoveDomainInList('urlD');
            const newListInfo = await expert.getListInfo();

            expect(result).toBeTrue();
            expect(newListInfo.listOfPages.length).toBe(4);
            expect(newListInfo.listOfPages).toContain('domD');
        });

        it('Should remove a domain from a list if it is already there', async function () {
            spyOn(mockUrlMatcher, 'isDomainInList').and.callFake((list, url) => {
                return list.includes(url);
            });
            spyOn(mockUrlMatcher, 'domainPattern').and.returnValue('domD');
            setupList(true, ['urlA', 'urlB', 'urlC', 'domD']);

            const result = await expert.addOrRemoveDomainInList('urlD');
            const newListInfo = await expert.getListInfo();

            expect(result).toBeFalse();
            expect(newListInfo.listOfPages.length).toBe(3);
            expect(newListInfo.listOfPages).not.toContain('domD');
        });

    });

});
