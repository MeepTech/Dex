import { IBreakable, Break } from "../utilities/loops";
import {
  isArray,
  isComplexEntry,
  isConfig,
  isFunction,
  isInputEntryWithTagsArray,
  isIterable,
  isObject,
  isSimpleEntry,
  isTag,
  isUnique
} from "../utilities/validators";
import IUnique from "./unique";
import { v4 as uuidv4 } from 'uuid';
import {
  IComplexEntry,
  IEntry,
  EntryMapConstructor,
  IEntryOrNone,
  IGuardFunction,
  IEntrySet,
  IInputEntryWithTags,
  IInputEntryWithTagsArray,
  IInputEntryWithTagsObject,
  NoEntries,
  IArrayGuardFunction,
  NO_ENTRIES_FOR_TAG,
  IObjectGuardFunction,
  IHasher
} from "./subsets/entries";
import { ILooper, LooperConstructor } from "./helpers/loops";
import { IMapper, MapperConstructor } from "./helpers/maps";
import {
  ITag,
  ITagSet,
  TagSetConstructor,
  ITagOrTags,
  toSet,
  ITags
} from "./subsets/tags";
import {
  IHashKey,
  IHashSet,
  HashSetConstructor,
  IHashOrHashes
} from "./subsets/hashes";
import { IReadOnlyDex } from "./readonly";
import { CopierConstructor, ICopier } from './helpers/copy';
import {
  IFullQuery,
  IFirstableQuery,
  _logicMultiQuery,
  _logicFirstQuery,
  FullQueryConstructor,
  ISpecificQuery,
  SpecificQueryConstructor,
  FirstableQueryConstructor
} from "./queries/queries";
import { NoEntryFound, NO_RESULT, ResultType } from "./queries/results";
import { IQueryFilterInput } from "./queries/filters";

/**
 * Extra config options for a dex.
 */
export interface Config<TEntry extends IEntry = IEntry> {
  entryGuard?: IGuardFunction<TEntry>,
  arrayGuard?: IArrayGuardFunction<TEntry>,
  objectGuard?: IObjectGuardFunction<TEntry>,
  hasher?: IHasher
}

/**
 * A collection of unque entries, keyed by various custom tags.
 * 
 * This represents a many to many replationship of Tags to Entries.
 */
export default class Dex<TEntry extends IEntry = IEntry> implements IReadOnlyDex<TEntry> {
  // data
  private readonly _allTags
    : Set<ITag>
    = new Set<ITag>();
  private readonly _allHashes
    : Set<IHashKey>
    = new Set<IHashKey>();
  private readonly _hashesByTag
    : Map<ITag, Set<IHashKey>>
    = new Map<ITag, Set<IHashKey>>();
  private readonly _tagsByEntryHash
    : Map<IHashKey, Set<ITag>>
    = new Map<IHashKey, Set<ITag>>();
  private readonly _entriesByHash
    : Map<IHashKey, TEntry>
    = new Map<IHashKey, TEntry>();

  // config
  /** @readonly */
  private _guards
    : {
      entry: IGuardFunction<TEntry>
      array: IArrayGuardFunction<TEntry>,
      object: IObjectGuardFunction<TEntry>,
    } = null!;
  /** @readonly */
  private _hasher: IHasher
    = null!;

  // lazy
  // - queries
  private _query?: IFullQuery<TEntry, ResultType>;
  private _filter?: ISpecificQuery<TEntry, ResultType.Dex>;
  private _values?: IFirstableQuery<TEntry, ResultType.Array>;
  private _keys?: IFirstableQuery<IHashKey, ResultType.Set, TEntry>;
  private _first?: ISpecificQuery<TEntry, ResultType.First>;
  private _any?: ISpecificQuery<boolean, ResultType.First, TEntry>;
  private _count?: ISpecificQuery<number, ResultType.First, TEntry>;
  private _take?: IFullQuery<TEntry, ResultType.Array>;

  // - subsets
  private _hashSet?: IHashSet<TEntry>;
  private _tagSet?: ITagSet<TEntry>;
  private _entrySet?: IEntrySet<TEntry>;

  // - helpers
  private _forLooper?: ILooper<TEntry>;
  private _mapLooper?: IMapper<TEntry>;
  private _copier?: ICopier<TEntry>;

  //#region Defaults

  /**
   * Default helpers for initialization.
   */
  static Defaults = {
    getHashFunction() {
      return function (entry: IEntry) {
        return isUnique(entry)
          ? entry.getHashKey()
          : isSimpleEntry(entry)
            ? entry
            : isComplexEntry(entry)
              ? Dex.getUuidFor(entry)
              : undefined!;
      }
    },

    getArrayEntryGuardFunction<TEntry extends IEntry>() {
      return function (entry: IEntry): entry is TEntry & IComplexEntry & any[] {
        return !isInputEntryWithTagsArray<TEntry>(entry);
      }
    },

    getObjectEntryGuardFunction<TEntry extends IEntry>() {
      return function (entry: IEntry): entry is TEntry & IComplexEntry & object & { [key: string]: any } {
        return isObject(entry)
          && (!entry.hasOwnProperty("entry")
            && (!entry.hasOwnProperty("tags")
              || !entry.hasOwnProperty("tag")));
      }
    },

    getEntryGuardFunction<TEntry extends IEntry>(
      arrayGuard: IArrayGuardFunction<TEntry>,
      objectGuard: IObjectGuardFunction<TEntry>
    ): IGuardFunction<TEntry> {
      return function (
        entry: IEntry
      ): entry is TEntry {
        return isSimpleEntry(entry)
          || (isArray(entry)
            ? arrayGuard(entry)
            : isObject(entry)
              ? objectGuard(entry)
              : isComplexEntry(entry));
      }
    }
  }

  //#endregion

  //#region Initialization

  /**
   * Make a new empty dex
   */
  constructor()

  /**
   * Make a new dex of just empty tags
   */
  constructor(options: Config<TEntry>)

  /**
   * Copy a new dex from an existing one
   */
  constructor(original: Dex<TEntry>, options?: Config<TEntry>)

  /**
   * Make a new dex with just one empty tag
   */
  constructor(tag: ITag, options?: Config<TEntry>)

  /**
   * Make a new dex with just one empty tag
   */
  constructor(options: Config<TEntry>, tag: ITag)

  /**
   * Make a new dex with just empty tags
   */
  constructor(...tags: ITag[])

