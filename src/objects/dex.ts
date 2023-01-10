import Check from "../utilities/validators";
import IUnique from "./unique";
import { v4 as uuidv4 } from 'uuid';
import {
  Complex,
  Entry,
  OrNone,
  IGuard,
  XWithTags,
  XWithTagsTuple,
  XWithTagsObject,
  None,
  IArrayGuard,
  NONE_FOR_TAG,
  IObjectGuard,
  IHasher
} from "./subsets/entries";
import {
  Tag,
  TagOrTags,
  toSet,
  Tags
} from "./subsets/tags";
import {
  HashKey
} from "./subsets/hashes";
import { CopierConstructor, Copier } from './helpers/copy';
import Queries from "./queries/queries";
import { NO_RESULT, ResultType } from "./queries/results";
import { ReadableDex } from "./readonly";
import { DexError, NotImplementedError } from "./errors";
import Loop from "../utilities/iteration";

/**
 * Extra config options for a dex.
 */
export interface Config<TEntry extends Entry = Entry> {
  entryGuard?: IGuard<TEntry>,
  arrayGuard?: IArrayGuard<TEntry>,
  objectGuard?: IObjectGuard<TEntry>,
  hasher?: IHasher
}

/**
 * A collection of unque entries, keyed by various custom tags.
 * 
 * This represents a many to many replationship of Tags to Entries.
 */
export default class Dex<TEntry extends Entry = Entry> extends ReadableDex<TEntry> {
  // lazy
  // - queries
  private _take?: Queries.Full<TEntry, ResultType.Array, TEntry>;
  // - helpers
  private _copier?: Copier<TEntry>;

  // config
  /** @readonly */
  private _guards : {
    entry: IGuard<TEntry>
    array: IArrayGuard<TEntry>,
    object: IObjectGuard<TEntry>,
  } = null!;

  //#region Defaults

