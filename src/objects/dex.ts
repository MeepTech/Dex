import { Breakable, Break } from "../utilities/breakable";
import {
  isArray,
  isFunction,
  isNumber,
  isObject,
  isString,
  isSymbol,
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
  Entry,
  EntryMapConstructor,
  IEntrySet
} from "./subsets/entries";
import { Looper, LooperConstructor } from "./loops";
import { Mapper, MapperConstructor } from "./maps";
import {
  Tag,
  ITagSet,
  TagSetConstructor
} from "./subsets/tags";
import {
  HashKey,
  IHashSet,
  HashSetConstructor
} from "./subsets/hashes";
import { IReadOnlyDex } from "./readonly";
import { CopierConstructor, ICopier } from './copy';
import {
  IBasicQuery,
  IQueryChain,
  QueryConstructor,
  IQuery,
  IFirstableQuery,
  IQueryResult
} from "./queries/queries";
import {
  FLAGS,
  Flag,
  LogicFlag,
} from "./queries/flags";
import { FirstableQueryConstructor, FirstQueryConstructor } from './queries/first';

/**
 * A collection of unque entries, keyed by various custom tags.
 * 
 * This represents a many to many replationship of Tags to Entries.
 */
export default class Dex<TEntry extends Entry = Entry> implements IReadOnlyDex<TEntry> {
  private readonly _allTags
    = new Set<Tag>();
  private readonly _allHashes
    = new Set<HashKey>();
  private readonly _hashesByTag
    : Map<Tag, Set<HashKey>>
    = new Map<Tag, Set<HashKey>>();
  private readonly _tagsByEntryHash
    : Map<HashKey, Set<Tag>>
    = new Map<HashKey, Set<Tag>>();
  private readonly _entriesByHash
    : Map<HashKey, TEntry>
    = new Map<HashKey, TEntry>();

  private _forLooper?: Looper<TEntry>;
  private _mapLooper?: Mapper<TEntry>;
  private _hashSet?: IHashSet<TEntry>;
  private _tagSet?: ITagSet<TEntry>;
  private _entrySet?: IEntrySet<TEntry>;
  private _copier?: ICopier<TEntry>;

  //#region Initialization

  /**
   * Make a new empty dex
   */
  constructor()

  /**
   * Make a new dex of just empty tags
   */
  constructor(original: Dex<TEntry>)

  /**
   * Make a new dex of just empty tags
   */
  constructor(values: Tag[])

  /**
   * Make a new dex of just empty tags
   */
  constructor(...values: [TEntry, ...Tag[]][])

  /**
   * Make a new dex of just empty tags
   */
  constructor(...values: [TEntry, Tag[]][])

  /**
   * Make a new dex from entries and tags. 
   * (it's not advised to use this ctor pattern for dexes that can store types that can be Tags as well)
   */
  constructor(values: [TEntry, ...Tag[]][])

  /**
   * Make a new dex from an array of entries with an array of tags.
   */
  constructor(values: [TEntry, (Tag[] | [])][])

  /**
   * Make a new dex from an object with entries and tags
   */
  constructor(values: { entry?: TEntry, tags?: Tag[] | Tag | Set<Tag>, tag?: Tag }[])

  /**
   * Make a new dex from an object with entries and tags
   */
  constructor(...values: { entry?: TEntry, tags?: Tag[] | Tag | Set<Tag>, tag?: Tag }[])

  /**
   * Make a new dex from a map
   */
  constructor(values: (Map<TEntry, Set<Tag>> | Map<TEntry, Tag[]>))

