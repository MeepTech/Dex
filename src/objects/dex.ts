import { IBreakable, Break } from "../utilities/breakable";
import {
  isArray,
  isComplexEntry,
  isConfig,
  isFunction,
  isInputEntryWithTagsArray,
  isObject,
  isSimpleEntry,
  isTag,
  isUnique
} from "../utilities/validators";
import IUnique from "./unique";
import { v4 as uuidv4 } from 'uuid';
import {
  AndQueryChainConstructor,
  NotQueryChainConstructor,
  OrQueryChainConstructor,
  QueryChainConstructor
} from './queries/chain';
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
  toSet
} from "./subsets/tags";
import {
  IHashKey,
  IHashSet,
  HashSetConstructor
} from "./subsets/hashes";
import { IReadOnlyDex } from "./readonly";
import { CopierConstructor, ICopier } from './helpers/copy';
import {
  IBasicQuery,
  IQueryChain,
  QueryConstructor,
  IFullQuery,
  IFirstableQuery,
  IQueryResult,
  NO_RESULT,
  NoEntryFound,
  _logicMultiQuery,
  _logicFirstQuery
} from "./queries/queries";
import {
  FLAGS,
  IFlag,
  ILogicFlag,
  IFlagOrFlags,
  hasFlag,
  dropFlags,
} from "./queries/flags";
import { FirstableQueryConstructor, FirstQueryConstructor } from './queries/first';

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
  private _baseChainQuery?: IQueryChain<TEntry>;
  private _andChainQuery?: IQueryChain<TEntry>;
  private _orChainQuery?: IQueryChain<TEntry>;
  private _notChainQuery?: IQueryChain<TEntry>;

  // - subsets
  private _hashSet?: IHashSet<TEntry>;
  private _tagSet?: ITagSet<TEntry>;
  private _entrySet?: IEntrySet<TEntry>;

  // - helpers
  private _forLooper?: ILooper<TEntry>;
  private _mapLooper?: IMapper<TEntry>;
  private _copier?: ICopier<TEntry>;

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
                  values = [...values, ...optionsOrMoreValues] as ITag[];
                } else {
                  (values as ITag[]).push(optionsOrMoreValues as ITag);
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

  search<TFlag extends IFlag>(
    tags: ITagOrTags,
    options: IFlagOrFlags<TFlag> = []
  ): IQueryResult<TEntry, TFlag> {
    if (hasFlag(options, FLAGS.FIRST)) {
      if (hasFlag(options, FLAGS.CHAIN) || hasFlag(options, FLAGS.VALUES)) {
        throw new InvalidQueryParamError(options);
      }

      return this.value(tags, options) as IQueryResult<TEntry, TFlag>;
    } else if (hasFlag(options, FLAGS.CHAIN)) {
      if (hasFlag(options, FLAGS.FIRST) || hasFlag(options, FLAGS.VALUES)) {
        throw new InvalidQueryParamError(options);
      }

      return this.filter(tags, options) as IQueryResult<TEntry, TFlag>;
    } else {
      if (hasFlag(options, FLAGS.CHAIN) || hasFlag(options, FLAGS.FIRST)) {
        throw new InvalidQueryParamError(options);
      }

      return this.values(
        tags,
        options as (typeof FLAGS.VALUES | ILogicFlag)[]
      ) as IQueryResult<TEntry, TFlag>;
    }
  }

  get query(): IFullQuery<TEntry> {
    return QueryConstructor<TEntry>(this.search, this);
  }

  //#endregion

  //#region Chained

  filter(
    tags: ITagOrTags,
    flags
      : IFlagOrFlags<typeof FLAGS.CHAIN | ILogicFlag>
      = [FLAGS.CHAIN, FLAGS.AND]
  ): Dex<TEntry> {
    const results = new Dex<TEntry>();

    _logicMultiQuery<TEntry>(
      this,
      tags,
      dropFlags(flags, FLAGS.CHAIN),
      hashes => results.copy.from(this, hashes),
      {
        onEmptyNot: () => results.copy.from(this, { tags: this.tags }),
        onEmpty: () => results.copy.from(this, { tags: [] }),
        onOr: tags => results.copy.from(this, { tags: this.tags })
      }
    )

    return results;
  }

  get select()
    : IQueryChain<TEntry> {
    return this._baseChainQuery
      ??= QueryChainConstructor<TEntry>(this, this.filter);
  }

  get and()
    : IQueryChain<TEntry> {
    return this._andChainQuery
      ??= AndQueryChainConstructor<TEntry>(this, this.filter)
  }
  get or()
    : IQueryChain<TEntry> {
    return this._orChainQuery
      ??= OrQueryChainConstructor<TEntry>(this, this.filter)
  }

  get not()
    : IQueryChain<TEntry> {
    return this._notChainQuery
      ??= NotQueryChainConstructor<TEntry>(this, this.filter)
  }

  //#endregion

  //#region Values

  value(
    tags: ITagOrTags,
    flags:
      IFlagOrFlags<typeof FLAGS.FIRST | ILogicFlag>
      = [FLAGS.FIRST, FLAGS.AND]
  ): TEntry | NoEntryFound {
    let result: TEntry | undefined = NO_RESULT;

    _logicFirstQuery<TEntry>(
      this,
      tags,
      dropFlags(flags, FLAGS.FIRST),
      match => match === undefined
        ? undefined
        : result = this._entriesByHash.get(match)
    );

    return result;
  }

  // TODO: lazy load this
  values: IFirstableQuery<TEntry, typeof FLAGS.VALUES | ILogicFlag, TEntry, TEntry[]>
    = FirstableQueryConstructor<TEntry, TEntry, TEntry[], typeof FLAGS.VALUES | ILogicFlag>(
      ((
        tags?: ITagOrTags,
        flags: IFlagOrFlags = [FLAGS.VALUES, FLAGS.AND]
      ): TEntry[] => {
        if (!tags) {
          if (!hasFlag(flags, FLAGS.NOT)) {
            return [...this.entries.values];
          } else {
            return [];
          }
        }

        let results: TEntry[] = [];

        _logicMultiQuery<TEntry>(
          this,
          tags,
          flags as any,
          hashes => results = hashes.map(h => this.get(h)!)
        );

        return results;
      }),
      this.first
    );

  //#endregion

  //#region Single Value

  // TODO: lazy load this
  get first(): IFullQuery<TEntry, typeof FLAGS.FIRST | ILogicFlag, TEntry, TEntry> {
    return FirstQueryConstructor<TEntry>(this);
  }

  //#endregion

  //#region Hashes/Keys

  // TODO: turn this into a method or lazy getter to prevent loading during costruction.
  key: IBasicQuery<IHashKey, typeof FLAGS.FIRST | ILogicFlag, TEntry, IHashKey | NoEntryFound> = (
    tags: ITagOrTags,
    flags
      : IFlagOrFlags<typeof FLAGS.FIRST | ILogicFlag>
      = [FLAGS.FIRST, FLAGS.AND]
  ): IHashKey | NoEntryFound => {
    let result: IHashKey | undefined = NO_RESULT;

    _logicFirstQuery<TEntry>(
      this,
      tags,
      dropFlags(flags, FLAGS.FIRST),
      match => result = match
    );

    return result;
  }

  // TODO: lazy load this
  keys: IFirstableQuery<IHashKey, typeof FLAGS.VALUES | ILogicFlag, TEntry, IHashKey[]>
    = FirstableQueryConstructor<IHashKey, TEntry, IHashKey[], typeof FLAGS.VALUES | ILogicFlag>(
      ((
        tags?: ITagOrTags,
        flags: IFlagOrFlags = [FLAGS.VALUES, FLAGS.AND]
      ): IHashKey[] => {
        if (!tags) {
          if (!hasFlag(flags, FLAGS.NOT)) {
            return [...this.hashes];
          } else {
            return [];
          }
        }

        let results: IHashKey[] = [];

        _logicMultiQuery<TEntry>(
          this,
          tags,
          flags as any,
          hashes => results = hashes
        );

        return results;
      }),
      QueryConstructor<
        IHashKey,
        TEntry,
        typeof FLAGS.FIRST | ILogicFlag,
        IHashKey | NoEntryFound,
        IHashKey,
        IHashKey | NoEntryFound,
        typeof FLAGS.FIRST | ILogicFlag
      >(this.hash, this)
    );

  //#endregion

  //#region Utility

  // TODO: lazy load this
  any: IFullQuery<boolean, typeof FLAGS.FIRST | ILogicFlag, TEntry, boolean>
    = QueryConstructor<
      boolean,
      TEntry,
      ILogicFlag | typeof FLAGS.FIRST,
      boolean,
      boolean,
      boolean,
      ILogicFlag | typeof FLAGS.FIRST
    >(
      (tags: ITagOrTags, options?: IFlagOrFlags<typeof FLAGS.FIRST | ILogicFlag>): boolean => {
        return !!this.first(tags, options);
      },
      this
    );

  // TODO: lazy load this
  count: IFullQuery<number, ILogicFlag, TEntry, number>
    = QueryConstructor<
      number,
      TEntry,
      ILogicFlag,
      number,
      number,
      number,
      ILogicFlag
    >(
      (tags: ITagOrTags, options?: IFlagOrFlags<ILogicFlag>): number => {
        return this.values(tags, options).length;
      },
      this
    );

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
      tags.forEach(tag => {
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
  ): ITag | IHashKey | (IHashKey | NoEntries)[] | NoEntries | IHashKey[] {
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
    if (!tags || !tags.size) {
      // add the new empty entry:
      this._addEntry(<TEntry>entry, hash);

      return hash;
    } // if we have tags howerver~
    else {
      // set the entries by tag.
      tags.forEach(t => {
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
   * Remove all entries that match the tags.
   * 
   * @returns the number of removed entries
   */
  remove(
    tags: ITag[],
    options?: (ILogicFlag)[],
    cleanEmptyTags?: boolean
  ): number;

  /**
   * Used to remove matching entries from the dex, or the desired tag.
   * 
   * @returns the number of removed entries
   */
  remove(
    target: IBreakable<[entry?: TEntry, tag?: ITag], boolean>,
    cleanEmptyTags?: boolean
  ): number;

  /**
   * Used to remove an entry from the dex
   * 
   * @returns the number of removed entries
   */
  remove(
    target: TEntry,
    cleanEmptyTags?: boolean
  ): number;

  /**
   * Used to remove an entry from the dex by key
   * 
   * @returns the number of removed entries
   */
  remove(
    target: IHashKey,
    cleanEmptyTags?: boolean
  ): number;

  /**
   * Used to remove entries from the dex.
   * 
   * @returns the number of removed entries
   */
  remove(
    target: TEntry
      | IBreakable<[entry: TEntry, tag: ITag], boolean>
      | IHashKey
      | ITag[],
    cleanEmptyTagsOrOptions: boolean | IFlag[] = false,
    cleanEmptyTags: boolean = false,
  ): number {
    let removedCount = 0;
    const emptiedTags: Set<ITag> = new Set();
    // if it's a function we need to check all entries for all tags.
    if (isFunction(target)) {
      // TODO: different loops for just entry vs entry and tags.
      this._allTags.forEach(t => {
        const hashesForTag = Array.from(this._hashesByTag.get(t)!);
        // remove the matching entries for this tag
        Dex._removeFromArray(
          hashesForTag,
          isFunction(target)
            ? (e) => target(this._entriesByHash.get(e)!, t)
            : this.hash(target),
          (removed: IHashKey) => {
            // then remove the tag for the entry
            this._tagsByEntryHash.get(removed)!.delete(t);

            // remove entries with no remaining tags:
            if (!this._tagsByEntryHash.get(removed)!.size) {
              this._removeItemAt(removed);
              removedCount++;
            }
          }
        );

        if (hashesForTag.length === 0) {
          emptiedTags.add(t);
        }

        this._hashesByTag.set(t, new Set(hashesForTag));
      });
    } // array of tags
    else if (isArray(target)) {
      if (isArray(cleanEmptyTagsOrOptions) && cleanEmptyTagsOrOptions.length) {
        const flags = cleanEmptyTagsOrOptions as IFlag[];

        const hashesToRemove = this.keys(target, flags as any);
        hashesToRemove.forEach(hash => {
          this.remove(hash)
        });

        return hashesToRemove.length;
      } else {
        target.forEach((tag: ITag) => {

        });
      }
    } // remove by match/hash
    else {
      const hash = this.hash(target);
      const effectedTags = this._tagsByEntryHash.get(hash);
      if (effectedTags) {
        effectedTags.forEach(t => {
          this._hashesByTag.get(t)!.delete(hash);
          if (!this._hashesByTag.get(t)!.size) {
            emptiedTags.add(t);
          }
        });
        this._removeItemAt(hash);
      }
    }

    if (cleanEmptyTagsOrOptions === true || cleanEmptyTags) {
      this.drop(...emptiedTags);
    }

    return removedCount;
  }

  //#endregion

  //#region Remove Tags

  /**
   * Used to remove all empty tags.
   */
  clean(): TEntry[];

  /**
   * Used to remove tags without dropping related items.
   */
  clean(...tags: ITag[]): void;

  clean(...tags: ITag[]): TEntry[] | void {
    if (!tags?.length) {
      throw new NotImplementedError("clean");
    } else {
      const effectedEntries = [];
      tags.forEach(tag => {
        if (this.has(tag) && this._hashesByTag.get(tag)!.size) {
          throw new NotImplementedError("clean");
        }
      });
      throw new NotImplementedError("clean");
    }
  }

  /**
   * Remove whole tags from the dex, and any entries under them that have no remaining tags.
   * 
   * @returns A set of the effected entries.
   */
  drop(
    ...tags: Array<ITag>
  ): Set<TEntry> {
    const effectedEntries = new Set<TEntry>;
    tags.forEach(t => {
      if (this._allTags.delete(t)) {
        this._hashesByTag.get(t)!.forEach(hash => {
          // mark the entry as effected
          effectedEntries.add(this._entriesByHash.get(hash)!);

          // remove for the entry
          this._tagsByEntryHash.get(hash)!.delete(t);

          // if there's no tags left for the given entry"
          if (!this._tagsByEntryHash.get(hash)!.size) {
            this._removeItemAt(hash);
          }
        });

        // remove all the tag entries
        this._hashesByTag.delete(t);
      }
    });

    return effectedEntries;
  }

  /**
   * Clear all tags from a given entry.
   */
  clear(entry: TEntry | IHashKey): void;

  //#endregion

  //#region Remove Values

  /**
   * Drop all tags and entries at once.
   */
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
  constructor(arg: any, index: number) {
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