import { Copier } from "./helpers/copy";
import { Looper } from "./helpers/loops";
import { Mapper } from "./helpers/maps";
import { IReadOnlyDex } from "./idex";
import { FullQuery, SpecificQuery, FirstableQuery } from "./queries/queries";
import { ResultType } from "./queries/results";
import { Entry, EntrySet, IArrayGuard, IGuard, IHasher, IObjectGuard } from "./subsets/entries";
import { HashKey, HashSet } from "./subsets/hashes";
import { Tag, TagSet } from "./subsets/tags";


export class ReadOnlyDex<TEntry extends Entry> implements IReadOnlyDex<TEntry>  {

  // data
  private readonly _allTags
    : Set<Tag>
    = new Set<Tag>();
  private readonly _allHashes
    : Set<HashKey>
    = new Set<HashKey>();
  private readonly _hashesByTag
    : Map<Tag, Set<HashKey>>
    = new Map<Tag, Set<HashKey>>();
  private readonly _tagsByHash
    : Map<HashKey, Set<Tag>>
    = new Map<HashKey, Set<Tag>>();
  private readonly _entriesByHash
    : Map<HashKey, TEntry>
    = new Map<HashKey, TEntry>();

  // config
  /** @readonly */
  private _guards
    : {
      entry: IGuard<TEntry>
      array: IArrayGuard<TEntry>,
      object: IObjectGuard<TEntry>,
    } = null!;
  /** @readonly */
  private _hasher: IHasher
    = null!;

  // lazy
  // - queries
  private _query?: FullQuery<TEntry, ResultType, TEntry>;
  private _filter?: SpecificQuery<TEntry, ResultType.Dex, TEntry>;
  private _values?: FirstableQuery<TEntry, ResultType.Array, TEntry>;
  private _keys?: FirstableQuery<HashKey, ResultType.Set, TEntry>;
  private _first?: SpecificQuery<TEntry, ResultType.First, TEntry>;
  private _any?: SpecificQuery<boolean, ResultType.First, TEntry>;
  private _count?: SpecificQuery<number, ResultType.First, TEntry>;
  private _take?: FullQuery<TEntry, ResultType.Array, TEntry>;

  // - subsets
  private _hashSet?: HashSet<TEntry>;
  private _tagSet?: TagSet<TEntry>;
  private _entrySet?: EntrySet<TEntry>;

  // - helpers
  private _forLooper?: Looper<TEntry>;
  private _mapLooper?: Mapper<TEntry>;
  private _copier?: Copier<TEntry>;
}