  /**
   * Make a new dex with just empty tags
   */
  constructor(options: Config<TEntry>, ...tags: ITag[])

  /**
   * Make a new dex with just empty tags
   */
  constructor(options: Config<TEntry>, tags: ITag[])

  /**
   * Make a new dex with just empty tags
   */
  constructor(tags: ITagOrTags, options?: Config<TEntry>)

  /**
   * Make a new dex from entries with their tags. 
   */
  constructor(entriesWithTags: IInputEntryWithTagsArray<TEntry>[], options?: Config<TEntry>)

  /**
   * Make a new dex from entries with their tags. 
   */
  constructor(options: Config<TEntry>, entriesWithTags: IInputEntryWithTagsArray<TEntry>[])

  /**
   * Make a new dex from an object with entries and tags
   */
  constructor(entryWithTags: IInputEntryWithTagsObject<TEntry>, options?: Config<TEntry>)

  /**
   * Make a new dex from an object with entries and tags
   */
  constructor(entriesWithTags: IInputEntryWithTags<TEntry>[], options?: Config<TEntry>)

  /**
   * Make a new dex from an object with entries and tags
   */
  constructor(options: Config<TEntry>, entryWithTags: IInputEntryWithTagsObject<TEntry>)

  /**
   * Make a new dex from an object with entries and tags
   */
  constructor(options: Config<TEntry>, entriesWithTags: IInputEntryWithTags<TEntry>[])

  /**
   * Make a new dex from an object with entries and tags
   */
  constructor(...entriesWithTags: IInputEntryWithTagsObject<TEntry>[])

  /**
   * Make a new dex from an object with entries and tags
   */
  constructor(options: Config<TEntry>, ...entriesWithTags: IInputEntryWithTagsObject<TEntry>[])

  /**
   * Make a new dex from an object with entries and tags
   */
  constructor(options: Config<TEntry>, entryWithTags: IInputEntryWithTagsObject<TEntry>)

  /**
   * Make a new dex from a map
   */
  constructor(map: Map<IEntryOrNone<TEntry>, ITagOrTags>, options?: Config<TEntry>)

  /**
   * Make a new dex
   */
  constructor(
    values?:
      Dex<TEntry>
      | Map<IEntryOrNone<TEntry>, ITagOrTags>
      | Config<TEntry>
      | ITagOrTags
      | IInputEntryWithTagsObject<TEntry>
      | IInputEntryWithTags<TEntry>[],
    optionsOrMoreValues?:
      Config<TEntry>
      | ITagOrTags
      | IInputEntryWithTagsObject<TEntry>
      | IInputEntryWithTags<TEntry>[],
  ) {
    // copy existing:
    if (values instanceof Dex) {
      this._allTags = values._allTags;
      this._allHashes = values._allHashes;
      this._entriesByHash = values._entriesByHash;
      this._hashesByTag = values._hashesByTag;
      this._tagsByEntryHash = values._tagsByEntryHash;
      this._guards = values._guards;
      this._hasher = values._hasher;
      if (isConfig<TEntry>(optionsOrMoreValues)) {
        this._initOptions(optionsOrMoreValues);
      }

      return;
    } else {
      // init config
      let config: Config<TEntry> | undefined = undefined;

      if (isConfig<TEntry>(optionsOrMoreValues)) {
        config = optionsOrMoreValues;
        this._initOptions(optionsOrMoreValues);
      } else if (isConfig<TEntry>(values)) {
        this._initOptions(values);
        config = values;
        values = optionsOrMoreValues as any;
      } else {
        this._initOptions();
      }

      if (!values) {
        return;
      }

      // if it's a map of values
      if (values instanceof Map) {
        values.forEach((t, e) =>
          (e === NO_ENTRIES_FOR_TAG
            || e === NO_RESULT)
            ? this.set(t)
            : this.add(e, t)
        );

        return;
      } // TagOrTags | InputEntryWithTags<TEntry> | InputEntryWithTags<TEntry>[]
      else {
        // if the initial values are in an array:
        if (isArray(values)) {
          // empty array is taken as tags.
          if (!values.length) {
            // empty array of tags shouldn't have any other non confi options.
            if (!config && optionsOrMoreValues) {
              throw new DexError("invalid constructor argument as position [1] (second argument): " + optionsOrMoreValues.toString());
            }

            // no tags, do nothing....
            return;
          } else {
            // tags, set them:
            if (isTag(values[0])) {
              if (!config && optionsOrMoreValues) {
                if (isArray(optionsOrMoreValues)) {
                  values = [...values, ...optionsOrMoreValues] as Iterable<ITag> as ITag[];
                } else {
                  (values as Iterable<ITag> as ITag[]).push(optionsOrMoreValues as ITag);
                }
              }

              (values as ITag[]).forEach((tag: ITag) => this.set(tag));

              return;
            } // entries, put them:
            else {
              if (!config && optionsOrMoreValues) {
                if (isArray(optionsOrMoreValues)) {
                  values = [...values, ...optionsOrMoreValues] as IInputEntryWithTags<TEntry>[];
                } else {
                  (values as IInputEntryWithTags<TEntry>[]).push(optionsOrMoreValues as IInputEntryWithTags<TEntry>);
                }
              }

              this.put(values as IInputEntryWithTags<TEntry>[])

              return;
            }
          }
        } // single object
        else if (isObject(values)) {
          if (!config && optionsOrMoreValues) {
            this.put([values, optionsOrMoreValues] as IInputEntryWithTagsObject<TEntry>[]);
            return;
          } else {
            this.put(values as IInputEntryWithTagsObject<TEntry>);
            return;
          }
        } // one tag
        else {
          this.set(values as ITag);
          return;
        }
      }
    }
  }

  private _initOptions(config?: Config<TEntry>) {
    const guards: {
      entry: IGuardFunction<TEntry>,
      array: IArrayGuardFunction<TEntry>,
      object: IObjectGuardFunction<TEntry>,
    } = {
      array: {} as any,
      object: {} as any,
      entry: {} as any,
    }

    Object.defineProperty(guards, "array", {
      value: config?.arrayGuard ?? Dex.Defaults.getArrayEntryGuardFunction<TEntry>(),
      writable: false,
      configurable: false,
      enumerable: false
    })

    Object.defineProperty(guards, "object", {
      value: config?.objectGuard ?? Dex.Defaults.getObjectEntryGuardFunction<TEntry>(),
      writable: false,
      configurable: false,
      enumerable: false
    })

    Object.defineProperty(guards, "entry", {
      value: config?.entryGuard ?? Dex.Defaults.getEntryGuardFunction<TEntry>(
        guards.array,
        guards.object
      ),
      writable: false,
      configurable: false,
      enumerable: false
    });

    Object.defineProperty(this, "_guards", {
      value: guards,
      writable: false,
      configurable: false,
      enumerable: false
    });

    Object.defineProperty(this, "_hasher", {
      value: config?.hasher ?? Dex.Defaults.getHashFunction(),
      writable: false,
      configurable: false,
      enumerable: false
    });
  }