  /**
   * Make a new dex
   */
  constructor(values?: (
    Array<
      [TEntry, ...Tag[]]
      | [TEntry, Tag[]]
      | { entry?: TEntry, tags?: Tag[] | Tag | Set<Tag>, tag?: Tag }
      | Tag
    > | Map<TEntry, Set<Tag>>
    | Map<TEntry, Tag[]>
    | { entry?: TEntry, tags?: Tag[] | Tag | Set<Tag>, tag?: Tag }
    | Dex<TEntry>
  )) {
    if (values) {
      // copy an existing dex
      if (values instanceof Dex) {
        this._allTags = values._allTags;
        this._allHashes = values._allHashes;
        this._entriesByHash = values._entriesByHash;
        this._hashesByTag = values._hashesByTag;
        this._tagsByEntryHash = values._tagsByEntryHash;
      } else {
        // if it's an array of values
        if (isArray(values)) {
          // entries with tags in an array
          if (isArray(values[0])) {
            values.forEach((entry, ...tags) => this.add(entry as TEntry, tags as Tag[]));
          } // entries with object keys
          else if (isObject(values[0]) && (values[0]?.hasOwnProperty("entry") || values[0]?.hasOwnProperty("tags") || values[0]?.hasOwnProperty("tag"))) {
            values.forEach(e => {
              this.add(
                ((e as any).entry as TEntry),
                ((e as any).tag as Tag[])
                || ((e as any).tags as Tag[] | Tag | Set<Tag>),
              );
            });
          }
          // just tags
          else {
            values.forEach((tag) => this.add(tag as Tag));
          }
        } // if it's a map of values
        else if (values instanceof Map) {
          values.forEach((t, e) => this.add(e, t));
        } // if it's a single object
        else {
          this.add(values.entry as TEntry, values.tags || values.tag);
        }
      }
    }
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

  get keys(): IHashSet<TEntry> {
    return this._hashSet
      ??= HashSetConstructor<TEntry>(this, this._allHashes);
  }

  //#endregion

  //#region Loop Helpers

  get for(): Looper<TEntry> {
    return this._forLooper ??= LooperConstructor(this);
  }

  get map(): Mapper<TEntry> {
    return this._mapLooper ??= MapperConstructor(this);
  };

  //#endregion

  //#endregion

  //#region Methods

  //#region Get

  //#region General

  get(key: HashKey): TEntry | undefined {
    return this._entriesByHash.get(key);
  }

  contains(entry: TEntry | HashKey): boolean {
    return this._allHashes.has(Dex.hash(entry)!);
  }

  has(tag: Tag): boolean {
    return this._allTags.has(tag);
  }

  //#endregion

  //#region Queries

  //#region Generic

  find<TFlag extends Flag>(
    tags: Tag[],
    options: TFlag[] = []
  ): IQueryResult<TEntry, TFlag> {
    if (options?.includes(FLAGS.FIRST as TFlag)) {
      return this.value(tags, options as any) as IQueryResult<TEntry, TFlag>;
    } else if (options?.includes(FLAGS.CHAIN as TFlag)) {
      return this.filter(tags, options as any) as IQueryResult<TEntry, TFlag>;
    } else {
      return this.values(
        tags,
        options as (typeof FLAGS.VALUES | LogicFlag)[]
      ) as IQueryResult<TEntry, TFlag>;
    }
  }

  get query(): IQuery<TEntry> {
    return QueryConstructor<TEntry>(this.find);
  }

  //#endregion

  //#region Chained

  filter(
    tags: Tag[],
    flags
      : (typeof FLAGS.CHAIN | LogicFlag)[]
      = [FLAGS.CHAIN, FLAGS.OR]
  ): Dex<TEntry> {
    // []
    if (!tags.length) {
      if (flags.includes(FLAGS.NOT)) { // NOT []
        const result = new Dex<TEntry>();
        result.copy.from(this, { tags });

        return result;
      } else { // [] []
        const result = new Dex<TEntry>();
        result.copy.from(this, { tags: [] });

        return result;
      }
    }

    const results = new Dex<TEntry>();

    // OR
    if (flags.includes(FLAGS.OR)) {
      // OR NOT
      if (flags.includes(FLAGS.NOT)) {
        const hashKeysToCopy: HashKey[] = [];
        const validTags = [...this.tags.filter(f => !tags.includes(f))];

        const hashes = this.hashes(validTags);
        for (const hash of hashes) {
          const entryTags = this._tagsByEntryHash.get(hash)!;
          if (!tags.some(entryTags.has)) {
            hashKeysToCopy.push(hash);
          }
        }

        results.copy.from(this, hashKeysToCopy);
      } // OR OR
      else {
        results.copy.from(this, { tags });
      }
    } // AND
    else {
      // AND NOT
      if (flags.includes(FLAGS.NOT)) {
        const hashKeysToCopy: HashKey[] = [];
        for (const [hash, tags] of this._tagsByEntryHash) {
          let count = 0;
          for (const tag of tags) {
            if (tags.has(tag)) {
              count++;
            }
          }

          if (count != tags.size) {
            hashKeysToCopy.push(hash);
          }
        }

        results.copy.from(this, hashKeysToCopy);
      } // AND AND
      else {
        let potentialResults = new Set<HashKey>();
        let isFirstLoop: boolean = true;
        for (const tag of tags) {
          const hashesForTag
            = this._hashesByTag.get(tag)
            ?? new Set<HashKey>();

          if (isFirstLoop) {
            potentialResults = hashesForTag;
          } else {
            for (const key in potentialResults.entries()) {
              if (!hashesForTag.has(key)) {
                potentialResults.delete(key);
              }
            }
          }

          if (!potentialResults.size) {
            break;
          }

          isFirstLoop = false;
        }

        results.copy.from(this, potentialResults);
      }
    }

    return results;
  }

  select
    : IQueryChain<TEntry>
    = QueryChainConstructor(this, this.filter)

  and
    : IQueryChain<TEntry>
    = AndQueryChainConstructor(this, this.filter)

  or
    : IQueryChain<TEntry>
    = OrQueryChainConstructor(this, this.filter)

  not
    : IQueryChain<TEntry>
    = NotQueryChainConstructor(this, this.filter)

  //#endregion

  //#region Values

  value(
    tags: Tag[],
    flags
      : (typeof FLAGS.FIRST | LogicFlag)[]
      = [FLAGS.FIRST, FLAGS.OR]
  ): TEntry | undefined {
    if (!tags.length) {
      if (!flags.includes(FLAGS.NOT)) {
        for (const [hash, tags] of this._tagsByEntryHash) {
          if (tags.size !== 0) {
            return this._entriesByHash.get(hash)!;
          }
        }
      } else {
        for (const [hash, tags] of this._tagsByEntryHash) {
          if (tags.size === 0) {
            return this._entriesByHash.get(hash)!;
          }
        }
      }
    }

    // OR
    if (flags.includes(FLAGS.OR)) {
      // OR NOT
      if (flags.includes(FLAGS.NOT)) {
        for (const [hash, tags] of this._tagsByEntryHash) {
          for (const tag of tags) {
            if (tags.has(tag)) {
              continue;
            }

            return this._entriesByHash.get(hash)!;
          }
        }
      } // OR OR
      else {
        for (const [hash, tags] of this._tagsByEntryHash) {
          for (const tag of tags) {
            if (tags.has(tag)) {
              return this._entriesByHash.get(hash)!;
            }
          }
        }
      }
    } // AND
    else {
      // AND NOT
      if (flags.includes(FLAGS.NOT)) {
        for (const [hash, tags] of this._tagsByEntryHash) {
          for (const tag of tags) {
            let tagCount = 0;
            if (tags.has(tag)) {
              tagCount++;
            }

            if (tagCount == tags.size) {
              continue;
            }

            return this._entriesByHash.get(hash)!;
          }
        }
      } // AND AND
      else {
        for (const [hash, tags] of this._tagsByEntryHash) {
          for (const tag of tags) {
            if (tags.has(tag)) {
              let tagCount = 0;
              if (tags.has(tag)) {
                tagCount++;
              }

              if (tagCount == tags.size) {
                return this._entriesByHash.get(hash)!;
              }
            }
          }
        }
      }
    }

    return undefined;
  }

  values: IFirstableQuery<TEntry, TEntry, TEntry[], typeof FLAGS.VALUES | LogicFlag>
    = FirstableQueryConstructor<TEntry, TEntry, TEntry[], typeof FLAGS.VALUES | LogicFlag>(
      ((
        tags?: Tag[],
        flags: Flag[] = [FLAGS.VALUES, FLAGS.OR]
      ): TEntry[] => {
        if (!tags) {
          if (!flags.includes(FLAGS.NOT)) {
            return [...this.entries.values];
          } else {
            return [];
          }
        } else if (!tags.length) {
          if (!flags.includes(FLAGS.NOT)) {
            // TODO: all that don't have tags
            return [];
          } else {
            // TODO: all that have tags
            return [...this.entries.values];
          }
        }

        // OR
        if (flags.includes(FLAGS.OR)) {
          // OR NOT
          if (flags.includes(FLAGS.NOT)) {
            const hashKeysToCopy: HashKey[] = [];
            const validTags = [...this.tags.filter(f => !tags.includes(f))];

            const hashes = this.hashes(validTags);
            for (const hash of hashes) {
              const entryTags = this._tagsByEntryHash.get(hash)!;
              if (!tags.some(entryTags.has)) {
                hashKeysToCopy.push(hash);
              }
            }

            return hashKeysToCopy.map(k => this.get(k)!);
          } // OR OR
          else {
            return tags.map(tag => this._hashesByTag.get(tag)!)
              .filter(set => set !== undefined)
              .map(set => {
                const arr: TEntry[] = [];
                for (const hash in set) {
                  arr.push(this.get(hash)!)
                }

                return arr;
              })
              .flat();
          }
        } // AND
        else {
          // AND NOT
          if (flags.includes(FLAGS.NOT)) {
            const hashKeysToCopy: HashKey[] = [];
            for (const [hash, tags] of this._tagsByEntryHash) {
              let count = 0;
              for (const tag of tags) {
                if (tags.has(tag)) {
                  count++;
                }
              }

              if (count != tags.size) {
                hashKeysToCopy.push(hash);
              }
            }

            return hashKeysToCopy.map(k => this.get(k)!);
          } // AND AND
          else {
            let potentialResults = new Set<HashKey>();
            let isFirstLoop: boolean = true;
            for (const tag of tags) {
              const hashesForTag
                = this._hashesByTag.get(tag)
                ?? new Set<HashKey>();

              if (isFirstLoop) {
                potentialResults = hashesForTag;
              } else {
                for (const key in potentialResults.entries()) {
                  if (!hashesForTag.has(key)) {
                    potentialResults.delete(key);
                  }
                }
              }

              if (!potentialResults.size) {
                break;
              }

              isFirstLoop = false;
            }

            const values: TEntry[] = [];
            for (const key in potentialResults) {
              values.push(this.get(key)!);
            }

            return values;
          }
        }
      }),
      this.first
    );

  //#endregion

  //#region Single Value

  get first(): IQuery<TEntry, TEntry, typeof FLAGS.FIRST | LogicFlag, TEntry> {
    return FirstQueryConstructor<TEntry>(this);
  }

  //#endregion

  //#region Hashes/Keys

  hash: IBasicQuery<HashKey, TEntry, HashKey | undefined, typeof FLAGS.FIRST | LogicFlag> = (
    tags: Tag[],
    flags
      : (typeof FLAGS.FIRST | LogicFlag)[]
      = [FLAGS.FIRST, FLAGS.OR]
  ): HashKey | undefined => {
    if (!tags.length) {
      if (!flags.includes(FLAGS.NOT)) {
        for (const [hash, tags] of this._tagsByEntryHash) {
          if (tags.size !== 0) {
            return hash;
          }
        }
      } else {
        for (const [hash, tags] of this._tagsByEntryHash) {
          if (tags.size === 0) {
            return hash;
          }
        }
      }
    }

    // OR
    if (flags.includes(FLAGS.OR)) {
      // OR NOT
      if (flags.includes(FLAGS.NOT)) {
        for (const [hash, tags] of this._tagsByEntryHash) {
          for (const tag of tags) {
            if (tags.has(tag)) {
              continue;
            }

            return hash;
          }
        }
      } // OR OR
      else {
        for (const [hash, tags] of this._tagsByEntryHash) {
          for (const tag of tags) {
            if (tags.has(tag)) {
              return hash;
            }
          }
        }
      }
    } // AND
    else {
      // AND NOT
      if (flags.includes(FLAGS.NOT)) {
        for (const [hash, tags] of this._tagsByEntryHash) {
          for (const tag of tags) {
            let tagCount = 0;
            if (tags.has(tag)) {
              tagCount++;
            }

            if (tagCount == tags.size) {
              continue;
            }

            return hash;
          }
        }
      } // AND AND
      else {
        for (const [hash, tags] of this._tagsByEntryHash) {
          for (const tag of tags) {
            if (tags.has(tag)) {
              let tagCount = 0;
              if (tags.has(tag)) {
                tagCount++;
              }

              if (tagCount == tags.size) {
                return hash;
              }
            }
          }
        }
      }
    }
  }

  hashes: IFirstableQuery<HashKey, TEntry, HashKey[], typeof FLAGS.VALUES | LogicFlag>
    = FirstableQueryConstructor<HashKey, TEntry, HashKey[], typeof FLAGS.VALUES | LogicFlag>(
      ((
        tags?: Tag[],
        flags: Flag[] = [FLAGS.VALUES, FLAGS.OR]
      ): HashKey[] => {
        if (!tags) {
          if (!flags.includes(FLAGS.NOT)) {
            return [...this.keys];
          } else {
            return [];
          }
        } else if (!tags.length) {
          if (!flags.includes(FLAGS.NOT)) {
            // TODO: all that don't have tags
            return [];
          } else {
            // TODO: all that have tags
            return [...this.keys];
          }
        }

        // OR
        if (flags.includes(FLAGS.OR)) {
          // OR NOT
          if (flags.includes(FLAGS.NOT)) {
            const hashKeys: HashKey[] = [];
            const validTags = [...this.tags.filter(f => !tags.includes(f))];

            const hashes = this.hashes(validTags);
            for (const hash of hashes) {
              const entryTags = this._tagsByEntryHash.get(hash)!;
              if (!tags.some(entryTags.has)) {
                hashKeys.push(hash);
              }
            }

            return hashKeys;
          } // OR OR
          else {
            return tags.map(tag => this._hashesByTag.get(tag)!)
              .filter(set => set !== undefined)
              .map(set => [...set])
              .flat();
          }
        } // AND
        else {
          // AND NOT
          if (flags.includes(FLAGS.NOT)) {
            const hashKeys: HashKey[] = [];
            for (const [hash, tags] of this._tagsByEntryHash) {
              let count = 0;
              for (const tag of tags) {
                if (tags.has(tag)) {
                  count++;
                }
              }

              if (count != tags.size) {
                hashKeys.push(hash);
              }
            }

            return hashKeys;
          } // AND AND
          else {
            let potentialResults = new Set<HashKey>();
            let isFirstLoop: boolean = true;
            for (const tag of tags) {
              const hashesForTag
                = this._hashesByTag.get(tag)
                ?? new Set<HashKey>();

              if (isFirstLoop) {
                potentialResults = hashesForTag;
              } else {
                for (const key in potentialResults.entries()) {
                  if (!hashesForTag.has(key)) {
                    potentialResults.delete(key);
                  }
                }
              }

              if (!potentialResults.size) {
                break;
              }

              isFirstLoop = false;
            }

            return [...potentialResults];
          }
        }
      }),
      QueryConstructor<
        HashKey,
        TEntry,
        typeof FLAGS.FIRST | LogicFlag,
        HashKey | undefined,
        HashKey,
        HashKey | undefined,
        typeof FLAGS.FIRST | LogicFlag
      >(this.hash)
    );

  //#endregion

  //#region Utility

  any = QueryConstructor<
    boolean,
    TEntry,
    LogicFlag | typeof FLAGS.FIRST,
    boolean,
    boolean,
    boolean,
    LogicFlag | typeof FLAGS.FIRST
  >(
    (tags: Tag[], options?: (typeof FLAGS.FIRST | LogicFlag)[]): boolean => {
      return !!this.first(tags, options);
    }
  );

  count = QueryConstructor<
    number,
    TEntry,
    LogicFlag,
    number,
    number,
    number,
    LogicFlag
  >(
    (tags: Tag[], options?: LogicFlag[]): number => {
      return this.values(tags, options).length;
    }
  );

  //#endregion

  //#endregion

  //#endregion

  //#region Modify

  //#region Add

  /**
   * Add an empty tag, or a entry with any number of tags to the dex
   *
   * @returns The uniqueid/hash of the item added to the dex
   * , or if just an empty tag was added: just the name of the tag is returned.
   */
  add(
    entry: TEntry | Tag,
    ...tags: Tag[]
  ): HashKey;

  /**
   * Add an empty tag, or a entry with any number of tags to the dex
   *
   * @returns The uniqueid/hash of the item added to the dex
   * , or if just an empty tag was added: just the name of the tag is returned.
   */
  add(
    entry: TEntry | Tag,
    tags?: Tag[] | Set<Tag> | Tag
  ): HashKey;

  /**
   * Add an empty tag, or a entry with any number of tags to the dex
   *
   * @returns The uniqueid/hash of the item added to the dex
   * , or if just an empty tag was added: just the name of the tag is returned.
   */
  add(
    entry: TEntry | Tag,
    tag?: Tag
  ): HashKey

  /**
   * Add an empty tag, or a entry with any number of tags to the dex
   *
   * @returns The uniqueid/hash of the item added to the dex
   * , or if just an empty tag was added: just the name of the tag is returned.
   */
  add(
    entry: TEntry | Tag,
    tags?: Tag[] | Tag | Set<Tag>
  ): HashKey {
    const hash: HashKey | undefined = Dex.hash(entry);

    if (hash === undefined) {
      throw new Error(`Invalid item id/hash for item of type: ${typeof entry}, being added to a dex.`);
    }

    if (!isArray(tags) && !(tags instanceof Set)) {
      tags = tags ? [tags] : [];
    }

    // if we're only provided a string argument, then it's just for an empty tag group:
    if ((tags instanceof Set ? !tags.size : !tags?.length) && (isSymbol(entry) || isString(entry) || isNumber(entry))) {
      // add the new empty tag group:
      this._allTags.add(entry);
      if (!this._hashesByTag.get(entry)) {
        this._hashesByTag.set(entry, new Set<HashKey>());
      }

      return entry;
    } // if we have tags howerver~
    else {
      const uniqueTags = new Set<Tag>(tags);

      // set the entries by tag.
      uniqueTags.forEach(t => {
        this._allTags.add(t);
        if (this._hashesByTag.get(t)) {
          this._hashesByTag.get(t)!.add(hash);
        } else {
          this._hashesByTag.set(t, new Set<HashKey>([hash]));
        }
      });

      // set the tags by entry's hash
      const currentTags = this._tagsByEntryHash.get(hash);
      if (currentTags) {
        uniqueTags.forEach(currentTags.add);
      } else {
        this._tagsByEntryHash.set(hash, uniqueTags);
      }

      // set the hash key
      if (!this._allHashes.has(hash)) {
        this._allHashes.add(hash);
        this._entriesByHash.set(hash, entry as TEntry);
      }

      return hash;
    }
  }

  /**
   * return a copy of this dex.
   * also has the property 'from' to copy items from another dex into this one.
   */
  get copy(): ICopier<TEntry> {
    return this._copier ??= CopierConstructor(this);
  }

  //#endregion

  //#region Remove

  /**
   * Remove all entries that match the tags.
   * 
   * @returns the number of removed entries
   */
  remove(
    tags: Tag[],
    options?: (LogicFlag)[],
    cleanEmptyTags?: boolean
  ): number;

  /**
   * Used to remove matching entries from the dex, or the desired tag.
   * 
   * @returns the number of removed entries
   */
  remove(
    target: Breakable<[entry?: TEntry, tag?: Tag], boolean>,
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
    target: HashKey,
    cleanEmptyTags?: boolean
  ): number;

  /**
   * Used to remove entries from the dex.
   * 
   * @returns the number of removed entries
   */
  remove(
    target: TEntry
      | Breakable<[entry: TEntry, tag: Tag], boolean>
      | HashKey
      | Tag[],
    cleanEmptyTagsOrOptions: boolean | Flag[] = false,
    cleanEmptyTags: boolean = false,
  ): number {
    let removedCount = 0;
    const emptiedTags: Set<Tag> = new Set();
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
            : Dex.hash(target)!,
          (removed: HashKey) => {
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
        const flags = cleanEmptyTagsOrOptions as Flag[];

        const hashesToRemove = this.hashes(target, flags as any);
        hashesToRemove.forEach(hash => {
          this.remove(hash)
        });

        return hashesToRemove.length;
      } else {
        target.forEach((tag: Tag) => {
          
        });
      }
    } // remove by match/hash
    else {
      const hash = Dex.hash(target)!;
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

  /**
   * Used to remove all empty tags.
   */
  clean(): TEntry[];

  /**
   * Used to remove tags without dropping related items.
   */
  clean(...tags: Tag[]): void;

  clean(...tags: Tag[]): TEntry[] | void {
    if (!tags?.length) {

    } else {
      const effectedEntries = [];
      tags.forEach(tag => {
        if (this.has(tag) && this._hashesByTag.get(tag)!.size) {

        }
      });
    }
  }

  /**
   * Remove whole tags from the dex, and any entries under them that have no remaining tags.
   * 
   * @returns A set of the effected entries.
   */
  drop(
    ...tags: Array<Tag>
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
   * Drop all tags and entries at once.
   */
  clear(): void {
    //TODO: this could be more efficient. just empty the private sets and maps.
    this.drop(...this._allTags);
  }

  private _removeItemAt(hash: HashKey) {
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

  //#region Looping

  //#region For

  /**
   * For each unique entry and tag pair.
   * 
   * @param func 
   */
  forEach(
    func: Breakable<[entry: TEntry, tag: Tag, index: number], any>,
    outerLoopType: 'entry' | 'tag' = 'entry'
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
    func: Breakable<[tag: Tag, index: number, entries: Set<TEntry>], any>
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
    func: Breakable<[entry: TEntry, index: number, tags: Set<Tag>], any>
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
    transform?: Breakable<[entry: TEntry, tag: Tag, index: number], TResult>,
    outerLoopType: 'entry' | 'tag' = 'entry'
  ): (TResult extends undefined ? Map<Entry, Tag[]> : TResult[]) {
    if (!transform) {
      return new Map<TEntry, Tag[]>() as any;
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
    transform?: Breakable<[entry: TEntry, index: number, tags: Set<Tag>], TResult>
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
    transform?: Breakable<[tag: Tag, index: number, entries: Set<TEntry>], TResult>
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

  //#endregion

  //#region Static
  
  //#region Helpers

  /**
   * Get a dex's hash key for any type of entry.
   */
  public static hash(entry: Entry)
    : HashKey | undefined {
    return isUnique(entry)
      ? entry.getHashKey()
      : isString(entry) || isNumber(entry) || isSymbol(entry)
        ? entry
        : isObject(entry) || isFunction(entry)
          ? Dex.getUuid(entry)
          : undefined;
  }

  /**
   * Get the uuid for a non primative object added to a dex.
   * 
   * @param entry 
   * @returns 
   */
  public static getUuid(entry: { [key: string]: any } | IUnique) {
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
 * An error signifying an invalid combination of flags were passed to a Dex Query
 */
export class InvalidDexQueryFlagsError extends DexError {
  readonly flags: Flag[];
  constructor(flags: Flag[]) {
    super(`Invalid Dex Query Flag Combination: (${flags})`);
    this.flags = flags;
  }
}

//#endregion