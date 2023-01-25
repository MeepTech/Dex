import Dex from "../../../src/objects/dexes/dex";
import { buildSimpleMockDex, expectDex_toContainTheSameAsDex } from "./shared";
import { ArchiDex } from "../../../src/objects/dexes/read";

const {
  dex,
  tags: [tag, tag2, tag3, tag4, tag5, tag6, tag7],
  entries: [entry, entry2, entry3, entry4, entry5],
  hashes: [hash, hash2, hash3, hash4, hash5]
} = buildSimpleMockDex();

test("copy() => copyOf(facade)", () => {
  const copy = dex.copy();

  expect(copy).toBeInstanceOf(Dex);
  expectDex_toContainTheSameAsDex(dex, copy);
})
test("copy.sealed() => copyOf(facade) & instanceof(ArchiDex)", () => {
  const copy = dex.copy.sealed();

  expect(copy).toBeInstanceOf(ArchiDex);
  expectDex_toContainTheSameAsDex(dex, copy);
})