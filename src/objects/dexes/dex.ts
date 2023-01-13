import Check from "../../utilities/validators";
import IUnique from "../unique";
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
} from "../subsets/entries";
import {
  Tag,
  TagOrTags,
  toSet,
  Tags
} from "../subsets/tags";
import {
  HashKey
} from "../subsets/hashes";
import {
  CopierConstructor,
  Copier,
} from '../helpers/copy';
import Queries from "../queries/queries";
import { NO_RESULT, ResultType } from "../queries/results";
import { ReadOnlyDex } from "./readonly";
import { DexError, NotImplementedError } from "../errors";
import Loop from "../../utilities/iteration";
import {InternalRDexSymbols} from "./readonly"

//#region Symbols

// TODO: when TS implements stage 3: replace with use of @hideInProxy
/** @internal */
export namespace InternalDexSymbols {
  export const _putOneObject: unique symbol = Symbol("_putOneObject");
  export const _putOneArray: unique symbol = Symbol("_putOneArray");
  export const _initOptions: unique symbol = Symbol("_initOptions");
  export const _setEntriesForExistingTag: unique symbol = Symbol("_setEntriesForExistingTag");
  export const _addNewTag: unique symbol = Symbol("_addNewTag");
  export const _addNewEntry: unique symbol = Symbol("_addNewEntry");
  export const _addTagToEntry: unique symbol = Symbol("_addTagToEntry");
  export const _removeEntry: unique symbol = Symbol("_removeEntry");
  export const _untagEntry: unique symbol = Symbol("_untagEntry");
  export const _removeTagFromEntry: unique symbol = Symbol("_removeTagFromEntry");
  export const _removeTag: unique symbol = Symbol("_removeTag");
}

  // TODO: when TS implements stage 3: replace with use of @hideInProxy
/** @internal */
export const DexMethodKeysToHideInProxy = Object.freeze([
  "set",
  "put",
  "add",
  "update",
  "take",
  "remove",
  "untag",
  "drop",
  "reset",
  "clean",
  "clear"
]);

//#endregion

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
export default class Dex<TEntry extends Entry = Entry> extends ReadOnlyDex<TEntry> {
  // lazy
  // - queries
  #take?: Queries.Full<TEntry, ResultType.Array, TEntry>;
  // - helpers
  #copier?: Copier<TEntry>;

