import { forEach, IBreakable } from "../../utilities/iteration";
import { isArray, isFunction, isIterable, isObject } from "../../utilities/validators";
import { IReadonlyDex } from "../readonly";
import { Entry } from '../subsets/entries'
import { HashKey, HashOrHashes } from "../subsets/hashes";
import { Tag, TagOrTags } from "../subsets/tags";

//#region Normalized

export type QueryFilter<TDexEntry extends Entry>
  = AndFilter<TDexEntry> | OrFilter<TDexEntry>;

export type LogicFilter<TDexEntry extends Entry> = {
  where?: MatchFilter<TDexEntry>
  // TODO: ignore function can also go in here.
} | MatchFilter<TDexEntry>

export interface MatchFilter<TDexEntry extends Entry>
  extends IBreakable<[
    entry: TDexEntry,
    tags: Set<Tag>,
    index: number,
    dex: IReadonlyDex<TDexEntry>,
    args: QueryFilter<TDexEntry>,
    ...rest: any
  ], boolean> { };

export type OrFilter<TDexEntry extends Entry> = {
  /**
   * X or Y or Z
   */
  or: FilterParams<TDexEntry>;
  not?: true | FilterParams<TDexEntry>;
  and?: never;
};

export type AndFilter<TDexEntry extends Entry> = {
  /**
   * X and Y and Z
   */
  and: FilterParams<TDexEntry>
  not?: true | FilterParams<TDexEntry>,
  or?: never
};

export type FilterParams<TDexEntry extends Entry>
  = TagFilters & LogicFilters<TDexEntry> & HashKeyFilters;

export type HashKeyFilters = {
  hashes: Set<HashKey>
}

export type TagFilters = {
  tags: Set<Tag>,
}

export type LogicFilters<TDexEntry extends Entry> = {
  filters: LogicFilter<TDexEntry>[]
}

//#endregion

//#region Utility

/**
 * Used to convert input query filters to their normalized version
 */
export function normalizeFilters<TDexEntry extends Entry>(
  inputFilters: XQueryFilter<TDexEntry>[]
): QueryFilter<TDexEntry>[] {
  return inputFilters.map(filter => {
    const and = !!filter.and;
    const normalized: QueryFilter<TDexEntry>
      = and
        ? {
          and: {
            hashes: new Set<HashKey>,
            tags: new Set<Tag>,
            filters: [] as LogicFilter<TDexEntry>[]
          }
        } : {
          or: {
            hashes: new Set<HashKey>,
            tags: new Set<Tag>,
            filters: [] as LogicFilter<TDexEntry>[]
          }
        };

    const filterValues = normalized.and || normalized.or;
    if (isArray(filter)) {
      for (const item of filter as (Tag | LogicFilter<TDexEntry>)[]) {
        if (isObject(item) || isFunction(item)) {
          filterValues.filters.push(item as LogicFilter<TDexEntry>);
        } else {
          filterValues.tags.add(item as Tag);
        }
      }
    } else if (isObject(filter)) {
      const current: FilterParamObject<TDexEntry>
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
export function negateFilters<TDexEntry extends Entry>(filters: QueryFilter<TDexEntry>[]) {
  for (const filter of filters) {
    const not = filter.not;
    // simply delete the not if it's not'd
    if (not === true) {
      delete filter.not;
      continue;
    }

    if (filter.and) {
      const and = filter.and;
      filter.and = not ?? { hashes: new Set(), tags: new Set(), filters: [] };
      filter.not = and;
    } else {
      const or = filter.or;
      filter.or = not ?? { hashes: new Set(), tags: new Set(), filters: [] };
      filter.not = or;
    }
  }
}

//#endregion

//#region Extended for Input

export type XQueryFilter<TDexEntry extends Entry>
  = XAndFilter<TDexEntry>
  | XOrFilter<TDexEntry>
  | QueryFilter<TDexEntry>;

export type XAndFilter<TDexEntry extends Entry> = {
  /**
   * X and Y and Z
   */
  and: XFilterParams<TDexEntry>
  not?: true | XFilterParams<TDexEntry>,
  or?: never
} | {
  /**
   * X and Y and Z
   */
  and: true
  not: XFilterParams<TDexEntry>,
  or?: never
};

export type XOrFilter<TDexEntry extends Entry> = {
  /**
   * X or Y or Z
   */
  or: XFilterParams<TDexEntry>;
  not?: true | XFilterParams<TDexEntry>;
  and?: never;
} | {
  /**
   * X or Y or Z
   */
  or?: true | XFilterParams<TDexEntry>
  not: XFilterParams<TDexEntry>,
  and?: never
};

export type XFilterParams<TDexEntry extends Entry> =
  | XFilterParamArray<TDexEntry>
  | FilterParamObject<TDexEntry>;

export type XFilterParamArray<TDexEntry extends Entry>
  = Array<Tag | LogicFilter<TDexEntry>>;

export type FilterParamObject<TDexEntry extends Entry>
  = XTagFilters
  & XLogicFilters<TDexEntry>
  & XHashKeyFilters;

export type XHashKeyFilters = {
  hash?: HashKey;
  hashes?: HashOrHashes;
  key?: HashKey;
  keys?: HashOrHashes;
};

export type XTagFilters = {
  tags?: TagOrTags;
  tag?: Tag
};

export type XLogicFilters<TDexEntry extends Entry> = {
  filter?: LogicFilter<TDexEntry>,
  filters?: LogicFilter<TDexEntry> | LogicFilter<TDexEntry>[]
};

//#endregion