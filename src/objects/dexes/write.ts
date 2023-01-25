import Check from "../../utilities/validators";
import { Copier } from "../helpers/copy";
import Queries from "../queries/queries";
import { NoEntryFound, NO_RESULT, ResultType } from "../queries/results";
import Entry, { None } from "../subsets/entries";
import HashKey from "../subsets/hashes";
import Tags, { Tag, TagOrTags } from "../subsets/tags";
import { IReadableDex } from "./read";

export default interface IWriteableDex<TEntry extends Entry> {

  /**
   * Check if an item is a valid entry for this dex.
   */
  canContain(value: Entry): value is TEntry;

  /**
   * Used to copy this dex, or other items into this dex `.from` another one.
   */
  get copy(): Copier<TEntry>;

  /**
   * Used to take items from a dex using a query (the items will be removed from this dex)
   */
  get take(): Queries.Full<TEntry, ResultType.Array, TEntry>;

  /**
   * Used to set tags and their linked entries as contents within a dex.
   * Warning: This can override existing data.
   */
  get set(): TagSetter<TEntry>;
  
  /**
   * Used to add/link entries and add more tags to entries in a dex
   */
  get add(): EntryAdder<TEntry>;

  /**
   * Used to add/link more tags to an existing dex entry.
   */
  get tag(): Tagger<TEntry>;
  
  /**
   * Used to remove/unlink tags from an existing dex entry.
   */
  get untag(): Untagger<TEntry>;

  /**
   * Used to remove entries from a dex, and to remove links from entries to tags.
   */
  get remove(): EntryRemover<TEntry>;

  /**
   * Used to remove/drop whole tags from the dex, removing any fully orphaned entries by default.
   */
  get drop(): TagDropper;

  /**
   * Used to remove all empty tags and entries.
   */
  clean(): {entries: number, tags: number};

  /**
   * Clean the dex of any empty tags and/or entries.
   */
  clean(options: { tags?: boolean, entries?: boolean }): {entries: number, tags: number};

  /**
   * Drop all tags and entries at once, clearing the whole dex of all data.
   */
  clear(): void;

  //#region Import and Export

  //#region Import

  // TODO: move put here.

  // /**
  //  * Add data about entries to the dex.
  //  *
  //  * @returns The uniqueid/hash of the items added to the dex
  //  */
  // import(
  //   entryWithTags: XWithTags<TEntry>[],
  // ): HashKey[];

  // /**
  //  * Add data about an entry to the dex.
  //  *
  //  * @returns The uniqueid/hash of the item added to the dex
  //  */
  // import(
  //   entryWithTags: XWithTags<TEntry>
  // ): HashKey | None;

  // /**
  //  * Add data about entries to the dex.
  //  *
  //  * @returns The uniqueid/hash of the items added to the dex
  //  */
  // import(
  //   entriesWithTags: (XWithTagsObject<TEntry> | XWithTagsTuple<TEntry>)[],
  // ): HashKey[];

  // /**
  //  * Add data about an entry to the dex.
  //  *
  //  * @returns The uniqueid/hash of the item added to the dex
  //  */
  // import(
  //   entryWithTags: (XWithTagsObject<TEntry> | XWithTagsTuple<TEntry>)
  // ): HashKey | None;

  // /**
  //  * Add data about an entry to the dex.
  //  *
  //  * @returns The uniqueid/hash of the item added to the dex
  //  */
  // import(
  //   ...entriesWithTags: XWithTags<TEntry>[]
  // ): HashKey[];

  // /**
  //  * Add data about an entry to the dex.
  //  *
  //  * @returns The uniqueid/hash of the item added to the dex
  //  */
  // import(
  //   ...entriesWithTags: (XWithTagsObject<TEntry> | XWithTagsTuple<TEntry>)[]
  // ): HashKey[];

  //#endregion

  //#region Export

  //#endregion

  //#endregion
}

//#region Modifiers

export interface DexModifierFunction<
  TTarget extends [HashKey | Tag | Entry],
  TLinkable extends HashKey | Tag | Entry,
  TResult,
  TArgs extends [Iterable<TLinkable>, ...any]
    | [TLinkable, ...any]
    | [...TLinkable[]]
    | [...TLinkable[], any]
    | []
    | [...any[]]
  = [Iterable<TLinkable>] | [TLinkable] | [...TLinkable[]]
