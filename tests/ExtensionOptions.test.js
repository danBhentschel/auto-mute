import { jest } from "@jest/globals";

import ExtensionOptions from "../extension/ExtensionOptions";

it("should instantiate ExtensionOptions", () => {
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

  it("should return the enabled value from storage", async () => {
    storage.enabled = false;
    let enabled = await options.getEnabled();
    expect(mockChrome.storage.sync.get).toHaveBeenCalled();
    expect(enabled).toBe(false);

    storage.enabled = true;
    enabled = await options.getEnabled();
    expect(enabled).toBe(true);
  });

  it("should return a default enabled value of `true` from storage", async () => {
    const enabled = await options.getEnabled();
    expect(mockChrome.storage.sync.get).toHaveBeenCalled();
    expect(enabled).toBe(true);
  });

  it("should properly handle rejected promise when getting enabled value", async () => {
    shouldThrow = true;
    await expect(options.getEnabled()).rejects.toThrow("Test error");
  });

  it("should return the type of list from storage", async () => {
    storage.usingAllowList = false;
    let usingAllowAudioList = await options.getUsingAllowAudioList();
    expect(mockChrome.storage.sync.get).toHaveBeenCalled();
    expect(usingAllowAudioList).toBe(false);

    storage.usingAllowList = true;
    usingAllowAudioList = await options.getUsingAllowAudioList();
    expect(usingAllowAudioList).toBe(true);
  });

  it("should return a default list type of 'allow audio' from storage", async () => {
    const usingAllowAudioList = await options.getUsingAllowAudioList();
    expect(mockChrome.storage.sync.get).toHaveBeenCalled();
    expect(usingAllowAudioList).toBe(true);
  });

  it("should properly handle rejected promise when getting list type", async () => {
    shouldThrow = true;
    await expect(options.getUsingAllowAudioList()).rejects.toThrow(
      "Test error"
    );
  });

  it("should return the 'allow/block audio' list from storage", async () => {
    storage.allowOrBlockList = "urlA\nurlB\nurlC";
    const list = await options.getAllowOrBlockAudioList();
    expect(mockChrome.storage.sync.get).toHaveBeenCalled();
    expect(list).toHaveLength(3);
    expect(list[0]).toBe("urlA");
    expect(list[1]).toBe("urlB");
    expect(list[2]).toBe("urlC");
  });

  it("should prune whitespace from the 'allow/block audio' list", async () => {
    storage.allowOrBlockList = "urlA\n\n\nurlB\n  \n urlC  ";
    const list = await options.getAllowOrBlockAudioList();
    expect(mockChrome.storage.sync.get).toHaveBeenCalled();
    expect(list).toHaveLength(3);
    expect(list[0]).toBe("urlA");
    expect(list[1]).toBe("urlB");
    expect(list[2]).toBe("urlC");
  });

  it("should return a default of an empty list for the 'allow/block audio' list in storage", async () => {
    const list = await options.getAllowOrBlockAudioList();
    expect(mockChrome.storage.sync.get).toHaveBeenCalled();
    expect(list).toHaveLength(0);
  });

  it("should properly handle rejected promise when getting 'allow/block audio' list", async () => {
    shouldThrow = true;
    await expect(options.getAllowOrBlockAudioList()).rejects.toThrow(
      "Test error"
    );
  });

  it("should set the 'allow/block audio' list contents in storage", async () => {
    await options.setAllowOrBlockAudioList(["urlAA", "urlBB", "urlCC"]);
    expect(mockChrome.storage.sync.set).toHaveBeenCalled();
    expect(storage.allowOrBlockList).toBe("urlAA\nurlBB\nurlCC");
  });

  it("should properly handle rejected promise when setting the 'allow/block audio' list", async () => {
    shouldThrow = true;
    await expect(
      options.setAllowOrBlockAudioList(["urlAA", "urlBB", "urlCC"])
    ).rejects.toThrow("Test error");
  });

  it("should toggle the list type in storage", async () => {
    await options.switchListType();
    expect(mockChrome.storage.sync.set).toHaveBeenCalled();
    expect(storage.usingAllowList).toBe(false);

    await options.switchListType();
    expect(storage.usingAllowList).toBe(true);

    await options.switchListType();
    expect(storage.usingAllowList).toBe(false);
  });

  it("should properly handle rejected promise when toggling list type", async () => {
    shouldThrow = true;
    await expect(options.switchListType()).rejects.toThrow("Test error");
  });
});
