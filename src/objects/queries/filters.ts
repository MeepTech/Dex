import { forEach, IBreakable } from "../../utilities/loops";
import { isArray, isFunction, isIterable, isObject } from "../../utilities/validators";
import { IReadOnlyDex } from "../readonly";
import { IEntry } from '../subsets/entries'
import { IHashKey, IHashOrHashes } from "../subsets/hashes";
import { ITag, ITagOrTags } from "../subsets/tags";

//#region Normalized

export type IQueryFilter<TDexEntry extends IEntry>
  = IAndFilterQuery<TDexEntry> | IOrFilterQuery<TDexEntry>;

export type ILogicFilter<TDexEntry extends IEntry> = {
  where?: IMatchFilter<TDexEntry>
  // TODO: ignore function can also go in here.
} | IMatchFilter<TDexEntry>

export interface IMatchFilter<TDexEntry extends IEntry>
  extends IBreakable<[
    entry: TDexEntry,
    tags: Set<ITag>,
    index: number,
    dex: IReadOnlyDex<TDexEntry>,
    args: IQueryFilter<TDexEntry>,
    ...rest: any
  ], boolean> { };

/** @internal */
export type IOrFilterQuery<TDexEntry extends IEntry> = {
  /**
   * X or Y or Z
   */
  or: IFilterObject<TDexEntry>;
  not?: true | IFilterObject<TDexEntry>;
  and?: never;
};

/** @internal */
export type IAndFilterQuery<TDexEntry extends IEntry> = {
  /**
   * X and Y and Z
   */
  and: IFilterObject<TDexEntry>
  not?: true | IFilterObject<TDexEntry>,
  or?: never
};

/** @internal */
export type IFilterObject<TDexEntry extends IEntry>
  = ITagFilters & IFilterOrFilters<TDexEntry> & IHashKeyFilters;

/** @internal */
type IHashKeyFilters = {
  hashes: Set<IHashKey>
}

/** @internal */
type ITagFilters = {
  tags: Set<ITag>,
}

/** @internal */
type IFilterOrFilters<TDexEntry extends IEntry> = {
  filters: ILogicFilter<TDexEntry>[]
}

//#endregion

//#region Utility

/**
 * Used to convert input query filters to their normalized version
 */
export function normalizeFilters<TEntry extends IEntry>(
  inputFilters: IQueryFilterInput<TEntry>[]
): IQueryFilter<TEntry>[] {
  return inputFilters.map(filter => {
    const and = !!filter.and;
    const normalized: IQueryFilter<TEntry>
      = and
        ? {
          and: {
            hashes: new Set<IHashKey>,
            tags: new Set<ITag>,
            filters: [] as ILogicFilter<TEntry>[]
          }
        } : {
          or: {
            hashes: new Set<IHashKey>,
            tags: new Set<ITag>,
            filters: [] as ILogicFilter<TEntry>[]
          }
        };

    const filterValues = normalized.and || normalized.or;
    if (isArray(filter)) {
      for (const item of filter as (ITag | ILogicFilter<TEntry>)[]) {
        if (isObject(item) || isFunction(item)) {
          filterValues.filters.push(item as ILogicFilter<TEntry>);
        } else {
          filterValues.tags.add(item as ITag);
        }
      }
    } else if (isObject(filter)) {
      const current: IFilterObjectInput<TEntry>
        = and
          ? filter.and
          : (typeof filter.or !== 'boolean'
            ? filter.or
            : filter.not) as any;

      if (current.filters) {
        if (isArray(current.filters)) {
          filterValues.filters = current.filters;
        } else {
          filterValues.filters.push(current.filters);
        }
      }
      if (current.filter) {
        filterValues.filters.push(current.filter);
      }

      if (current.hashes) {
        filterValues.hashes = new Set(isObject(current.hashes)
          ? current.hashes
          : [current.hashes]);
        if (current.keys) {
          isIterable(current.keys)
            ? forEach(current.keys, key => filterValues.hashes.add(key))
            : filterValues.hashes.add(current.keys);
        }
      } else {
        if (current.keys) {
          filterValues.hashes = new Set(isObject(current.keys)
            ? current.keys
            : [current.keys]);
        }
      }

      if (current.key) {
        filterValues.hashes.add(current.key);
      }

      if (current.hash) {
        filterValues.hashes.add(current.hash);
      }

      if (current.tags) {
        filterValues.tags = new Set(isObject(current.tags)
          ? current.tags
          : [current.tags]);
      }

      if (current.tag) {
        filterValues.tags.add(current.tag);
      }
    }

    return normalized;
  });
}

/**
 * Used to convert input query filters to their 'not'/negated versions
 */
export function negateFilters<TEntry extends IEntry>(filters: IQueryFilter<TEntry>[]) {
  for (const filter of filters) {
    const not = filter.not;
    // simply delete the not if it's not'd
    if (not === true) {
      delete filter.not;
      continue;
    }

    if (filter.and) {
      const and = filter.and;
      filter.and = not ?? { hashes: new Set(), tags: new Set(), filters: []};
      filter.not = and;
    } else {
      const or = filter.or;
      filter.or = not ?? { hashes: new Set(), tags: new Set(), filters: []};
      filter.not = or;
    }
  }
}

//#endregion

//#region Input

/** @internal */
export type IQueryFilterInput<TEntry extends IEntry>
  = IAndFilterQueryInput<TEntry>
  | IOrFilterQueryInput<TEntry>
  | IQueryFilter<TEntry>;

/** @internal */
export type IAndFilterQueryInput<TEntry extends IEntry> = {
  /**
   * X and Y and Z
   */
  and: ITagOrTagsWithFiltersInput<TEntry>
  not?: true | ITagOrTagsWithFiltersInput<TEntry>,
  or?: never
} | {
  /**
   * X and Y and Z
   */
  and: true 
  not: ITagOrTagsWithFiltersInput<TEntry>,
  or?: never
};

/** @internal */
export type IOrFilterQueryInput<TEntry extends IEntry> = {
  /**
   * X or Y or Z
   */
  or: ITagOrTagsWithFiltersInput<TEntry>;
  not?: true | ITagOrTagsWithFiltersInput<TEntry>;
  and?: never;
} | {
  /**
   * X or Y or Z
   */
  or?: true | ITagOrTagsWithFiltersInput<TEntry>
  not: ITagOrTagsWithFiltersInput<TEntry>,
  and?: never
};

/** @internal */
type ITagOrTagsWithFiltersInput<TEntry extends IEntry> =
  | IFilterArrayInput<TEntry>
  | IFilterObjectInput<TEntry>;

/** @internal */
type IFilterArrayInput<TEntry extends IEntry>
  = Array<ITag | ILogicFilter<TEntry>>;

/** @internal */
export type IFilterObjectInput<TEntry extends IEntry>
  = ITagFiltersInput
  & IFilterOrFiltersInput<TEntry>
  & IHashKeyFiltersInput;

/** @internal */
type IHashKeyFiltersInput = {
  hash?: IHashKey;
  hashes?: IHashOrHashes;
  key?: IHashKey;
  keys?: IHashOrHashes;
};

/** @internal */
type ITagFiltersInput = {
  tags?: ITagOrTags;
  tag?: ITag
};

/** @internal */
type IFilterOrFiltersInput<TEntry extends IEntry> = {
  filter?: ILogicFilter<TEntry>,
  filters?: ILogicFilter<TEntry> | ILogicFilter<TEntry>[]
};

//#endregion