  //#endregion

  //#region Properties

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

  get entries(): IEntrySet<TEntry> {
    return this._entrySet
      ??= EntryMapConstructor<TEntry>(this, this._entriesByHash);
  }

  get tags(): ITagSet<TEntry> {
    return this._tagSet
      ??= TagSetConstructor<TEntry>(this, this._allTags);
  }

  get hashes(): IHashSet<TEntry> {
    return this._hashSet
      ??= HashSetConstructor<TEntry>(this, this._allHashes);
  }

  //#endregion

  //#region Loop Helpers

  get for(): ILooper<TEntry> {
    return this._forLooper
      ??= LooperConstructor(this);
  }

  get map(): IMapper<TEntry> {
    return this._mapLooper
      ??= MapperConstructor(this);
  };

  get copy(): ICopier<TEntry> {
    return this._copier
      ??= CopierConstructor(this);
  }

  //#endregion

  get config(): Config<TEntry> {
    return {
      arrayGuard: this._guards.array,
      entryGuard: this._guards.entry,
      objectGuard: this._guards.object,
      hasher: this._hasher
    };
  }

  //#endregion

  //#region Methods

  //#region Get

  //#region General

  get(key: IHashKey): TEntry | NoEntryFound {
    return this._entriesByHash.get(key);
  }

  hash(entry: IEntry): IHashKey {
    return this._hasher(entry);
  }

  contains(entry: TEntry | IHashKey): boolean {
    return this._allHashes.has(this.hash(entry));
  }

  has(tag: ITag): boolean {
    return this._allTags.has(tag);
  }

  canContain(value: IEntry): value is TEntry {
    return this._guards.entry(value);
  }

  merge(other: Dex<TEntry>): Dex<TEntry> {
    const dex = new Dex<TEntry>(this);
    dex.copy.from(other);

    return dex;
  }

  //#endregion

  //#region Queries

  //#region Generic

  get query(): IFullQuery<TEntry, ResultType.Array> {
    return this._query ??= FullQueryConstructor(
      this,
      ResultType.Array,
    );
  }

  //#endregion

  //#region Chained

  get filter(): ISpecificQuery<TEntry, ResultType.Dex> {
    return this._filter ??= SpecificQueryConstructor(
      this,
      ResultType.Dex
    );
  }

  //#endregion

  //#region Values

  get values(): IFirstableQuery<TEntry, ResultType.Array> {
    return this._values ??= FirstableQueryConstructor(
      this,
      ResultType.Array,
      {
        allOnNoParams: true
      }
    );
  }

  //#region Hashes/Keys

  get keys(): IFirstableQuery<IHashKey, ResultType.Set, TEntry> {
    return this._keys ??= FirstableQueryConstructor(
      this,
      ResultType.Set,
      {
        allOnNoParams: true
      }
    );
  }

  //#endregion

  //#region Single Value

  get first(): ISpecificQuery<TEntry, ResultType.First> {
    return this._first ??= SpecificQueryConstructor(
      this,
      ResultType.First
    );
  }

  //#endregion  

  //#endregion

  //#region Utility

  get any(): ISpecificQuery<boolean, ResultType.First, TEntry> {
    return this._any ??= SpecificQueryConstructor<boolean, ResultType.First, TEntry>(
      this,
      ResultType.First,
      {
        transform: result => result !== undefined
      }
    );
  };

  get count(): ISpecificQuery<number, ResultType.First, TEntry> {
    if (!this._count) {
      const counter = SpecificQueryConstructor<IHashKey, ResultType.Set, TEntry>(
        this,
        ResultType.Set,
        {
          transform: false,
          allOnNoParams: true
        }
      );

      const proxy = (...args: any[]) => counter(...args).size;
      proxy.not = (...args: any[]) => counter.not(...args).size

      this._count = proxy as ISpecificQuery<number, ResultType.First, TEntry>;
    }


    return this._count;
  };

  //#endregion

  //#endregion

  //#endregion

  //#region Modify

  //#region Add

  //#region Set Tags

  /**
   * Add an empty tag to the dex. 
   * Since no second parameter is provided for entries this will simply make sure the tag exists, and not delete any existing entries.
   */
  set(tag: ITag): [];

  /**
   * Add an empty tag to the dex
   * Since no second parameter is provided for entries this will simply make sure the tag exists, and not delete any existing entries.
   */
  set(tags: ITagOrTags): [];

  /**
   * Add an empty tag to the dex
   * Since no second parameter is provided for entries this will simply make sure the tag exists, and not delete any existing entries.
   */
  set(tag: ITag): [];

  /**
   * Add an empty tag to the dex
   * Since no second parameter is provided for entries this will simply make sure the tag exists, and not delete any existing entries.
   */
  set(tags: ITagOrTags): [];

  /**
   * Add an empty tag to the dex, or set the existing tag to empty.
   * 
   * @returns any effected entries' hash keys.
   */
  set(tag: ITag, entries: [] | NoEntries): IHashKey[];

  /**
   * Add a empty tags to the dex, or set the existing tags to empty.
   * 
   * @returns any effected entries' hash keys.
   */
  set(tags: ITagOrTags, entries: [] | NoEntries): IHashKey[];

  /**
   * Add a new tag with specific entries to the dex, or override the existing values for an existing tag.
   * 
   * @returns any effected entries' hash keys (only entries removed from the tags, not entries added to the tags).
   */
  set(tag: ITag, entries: TEntry[] | Set<TEntry>): IHashKey[];

  /**
   * Add a new tag with specific entries to the dex, or override the existing values for an existing tag.
   * 
   * @returns any effected entries' hash keys (only entries removed from the tags, not entries added to the tags).
   */
  set(tags: ITagOrTags, entries: TEntry[] | Set<TEntry>): IHashKey[];

