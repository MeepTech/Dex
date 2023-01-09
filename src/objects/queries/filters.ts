import { first, forEach, IBreakable } from "../../utilities/iteration";
import { isArray, isEmptyObject, isFilter, isFunction, isNonStringIterable, isObject, isTag } from "../../utilities/validators";
import { InvalidQueryParamError } from "../errors";
import { IReadonlyDex } from "../readonly";
import { Entry } from '../subsets/entries'
import { HashKey, HashOrHashes } from "../subsets/hashes";
import { Tag, TagOrTags } from "../subsets/tags";
import { ResultType, RESULT_TYPES } from "./results";

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
  hashes: Set<HashKey> | undefined
}

export type TagFilters = {
  tags: Set<Tag> | undefined,
}

export type LogicFilters<TDexEntry extends Entry> = {
  logic: LogicFilter<TDexEntry>[] | undefined
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
  not: XFilterParams<TDexEntry> | boolean,
  and?: never
};

export type XFilterParams<TDexEntry extends Entry> =
  | FilterParamArray<TDexEntry>
  | FilterParamObject<TDexEntry>;

export type FilterParamArray<TDexEntry extends Entry>
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
  filters?: LogicFilter<TDexEntry> | LogicFilter<TDexEntry>[],
  // TODO: implement these aliases.:
  logic?: LogicFilter<TDexEntry> | LogicFilter<TDexEntry>[],
  when?: LogicFilter<TDexEntry> | LogicFilter<TDexEntry>[],
  where?: LogicFilter<TDexEntry> | LogicFilter<TDexEntry>[],
};

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
            hashes: undefined,
            tags: undefined,
            logic: undefined
          }
        } : {
          or: {
            hashes: undefined,
            tags: undefined,
            logic: undefined
          }
        };

    const filterValues = normalized.and || normalized.or;
    if (isArray(filter)) {
      for (const item of filter as (Tag | LogicFilter<TDexEntry>)[]) {
        if (isObject(item) || isFunction(item)) {
          filterValues.logic ??= [];
          filterValues.logic.push(item as LogicFilter<TDexEntry>);
        } else {
          filterValues.tags ??= new Set<Tag>();
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
          filterValues.logic = current.filters;
        } else {
          filterValues.logic = [current.filters];
        }
      }

      if (current.filter) {
        filterValues.logic ??= [];
        filterValues.logic.push(current.filter);
      }

      if (current.hashes) {
        filterValues.hashes = new Set(isObject(current.hashes)
          ? current.hashes
          : [current.hashes]);
        if (current.keys) {
          filterValues.hashes = new Set();
          isNonStringIterable(current.keys)
            ? forEach(current.keys, key => filterValues.hashes!.add(key))
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
        filterValues.hashes ??= new Set();
        filterValues.hashes.add(current.key);
      }

      if (current.hash) {
        filterValues.hashes ??= new Set();
        filterValues.hashes.add(current.hash);
      }

      if (current.tags) {
        filterValues.tags = new Set(isObject(current.tags)
          ? current.tags
          : [current.tags]);
      }

      if (current.tag) {
        filterValues.tags ??= new Set();
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
      filter.and = not ?? { hashes: new Set(), tags: new Set(), logic: [] };
      filter.not = and;
    } else {
      const or = filter.or;
      filter.or = not ?? { hashes: new Set(), tags: new Set(), logic: [] };
      filter.not = or;
    }
  }
}

/**
 * Used to turn an array of query arguments into loose filters.
 */
export function processArgsIntoFilters<TDexEntry extends Entry>(
  options: {
    defaultFilterType: 'or' | 'and'
  },
  ...args: any[]
): { filters: QueryFilter<TDexEntry>[], result: ResultType | undefined } {
  let filters: XQueryFilter<TDexEntry>[] | undefined;
  let result: ResultType | undefined;
  let looseTags: Iterable<Tag> | undefined;

  let index: [number] = [0];
  while (args.length) {
    let filterOptions: { result?: ResultType, filters?: (XQueryFilter<TDexEntry> | XQueryFilter<TDexEntry>[]) } | undefined;
    if (filterOptions = _checkNextArgForOptions<TDexEntry>(args, index)) {
      const processedOptions = _addQueryOptionsToFilters<TDexEntry>(filterOptions, filters, result, looseTags, options.defaultFilterType);
      filters = processedOptions.filters;
      result = processedOptions.result ?? result;

      if (filters) {
        looseTags = undefined;
      }

      break;
    }

    if (!result) {
      if (result = _checkNextArgForResultType(args, index)) {
        continue;
      }
    }

    if (!looseTags) {
      if (looseTags = _checkNextArgsForLooseTags(args, index)) {
        continue;
      }
    }

    if (!filters) {
      const results = _checkNextArgsForLooseFilters<TDexEntry>(args, index);
      if (results) {
        filters = [...results];
        if (looseTags) {
          filters = _addLooseTagsToExistingFilters(filters, looseTags, options.defaultFilterType)
          looseTags = undefined;
        }
          
        break;
      }
    }

    throw new InvalidQueryParamError(args[0], index[0]);
  }

  if (looseTags) {
    if (!filters) {
      filters = [];
    }

    filters.unshift({
      [options.defaultFilterType]: {
        tags: looseTags
      }
    } as any)
  }

  if (!filters) {
    throw new InvalidQueryParamError([...arguments].slice(1).join(", "), "...args", "Could not process provided query function arguments into valid filters.");
  }

  return { filters: normalizeFilters(filters), result };
}