> {
  (...args: [TTarget[0], ...TArgs]): TResult;
  each(targets: Iterable<TTarget[0]>, ...args: TArgs): Map<Tag | HashKey, TResult>
}

export interface TagSetter<TEntry extends Entry> extends DexModifierFunction<
  [tag: Tag],
  TEntry | HashKey,
  number,
  [...entries: (TEntry | HashKey)[]]
    | [entries: Iterable<TEntry | HashKey>]
    | []
> {

  /**
   * Add a new tag to the dex, or assure the given tag exists.
   * Does not update existing entries as no entries array is provided.
   *
   * @returns The number of entries that exist for the given tag.
   */
  (tag: Tag): number;

  /**
   * Add a new empty tag, or set the entries of an existing tag to empty.
   * THIS CLEARS EXISTING TAGS!
   *
   * @returns The number of entries that exist for the given tag. (0 if the operation was fully successful)
   */
  (tag: Tag, entry: TEntry|HashKey, ...entries: (TEntry | HashKey)[]): number;

  /**
   * Add a new tag to the dex with the given entries, or update the current entries for a tag to equal the provided set of entries and keys.
   * THIS OVERRIDES EXISTING TAGS!
   *
   * @returns The number of entries that now exist for the given tag.
   */
  (tag: Tag, entries: Iterable<TEntry | HashKey>): number;

  /**
   * Add new tags to the dex, or assure the given tags exist.
   * Does not update existing entries as no entries array is provided.
   *
   * @returns A map with the number of entries that exist for each tag key.
   */
  each(tags: Iterable<Tag>): Map<Tag, number>;

  /**
   * Add new empty tags, or set the entries of existing tags to empty.
   * THIS CLEARS EXISTING TAGS!
   *
   * @returns A map with the number of entries that exist for each tag key. (0 if the operation was fully successful)
   */
  each(tags: Iterable<Tag>, entry: TEntry|HashKey, ...entries: (TEntry | HashKey)[]): Map<Tag, number>;

  /**
   * Add new tags to the dex with the given entries, or update the current entries for the provided tags to equal the provided set of entries and keys.
   * THIS OVERRIDES EXISTING TAGS!
   *
   * @returns A map with the number of entries that are linked to each tag(key) now.
   */
  each(tags: Iterable<Tag>, entries?: Iterable<TEntry | HashKey>): Map<Tag, number>;
};

export interface EntryAdder<TEntry extends Entry> extends DexModifierFunction<
  [entry: TEntry | HashKey],
  Tag,
  { hashKey: HashKey | None, tagCount: number, isNew: boolean },
  [...tags: Tag[]]
    | [tags: Iterable<Tag>]
    | [tag: Tag]
    | []
> {
  
  /**
   * Add the given entry to the array if it doesn't yet exist.
   * 
   * @returns The new hash key of the given item(if it was newly added), and the updated count of tags in the item.
   */
  (entry: TEntry): { hashKey: HashKey | None, tagCount: number, isNew: boolean };

  /**
   * Add the given entry to the array if it doesn't yet exist, and link it with the provided tags.
   * 
   * @returns The new hash key of the given item(if it was newly added), and the updated count of tags in the item.
   */
  (entry: TEntry | HashKey, tag: Tag, ...tags: Tag[]): { hashKey: HashKey | None, tagCount: number, isNew: boolean };

  /**
   * Add the given entry to the array if it doesn't yet exist, and link it with the provided tag.
   * 
   * @returns The new hash key of the given item(if it was newly added), and the updated count of tags in the item.
   */
  (entry: TEntry | HashKey, tags: Iterable<Tag>): { hashKey: HashKey | None, tagCount: number, isNew: boolean };

  /**
   * Add the given entry to the array if it doesn't yet exist, and link it with the provided tag.
   * 
   * @returns The new hash key of the given item(if it was newly added), and the updated count of tags in the item.
   */
  (entry: TEntry | HashKey, tags: TagOrTags): { hashKey: HashKey | None, tagCount: number, isNew: boolean };

  /**
   * Add the given entries to the dex if it doesn't yet exist.
   * 
   * @returns A Map keyed by the hash key of added entries, with a boolean indicating if the entry is new and the updated count of tags in the item.
   */
  each(entries: Iterable<TEntry | HashKey>): Map<HashKey, { hashKey: HashKey | None, tagCount: number , isNew: boolean }>;

  /**
   * Add the given entries to the dex if it doesn't yet exist, and link them with the provided tags.
   * 
   * @returns A Map keyed by the hash key of added entries, with a boolean indicating if the entry is new and the updated count of tags in the item.
   */
  each(entries: Iterable<TEntry | HashKey>, tag: Tag, ...tags: Tag[]): Map<HashKey, { hashKey: HashKey | None, tagCount: number , isNew: boolean }>;

  /**
   * Add the given entries to the dex if it doesn't yet exist, and link them with the provided tags.
   * 
   * @returns A Map keyed by the hash key of added entries, with a boolean indicating if the entry is new and the updated count of tags in the item.
   */
  each(entries: Iterable<TEntry | HashKey>, tags: TagOrTags): Map<HashKey, { hashKey: HashKey | None, tagCount: number , isNew: boolean }>;
};