  set(
    tags: ITagOrTags,
    entries?: TEntry[] | Set<TEntry> | [] | NoEntries
  ): IHashKey[] {
    const effectedHashes: IHashKey[] = [];
    tags = toSet(tags);

    // undefined means nothing gets touched
    if (entries === undefined) {
      (tags as Set<ITag>).forEach(tag => {
        if (!this._allTags.has(tag)) {
          this._allTags.add(tag);
          this._hashesByTag.set(tag, new Set<IHashKey>());
        }
      });
      return [];
    } else {
      // NoEntries or [] is passed in, set to empty:
      if (!entries || (entries instanceof Set ? !entries.size : !entries.length)) {
        for (const tag in tags) {
          if (this._hashesByTag.has(tag)) {
            const currentSet = this._hashesByTag.get(tag)!;
            currentSet.forEach(h => effectedHashes.push(h));
            currentSet.forEach(hash =>
              this._tagsByEntryHash.get(hash)?.delete(tag));
            currentSet.clear()
          } else {
            this._allTags.add(tag);
            this._hashesByTag.set(tag, new Set<IHashKey>());
          }
        }

        return effectedHashes;
      } // set values
      else {
        const hashesToSet: Set<IHashKey> = new Set<IHashKey>();
        for (const entry in entries) {
          hashesToSet.add(this.hash(entry));
        }

        for (const tag in tags) {
          if (this._hashesByTag.has(tag)) {
            const currentSet = this._hashesByTag.get(tag)!;
            currentSet.forEach(hash => {
              if (!hashesToSet.has(hash)) {
                effectedHashes.push(hash);
                this._tagsByEntryHash.get(hash)?.delete(tag)
              }
            });
            this._hashesByTag.set(tag, hashesToSet);
          } else {
            this._allTags.add(tag);
            this._hashesByTag.set(tag, hashesToSet);
          }
        }

        return effectedHashes;
      }
    }
  }

  //#endregion

  //#region Add Entries

  /**
   * Add an entry with any number of tags to the dex
   *
   * @returns The uniqueid/hash of the item added to the dex
   */
  add(
    entry: TEntry,
    tag: ITag
  ): IHashKey;

  /**
   * Add data about entries to the dex.
   *
   * @returns The uniqueid/hash of the items added to the dex
   */
  add(
    entries: IInputEntryWithTags<TEntry>[],
  ): (IHashKey | NoEntries)[];

  /**
   * Add data about an entry to the dex.
   *
   * @returns The uniqueid/hash of the item added to the dex
   */
  add(
    entryWithTags: IInputEntryWithTagsObject<TEntry>
  ): IHashKey | NoEntries;

  /**
   * Add data about an entry to the dex.
   *
   * @returns The uniqueid/hash of the item added to the dex
   */
  add(
    ...entriesWithTags: IInputEntryWithTagsObject<TEntry>[]
  ): (IHashKey | NoEntries)[];

  /**
   * Add an entry with any number of tags to the dex
   *
   * @returns The uniqueid/hash of the item added to the dex
   */
  add(
    entry: TEntry,
    ...tags: ITag[]
  ): IHashKey;

  /**
   * Add an entry with any number of tags to the dex
   *
   * @returns The uniqueid/hash of the item added to the dex
   */
  add(
    entry: TEntry,
    tags: ITagOrTags
  ): IHashKey;

  /**
   * Add an entry with no tags to the dex
   *
   * @returns The uniqueid/hash of the item added to the dex
   */
  add(
    entry: TEntry,
  ): IHashKey;

  /**
   * Add an empty tag, or a entry with any number of tags to the dex
   *
   * @returns The uniqueid/hash of the item added to the dex
   * , or if just an empty tag was added: just the name of the tag is returned.
   */
  add(
    entry: TEntry | IInputEntryWithTags<TEntry>[] | IInputEntryWithTagsObject<TEntry>,
    tags?: ITagOrTags | IInputEntryWithTagsObject<TEntry>
  ): IHashKey | (IHashKey | NoEntries)[] | NoEntries | IHashKey[] {
    // InputEntryWithTagsObject<TEntry>[] | InputEntryWithTagsArray<TEntry>[] | TEntry
    if (isArray(entry) && !tags) {
      // InputEntryWithTagsArray<TEntry>[] | TEntry
      if (isArray(entry[0])) {
        // InputEntryWithTagsArray<TEntry>[]
        if (!this.canContain(entry[0])) { // [0: [0: entry, ...tags], 1: [entry, ...tags]]
          return (entry as IInputEntryWithTagsArray<TEntry>[])
            .map(this._putOneArray.bind(this)) as any;
        }
      } // InputEntryWithTagsObject<TEntry>[]
      else if (isObject(entry[0]) && !this.canContain(entry[0])) {
        return (entry as IInputEntryWithTagsObject<TEntry>[])
          .map(this._putOneObject.bind(this)) as any;
      }
    } // InputEntryWithTagsObject<TEntry>
    else if (isObject(entry) && !this.canContain(entry)) {
      if (tags) {
        this.put([entry, tags] as IInputEntryWithTagsObject<TEntry>[])
      }
      return this._putOneObject(entry as IInputEntryWithTagsObject<TEntry>);
    }

    // TEntry and Tags
    const hash: IHashKey = this.hash(entry);
    tags = <ITagOrTags | undefined>tags;
    tags = tags === undefined
      ? undefined
      : toSet(tags);

    // if we're only provided an entry argument, then it's just for a tagless entry:
    if (!tags || !(tags as Set<ITag>).size) {
      // add the new empty entry:
      this._addEntry(<TEntry>entry, hash);

      return hash;
    } // if we have tags howerver~
    else {
      // set the entries by tag.
      (tags as Set<ITag>).forEach(t => {
        this._allTags.add(t);
        if (this._hashesByTag.has(t)) {
          this._hashesByTag.get(t)!.add(hash);
        } else {
          this._hashesByTag.set(t, new Set<IHashKey>([hash]));
        }

        if (this._tagsByEntryHash.has(hash)) {
          this._tagsByEntryHash.get(hash)!.add(t);
        } else {
          this._tagsByEntryHash.set(hash, new Set<ITag>([t]));
        }
      });

      // set the hash key
      if (!this._allHashes.has(hash)) {
        this._allHashes.add(hash);
        this._entriesByHash.set(hash, entry as TEntry);
      }

      return hash;
    }
  }

  //#region Internal

