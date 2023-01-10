import {
  Entry,
  EntryMapConstructor,
  EntrySet,
  IHasher
} from "./subsets/entries";
import { Looper, LooperConstructor } from "./helpers/loops";
import { Mapper, MapperConstructor } from "./helpers/maps";
import { Tag, TagSet, TagSetConstructor } from "./subsets/tags";
import {
  HashKey,
  HashSet,
  HashSetConstructor
} from "./subsets/hashes";
import Queries from "./queries/queries";
import Loop from "../utilities/iteration";
import Dex, { Config } from "./dex";
import { NoEntryFound, ResultType } from "./queries/results";

/**
 * Interface for reading from and querying from a dex.
 */

export interface IReadonlyDex<TEntry extends Entry = Entry> extends Iterable<[HashKey, TEntry, Set<Tag>]> {

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
   * Check if the dex is tracking a given tag.
   * This returns true if the tag has no entries as well.
   */
  has(tag: Tag): boolean;

  /**
  * return a copy of this dex.
  */
  get copy(): (() => Dex<TEntry>) & { sealed(): SealedDex<TEntry> };

  /**
   * Create a new dex that contains this dex's entries, merged with anothers.
   */
  merge(other: Dex<TEntry>): IReadonlyDex<TEntry>;

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
 * A simple dex that can only be queried and read from.
 * This does not have any built in way to modify it, this mainly just holds the logic for more complex dexes like Dex and SealedDex.
 */
export class ReadableDex<TEntry extends Entry> implements IReadonlyDex<TEntry> {
  // data
  protected readonly _allTags
    : Set<Tag>;
  protected readonly _allHashes
    : Set<HashKey>;
  protected readonly _hashesByTag
    : Map<Tag, Set<HashKey>>;
  protected readonly _tagsByHash
    : Map<HashKey, Set<Tag>>;
  protected readonly _entriesByHash
    : Map<HashKey, TEntry>;

  // config
  /** @readonly */
  protected _hasher: IHasher
    = null!;

  // lazy
  // - queries
  private _query?: Queries.Full<TEntry, ResultType, TEntry>;
  private _filter?: Queries.Specific<TEntry, ResultType.Dex, TEntry>;
  private _values?: Queries.Firstable<TEntry, ResultType.Array, TEntry>;
  private _keys?: Queries.Firstable<HashKey, ResultType.Set, TEntry>;
  private _first?: Queries.Specific<TEntry, ResultType.First, TEntry>;
  private _any?: Queries.Specific<boolean, ResultType.First, TEntry>;
  private _count?: Queries.Specific<number, ResultType.First, TEntry>;

  // - subsets
  private _hashSet?: HashSet<TEntry>;
  private _tagSet?: TagSet<TEntry>;
  private _entrySet?: EntrySet<TEntry>;

  // - helpers
  private _forLooper?: Looper<TEntry>;
  private _mapLooper?: Mapper<TEntry>;
  private _partialCopier?: (() => Dex<TEntry>) & { sealed(): SealedDex<TEntry> };

  //#region Initialization

  /**
   * Make a new empty read-only dex... not sure why though lol
   */
  constructor()

  /**
   * Copy a new dex from an existing one
   */
  constructor(original?: IReadonlyDex<TEntry>, hasher?: IHasher)

  /**
   * Make a new dex
   */
  constructor(original?: IReadonlyDex<TEntry>, hasher?: IHasher) {
    if (original instanceof ReadableDex) {
      this._allTags = (original as any)._allTags;
      this._allHashes = (original as any)._allHashes;
      this._entriesByHash = (original as any)._entriesByHash;
      this._hashesByTag = (original as any)._hashesByTag;
      this._tagsByHash = (original as any)._tagsByHash;
      this._initHasher(hasher ?? (original as any)._hasher);
    } else {
      this._allTags
        = new Set<Tag>();
      this._allHashes
        = new Set<HashKey>();
      this._hashesByTag
        = new Map<Tag, Set<HashKey>>();
      this._tagsByHash
        = new Map<HashKey, Set<Tag>>();
      this._entriesByHash
        = new Map<HashKey, TEntry>();
      this._initHasher(hasher);
    }
  }

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

  //#region Counts

  /**
   * How many uniue entries  are in the dex
   */
  get numberOfEntries()
    : number {
    return this._allHashes.size;
  }

  /**
   * How many uniue tags are in the dex
   */
  get numberOfTags()
    : number {
    return this._allTags.size;
  }

