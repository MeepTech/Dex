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
import { NoEntryFound, NO_RESULT, ResultType } from "../queries/results";
import { ReadableDex } from "./read";
import { DexError, NotImplementedError } from "../errors";
import Loop from "../../utilities/iteration";
import { InternalRDexSymbols } from "./read"
import IWriteableDex, { DexModifierFunctionConstructor, EntryAdder, EntryRemover, TagDropper, Tagger, TagResetter, TagSetter, Untagger } from "./write";

//#region Symbols

// TODO: when TS implements stage 3: replace with use of @hideInProxy
/** @internal */
export namespace InternalDexSymbols {
  export const _importOneObject: unique symbol = Symbol("_importOneObject");
  export const _importOneArray: unique symbol = Symbol("_importOneArray");
  export const _initOptions: unique symbol = Symbol("_initOptions");
  export const _setEntriesForExistingTag: unique symbol = Symbol("_setEntriesForExistingTag");
  export const _addNewTag: unique symbol = Symbol("_addNewTag");
  export const _addNewEntry: unique symbol = Symbol("_addNewEntry");
  export const _addTagToEntry: unique symbol = Symbol("_addTagToEntry");
  export const _removeEntry: unique symbol = Symbol("_removeEntry");
  export const _untagEntry: unique symbol = Symbol("_untagEntry");
  export const _removeTagFromEntry: unique symbol = Symbol("_removeTagFromEntry");
  export const _removeTag: unique symbol = Symbol("_removeTag");
  export const _resetTags: unique symbol = Symbol("_resetTags");
  export const _resetTag: unique symbol = Symbol("_resetTag");
}

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
export default class Dex<TEntry extends Entry = Entry> extends ReadableDex<TEntry> implements IWriteableDex<TEntry> {
  // lazy
  // - queries
  #take?: Queries.Full<TEntry, ResultType.Array, TEntry>;
  // - modifiers
  #tagSetter?: TagSetter<TEntry>;
  #tagResetter?: TagResetter;
  #tagDropper?: TagDropper;
  #entryAdder?: EntryAdder<TEntry>;
  #entryRemover?: EntryRemover<TEntry>;
  #tagger?: Tagger<TEntry>;
  #untagger?: Untagger<TEntry>;
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
    let valuesIsConfig = Check.isConfig(values)
    super(
      values as any,
      valuesIsConfig ? (values as any).hasher : (optionsOrMoreValues as any)?.hasher
    );