  private _addEntry(entry: TEntry, key?: IHashKey) {
    const hash: IHashKey = key ?? this.hash(entry);

    // add the new empty entry:
    if (!this._allHashes.has(hash)) {
      this._allHashes.add(hash);
      this._entriesByHash.set(hash, entry);
      if (!this._tagsByEntryHash.get(hash)) {
        this._tagsByEntryHash.set(hash, new Set<IHashKey>());
      }
    }
  }

  //#endregion

  //#endregion

  //#region Put Values

  /**
   * Add data about entries to the dex.
   *
   * @returns The uniqueid/hash of the items added to the dex
   */
  put(
    entries: IInputEntryWithTags<TEntry>[],
  ): IHashKey[];

  /**
   * Add data about an entry to the dex.
   *
   * @returns The uniqueid/hash of the item added to the dex
   */
  put(
    ...entriesWithTags: IInputEntryWithTags<TEntry>[]
  ): IHashKey[];

  /**
   * Add data about an entry to the dex.
   *
   * @returns The uniqueid/hash of the item added to the dex
   */
  put(
    entry: IInputEntryWithTags<TEntry>
  ): IHashKey | NoEntries;

  /**
   * Add data about entries to the dex.
   *
   * @returns The uniqueid/hash of the items added to the dex
   */
  put(
    entries: (IInputEntryWithTagsObject<TEntry> | IInputEntryWithTagsArray<TEntry>)[],
  ): IHashKey[];

  /**
   * Add data about an entry to the dex.
   *
   * @returns The uniqueid/hash of the item added to the dex
   */
  put(
    ...entriesWithTags: (IInputEntryWithTagsObject<TEntry> | IInputEntryWithTagsArray<TEntry>)[]
  ): IHashKey[];

  /**
   * Add data about an entry to the dex.
   *
   * @returns The uniqueid/hash of the item added to the dex
   */
  put(
    entry: (IInputEntryWithTagsObject<TEntry> | IInputEntryWithTagsArray<TEntry>)
  ): IHashKey | NoEntries;

  put<TInput extends IInputEntryWithTags<TEntry>[] | IInputEntryWithTags<TEntry>>(
    entryOrEntriesWithTags: TInput
  ): TInput extends IInputEntryWithTags<TEntry>[] ? (IHashKey | NoEntries)[] : (IHashKey | NoEntries) {
    // InputEntryWithTags<TEntry>[] | InputEntryWithTagsArray<TEntry>
    if (isArray(entryOrEntriesWithTags)) {
      // InputEntryWithTagsArray<TEntry>[] | InputEntryWithTagsArray<TEntry>
      if (isArray(entryOrEntriesWithTags[0])) {
        // InputEntryWithTagsArray<TEntry>[]
        if (!this.canContain(entryOrEntriesWithTags[0])) { // [0: [0: entry, ...tags], 1: [entry, ...tags]]
          return (entryOrEntriesWithTags as IInputEntryWithTagsArray<TEntry>[])
            .map(this._putOneArray.bind(this)) as any;
        } // InputEntryWithTagsArray<TEntry>
        else { // [0: array shaped entry, 1..: ...tags]
          return this._putOneArray(entryOrEntriesWithTags as IInputEntryWithTagsArray<TEntry>) as any;
        }
      } // InputEntryWithTagsObject<TEntry>[]
      else if (isObject(entryOrEntriesWithTags[0]) && !this.canContain(entryOrEntriesWithTags[0])) {
        return (entryOrEntriesWithTags as IInputEntryWithTagsObject<TEntry>[])
          .map(this._putOneObject.bind(this)) as any;
      } // InputEntryWithTagsArray<TEntry>
      else {
        return this._putOneArray(entryOrEntriesWithTags as IInputEntryWithTagsArray<TEntry>) as any;
      }
    } // InputEntryWithTagsObject<TEntry>
    else {
      return this._putOneObject(entryOrEntriesWithTags as IInputEntryWithTagsObject<TEntry>) as any;
    }
  }

  //#region Internal

  private _putOneObject(entryWithTags: IInputEntryWithTagsObject<TEntry>): IHashKey | NoEntries {
    if (entryWithTags.entry === undefined || entryWithTags.entry === null) {
      this.set((entryWithTags.tags || entryWithTags.tag)!);
      return null;
    } else {
      return this.add(entryWithTags.entry, (entryWithTags.tags || entryWithTags.tag)!);
    }
  }

  private _putOneArray(entryWithTags: IInputEntryWithTagsArray<TEntry>): IHashKey | NoEntries {
    if (entryWithTags[0] === undefined || entryWithTags[0] === null) {
      this.set(entryWithTags.slice(1) as ITag[]);
      return null;
    } else {
      return this.add(entryWithTags[0] as TEntry, (
        isArray(entryWithTags[1])
          ? entryWithTags[1]
          : entryWithTags.slice(1)
      ) as ITag[]);
    }
  }

  //#endregion

  //#endregion

  //#endregion

  //#region Update

  /**
   * Update an existing entry's tags to a new set.
   */
  update(entry: TEntry | IHashKey, newTags: ITagOrTags): void;

  /**
   * Update an existing entry's tags using a function.
   */
  update(entry: TEntry | IHashKey, fn: (currentTags: Set<ITag>) => Set<ITag>): void;

  update(entry: TEntry | IHashKey, tags: ITagOrTags | ((currentTags: Set<ITag>) => Set<ITag>)): void {
    throw new NotImplementedError("update");
  }

  //#endregion

  //#region Remove

  //#region Remove Entries

  /**
   * Remove entries matching a query from the current dex while returning the results as well.
   */
  get take(): IFullQuery<TEntry, ResultType.Array, TEntry> {
    if (!this._take) {
      const toRemove = FullQueryConstructor<TEntry, ResultType.Array, TEntry>(
        this,
        ResultType.Array
      );

      const proxy = (...args: any[]) => {
        const result = toRemove(...args);

        if (result instanceof Dex) {
          this.remove(result.entries.values);
        } else {
          this.remove(result);
        }

        return result;
      }

      proxy.not = (...args: any[]) => {
        const result = toRemove.not(...args);

        if (result instanceof Dex) {
          this.remove(result.entries.values);
        } else {
          this.remove(result);
        }

        return result;
      }

      this._take = proxy as IFullQuery<TEntry, ResultType.Array, TEntry>;
    }

    return this._take;
  }

  /**
   * Remove the matching entry from the dex.
   */
  remove(
    hashKey: IHashKey,
    options?: {
      cleanEmptyTags?: boolean
    }
  ): void;

