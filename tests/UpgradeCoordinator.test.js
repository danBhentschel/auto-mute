import { jest } from "@jest/globals";

import UpgradeCoordinator from "../extension/UpgradeCoordinator";

it("should instantiate UpgradeCoordinator", () => {
  expect(UpgradeCoordinator).toBeDefined();
});

describe("upgrade()", () => {
  it("should remove white and black lists, selecting whitelist", async () => {
    let storage = {
      enabled: true,
      whitelist: "www.youtube.com\ngoogle.com",
      blacklist: "www.facebook.com",
      usingWhitelist: true,
    };

    const chrome = {
      storage: {
        sync: {
          getKeys: () => Promise.resolve(Object.keys(storage)),
          get: async (keys) => {
            if (Array.isArray(keys)) {
              return keys.reduce((acc, key) => {
                acc[key] = storage[key];
                return acc;
              }, {});
            }
            return storage[keys];
          },
          remove: async (keys) => {
            if (Array.isArray(keys)) {
              keys.forEach((key) => {
                delete storage[key];
              });
            } else {
              delete storage[keys];
            }
          },
          set: (data) => {
            storage = { ...storage, ...data };
          },
        },
      },
    };
    const logger = jest.fn();
    const upgradeCoordinator = new UpgradeCoordinator(chrome, logger);

    await upgradeCoordinator.upgrade();

    expect(storage).toMatchInlineSnapshot(`
{
  "allowOrBlockList": "www.youtube.com
google.com",
  "enabled": true,
  "usingAllowList": true,
}
`);
  });

  it("should remove white and black lists, selecting blacklist", async () => {
    let storage = {
      enabled: true,
      whitelist: "www.youtube.com\ngoogle.com",
      blacklist: "www.facebook.com",
      usingWhitelist: false,
    };

    const chrome = {
      storage: {
        sync: {
          getKeys: () => Promise.resolve(Object.keys(storage)),
          get: async (keys) => {
            if (Array.isArray(keys)) {
              return keys.reduce((acc, key) => {
                acc[key] = storage[key];
                return acc;
              }, {});
            }
            return storage[keys];
          },
          remove: async (keys) => {
            if (Array.isArray(keys)) {
              keys.forEach((key) => {
                delete storage[key];
              });
            } else {
              delete storage[keys];
            }
          },
          set: (data) => {
            storage = { ...storage, ...data };
          },
        },
      },
    };
    const logger = jest.fn();
    const upgradeCoordinator = new UpgradeCoordinator(chrome, logger);

    await upgradeCoordinator.upgrade();

    expect(storage).toMatchInlineSnapshot(`
{
  "allowOrBlockList": "www.facebook.com",
  "enabled": true,
  "usingAllowList": false,
}
`);
  });
});