export interface Tagger<TEntry extends Entry>
  extends DexModifierFunction<
    [entry: TEntry | HashKey],
    Tag,
    number | NoEntryFound,
    [...tags: Tag[]]
      | [tags: Iterable<Tag>]
      | [tag: Tag]
      | []
  >
{
  /**
   * Add tags to an existing entry.
   * 
   * @returns the number of tags set for the entry after updating or 0/falsey on failure or not found entry.
   */
  (entry: TEntry | HashKey, tags: Iterable<Tag>): number | NoEntryFound;

  /**
   * Add tags to an existing entry.
   * 
   * @returns the number of tags set for the entry after updating or 0/falsey on failure or not found entry.
   */
  (entry: TEntry | HashKey, tag: Tag, ...tags: Tag[]): number | NoEntryFound;

  /**
   * Add tags to an existing entry.
   * 
   * @returns the number of tags set for the entry after updating or 0/falsey on failure or not found entry.
   */
  (entry: TEntry | HashKey, tags: TagOrTags): number | NoEntryFound;
  
  /**
   * Add tags to an existing entries.
   * 
   * @returns a map keyed by the entry with the number of tags set for the entry after updating or 0/falsey on failure or not found entry.
   */
  each(entres: Iterable<TEntry | HashKey>, tags: Iterable<Tag>): Map<HashKey, number>;

  /**
   * Add tags to an existing entries.
   * 
   * @returns a map keyed by the entry with the number of tags set for the entry after updating or 0/falsey on failure or not found entry.
   */
  each(entres: Iterable<TEntry | HashKey>, tag: Tag, ...tags: Tag[]): Map<HashKey, number>;
  
  /**
   * Add tags to an existing entries.
   * 
   * @returns a map keyed by the entry with the number of tags set for the entry after updating or 0/falsey on failure or not found entry.
   */
  each(entres: Iterable<TEntry | HashKey>, tags: TagOrTags): Map<HashKey, number>;
}

export interface Untagger<TEntry extends Entry>
  extends DexModifierFunction<
    [entry: TEntry | HashKey],
    Tag,
    {foundEntry: boolean | NoEntryFound, tagCount?: number},
    [...tags: Tag[]]
      | [tags: Iterable<Tag>]
      | [tag: Tag]
      | []
  >
{

  /**
   * Un-link/remove tags from an existing entry.
   * 
   * @returns the number of tags set for the entry after updating.
   */
  (entry: TEntry | HashKey, tags: Iterable<Tag>): {foundEntry: boolean | NoEntryFound, tagCount: number};

  /**
   * Un-link/remove tags from an existing entry.
   * 
   * @returns the number of tags set for the entry after updating, or FALSE if the entry wasn't found at all.
   */
  (entry: TEntry | HashKey, tag: Tag, ...tags: Tag[]): {foundEntry: boolean | NoEntryFound, tagCount: number};

  /**
   * Un-link/remove tags from an existing entry.
   * 
   * @returns the number of tags set for the entry after updating, or FALSE if the entry wasn't found at all.
   */
  (entry: TEntry | HashKey, tags: TagOrTags): {foundEntry: boolean | NoEntryFound, tagCount: number};
  
  /**
   * Un-link/remove tags from an existing entry.
   * 
   * @returns A map, indexed by the key of the entry, with the number of tags set for the entry after updating, or FALSE if the entry wasn't found at all.
   */
  each(entries: Iterable<TEntry | HashKey>, tags: Iterable<Tag>): Map<HashKey, {foundEntry: boolean | NoEntryFound, tagCount: number}>;
  
  /**
   * Un-link/remove tags from an existing entry.
   * 
   * @returns A map, indexed by the key of the entry, with the number of tags set for the entry after updating, or FALSE if the entry wasn't found at all.
   */
  each(entries: Iterable<TEntry | HashKey>, tag: Tag, ...tags: Tag[]): Map<HashKey, {foundEntry: boolean | NoEntryFound, tagCount: number}>;
  
  /**
   * Un-link/remove tags from an existing entry.
   * 
   * @returns A map, indexed by the key of the entry, with the number of tags set for the entry after updating, or FALSE if the entry wasn't found at all.
   */
  each(entries: Iterable<TEntry | HashKey>, tags: TagOrTags): Map<HashKey, {foundEntry: boolean | NoEntryFound, tagCount: number}>;
}

