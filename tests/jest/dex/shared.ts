import { expect } from '@jest/globals';
import Dex from '../../../src/objects/dexes/dex';
import { IReadableDex } from '../../../src/objects/dexes/read';
import Queries from '../../../src/objects/queries/queries';
import { ResultType } from '../../../src/objects/queries/results';
import { Entry } from '../../../src/objects/subsets/entries';
import { Tag } from '../../../src/objects/subsets/tags';

export function buildSimpleMockDex() {
  // entries
  const entry = { key: 1 };
  const entry2 = { key: 2 };
  const entry3 = { key: 3 };
  const entry4 = { key: 4 };
  const entry5 = { key: 5 };

  // tags
  /**
   * entry
   */
  const tag = "tag";

  /**
   * entry, entry2
   */
  const tag2 = "tag2";

  /**
   * entry2, entry3, entry4
   */
  const tag3 = "tag3";

  /**
   * entry4
   */
  const tag4 = "tag4";

  /**
   * empty tag
   */
  const tag5 = "tag5";

  /**
   * tag not added to dex
   */
  const tag6 = "tag6";

  /**
   * entry2, entry3
   */
  const tag7 = "tag7";

  // dex
  const dex = new Dex<{ key: number }>();
  const hash = dex.add(entry, tag, tag2);
  const hash2 = dex.add(entry2, tag2, tag3, tag7);
  const hash3 = dex.add(entry3, tag3, tag7);
  const hash4 = dex.add(entry4, tag3, tag4);
  const hash5 = dex.add(entry5, []);
  dex.set(tag5);

  return {
    dex,
    tags: [tag, tag2, tag3, tag4, tag5, tag6, tag7],
    entries: [entry, entry2, entry3, entry4, entry5],
    hashes: [hash, hash2, hash3, hash4, hash5]
  }
}

export const expectDex_countsToEqual = (
  dex: IReadableDex<any>,
  entries: number,
  tags: number
) => {
  expect(dex.numberOfEntries).toStrictEqual(entries);
  expect(dex.numberOfTags).toStrictEqual(tags);
  expect(dex.entries.length).toStrictEqual(entries);
  expect(dex.entries.size).toStrictEqual(entries);
  expect(dex.hashes.count).toStrictEqual(entries);
  expect(dex.hashes.size).toStrictEqual(entries);
  expect(dex.tags.count).toStrictEqual(tags);
  expect(dex.tags.size).toStrictEqual(tags);
  expect(dex.tags.length).toStrictEqual(tags);
}

export const expectDex_toContainTheSameAsDex = (
  original: IReadableDex<any>,
  newDex: IReadableDex<any>
) => {
  expectDex_countsToEqual(
    newDex,
    original.numberOfEntries,
    original.numberOfTags
  );
  original.entries.forEach(e => 
    expectDex_entryToHaveTags(newDex, e, original.tags(e)))
}

export const expectDex_tagIsEmpty = (
  dex: IReadableDex<any>,
  tag: Tag
) => {
  expect(dex.tags.has(tag)).toBeTruthy();
  expect(dex.count(tag)).toStrictEqual(0);
  expect(dex.entries(tag)).toStrictEqual([]);
}

export const expectDex_entryHasNoTags = (
  dex: IReadableDex<any>,
  entry: Entry
) => {
  const hash = dex.hash(entry)!;

  expect(dex.hashes.has(hash)).toBeTruthy();
  expect(dex.tags.of(hash)).toBeInstanceOf(Set);
  expect(dex.tags.of(hash)!.size).toStrictEqual(0);
}

export const expectDex_entryToHaveTags = (
  dex: IReadableDex<any>,
  entry: any,
  tags: Tag[] | Set<Tag>
) => {
  const tagsForEntry = dex.tags.of(entry)!;

  expect(tagsForEntry.size).toStrictEqual([...tags].length);
  tags.forEach(tag =>
    expect(tagsForEntry).toContain(tag));
}

export const expectDex_tagsToHaveEntries = (
  dex: IReadableDex<any>,
  tag: Tag,
  entries: Entry[] | Set<Tag>
) => {
  const hashesForTag = dex.keys(tag);
  entries = [...entries];
  expect(hashesForTag.size).toStrictEqual(entries.length);
  entries.map(dex.hash.bind(dex)).forEach(hash =>
    expect(hashesForTag).toContain(hash));
}

export function fail_fromType(type: ObjectConstructor | any, result: any) {
  fail(`Type of result: ${typeof (result?.constructor ?? result)} is not equal to expected: ${type}.`)
}

/**
 * This function is here to observe for ts errors in the auto-mapping of ResultType. It should not be run.
 */
function ___test_ts_resultTypes() {
  const testQuery: Queries.Full<{}, ResultType.Array, string> = {} as any;

  const _1 = testQuery(["a", "e", 1, 5]);
  const _2 = testQuery(["a", "e", 1, 5], ResultType.Dex);
  const _3 = testQuery(ResultType.Set, { and: ["one", "two"] });
  const _3_1 = testQuery(ResultType.First, { and: ["one", "two"] });
  const _4 = testQuery({ and: ["one", "two"] }, ResultType.First);
  const _5 = testQuery({ and: ["one", "two"] }, { not: { hashes: ["ID:KW$#kj3tijergwigg"] } });
  const _6 = testQuery({ not: { hashes: ["ID:KW$#kj3tijergwigg"] } });
}