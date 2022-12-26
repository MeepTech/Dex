import { Entry, IEntrySet } from "./subsets/entries";
import { Looper } from "./loops";
import { Mapper } from "./maps";
import { Tag, ITagSet } from "./subsets/tags";
import { HashKey, IHashSet } from "./subsets/hashes";
import { IBasicQuery, IFirstableQuery, IQuery, IQueryChain, QueryResultCalculator, QueryResults } from "./queries/queries";
import { Breakable } from "../utilities/breakable";
import Dex from "./dex";
import {  Flag, LogicFlag, ResultFlag, FLAGS } from "./queries/flags";

/**
 * Interface for a Dex that shouldn't be directly modified.
 */
export interface IReadOnlyDex<TEntry extends Entry = Entry> {

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
  get entries(): IEntrySet<TEntry>;

  /**
   * Used to get all tags.
   */
  get tags(): ITagSet<TEntry>;

  /**
   * Used to get all hash keys.
   */
  get keys(): IHashSet<TEntry>;

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

  //#endregion

  //#region Methods

  //#region Get

  //#region General

  /**
   * Get an entry by it's hash key
   */
  get(key: HashKey): TEntry | undefined

  /**
   * Check if the Dex contains the value or it's hash.
   * This returns true if the entry has no tags as well.
   */
  contains(entry: TEntry | HashKey): boolean;

  /**
   * Check if the dex is tracking a given tag.
   * This returns true if the tag has no entries as well.
   */
  has(tag: Tag): boolean;

  /**
  * return a copy of this dex.
  */
  copy(): Dex<TEntry>

  //#endregion

  //#region Queries

  /**
   * Get an array or dex of all entries that match a given set of tags and the optionally provided settings.
   * (This is a less versitile version of query)
   */
  find: IBasicQuery<TEntry>;

  /**
   * Get an array or dex of all entries that match a given set of tags and the optionally provided settings.
   */
  query: IQuery<TEntry>;

  /**
   * Returns a new dex filtered by the given tags and options.
   * Similar to select, but without sub-methods and less versitile.
   */
  filter: IBasicQuery<TEntry, TEntry, Dex<TEntry>, typeof FLAGS.CHAIN | LogicFlag>;

  /**
   * Get a dex of all entries that match a given set of tags and the optionally provided settings
   * (uses and + chain by default).
   */
  select
  : IQueryChain<TEntry>

  /**
   * Get a dex of all entries that do not match a given set of tags and the optionally provided settings.
   */
  not
  : IQueryChain<TEntry>

  /**
   * Get a dex of all entries that exactly match a given set of tags and the optionally provided settings.
   */
  and
  : IQueryChain<TEntry, ResultFlag | typeof FLAGS.NOT | typeof FLAGS.OR>

  /**
   * Get a dex of all entries that match any of the given set of tags and the optionally provided settings.
   */
  or
  : IQueryChain<TEntry, ResultFlag | typeof FLAGS.NOT | typeof FLAGS.OR>

  /**
   * Get the first entry matching the query tags and options.
   */
  value: IBasicQuery<TEntry, TEntry, TEntry | undefined, typeof FLAGS.FIRST | LogicFlag>;

  /**
   * Returns an array of values filtered by the given tags and options.
   * Returns all results as an array if no parameters are provided.
   */
  values: IFirstableQuery<TEntry, TEntry, TEntry[], typeof FLAGS.VALUES | LogicFlag>;

  /**
   * Get the first hash matching the results of the query values
   */
  hash: IBasicQuery<HashKey, TEntry, HashKey | undefined, typeof FLAGS.FIRST | LogicFlag>

  /**
   * Get hashes of the entries matching the results of the query.
   * Returns all results as an array if no parameters are provided.
   */
  hashes: IFirstableQuery<HashKey, TEntry, HashKey[], typeof FLAGS.VALUES | LogicFlag>;

  /**
   * Get the first entry matching the query tags and options.
   */
  first: IQuery<TEntry, TEntry, typeof FLAGS.FIRST | LogicFlag, TEntry | undefined>;

  /**
   * Returns true if any entries match the query.
   */
  any: IQuery<boolean, TEntry, typeof FLAGS.FIRST | LogicFlag, boolean>

  /**
   * Returns the unique entry count of a given query.
   */
  count: IQuery<number, TEntry, LogicFlag, number>

  //#endregion

  //#region Loops

  //#region for

  /**
    * For each unique entry and tag pair.
    * 
    * @param func 
    */
  forEach(
    func: Breakable<[entry: TEntry, tag: Tag, index: number], any>,
    outerLoopType: 'entry' | 'tag'
  ): void

  /**
   * Iterate logic on each tag in the dex.
   */
  forEachTag(
    func: Breakable<[tag: Tag, index: number, entries: Set<TEntry>], any>
  ): void

  /**
   * Iterate logic on each entry in the dex.
   */
  forEachEntry(
    func: Breakable<[entry: TEntry, index: number, tags: Set<Tag>], any>
  ): void

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
    transform?: Breakable<[entry: TEntry, tag: Tag, index: number], TResult>,
    outerLoopType?: 'entry' | 'tag'
  ): (TResult extends undefined ? Map<Entry, Tag[]> : TResult[]);

  /**
   * Map this dex's entries to an array.
   */
  toArray<TResult = TEntry>(
    transform?: Breakable<[entry: TEntry, index: number, tags: Set<Tag>], TResult>
  ): TResult[];

  /**
   * Splay/map this dex's tags into an array.
   */
  splay<TResult>(
    transform?: Breakable<[tag: Tag, index: number, entries: Set<TEntry>], TResult>
  ): TResult[]

  //#endregion

  //#endregion

  //#endregion

  //#endregion
}