export interface EntryRemover<TEntry extends Entry>
  extends DexModifierFunction<
    [entry: TEntry],
    Tag,
    {wasRemoved: boolean | NoEntryFound, tagCount?: number},
    []
      | [unlinkTags: Iterable<Tag>]
      | [unlinkTags: Iterable<Tag>, options: {keepTaglessEntries?: true, dropEmptyTags?: true}]
      | [...unlinkTags: Tag[], options: {keepTaglessEntries?: true, dropEmptyTags?: true}]
      | [unlinkFromTag: Tag]
      | [options?: {keepTaglessEntries?: true, dropEmptyTags?: true}]
  > {
  
  /**
   * remove the entry and any links it had to any tags from this dex.
   * 
   * @returns results with validation if something was removed or found at all.
   */
  (entry: TEntry | HashKey): { wasRemoved: boolean | NoEntryFound };
  
  /**
   * remove the entry and any links it had to any tags from this dex.
   * 
   * @returns results with validation if something was removed or found at all.
   */
  (entry: TEntry | HashKey, options?: { dropEmptyTags?: true }): {wasRemoved: boolean | NoEntryFound};

  /**
   * remove any links for the given entry to the provided tags, if the entry exists
   * 
   * @returns results with validation if something was removed or found at all as well as the number of tags after the update.
   */
  (entry: TEntry | HashKey, unlinkFromTags: TagOrTags, options?: { keepTaglessEntries?: true, dropEmptyTags?: true }): {wasRemoved: boolean | NoEntryFound, tagCount: number};

  /**
   * remove any links for the given entry to the provided tags, if the entry exists
   * 
   * @returns results with validation if something was removed or found at all as well as the number of tags after the update.
   */
  (entry: TEntry | HashKey, options?: { keepTaglessEntries?: true, dropEmptyTags?: true }, ...forTags: Tag[]): {wasRemoved: boolean | NoEntryFound, tagCount: number};

  /**
   * remove any links for the given entry to the provided tags, if the entry exists
   * 
   * @returns results with validation if something was removed or found at all as well as the number of tags after the update.
   */
  (entry: TEntry | HashKey, unlinkFromTag: Tag, ...andTags: Tag[]): {wasRemoved: boolean | NoEntryFound, tagCount: number};

  /**
   * remove any links for the given entry to the provided tags, if the entry exists
   * 
   * @returns results with validation if something was removed or found at all as well as the number of tags after the update.
   */
  (entry: TEntry | HashKey, unlinkFromTag: Tag, options: { keepTaglessEntries?: true, dropEmptyTags?: true }): {wasRemoved: boolean | NoEntryFound, tagCount: number};

  /**
   * remove any links for the given entry to the provided tags, if the entry exists
   * 
   * @returns results with validation if something was removed or found at all as well as the number of tags after the update.
   */
  (entry: TEntry | HashKey, unlinkFromTagOrTagWithOptions: [...Tag[], { keepTaglessEntries?: true, dropEmptyTags?: true }]): {wasRemoved: boolean | NoEntryFound, tagCount: number};

  /**
   * remove the given entries from the dex, if they exists
   * 
   * @returns A Map, indexed by entry key, with values consisting of a results object with a validation if something was removed or found at all, as well as the number of tags after the update
   */
  each(entres: Iterable<TEntry | HashKey>, options?: { keepTaglessEntries?: true, dropEmptyTags?: true }): Map<HashKey, {wasRemoved: boolean | NoEntryFound}>;

  /**
   * remove any links for the given entries to the provided tags, if the entries exists
   * 
   * @returns A Map, indexed by entry key, with values consisting of a results object with a validation if something was removed or found at all, as well as the number of tags after the update
   */
  each(entres: Iterable<TEntry | HashKey>, unnlinkFromTag: Tag, ...andTags: Tag[]): Map<HashKey, {wasRemoved: boolean | NoEntryFound, tagCount: number}>;

  /**
   * remove any links for the given entries to the provided tags, if the entries exists
   * 
   * @returns A Map, indexed by entry key, with values consisting of a results object with a validation if something was removed or found at all, as well as the number of tags after the update
   */
  each(entres: Iterable<TEntry | HashKey>, options: { keepTaglessEntries?: true, dropEmptyTags?: true }, ...andTags: Tag[]): Map<HashKey, {wasRemoved: boolean | NoEntryFound, tagCount: number}>;

  /**
   * remove any links for the given entries to the provided tags, if the entries exists
   * 
   * @returns A Map, indexed by entry key, with values consisting of a results object with a validation if something was removed or found at all, as well as the number of tags after the update
   */
  each(entres: Iterable<TEntry | HashKey>, unlinkFromTagOrTagWithOptions: [...Tag[], { keepTaglessEntries?: true, dropEmptyTags?: true }]): Map<HashKey, {wasRemoved: boolean | NoEntryFound, tagCount: number}>;

  /**
   * remove any links for the given entries to the provided tags, if the entries exists
   * 
   * @returns A Map, indexed by entry key, with values consisting of a results object with a validation if something was removed or found at all, as well as the number of tags after the update
   */
  each(entres: Iterable<TEntry | HashKey>, unlinkFromTags: TagOrTags, options?: { keepTaglessEntries?: true, dropEmptyTags?: true }): Map<HashKey, {wasRemoved: boolean | NoEntryFound, tagCount: number}>;  
}

