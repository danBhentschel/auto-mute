import { jest } from "@jest/globals";

import ExtensionOptions from "../extension/ExtensionOptions";

test("Should instantiate ExtensionOptions", () => {
  expect(ExtensionOptions).toBeDefined();
});

describe("ExtensionOptions ->", () => {
  let mockChrome;
  let options;
  let storage = {};
  let shouldThrow = false;

  beforeEach(() => {
    mockChrome = {
      storage: {
        sync: {
          get: (values) => {},
          set: (values) => {},
        },
      },
    };

    jest.spyOn(mockChrome.storage.sync, "get").mockImplementation((values) => {
      if (shouldThrow) {
        return Promise.reject(new Error("Test error"));
      }
      for (const [key, value] of Object.entries(values)) {
        if (!Object.prototype.hasOwnProperty.call(storage, key)) {
          storage[key] = value;
        }
      }
      return Promise.resolve(storage);
    });

    jest.spyOn(mockChrome.storage.sync, "set").mockImplementation((values) => {
      if (shouldThrow) {
        return Promise.reject(new Error("Test error"));
      }
      for (const [key, value] of Object.entries(values)) {
        storage[key] = value;
      }
      return Promise.resolve();
    });

    options = new ExtensionOptions(mockChrome);
  });

  afterEach(() => {
    shouldThrow = false;
    storage = {};
  });

  test("should return the enabled value from storage", async () => {
    storage.enabled = false;
    let enabled = await options.getEnabled();
    expect(mockChrome.storage.sync.get).toHaveBeenCalled();
    expect(enabled).toBe(false);

    storage.enabled = true;
    enabled = await options.getEnabled();
    expect(enabled).toBe(true);
  });

  test("should return a default enabled value of `true` from storage", async () => {
    const enabled = await options.getEnabled();
    expect(mockChrome.storage.sync.get).toHaveBeenCalled();
    expect(enabled).toBe(true);
  });

  test("should properly handle rejected promise when getting enabled value", async () => {
    shouldThrow = true;
    await expect(options.getEnabled()).rejects.toThrow("Test error");
  });

  test("should return the useRegex value from storage", async () => {
    storage.useRegex = false;
    let useRegex = await options.getUseRegex();
    expect(mockChrome.storage.sync.get).toHaveBeenCalled();
    expect(useRegex).toBe(false);

    storage.useRegex = true;
    useRegex = await options.getUseRegex();
    expect(useRegex).toBe(true);
  });

  test("should return a default useRegex value of `false` from storage", async () => {
    const useRegex = await options.getUseRegex();
    expect(mockChrome.storage.sync.get).toHaveBeenCalled();
    expect(useRegex).toBe(false);
  });

  test("should properly handle rejected promise when getting useRegex value", async () => {
    shouldThrow = true;
    await expect(options.getUseRegex()).rejects.toThrow("Test error");
  });

  test("should return the type of list from storage", async () => {
    storage.usingWhitelist = false;
    let usingShouldNotMuteList = await options.getUsingShouldNotMuteList();
    expect(mockChrome.storage.sync.get).toHaveBeenCalled();
    expect(usingShouldNotMuteList).toBe(false);

    storage.usingWhitelist = true;
    usingShouldNotMuteList = await options.getUsingShouldNotMuteList();
    expect(usingShouldNotMuteList).toBe(true);
  });

  test("should return a default list type of 'should not mute' from storage", async () => {
    const usingShouldNotMuteList = await options.getUsingShouldNotMuteList();
    expect(mockChrome.storage.sync.get).toHaveBeenCalled();
    // Default is true as per the original test expectation
    expect(usingShouldNotMuteList).toBe(true);
  });

  test("should properly handle rejected promise when getting list type", async () => {
    shouldThrow = true;
    await expect(options.getUsingShouldNotMuteList()).rejects.toThrow(
      "Test error"
    );
  });

  test("should return the 'should not mute' list from storage", async () => {
    storage.whitelist = "urlA\nurlB\nurlC";
    const list = await options.getShouldNotMuteList();
    expect(mockChrome.storage.sync.get).toHaveBeenCalled();
    expect(list).toHaveLength(3);
    expect(list[0]).toBe("urlA");
    expect(list[1]).toBe("urlB");
    expect(list[2]).toBe("urlC");
  });

  test("should prune whitespace from the 'should not mute' list", async () => {
    storage.whitelist = "urlA\n\n\nurlB\n  \n urlC  ";
    const list = await options.getShouldNotMuteList();
    expect(mockChrome.storage.sync.get).toHaveBeenCalled();
    expect(list).toHaveLength(3);
    expect(list[0]).toBe("urlA");
    expect(list[1]).toBe("urlB");
    expect(list[2]).toBe("urlC");
  });

  test("should return a default of an empty list for the 'should not mute' list in storage", async () => {
    const list = await options.getShouldNotMuteList();
    expect(mockChrome.storage.sync.get).toHaveBeenCalled();
    expect(list).toHaveLength(0);
  });

  test("should properly handle rejected promise when getting 'should not mute' list", async () => {
    shouldThrow = true;
    await expect(options.getShouldNotMuteList()).rejects.toThrow("Test error");
  });

  test("should return the 'should mute' list from storage", async () => {
    storage.blacklist = "urlA\nurlB\nurlC";
    const list = await options.getShouldMuteList();
    expect(mockChrome.storage.sync.get).toHaveBeenCalled();
    expect(list).toHaveLength(3);
    expect(list[0]).toBe("urlA");
    expect(list[1]).toBe("urlB");
    expect(list[2]).toBe("urlC");
  });

  test("should prune whitespace from the 'should mute' list", async () => {
    storage.blacklist = "urlA\n\n\nurlB\n  \n urlC  ";
    const list = await options.getShouldMuteList();
    expect(mockChrome.storage.sync.get).toHaveBeenCalled();
    expect(list).toHaveLength(3);
    expect(list[0]).toBe("urlA");
    expect(list[1]).toBe("urlB");
    expect(list[2]).toBe("urlC");
  });

  test("should return a default of an empty list for the 'should mute' list in storage", async () => {
    const list = await options.getShouldMuteList();
    expect(mockChrome.storage.sync.get).toHaveBeenCalled();
    expect(list).toHaveLength(0);
  });

  test("should properly handle rejected promise when getting 'should mute' list", async () => {
    shouldThrow = true;
    await expect(options.getShouldMuteList()).rejects.toThrow("Test error");
  });

  test("should set the 'should not mute' list contents in storage", async () => {
    await options.setShouldNotMuteList(["urlAA", "urlBB", "urlCC"]);
    expect(mockChrome.storage.sync.set).toHaveBeenCalled();
    expect(storage.whitelist).toBe("urlAA\nurlBB\nurlCC");
  });

  test("should properly handle rejected promise when setting 'should not mute' list", async () => {
    shouldThrow = true;
    await expect(
      options.setShouldNotMuteList(["urlAA", "urlBB", "urlCC"])
    ).rejects.toThrow("Test error");
  });

  test("should set the 'should mute' list contents in storage", async () => {
    await options.setShouldMuteList(["urlAA", "urlBB", "urlCC"]);
    expect(mockChrome.storage.sync.set).toHaveBeenCalled();
    expect(storage.blacklist).toBe("urlAA\nurlBB\nurlCC");
  });

  test("should properly handle rejected promise when setting 'should mute' list", async () => {
    shouldThrow = true;
    await expect(
      options.setShouldMuteList(["urlAA", "urlBB", "urlCC"])
    ).rejects.toThrow("Test error");
  });

  test("should toggle the list type in storage", async () => {
    await options.switchListType();
    expect(mockChrome.storage.sync.set).toHaveBeenCalled();
    expect(storage.usingWhitelist).toBe(false);

    await options.switchListType();
    expect(storage.usingWhitelist).toBe(true);

    await options.switchListType();
    expect(storage.usingWhitelist).toBe(false);
  });

  test("should properly handle rejected promise when toggling list type", async () => {
    shouldThrow = true;
    await expect(options.switchListType()).rejects.toThrow("Test error");
  });
});
