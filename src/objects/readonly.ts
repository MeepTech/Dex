import { IEntry, IEntrySet } from "./subsets/entries";
import { ILooper } from "./helpers/loops";
import { IMapper } from "./helpers/maps";
import { ITag, ITagSet } from "./subsets/tags";
import { IHashKey, IHashSet } from "./subsets/hashes";
import { IBasicQuery, IFirstableQuery, IFullQuery, IQueryChain, NoEntryFound, QueryResultCalculator, QueryResults } from "./queries/queries";
import { IBreakable } from "../utilities/breakable";
import Dex, { Config } from "./dex";
import {  IFlag, ILogicFlag, IResultFlag, FLAGS } from "./queries/flags";

/**
 * Interface for a Dex that shouldn't be directly modified.
 */
export interface IReadOnlyDex<TEntry extends IEntry = IEntry> {

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
  get hashes(): IHashSet<TEntry>;

  //#endregion

  //#region Loop Helpers

  /**
   * Quick access to the foreach loops.
   *
   * for() = forEach()
   * for.entries() = forEachEntry()
   * for.tags() = forEachTag()
   */
  get for(): ILooper<TEntry>;

  /**
   * Quick access to the foreach loops.
   *
   * map() = mapAllPairs()
   * map.entries() = toArray()
   * map.tags() = splay()
   */
  get map(): IMapper<TEntry>;

  //#endregion

  get config(): Config<TEntry>;

  //#endregion

  //#region Methods

  //#region Get

  //#region General

  /**
   * Get an entry by it's hash key
   */
  get(key: IHashKey): TEntry | NoEntryFound;

  /**
   * Get a dex's hash key for any type of entry.
   */
  hash(entry: IEntry): IHashKey | undefined;

  /**
   * Check if the Dex contains the value or it's hash.
   * This returns true if the entry has no tags as well.
   */
  contains(entry: TEntry | IHashKey): boolean;

  /**
   * Check if an item is a valid entry for this dex.
   */
  canContain(value: IEntry): boolean;

  /**
   * Check if the dex is tracking a given tag.
   * This returns true if the tag has no entries as well.
   */
  has(tag: ITag): boolean;

  /**
  * return a copy of this dex.
  */
  copy(): Dex<TEntry>;

  /**
   * Create a new dex that contains this dex's entries, merged with anothers.
   */
  merge(other: Dex<TEntry>): Dex<TEntry>;

  //#endregion

  //#region Queries

  /**
   * Get an array or dex of all entries that match a given set of tags and the optionally provided settings.
   * (This is a less versitile version of query)
   */
  search: IBasicQuery<TEntry>;

  /**
   * Get an array or dex of all entries that match a given set of tags and the optionally provided settings.
   */
  query: IFullQuery<TEntry>;

  /**
   * Returns a new dex filtered by the given tags and options.
   * Similar to select, but without sub-methods and less versitile.
   */
  filter: IBasicQuery<TEntry, typeof FLAGS.CHAIN | ILogicFlag, TEntry, Dex<TEntry>>;

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
  : IQueryChain<TEntry, IResultFlag | typeof FLAGS.NOT | typeof FLAGS.OR>

  /**
   * Get a dex of all entries that match any of the given set of tags and the optionally provided settings.
   */
  or
  : IQueryChain<TEntry, IResultFlag | typeof FLAGS.NOT | typeof FLAGS.OR>

  /**
   * Get the first entry matching the query tags and options.
   */
  value: IBasicQuery<TEntry, typeof FLAGS.FIRST | ILogicFlag, TEntry, TEntry | NoEntryFound>;

  /**
   * Returns an array of values filtered by the given tags and options.
   * Returns all results as an array if no parameters are provided.
   */
  values: IFirstableQuery<TEntry, typeof FLAGS.VALUES | ILogicFlag, TEntry, TEntry[]>;

  /**
   * Get the first hash matching the results of the query values
   */
  key: IBasicQuery<IHashKey, typeof FLAGS.FIRST | ILogicFlag, TEntry, IHashKey | NoEntryFound>

  /**
   * Get hashes of the entries matching the results of the query.
   * Returns all results as an array if no parameters are provided.
   */
  keys: IFirstableQuery<IHashKey, typeof FLAGS.VALUES | ILogicFlag, TEntry, IHashKey[]>;

  /**
   * Get the first entry matching the query tags and options.
   */
  first: IFullQuery<TEntry, typeof FLAGS.FIRST | ILogicFlag, TEntry, TEntry | NoEntryFound>;

  /**
   * Returns true if any entries match the query.
   */
  any: IFullQuery<boolean, typeof FLAGS.FIRST | ILogicFlag, TEntry, boolean>

  /**
   * Returns the unique entry count of a given query.
   */
  count: IFullQuery<number, ILogicFlag, TEntry, number>

  //#endregion

  //#region Loops

  //#region for

  /**
    * For each unique entry and tag pair.
    * 
    * @param func 
    */
  forEach(
    func: IBreakable<[entry: TEntry, tag: ITag, index: number], any>,
    outerLoopType?: 'entry' | 'tag'
  ): void

  /**
   * Iterate logic on each tag in the dex.
   */
  forEachTag(
    func: IBreakable<[tag: ITag, index: number, entries: Set<TEntry>], any>
  ): void

  /**
   * Iterate logic on each entry in the dex.
   */
  forEachEntry(
    func: IBreakable<[entry: TEntry, index: number, tags: Set<ITag>], any>
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
    transform?: IBreakable<[entry: TEntry, tag: ITag, index: number], TResult>,
    outerLoopType?: 'entry' | 'tag'
  ): (TResult extends undefined ? Map<IEntry, ITag[]> : TResult[]);

  /**
   * Map this dex's entries to an array.
   */
  toArray<TResult = TEntry>(
    transform?: IBreakable<[entry: TEntry, index: number, tags: Set<ITag>], TResult>
  ): TResult[];

  /**
   * Splay/map this dex's tags into an array.
   */
  splay<TResult>(
    transform?: IBreakable<[tag: ITag, index: number, entries: Set<TEntry>], TResult>
  ): TResult[]

  //#endregion

  //#endregion

  //#endregion

  //#endregion
}