  /**
   * Used to remove matching entries from the dex.
   */
  remove(
    hashKeys: Iterable<IHashKey>,
    options?: {
      cleanEmptyTags?: boolean
    }
  ): void;

  /**
   * Used to remove an entry from the dex
   */
  remove(
    entry: TEntry,
    options?: {
      cleanEmptyTags?: boolean
    }
  ): void;

  /**
   * Used to remove any number of entries from the dex.
   */
  remove(
    entries: Iterable<TEntry>,
    options?: {
      cleanEmptyTags?: boolean
    }
  ): void;

  /**
   * Remove the matching entry from the dex for a specific tag.
   */
  remove(
    hashKey: IHashKey,
    forTag: ITag,
    options?: {
      leaveUntaggedEntries?: boolean,
      cleanEmptyTags?: boolean
    }
  ): void;

  /**
   * Used to unlink matching entries from the dex for a specific tag.
   */
  remove(
    hashKeys: Iterable<IHashKey>,
    forTag: ITag,
    options?: {
      leaveUntaggedEntries?: boolean,
      cleanEmptyTags?: boolean
    }
  ): void;

  /**
   * Used to remove an entry from the dex for a specific tag.
   */
  remove(
    entry: TEntry,
    forTag: ITag,
    options?: {
      leaveUntaggedEntries?: boolean,
      cleanEmptyTags?: boolean
    }
  ): void;

  /**
   * Used to remove any number of entries from the dex for a specific tag
   */
  remove(
    entries: Iterable<TEntry>,
    forTag: ITag,
    options?: {
      leaveUntaggedEntries?: boolean,
      cleanEmptyTags?: boolean
    }
  ): void;

  /**
   * Remove the matching entry from the dex for a specific subset of tags.
   */
  remove(
    hashKey: IHashKey,
    forTags: Iterable<ITag>,
    options?: {
      leaveUntaggedEntries?: boolean,
      cleanEmptyTags?: boolean
    }
  ): void;

  /**
   * Used to unlink matching entries from the dex for a specific subset of tags.
   */
  remove(
    hashKeys: Iterable<IHashKey>,
    forTags: Iterable<ITag>,
    options?: {
      leaveUntaggedEntries?: boolean,
      cleanEmptyTags?: boolean
    }
  ): void;

  /**
   * Used to remove an entry from the dex for a specific subset of tags.
   */
  remove(
    entry: TEntry,
    forTags: Iterable<ITag>,
    options?: {
      leaveUntaggedEntries?: boolean,
      cleanEmptyTags?: boolean
    }
  ): void;

  /**
   * Used to remove any number of entries from the dex for a specific subset of tags.
   */
  remove(
    entries: Iterable<TEntry>,
    forTags: Iterable<ITag>,
    options?: {
      leaveUntaggedEntries?: boolean,
      cleanEmptyTags?: boolean
    }
  ): void;

  /**
   * Used to remove entries from the dex.
   */
  remove(
    targets: Iterable<TEntry> | Iterable<IHashKey> | IHashKey | TEntry,
    optionsOrTags?: ITagOrTags | {
      leaveUntaggedEntries?: boolean,
      cleanEmptyTags?: boolean
    },
    options?: {
      leaveUntaggedEntries?: boolean,
      cleanEmptyTags?: boolean
    }
  ): void {
    const config = options !== undefined
      ? options
      : (isObject(optionsOrTags) && !isArray(optionsOrTags))
        ? optionsOrTags
        : undefined;

    const tags: Iterable<ITag> | undefined = isIterable(optionsOrTags)
      ? optionsOrTags as Iterable<ITag>
      : optionsOrTags !== undefined
        ? [optionsOrTags] as Iterable<ITag>
        : undefined;

    if (!config) {
      if (isIterable(targets)) {
        for (const entryOrKey of targets) {
          const hash = this.hash(entryOrKey);
          this.untagEntry(hash, tags);
          if (!this._tagsByEntryHash.get(hash)?.size) {
            this._removeTaglessEntry(hash);
          }
        }
      } else {
        const hash = this.hash(targets);
        this.untagEntry(hash, tags);
        if (!this._tagsByEntryHash.get(hash)?.size) {
          this._removeTaglessEntry(hash);
        }
      }
    } else {
      if (isIterable(targets)) {
        for (const entryOrKey of targets) {
          let tagsToCheck: Set<ITag> | undefined;
          const hash = this.hash(entryOrKey);
          if ((config as any)?.cleanEmptyTags) {
            tagsToCheck = this._tagsByEntryHash.get(hash);
          }

          this.untagEntry(hash, tags);
          if (!(config as any)?.leaveUntaggedEntries && !this._tagsByEntryHash.get(hash)?.size) {
            this._removeTaglessEntry(hash);
          }
          if (tagsToCheck) {
            for (const tag in tagsToCheck) {
              if (!this._hashesByTag.get(tag)?.size) {
                this._removeEmptyTag(tag);
              }
            }
          }
        }
      } else {
        let tagsToCheck: Set<ITag> | undefined;
        const hash = this.hash(targets);
        if ((config as any)?.cleanEmptyTags) {
          tagsToCheck = this._tagsByEntryHash.get(hash);
        }

        this.untagEntry(hash, tags);
        if (!(config as any)?.leaveUntaggedEntries && !this._tagsByEntryHash.get(hash)?.size) {
          this._removeTaglessEntry(hash);
        }
        if (tagsToCheck) {
          for (const tag in tagsToCheck) {
            if (!this._hashesByTag.get(tag)?.size) {
              this._removeEmptyTag(tag);
            }
          }
        }
      }
    }
  }

  private _removeTaglessEntry(key: IHashKey) {
    this._entriesByHash.delete(key);
    this._allHashes.delete(key);
  }

  //#endregion

  //#region Remove Tags

  /**
   * Remove all tags from one entry
   */
  untagEntry(entry: TEntry | IHashKey): void;

  /**
   * Remove all the provided tags from one entry
   */
  untagEntry(entry: TEntry | IHashKey, tagToRemove?: ITag): void;

  /**
   * Remove all the provided tags from one entry
   */
  untagEntry(entry: TEntry | IHashKey, tagsToRemove?: ITags): void;

  /**
   * Remove all the provided tags from one entry
   */
  untagEntry(entry: TEntry | IHashKey, ...tagsToRemove: ITag[]): void;