  //#endregion

  //#region Sub Sets

  get entries(): EntrySet<TEntry> {
    return this._entrySet
      ??= EntryMapConstructor<TEntry>(this, this._entriesByHash);
  }

  get tags(): TagSet<TEntry> {
    return this._tagSet
      ??= TagSetConstructor<TEntry>(this, this._allTags);
  }

  get hashes(): HashSet<TEntry> {
    return this._hashSet
      ??= HashSetConstructor<TEntry>(this, this._allHashes);
  }

  //#endregion

  //#region Loop Helpers

  get for(): Looper<TEntry> {
    return this._forLooper
      ??= LooperConstructor(this);
  }

  get map(): Mapper<TEntry> {
    return this._mapLooper
      ??= MapperConstructor(this);
  };

  get copy(): (() => Dex<TEntry>) & { sealed(): SealedDex<TEntry> } {
    if (!this._partialCopier) {
      const copy = (() => new ReadableDex(this)) as (() => Dex<TEntry>) & { sealed(): SealedDex<TEntry> };
      copy.sealed = () => new SealedDex(this);

      this._partialCopier = copy;
    }

    return this._partialCopier;
  }

  //#endregion

  //#endregion

  //#region Methods

  //#region Get

  //#region General

  get(key: HashKey): TEntry | NoEntryFound {
    return this._entriesByHash.get(key);
  }

  hash(entry: Entry): HashKey {
    return this._hasher(entry);
  }

  contains(entry: TEntry | HashKey): boolean {
    return this._allHashes.has(this.hash(entry));
  }

  has(tag: Tag): boolean {
    return this._allTags.has(tag);
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
    return this._query ??= Queries.FullQueryConstructor(
      this,
      ResultType.Array,
    );
  }

  //#endregion

  //#region Chained

  get filter(): Queries.Specific<TEntry, ResultType.Dex, TEntry> {
    return this._filter ??= Queries.SpecificQueryConstructor(
      this,
      ResultType.Dex
    );
  }

  //#endregion

  //#region Values

  get values(): Queries.Firstable<TEntry, ResultType.Array, TEntry> {
    return this._values ??= Queries.FirstableQueryConstructor(
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
    return this._keys ??= Queries.FirstableQueryConstructor(
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
    return this._first ??= Queries.SpecificQueryConstructor(
      this,
      ResultType.First
    );
  }

  //#endregion

  //#endregion

  //#endregion

  //#region Iteration

  *[Symbol.iterator](): Iterator<[HashKey, TEntry, Set<Tag>]> {
    for (const hash in this._allHashes) {
      yield [hash, this.get(hash)!, this._tagsByHash.get(hash)!];
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
      for (const tag of this._allTags) {
        for (const hash of this._hashesByTag.get(tag)!) {
          if (func(this._entriesByHash.get(hash)!, tag, index++) instanceof Loop.Break) {
            break;
          }
        }
      }
    } else {
      for (const hash of this._allHashes) {
        for (const tag of this._tagsByHash.get(hash)!) {
          if (func(this._entriesByHash.get(hash)!, tag, index++) instanceof Loop.Break) {
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
    for (const tag of this._allTags) {
      const entries = new Set<TEntry>();
      this._hashesByTag.get(tag)!.forEach(h =>
        entries.add(this._entriesByHash.get(h)!)
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
    for (const hash of this._allHashes) {
      if (func(
        this._entriesByHash.get(hash)!,
        index++,
        this._tagsByHash.get(hash)!
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
    return this._any ??= Queries.SpecificQueryConstructor<boolean, ResultType.First, TEntry>(
      this,
      ResultType.First,
      {
        transform: result => result !== undefined
      }
    );
  };

  get count(): Queries.Specific<number, ResultType.First, TEntry> {
    if (!this._count) {
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

      this._count = proxy as Queries.Specific<number, ResultType.First, TEntry>;
    }


    return this._count;
  };

  //#endregion

  //#endregion
}

/**
 * Used to seal an existing dex.
 */
export class SealedDex<TEntry extends Entry> extends ReadableDex<TEntry> {
  constructor(original: IReadonlyDex<TEntry>) {
    super(original);
    Object.freeze(this);
    Object.freeze(this._allHashes);
    Object.freeze(this._allTags);
    Object.freeze(this._entriesByHash);
    Object.freeze(this._hashesByTag);
    Object.freeze(this._tagsByHash);
  }
}