    // copy existing:
    if (values instanceof ReadableDex) {
      this.#guards = values.#guards;
      if (Check.isConfig<TEntry>(optionsOrMoreValues)) {
        this[InternalDexSymbols._initOptions](optionsOrMoreValues);
      }

      return;
    } else {
      // init config
      let config: Config<TEntry> | undefined = undefined;

      if (valuesIsConfig) {
        this[InternalDexSymbols._initOptions]((values as any));
        config = (values as any);
        values = optionsOrMoreValues as any;
      } else if (Check.isConfig<TEntry>(optionsOrMoreValues)) {
        config = optionsOrMoreValues;
        this[InternalDexSymbols._initOptions](optionsOrMoreValues);
      } else {
        this[InternalDexSymbols._initOptions]();
      }

      if (!values) {
        return;
      }

      // if it's a map of values
      if (values instanceof Map) {
        values.forEach((tags, e) =>
          (e === NONE_FOR_TAG
            || e === NO_RESULT)
            ? Check.isNonStringIterable(tags) ? this.set.each(tags) : this.set(tags)
            : this.add(e, tags)
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

              this.import(values as XWithTags<TEntry>[])

              return;
            }
          }
        } // single object
        else if (Check.isObject(values)) {
          if (!config && optionsOrMoreValues) {
            this.import([values, optionsOrMoreValues] as XWithTagsObject<TEntry>[]);
            return;
          } else {
            this.import(values as XWithTagsObject<TEntry>);
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

  get set(): TagSetter<TEntry> {
    return this.#tagSetter ??= DexModifierFunctionConstructor<
      TEntry,
      [tag: Tag],
      TEntry | HashKey,
      number,
      [entries: [] | Iterable<TEntry | HashKey>] | []
    >(
      this,
      ((
        tag: Tag,
        entries?: Iterable<TEntry | HashKey> | []
      ): number => {
        // undefined means nothing gets touched
        if (entries === undefined) {
          if (!this.has(tag)) {
            this[InternalDexSymbols._addNewTag](tag);
          }
        } else {
          // None(null) or [] is passed in, set to empty:
          if (!entries || !Loop.count(entries)) {
            if (this.has(tag)) {
              this[InternalDexSymbols._setEntriesForExistingTag](tag, []);
            } else {
              this[InternalDexSymbols._addNewTag](tag);
            }

          } // set entries provided
          else {
            const hashesToSet: Set<HashKey> = new Set<HashKey>();
            const newEntries = new Map<HashKey, TEntry>();
            for (const entry of entries) {
              const hash = this.hash(entry);
              if (!this.has(hash) && this.canContain(entry)) {
                newEntries.set(hash, entry);
              }

              hashesToSet.add(hash);
            }

            for (const [h, e] of newEntries) {
              this[InternalDexSymbols._addNewEntry](e, h);
            }

            if (this.has(tag)) {
              this[InternalDexSymbols._setEntriesForExistingTag](tag, hashesToSet);
            } else {
              this[InternalDexSymbols._addNewTag](tag, hashesToSet);
            }
          }
        }

        return this.hashes(tag).size;
      }).bind(this)) as TagSetter<TEntry>;
  }

  //#region Internal

  /** @internal */
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
  protected [InternalDexSymbols._addNewTag](tag: Tag, hashesToSet = new Set<HashKey>()): void {
    this[InternalRDexSymbols._allTags].add(tag);
    this[InternalRDexSymbols._hashesByTag].set(tag, hashesToSet);
  }

  //#endregion

  //#endregion

  //#region Add Entries

  get add(): EntryAdder<TEntry> {
    return this.#entryAdder ??= DexModifierFunctionConstructor<
      TEntry,
      [entry: TEntry | HashKey],
      Tag,
      { hashKey: HashKey | None, tagCount: number, isNew: boolean },
      [Iterable<Tag>] | []
    >(
      this,
      (
        entry: TEntry | HashKey,
        tags?: Iterable<Tag> | Tag,
        ...moreTags: Tag[]
      ): { hashKey: HashKey | None, tagCount: number, isNew: boolean } => {
        let tagArray: Tag[];
        if (!Check.isNonStringIterable(tags)) {
          if (moreTags.length) {
            tagArray = [tags as Tag, ...moreTags];
          } else {
            tagArray = [tags as Tag];
          }
        } else {
          if (moreTags.length) {
            tagArray = [...tags as Iterable<Tag>, ...moreTags];
          } else {
            tagArray = [...tags as Iterable<Tag>]
          }
        }

        let isNew: boolean;
        const hash = this.hash(entry);
        if (!this.has(hash) && this.canContain(entry)) {
          isNew = true;
          this[InternalDexSymbols._addNewEntry](entry, hash);
        } else {
          isNew = false;
        }

        tagArray.forEach(tag =>
          this[InternalDexSymbols._addTagToEntry](tag, hash));

        return { isNew, hashKey: hash, tagCount: this.tags(hash).size };
      }
    ) as EntryAdder<TEntry>;
  }

  //#region Internal

  /** @internal */
  protected [InternalDexSymbols._addNewEntry](entry: TEntry, key: HashKey) {
    this[InternalRDexSymbols._allHashes].add(key);
    this[InternalRDexSymbols._entriesByHash].set(key, entry);
    this[InternalRDexSymbols._tagsByHash].set(key, new Set<HashKey>());
  }

  /** @internal */
  protected [InternalDexSymbols._addTagToEntry](tag: Tag, key: HashKey) {
    this[InternalRDexSymbols._tagsByHash].get(key)?.add(tag);
    this[InternalRDexSymbols._hashesByTag].get(tag)?.add(key);
  }

  //#endregion

  //#endregion

  //#region Add Tags

  get tag(): Tagger<TEntry> {
    return this.#tagger ??= (DexModifierFunctionConstructor<
      TEntry,
      [entry: TEntry | HashKey],
      Tag,
      number,
      [...tags: Tag[]]
      | [tags: Iterable<Tag>]
      | [tag: Tag]
      | []
    >(
      this,
      (entry: TEntry | HashKey, tags: Iterable<Tag>) => {
        if (this.contains(entry)) {
          this.add(entry, tags);
          return this.tags(entry).size;
        }

        return 0;
      }
    ) as Tagger<TEntry>);
  }

  //#endregion

  //#region Import Entries with their tags.

  /**
   * Add data about entries to the dex.
   *
   * @returns The uniqueid/hash of the items added to the dex
   */
  import(
    entryWithTags: XWithTags<TEntry>[],
  ): HashKey[];

  /**
   * Add data about an entry to the dex.
   *
   * @returns The uniqueid/hash of the item added to the dex
   */
  import(
    ...entriesWithTags: XWithTags<TEntry>[]
  ): HashKey[];

  /**
   * Add data about an entry to the dex.
   *
   * @returns The uniqueid/hash of the item added to the dex
   */
  import(
    entryWithTags: XWithTags<TEntry>
  ): HashKey | None;

  /**
   * Add data about entries to the dex.
   *
   * @returns The uniqueid/hash of the items added to the dex
   */
  import(
    entriesWithTags: (XWithTagsObject<TEntry> | XWithTagsTuple<TEntry>)[],
  ): HashKey[];

  /**
   * Add data about an entry to the dex.
   *
   * @returns The uniqueid/hash of the item added to the dex
   */
  import(
    ...entriesWithTags: (XWithTagsObject<TEntry> | XWithTagsTuple<TEntry>)[]
  ): HashKey[];

  /**
   * Add data about an entry to the dex.
   *
   * @returns The uniqueid/hash of the item added to the dex
   */
  import(
    entryWithTags: (XWithTagsObject<TEntry> | XWithTagsTuple<TEntry>)
  ): HashKey | None;

  import<TInput extends XWithTags<TEntry>[] | XWithTags<TEntry>[] | [XWithTags<TEntry>[]] | [XWithTags<TEntry>[]]>(
    ...entryOrEntriesWithTags: TInput
  ): TInput extends XWithTags<TEntry>[] ? (HashKey | None)[] : (HashKey | None) {
    // InputEntryWithTags<TEntry>[] | InputEntryWithTagsArray<TEntry>
    if (Check.isArray(entryOrEntriesWithTags)) {
      // InputEntryWithTagsArray<TEntry>[] | InputEntryWithTagsArray<TEntry>
      if (Check.isArray(entryOrEntriesWithTags[0])) {
        // InputEntryWithTagsArray<TEntry>[]
        if (!this.canContain(entryOrEntriesWithTags[0])) { // [0: [0: entry, ...tags], 1: [entry, ...tags]]
          return (entryOrEntriesWithTags as XWithTagsTuple<TEntry>[])
            .map(this[InternalDexSymbols._importOneArray].bind(this)) as any;
        } // InputEntryWithTagsArray<TEntry>
        else { // [0: array shaped entry, 1..: ...tags]
          return this[InternalDexSymbols._importOneArray](entryOrEntriesWithTags as XWithTagsTuple<TEntry>) as any;
        }
      } // InputEntryWithTagsObject<TEntry>[]
      else if (Check.isObject(entryOrEntriesWithTags[0]) && !this.canContain(entryOrEntriesWithTags[0])) {
        return (entryOrEntriesWithTags as XWithTagsObject<TEntry>[])
          .map(this[InternalDexSymbols._importOneObject].bind(this)) as any;
      } // InputEntryWithTagsArray<TEntry>
      else {
        return this[InternalDexSymbols._importOneArray](entryOrEntriesWithTags as XWithTagsTuple<TEntry>) as any;
      }
    } // InputEntryWithTagsObject<TEntry>
    else {
      return this[InternalDexSymbols._importOneObject](entryOrEntriesWithTags as XWithTagsObject<TEntry>) as any;
    }
  }

  //#region Internal

  /** @internal */
  private [InternalDexSymbols._importOneObject](entryWithTags: XWithTagsObject<TEntry>): HashKey | None {
    if (entryWithTags.entry === undefined || entryWithTags.entry === null) {
      if (Check.isNonStringIterable(entryWithTags.tags)) {
        for (const tag of entryWithTags.tags) {
          this[InternalDexSymbols._addNewTag](tag);
        }
      } else {
        this[InternalDexSymbols._addNewTag]((entryWithTags.tags || (entryWithTags as any).tag)!);
      }
      return null;
    } else {
      return this.add(entryWithTags.entry, (entryWithTags.tags || (entryWithTags as any).tag)!).hashKey;
    }
  }

  /** @internal */
  private [InternalDexSymbols._importOneArray](entryWithTags: XWithTagsTuple<TEntry>): HashKey | None {
    if (entryWithTags[0] === undefined || entryWithTags[0] === null) {
      this.set.each(entryWithTags.slice(1) as Tag[]);
      return null;
    } else {
      return this.add(entryWithTags[0] as TEntry, (
        Check.isArray(entryWithTags[1])
          ? entryWithTags[1]
          : entryWithTags.slice(1)
      ) as Tag[]).hashKey;
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
    if (!this.#take) {
      const toRemove = Queries.FullQueryConstructor<TEntry, ResultType.Array, TEntry>(
        this,
        ResultType.Array
      );

      const proxy = (...args: any[]) => {
        const result = toRemove(...args);

        if (result instanceof Dex) {
          this.remove.each(result.entries.values);
        } else {
          this.remove.each(result);
        }

        return result;
      }

      proxy.not = (...args: any[]) => {
        const result = toRemove.not(...args);

        if (result instanceof Dex) {
          this.remove.each(result.entries.values);
        } else {
          this.remove.each(result);
        }

        return result;
      }

      this.#take = proxy as Queries.Full<TEntry, ResultType.Array, TEntry>;
    }

    return this.#take;
  }

  /**
   * Used to remove entries from the dex.
   */
  get remove(): EntryRemover<TEntry> {
    return this.#entryRemover ??= DexModifierFunctionConstructor<
      TEntry,
      [entry: TEntry],
      Tag,
      {wasRemoved: boolean | NoEntryFound, tagCount?: number},
      []
      | [unlinkFromTag: Tag]
      | [unlinkTags: Iterable<Tag>]
      | [unlinkTags: Iterable<Tag>, options: { keepTaglessEntries?: true, dropEmptyTags?: true }]
      | [...unlinkTags: Tag[], options: { keepTaglessEntries?: true, dropEmptyTags?: true }]
      | [options?: { keepTaglessEntries?: true, dropEmptyTags?: true }]
    >(
      this,
      (
        entry: TEntry | HashKey,
        tags?: Iterable<Tag>,
        options?: { keepTaglessEntries?: true, dropEmptyTags?: true }
      ): {wasRemoved: boolean | NoEntryFound, tagCount: number} => {
        if (!options) {
          const hash = this.hash(entry);
          if (this.contains(hash)) {
            this[InternalDexSymbols._untagEntry](hash, tags);
            const remainingTagCount = this[InternalRDexSymbols._tagsByHash].get(hash)?.size;
            if (!remainingTagCount) {
              this[InternalDexSymbols._removeEntry](hash);
              return {wasRemoved: true, tagCount: 0};
            } else {
              return {wasRemoved: false, tagCount: remainingTagCount};
            }
          } else {
            return {wasRemoved: NO_RESULT, tagCount: 0};
          }
        } else {
          const hash = this.hash(entry);
          if (this.contains(hash)) {
            this[InternalDexSymbols._untagEntry](hash, tags);
            if (options.dropEmptyTags) {
              const toDrop: Tag[] = [];
              for (const tag in tags) {
                if (!this[InternalRDexSymbols._hashesByTag].get(tag)?.size) {
                  toDrop.push(tag);
                }
              }

              if (toDrop.length) {
                this.drop(toDrop);
              }
            }

            const remainingTagCount = this[InternalRDexSymbols._tagsByHash].get(hash)?.size;
            if (!remainingTagCount && !options.keepTaglessEntries) {
              this[InternalDexSymbols._removeEntry](hash);
              return {wasRemoved: true, tagCount: 0};
            } else {
              return {wasRemoved: false, tagCount: remainingTagCount ?? 0};
            }
          } else {
            return {wasRemoved: NO_RESULT, tagCount: 0};
          }
        }
      }) as EntryRemover<TEntry>;
  }

  //#region Internal

  /** @internal */
  protected [InternalDexSymbols._removeEntry](key: HashKey) {
    this[InternalRDexSymbols._entriesByHash].delete(key);
    this[InternalRDexSymbols._allHashes].delete(key);
  }

  //#endregion

  //#endregion

  //#region Remove Tags

  /**
   * Remove the given tags or all tags from the provided entry
   */
  get untag(): Untagger<TEntry> {
    return this.#untagger ??= DexModifierFunctionConstructor<
      TEntry,
      [entry: TEntry],
      Tag,
      {foundEntry: boolean | NoEntryFound, tagCount?: number},
      [...tags: Tag[]] | [tags: Iterable<Tag>] | [tag: Tag]
    >(
      this,
      (
        entry: TEntry | HashKey,
        tags?: Iterable<Tag>
      ): {foundEntry: boolean | NoEntryFound, tagCount: number} => {
        if (this.contains(entry)) {
          const hash = this.hash(entry);
          this[InternalDexSymbols._untagEntry](hash, tags as Tags);
          return {foundEntry: true, tagCount: this[InternalRDexSymbols._tagsByHash].get(hash)!.size}
        }

        return {foundEntry: false, tagCount: 0};
      }).bind(this) as Untagger<TEntry>;
  }

  //#region Internal

  /** @internal */
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
  protected [InternalDexSymbols._removeTagFromEntry](tag: Tag, key: HashKey) {
    this[InternalRDexSymbols._tagsByHash].get(key)?.delete(tag);
    this[InternalRDexSymbols._hashesByTag].get(tag)?.delete(key);
  }

  //#endregion

  //#region Drop Tags

  get drop(): TagDropper {
    return this.#tagDropper ??= ((
      ...args: ({ keepTaglessEntries?: true } | TagOrTags)[]
    ): boolean | Set<Tag> => {
      let options: { keepTaglessEntries?: true } | undefined = undefined;
      let tags: Tag[] = [];
      for (const arg in args) {
        if (Check.isTag(arg)) {
          tags.push(arg);
        } else if (Check.isArray(arg)) {
          tags.concat(arg);
        } else {
          options ??= arg as { keepTaglessEntries?: true };
        }
      }

      const result = new Set<Tag>();
      for (const tag of tags) {
        if (this.has(tag)) {
          this[InternalDexSymbols._resetTag](tag, options);
          this[InternalDexSymbols._removeTag](tag);
          result.add(tag);
        }
      }

      return tags.length === 1
        ? !!result.size
        : result;
    }) as TagDropper
  }