  /**
   * Remove all the provided tags from one entry
   */
  untagEntry(entry: TEntry | IHashKey, tagsToRemove?: ITagOrTags): void {
    const hash = this.hash(entry);
    const currentTagsForEntry = this._tagsByEntryHash.get(hash);
    if (!tagsToRemove) {
      for (const tag of currentTagsForEntry ?? []) {
        const currentEntriesForTag = this._hashesByTag.get(tag);
        currentEntriesForTag?.delete(hash);
      }

      currentTagsForEntry?.clear();
    } else if (isIterable(tagsToRemove)) {
      for (const tag of tagsToRemove) {
        const currentEntriesForTag = this._hashesByTag.get(tag);
        currentTagsForEntry?.delete(tag);
        currentEntriesForTag?.delete(hash);
      }
    } else if (isTag(tagsToRemove)) {
      if (currentTagsForEntry) {
        currentTagsForEntry.delete(tagsToRemove);
      }
      const currentEntriesForTag = this._hashesByTag.get(tagsToRemove);
      currentEntriesForTag?.delete(hash);
    }
  }

  /**
   * Remove all tags from one entry
   */
  untagEntries(entries: Iterable<TEntry> | Iterable<IHashKey>): void;

  /**
   * Remove all the provided tags from one entry
   */
  untagEntries(entries: Iterable<TEntry> | Iterable<IHashKey>, tagToRemove?: ITag): void;

  /**
   * Remove all the provided tags from one entry
   */
  untagEntries(entries: Iterable<TEntry> | Iterable<IHashKey>, tagsToRemove?: ITags): void;

  /**
   * Remove all the provided tags from one entry
   */
  untagEntries(entries: Iterable<TEntry> | Iterable<IHashKey>, ...tagsToRemove: ITag[]): void;

  /**
   * Remove all the provided tags from one entry
   */
  untagEntries(entries: Iterable<TEntry> | Iterable<IHashKey>, tagsToRemove?: ITagOrTags): void {
    for (const entry in entries) {
      this.untagEntry(entry, tagsToRemove as any);
    }
  }

  /**
   * Remove all tags from the provided entry
   */
  untag(entry: TEntry | IHashKey): void

  /**
   * Remove all tags from the provided entries
   */
  untag(entries: Iterable<TEntry> | Iterable<IHashKey>): void

  /**
   * Remove the given tags from the provided entry
   */
  untag(entry: TEntry | IHashKey, tagToRemove?: ITag): void

  /**
   * Remove the given tags from the provided entries
   */
  untag(entries: Iterable<TEntry> | Iterable<IHashKey>, tagToRemove?: ITag): void

  /**
   * Remove the given tags from the provided entry
   */
  untag(entry: TEntry | IHashKey, tagsToRemove?: ITagOrTags): void

  /**
   * Remove the given tags from the provided entries
   */
  untag(entries: Iterable<TEntry> | Iterable<IHashKey>, tagsToRemove?: ITagOrTags): void

  /**
   * Remove the given tags from the provided entry
   */
  untag(entry: TEntry | IHashKey, ...tagsToRemove: ITag[]): void

  /**
   * Remove the given tags from the provided entries
   */
  untag(entries: Iterable<TEntry> | Iterable<IHashKey>, ...tagsToRemove: ITag[]): void

  untag(
    entries: Iterable<TEntry> | Iterable<IHashKey> | TEntry | IHashKey,
    tags?: ITagOrTags
  ): void {
    if (isIterable(entries)) {
      this.untagEntries(entries as Iterable<TEntry> | Iterable<IHashKey>, tags as ITags);
    } else {
      this.untagEntry(entries, tags as ITag | undefined);
    }
  }

  /**
   * Used to remove a whole tag from the dex
   */
  drop(
    tag: ITag,
    options?: {
      leaveEmptyTags?: boolean,
      cleanUntaggedEntries?: boolean
    }
  ): void;

  drop(
    tags: ITagOrTags,
    options?: {
      leaveEmptyTags?: boolean,
      cleanUntaggedEntries?: boolean
    }
  ): void {
    if (!options?.cleanUntaggedEntries) {
      if (isIterable(tags)) {
        for (const tag of tags) {
          this.resetTag(tag);
          if (!options?.leaveEmptyTags) {
            this._removeEmptyTag(tag);
          }
        }
      } else {
        this.resetTag(tags);
        if (!options?.leaveEmptyTags) {
          this._removeEmptyTag(tags);
        }
      }
    } else {
      if (isIterable(tags)) {
        for (const tag of tags) {
          const hashesForTag = this._hashesByTag.get(tag);
          this.resetTag(tag);
          if (!options?.leaveEmptyTags) {
            this._removeEmptyTag(tag);
          }

          for (const hash of hashesForTag ?? []) {
            if (!this._tagsByEntryHash.get(hash)?.size) {
              this._removeTaglessEntry(hash);
            }
          }
        }
      } else {
        const hashesForTag = this._hashesByTag.get(tags);
        this.resetTag(tags);
        if (!options?.leaveEmptyTags) {
          this._removeEmptyTag(tags);
        }
        for (const hash of hashesForTag ?? []) {
          if (!this._tagsByEntryHash.get(hash)?.size) {
            this._removeTaglessEntry(hash);
          }
        }
      }
    }
  }

  private _removeEmptyTag(tag: ITag) {
    this._hashesByTag.delete(tag);
    this._allTags.delete(tag);
  }

  /**
   * Clear all entries from a given tag without removing anything by default.
   */
  resetTag(
    tag: ITag,
    options?: {
      cleanUntaggedEntries?: boolean,
      cleanEmptyTags?: boolean
    }
  ): void;

  /**
   * Clear all entries from a given set of tags.
   */
  resetTag(
    tags: ITagOrTags,
    options?: {
      cleanUntaggedEntries?: boolean,
      cleanEmptyTags?: boolean
    }
  ): void;

  resetTag(
    tags: ITagOrTags,
    options?: {
      cleanUntaggedEntries?: boolean,
      cleanEmptyTags?: boolean
    }
  ): void {
    const tagsToReset = (isIterable(tags)
      ? tags
      : [tags]) as Iterable<ITag>;
    
    for (const tag in tagsToReset) {
      for (const hash in this._hashesByTag.get(tag) ?? []) {
        const tagsForHash = this._tagsByEntryHash.get(hash);
        tagsForHash!.delete(tag);
        if (!tagsForHash!.size && options?.cleanUntaggedEntries) {
          this._removeTaglessEntry(hash);
        }
      }

      if (options?.cleanEmptyTags) {
        this._removeEmptyTag(tag);
      }
    }
  }

