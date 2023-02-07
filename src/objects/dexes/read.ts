import {
  Entry,
  EntryMapConstructor,
  EntrySet,
  IHasher,
  None,
  NONE_FOR_TAG
} from "../subsets/entries";
import { Looper, LooperConstructor } from "../helpers/loops";
import { Mapper, MapperConstructor } from "../helpers/maps";
import {
  Tag,
  TagSet,
  TagSetConstructor
} from "../subsets/tags";
import {
  HashKey,
  HashSet,
  HashSetConstructor
} from "../subsets/hashes";
import Queries from "../queries/queries";
import Loop from "../../utilities/iteration";
import Dex, { Config, isDex } from "./dex";
import { NoEntryFound, ResultType } from "../queries/results";
import { ReadOnlyCopier, ReadOnlyCopierConstructor } from "../helpers/copy";

//#region Symbols

/** @internal */
export namespace InternalRDexSymbols {
  export const _allTags: unique symbol = Symbol("_allTags");
  export const _allHashes: unique symbol = Symbol("_allHashes");
  export const _hashesByTag: unique symbol = Symbol("_hashesByTag");
  export const _tagsByHash: unique symbol = Symbol("_tagsByHash");
  export const _entriesByHash: unique symbol = Symbol("_entriesByHash");
  export const _getSimpleCopier: unique symbol = Symbol("_getSimpleCopier");
}

//#endregion

/**
 * Interface for reading from and querying from a dex.
 */

export interface IReadableDex<TEntry extends Entry = Entry> extends Iterable<[HashKey | undefined, TEntry | None, Set<Tag>]> {

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

  /**
   * Return a copy of the dex's config.
   */
  get config(): Config<TEntry>;

  /**
   * Returns a copy of all the dex's raw data
   */
  get data(): {
    tags: Set<Tag>,
    hashes: Set<HashKey>,
    entries: Map<HashKey, TEntry>,
    hashesByTag: Map<Tag, Set<HashKey>>,
    tagsByHash: Map<HashKey, Set<Tag>>
  }

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
   * Check if the dex is tracking a given tag.
   * This returns true if the tag has no entries as well.
   */
  has(tag: Tag): boolean;

  /**
  * return a copy of this dex.
  */
  get copy(): ReadOnlyCopier<TEntry>;

  /**
   * Create a new dex that contains this dex's entries, merged with anothers.
   */
  merge(other: Dex<TEntry>): IReadableDex<TEntry>;

  //#endregion
  //#region Queries
  /**
   * Get an array or dex of all entries that match a given set of tags and the optionally provided settings.
   */
  get query(): Queries.Full<TEntry, ResultType, TEntry>;

  /**
   * Returns a new dex filtered by the given tags and options.
   */
  get filter(): Queries.Specific<TEntry, ResultType.Dex, TEntry>;

  /**
   * Returns an array of values filtered by the given tags and options.
   * Returns all results as an array if no parameters are provided.
   */
  get values(): Queries.Firstable<TEntry, ResultType.Array, TEntry>;

  /**
   * Get hashes of the entries matching the results of the query.
   * Returns all results as an array if no parameters are provided.
   */
  get keys(): Queries.Firstable<HashKey, ResultType.Set, TEntry>;

  /**
   * Get the first entry matching the query tags and options.
   */
  get first(): Queries.Specific<TEntry, ResultType.First, TEntry>;

  /**
   * Returns true if any entries match the query.
   */
  get any(): Queries.Specific<boolean, ResultType.First, TEntry>;

  /**
   * Returns the unique entry count of a given query.
   */
  get count(): Queries.Specific<number, ResultType.First, TEntry>;

  //#endregion
  //#region Loops
  //#region for
  /**
    * For each unique entry and tag pair.
    *
    * @param func
    */
  forEach(
    func: Loop.IBreakable<[entry: TEntry, tag: Tag, index: number], any>,
    outerLoopType?: 'entry' | 'tag'
  ): void;

