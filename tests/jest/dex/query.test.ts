import { describe, test } from '@jest/globals';
import Dex from '../../../src/objects/dexes/dex';
import { InvalidQueryParamError } from '../../../src/objects/errors';
import { ResultType } from '../../../src/objects/queries/results';
import Check from '../../../src/utilities/validators';
import { buildSimpleMockDex, expectDex_entryToHaveTags, expectDex_tagsToHaveEntries, fail_fromType } from './shared';

describe("query(...)", () => {
  const {
    dex,
    tags: [tag, tag2, tag3, tag4, tag5, tag6, tag7],
    entries: [entry, entry2, entry3, entry4, entry5],
    hashes: [hash, hash2, hash3, hash4, hash5]
  } = buildSimpleMockDex();

  describe("(Tag)", () => {
    test("(Tag) => [TEntry]", () => {
      const result = dex.query(tag);

      expect(result).toBeInstanceOf(Array);
      if (Check.isArray(result)) {
        expect(result.length).toStrictEqual(1);
        expect(result[0]).toBeInstanceOf(Object);
        expect(result[0].key).toStrictEqual(entry.key);
      } else {
        fail_fromType(Array, result);
      }
    });
    test("(Tag) => [TEntry, TEntry]", () => {
      const result = dex.query(tag2);

      expect(result).toBeInstanceOf(Array);
      if (Check.isArray(result)) {
        expect(result.length).toStrictEqual(2);
        expect(result[0]).toBeInstanceOf(Object);
        expect(result[0].key).toStrictEqual(entry.key);
        expect(result[1]).toBeInstanceOf(Object);
        expect(result[1].key).toStrictEqual(entry2.key);
      } else {
        fail_fromType(Array, result);
      }
    });
    test("(Tag<empty>) => []", () => {
      const result = dex.query(tag5);

      expect(result).toBeInstanceOf(Array);
      if (Check.isArray(result)) {
        expect(result.length).toStrictEqual(0);
      } else {
        fail_fromType(Array, result);
      }
    });
    test("(Tag<unkown>) => []", () => {
      const result = dex.query(tag6);

      expect(result).toBeInstanceOf(Array);
      if (Check.isArray(result)) {
        expect(result.length).toStrictEqual(0);
      } else {
        fail_fromType(Array, result);
      }
    });
  });
  describe("(Tag, ResultType)", () => {
    test("(Tag, Vauge) throws InvalidQueryParamError", () => {
      expect(() => {
        dex.query(tag, ResultType.Vauge);
      }).toThrowError(new InvalidQueryParamError(ResultType.Vauge, "resultType"));
    });
    test("(Tag, ResultType.Array) => [TEntry, TEntry]", () => {
      const result = dex.query(tag2);

      expect(result).toBeInstanceOf(Array);
      if (Check.isArray(result)) {
        expect(result.length).toStrictEqual(2);
        expect(result[0]).toBeInstanceOf(Object);
        expect(result[0].key).toStrictEqual(entry.key);
        expect(result[1]).toBeInstanceOf(Object);
        expect(result[1].key).toStrictEqual(entry2.key);
      } else {
        fail_fromType(Array, result);
      }
    });
    test("(Tag, ResultType.Set) => Set<TEntry>[TEntry, TEntry]", () => {
      const result = dex.query(tag2, ResultType.Set);

      expect(result).toBeInstanceOf(Set);
      expect(result.size).toStrictEqual(2);
      expect(result.has(entry)).toBeTruthy();
      expect(result.has(entry2)).toBeTruthy();
    });
    test("(Tag, ResultType.Dex) => Dex<TEntry>[TEntry x2, Tag x4]", () => {
      const result = dex.query(tag2, ResultType.Dex);

      expect(result).toBeInstanceOf(Dex);
      expect(result.numberOfEntries).toStrictEqual(2);
      expect(result.numberOfTags).toStrictEqual(4);
      expectDex_tagsToHaveEntries(result, tag, [entry]);
      expectDex_tagsToHaveEntries(result, tag2, [entry, entry2]);
      expectDex_tagsToHaveEntries(result, tag3, [entry2]);
      expectDex_tagsToHaveEntries(result, tag7, [entry2]);
      expectDex_entryToHaveTags(result, entry, [tag, tag2]);
      expectDex_entryToHaveTags(result, entry2, [tag2, tag3, tag7]);
      expect(result.tags).not.toContain(tag4);
      expect(result.tags).not.toContain(tag5);
      expect(result.tags).not.toContain(tag6);
      expect(result.entries).not.toContain(entry3);
      expect(result.entries).not.toContain(entry4);
      expect(result.entries).not.toContain(entry5);
    });
    test("(Tag, ResultType.First) => TEntry", () => {
      const result = dex.query(tag2, ResultType.First);

      expect(result).toBeInstanceOf(Object);
      expect(result!.key).toStrictEqual(entry.key);
    });
    test("(Tag<empty>, ResultType.First) => undefined", () => {
      const result = dex.query([tag5], ResultType.First);

      expect(result).toBeUndefined();
    });
    test("(Tag<unkown>, ResultType.First) => undefined", () => {
      const result = dex.query([tag6], ResultType.First);

      expect(result).toBeUndefined();
    });
    test("(Tag, Pairs) throws InvalidQueryParamError", () => {
      expect(() => {
        dex.query(tag, ResultType.Pairs);
      }).toThrowError(new InvalidQueryParamError(ResultType.Pairs, "resultType"));
    });
    test("(Tag, Tuples) throws InvalidQueryParamError", () => {
      expect(() => {
        dex.query(tag, ResultType.Tuples);
      }).toThrowError(new InvalidQueryParamError(ResultType.Tuples, "resultType"));
    });
    test("(Tag, Full) throws InvalidQueryParamError", () => {
      expect(() => {
        dex.query(tag, ResultType.Full);
      }).toThrowError(new InvalidQueryParamError(ResultType.Full, "resultType"));
    });
  });
  describe("(Tag, Options)", () => {
    describe("(Tag, {})", () => {
      test("(Tag, {}) => [TEntry]", () => {
        const result = dex.query(tag, {});

        expect(result).toBeInstanceOf(Array);
        if (Check.isArray(result)) {
          expect(result.length).toStrictEqual(1);
          expect(result[0]).toBeInstanceOf(Object);
          expect(result[0].key).toStrictEqual(entry.key);
        } else {
          fail_fromType(Array, result);
        }
      });
      test("(Tag, {}) => [TEntry, TEntry]", () => {
        const result = dex.query(tag2, {});

        expect(result).toBeInstanceOf(Array);
        if (Check.isArray(result)) {
          expect(result.length).toStrictEqual(2);
          expect(result[0]).toBeInstanceOf(Object);
          expect(result[0].key).toStrictEqual(entry.key);
          expect(result[1]).toBeInstanceOf(Object);
          expect(result[1].key).toStrictEqual(entry2.key);
        } else {
          fail_fromType(Array, result);
        }
      });
      test("(Tag<empty>, {}) => []", () => {
        const result = dex.query(tag5, {});

        expect(result).toBeInstanceOf(Array);
        if (Check.isArray(result)) {
          expect(result.length).toStrictEqual(0);
        } else {
          fail_fromType(Array, result);
        }
      });
    });
    describe("(Tag, {result: ResultType})", () => {
      test("(Tag, {ResultType.Array}) => [TEntry, TEntry]", () => {
        const result = dex.query(tag2);

        expect(result).toBeInstanceOf(Array);
        if (Check.isArray(result)) {
          expect(result.length).toStrictEqual(2);
          expect(result[0]).toBeInstanceOf(Object);
          expect(result[0].key).toStrictEqual(entry.key);
          expect(result[1]).toBeInstanceOf(Object);
          expect(result[1].key).toStrictEqual(entry2.key);
        } else {
          fail_fromType(Array, result);
        }
      });
      test("(Tag, {ResultType.Set}) => Set<TEntry>[TEntry, TEntry]", () => {
        const result = dex.query([tag2], ResultType.Set);

        expect(result).toBeInstanceOf(Set);
        expect(result.size).toStrictEqual(2);
        expect(result.has(entry)).toBeTruthy();
        expect(result.has(entry2)).toBeTruthy();
      });
      test("(Tag, {ResultType.Dex}) => Dex<TEntry>[TEntry x2, Tag x3]", () => {
        const result = dex.query(tag2, ResultType.Dex);

        expect(result).toBeInstanceOf(Dex);
        expect(result.numberOfEntries).toStrictEqual(2);
        expect(result.numberOfTags).toStrictEqual(4);
        expectDex_tagsToHaveEntries(result, tag, [entry]);
        expectDex_tagsToHaveEntries(result, tag2, [entry, entry2]);
        expectDex_tagsToHaveEntries(result, tag3, [entry2]);
        expectDex_tagsToHaveEntries(result, tag7, [entry2]);
        expect(result.tags).not.toContain(tag4);
        expect(result.tags).not.toContain(tag5);
        expect(result.tags).not.toContain(tag6);
        expect(result.entries).not.toContain(entry3);
        expect(result.entries).not.toContain(entry4);
        expect(result.entries).not.toContain(entry5);
      });
      test("(Tag, {ResultType.First}) => TEntry", () => {
        const result = dex.query([tag, tag2, tag6], ResultType.First);

        expect(result).toBeInstanceOf(Object);
        expect(result!.key).toStrictEqual(entry.key);
      });
    });
    describe("(Tag, {filters: XQueryFilter<TDexEntry>})", () => {
      describe("(Tag, {filters: XAndFilter})", () => {
        describe("(Tag, {filters: {and: XFilterParams<TDexEntry>}})", () => {
          describe(`(Tag, {filters: {and: FilterParamObject<TDexEntry>}})`, () => {
            describe(`(Tag, {filters: {and: XHashKeyFilters<TDexEntry>}})`, () => {
              test(`(Tag, {filters: {and: { hash: HashKey }}}) => [TEntry]`, () => {
                const result = dex.query(tag, { filters: { and: { hash: dex.hash(entry) } } })

                expect(result).toBeInstanceOf(Array);
                if (Check.isArray(result)) {
                  expect(result.length).toStrictEqual(1);
                  expect(result[0]).toBeInstanceOf(Object);
                  expect(result[0].key).toStrictEqual(entry.key);
                } else {
                  fail_fromType(Array, result);
                }
              });
              test(`(Tag, {filters: {and: { hashes: HashKey }}}) => [TEntry]`, () => {
                const result = dex.query(tag, { filters: { and: { hashes: dex.hash(entry) } } })

                expect(result).toBeInstanceOf(Array);
                if (Check.isArray(result)) {
                  expect(result.length).toStrictEqual(1);
                  expect(result[0]).toBeInstanceOf(Object);
                  expect(result[0].key).toStrictEqual(entry.key);
                } else {
                  fail_fromType(Array, result);
                }
              });
              test(`(Tag, {filters: {and: { hashes: [HashKey, HashKey] }}}) => [TEntry]`, () => {
                const result = dex.query(tag, { filters: { and: { hashes: [dex.hash(entry), dex.hash(entry2)] } } })

                expect(result).toBeInstanceOf(Array);
                if (Check.isArray(result)) {
                  expect(result.length).toStrictEqual(1);
                  expect(result[0]).toBeInstanceOf(Object);
                  expect(result[0].key).toStrictEqual(entry.key);
                } else {
                  fail_fromType(Array, result);
                }
              });
              test(`(Tag, {filters: {and: { hash: HashKey }}}) => []`, () => {
                const result = dex.query(tag, { filters: { and: { hash: dex.hash(entry2) } } })

                expect(result).toBeInstanceOf(Array);
                if (Check.isArray(result)) {
                  expect(result.length).toStrictEqual(0);
                } else {
                  fail_fromType(Array, result);
                }
              });
            });
            describe(`(Tag, {filters: {and: XTagFilters<TDexEntry>}})`, () => {
              describe(`(Tag, {filters: {and: { tag: Tag }}})`, () => {
                test(`(Tag<1>, {filters: {and: { tag: Tag<3> }}}) => []`, () => {
                  const result = dex.query(tag, { filters: { and: { tag: tag3 } } })

                  expect(result).toBeInstanceOf(Array);
                  if (Check.isArray(result)) {
                    expect(result.length).toStrictEqual(0);
                  } else {
                    fail_fromType(Array, result);
                  }
                });
                test(`(Tag<1>, {filters: {and: { tag: Tag<2> }}}) => [TEntry]`, () => {
                  const result = dex.query(tag, { filters: { and: { tag: tag2 } } })

                  expect(result).toBeInstanceOf(Array);
                  if (Check.isArray(result)) {
                    expect(result.length).toStrictEqual(1);
                    expect(result[0]).toBeInstanceOf(Object);
                    expect(result[0].key).toStrictEqual(entry.key);
                  } else {
                    fail_fromType(Array, result);
                  }
                });
                test(`(Tag<2>, {filters: {and: { tag: Tag<1> }}}) => [TEntry]`, () => {
                  const result = dex.query(tag2, { filters: { and: { tag: tag } } })

                  expect(result).toBeInstanceOf(Array);
                  if (Check.isArray(result)) {
                    expect(result.length).toStrictEqual(1);
                    expect(result[0]).toBeInstanceOf(Object);
                    expect(result[0].key).toStrictEqual(entry.key);
                  } else {
                    fail_fromType(Array, result);
                  }
                });
                test(`(Tag<3>, {filters: {and: { tag: Tag<2> }}}) => [TEntry]`, () => {
                  const result = dex.query(tag3, { filters: { and: { tag: tag2 } } })

                  expect(result).toBeInstanceOf(Array);
                  if (Check.isArray(result)) {
                    expect(result.length).toStrictEqual(1);
                    expect(result[0]).toBeInstanceOf(Object);
                    expect(result[0].key).toStrictEqual(entry2.key);
                  } else {
                    fail_fromType(Array, result);
                  }
                });
              });
              describe(`(Tag, {filters: {and: { tags: Tag }}})`, () => {
                test(`(Tag<1>, {filters: {and: { tags: Tag<3> }}}) => []`, () => {
                  const result = dex.query(tag, { filters: { and: { tags: tag3 } } })

                  expect(result).toBeInstanceOf(Array);
                  if (Check.isArray(result)) {
                    expect(result.length).toStrictEqual(0);
                  } else {
                    fail_fromType(Array, result);
                  }
                });
                test(`(Tag<1>, {filters: {and: { tags: Tag<2> }}}) => [TEntry]`, () => {
                  const result = dex.query(tag, { filters: { and: { tags: tag2 } } })

                  expect(result).toBeInstanceOf(Array);
                  if (Check.isArray(result)) {
                    expect(result.length).toStrictEqual(1);
                    expect(result[0]).toBeInstanceOf(Object);
                    expect(result[0].key).toStrictEqual(entry.key);
                  } else {
                    fail_fromType(Array, result);
                  }
                });
                test(`(Tag<2>, {filters: {and: { tags: Tag<1> }}}) => [TEntry]`, () => {
                  const result = dex.query(tag2, { filters: { and: { tags: tag } } })

                  expect(result).toBeInstanceOf(Array);
                  if (Check.isArray(result)) {
                    expect(result.length).toStrictEqual(1);
                    expect(result[0]).toBeInstanceOf(Object);
                    expect(result[0].key).toStrictEqual(entry.key);
                  } else {
                    fail_fromType(Array, result);
                  }
                });
                test(`(Tag<3>, {filters: {and: { tags: Tag<2> }}}) => [TEntry]`, () => {
                  const result = dex.query(tag3, { filters: { and: { tags: tag2 } } })

                  expect(result).toBeInstanceOf(Array);
                  if (Check.isArray(result)) {
                    expect(result.length).toStrictEqual(1);
                    expect(result[0]).toBeInstanceOf(Object);
                    expect(result[0].key).toStrictEqual(entry2.key);
                  } else {
                    fail_fromType(Array, result);
                  }
                });
                test(`(Tag<3>, {filters: {and: { tags: Tag<7> }}}) => [TEntry, TEntry]`, () => {
                  const result = dex.query(tag3, { filters: { and: { tags: tag7 } } })

                  expect(result).toBeInstanceOf(Array);
                  if (Check.isArray(result)) {
                    expect(result.length).toStrictEqual(2);
                    expect(result[0]).toBeInstanceOf(Object);
                    expect(result[0].key).toStrictEqual(entry2.key);
                    expect(result[1]).toBeInstanceOf(Object);
                    expect(result[1].key).toStrictEqual(entry3.key);
                  } else {
                    fail_fromType(Array, result);
                  }
                });
              });
              describe(`(Tag, {filters: {and: { tags: Tag[] }}})`, () => {
                test(`(Tag<1>, {filters: {and: { tags: [Tag<3>] }}}) => []`, () => {
                  const result = dex.query(tag, { filters: { and: { tags: [tag3] } } })

                  expect(result).toBeInstanceOf(Array);
                  if (Check.isArray(result)) {
                    expect(result.length).toStrictEqual(0);
                  } else {
                    fail_fromType(Array, result);
                  }
                });
                test(`(Tag<1>, {filters: {and: { tags: [Tag<3>, Tag<1>] }}}) => []`, () => {
                  const result = dex.query(tag, { filters: { and: { tags: [tag3, tag] } } })

                  expect(result).toBeInstanceOf(Array);
                  if (Check.isArray(result)) {
                    expect(result.length).toStrictEqual(0);
                  } else {
                    fail_fromType(Array, result);
                  }
                });
                test(`(Tag<1>, {filters: {and: { tags: [Tag<2>, Tag<1>]] }}}) => [TEntry]`, () => {
                  const result = dex.query(tag, { filters: { and: { tags: [tag2, tag] } } })

                  expect(result).toBeInstanceOf(Array);
                  if (Check.isArray(result)) {
                    expect(result.length).toStrictEqual(1);
                    expect(result[0]).toBeInstanceOf(Object);
                    expect(result[0].key).toStrictEqual(entry.key);
                  } else {
                    fail_fromType(Array, result);
                  }
                });
                test(`(Tag<1>, {filters: {and: { tags: [Tag<2>] }}}) => [TEntry]`, () => {
                  const result = dex.query(tag, { filters: { and: { tags: tag2 } } })

                  expect(result).toBeInstanceOf(Array);
                  if (Check.isArray(result)) {
                    expect(result.length).toStrictEqual(1);
                    expect(result[0]).toBeInstanceOf(Object);
                    expect(result[0].key).toStrictEqual(entry.key);
                  } else {
                    fail_fromType(Array, result);
                  }
                });
                test(`(Tag<2>, {filters: {and: { tags: [Tag<1>] }}}) => [TEntry]`, () => {
                  const result = dex.query(tag2, { filters: { and: { tags: tag } } })

                  expect(result).toBeInstanceOf(Array);
                  if (Check.isArray(result)) {
                    expect(result.length).toStrictEqual(1);
                    expect(result[0]).toBeInstanceOf(Object);
                    expect(result[0].key).toStrictEqual(entry.key);
                  } else {
                    fail_fromType(Array, result);
                  }
                });
                test(`(Tag<3>, {filters: {and: { tags: [Tag<7>, Tag<3>] }}}) => [TEntry, TEntry]`, () => {
                  const result = dex.query(tag3, { filters: { and: { tags: [tag7, tag3] } } })

                  expect(result).toBeInstanceOf(Array);
                  if (Check.isArray(result)) {
                    expect(result.length).toStrictEqual(2);
                    expect(result[0]).toBeInstanceOf(Object);
                    expect(result[0].key).toStrictEqual(entry2.key);
                    expect(result[1]).toBeInstanceOf(Object);
                    expect(result[1].key).toStrictEqual(entry3.key);
                  } else {
                    fail_fromType(Array, result);
                  }
                });
              });
            });
            describe(`(Tag, {filters: {and: XLogicFilters<TDexEntry>}})`, () => {

            });
            describe(`(Tag, {filters: {and: XTagFilters & XHashKeyFilters}})`, () => {

            });
            describe(`(Tag, {filters: {and: XLogicFilters<TDexEntry> & XHashKeyFilters}})`, () => {

            });
            describe(`(Tag, {filters: {and: XLogicFilters<TDexEntry> & XTagFilters}})`, () => {

            });
            describe(`(Tag, {filters: {and: XLogicFilters<TDexEntry> & XTagFilters & XHashKeyFilters}})`, () => {

            });
          });
          describe(`(Tag, {filters: {and: FilterParamArray<TDexEntry>}})`, () => {

          });
        });
        describe("(Tag, {filters: {and: XFilterParams<TDexEntry>, not: true}})", () => {

        });
        describe("(Tag, {and: true, not: XFilterParams<TDexEntry>}})", () => {

        });
        describe("(Tag, {and: true}})", () => {

        });
      });
      describe("(Tag, {filters: XOrFilter})", () => {
        describe("(Tag, {or: XFilterParams<TDexEntry>})", () => {

        });
        describe("(Tag, {or: XFilterParams<TDexEntry>, not: true})", () => {

        });
        describe("(Tag, {or: true, not: XFilterParams<TDexEntry>})", () => {

        });
        describe("(Tag, {or: true})", () => {

        });
        describe("(Tag, {not: XFilterParams<TDexEntry>})", () => {

        });
      });
    });
    describe("(Tag, {filters: XQueryFilter<TDexEntry>[]})", () => {
    });
    describe("(Tag, {result: ResultType, filters: XQueryFilter<TDexEntry>})", () => {
    });
    describe("(Tag, {result: ResultType, filters: XQueryFilter<TDexEntry>[]})", () => {
    });
  });
  describe("(Tags[])", () => {
    test("([Tag]) => [TEntry]", () => {
      const result = dex.query([tag]);

      expect(result).toBeInstanceOf(Array);
      if (Check.isArray(result)) {
        expect(result.length).toStrictEqual(1);
        expect(result[0]).toBeInstanceOf(Object);
        expect(result[0].key).toStrictEqual(entry.key);
      } else {
        fail_fromType(Array, result);
      }
    });
    test("([Tag, Tag]) => [TEntry, TEntry]", () => {
      const result = dex.query([tag, tag2]);

      expect(result).toBeInstanceOf(Array);
      if (Check.isArray(result)) {
        expect(result.length).toStrictEqual(2);
        expect(result[0]).toBeInstanceOf(Object);
        expect(result[0].key).toStrictEqual(entry.key);
        expect(result[1]).toBeInstanceOf(Object);
        expect(result[1].key).toStrictEqual(entry2.key);
      } else {
        fail_fromType(Array, result);
      }
    });
    test("([Tag, Tag, Tag<unknown>]) => [TEntry, TEntry]", () => {
      const result = dex.query([tag, tag2, tag6]);

      expect(result).toBeInstanceOf(Array);
      if (Check.isArray(result)) {
        expect(result.length).toStrictEqual(2);
        expect(result[0]).toBeInstanceOf(Object);
        expect(result[0].key).toStrictEqual(entry.key);
        expect(result[1]).toBeInstanceOf(Object);
        expect(result[1].key).toStrictEqual(entry2.key);
      } else {
        fail_fromType(Array, result);
      }
    });
    test("([Tag, Tag, Tag]) => [TEntry, TEntry, TEntry, TEntry]", () => {
      const result = dex.query([tag, tag2, tag3]);

      expect(result).toBeInstanceOf(Array);
      if (Check.isArray(result)) {
        expect(result.length).toStrictEqual(4);
        expect(result[0]).toBeInstanceOf(Object);
        expect(result[0].key).toStrictEqual(entry.key);
        expect(result[1]).toBeInstanceOf(Object);
        expect(result[1].key).toStrictEqual(entry2.key);
        expect(result[2]).toBeInstanceOf(Object);
        expect(result[2].key).toStrictEqual(entry3.key);
        expect(result[3]).toBeInstanceOf(Object);
        expect(result[3].key).toStrictEqual(entry4.key);
      } else {
        fail_fromType(Array, result);
      }
    });
  });
  describe("(Tags[], ResultType)", () => {
    test("([Tag], ResultType.Set) => Set<TEntry>[TEntry, TEntry]", () => {
      const result = dex.query([tag2], ResultType.Set);

      expect(result).toBeInstanceOf(Set);
      expect(result.size).toStrictEqual(2);
      expect(result.has(entry)).toBeTruthy();
      expect(result.has(entry2)).toBeTruthy();
    });
    test("([Tag, Tag], ResultType.Dex) => Dex<TEntry>[TEntry x4, Tag x5]", () => {
      const result = dex.query([tag2, tag3], ResultType.Dex);

      expect(result).toBeInstanceOf(Dex);
      expect(result.numberOfEntries).toStrictEqual(4);
      expect(result.numberOfTags).toStrictEqual(5);
      expectDex_tagsToHaveEntries(result, tag, [entry]);
      expectDex_tagsToHaveEntries(result, tag2, [entry, entry2]);
      expectDex_tagsToHaveEntries(result, tag3, [entry2, entry3, entry4]);
      expectDex_tagsToHaveEntries(result, tag4, [entry4]);
      expectDex_tagsToHaveEntries(result, tag7, [entry2, entry3]);
      expectDex_entryToHaveTags(result, entry, [tag, tag2]);
      expectDex_entryToHaveTags(result, entry2, [tag2, tag3, tag7]);
      expectDex_entryToHaveTags(result, entry3, [tag3, tag7]);
      expectDex_entryToHaveTags(result, entry4, [tag3, tag4]);
      expect(result.tags).not.toContain(tag6);
      expect(result.tags).not.toContain(tag5);
      expect(result.entries).not.toContain(entry5);
    });
    test("([Tag, Tag, Tag<unknown>], ResultType.First) => TEntry", () => {
      const result = dex.query([tag, tag2, tag6], ResultType.First);

      expect(result).toBeInstanceOf(Object);
      expect(result!.key).toStrictEqual(entry.key);
    });
    test("([Tag<empty>, Tag<unknown>], ResultType.First) => undefined", () => {
      const result = dex.query([tag5, tag6], ResultType.First);

      expect(result).toBeUndefined();
    });
  });
  describe("(...Tags)", () => {
    test("(Tag, Tag<empty>) => [TEntry]", () => {
      const result = dex.query(tag, tag5);

      expect(result).toBeInstanceOf(Array);
      if (Check.isArray(result)) {
        expect(result.length).toStrictEqual(1);
        expect(result[0]).toBeInstanceOf(Object);
        expect(result[0].key).toStrictEqual(entry.key);
      } else {
        fail_fromType(Array, result);
      }
    });
    test("(Tag, Tag) => [TEntry, TEntry]", () => {
      const result = dex.query(tag, tag2);

      expect(result).toBeInstanceOf(Array);
      if (Check.isArray(result)) {
        expect(result.length).toStrictEqual(2);
        expect(result[0]).toBeInstanceOf(Object);
        expect(result[0].key).toStrictEqual(entry.key);
        expect(result[1]).toBeInstanceOf(Object);
        expect(result[1].key).toStrictEqual(entry2.key);
      } else {
        fail_fromType(Array, result);
      }
    });
    test("(Tag, Tag, Tag<unknown>) => [TEntry, TEntry]", () => {
      const result = dex.query(tag, tag2, tag6);

      expect(result).toBeInstanceOf(Array);
      if (Check.isArray(result)) {
        expect(result.length).toStrictEqual(2);
        expect(result[0]).toBeInstanceOf(Object);
        expect(result[0].key).toStrictEqual(entry.key);
        expect(result[1]).toBeInstanceOf(Object);
        expect(result[1].key).toStrictEqual(entry2.key);
      } else {
        fail_fromType(Array, result);
      }
    });
    test("(Tag, Tag, Tag) => [TEntry, TEntry, TEntry, TEntry]", () => {
      const result = dex.query(tag, tag2, tag3);

      expect(result).toBeInstanceOf(Array);
      if (Check.isArray(result)) {
        expect(result.length).toStrictEqual(4);
        expect(result[0]).toBeInstanceOf(Object);
        expect(result[0].key).toStrictEqual(entry.key);
        expect(result[1]).toBeInstanceOf(Object);
        expect(result[1].key).toStrictEqual(entry2.key);
        expect(result[2]).toBeInstanceOf(Object);
        expect(result[2].key).toStrictEqual(entry3.key);
        expect(result[3]).toBeInstanceOf(Object);
        expect(result[3].key).toStrictEqual(entry4.key);
      } else {
        fail_fromType(Array, result);
      }
    });
  });
});