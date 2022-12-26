import { describe, test } from '@jest/globals';
import Dex from '../../../src/objects/dex';
import { CHAIN_FLAG, FLAGS } from '../../../src/objects/queries/FLAGS';
import {
  expectDex_countsToEqual,
  expectDex_entryHasNoTags,
  expectDex_entryToHaveTags,
  expectDex_tagIsEmpty,
  expectDex_tagsToHaveEntries
} from './shared';

describe("constructor(...)", () => {
  const testTag = "test-tag";
  const testTag2 = "test-tag-2";
    
  test("() => Empty Dex", () => {
    const dex = new Dex<string>();
    expectDex_countsToEqual(dex, 0, 0);

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
    const _6 = dex.select.not(FLAGS.FIRST, "without-this").and("this should be an error");
    const f_1 = dex.tags.for("eNTRY ID 1");
    const entries = dex.map.entries();
    const tags = dex.map.tags();
    const toObjects = dex.map.tags();
    const mapObject = dex.map();

    const object = {};
    dex.for.entries((entry, tags) => {
      // things
    });
  });
  describe("(Tag[...])", () => {
    test("([Tag]) => Dex with just one empty Tag", () => {
      const dex = new Dex<string>([testTag]);

      expectDex_countsToEqual(dex, 0, 1);
      expectDex_tagIsEmpty(dex, testTag);
    });
    test("([Tag, Tag]) => Dex with multiple empty Tags", () => {
      const dex = new Dex<string>([testTag, testTag2]);

      expectDex_countsToEqual(dex, 0, 2);
      expectDex_tagIsEmpty(dex, testTag);
      expectDex_tagIsEmpty(dex, testTag2);
    });
  });
  describe("([TEntry, ...Tag[]][])", () => {
    test("([TEntry, Tag]) => Dex with one item with one tag", () => {
      const entry = {};
      const dex = new Dex<{}>([entry, testTag]);

      expectDex_countsToEqual(dex, 1, 1);
      expectDex_entryToHaveTags(dex, entry, [testTag]);
      expectDex_tagsToHaveEntries(dex, testTag, [entry]);
    });
    test("([TEntry, Tag, Tag]) => Dex with one item with multiple tags", () => {
      const entry = {};
      const dex = new Dex<{}>([entry, testTag, testTag2]);

      expectDex_countsToEqual(dex, 1, 2);
      expectDex_entryToHaveTags(dex, entry, [testTag, testTag2])
      expectDex_tagsToHaveEntries(dex, testTag, [entry]);
      expectDex_tagsToHaveEntries(dex, testTag2, [entry]);
    });
    test("([TEntry, Tag], [TEntry, Tag]) => Dex with muiliple item with one tag each", () => {
      const entry = {};
      const entry2 = {};
      const dex = new Dex<{}>([entry, testTag], [entry2, testTag2]);

      expectDex_countsToEqual(dex, 2, 2);
      expectDex_entryToHaveTags(dex, entry, [testTag])
      expectDex_entryToHaveTags(dex, entry2, [testTag2])
      expectDex_tagsToHaveEntries(dex, testTag, [entry]);
      expectDex_tagsToHaveEntries(dex, testTag2, [entry2]);
    });
    test("([TEntry, Tag], [TEntry, Tag, Tag]) => Dex with muiliple item with one tag or multiple tags", () => {
      const entry = {};
      const entry2 = {};
      const dex = new Dex<{}>([entry, testTag], [entry2, testTag, testTag2]);

      expectDex_countsToEqual(dex, 2, 2);
      expectDex_entryToHaveTags(dex, entry, [testTag])
      expectDex_entryToHaveTags(dex, entry2, [testTag, testTag2])
      expectDex_tagsToHaveEntries(dex, testTag, [entry, entry2]);
      expectDex_tagsToHaveEntries(dex, testTag2, [entry2]);
    });
    test("([TEntry, Tag, Tag], [TEntry, Tag, Tag]) => Dex with multiple items with multiple tags", () => {
      const entry = {};
      const entry2 = {};
      const dex = new Dex<{}>([entry, testTag, testTag2], [entry2, testTag, testTag2]);

      expectDex_countsToEqual(dex, 2, 2);
      expectDex_entryToHaveTags(dex, entry, [testTag, testTag2])
      expectDex_entryToHaveTags(dex, entry2, [testTag, testTag2])
      expectDex_tagsToHaveEntries(dex, testTag, [entry, entry2]);
      expectDex_tagsToHaveEntries(dex, testTag2, [entry, entry2]);
    });
    test("([[TEntry, Tag]]) => Dex with one item with one tag", () => {
      const entry = {};
      const dex = new Dex<{}>([[entry, testTag]]);

      expectDex_countsToEqual(dex, 1, 1);
      expectDex_entryToHaveTags(dex, entry, [testTag])
      expectDex_tagsToHaveEntries(dex, testTag, [entry]);
    });
    test("([[TEntry, Tag, Tag]]) => Dex with one item with multiple tags", () => {
      const entry = {};
      const dex = new Dex<{}>([[entry, testTag, testTag2]]);

      expectDex_countsToEqual(dex, 1, 2);
      expectDex_entryToHaveTags(dex, entry, [testTag, testTag2])
      expectDex_tagsToHaveEntries(dex, testTag, [entry]);
      expectDex_tagsToHaveEntries(dex, testTag2, [entry]);
    });
    test("([[TEntry, Tag], [TEntry, Tag]]) => Dex with muiliple item with one tag each", () => {
      const entry = {};
      const entry2 = {};
      const dex = new Dex<{}>([[entry, testTag], [entry2, testTag2]]);

      expectDex_countsToEqual(dex, 2, 2);
      expectDex_entryToHaveTags(dex, entry, [testTag])
      expectDex_entryToHaveTags(dex, entry2, [testTag2])
      expectDex_tagsToHaveEntries(dex, testTag, [entry]);
      expectDex_tagsToHaveEntries(dex, testTag2, [entry2]);
    });
    test("([[TEntry, Tag], [TEntry, Tag, Tag]]) => Dex with muiliple item with one tag or multiple tags", () => {
      const entry = {};
      const entry2 = {};
      const dex = new Dex<{}>([[entry, testTag], [entry2, testTag, testTag2]]);

      expectDex_countsToEqual(dex, 2, 2);
      expectDex_entryToHaveTags(dex, entry, [testTag])
      expectDex_entryToHaveTags(dex, entry2, [testTag, testTag2])
      expectDex_tagsToHaveEntries(dex, testTag, [entry, entry2]);
      expectDex_tagsToHaveEntries(dex, testTag2, [entry2]);
    });
    test("([[TEntry, Tag, Tag], [TEntry, Tag, Tag]]) => Dex with multiple items with multiple tags", () => {
      const entry = {};
      const entry2 = {};
      const dex = new Dex<{}>([[entry, testTag, testTag2], [entry2, testTag, testTag2]]);

      expectDex_countsToEqual(dex, 2, 2);
      expectDex_entryToHaveTags(dex, entry, [testTag, testTag2])
      expectDex_entryToHaveTags(dex, entry2, [testTag, testTag2])
      expectDex_tagsToHaveEntries(dex, testTag, [entry, entry2]);
      expectDex_tagsToHaveEntries(dex, testTag2, [entry, entry2]);
    });
  });
  describe("([TEntry, Tag[]][])", () => {
    test("([TEntry, [Tag]]) => Dex with one item with one tag", () => {
      const entry = {};
      const dex = new Dex<{}>([entry, [testTag]]);

      expectDex_countsToEqual(dex, 1, 1);
      expectDex_entryToHaveTags(dex, entry, [testTag])
      expectDex_tagsToHaveEntries(dex, testTag, [entry]);
    });
    test("([TEntry, [Tag, Tag]]) => Dex with one item with multiple tags", () => {
      const entry = {};
      const dex = new Dex<{}>([entry, [testTag, testTag2]]);

      expectDex_countsToEqual(dex, 1, 2);

      expectDex_entryToHaveTags(dex, entry, [testTag, testTag2])
      expectDex_tagsToHaveEntries(dex, testTag, [entry]);
      expectDex_tagsToHaveEntries(dex, testTag2, [entry]);
    });
    test("([[TEntry, [Tag]]]) => Dex with one item with one tag", () => {
      const entry = {};
      const dex = new Dex<{}>([[entry, [testTag]]]);

      expectDex_countsToEqual(dex, 1, 1);
      expectDex_entryToHaveTags(dex, entry, [testTag])
      expectDex_tagsToHaveEntries(dex, testTag, [entry]);
    });
    test("([[TEntry, [Tag, Tag]]]) => Dex with one item with multiple tags", () => {
      const entry = {};
      const dex = new Dex<{}>([[entry, [testTag, testTag2]]]);

      expectDex_countsToEqual(dex, 1, 2);

      expectDex_entryToHaveTags(dex, entry, [testTag, testTag2])
      expectDex_tagsToHaveEntries(dex, testTag2, [entry]);
    });
    test("([[TEntry1, [Tag1]], [TEntry1, [Tag2]]]) => Dex with one item with multiple tags, split into multiple array items", () => {
      const entry = {};
      const dex = new Dex<{}>([[entry, [testTag], [entry, [testTag2]]]]);

      expectDex_countsToEqual(dex, 1, 2);

      expectDex_entryToHaveTags(dex, entry, [testTag, testTag2])
      expectDex_tagsToHaveEntries(dex, testTag, [entry]);
      expectDex_tagsToHaveEntries(dex, testTag2, [entry]);
    });
    test("([TEntry1, [Tag]], [TEntry2, [Tag]]) => Dex with multiple items with one tag each", () => {
      const entry = {};
      const entry2 = {};
      const dex = new Dex<{}>([entry, [testTag]], [entry2, [testTag]]);

      expectDex_countsToEqual(dex, 2, 1);
      expectDex_entryToHaveTags(dex, entry, [testTag])
      expectDex_entryToHaveTags(dex, entry2, [testTag])
      expectDex_tagsToHaveEntries(dex, testTag, [entry, entry2]);
    });
    test("([TEntry, [Tag, Tag]], [TEntry, [Tag, Tag]]) => Dex with multiple items with multiple tags each", () => {
      const entry = {};
      const entry2 = {};
      const dex = new Dex<{}>([entry, [testTag, testTag2]], [entry2, [testTag, testTag2]]);

      expectDex_countsToEqual(dex, 2, 2);

      expectDex_entryToHaveTags(dex, entry, [testTag, testTag2])
      expectDex_entryToHaveTags(dex, entry, [testTag2, testTag2])
      expectDex_tagsToHaveEntries(dex, testTag, [entry, entry2]);
      expectDex_tagsToHaveEntries(dex, testTag2, [entry, entry2]);
    });
    test("([[TEntry, [Tag]], [TEntry, [Tag]]]) => Dex with multiple items with one tag each", () => {
      const entry = {};
      const entry2 = {};
      const dex = new Dex<{}>([[entry, [testTag]], [entry2, [testTag2]]]);

      expectDex_countsToEqual(dex, 2, 2);
      expectDex_entryToHaveTags(dex, entry, [testTag])
      expectDex_entryToHaveTags(dex, entry2, [testTag2])
      expectDex_tagsToHaveEntries(dex, testTag, [entry]);
      expectDex_tagsToHaveEntries(dex, testTag2, [entry2]);
    });
    test("([[TEntry, [Tag, Tag]], [TEntry, [Tag, Tag]]]) => Dex with multiple items with multiple tags each", () => {
      const entry = {};
      const entry2 = {};
      const dex = new Dex<{}>([[entry, [testTag, testTag2]], [entry2, [testTag, testTag2]]]);

      expectDex_countsToEqual(dex, 2, 2);

      expectDex_entryToHaveTags(dex, entry, [testTag, testTag2])
      expectDex_entryToHaveTags(dex, entry2, [testTag, testTag2])
      expectDex_tagsToHaveEntries(dex, testTag, [entry, entry2]);
      expectDex_tagsToHaveEntries(dex, testTag2, [entry, entry2]);
    });
  });
  describe("({...})", () => {
    describe("...{entry: TEntry}[]", () => {
      test("({entry: TEntry}) => Dex with only one entry with NO tags", () => {
        const entry = {};
        const dex = new Dex<{}>({ entry });

        expectDex_countsToEqual(dex, 1, 0);
        expectDex_entryHasNoTags(dex, entry);
      });
      test("({entry: TEntry}, {entry: TEntry}) => Dex with multiple entries with NO tags", () => {
        const entry = {};
        const entry2 = {};
        const dex = new Dex<{}>({ entry }, { entry: entry2 });

        expectDex_countsToEqual(dex, 2, 0);
        expectDex_entryHasNoTags(dex, entry);
        expectDex_entryHasNoTags(dex, entry2);
      });
    });
    describe("{entry: TEntry}[]", () => {
      test("([{entry: TEntry}]) => Dex with only entries with NO tags", () => {
        const entry = {};
        const dex = new Dex<{}>([{ entry }]);

        expectDex_countsToEqual(dex, 1, 0);
        expectDex_entryHasNoTags(dex, entry);
      });
      test("([{entry: TEntry}, {entry: TEntry}]) => Dex with only entries with NO tags", () => {
        const entry = {};
        const entry2 = {};
        const dex = new Dex<{}>([{ entry }, { entry: entry2 }]);

        expectDex_countsToEqual(dex, 2, 0);
        expectDex_entryHasNoTags(dex, entry);
        expectDex_entryHasNoTags(dex, entry2);
      });
    });
    describe("...{entry: TEntry, tag: Tag}[]", () => {
      test("({entry: TEntry, tag: Tag}) => Dex with only one entry with one tag", () => {
        const entry = {};
        const dex = new Dex<{}>({ entry, tag: testTag });

        expectDex_countsToEqual(dex, 1, 1);
        expectDex_tagsToHaveEntries(dex, testTag, [entry]);
        expectDex_entryToHaveTags(dex, entry, [testTag]);
      });
      test("({entry: TEntry, tag: Tag}, {entry: TEntry, tag: Tag}) => Dex with multiple entries with one tag each", () => {
        const entry = {};
        const entry2 = {};
        const dex = new Dex<{}>({ entry, tag: testTag }, { entry: entry2, tag: testTag2 });

        expectDex_countsToEqual(dex, 2, 2);
        expectDex_tagsToHaveEntries(dex, testTag, [entry]);
        expectDex_tagsToHaveEntries(dex, testTag2, [entry2]);
        expectDex_entryToHaveTags(dex, entry, [testTag]);
        expectDex_entryToHaveTags(dex, entry2, [testTag2]);
      });
    });
    describe("{entry: TEntry, tag: Tag}[]", () => {
      test("([{entry: TEntry, tag: Tag}]) => Dex with only one entry with one tag", () => {
        const entry = {};
        const dex = new Dex<{}>([{ entry, tag: testTag }]);

        expectDex_countsToEqual(dex, 1, 1);
        expectDex_tagsToHaveEntries(dex, testTag, [entry]);
        expectDex_entryToHaveTags(dex, entry, [testTag]);
      });
      test("([{entry: TEntry, tag: Tag}, {entry: TEntry, tag: Tag}]) => Dex with multiple entries with one tag each", () => {
        const entry = {};
        const entry2 = {};
        const dex = new Dex<{}>([{ entry, tag: testTag }, { entry: entry2, tag: testTag2 }]);

        expectDex_countsToEqual(dex, 2, 2);
        expectDex_tagsToHaveEntries(dex, testTag, [entry]);
        expectDex_tagsToHaveEntries(dex, testTag2, [entry2]);
        expectDex_entryToHaveTags(dex, entry, [testTag]);
        expectDex_entryToHaveTags(dex, entry2, [testTag2]);
      });
    });
    describe("{entry: TEntry, tags: Tag}[]", () => {
      test("([{entry: TEntry, tags: Tag}]) => Dex with only one entry with one tag", () => {
        const entry = {};
        const dex = new Dex<{}>([{ entry, tags: testTag }]);

        expectDex_countsToEqual(dex, 1, 1);
        expectDex_tagsToHaveEntries(dex, testTag, [entry]);
        expectDex_entryToHaveTags(dex, entry, [testTag]);
      });
      test("([{entry: TEntry, tags: Tag}, {entry: TEntry, tags: Tag}]) => Dex with multiple entries with one tag each", () => {
        const entry = {};
        const entry2 = {};
        const dex = new Dex<{}>([{ entry, tags: testTag }, { entry: entry2, tags: testTag2 }]);

        expectDex_countsToEqual(dex, 2, 2);
        expectDex_tagsToHaveEntries(dex, testTag, [entry]);
        expectDex_tagsToHaveEntries(dex, testTag2, [entry2]);
        expectDex_entryToHaveTags(dex, entry, [testTag]);
        expectDex_entryToHaveTags(dex, entry2, [testTag2]);
      });
    });
  });
  describe("...{entry: TEntry, tags: Tag}[]", () => {
    test("({entry: TEntry, tags: Tag}) => Dex with only one entry with one tag", () => {
      const entry = {};
      const dex = new Dex<{}>({ entry, tags: testTag });

      expectDex_countsToEqual(dex, 1, 1);
      expectDex_tagsToHaveEntries(dex, testTag, [entry]);
      expectDex_entryToHaveTags(dex, entry, [testTag]);
    });
    test("({entry: TEntry, tags: Tag}, {entry: TEntry, tags: Tag}) => Dex with multiple entries with one tag each", () => {
      const entry = {};
      const entry2 = {};
      const dex = new Dex<{}>({ entry, tags: testTag }, { entry: entry2, tags: testTag2 });

      expectDex_countsToEqual(dex, 2, 2);
      expectDex_tagsToHaveEntries(dex, testTag, [entry]);
      expectDex_tagsToHaveEntries(dex, testTag2, [entry2]);
      expectDex_entryToHaveTags(dex, entry, [testTag]);
      expectDex_entryToHaveTags(dex, entry2, [testTag2]);
    });
  });
  describe("{entry: TEntry, tags: Tag[]}[]", () => {
    test("([{entry: TEntry, tags: [Tag]}]) => Dex with only one entry with one tag", () => {
      const entry = {};
      const dex = new Dex<{}>([{ entry, tags: [testTag] }]);

      expectDex_countsToEqual(dex, 1, 1);
      expectDex_tagsToHaveEntries(dex, testTag, [entry]);
      expectDex_entryToHaveTags(dex, entry, [testTag]);
    });
    test("([{entry: TEntry, tags: [Tag]}, {entry: TEntry, tags: [Tag, Tag]}]) => Dex with multiple entries with one or multiple tags each", () => {
      const entry = {};
      const entry2 = {};
      const dex = new Dex<{}>([{ entry, tags: [testTag] }, { entry: entry2, tags: [testTag, testTag2] }]);

      expectDex_countsToEqual(dex, 2, 2);
      expectDex_tagsToHaveEntries(dex, testTag, [entry, entry2]);
      expectDex_tagsToHaveEntries(dex, testTag2, [entry2]);
      expectDex_entryToHaveTags(dex, entry, [testTag]);
      expectDex_entryToHaveTags(dex, entry2, [testTag2, testTag]);
    });
  });
  describe("...{entry: TEntry, tags: Tag[]}[]", () => {
    test("({entry: TEntry, tags: [Tag]}) => Dex with only one entry with one tag", () => {
      const entry = {};
      const dex = new Dex<{}>({ entry, tags: [testTag] });

      expectDex_countsToEqual(dex, 1, 1);
      expectDex_tagsToHaveEntries(dex, testTag, [entry]);
      expectDex_entryToHaveTags(dex, entry, [testTag]);
    });
    test("({entry: TEntry, tags: [Tag]}, {entry: TEntry, tags: [Tag, Tag]}) => Dex with multiple entries with one or multiple tags each", () => {
      const entry = {};
      const entry2 = {};
      const dex = new Dex<{}>({ entry, tags: [testTag] }, { entry: entry2, tags: [testTag, testTag2] });

      expectDex_countsToEqual(dex, 2, 2);
      expectDex_tagsToHaveEntries(dex, testTag, [entry, entry2]);
      expectDex_tagsToHaveEntries(dex, testTag2, [entry2]);
      expectDex_entryToHaveTags(dex, entry, [testTag]);
      expectDex_entryToHaveTags(dex, entry2, [testTag2, testTag]);
    });
  });
  describe("{entry: TEntry, tags: Set<Tag>}[]", () => {
    test("({entry: TEntry, tags: Set<Tag>}) => Dex with only one entry with one tag", () => {
      const entry = {};
      const dex = new Dex<{}>([{ entry, tags: new Set([testTag]) }]);

      expectDex_countsToEqual(dex, 1, 1);
      expectDex_tagsToHaveEntries(dex, testTag, [entry]);
      expectDex_entryToHaveTags(dex, entry, [testTag]);
    });
    test("({entry: TEntry, tags: Set<[Tag]>}, {entry: TEntry, tags: Set<[Tag, Tag]>}) => Dex with multiple entries with one or multiple tags each", () => {
      const entry = {};
      const entry2 = {};
      const dex = new Dex<{}>([{ entry, tags: new Set([testTag]) }, { entry: entry2, tags: new Set([testTag, testTag2]) }]);

      expectDex_countsToEqual(dex, 2, 2);
      expectDex_tagsToHaveEntries(dex, testTag, [entry, entry2]);
      expectDex_tagsToHaveEntries(dex, testTag2, [entry2]);
      expectDex_entryToHaveTags(dex, entry, [testTag]);
      expectDex_entryToHaveTags(dex, entry2, [testTag2, testTag]);
    });
  });
  describe("...{entry: TEntry, tags: Set<Tag>}[]", () => {
    test("({entry: TEntry, tags: Set<Tag>}) => Dex with only one entry with one tag", () => {
      const entry = {};
      const dex = new Dex<{}>({ entry, tags: new Set([testTag]) });

      expectDex_countsToEqual(dex, 1, 1);
      expectDex_tagsToHaveEntries(dex, testTag, [entry]);
      expectDex_entryToHaveTags(dex, entry, [testTag]);
    });
    test("({entry: TEntry, tags: Set<[Tag]>}, {entry: TEntry, tags: Set<[Tag, Tag]>}) => Dex with multiple entries with one or multiple tags each", () => {
      const entry = {};
      const entry2 = {};
      const dex = new Dex<{}>({ entry, tags: new Set([testTag]) }, { entry: entry2, tags: new Set([testTag, testTag2]) });

      expectDex_countsToEqual(dex, 2, 2);
      expectDex_tagsToHaveEntries(dex, testTag, [entry, entry2]);
      expectDex_tagsToHaveEntries(dex, testTag2, [entry2]);
      expectDex_entryToHaveTags(dex, entry, [testTag]);
      expectDex_entryToHaveTags(dex, entry2, [testTag2, testTag]);
    });
  });
  describe("...{entry: TEntry, tags: Tag[], tag: Tag}[]", () => {
    test("({entry: TEntry, tags: [Tag]}) => Dex with only one entry with one tag. Picking the tags field over the tag field.", () => {
      const entry = {};
      const dex = new Dex<{}>({ entry, tags: [testTag], tag: testTag2 });

      expectDex_countsToEqual(dex, 1, 1);
      expectDex_tagsToHaveEntries(dex, testTag, [entry]);
      expectDex_entryToHaveTags(dex, entry, [testTag]);
    });
    test("({entry: TEntry, tags: [Tag], tag: Tag}, {entry: TEntry, tags: [Tag, Tag], tag}) => Dex with multiple entries with one or multiple tags each. Picking the tags field over the tag field.", () => {
      const entry = {};
      const entry2 = {};
      const dex = new Dex<{}>({ entry, tags: [testTag], tag: testTag2 }, { entry: entry2, tags: [testTag2], tag: testTag });

      expectDex_countsToEqual(dex, 2, 2);
      expectDex_tagsToHaveEntries(dex, testTag, [entry]);
      expectDex_tagsToHaveEntries(dex, testTag2, [entry2]);
      expectDex_entryToHaveTags(dex, entry, [testTag]);
      expectDex_entryToHaveTags(dex, entry2, [testTag2]);
    });
  });
  test("(Map<TEntry, Tag[]>) => Dex made of Map Entries", () => {
    const entry = {};
    const entry2 = {};
    const map = new Map<{}, Tag[]>();

    map.set(entry, [testTag]);
    map.set(entry2, [testTag, testTag2]);

    const dex = new Dex<{}>(map);

    expectDex_countsToEqual(dex, 2, 2);
    expectDex_entryToHaveTags(dex, entry, [testTag]);
    expectDex_entryToHaveTags(dex, entry2, [testTag, testTag2]);
    expectDex_tagsToHaveEntries(dex, testTag, [entry]);
    expectDex_tagsToHaveEntries(dex, testTag2, [entry, entry2]);
  });
  test("(Map<TEntry, Set<Tag>) => Dex made of Map Entries", () => {
    const entry = {};
    const entry2 = {};
    const map = new Map<{}, Set<Tag>>();

    map.set(entry, new Set([testTag2]));
    map.set(entry2, new Set([testTag2]));

    const dex = new Dex<{}>(map);

    expectDex_countsToEqual(dex, 2, 1);
    expectDex_entryToHaveTags(dex, entry, [testTag2]);
    expectDex_entryToHaveTags(dex, entry2, [testTag2]);
    expectDex_tagsToHaveEntries(dex, testTag2, [entry, entry2]);
  });
});