  // config
  #guards: {
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
      (optionsOrMoreValues as any)?.hasher
    );

    // copy existing:
    if (values instanceof ReadOnlyDex) {
      this.#guards = values.#guards;
      if (Check.isConfig<TEntry>(optionsOrMoreValues)) {
        this[InternalDexSymbols._initOptions](optionsOrMoreValues);
      }

      return;
    } else {
      // init config
      let config: Config<TEntry> | undefined = undefined;

      if (Check.isConfig<TEntry>(optionsOrMoreValues)) {
        config = optionsOrMoreValues;
        this[InternalDexSymbols._initOptions](optionsOrMoreValues);
      } else if (Check.isConfig<TEntry>(values)) {
        this[InternalDexSymbols._initOptions](values);
        config = values;
        values = optionsOrMoreValues as any;
      } else {
        this[InternalDexSymbols._initOptions]();
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
  // TODO: when TS implements stage 3: @hideInProxy
  protected [InternalDexSymbols._initOptions](config?: Config<TEntry>) {
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

    this.#guards = guards;
  }

  //#endregion

  //#endregion

  //#region Properties

  get config(): Config<TEntry> {
    return {
      arrayGuard: this.#guards.array,
      entryGuard: this.#guards.entry,
      objectGuard: this.#guards.object,
      hasher: this._hasher
    };
  }

  // TODO: when TS implements stage 3: @replaceInProxy({ $key: "_getSimpleCopier" })
  get copy(): Copier<TEntry> {
    return this.#copier
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

  // TODO: when TS implements stage 3: @hideInProxy
  set(
    tags: TagOrTags,
    entries?: Iterable<TEntry> | [] | None
  ): HashKey[] {
    let effectedHashes: HashKey[] = [];
    tags = toSet(tags);

    // undefined means nothing gets touched
    if (entries === undefined) {
      (tags as Set<Tag>).forEach(tag => {
        if (!this.has(tag)) {
          this[InternalDexSymbols._addNewTag](tag);
        }
      });
      return [];
    } else {
      // NoEntries or [] is passed in, set to empty:
      if (!entries || (entries instanceof Set ? !entries.size : !Loop.count(entries))) {
        for (const tag of tags) {
          if (this.has(tag)) {
            effectedHashes = this[InternalDexSymbols._setEntriesForExistingTag](tag, []).effected;
          } else {
            this[InternalDexSymbols._addNewTag](tag);
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
          if (this.has(tag)) {
            effectedHashes = this[InternalDexSymbols._setEntriesForExistingTag](tag, hashesToSet).effected;
          } else {
            this[InternalDexSymbols._addNewTag](tag, hashesToSet);
          }
        }

        return effectedHashes;
      }
    }
  }

  //#region Internal

  /** @internal */
  // TODO: when TS implements stage 3: @hideInProxy
  protected [InternalDexSymbols._setEntriesForExistingTag](tag: Tag, hashesToSet: Set<HashKey> | [], beforeSetCallback?: (effected: { added?: HashKey[], removed?: HashKey[], effected: HashKey[] }) => void): { added?: HashKey[], removed?: HashKey[], effected: HashKey[] } {
    const currentSet = this[InternalRDexSymbols._hashesByTag].get(tag)!;
    let hashesToRemove: HashKey[] = [];

    if (Check.isArray(hashesToSet)) {
      hashesToRemove = [...currentSet];

      const effected = {
        removed: hashesToRemove,
        added: [],
        effected: hashesToRemove
      };

      beforeSetCallback?.(effected);

      hashesToRemove.forEach(hash =>
        this[InternalRDexSymbols._tagsByHash].get(hash)?.delete(tag));
      this[InternalRDexSymbols._hashesByTag].get(tag)?.clear();

      return effected;
    } else {
      hashesToRemove = [];
      currentSet.forEach(hash => {
        if (!hashesToSet.has(hash)) {
          hashesToRemove.push(hash);
          this[InternalRDexSymbols._tagsByHash].get(hash)?.delete(tag)
        }
      });

      const addedHashes = [...hashesToSet]
        .filter(h => !currentSet.has(h));

      const effected = {
        removed: hashesToRemove,
        added: addedHashes,
        effected: hashesToRemove.concat(addedHashes)
      };

      beforeSetCallback?.(effected);

      this[InternalRDexSymbols._hashesByTag].set(tag, hashesToSet);

      return effected;
    }
  }

  /** @internal */
  // TODO: when TS implements stage 3: @hideInProxy
  protected [InternalDexSymbols._addNewTag](tag: Tag, hashesToSet = new Set<HashKey>()): void {
    this[InternalRDexSymbols._allTags].add(tag);
    this[InternalRDexSymbols._hashesByTag].set(tag, hashesToSet);
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
  // TODO: when TS implements stage 3: @hideInProxy
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
            .map(this[InternalDexSymbols._putOneArray].bind(this)) as any;
        }
      } // InputEntryWithTagsObject<TEntry>[]
      else if (Check.isObject(entry[0]) && !this.canContain(entry[0])) {
        return (entry as XWithTagsObject<TEntry>[])
          .map(this[InternalDexSymbols._putOneObject].bind(this)) as any;
      }
    } // InputEntryWithTagsObject<TEntry>
    else if (Check.isObject(entry) && !this.canContain(entry)) {
      if (tags) {
        this.put([entry, tags] as XWithTagsObject<TEntry>[])
      }
      return this[InternalDexSymbols._putOneObject](entry as XWithTagsObject<TEntry>);
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
      if (!this.contains(hash)) {
        this[InternalDexSymbols._addNewEntry](<TEntry>entry, hash);
      }

      return hash;
    } // if we have tags howerver~
    else {
      // set the entries by tag.
      (tags as Set<Tag>).forEach(tag => {
        // set the tag
        if (!this.has(tag)) {
          this[InternalDexSymbols._addNewTag](tag);
        }

        // set the hash key
        if (!this.contains(hash)) {
          this[InternalDexSymbols._addNewEntry](<TEntry>entry, hash);
        }

        this[InternalDexSymbols._addTagToEntry](tag, hash);
      });

      return hash;
    }
  }

  //#region Internal

  /** @internal */
  // TODO: when TS implements stage 3: @hideInProxy
  protected [InternalDexSymbols._addNewEntry](entry: TEntry, key: HashKey) {
    this[InternalRDexSymbols._allHashes].add(key);
    this[InternalRDexSymbols._entriesByHash].set(key, entry);
    this[InternalRDexSymbols._tagsByHash].set(key, new Set<HashKey>());
  }

  /** @internal */
  // TODO: when TS implements stage 3: @hideInProxy
  protected [InternalDexSymbols._addTagToEntry](tag: Tag, key: HashKey) {
    this[InternalRDexSymbols._tagsByHash].get(key)?.add(tag);
    this[InternalRDexSymbols._hashesByTag].get(tag)?.add(key);
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

  // TODO: when TS implements stage 3: @hideInProxy
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
            .map(this[InternalDexSymbols._putOneArray].bind(this)) as any;
        } // InputEntryWithTagsArray<TEntry>
        else { // [0: array shaped entry, 1..: ...tags]
          return this[InternalDexSymbols._putOneArray](entryOrEntriesWithTags as XWithTagsTuple<TEntry>) as any;
        }
      } // InputEntryWithTagsObject<TEntry>[]
      else if (Check.isObject(entryOrEntriesWithTags[0]) && !this.canContain(entryOrEntriesWithTags[0])) {
        return (entryOrEntriesWithTags as XWithTagsObject<TEntry>[])
          .map(this[InternalDexSymbols._putOneObject].bind(this)) as any;
      } // InputEntryWithTagsArray<TEntry>
      else {
        return this[InternalDexSymbols._putOneArray](entryOrEntriesWithTags as XWithTagsTuple<TEntry>) as any;
      }
    } // InputEntryWithTagsObject<TEntry>
    else {
      return this[InternalDexSymbols._putOneObject](entryOrEntriesWithTags as XWithTagsObject<TEntry>) as any;
    }
  }

  //#region Internal

  /** @internal */
  // TODO: when TS implements stage 3: @hideInProxy
  private [InternalDexSymbols._putOneObject](entryWithTags: XWithTagsObject<TEntry>): HashKey | None {
    if (entryWithTags.entry === undefined || entryWithTags.entry === null) {
      this.set((entryWithTags.tags || (entryWithTags as any).tag)!);
      return null;
    } else {
      return this.add(entryWithTags.entry, (entryWithTags.tags || (entryWithTags as any).tag)!);
    }
  }

  /** @internal */
  // TODO: when TS implements stage 3: @hideInProxy
  private [InternalDexSymbols._putOneArray](entryWithTags: XWithTagsTuple<TEntry>): HashKey | None {
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

  // TODO: when TS implements stage 3: @hideInProxy
  update(entry: TEntry | HashKey, tags: TagOrTags | ((currentTags: Set<Tag>) => Set<Tag>)): void {
    throw new NotImplementedError("update");
  }

  //#endregion

  //#region Remove

  //#region Remove Entries

  /**
   * Remove entries matching a query from the current dex while returning the results as well.
   */
  // TODO: when TS implements stage 3: @hideInProxy
  get take(): Queries.Full<TEntry, ResultType.Array, TEntry> {
    if (!this.#take) {
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

      this.#take = proxy as Queries.Full<TEntry, ResultType.Array, TEntry>;
    }

    return this.#take;
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
  // TODO: when TS implements stage 3: @hideInProxy
  remove(
    targets: Iterable<TEntry | HashKey> | HashKey | TEntry,
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
          this[InternalDexSymbols._untagEntry](hash, tags);
          if (!this[InternalRDexSymbols._tagsByHash].get(hash)?.size) {
            this[InternalDexSymbols._removeEntry](hash);
          }
        }
      } else {
        const hash = this.hash(targets);
        this[InternalDexSymbols._untagEntry](hash, tags);
        if (!this[InternalRDexSymbols._tagsByHash].get(hash)?.size) {
          this[InternalDexSymbols._removeEntry](hash);
        }
      }
    } else {
      if (Check.isNonStringIterable(targets)) {
        for (const entryOrKey of targets) {
          let tagsToCheck: Set<Tag> | undefined;
          const hash = this.hash(entryOrKey);
          if ((config as any)?.cleanEmptyTags) {
            tagsToCheck = this[InternalRDexSymbols._tagsByHash].get(hash);
          }

          this[InternalDexSymbols._untagEntry](hash, tags);
          if (!(config as any)?.leaveUntaggedEntries && !this[InternalRDexSymbols._tagsByHash].get(hash)?.size) {
            this[InternalDexSymbols._removeEntry](hash);
          }
          if (tagsToCheck) {
            for (const tag of tagsToCheck) {
              if (!this[InternalRDexSymbols._hashesByTag].get(tag)?.size) {
                this[InternalDexSymbols._removeTag](tag);
              }
            }
          }
        }
      } else {
        let tagsToCheck: Set<Tag> | undefined;
        const hash = this.hash(targets);
        if ((config as any)?.cleanEmptyTags) {
          tagsToCheck = this[InternalRDexSymbols._tagsByHash].get(hash);
        }

        this[InternalDexSymbols._untagEntry](hash, tags);
        if (!(config as any)?.leaveUntaggedEntries && !this[InternalRDexSymbols._tagsByHash].get(hash)?.size) {
          this[InternalDexSymbols._removeEntry](hash);
        }
        if (tagsToCheck) {
          for (const tag of tagsToCheck) {
            if (!this[InternalRDexSymbols._hashesByTag].get(tag)?.size) {
              this[InternalDexSymbols._removeTag](tag);
            }
          }
        }
      }
    }
  }

  //#region Internal

  /** @internal */
  // TODO: when TS implements stage 3: @hideInProxy
  protected [InternalDexSymbols._removeEntry](key: HashKey) {
    this[InternalRDexSymbols._entriesByHash].delete(key);
    this[InternalRDexSymbols._allHashes].delete(key);
  }

  //#endregion

  //#endregion

  //#region Remove Tags

  /**
   * Remove all tags from the provided entry
   */
  untag(entry: TEntry | HashKey): void

  /**
   * Remove all tags from the provided entries
   */
  untag(entries: Iterable<TEntry | HashKey>): void

  /**
   * Remove the given tags from the provided entry
   */
  untag(entry: TEntry | HashKey, tagToRemove?: Tag): void

  /**
   * Remove the given tags from the provided entries
   */
  untag(entries: Iterable<TEntry | HashKey>, tagToRemove?: Tag): void

  /**
   * Remove the given tags from the provided entry
   */
  untag(entry: TEntry | HashKey, tagsToRemove?: TagOrTags): void

  /**
   * Remove the given tags from the provided entries
   */
  untag(entries: Iterable<TEntry | HashKey>, tagsToRemove?: TagOrTags): void

  /**
   * Remove the given tags from the provided entry
   */
  untag(entry: TEntry | HashKey, ...tagsToRemove: Tag[]): void

  /**
   * Remove the given tags from the provided entry
   */
  untag(entries: Iterable<TEntry | HashKey>, ...tagsToRemove: Tag[]): void

  /**
   * Remove the given tags from the provided entries
   */
  untag(entries: Iterable<TEntry | HashKey>, ...tagsToRemove: Tag[]): void

  /**
   * Remove the given tags or all tags from the provided entry
   */
  // TODO: when TS implements stage 3: @hideInProxy
  untag(
    entries: Iterable<TEntry | HashKey> | TEntry | HashKey,
    tags?: TagOrTags
  ): void {
    if (Check.isNonStringIterable(entries)) {
      for (const entry of entries) {
        this[InternalDexSymbols._untagEntry](this.hash(entry), tags as Tags);
      }
    } else {
      this[InternalDexSymbols._untagEntry](this.hash(entries), tags as Tag | undefined);
    }
  }

  //#region Internal

  /** @internal */
  // TODO: when TS implements stage 3: @hideInProxy
  protected [InternalDexSymbols._untagEntry](entry: HashKey, tagsToRemove?: TagOrTags): void {
    const hash = this.hash(entry);
    const currentTagsForEntry = this[InternalRDexSymbols._tagsByHash].get(hash);
    if (!tagsToRemove) {
      for (const tag of currentTagsForEntry ?? []) {
        const currentEntriesForTag = this[InternalRDexSymbols._hashesByTag].get(tag);
        currentEntriesForTag?.delete(hash);
      }

      currentTagsForEntry?.clear();
    } else if (Check.isNonStringIterable(tagsToRemove)) {
      for (const tag of tagsToRemove) {
        const currentEntriesForTag = this[InternalRDexSymbols._hashesByTag].get(tag);
        currentTagsForEntry?.delete(tag);
        currentEntriesForTag?.delete(hash);
      }
    } else if (Check.isTag(tagsToRemove)) {
      if (currentTagsForEntry) {
        currentTagsForEntry.delete(tagsToRemove);
      }
      const currentEntriesForTag = this[InternalRDexSymbols._hashesByTag].get(tagsToRemove);
      currentEntriesForTag?.delete(hash);
    }
  }

  /** @internal */
  // TODO: when TS implements stage 3: @hideInProxy
  protected [InternalDexSymbols._removeTagFromEntry](tag: Tag, key: HashKey) {
    this[InternalRDexSymbols._tagsByHash].get(key)?.delete(tag);
    this[InternalRDexSymbols._hashesByTag].get(tag)?.delete(key);
  }

  //#endregion

  //#region Drop Tags

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

  // TODO: when TS implements stage 3: @hideInProxy
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
          this.reset(tag);
          if (!options?.leaveEmptyTags) {
            this[InternalDexSymbols._removeTag](tag);
          }
        }
      } else {
        this.reset(tags);
        if (!options?.leaveEmptyTags) {
          this[InternalDexSymbols._removeTag](tags);
        }
      }
    } else {
      if (Check.isNonStringIterable(tags)) {
        for (const tag of tags) {
          const hashesForTag = this[InternalRDexSymbols._hashesByTag].get(tag);
          this.reset(tag);
          if (!options?.leaveEmptyTags) {
            this[InternalDexSymbols._removeTag](tag);
          }

          for (const hash of hashesForTag ?? []) {
            if (!this[InternalRDexSymbols._tagsByHash].get(hash)?.size) {
              this[InternalDexSymbols._removeEntry](hash);
            }
          }
        }
      } else {
        const hashesForTag = this[InternalRDexSymbols._hashesByTag].get(tags);
        this.reset(tags);
        if (!options?.leaveEmptyTags) {
          this[InternalDexSymbols._removeTag](tags);
        }
        for (const hash of hashesForTag ?? []) {
          if (!this[InternalRDexSymbols._tagsByHash].get(hash)?.size) {
            this[InternalDexSymbols._removeEntry](hash);
          }
        }
      }
    }
  }

  //#region Internal

  /** @internal */
  // TODO: when TS implements stage 3: @hideInProxy
  protected [InternalDexSymbols._removeTag](tag: Tag) {
    this[InternalRDexSymbols._hashesByTag].delete(tag);
    this[InternalRDexSymbols._allTags].delete(tag);
  }

  //#endregion

  //#endregion

  //#region Reset Tags

  /**
   * Clear all entries from a given tag without removing anything by default.
   */
  reset(
    tag: Tag,
    options?: {
      cleanUntaggedEntries?: boolean,
      cleanEmptyTags?: boolean
    }
  ): void;

  /**
   * Clear all entries from a given set of tags.
   */
  reset(
    tags: TagOrTags,
    options?: {
      cleanUntaggedEntries?: boolean,
      cleanEmptyTags?: boolean
    }
  ): void;

  // TODO: when TS implements stage 3: @hideInProxy
  reset(
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
      for (const hash of this[InternalRDexSymbols._hashesByTag].get(tag) ?? []) {
        const tagsForHash = this[InternalRDexSymbols._tagsByHash].get(hash);
        this[InternalDexSymbols._removeTagFromEntry](tag, hash);
        if (!tagsForHash!.size && options?.cleanUntaggedEntries) {
          this[InternalDexSymbols._removeEntry](hash);
        }
      }

      if (options?.cleanEmptyTags) {
        this[InternalDexSymbols._removeTag](tag);
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

  // TODO: when TS implements stage 3: @hideInProxy
  clean(options: {
    taglessEntries?: boolean,
    emptyTags?: boolean
  } = {
      taglessEntries: true,
      emptyTags: true
    }): void {
    if (options.taglessEntries) {
      for (const [k, t] of this[InternalRDexSymbols._tagsByHash]) {
        if (!t.size) {
          this[InternalDexSymbols._removeEntry](k);
        }
      }
    }

    if (options.emptyTags) {
      for (const [t, k] of this[InternalRDexSymbols._hashesByTag]) {
        if (!k.size) {
          this[InternalDexSymbols._removeTag](t);
        }
      }
    }
  }

  /**
   * Drop all tags and entries at once, clearing the whole dex of all data.
   */
  clear(): void;

  // TODO: when TS implements stage 3: @hideInProxy
  clear(): void {
    this[InternalRDexSymbols._allTags].clear();
    this[InternalRDexSymbols._allHashes].clear();
    this[InternalRDexSymbols._entriesByHash].clear();
    this[InternalRDexSymbols._hashesByTag].clear();
    this[InternalRDexSymbols._tagsByHash].clear();
  }

  //#endregion

  //#endregion

  //#endregion

  //#region Utility

  /**
   * Check if an item is a valid entry for this dex.
   */
  canContain(value: Entry): value is TEntry {
    return this.#guards.entry(value);
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