/** @internal */
function _addQueryOptionsToFilters<TDexEntry extends Entry>(
  options: {
    filters?: XQueryFilter<TDexEntry>[] | XQueryFilter<TDexEntry>,
    result?: ResultType
  },
  currentFilters: XQueryFilter<TDexEntry>[] | undefined,
  currentResult: ResultType | undefined,
  looseTags: Iterable<Tag> | undefined,
  defaultFilterType: 'or' | 'and'
): {filters: XQueryFilter<TDexEntry>[] | undefined, result: ResultType | undefined} {
  if (options.filters) {
    if (!currentFilters) {
      currentFilters = [];
    }

    if (isArray(options.filters)) {
      options.filters.forEach(f =>
        currentFilters!.push(f));
    } else {
      currentFilters.push(options.filters);
    }
  }

  // for replacing the first filter with a combo of the first provided filter and the first set of tags.
  if (looseTags) {
    currentFilters = _addLooseTagsToExistingFilters<TDexEntry>(currentFilters, looseTags, defaultFilterType);
  }

  if (options.result) {
    return {filters: currentFilters, result: options.result};
  }

  return { filters: currentFilters, result: currentResult };
}

function _addLooseTagsToExistingFilters<TDexEntry extends Entry>(currentFilters: XQueryFilter<TDexEntry>[] | undefined, looseTags: Iterable<Tag>, defaultFilterType: 'or' | 'and'): XQueryFilter<TDexEntry>[]  {
  if (currentFilters && currentFilters.length) {
    const cancelParam
      = (currentFilters[0].and as FilterParamObject<TDexEntry>)?.tag
      || (currentFilters[0].and as FilterParamObject<TDexEntry>)?.tags
      || (currentFilters[0].or as FilterParamObject<TDexEntry>)?.tag
      || (currentFilters[0].or as FilterParamObject<TDexEntry>)?.tags
      || (currentFilters[0].not as FilterParamObject<TDexEntry>)?.tag
      || (currentFilters[0].not as FilterParamObject<TDexEntry>)?.tags;

    if (cancelParam === undefined) {
      if (currentFilters[0].and) {
        if (currentFilters[0].and === true) {
          if (currentFilters[0].not) {
            (currentFilters[0].not as FilterParamObject<TDexEntry>).tags = looseTags;
          } else {
            currentFilters[0] = { and: { tags: looseTags } };
          }
        } else {
          (currentFilters[0].and as FilterParamObject<TDexEntry>).tags = looseTags;
        }
      } else {
        if (currentFilters[0].or === true) {
          if (currentFilters[0].not) {
            (currentFilters[0].not as FilterParamObject<TDexEntry>).tags = looseTags;
          } else {
            currentFilters[0] = { or: { tags: looseTags } };
          }
        } else if (currentFilters[0].or) {
          (currentFilters[0].or as FilterParamObject<TDexEntry>).tags = looseTags;
        } else if (currentFilters[0].not) {
          if (currentFilters[0].not === true) {
            currentFilters[0] = { not: { tags: looseTags } };
          } else {
            (currentFilters[0].not as FilterParamObject<TDexEntry>).tags = looseTags;
          }
        }
      }
    } else {
      currentFilters.unshift({
        [defaultFilterType]: {
          tags: looseTags
        }
      } as any);
    }
  } else {
    if (!currentFilters) {
      currentFilters ??= [];
    }
    
    currentFilters.unshift({
      [defaultFilterType]: {
        tags: looseTags
      }
    } as any);
  }

  return currentFilters;
}

function _checkNextArgForResultType(args: any[], index: [number]): ResultType | undefined {
  if (RESULT_TYPES.has(args[0])) {
    index[0]++;
    return args.shift();
  }
}

function _checkNextArgForOptions<TDexEntry extends Entry>(args: any[], index: [number]): {result?: ResultType, filters?: (XQueryFilter<TDexEntry> | XQueryFilter<TDexEntry>[]) } | undefined {
  if (isObject(args[0])) {
    if (args[0].hasOwnProperty("result") || args[0].hasOwnProperty("filters")) {
      index[0]++;
      return args.shift();
    } else if (isEmptyObject(args[0])) {
      index[0]++;
      return args.shift();
    }
  }
}

function _checkNextArgsForLooseTags(args: any[], index: [number]): Iterable<Tag> | undefined {
  if (isNonStringIterable(args[0])) {
    if (isTag(first(args[0]))) {
      index[0]++;
      return args.shift();
    }
  }
  
  if (isTag(args[0])) {
    const tags: Tag[] = [];
    while (isTag(args[0])) {
      index[0]++;
      tags.push(args.shift());
    }

    return tags;
  }
  
  return undefined;
}

function _checkNextArgsForLooseFilters<TDexEntry extends Entry>(args: any[], index: [number]): Iterable<XQueryFilter<TDexEntry>> | undefined {
  if (isNonStringIterable(args[0])) {
    if (isObject(first(args[0]))) {
      index[0]++;
      return args.shift();
    }
  }
  
  if (isFilter(args[0])) {
    const filters: XQueryFilter<TDexEntry>[] = [args.shift()];
    while (isFilter(args[0])) {
      index[0]++;
      filters.push(args.shift());
    }

    return filters;
  }
  
  return undefined;
}

//#endregion