  //#region Internal

  /** @internal */
  protected [InternalDexSymbols._removeTag](tag: Tag) {
    this[InternalRDexSymbols._hashesByTag].delete(tag);
    this[InternalRDexSymbols._allTags].delete(tag);
  }

  //#endregion

  //#endregion

  //#region Reset Tags

  get reset(): TagResetter {
    return this.#tagResetter ??= ((
      ...args: ({ keepTaglessEntries?: true } | TagOrTags)[]
    ): boolean | Set<Tag> => {
      let options: { keepTaglessEntries?: true } | undefined = undefined;
      let tags: Tag[] = [];
      for (const arg in args) {
        if (Check.isTag(arg)) {
          tags.push(arg);
        } else if (Check.isArray(arg)) {
          tags.concat(arg);
        } else {
          options ??= arg as { keepTaglessEntries?: true };
        }
      }

      return this[InternalDexSymbols._resetTags](tags, options);
    }) as TagResetter;
  }

  //#region Internal

  /** @internal */
  private [InternalDexSymbols._resetTags](tagsToReset: Iterable<Tag>, options?: { keepTaglessEntries?: true }) {
    const results = new Set<Tag>();
    for (const tag of tagsToReset) {
      const result = this[InternalDexSymbols._resetTag](tag, options);
      if (result !== undefined) {
        results.add(result);
      }
    }

    return results;
  }

  /** @internal */
  private [InternalDexSymbols._resetTag](tag: Tag, options?: { keepTaglessEntries?: true, onRemove?: (key: HashKey) => void}) {
    if (this.has(tag)) {
      for (const hash of this[InternalRDexSymbols._hashesByTag].get(tag) ?? []) {
        const tagsForHash = this[InternalRDexSymbols._tagsByHash].get(hash);
        this[InternalDexSymbols._removeTagFromEntry](tag, hash);
        if (!options?.keepTaglessEntries && !tagsForHash!.size) {
          options?.onRemove?.(hash);
          this[InternalDexSymbols._removeEntry](hash);
        }
      }

      return tag;
    } else {
      return undefined;
    }
  }

  //#endregion

  //#endregion

  //#region Remove Various Values

  clean(): {entries: number, tags: number};

  clean(options: { tags?: boolean, entries?: boolean }): { entries: number, tags: number };

  clean(
    options?: { tags?: boolean, entries?: boolean }
  ): { entries: number, tags: number } {
    const result = {entries: 0, tags: 0};
    if (options?.entries) {
      for (const [k, t] of this[InternalRDexSymbols._tagsByHash]) {
        if (!t.size) {
          result.entries++;
          this[InternalDexSymbols._removeEntry](k);
        }
      }
    }

    if (options?.tags) {
      for (const [t, k] of this[InternalRDexSymbols._hashesByTag]) {
        if (!k.size) {
          result.tags++;
          this[InternalDexSymbols._removeTag](t);
        }
      }
    }

    return result;
  };

  clear(): void;

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