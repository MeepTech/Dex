import { describe, test } from '@jest/globals';
import Dex, { InvalidQueryArgsError } from '../../../src/objects/dex';
import { FLAGS } from '../../../src/objects/queries/flags';
import { ITag } from '../../../src/objects/subsets/tags';
import { expect_queryFunctionTestCaseSuccess, QueryTestCase as TestCase } from './shared';

describe("search(...)", () => {
  // mocks
  const entry = { key: 1 };
  const entry2 = { key: 2 };
  const entry3 = { key: 3 };
  const entry4 = { key: 4 };
  const entry5 = { key: 5 };

  const tag = "tag";
  const tag2 = "tag2";
  const tag3 = "tag3";
  const tag4 = "tag4";
  const tag5 = "tag5";
  const tag6 = "tag6";

  const dex = new Dex<{ key: number }>();
  const hash = dex.add(entry, tag, tag2);
  const hash2 = dex.add(entry2, tag2, tag3);
  const hash3 = dex.add(entry3, tag3);
  const hash4 = dex.add(entry4, tag3, tag4);
  const hash5 = dex.add(entry5, []);
  const tag5Hash = dex.set(tag5);

  // cases
  const invalidFlagsTestCases = (tag: ITag) => [
    {
      params: [`["Tag"]`, "[FLAGS.CHAIN, FLAGS.FIRST]"],
      args: [[tag], [FLAGS.CHAIN, FLAGS.FIRST]],
      expected: [],
      results: "throws InvalidDexQueryFlagsError: (Chain | First) is an invalid set of flags",
      throws: new InvalidQueryArgsError([FLAGS.CHAIN, FLAGS.FIRST])
    },
    {
      params: [`["Tag"]`, "[FLAGS.CHAIN , FLAGS.FIRST , FLAGS.OR]"],
      args: [[tag], [FLAGS.CHAIN, FLAGS.FIRST, FLAGS.OR]],
      expected: [],
      results: "throws InvalidDexQueryFlagsError: (Chain | First | Or) is an invalid set of flags",
      throws: new InvalidQueryArgsError([FLAGS.CHAIN, FLAGS.FIRST, FLAGS.OR])
    },
    {
      params: [`["Tag"]`, "[FLAGS.CHAIN , , FLAGS.OR | FLAGS.NOT]"],
      args: [[tag], [FLAGS.CHAIN, FLAGS.FIRST, FLAGS.OR, FLAGS.NOT]],
      expected: [],
      results: "throws InvalidDexQueryFlagsError: (Chain | First | Or | Not) is an invalid set of flags",
      throws: new InvalidQueryArgsError([FLAGS.CHAIN, FLAGS.FIRST, FLAGS.OR, FLAGS.NOT])
    },
  ]

  const emptyTagTestCases = (tag: ITag, tagType: string = "Empty Tag"): TestCase[] => [
    {
      params: [`["Tag"]`],
      args: [[tag]],
      expected: [],
      results: `Empty Array from ${tagType}`,
    },
    {
      params: [`["Tag"]`, "FLAGS.CHAIN"],
      args: [[tag], FLAGS.CHAIN],
      expected: [],
      results: `Empty Dex from ${tagType}`,
      instanceof: Dex
    },
    {
      params: [`["Tag"]`, "[FLAGS.CHAIN, FLAGS.NOT]"],
      args: [[tag], [FLAGS.CHAIN, FLAGS.NOT]],
      expected: [entry, entry2, entry3, entry4, entry5],
      results: `All Entries In a Dex from Not of ${tagType} via Chain`,
      instanceof: Dex
    },
    {
      params: [`["Tag"]`, "[FLAGS.CHAIN , FLAGS.NOT, FLAGS.OR]"],
      args: [[tag], [FLAGS.CHAIN, FLAGS.NOT, FLAGS.OR]],
      expected: [entry, entry2, entry3, entry4, entry5],
      results: `All Entries In a Dex from Not and Or of ${tagType}`,
      instanceof: Dex,
      debug: true
    },
    {
      params: [`["Tag"]`, "FLAGS.AND"],
      args: [[tag], FLAGS.AND],
      expected: [],
      results: `No Entries from ${tagType}`,
    },
    {
      params: [`[Tag], FLAGS.AND | FLAGS.NOT`],
      args: [[tag], FLAGS.AND],
      expected: [],
      results: `No Entries from ${tagType} with Not overriden by Strict.`,
    },
    {
      params: [`["Tag"]`, "FLAGS.NOT"],
      args: [[tag], FLAGS.NOT],
      expected: [entry, entry2, entry3, entry4, entry5],
      results: `All Entries from Not of ${tagType}`,
    },
    {
      params: [`["Tag"]`, "FLAGS.NOT, FLAGS.FIRST"],
      args: [[tag], FLAGS.NOT, FLAGS.FIRST],
      expected: [entry],
      results: `First Entry from First of Not of ${tagType}`,
      instanceof: {}
    },
    {
      params: [`["Tag"]`, "FLAGS.NOT, FLAGS.FIRST , FLAGS.OR"],
      args: [[tag], FLAGS.NOT, FLAGS.FIRST, FLAGS.OR],
      expected: [entry],
      results: `First Entry from First of Not and Or of ${tagType}`,
      instanceof: {}
    },
    {
      params: [`["Tag"]`, "FLAGS.NOT, FLAGS.OR"],
      args: [[tag], FLAGS.NOT, FLAGS.OR],
      expected: [entry, entry2, entry3, entry4, entry5],
      results: `All Entries from Not and Or of ${tagType}`,
    },
    {
      params: [`["Tag"]`, "FLAGS.OR"],
      args: [[tag], FLAGS.OR],
      expected: [],
      results: `No Entries from Or of ${tagType}`,
    },
    {
      params: [`["Tag"]`, "FLAGS.FIRST"],
      args: [[tag], FLAGS.FIRST],
      expected: [undefined],
      results: `Undefined for First of No Entries for ${tagType}`,
      instanceof: {}
    },
  ];

  let tagType = "One Single Tag";
  const singleTagTestCases: TestCase[] = [
    {
      params: [`["Tag"]`],
      args: [tag],
      expected: [entry],
      results: `Array with One Entry`
    },
    {
      params: [`["Tag"]`],
      args: [tag2],
      expected: [entry, entry2],
      results: `Array of Multiple Entries`
    },
    {
      params: [`["Tag"]`, "FLAGS.CHAIN"],
      args: [[tag], FLAGS.CHAIN],
      expected: [entry],
      results: `Dex with one entry.`,
      instanceof: Dex
    },
    {
      params: [`["Tag"]`, "[FLAGS.CHAIN, FLAGS.NOT]"],
      args: [[tag], [FLAGS.CHAIN, FLAGS.NOT]],
      expected: [entry2, entry3, entry4, entry5],
      results: `Dex of all entries except the tagged one`,
      instanceof: Dex
    },
    {
      params: [`["Tag"]`, "[FLAGS.CHAIN , FLAGS.NOT, FLAGS.OR]"],
      args: [[tag], [FLAGS.CHAIN, FLAGS.NOT, FLAGS.OR]],
      expected: [entry2, entry3, entry4, entry5],
      results: `Dex of all entries except the tagged one`,
      instanceof: Dex
    },
    {
      params: [`["Tag"]`, "FLAGS.AND"],
      args: [[tag], FLAGS.AND],
      expected: [],
      results: `No Entries from ${tagType}`,
    },
    {
      params: [`[Tag], [FLAGS.AND, FLAGS.NOT]`],
      args: [[tag], [FLAGS.AND, FLAGS.NOT]],
      expected: [],
      results: `No Entries from ${tagType} with Not overriden by Strict.`,
    },
    {
      params: [`["Tag"]`, "FLAGS.NOT"],
      args: [[tag], FLAGS.NOT],
      expected: [entry, entry2, entry3, entry4],
      results: `All Entries from Not of ${tagType}`,
    },
    {
      params: [`["Tag"]`, "FLAGS.NOT, FLAGS.FIRST"],
      args: [[tag], FLAGS.NOT, FLAGS.FIRST],
      expected: [entry],
      results: `First Entry from First of Not of ${tagType}`,
      instanceof: {}
    },
    {
      params: [`["Tag"]`, "FLAGS.NOT, FLAGS.FIRST , FLAGS.OR"],
      args: [[tag], FLAGS.NOT, FLAGS.FIRST, FLAGS.OR],
      expected: [entry],
      results: `First Entry from First of Not and Or of ${tagType}`,
      instanceof: {}
    },
    {
      params: [`["Tag"]`, "[FLAGS.NOT, FLAGS.OR]"],
      args: [[tag], [FLAGS.NOT, FLAGS.OR]],
      expected: [entry, entry2, entry3, entry4],
      results: `All Entries from Not and Or of ${tagType}`,
    },
    {
      params: [`["Tag"]`, "FLAGS.OR"],
      args: [[tag], FLAGS.OR],
      expected: [],
      results: `No Entries from Or of ${tagType}`,
    },
    {
      params: [`["Tag"]`, "FLAGS.FIRST"],
      args: [[tag], FLAGS.FIRST],
      expected: [undefined],
      results: `Undefined for First of No Entries for ${tagType}`,
      instanceof: {}
    },
  ]

  const multipleTagTestCases: TestCase[] = [
    {
      params: [`["Tag", "Tag"]`],
      args: [tag, tag4],
      expected: [entry, entry4],
      results: "Multiple Entries from Multiple Tags",
      extraContext: [1]
    },
    {
      params: [`["Tag", "Tag", "Tag"]`],
      args: [tag, tag3, tag4],
      expected: [entry, entry2, entry3, entry4],
      results: "Multiple Entries from Multiple Tags",
      extraContext: [2]
    }
  ]

  const noTagsTestCases: TestCase[] = [
    {
      params: [`[], FLAGS.NOT`],
      args: [[], FLAGS.NOT],
      expected: [entry, entry2, entry3, entry4],
      results: "All Entries with Any Tags"
    },
    {
      params: [`[], FLAGS.NOT, FLAGS.CHAIN`],
      args: [[], FLAGS.NOT, FLAGS.CHAIN],
      expected: [entry, entry2, entry3, entry4],
      results: "All Entries with Any Tags as a Dex",
      instanceof: Dex
    },
    {
      params: [`[]`],
      args: [[]],
      expected: [entry5],
      results: "All Entries with No Tags"
    },
    {
      params: [`[]`, "FLAGS.FIRST"],
      args: [[], FLAGS.FIRST],
      expected: [entry5],
      results: "All Entries with No Tags",
      instanceof: {}
    }
  ]

  const testCases: TestCase[] = [
    ...invalidFlagsTestCases(tag),
    ...emptyTagTestCases(tag5),
    ...emptyTagTestCases(tag6, "Missing Tag"),
    ...singleTagTestCases,
    ...multipleTagTestCases,
    ...noTagsTestCases
  ];

  // tests
  test.each(testCases)(
    "($params) => $results; $extraContext",
    (test) => expect_queryFunctionTestCaseSuccess(dex, dex.search, test)
  )
});