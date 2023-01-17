import { describe, test, expect } from '@jest/globals';
import { AccessError } from '../../../src/objects/errors';
import { buildSimpleMockDex, expectDex_toContainTheSameAsDex } from './shared';
import { FaçaDex } from "../../../src/objects/dexes/facade";
import { ArchiDex } from '../../../src/objects/dexes/read';
import Dex from '../../../src/objects/dexes/dex';

// mocks
const {
  dex,
  tags: [tag, tag2, tag3, tag4, tag5, tag6, tag7],
  entries: [entry, entry2, entry3, entry4, entry5],
  hashes: [hash, hash2, hash3, hash4, hash5]
} = buildSimpleMockDex();

// tests
describe("[...]", () => {
  describe("[\"InternalDexSymbols...\"]", () => {
    test("[\"InternalDexSymbols._allTags\"] === undefined ", () => {
      const facade = new FaçaDex(dex);
      const symbol = Object.getOwnPropertySymbols(dex).filter(
        s => s.description === "_allTags"
      )[0];
      expect((facade as any)[symbol]).toBeUndefined();
    });
    test("[\"InternalDexSymbols._addNewEntry\"] ==== undefined ", () => {
      const facade = new FaçaDex(dex);
      const symbol = Object.getOwnPropertySymbols(dex).filter(
        s => s.description === "_addNewEntry"
      )[0];
      expect((facade as any)[symbol]).toBeUndefined();
    });
  });
  test("[set] === undefined & throws Error(undefined)", () => {
    const facade = new FaçaDex(dex);
    const test = (facade as any).set;
    
    expect(test).toBeUndefined();
    expect(() => {
      test("test");
    }).toThrowError(new Error("test is not a function"));
  });
  test("[any] = any throws AccessError", () => {
    const facade = new FaçaDex(dex);
    expect(() => (facade as any).testValue = "test")
      .toThrowError(new AccessError("Cannot call 'Set Property' on a Façade"));
  });
  test("delete [any] throws AccessError", () => {
    const facade = new FaçaDex(dex);
    expect(() => delete (facade as any)["first"])
      .toThrowError(new AccessError("Cannot call 'Delete Property' on a Façade"));
  });
});

describe("...(...)", () => {
  test("set(any) throws Error(undefined)", () => {
    const facade = new FaçaDex(dex);
    expect(() => {
      (facade as any).set("test");
    }).toThrowError(new Error("facade.set is not a function"));
  })
  test("set(any) throws Error(undefined)", () => {
    const facade = new FaçaDex(dex);
    expect(() => {
      (facade as any).set("test");
    }).toThrowError(new Error("facade.set is not a function"));
  })
  test("copy() => copyOf(facade)", () => {
    const facade = new FaçaDex(dex);
    const copy = facade.copy();

    expect(copy).toBeInstanceOf(Dex);
    expectDex_toContainTheSameAsDex(facade, copy);
  })
  test("copy.sealed() => copyOf(facade) & instanceOf(ArchiDex)", () => {
    const facade = new FaçaDex(dex);
    const copy = facade.copy.sealed();

    expect(copy).toBeInstanceOf(ArchiDex);
    expectDex_toContainTheSameAsDex(facade, copy);
  })
  test("copy.from(any) throws Error(undefined)", () => {
    const facade = new FaçaDex(dex);
    expect(() => {
      (facade.copy as any).from(dex);
    }).toThrowError(new Error("facade.copy.from is not a function"));
  })
})

describe("Object...(this, ...)", () => {
  test("Object.defineProperty(this, ...any) throws AccessError", () => {
    const facade = new FaçaDex(dex);
    expect(() => Object.defineProperty(facade, "test", { value: "test" }))
      .toThrowError(new AccessError("Cannot call 'Define Property' on a Façade"));
  });
  test("Object.setPrototypeOf(this, ...any) throws AccessError", () => {
    const facade = new FaçaDex(dex);
    expect(() => Object.setPrototypeOf(facade, Object.getPrototypeOf(dex)))
      .toThrowError(new AccessError("Cannot call 'Set Prototype' on a Façade"))
  });
});