export interface TagDropper {

  /**
   * Drop the tag from the dex, removing it and all links to it, as well as removing any now orphaned/linkless/tagless entries.
   *
   * @returns true if the tag was both found and removed.
   */
  (tag: Tag): boolean;

  /**
   * Drop the tag from the dex, removing it and all links to it, as well as removing any now orphaned/linkless/tagless entries by default.
   *
   * @returns true if the tag was both found and removed.
   */
  (tag: Tag, options?: { keepTaglessEntries?: true }): boolean;

  /**
   * Drop the tag from the dex, removing it and all links to it, as well as removing any now orphaned/linkless/tagless entries.
   *
   * @returns a set with all successfully removed tags.
   */
  (...tags: Tag[]): Set<Tag>;

  /**
   * Drop the tag from the dex, removing it and all links to it, as well as removing any now orphaned/linkless/tagless entries by default.
   *
   * @returns a set with all successfully removed tags.
   */
  (tags: Iterable<Tag>, options?: { keepTaglessEntries?: true }): Set<Tag>;

  /**
   * Drop the tag from the dex, removing it and all links to it, as well as removing any now orphaned/linkless/tagless entries.
   *
   * @returns a set with all successfully removed tags.
   */
  (...tagsAndOptions: [...Tag[], { keepTaglessEntries?: true }]): Set<Tag>;

  /**
   * Drop the tag from the dex, removing it and all links to it, as well as removing any now orphaned/linkless/tagless entries by default.
   *
   * @returns a set with all successfully removed tags.
   */
  (options: { keepTaglessEntries?: true }, tags: Iterable<Tag>): Set<Tag>;

  /**
   * Drop the tag from the dex, removing it and all links to it, as well as removing any now orphaned/linkless/tagless entries by default.
   *
   * @returns a set with all successfully removed tags.
   */
  (options: { keepTaglessEntries?: true }, ...tags: Tag[]): Set<Tag>;

  /**
   * Drop the tag from the dex, removing it and all links to it, as well as removing any now orphaned/linkless/tagless entries by default.
   *
   * @returns true if the tag was both found and removed.
   */
  (options: { keepTaglessEntries?: true }, tag: Tag): boolean;
};

export interface TagResetter {

  /**
   * Resets a given tag by untagging it from any entries linked to it in the dex.
   *
   * @returns true if the tag was both found and cleared.
   */
  (tag: Tag): boolean;

  /**
   * Resets a given tag by untagging it from any entries linked to it in the dex. You can optionally clean all entries this orphans as well with the options.
   *
   * @returns true if the tag was both found and cleared.
   */
  (tag: Tag, options?: { removeTaglessEntries?: true }): boolean;

  /**
   * Resets a the given tags by untagging it from any entries linked to it in the dex. You can optionally clean all entries this orphans as well with the options.
   *
   * @returns a set with all successfully cleared tags.
   */
  (...tags: Tag[]): Set<Tag>;