  /**
   * Iterate logic on each tag in the dex.
   */
  forEachTag(
    func: Loop.IBreakable<[tag: Tag, index: number, entries: Set<TEntry>], any>
  ): void;

  /**
   * Iterate logic on each entry in the dex.
   */
  forEachEntry(
    func: Loop.IBreakable<[entry: TEntry, index: number, tags: Set<Tag>], any>
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
    transform?: Loop.IBreakable<[entry: TEntry, tag: Tag, index: number], TResult>,
    outerLoopType?: 'entry' | 'tag'
  ): (TResult extends undefined ? Map<Entry, Tag[]> : TResult[]);

  /**
   * Map this dex's entries to an array.
   */
  toArray<TResult = TEntry>(
    transform?: Loop.IBreakable<[entry: TEntry, index: number, tags: Set<Tag>], TResult>
  ): TResult[];

  /**
   * Splay/map this dex's tags into an array.
   */
  splay<TResult>(
    transform?: Loop.IBreakable<[tag: Tag, index: number, entries: Set<TEntry>], TResult>
  ): TResult[];

}

/**
 * The base for dex's with read logic.
 * A simple dex that can only be queried and read from.
 * This does not have any built in way to modify it, this mainly just holds the logic for more complex dexes like Dex and SealedDex.
 */
export abstract class ReadOnlyDex<TEntry extends Entry> implements IReadableDex<TEntry> {
  // data
  // TODO: when TS implements stage 3: @hideInProxy
  protected readonly [InternalRDexSymbols._allTags]
    : Set<Tag>;
  // TODO: when TS implements stage 3: @hideInProxy
  protected readonly [InternalRDexSymbols._allHashes]
    : Set<HashKey>;
  // TODO: when TS implements stage 3: @hideInProxy
  protected readonly [InternalRDexSymbols._hashesByTag]
    : Map<Tag, Set<HashKey>>;
  // TODO: when TS implements stage 3: @hideInProxy
  protected readonly [InternalRDexSymbols._tagsByHash]
    : Map<HashKey, Set<Tag>>;
  // TODO: when TS implements stage 3: @hideInProxy
  protected readonly [InternalRDexSymbols._entriesByHash]
    : Map<HashKey, TEntry>;

  // config
  /** @readonly */
  // TODO: when TS implements stage 3: @hideInProxy
  protected _hasher: IHasher
    = null!;

  // lazy
  // - queries
  #query?: Queries.Full<TEntry, ResultType, TEntry>;
  #filter?: Queries.Specific<TEntry, ResultType.Dex, TEntry>;
  #values?: Queries.Firstable<TEntry, ResultType.Array, TEntry>;
  #keys?: Queries.Firstable<HashKey, ResultType.Set, TEntry>;
  #first?: Queries.Specific<TEntry, ResultType.First, TEntry>;
  #any?: Queries.Specific<boolean, ResultType.First, TEntry>;
  #count?: Queries.Specific<number, ResultType.First, TEntry>;

  // - subsets
  #hashSet?: HashSet<TEntry>;
  #tagSet?: TagSet<TEntry>;
  #entrySet?: EntrySet<TEntry>;

  // - helpers
  #forLooper?: Looper<TEntry>;
  #mapLooper?: Mapper<TEntry>;
  #partialCopier?: ReadOnlyCopier<TEntry>;

  //#region Initialization

  /**
   * Make a new empty read-only dex... not sure why though lol
   */
  constructor()

  /**
   * Copy a new dex from an existing one
   */
  constructor(original?: IReadableDex<TEntry>, hasher?: IHasher)

