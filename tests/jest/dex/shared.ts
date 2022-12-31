import { expect } from '@jest/globals';
import Dex, { InvalidQueryArgsError } from '../../../src/objects/dex';
import { CHAIN_FLAG, IFlag, FLAGS } from '../../../src/objects/queries/flags';
import { QueryResults, IQueryResult, IQuery } from '../../../src/objects/queries/queries';
import { IReadOnlyDex } from '../../../src/objects/readonly';
import { IEntry } from '../../../src/objects/subsets/entries';
import { ITag } from '../../../src/objects/subsets/tags';
import { isArray, isObject } from '../../../src/utilities/validators';

function temp() {
  const dex = new Dex<string>();
  const _1 = dex.select.not("strictly-without-this-tag");
  const _2 = dex.query("strictly-with-this-tag");
  const _2_1 = dex.query(FLAGS.FIRST, "strictly-with-this-tag");
  const _3 = dex.select.not.or("not-this", "or-this");
  const _3_1 = dex.select.not.or(FLAGS.FIRST, "not-this", "or-this");
  const _3_2 = dex.select.not.not(FLAGS.FIRST, "not-this", "or-this");
  const _3_3 = dex.select.not.not("not-this", "or-this");
  const _4 = dex.query([CHAIN_FLAG], "without-this").select("with-this-though")
  const _4_3 = dex.query(CHAIN_FLAG, "without-this").select("with-this-though")
  const _4_1 = dex.query([FLAGS.CHAIN], FLAGS.OR, "this", "or-this").first("one-that-has-this")
  const _5 = dex.select.not(FLAGS.CHAIN, "without-this").and("with-this-though");
  //const _6 = dex.select.not(FLAGS.FIRST, "without-this").and("this should be an error");
  const f_1 = dex.tags.of("eNTRY ID 1");
  const entries = dex.map.entries();
  const tags = dex.map.tags();
  const toObjects = dex.map.tags();
  const mapObject = dex.map();

  const object = {};
  dex.for.entries((entry, tags) => {
    // things
  });
}


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

export function expect_queryFunctionTestCaseSuccess<
  TEntry extends IEntry,
  TDexEntry extends IEntry | TEntry,
  TDex extends IReadOnlyDex<TDexEntry>,
  TValidFlags extends IFlag,
  TDefaultResult extends QueryResults<TEntry, TDexEntry> = IQueryResult<TEntry, TValidFlags, TDexEntry>,
>(dex: TDex, queryMethod: IQuery<TEntry, TValidFlags, TDexEntry, TDefaultResult>, test: QueryTestCase) {
  if (test.debug) {
    debugger;
  }

  const method = queryMethod.bind(dex);

  // error case
  if (test.throws) {
    expect(() => method(...(test.args as [any, any])))
      .toThrowError(test.throws);
  } // success case
  else {
    const result = method(...(test.args as [any, any]));

    if (!test.instanceof) {
      expect(isArray(result)).toStrictEqual(true);
      test.expected.forEach(expected => {
        expect((result as { key: number }[])
          .find(e => e.key === expected!.key)
        ).toStrictEqual(expected);
      });
    } else if (test.instanceof === Dex) {
      expect(result).toBeInstanceOf(Dex);
      test.expected.forEach(expected => {
        const found = (result as Dex<{ key: number }>)
          .entries
          .first(e => e.key === expected!.key);

        expect(found).toStrictEqual(expected);
      });
    } else if (isObject(test.instanceof)) {
      if (test.expected[0] === undefined) {
        expect(result).toBeUndefined();
      } else {
        expect(result).toBeInstanceOf(Object);
        expect(result).toHaveProperty("key");
        expect((result as { key: number }).key)
          .toStrictEqual(test.expected[0].key);
      }
    }
  }
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
  tag: ITag
) => {
  expect(dex.tags.has(tag)).toBeTruthy();
  expect(dex.count(tag)).toStrictEqual(0);
  expect(dex.entries(tag)).toStrictEqual([]);
}

export const expectDex_entryHasNoTags = (
  dex: Dex<any>,
  entry: IEntry
) => {
  const hash = dex.hash(entry)!;

  expect(dex.hashes.has(hash)).toBeTruthy();
  expect(dex.tags.of(hash)).toStrictEqual([]);
  expect(dex.tags.of(hash)!.length).toStrictEqual(0);
}

export const expectDex_entryToHaveTags = (
  dex: Dex<any>,
  entry: any,
  tags: ITag[]
) => {
  const tagsForEntry = dex.tags.of(entry)!;

  expect(tagsForEntry.length).toStrictEqual(tags.length);
  tags.forEach(tag =>
    expect(tagsForEntry).toContain(tag));
}

export const expectDex_tagsToHaveEntries = (
  dex: Dex<any>,
  tag: ITag,
  entries: IEntry[]
) => {
  const hashesForTag = dex.keys(tag);
  expect(hashesForTag.length).toStrictEqual(entries.length);
  entries.map(dex.hash.bind(dex)).forEach(hash =>
    expect(hashesForTag).toContain(hash));
}