  /**
   * Resets a the given tags by untagging them from any entries linked to them in the dex. You can optionally clean all entries this orphans as well with the options.
   *
   * @returns a set with all successfully cleared tags.
   */
  (tags: Iterable<Tag>, options?: { removeTaglessEntries?: true }): Set<Tag>;

  /**
   * Resets a the given tags by untagging them from any entries linked to them in the dex. You can optionally clean all entries this orphans as well with the options.
   *
   * @returns a set with all successfully cleared tags.
   */
  (...tagsAndOptions: [...Tag[], { removeTaglessEntries?: true }]): Set<Tag>;

  /**
   * Resets a the given tags by untagging them from any entries linked to them in the dex. You can optionally clean all entries this orphans as well with the options.
   *
   * @returns a set with all successfully cleared tags.
   */
  (options: { removeTaglessEntries?: true }, tags: Iterable<Tag>): Set<Tag>;

  /**
   * Resets a the given tags by untagging them from any entries linked to them in the dex. You can optionally clean all entries this orphans as well with the options.
   *
   * @returns a set with all successfully cleared tags.
   */
  (options: { removeTaglessEntries?: true }, ...tags: Tag[]): Set<Tag>;

  /**
   * Resets a the given tag by untagging it from any entries linked to it in the dex. You can optionally clean all entries this orphans as well with the options.
   *
   * @returns a set with all successfully cleared tags.
   */
  (options: { removeTaglessEntries?: true }, tag: Tag): boolean;
};

/**
 * Default filter for modifier arguments.
 */
export function filterModifierArgs<TTarget extends [key: HashKey | Tag | Entry]>(args: any[]) {
  let baseArgs: [TTarget | Iterable<TTarget>, Iterable<any>] = [args.shift(), undefined!];
  if (args[1]) {
    baseArgs[1] = args;
  } else if (Check.isNonStringIterable(args[0])) {
    baseArgs[1] = args.shift();
  } else if (args[0] !== undefined) {
    baseArgs[1] = [args.shift()]
  }

  return baseArgs;
}

//#region Internal

/** @internal */
export function DexModifierFunctionConstructor<
  TEntry extends Entry,
  TTarget extends [HashKey | Tag | Entry],
  TLinkable extends HashKey | Tag | Entry,
  TResult,
  TArgs extends [Iterable<TLinkable>, ...any]
    | [TLinkable, ...any]
    | [...TLinkable[]]
    | [...TLinkable[], any]
    | []
    | [...any[]] = [Iterable<TLinkable>] | [TLinkable] | [...TLinkable[]]
>(
  dex: IReadableDex<TEntry>,
  base: (target: TTarget[0], linkables: Iterable<TLinkable>, ...rest: any[]) => TResult,
  filterArgs: (args: any[]) => [TTarget[0] | Iterable<TTarget[0]>, Iterable<TLinkable>, ...any[]] = filterModifierArgs,
  onStart?: () => [...any] | undefined,
  onComplete?: (wasEachVersion: boolean, ...rest: [...any]) => void
): DexModifierFunction<TTarget, TLinkable, TResult, TArgs> {
  const modifier = function dexModifier(
    ...args: [TTarget[0], ...TArgs]
  ) {
    const initArgs = onStart?.() ?? [];
    const baseArgs = filterArgs(args) as [TTarget[0], Iterable<TLinkable>];
    const result = base(baseArgs[0], baseArgs[1], ...baseArgs.slice(2), ...initArgs);
    onComplete?.(false, ...args, ...initArgs);
    return result;
  } 

  modifier.each = function dexEachModifier(
    targets: Iterable<TTarget[0]>,
    ...args: TArgs
  ): Map<HashKey | Tag, TResult> {
    const initArgs = onStart?.() ?? [];
    const result = new Map<HashKey | Tag, TResult>();
    const baseArgs = filterArgs([targets, ...args]) as [TTarget[0][], Iterable<TLinkable>];
    const restArgs = baseArgs.slice(2);
    for (const target of baseArgs[0]) {
      const baseResult = base(target, baseArgs[1], ...restArgs, ...initArgs);
      if (baseResult !== NO_RESULT) {
        result.set(dex.hash(target)!, baseResult);
      }
    }

    onComplete?.(false, ...args, ...initArgs);
    return result;
  }

  return modifier;
}

//#endregion

//#endregion