  /**
   * Make a new dex
   */
  constructor(original?: IReadableDex<TEntry>, hasher?: IHasher) {
    if (original instanceof ReadOnlyDex) {
      const data = original.data;

      this[InternalRDexSymbols._allTags] = data.tags;
      this[InternalRDexSymbols._allHashes] = data.hashes;
      this[InternalRDexSymbols._entriesByHash] = data.entries;
      this[InternalRDexSymbols._hashesByTag] = data.hashesByTag;
      this[InternalRDexSymbols._tagsByHash] = data.tagsByHash;

      this._initHasher(hasher ?? data.config.hasher);
    } else {
      this[InternalRDexSymbols._allTags]
        = new Set<Tag>();
      this[InternalRDexSymbols._allHashes]
        = new Set<HashKey>();
      this[InternalRDexSymbols._hashesByTag]
        = new Map<Tag, Set<HashKey>>();
      this[InternalRDexSymbols._tagsByHash]
        = new Map<HashKey, Set<Tag>>();
      this[InternalRDexSymbols._entriesByHash]
        = new Map<HashKey, TEntry>();
      this._initHasher(hasher);
    }
  }

  /** @internal */
  // TODO: when TS implements stage 3: @hideInProxy
  private _initHasher(hasher?: IHasher) {
    Object.defineProperty(this, "_hasher", {
      value: hasher ?? Dex.Defaults.getHashFunction(),
      writable: false,
      configurable: false,
      enumerable: false
    });
  }

  //#endregion

  //#region Properties

  get config(): Config<TEntry> {
    return {
      hasher: this._hasher
    };
  }

  get data(): {
    tags: Set<Tag>,
    hashes: Set<HashKey>,
    entries: Map<HashKey, TEntry>,
    hashesByTag: Map<Tag, Set<HashKey>>,
    tagsByHash: Map<HashKey, Set<Tag>>,
    config: Config<TEntry>
  } {
    return {
      tags: new Set(this[InternalRDexSymbols._allTags]),
      hashes: new Set(this[InternalRDexSymbols._allHashes]),
      entries: new Map(this[InternalRDexSymbols._entriesByHash]),
      hashesByTag: new Map(this[InternalRDexSymbols._hashesByTag]),
      tagsByHash: new Map(this[InternalRDexSymbols._tagsByHash]),
      config: this.config
    };
  }

  //#region Counts

  /**
   * How many uniue entries  are in the dex
   */
  get numberOfEntries()
    : number {
    return this[InternalRDexSymbols._allHashes].size;
  }

  /**
   * How many uniue tags are in the dex
   */
  get numberOfTags()
    : number {
    return this[InternalRDexSymbols._allTags].size;
  }

  //#endregion

  //#region Sub Sets

  get entries(): EntrySet<TEntry> {
    return this.#entrySet
      ??= EntryMapConstructor<TEntry>(this, this[InternalRDexSymbols._entriesByHash]);
  }

  get tags(): TagSet<TEntry> {
    return this.#tagSet
      ??= TagSetConstructor<TEntry>(this, this[InternalRDexSymbols._allTags]);
  }

  get hashes(): HashSet<TEntry> {
    return this.#hashSet
      ??= HashSetConstructor<TEntry>(this, this[InternalRDexSymbols._allHashes]);
  }

  //#endregion

  //#region Loop Helpers

  get for(): Looper<TEntry> {
    return this.#forLooper
      ??= LooperConstructor(this);
  }

  get map(): Mapper<TEntry> {
    return this.#mapLooper
      ??= MapperConstructor(this);
  };

  get copy(): ReadOnlyCopier<TEntry> {
    if (!this.#partialCopier) {
      this.#partialCopier = ReadOnlyCopierConstructor<TEntry>(this);
    }

    return this.#partialCopier;
  }

  //#region Internal

  //#region Loop Helpers

  /** @internal */
  // TODO: when TS implements stage 3: @hideInProxy
  private get [InternalRDexSymbols._getSimpleCopier](): ReadOnlyCopier<TEntry> {
    return this.#partialCopier ??= ReadOnlyCopierConstructor<TEntry>(this)
  }

  //#endregion

  //#endregion

  //#endregion

  //#region Methods

  //#region Get

  //#region General

  get(key: HashKey): TEntry | NoEntryFound {
    return this[InternalRDexSymbols._entriesByHash].get(key);
  }

  hash(entry: Entry): HashKey {
    return this._hasher(entry);
  }