  //#endregion

  //#region Remove Various Values

  /**
   * Used to remove all empty tags and entries.
   */
  clean(): void;

  /**
   * Clean the dex of any empty tags and/or entries.
   */
  clean(options: { taglessEntries?: boolean, emptyTags?: boolean }): void;

  clean(options: {
    taglessEntries?: boolean,
    emptyTags?: boolean
  } = {
      taglessEntries: true,
      emptyTags: true
    }): void {
    if (options.taglessEntries) {
      for (const [k, t] of this._tagsByEntryHash) {
        if (!t.size) {
          this._removeTaglessEntry(k);
        }
      }
    }

    if (options.emptyTags) {
      for (const [t, k] of this._hashesByTag) {
        if (!k.size) {
          this._removeEmptyTag(t);
        }
      }
    }
  }

  /**
   * Drop all tags and entries at once, clearing the whole dex of all data.
   */
  clear(): void;

  clear(): void {
    this._allTags.clear();
    this._allHashes.clear();
    this._entriesByHash.clear();
    this._hashesByTag.clear();
    this._tagsByEntryHash.clear();
  }

  private _removeItemAt(hash: IHashKey) {
    this._tagsByEntryHash.delete(hash);
    this._entriesByHash.delete(hash);
    this._allHashes.delete(hash);
  }

  private static _removeFromArray<T>(array: T[], target: (T | ((entry: T) => boolean)), thenDo: (entry: T) => void): number {
    let count: number = 0;
    let index: number = 0;

    if (isFunction(target)) {
      while ((index = array.findIndex(e => target(e))) > -1) {
        const removed = array.splice(index, 1)[0];
        thenDo(removed);
        count++;
      }
    } else {
      while ((index = array.indexOf(target, 0)) > -1) {
        const removed = array.splice(index, 1)[0];
        thenDo(removed);
        count++;
      }
    }

    return count;
  }

  //#endregion

  //#endregion

  //#endregion

  //#region Looping

  *[Symbol.iterator](): Iterator<[IHashKey, TEntry, Set<ITag>]> {
    for (const hash in this._allHashes) {
      yield [hash, this.get(hash)!, this._tagsByEntryHash.get(hash)!];
    }    
  }

  //#region For

  /**
   * For each unique entry and tag pair.
   * 
   * @param func 
   */
  forEach(
    func: IBreakable<[entry: TEntry, tag: ITag, index: number], any>,
    outerLoopType: 'entry' | 'tag' | undefined = 'entry'
  ): void {
    let index: number = 0;
    if (outerLoopType === 'tag') {
      for (const tag of this._allTags) {
        for (const hash of this._hashesByTag.get(tag)!) {
          if (func(this._entriesByHash.get(hash)!, tag, index++) instanceof Break) {
            break;
          }
        }
      }
    } else {
      for (const hash of this._allHashes) {
        for (const tag of this._tagsByEntryHash.get(hash)!) {
          if (func(this._entriesByHash.get(hash)!, tag, index++) instanceof Break) {
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
    func: IBreakable<[tag: ITag, index: number, entries: Set<TEntry>], any>
  ): void {
    let index: number = 0;
    for (const tag of this._allTags) {
      const entries = new Set<TEntry>();
      this._hashesByTag.get(tag)!.forEach(h =>
        entries.add(this._entriesByHash.get(h)!)
      )

      if (func(tag, index++, entries) instanceof Break) {
        break;
      }
    }
  }

  /**
   * Iterate logic on each entry in the dex.
   */
  forEachEntry(
    func: IBreakable<[entry: TEntry, index: number, tags: Set<ITag>], any>
  ): void {
    let index: number = 0;
    for (const hash of this._allHashes) {
      if (func(
        this._entriesByHash.get(hash)!,
        index++,
        this._tagsByEntryHash.get(hash)!
      ) instanceof Break) {
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
    transform?: IBreakable<[entry: TEntry, tag: ITag, index: number], TResult>,
    outerLoopType: 'entry' | 'tag' = 'entry'
  ): (TResult extends undefined ? Map<IEntry, ITag[]> : TResult[]) {
    if (!transform) {
      return new Map<TEntry, ITag[]>() as any;
    }

    const results: TResult[] = [];
    let index: number = 0;
    this.forEach((e, t, i) => {
      const result = transform(e, t, i);
      if (result instanceof Break) {
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
    transform?: IBreakable<[entry: TEntry, index: number, tags: Set<ITag>], TResult>
  ): TResult[] {
    if (!transform) {
      return this.entries as any as TResult[];
    }

    const results: TResult[] = [];
    this.forEachEntry((e, i, t) => {
      const result = transform(e, i, t);
      if (result instanceof Break) {
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
    transform?: IBreakable<[tag: ITag, index: number, entries: Set<TEntry>], TResult>
  ): TResult[] {
    if (!transform) {
      return this.tags as any as TResult[];
    }

    const results: TResult[] = [];
    this.forEachTag((t, i, e) => {
      const result = transform(t, i, e);
      if (result instanceof Break) {
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

  //#region Helpers

  /**
   * Get the uuid for a non primative object added to a dex.
   * 
   * @param entry 
   * @returns 
   */
  public static getUuidFor(entry: { [key: string]: any } | IUnique) {
    let id: string;
    if (id = (entry as any).__dex_id__) {
      return id;
    } else {
      (entry as any).__dex_id__
        = id
        = uuidv4();
    }

    return id;
  }

  //#endregion

  //#endregion
}

//#region Errors

export class DexError extends Error implements Error {
  constructor(message: string) {
    super(message);
  }
}

/**
 * This is something that needs to be implemented but has not been yet.
 */
export class NotImplementedError extends DexError {
  constructor(propertyOrMethodName: string, message?: string) {
    super("NOT IMPLEMENTED ERROR: " + propertyOrMethodName + ", has not been implemented by meep.tech yet.\n" + (message ?? ""));
  }
}

/**
 * An error signifying an invalid combination of flags were passed to a Dex Query
 */
export class InvalidQueryParamError extends DexError {
  readonly arg: any;
  constructor(arg: any, index: number | string) {
    super(`Missing or Invalid Query Parameter: ${arg ?? 'undefined'}, at index: ${index}`);
  }
}

//#endregion

//#region Utilities

/**
 * Default entry hashing method.
 */
export const hash: IHasher = Dex.Defaults.getHashFunction();

//#endregion