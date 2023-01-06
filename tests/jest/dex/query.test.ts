import { describe, test } from '@jest/globals';
import Dex from '../../../src/objects/dex';
import { isArray } from '../../../src/utilities/validators';
import { failFromType } from './shared';

describe("query(...)", () => {
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

  describe("(Tag)", () => {
    test("(Tag) => [TEntry]", () => {
      const result = dex.query(tag);

      expect(result).toBeInstanceOf(Array);
      if (isArray(result)) {
        expect(result.length).toStrictEqual(1);
        expect(result[0]).toBeInstanceOf(Object);
        expect(result[0].key).toStrictEqual(entry.key);
      } else {
        failFromType(Array, result);
      }
    });
    test("(Tag) => [TEntry, TEntry]", () => {
      const result = dex.query(tag2);

      expect(result).toBeInstanceOf(Array);
      if (isArray(result)) {
        expect(result.length).toStrictEqual(2);
        expect(result[0]).toBeInstanceOf(Object);
        expect(result[0].key).toStrictEqual(entry.key);
        expect(result[1]).toBeInstanceOf(Object);
        expect(result[1].key).toStrictEqual(entry2.key);
      } else {
        failFromType(Array, result);
      }
    });
    test("(Tag) => []", () => {
      const result = dex.query(tag5);

      expect(result).toBeInstanceOf(Array);
      if (isArray(result)) {
        expect(result.length).toStrictEqual(0);
      } else {
        failFromType(Array, result);
      }
    });
  });
  describe("(...Tags)", () => {
    test("(Tag, Tag) => [TEntry]", () => {
      const result = dex.query(tag, tag5);

      expect(result).toBeInstanceOf(Array);
      if (isArray(result)) {
        expect(result.length).toStrictEqual(1);
        expect(result[0]).toBeInstanceOf(Object);
        expect(result[0].key).toStrictEqual(entry.key);
      } else {
        failFromType(Array, result);
      }
    });
    test("(Tag, Tag) => [TEntry, TEntry]", () => {
      const result = dex.query(tag, tag2);

      expect(result).toBeInstanceOf(Array);
      if (isArray(result)) {
        expect(result.length).toStrictEqual(2);
        expect(result[0]).toBeInstanceOf(Object);
        expect(result[0].key).toStrictEqual(entry.key);
        expect(result[1]).toBeInstanceOf(Object);
        expect(result[1].key).toStrictEqual(entry2.key);
      } else {
        failFromType(Array, result);
      }
    });
  });
});