  contains(entry: TEntry | HashKey): boolean {
    return this[InternalRDexSymbols._allHashes].has(this.hash(entry));
  }

  has(tag: Tag): boolean {
    return this[InternalRDexSymbols._allTags].has(tag);
  }

  merge(other: Dex<TEntry>): Dex<TEntry> {
    const dex = new Dex<TEntry>(this);
    dex.copy.from(other);

    return dex;
  }

  //#endregion

  //#region Queries

  //#region Generic

  get query(): Queries.Full<TEntry, ResultType, TEntry> {
    return this.#query ??= Queries.FullQueryConstructor(
      this,
      ResultType.Array,
    );
  }

  //#endregion

  //#region Chained

  get filter(): Queries.Specific<TEntry, ResultType.Dex, TEntry> {
    return this.#filter ??= Queries.SpecificQueryConstructor(
      this,
      ResultType.Dex
    );
  }

  //#endregion

  //#region Values

  get values(): Queries.Firstable<TEntry, ResultType.Array, TEntry> {
    return this.#values ??= Queries.FirstableQueryConstructor(
      this,
      ResultType.Array,
      {
        allOnNoParams: true
      }
    );
  }

  //#endregion

  //#region Hashes/Keys

  get keys(): Queries.Firstable<HashKey, ResultType.Set, TEntry> {
    return this.#keys ??= Queries.FirstableQueryConstructor(
      this,
      ResultType.Set,
      {
        allOnNoParams: true,
        transform: false
      }
    );
  }

  //#endregion

  //#region First Value

  get first(): Queries.Specific<TEntry, ResultType.First, TEntry> {
    return this.#first ??= Queries.SpecificQueryConstructor(
      this,
      ResultType.First
    );
  }

  //#endregion

  //#endregion

  //#endregion

  //#region Iteration

  *[Symbol.iterator](): Iterator<[HashKey | undefined, TEntry | None, Set<Tag>]> {
    for (const hash in this[InternalRDexSymbols._allHashes]) {
      yield [hash, this.get(hash)!, this[InternalRDexSymbols._tagsByHash].get(hash)!];
    }

    const tagsForNone = this.tags.empty;
    if (tagsForNone.size) {
      yield [undefined, NONE_FOR_TAG, tagsForNone];
    }
  }

  //#region For

  /**
   * For each unique entry and tag pair.
   * 
   * @param func 
   */
  forEach(
    func: Loop.IBreakable<[entry: TEntry, tag: Tag, index: number], any>,
    outerLoopType: 'entry' | 'tag' | undefined = 'entry'
  ): void {
    let index: number = 0;
    if (outerLoopType === 'tag') {
      for (const tag of this[InternalRDexSymbols._allTags]) {
        for (const hash of this[InternalRDexSymbols._hashesByTag].get(tag)!) {
          if (func(this[InternalRDexSymbols._entriesByHash].get(hash)!, tag, index++) instanceof Loop.Break) {
            break;
          }
        }
      }
    } else {
      for (const hash of this[InternalRDexSymbols._allHashes]) {
        for (const tag of this[InternalRDexSymbols._tagsByHash].get(hash)!) {
          if (func(this[InternalRDexSymbols._entriesByHash].get(hash)!, tag, index++) instanceof Loop.Break) {
            break;
          }
        }
      }
    }
  }

  /**
   * Iterate logic on each tag in the dex.
   */
  forEachTag(
    func: Loop.IBreakable<[tag: Tag, index: number, entries: Set<TEntry>], any>
  ): void {
    let index: number = 0;
    for (const tag of this[InternalRDexSymbols._allTags]) {
      const entries = new Set<TEntry>();
      this[InternalRDexSymbols._hashesByTag].get(tag)!.forEach(h =>
        entries.add(this[InternalRDexSymbols._entriesByHash].get(h)!)
      )

      if (func(tag, index++, entries) instanceof Loop.Break) {
        break;
      }
    }
  }

  /**
   * Iterate logic on each entry in the dex.
   */
  forEachEntry(
    func: Loop.IBreakable<[entry: TEntry, index: number, tags: Set<Tag>], any>
  ): void {
    let index: number = 0;
    for (const hash of this[InternalRDexSymbols._allHashes]) {
      if (func(
        this[InternalRDexSymbols._entriesByHash].get(hash)!,
        index++,
        this[InternalRDexSymbols._tagsByHash].get(hash)!
      ) instanceof Loop.Break) {
        break;
      }
    }
  }

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
    transform?: Loop.IBreakable<[entry: TEntry, tag: Tag, index: number], TResult>,
    outerLoopType: 'entry' | 'tag' = 'entry'
  ): (TResult extends undefined ? Map<Entry, Tag[]> : TResult[]) {
    if (!transform) {
      return new Map<TEntry, Tag[]>() as any;
    }

    const results: TResult[] = [];
    let index: number = 0;
    this.forEach((e, t, i) => {
      const result = transform(e, t, i);
      if (result instanceof Loop.Break) {
        if (result.return) {
          results.push(result.return);
        }

        return result;
      }

      results.push(result);
    }, outerLoopType);

    return results as any;
  }

  /**
   * Map this dex's entries to an array.
   */
  toArray<TResult = TEntry>(
    transform?: Loop.IBreakable<[entry: TEntry, index: number, tags: Set<Tag>], TResult>
  ): TResult[] {
    if (!transform) {
      return this.entries as any as TResult[];
    }

    const results: TResult[] = [];
    this.forEachEntry((e, i, t) => {
      const result = transform(e, i, t);
      if (result instanceof Loop.Break) {
        if (result.return) {
          results.push(result.return);
        }

        return result;
      }

      results.push(result);
    });

    return results;
  }

  /**
   * Splay//map this dex's tags into an array.
   */
  splay<TResult>(
    transform?: Loop.IBreakable<[tag: Tag, index: number, entries: Set<TEntry>], TResult>
  ): TResult[] {
    if (!transform) {
      return this.tags as any as TResult[];
    }

    const results: TResult[] = [];
    this.forEachTag((t, i, e) => {
      const result = transform(t, i, e);
      if (result instanceof Loop.Break) {
        if (result.return) {
          results.push(result.return);
        }

        return result;
      }

      results.push(result);
    });

    return results;
  }

  //#endregion

  //#endregion

  //#region Utility

  get any(): Queries.Specific<boolean, ResultType.First, TEntry> {
    return this.#any ??= Queries.SpecificQueryConstructor<boolean, ResultType.First, TEntry>(
      this,
      ResultType.First,
      {
        transform: result => result !== undefined
      }
    );
  };

  get count(): Queries.Specific<number, ResultType.First, TEntry> {
    if (!this.#count) {
      const counter = Queries.SpecificQueryConstructor<HashKey, ResultType.Set, TEntry>(
        this,
        ResultType.Set,
        {
          transform: false,
          allOnNoParams: true
        }
      );

      const proxy = (...args: any[]) => counter(...args).size;
      proxy.not = (...args: any[]) => counter.not(...args).size

      this.#count = proxy as Queries.Specific<number, ResultType.First, TEntry>;
    }


    return this.#count;
  };

  /**
   * Check is something is a basic readable dex
   */
  static is
    = (symbol: any) => isDex(symbol, {andIsWriteable: false});
  
  //#endregion

  //#endregion
}

/**
 * Used to freeze a copy of an existing dex.
 */

export class ArchiDex<TEntry extends Entry> extends ReadOnlyDex<TEntry> {
  constructor(original: IReadableDex<TEntry>) {
    super(original);
    Object.freeze(this);
    Object.freeze(this[InternalRDexSymbols._allHashes]);
    Object.freeze(this[InternalRDexSymbols._allTags]);
    Object.freeze(this[InternalRDexSymbols._entriesByHash]);
    Object.freeze(this[InternalRDexSymbols._hashesByTag]);
    Object.freeze(this[InternalRDexSymbols._tagsByHash]);
  }
}