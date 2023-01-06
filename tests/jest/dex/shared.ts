import { expect } from '@jest/globals';
import Dex from '../../../src/objects/dex';
import { FullQuery } from '../../../src/objects/queries/queries';
import { ResultType } from '../../../src/objects/queries/results';
import { Entry } from '../../../src/objects/subsets/entries';
import { Tag } from '../../../src/objects/subsets/tags';

/**
 * A test case for Find.
 */
export type QueryTestCase = {

  /**
   * The names of the types of the params.
   */
  params: string[],

  /**
   * The args to pass in
   */
  args: [...any],

  /**
   * The expected entries returned
   */
  expected: ({ key: number } | undefined)[],

  /**
   * The text to print for what the test should return.
   */
  results: string,

  /**
   * Any extra context for this test
   */
  extraContext?: any[],

  /**
   * If this test returns a dex instead of an array of items.
   */
  instanceof?: Dex | {},

  /**
   * Make sure it throws a given error.
   */
  throws?: Error;

  /**
   * if true, the debugger will trip at the start of this test.
   */
  debug?: boolean 
}

export const expectDex_countsToEqual = (
  dex: Dex<any>,
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

export const expectDex_tagIsEmpty = (
  dex: Dex<any>,
  tag: Tag
) => {
  expect(dex.tags.has(tag)).toBeTruthy();
  expect(dex.count(tag)).toStrictEqual(0);
  expect(dex.entries(tag)).toStrictEqual([]);
}

export const expectDex_entryHasNoTags = (
  dex: Dex<any>,
  entry: Entry
) => {
  const hash = dex.hash(entry)!;

  expect(dex.hashes.has(hash)).toBeTruthy();
  expect(dex.tags.of(hash)).toBeInstanceOf(Set);
  expect(dex.tags.of(hash)!.size).toStrictEqual(0);
}

export const expectDex_entryToHaveTags = (
  dex: Dex<any>,
  entry: any,
  tags: Tag[]
) => {
  const tagsForEntry = dex.tags.of(entry)!;

  expect(tagsForEntry.size).toStrictEqual(tags.length);
  tags.forEach(tag =>
    expect(tagsForEntry).toContain(tag));
}

export const expectDex_tagsToHaveEntries = (
  dex: Dex<any>,
  tag: Tag,
  entries: Entry[]
) => {
  const hashesForTag = dex.keys(tag);
  expect(hashesForTag.size).toStrictEqual(entries.length);
  entries.map(dex.hash.bind(dex)).forEach(hash =>
    expect(hashesForTag).toContain(hash));
}

export function failFromType(type: ObjectConstructor | any, result: any) {
  fail(`Type of result: ${typeof (result?.constructor ?? result)} is not equal to expected: ${type}.`)
}

/**
 * This function is here to observe for ts errors in the auto-mapping of ResultType. It should not be run.
 */
function ___test_ts_resultTypes() {
  const testQuery: FullQuery<{}, ResultType.Array, string> = {} as any;

  const _1 = testQuery(["a", "e", 1, 5]);
  const _2 = testQuery(["a", "e", 1, 5], ResultType.Dex);
  const _3 = testQuery(ResultType.Set, { and: ["one", "two"] });
  const _3_1 = testQuery(ResultType.First, { and: ["one", "two"] });
  const _4 = testQuery({ and: ["one", "two"] }, ResultType.First);
  const _5 = testQuery({ and: ["one", "two"] }, { not: { hashes: ["ID:KW$#kj3tijergwigg"] } });
  const _6 = testQuery({ not: { hashes: ["ID:KW$#kj3tijergwigg"] } });
}