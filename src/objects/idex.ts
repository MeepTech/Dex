import { Entry, EntrySet } from "./subsets/entries";
import { Looper } from "./helpers/loops";
import { Mapper } from "./helpers/maps";
import { Tag, TagSet } from "./subsets/tags";
import { HashKey, HashSet } from "./subsets/hashes";
import {
  FirstableQuery,
  FullQuery,
  SpecificQuery
} from "./queries/queries";
import { IBreakable } from "../utilities/iteration";
import Dex, { Config } from "./dex";
import { NoEntryFound, ResultType } from "./queries/results";

/**
 * Interface for a Dex that shouldn't be directly modified.
 */

export interface IReadOnlyDex<TEntry extends Entry = Entry> extends Iterable<[HashKey, TEntry, Set<Tag>]> {

  //#region Properties
  //#region Counts
  /**
   * How many uniue entries  are in the dex
   */
  get numberOfEntries(): number;

  /**
   * How many uniue tags are in the dex
   */
  get numberOfTags(): number;

  //#endregion
  //#region Sub Sets
  /**
   * Used to get all the unique entries.
   */
  get entries(): EntrySet<TEntry>;

  /**
   * Used to get all tags.
   */
  get tags(): TagSet<TEntry>;

  /**
   * Used to get all hash keys.
   */
  get hashes(): HashSet<TEntry>;

  //#endregion
  //#region Loop Helpers
  /**
   * Quick access to the foreach loops.
   *
   * for() = forEach()
   * for.entries() = forEachEntry()
   * for.tags() = forEachTag()
   */
  get for(): Looper<TEntry>;

  /**
   * Quick access to the foreach loops.
   *
   * map() = mapAllPairs()
   * map.entries() = toArray()
   * map.tags() = splay()
   */
  get map(): Mapper<TEntry>;

  //#endregion
  get config(): Config<TEntry>;

  //#endregion
  //#region Methods
  //#region Get
  //#region General
  /**
   * Get an entry by it's hash key
   */
  get(key: HashKey): TEntry | NoEntryFound;

  /**
   * Get a dex's hash key for any type of entry.
   */
  hash(entry: Entry): HashKey | undefined;

  /**
   * Check if the Dex contains the value or it's hash.
   * This returns true if the entry has no tags as well.
   */
  contains(entry: TEntry | HashKey): boolean;

  /**
   * Check if an item is a valid entry for this dex.
   */
  canContain(value: Entry): boolean;

  /**
   * Check if the dex is tracking a given tag.
   * This returns true if the tag has no entries as well.
   */
  has(tag: Tag): boolean;

  /**
  * return a copy of this dex.
  */
  copy(): Dex<TEntry>;

  /**
   * Prevent this dex from being modified at all!
   */
  seal(): void;

  /**
   * Create a new dex that contains this dex's entries, merged with anothers.
   */
  merge(other: Dex<TEntry>): Dex<TEntry>;

  //#endregion
  //#region Queries
  /**
   * Get an array or dex of all entries that match a given set of tags and the optionally provided settings.
   */
  query: FullQuery<TEntry, ResultType, TEntry>;

  /**
   * Returns a new dex filtered by the given tags and options.
   */
  filter: SpecificQuery<TEntry, ResultType.Dex, TEntry>;

  /**
   * Returns an array of values filtered by the given tags and options.
   * Returns all results as an array if no parameters are provided.
   */
  values: FirstableQuery<TEntry, ResultType.Array, TEntry>;

  /**
   * Get hashes of the entries matching the results of the query.
   * Returns all results as an array if no parameters are provided.
   */
  keys: FirstableQuery<HashKey, ResultType.Set, TEntry>;

  /**
   * Get the first entry matching the query tags and options.
   */
  first: SpecificQuery<TEntry, ResultType.First, TEntry>;

  /**
   * Returns true if any entries match the query.
   */
  any: SpecificQuery<boolean, ResultType.First, TEntry>;

  /**
   * Returns the unique entry count of a given query.
   */
  count: SpecificQuery<number, ResultType.First, TEntry>;

  //#endregion
  //#region Loops
  //#region for
  /**
    * For each unique entry and tag pair.
    *
    * @param func
    */
  forEach(
    func: IBreakable<[entry: TEntry, tag: Tag, index: number], any>,
    outerLoopType?: 'entry' | 'tag'
  ): void;

  /**
   * Iterate logic on each tag in the dex.
   */
  forEachTag(
    func: IBreakable<[tag: Tag, index: number, entries: Set<TEntry>], any>
  ): void;

  /**
   * Iterate logic on each entry in the dex.
   */
  forEachEntry(
    func: IBreakable<[entry: TEntry, index: number, tags: Set<Tag>], any>
  ): void;

  //#endregion
  //#region Map
  /**
   * Get a map of the entries and their tags, or map all unique pairs to your own array of values.
   *
   * @param transform The transform function. Takes every unique pair. If not provided, this returns a map of type Map<Entry, Tag[]>
   * @param outerLoopType The type to use in the outer loop. This is to help speed in certain cases where you want to break out of the loop early.
   *
   * @returns A mapped array of values, or a Map<Entry, Tag[]> if no transform was provided.
   */
  toMap<TResult = undefined>(
    transform?: IBreakable<[entry: TEntry, tag: Tag, index: number], TResult>,
    outerLoopType?: 'entry' | 'tag'
  ): (TResult extends undefined ? Map<Entry, Tag[]> : TResult[]);

  /**
   * Map this dex's entries to an array.
   */
  toArray<TResult = TEntry>(
    transform?: IBreakable<[entry: TEntry, index: number, tags: Set<Tag>], TResult>
  ): TResult[];

  /**
   * Splay/map this dex's tags into an array.
   */
  splay<TResult>(
    transform?: IBreakable<[tag: Tag, index: number, entries: Set<TEntry>], TResult>
  ): TResult[];

}
