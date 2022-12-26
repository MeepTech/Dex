import { expect } from '@jest/globals';
import Dex from '../../../src/objects/dex';
import { Entry } from '../../../src/objects/subsets/entries';
import { Tag } from '../../../src/objects/subsets/tags';

export const expectDex_countsToEqual = (
  dex: Dex<any>,
  entries: number,
  tags: number
) => {
  expect(dex.numberOfEntries).toStrictEqual(entries);
  expect(dex.numberOfTags).toStrictEqual(tags);
  expect(dex.entries.length).toStrictEqual(entries);
  expect(dex.keys.count).toStrictEqual(tags);
  expect(dex.entries.length).toStrictEqual(entries);
  expect(dex.tags.size).toStrictEqual(tags);
  expect(dex.keys.size).toStrictEqual(entries);
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
  const hash = Dex.hash(entry)!;

  expect(dex.keys.has(hash)).toBeTruthy();
  expect(dex.tags.of(hash)).toStrictEqual([]);
  expect(dex.tags.for(hash)!.size).toStrictEqual(0);
}

export const expectDex_entryToHaveTags = (
  dex: Dex<any>,
  entry: any,
  tags: Tag[]
) => {
  const tagsForEntry = dex.tags.for(entry)!;

  expect(tagsForEntry.size).toStrictEqual(tags.length);
  tags.forEach(tag =>
    expect(tagsForEntry).toContain(tag));
}

export const expectDex_tagsToHaveEntries = (
  dex: Dex<any>,
  tag: Tag,
  entries: Entry[]
) => {
  const hashesForTag = dex.entries(tag).map(Dex.hash);
  expect(hashesForTag.length).toStrictEqual(entries.length);
  entries.map(Dex.hash).forEach(hash =>
    expect(hashesForTag).toContain(hash));
}