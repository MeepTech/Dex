import { Config, InDex, IndexedConfig, NoisyDex } from "../../../src/lib"
import { describe, test, expect } from '@jest/globals';
import { buildSimpleMockDex } from "./shared";
import { ReadOnlyDex } from '../../../src/objects/dexes/read';

type TestEntry = {
  key: number;
};

// mocks
const {
  dex,
  tags: [tag, tag2, tag3, tag4, tag5, tag6, tag7],
  entries: [entry, entry2, entry3, entry4, entry5],
  hashes: [hash, hash2, hash3, hash4, hash5]
} = buildSimpleMockDex();

const entry6 = { key: 6 };

describe("[...]", () => {
  test("[IndexKey] = Entry => Entry", () => {
    const index = new InDex(dex);

    expect(index["test"] = entry6).toStrictEqual(entry6);
  });
  test("[IndexKey] => Entry", () => {
    const index = new InDex(dex);

    index["test"] = entry6;
    expect(index["test"]).toStrictEqual(entry6);
  });
  test(".IndexKey => Entry", () => {
    const index = new InDex(dex);

    index["test"] = entry6;
    expect((index as any).test).toStrictEqual(entry6);
  });
  test(".IndexKey = Entry => Entry", () => {
    const index = new InDex(dex);

    (index as any).test = entry6;
    expect(index["test"]).toStrictEqual(entry6);
  });
  describe("[MethodKey] => Method", () => {
    
  });
  describe("[HiddenMethodKey] => undefined", () => {
    
  });
})

describe("constructor(...)", () => {
  test("(Dex, {indexGenerator})", () => {
    const indexGenerator = (entry: TestEntry) => entry.key;
    const index = new InDex(dex, { indexGenerator });

    expect(index[0]).toBeUndefined();
    expect(index[1]).toStrictEqual(entry);
    expect(index["3"]).toStrictEqual(entry3);
    expect(index[3]).toStrictEqual(entry3);
    expect(index["4"]).toStrictEqual(entry4);
    expect(index[5]).toStrictEqual(entry5);
  });
  test("(NoisyDex, {indexGenerator})", () => {
    const indexGenerator = (entry: TestEntry) => entry.key;

    const base = new NoisyDex<TestEntry>();
    const index = new InDex(base, { indexGenerator });

    expect(index[0]).toBeUndefined();
  });
  test("(ReadOnlyDex, {indexGenerator})", () => {
    const indexGenerator = (entry: TestEntry) => entry.key;
    const index = new InDex(dex as ReadOnlyDex<TestEntry>, { indexGenerator });
    
    expect(index[0]).toBeUndefined();
  });
});
describe(".#indexGuard", () => {

});
describe(".#indexGenerator", () => {

});