  /**
   * Default helpers for initialization.
   */
  static Defaults = {
    getHashFunction() {
      return function (entry: Entry): HashKey {
        return Check.isUnique(entry)
          ? entry.getHashKey()
          : Check.isSimpleEntry(entry)
            ? entry
            : Check.isComplexEntry(entry)
              ? Dex.getUuidFor(entry)
              : undefined!;
      }
    },

    getArrayEntryGuardFunction<TEntry extends Entry>() {
      return function (entry: Entry): entry is TEntry & Complex & any[] {
        return !Check.isInputEntryWithTagsArray<TEntry>(entry);
      }
    },

    getObjectEntryGuardFunction<TEntry extends Entry>() {
      return function (entry: Entry): entry is TEntry & Complex & object & { [key: string]: any } {
        return Check.isObject(entry)
          && (!entry.hasOwnProperty("entry")
            && (!entry.hasOwnProperty("tags")
              || !entry.hasOwnProperty("tag")));
      }
    },

    getEntryGuardFunction<TEntry extends Entry>(
      arrayGuard: IArrayGuard<TEntry>,
      objectGuard: IObjectGuard<TEntry>
    ): IGuard<TEntry> {
      return function (
        entry: Entry
      ): entry is TEntry {
        return Check.isSimpleEntry(entry)
          || (Check.isArray(entry)
            ? arrayGuard(entry)
            : Check.isObject(entry)
              ? objectGuard(entry)
              : Check.isComplexEntry(entry));
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
   * Copy a new dex from an existing one
   */
  constructor(original: Dex<TEntry>, options?: Config<TEntry>)

  /**
   * Make a new dex from a map
   */
  constructor(map: Map<OrNone<TEntry>, TagOrTags>, options?: Config<TEntry>)

  /**
   * Make a new dex of just empty tags
   */
  constructor(options: Config<TEntry>)

  /**
   * Make a new dex with just one empty tag
   */
  constructor(options: Config<TEntry>, tag: Tag)

  /**
   * Make a new dex with just empty tags
   */
  constructor(options: Config<TEntry>, ...tags: Tag[])

  /**
   * Make a new dex with just empty tags
   */
  constructor(options: Config<TEntry>, tags: Tag[])

  /**
   * Make a new dex from entries with their tags. 
   */
  constructor(options: Config<TEntry>, entriesWithTags: XWithTagsTuple<TEntry>[])

  /**
   * Make a new dex from an object with entries and tags
   */
  constructor(options: Config<TEntry>, entryWithTags: XWithTagsObject<TEntry>)

  /**
   * Make a new dex from an object with entries and tags
   */
  constructor(options: Config<TEntry>, ...entriesWithTags: XWithTagsObject<TEntry>[])

  /**
   * Make a new dex from an object with entries and tags
   */
  constructor(options: Config<TEntry>, entriesWithTags: XWithTags<TEntry>[])

  /**
   * Make a new dex with just one empty tag
   */
  constructor(tag: Tag, options?: Config<TEntry>)

  /**
   * Make a new dex with just empty tags
   */
  constructor(tags: TagOrTags, options?: Config<TEntry>)

  /**
   * Make a new dex from entries with their tags. 
   */
  constructor(entriesWithTags: XWithTagsTuple<TEntry>[], options?: Config<TEntry>)

  /**
   * Make a new dex from an object with entries and tags
   */
  constructor(entryWithTags: XWithTagsObject<TEntry>, options?: Config<TEntry>)

  /**
   * Make a new dex from an object with entries and tags
   */
  constructor(entriesWithTags: XWithTags<TEntry>[], options?: Config<TEntry>)

  /**
   * Make a new dex from an object with entries and tags
   */
  constructor(...entriesWithTags: XWithTagsObject<TEntry>[])

  /**
   * Make a new dex with just empty tags
   */
  constructor(...tags: Tag[])

  /**
   * Make a new dex
   */
  constructor(
    values?:
      Dex<TEntry>
      | Map<OrNone<TEntry>, TagOrTags>
      | Config<TEntry>
      | TagOrTags
      | XWithTagsObject<TEntry>
      | XWithTags<TEntry>[],
    optionsOrMoreValues?:
      Config<TEntry>
      | TagOrTags
      | XWithTagsObject<TEntry>
      | XWithTags<TEntry>[],
  ) {
    super(
      values as any,
      (values as any)?.hasher || (optionsOrMoreValues as any)?.hasher
    );

    // copy existing:
    if (values instanceof ReadableDex) {
      this._guards = values._guards;
      if (Check.isConfig<TEntry>(optionsOrMoreValues)) {
        this._initOptions(optionsOrMoreValues);
      }

      return;
    } else {
      // init config
      let config: Config<TEntry> | undefined = undefined;

      if (Check.isConfig<TEntry>(optionsOrMoreValues)) {
        config = optionsOrMoreValues;
        this._initOptions(optionsOrMoreValues);
      } else if (Check.isConfig<TEntry>(values)) {
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
          (e === NONE_FOR_TAG
            || e === NO_RESULT)
            ? this.set(t)
            : this.add(e, t)
        );

        return;
      } // TagOrTags | InputEntryWithTags<TEntry> | InputEntryWithTags<TEntry>[]
      else {
        // if the initial values are in an array:
        if (Check.isArray(values)) {
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
            if (Check.isTag(values[0])) {
              if (!config && optionsOrMoreValues) {
                if (Check.isArray(optionsOrMoreValues)) {
                  values = [...values, ...optionsOrMoreValues] as Iterable<Tag> as Tag[];
                } else {
                  (values as Iterable<Tag> as Tag[]).push(optionsOrMoreValues as Tag);
                }
              }

              (values as Tag[]).forEach((tag: Tag) => this.set(tag));

              return;
            } // entries, put them:
            else {
              if (!config && optionsOrMoreValues) {
                if (Check.isArray(optionsOrMoreValues)) {
                  values = [...values, ...optionsOrMoreValues] as XWithTags<TEntry>[];
                } else {
                  (values as XWithTags<TEntry>[]).push(optionsOrMoreValues as XWithTags<TEntry>);
                }
              }

              this.put(values as XWithTags<TEntry>[])

              return;
            }
          }
        } // single object
        else if (Check.isObject(values)) {
          if (!config && optionsOrMoreValues) {
            this.put([values, optionsOrMoreValues] as XWithTagsObject<TEntry>[]);
            return;
          } else {
            this.put(values as XWithTagsObject<TEntry>);
            return;
          }
        } // one tag
        else {
          this.set(values as Tag);
          return;
        }
      }
    }
  }

  //#region Internal

  /** @internal */
  private _initOptions(config?: Config<TEntry>) {
    const guards: {
      entry: IGuard<TEntry>,
      array: IArrayGuard<TEntry>,
      object: IObjectGuard<TEntry>,
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
  }

  //#endregion

  //#endregion

  //#region Properties

  get config(): Config<TEntry> {
    return {
      arrayGuard: this._guards.array,
      entryGuard: this._guards.entry,
      objectGuard: this._guards.object,
      hasher: this._hasher
    };
  }

  //#region Loop Helpers

  get copy(): Copier<TEntry> {
    return this._copier
      ??= CopierConstructor(this);
  }

  //#endregion

  //#endregion

  //#region Methods

  //#region Modify

  //#region Add

  //#region Set Tags

  /**
   * Add an empty tag to the dex. 
   * Since no second parameter is provided for entries this will simply make sure the tag exists, and not delete any existing entries.
   */
  set(tag: Tag): [];

  /**
   * Add an empty tag to the dex
   * Since no second parameter is provided for entries this will simply make sure the tag exists, and not delete any existing entries.
   */
  set(tags: TagOrTags): [];

  /**
   * Add an empty tag to the dex
   * Since no second parameter is provided for entries this will simply make sure the tag exists, and not delete any existing entries.
   */
  set(tag: Tag): [];

  /**
   * Add an empty tag to the dex
   * Since no second parameter is provided for entries this will simply make sure the tag exists, and not delete any existing entries.
   */
  set(tags: TagOrTags): [];

  /**
   * Add an empty tag to the dex, or set the existing tag to empty.
   * 
   * @returns any effected entries' hash keys.
   */
  set(tag: Tag, entries?: [] | None): HashKey[];

  /**
   * Add a empty tags to the dex, or set the existing tags to empty.
   * 
   * @returns any effected entries' hash keys.
   */
  set(tags: TagOrTags, entries?: [] | None): HashKey[];

  /**
   * Add a new tag with specific entries to the dex, or override the existing values for an existing tag.
   * 
   * @returns any effected entries' hash keys (only entries removed from the tags, not entries added to the tags).
   */
  set(tag: Tag, entries?: Iterable<TEntry>): HashKey[];

  /**
   * Add a new tag with specific entries to the dex, or override the existing values for an existing tag.
   * 
   * @returns any effected entries' hash keys (only entries removed from the tags, not entries added to the tags).
   */
  set(tags: TagOrTags, entries?: Iterable<TEntry>): HashKey[];

  set(
    tags: TagOrTags,
    entries?: Iterable<TEntry> | [] | None
  ): HashKey[] {
    let effectedHashes: HashKey[] = [];
    tags = toSet(tags);

    // undefined means nothing gets touched
    if (entries === undefined) {
      (tags as Set<Tag>).forEach(tag => {
        if (!this._allTags.has(tag)) {
          this._addNewTag(tag);
        }
      });
      return [];
    } else {
      // NoEntries or [] is passed in, set to empty:
      if (!entries || (entries instanceof Set ? !entries.size : !Loop.count(entries))) {
        for (const tag of tags) {
          if (this._allTags.has(tag)) {
            effectedHashes = this._setEntriesForExistingTag(tag, []).effected;
          } else {
            this._addNewTag(tag);
          }
        }

        return effectedHashes;
      } // set values
      else {
        const hashesToSet: Set<HashKey> = new Set<HashKey>();
        for (const entry of entries) {
          hashesToSet.add(this.hash(entry));
        }

        for (const tag of tags) {
          if (this._allTags.has(tag)) {
            effectedHashes = this._setEntriesForExistingTag(tag, hashesToSet).effected;
          } else {
            this._addNewTag(tag, hashesToSet);
          }
        }

        return effectedHashes;
      }
    }
  }

  //#region Internal

  /** @internal */
  protected _setEntriesForExistingTag(tag: Tag, hashesToSet: Set<HashKey> | []): { added?: HashKey[], removed?: HashKey[], effected: HashKey[] } {
    const currentSet = this._hashesByTag.get(tag)!;

    if (Check.isArray(hashesToSet)) {
      const hashes = [...currentSet];
      hashes.forEach(hash =>
        this._tagsByHash.get(hash)?.delete(tag));
      
      this._hashesByTag.get(tag)?.clear();
      return { removed: hashes, effected: hashes };
    } else {
      const hashesToRemove: HashKey[] = [];
      currentSet.forEach(hash => {
        if (!hashesToSet.has(hash)) {
          hashesToRemove.push(hash);
          this._tagsByHash.get(hash)?.delete(tag)
        }
      });

      const addedHashes = [...hashesToSet].filter(h => !currentSet.has(h));

      this._hashesByTag.set(tag, hashesToSet);
      
      return {
        removed: hashesToRemove,
        added: addedHashes,
        effected: hashesToRemove.concat(addedHashes)
      };
    }
  }

  /** @internal */
  protected _addNewTag(tag: Tag, hashesToSet = new Set<HashKey>()): void {
    this._allTags.add(tag);
    this._hashesByTag.set(tag, hashesToSet);
  }

  //#endregion

  //#endregion

  //#region Add Entries

  /**
   * Add an entry with any number of tags to the dex
   *
   * @returns The uniqueid/hash of the item added to the dex
   */
  add(
    entry: TEntry | HashKey,
    tag: Tag
  ): HashKey;

  /**
   * Add data about entries to the dex.
   *
   * @returns The uniqueid/hash of the items added to the dex
   */
  add(
    entries: XWithTags<TEntry>[],
  ): (HashKey | None)[];

  /**
   * Add data about an entry to the dex.
   *
   * @returns The uniqueid/hash of the item added to the dex
   */
  add(
    entryWithTags: XWithTagsObject<TEntry>
  ): HashKey | None;

  /**
   * Add data about an entry to the dex.
   *
   * @returns The uniqueid/hash of the item added to the dex
   */
  add(
    ...entriesWithTags: XWithTagsObject<TEntry>[]
  ): (HashKey | None)[];

  /**
   * Add an entry with any number of tags to the dex
   *
   * @returns The uniqueid/hash of the item added to the dex
   */
  add(
    entry: TEntry | HashKey,
    ...tags: Tag[]
  ): HashKey;

  /**
   * Add an entry with any number of tags to the dex
   *
   * @returns The uniqueid/hash of the item added to the dex
   */
  add(
    entry: TEntry | HashKey,
    tags: TagOrTags
  ): HashKey;

  /**
   * Add an entry with no tags to the dex
   *
   * @returns The uniqueid/hash of the item added to the dex
   */
  add(
    entry: TEntry | HashKey,
  ): HashKey;

  /**
   * Add an empty tag, or a entry with any number of tags to the dex
   *
   * @returns The uniqueid/hash of the item added to the dex
   * , or if just an empty tag was added: just the name of the tag is returned.
   */
  add(
    entry: TEntry | HashKey | XWithTags<TEntry>[] | XWithTagsObject<TEntry>,
    tags?: TagOrTags | XWithTagsObject<TEntry>,
    ...rest: any
  ): HashKey | (HashKey | None)[] | None | HashKey[] {
    // InputEntryWithTagsObject<TEntry>[] | InputEntryWithTagsArray<TEntry>[] | TEntry
    if (Check.isArray(entry) && !tags) {
      // InputEntryWithTagsArray<TEntry>[] | TEntry
      if (Check.isArray(entry[0])) {
        // InputEntryWithTagsArray<TEntry>[]
        if (!this.canContain(entry[0])) { // [0: [0: entry, ...tags], 1: [entry, ...tags]]
          return (entry as XWithTagsTuple<TEntry>[])
            .map(this._putOneArray.bind(this)) as any;
        }
      } // InputEntryWithTagsObject<TEntry>[]
      else if (Check.isObject(entry[0]) && !this.canContain(entry[0])) {
        return (entry as XWithTagsObject<TEntry>[])
          .map(this._putOneObject.bind(this)) as any;
      }
    } // InputEntryWithTagsObject<TEntry>
    else if (Check.isObject(entry) && !this.canContain(entry)) {
      if (tags) {
        this.put([entry, tags] as XWithTagsObject<TEntry>[])
      }
      return this._putOneObject(entry as XWithTagsObject<TEntry>);
    }

    // TEntry and Tags
    const hash: HashKey = this.hash(entry);
    tags = <TagOrTags | undefined>tags;
    tags = tags === undefined
      ? undefined
      : toSet(tags, ...rest);

    // if we're only provided an entry argument, then it's just for a tagless entry:
    if (!tags || !(tags as Set<Tag>).size) {
      // add the new empty entry:
      this._addEntry(<TEntry>entry, hash);

      return hash;
    } // if we have tags howerver~
    else {
      // set the entries by tag.
      (tags as Set<Tag>).forEach(t => {
        this._allTags.add(t);
        if (this._hashesByTag.has(t)) {
          this._hashesByTag.get(t)!.add(hash);
        } else {
          this._hashesByTag.set(t, new Set<HashKey>([hash]));
        }

        if (this._tagsByHash.has(hash)) {
          this._tagsByHash.get(hash)!.add(t);
        } else {
          this._tagsByHash.set(hash, new Set<Tag>([t]));
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

  private _addEntry(entry: TEntry, key?: HashKey) {
    const hash: HashKey = key ?? this.hash(entry);

    // add the new empty entry:
    if (!this._allHashes.has(hash)) {
      this._allHashes.add(hash);
      this._entriesByHash.set(hash, entry);
      if (!this._tagsByHash.get(hash)) {
        this._tagsByHash.set(hash, new Set<HashKey>());
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
    entries: XWithTags<TEntry>[],
  ): HashKey[];

  /**
   * Add data about an entry to the dex.
   *
   * @returns The uniqueid/hash of the item added to the dex
   */
  put(
    ...entriesWithTags: XWithTags<TEntry>[]
  ): HashKey[];

  /**
   * Add data about an entry to the dex.
   *
   * @returns The uniqueid/hash of the item added to the dex
   */
  put(
    entry: XWithTags<TEntry>
  ): HashKey | None;

  /**
   * Add data about entries to the dex.
   *
   * @returns The uniqueid/hash of the items added to the dex
   */
  put(
    entries: (XWithTagsObject<TEntry> | XWithTagsTuple<TEntry>)[],
  ): HashKey[];

  /**
   * Add data about an entry to the dex.
   *
   * @returns The uniqueid/hash of the item added to the dex
   */
  put(
    ...entriesWithTags: (XWithTagsObject<TEntry> | XWithTagsTuple<TEntry>)[]
  ): HashKey[];

  /**
   * Add data about an entry to the dex.
   *
   * @returns The uniqueid/hash of the item added to the dex
   */
  put(
    entry: (XWithTagsObject<TEntry> | XWithTagsTuple<TEntry>)
  ): HashKey | None;

  put<TInput extends XWithTags<TEntry>[] | XWithTags<TEntry>>(
    entryOrEntriesWithTags: TInput
  ): TInput extends XWithTags<TEntry>[] ? (HashKey | None)[] : (HashKey | None) {
    // InputEntryWithTags<TEntry>[] | InputEntryWithTagsArray<TEntry>
    if (Check.isArray(entryOrEntriesWithTags)) {
      // InputEntryWithTagsArray<TEntry>[] | InputEntryWithTagsArray<TEntry>
      if (Check.isArray(entryOrEntriesWithTags[0])) {
        // InputEntryWithTagsArray<TEntry>[]
        if (!this.canContain(entryOrEntriesWithTags[0])) { // [0: [0: entry, ...tags], 1: [entry, ...tags]]
          return (entryOrEntriesWithTags as XWithTagsTuple<TEntry>[])
            .map(this._putOneArray.bind(this)) as any;
        } // InputEntryWithTagsArray<TEntry>
        else { // [0: array shaped entry, 1..: ...tags]
          return this._putOneArray(entryOrEntriesWithTags as XWithTagsTuple<TEntry>) as any;
        }
      } // InputEntryWithTagsObject<TEntry>[]
      else if (Check.isObject(entryOrEntriesWithTags[0]) && !this.canContain(entryOrEntriesWithTags[0])) {
        return (entryOrEntriesWithTags as XWithTagsObject<TEntry>[])
          .map(this._putOneObject.bind(this)) as any;
      } // InputEntryWithTagsArray<TEntry>
      else {
        return this._putOneArray(entryOrEntriesWithTags as XWithTagsTuple<TEntry>) as any;
      }
    } // InputEntryWithTagsObject<TEntry>
    else {
      return this._putOneObject(entryOrEntriesWithTags as XWithTagsObject<TEntry>) as any;
    }
  }

  //#region Internal

  /** @internal */
  private _putOneObject(entryWithTags: XWithTagsObject<TEntry>): HashKey | None {
    if (entryWithTags.entry === undefined || entryWithTags.entry === null) {
      this.set((entryWithTags.tags || (entryWithTags as any).tag)!);
      return null;
    } else {
      return this.add(entryWithTags.entry, (entryWithTags.tags || (entryWithTags as any).tag)!);
    }
  }

  /** @internal */
  private _putOneArray(entryWithTags: XWithTagsTuple<TEntry>): HashKey | None {
    if (entryWithTags[0] === undefined || entryWithTags[0] === null) {
      this.set(entryWithTags.slice(1) as Tag[]);
      return null;
    } else {
      return this.add(entryWithTags[0] as TEntry, (
        Check.isArray(entryWithTags[1])
          ? entryWithTags[1]
          : entryWithTags.slice(1)
      ) as Tag[]);
    }
  }

  //#endregion

  //#endregion

  //#endregion

  //#region Update

  /**
   * Update an existing entry's tags to a new set.
   */
  update(entry: TEntry | HashKey, newTags: TagOrTags): void;

  /**
   * Update an existing entry's tags using a function.
   */
  update(entry: TEntry | HashKey, fn: (currentTags: Set<Tag>) => Set<Tag>): void;

  update(entry: TEntry | HashKey, tags: TagOrTags | ((currentTags: Set<Tag>) => Set<Tag>)): void {
    throw new NotImplementedError("update");
  }

  //#endregion

  //#region Remove

  //#region Remove Entries

  /**
   * Remove entries matching a query from the current dex while returning the results as well.
   */
  get take(): Queries.Full<TEntry, ResultType.Array, TEntry> {
    if (!this._take) {
      const toRemove = Queries.FullQueryConstructor<TEntry, ResultType.Array, TEntry>(
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

      this._take = proxy as Queries.Full<TEntry, ResultType.Array, TEntry>;
    }

    return this._take;
  }

  /**
   * Remove the matching entry from the dex.
   */
  remove(
    hashKey: HashKey,
    options?: {
      cleanEmptyTags?: boolean
    }
  ): void;

  /**
   * Used to remove matching entries from the dex.
   */
  remove(
    hashKeys: Iterable<HashKey>,
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
    hashKey: HashKey,
    forTag: Tag,
    options?: {
      leaveUntaggedEntries?: boolean,
      cleanEmptyTags?: boolean
    }
  ): void;

  /**
   * Used to unlink matching entries from the dex for a specific tag.
   */
  remove(
    hashKeys: Iterable<HashKey>,
    forTag: Tag,
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
    forTag: Tag,
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
    forTag: Tag,
    options?: {
      leaveUntaggedEntries?: boolean,
      cleanEmptyTags?: boolean
    }
  ): void;

  /**
   * Remove the matching entry from the dex for a specific subset of tags.
   */
  remove(
    hashKey: HashKey,
    forTags: Iterable<Tag>,
    options?: {
      leaveUntaggedEntries?: boolean,
      cleanEmptyTags?: boolean
    }
  ): void;

  /**
   * Used to unlink matching entries from the dex for a specific subset of tags.
   */
  remove(
    hashKeys: Iterable<HashKey>,
    forTags: Iterable<Tag>,
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
    forTags: Iterable<Tag>,
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
    forTags: Iterable<Tag>,
    options?: {
      leaveUntaggedEntries?: boolean,
      cleanEmptyTags?: boolean
    }
  ): void;

  /**
   * Used to remove entries from the dex.
   */
  remove(
    targets: Iterable<TEntry> | Iterable<HashKey> | HashKey | TEntry,
    optionsOrTags?: TagOrTags | {
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
      : (Check.isObject(optionsOrTags) && !Check.isArray(optionsOrTags))
        ? optionsOrTags
        : undefined;

    const tags: Iterable<Tag> | undefined = Check.isNonStringIterable(optionsOrTags)
      ? optionsOrTags as Iterable<Tag>
      : optionsOrTags !== undefined
        ? [optionsOrTags] as Iterable<Tag>
        : undefined;

    if (!config) {
      if (Check.isNonStringIterable(targets)) {
        for (const entryOrKey of targets) {
          const hash = this.hash(entryOrKey);
          this.untagEntry(hash, tags);
          if (!this._tagsByHash.get(hash)?.size) {
            this._removeTaglessEntry(hash);
          }
        }
      } else {
        const hash = this.hash(targets);
        this.untagEntry(hash, tags);
        if (!this._tagsByHash.get(hash)?.size) {
          this._removeTaglessEntry(hash);
        }
      }
    } else {
      if (Check.isNonStringIterable(targets)) {
        for (const entryOrKey of targets) {
          let tagsToCheck: Set<Tag> | undefined;
          const hash = this.hash(entryOrKey);
          if ((config as any)?.cleanEmptyTags) {
            tagsToCheck = this._tagsByHash.get(hash);
          }

          this.untagEntry(hash, tags);
          if (!(config as any)?.leaveUntaggedEntries && !this._tagsByHash.get(hash)?.size) {
            this._removeTaglessEntry(hash);
          }
          if (tagsToCheck) {
            for (const tag of tagsToCheck) {
              if (!this._hashesByTag.get(tag)?.size) {
                this._removeEmptyTag(tag);
              }
            }
          }
        }
      } else {
        let tagsToCheck: Set<Tag> | undefined;
        const hash = this.hash(targets);
        if ((config as any)?.cleanEmptyTags) {
          tagsToCheck = this._tagsByHash.get(hash);
        }

        this.untagEntry(hash, tags);
        if (!(config as any)?.leaveUntaggedEntries && !this._tagsByHash.get(hash)?.size) {
          this._removeTaglessEntry(hash);
        }
        if (tagsToCheck) {
          for (const tag of tagsToCheck) {
            if (!this._hashesByTag.get(tag)?.size) {
              this._removeEmptyTag(tag);
            }
          }
        }
      }
    }
  }

  //#region Internal

  /** @internal */
  private _removeTaglessEntry(key: HashKey) {
    this._entriesByHash.delete(key);
    this._allHashes.delete(key);
  }

  //#endregion

  //#endregion

  //#region Remove Tags

  /**
   * Remove all tags from one entry
   */
  untagEntry(entry: TEntry | HashKey): void;

  /**
   * Remove all the provided tags from one entry
   */
  untagEntry(entry: TEntry | HashKey, tagToRemove?: Tag): void;

  /**
   * Remove all the provided tags from one entry
   */
  untagEntry(entry: TEntry | HashKey, tagsToRemove?: Tags): void;

  /**
   * Remove all the provided tags from one entry
   */
  untagEntry(entry: TEntry | HashKey, ...tagsToRemove: Tag[]): void;

  /**
   * Remove all the provided tags from one entry
   */
  untagEntry(entry: TEntry | HashKey, tagsToRemove?: TagOrTags): void {
    const hash = this.hash(entry);
    const currentTagsForEntry = this._tagsByHash.get(hash);
    if (!tagsToRemove) {
      for (const tag of currentTagsForEntry ?? []) {
        const currentEntriesForTag = this._hashesByTag.get(tag);
        currentEntriesForTag?.delete(hash);
      }

      currentTagsForEntry?.clear();
    } else if (Check.isNonStringIterable(tagsToRemove)) {
      for (const tag of tagsToRemove) {
        const currentEntriesForTag = this._hashesByTag.get(tag);
        currentTagsForEntry?.delete(tag);
        currentEntriesForTag?.delete(hash);
      }
    } else if (Check.isTag(tagsToRemove)) {
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
  untagEntries(entries: Iterable<TEntry> | Iterable<HashKey>): void;

  /**
   * Remove all the provided tags from one entry
   */
  untagEntries(entries: Iterable<TEntry> | Iterable<HashKey>, tagToRemove?: Tag): void;

  /**
   * Remove all the provided tags from one entry
   */
  untagEntries(entries: Iterable<TEntry> | Iterable<HashKey>, tagsToRemove?: Tags): void;

  /**
   * Remove all the provided tags from one entry
   */
  untagEntries(entries: Iterable<TEntry> | Iterable<HashKey>, ...tagsToRemove: Tag[]): void;

  /**
   * Remove all the provided tags from one entry
   */
  untagEntries(entries: Iterable<TEntry> | Iterable<HashKey>, tagsToRemove?: TagOrTags): void {
    for (const entry of entries) {
      this.untagEntry(entry, tagsToRemove as any);
    }
  }

  /**
   * Remove all tags from the provided entry
   */
  untag(entry: TEntry | HashKey): void

  /**
   * Remove all tags from the provided entries
   */
  untag(entries: Iterable<TEntry> | Iterable<HashKey>): void

  /**
   * Remove the given tags from the provided entry
   */
  untag(entry: TEntry | HashKey, tagToRemove?: Tag): void

  /**
   * Remove the given tags from the provided entries
   */
  untag(entries: Iterable<TEntry> | Iterable<HashKey>, tagToRemove?: Tag): void

  /**
   * Remove the given tags from the provided entry
   */
  untag(entry: TEntry | HashKey, tagsToRemove?: TagOrTags): void

  /**
   * Remove the given tags from the provided entries
   */
  untag(entries: Iterable<TEntry> | Iterable<HashKey>, tagsToRemove?: TagOrTags): void

  /**
   * Remove the given tags from the provided entry
   */
  untag(entry: TEntry | HashKey, ...tagsToRemove: Tag[]): void

  /**
   * Remove the given tags from the provided entries
   */
  untag(entries: Iterable<TEntry> | Iterable<HashKey>, ...tagsToRemove: Tag[]): void

  untag(
    entries: Iterable<TEntry> | Iterable<HashKey> | TEntry | HashKey,
    tags?: TagOrTags
  ): void {
    if (Check.isNonStringIterable(entries)) {
      this.untagEntries(entries as Iterable<TEntry> | Iterable<HashKey>, tags as Tags);
    } else {
      this.untagEntry(entries, tags as Tag | undefined);
    }
  }

  /**
   * Used to remove a whole tag from the dex
   */
  drop(
    tag: Tag,
    options?: {
      leaveEmptyTags?: boolean,
      cleanUntaggedEntries?: boolean
    }
  ): void;

  drop(
    tags: TagOrTags,
    options?: {
      leaveEmptyTags?: boolean,
      cleanUntaggedEntries?: boolean
    }
  ): void {
    if (!options?.cleanUntaggedEntries) {
      if (Check.isNonStringIterable(tags)) {
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
      if (Check.isNonStringIterable(tags)) {
        for (const tag of tags) {
          const hashesForTag = this._hashesByTag.get(tag);
          this.resetTag(tag);
          if (!options?.leaveEmptyTags) {
            this._removeEmptyTag(tag);
          }

          for (const hash of hashesForTag ?? []) {
            if (!this._tagsByHash.get(hash)?.size) {
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
          if (!this._tagsByHash.get(hash)?.size) {
            this._removeTaglessEntry(hash);
          }
        }
      }
    }
  }

  /**
   * Clear all entries from a given tag without removing anything by default.
   */
  resetTag(
    tag: Tag,
    options?: {
      cleanUntaggedEntries?: boolean,
      cleanEmptyTags?: boolean
    }
  ): void;

  /**
   * Clear all entries from a given set of tags.
   */
  resetTag(
    tags: TagOrTags,
    options?: {
      cleanUntaggedEntries?: boolean,
      cleanEmptyTags?: boolean
    }
  ): void;

  resetTag(
    tags: TagOrTags,
    options?: {
      cleanUntaggedEntries?: boolean,
      cleanEmptyTags?: boolean
    }
  ): void {
    const tagsToReset = (Check.isNonStringIterable(tags)
      ? tags
      : [tags]) as Iterable<Tag>;

    for (const tag of tagsToReset) {
      for (const hash of this._hashesByTag.get(tag) ?? []) {
        const tagsForHash = this._tagsByHash.get(hash);
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

  //#region Internal

  /** @internal */
  private _removeEmptyTag(tag: Tag) {
    this._hashesByTag.delete(tag);
    this._allTags.delete(tag);
  }

  //#endregion

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
      for (const [k, t] of this._tagsByHash) {
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
    this._tagsByHash.clear();
  }

  //#endregion

  //#endregion

  //#endregion

  //#region Utility

  /**
   * Check if an item is a valid entry for this dex.
   */
  canContain(value: Entry): value is TEntry {
    return this._guards.entry(value);
  }

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

//#region Other Utilities

/**
 * Default entry hashing method.
 */
export const hash: IHasher = Dex.Defaults.getHashFunction();

//#endregion