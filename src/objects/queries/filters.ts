import Loop from "../../utilities/iteration";
import Check from "../../utilities/validators";
import { InvalidQueryParamError } from "../errors";
import { IReadOnlyDex } from "../dexes/readonly";
import { Entry } from '../subsets/entries'
import { HashKey, HashKeyOrKeys } from "../subsets/hashes";
import { Tag, TagOrTags } from "../subsets/tags";
import { ResultType, RESULT_TYPES } from "./results";

/**
 * Filters for a query.
 * (normalized)
 */
export type Filter<TDexEntry extends Entry>
  = Filters.And<TDexEntry> | Filters.Or<TDexEntry>;

namespace Filters {
  //#region Normalized

  export type Filter<TDexEntry extends Entry>
    = Filters.And<TDexEntry> | Filters.Or<TDexEntry>;

  export type Logic<TDexEntry extends Entry> = {
    where?: Matcher<TDexEntry>
    // TODO: ignore function can also go in here.
  } | Matcher<TDexEntry>

  export interface Matcher<TDexEntry extends Entry>
    extends Loop.IBreakable<[
      entry: TDexEntry,
      tags: Set<Tag>,
      index: number,
      dex: IReadOnlyDex<TDexEntry>,
      args: Filter<TDexEntry>,
      ...rest: any
    ], boolean> { };

  export type Or<TDexEntry extends Entry> = {
    /**
     * X or Y or Z
     */
    or: Params<TDexEntry>;
    not?: true | Params<TDexEntry>;
    and?: never;
  };

  export type And<TDexEntry extends Entry> = {
    /**
     * X and Y and Z
     */
    and: Params<TDexEntry>
    not?: true | Params<TDexEntry>,
    or?: never
  };

  export type Params<TDexEntry extends Entry>
    = ForTags & ForLogic<TDexEntry> & ForKeys;

  export type ForKeys = {
    hashes: Set<HashKey> | undefined
  }

  export type ForTags = {
    tags: Set<Tag> | undefined,
  }

  export type ForLogic<TDexEntry extends Entry> = {
    logic: Logic<TDexEntry>[] | undefined
  }

  //#endregion

  //#region Extended for Input

  export type XFilter<TDexEntry extends Entry>
    = XAnd<TDexEntry>
    | XOr<TDexEntry>
    | Filter<TDexEntry>;

  export type XAnd<TDexEntry extends Entry> = {
    /**
     * X and Y and Z
     */
    and: XParams<TDexEntry>
    not?: true | XParams<TDexEntry>,
    or?: never
  } | {
    /**
     * X and Y and Z
     */
    and: true
    not: XParams<TDexEntry>,
    or?: never
  };

  export type XOr<TDexEntry extends Entry> = {
    /**
     * X or Y or Z
     */
    or: XParams<TDexEntry>;
    not?: true | XParams<TDexEntry>;
    and?: never;
  } | {
    /**
     * X or Y or Z
     */
    or?: true | XParams<TDexEntry>
    not: XParams<TDexEntry> | boolean,
    and?: never
  };

  export type XParams<TDexEntry extends Entry> =
    | ParamsArray<TDexEntry>
    | ParamsObject<TDexEntry>;

  export type ParamsArray<TDexEntry extends Entry>
    = Array<Tag | Logic<TDexEntry>>;

  export type ParamsObject<TDexEntry extends Entry>
    = XForTags
    & XForLogic<TDexEntry>
    & XForKeys;

  export type XForKeys = {
    hash?: HashKey;
    hashes?: HashKeyOrKeys;
    key?: HashKey;
    keys?: HashKeyOrKeys;
  };

  export type XForTags = {
    tags?: TagOrTags;
    tag?: Tag
  };

  export type XForLogic<TDexEntry extends Entry> = {
    filter?: Logic<TDexEntry>,
    filters?: Logic<TDexEntry> | Logic<TDexEntry>[],
    // TODO: implement these aliases.:
    logic?: Logic<TDexEntry> | Logic<TDexEntry>[],
    when?: Logic<TDexEntry> | Logic<TDexEntry>[],
    where?: Logic<TDexEntry> | Logic<TDexEntry>[],
  };

  //#endregion

  //#region Utility

  /**
   * Used to convert input query filters to their normalized version
   */
  export function normalize<TDexEntry extends Entry>(
    inputFilters: XFilter<TDexEntry>[]
  ): Filter<TDexEntry>[] {
    return inputFilters.map(filter => {
      const and = !!filter.and;
      const normalized: Filter<TDexEntry>
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
      if (Check.isArray(filter)) {
        for (const item of filter as (Tag | Logic<TDexEntry>)[]) {
          if (Check.isObject(item) || Check.isFunction(item)) {
            filterValues.logic ??= [];
            filterValues.logic.push(item as Logic<TDexEntry>);
          } else {
            filterValues.tags ??= new Set<Tag>();
            filterValues.tags.add(item as Tag);
          }
        }
      } else if (Check.isObject(filter)) {
        const current: ParamsObject<TDexEntry>
          = and
            ? filter.and
            : (typeof filter.or !== 'boolean'
              ? filter.or
              : filter.not) as any;

        if (current.filters) {
          if (Check.isArray(current.filters)) {
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
          filterValues.hashes = new Set(Check.isObject(current.hashes)
            ? current.hashes
            : [current.hashes]);
          if (current.keys) {
            filterValues.hashes = new Set();
            Check.isNonStringIterable(current.keys)
              ? Loop.forEach(current.keys, key => filterValues.hashes!.add(key))
              : filterValues.hashes.add(current.keys);
          }
        } else {
          if (current.keys) {
            filterValues.hashes = new Set(Check.isObject(current.keys)
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
          filterValues.tags = new Set(Check.isObject(current.tags)
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
  export function negate<TDexEntry extends Entry>(filters: Filter<TDexEntry>[]) {
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
  export function processFromArgs<TDexEntry extends Entry>(
    options: {
      defaultFilterType: 'or' | 'and'
    },
    ...args: any[]
  ): { filters: Filter<TDexEntry>[], result: ResultType | undefined } {
    let filters: XFilter<TDexEntry>[] | undefined;
    let result: ResultType | undefined;
    let looseTags: Iterable<Tag> | undefined;

    let index: [number] = [0];
    while (args.length) {
      let filterOptions: { result?: ResultType, filters?: (XFilter<TDexEntry> | XFilter<TDexEntry>[]) } | undefined;
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

    return { filters: normalize(filters), result };
  }

  //#region Internal

  /** @internal */
  function _addQueryOptionsToFilters<TDexEntry extends Entry>(
    options: {
      filters?: XFilter<TDexEntry>[] | XFilter<TDexEntry>,
      result?: ResultType
    },
    currentFilters: XFilter<TDexEntry>[] | undefined,
    currentResult: ResultType | undefined,
    looseTags: Iterable<Tag> | undefined,
    defaultFilterType: 'or' | 'and'
  ): { filters: XFilter<TDexEntry>[] | undefined, result: ResultType | undefined } {
    if (options.filters) {
      if (!currentFilters) {
        currentFilters = [];
      }

      if (Check.isArray(options.filters)) {
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
      return { filters: currentFilters, result: options.result };
    }

    return { filters: currentFilters, result: currentResult };
  }

  /** @internal */
  function _addLooseTagsToExistingFilters<TDexEntry extends Entry>(currentFilters: XFilter<TDexEntry>[] | undefined, looseTags: Iterable<Tag>, defaultFilterType: 'or' | 'and'): XFilter<TDexEntry>[] {
    if (currentFilters && currentFilters.length) {
      const cancelParam
        = (currentFilters[0].and as ParamsObject<TDexEntry>)?.tag
        || (currentFilters[0].and as ParamsObject<TDexEntry>)?.tags
        || (currentFilters[0].or as ParamsObject<TDexEntry>)?.tag
        || (currentFilters[0].or as ParamsObject<TDexEntry>)?.tags
        || (currentFilters[0].not as ParamsObject<TDexEntry>)?.tag
        || (currentFilters[0].not as ParamsObject<TDexEntry>)?.tags;

      if (cancelParam === undefined) {
        if (currentFilters[0].and) {
          if (currentFilters[0].and === true) {
            if (currentFilters[0].not) {
              (currentFilters[0].not as ParamsObject<TDexEntry>).tags = looseTags;
            } else {
              currentFilters[0] = { and: { tags: looseTags } };
            }
          } else {
            (currentFilters[0].and as ParamsObject<TDexEntry>).tags = looseTags;
          }
        } else {
          if (currentFilters[0].or === true) {
            if (currentFilters[0].not) {
              (currentFilters[0].not as ParamsObject<TDexEntry>).tags = looseTags;
            } else {
              currentFilters[0] = { or: { tags: looseTags } };
            }
          } else if (currentFilters[0].or) {
            (currentFilters[0].or as ParamsObject<TDexEntry>).tags = looseTags;
          } else if (currentFilters[0].not) {
            if (currentFilters[0].not === true) {
              currentFilters[0] = { not: { tags: looseTags } };
            } else {
              (currentFilters[0].not as ParamsObject<TDexEntry>).tags = looseTags;
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

  function _checkNextArgForOptions<TDexEntry extends Entry>(args: any[], index: [number]): { result?: ResultType, filters?: (XFilter<TDexEntry> | XFilter<TDexEntry>[]) } | undefined {
    if (Check.isObject(args[0])) {
      if (args[0].hasOwnProperty("result") || args[0].hasOwnProperty("filters")) {
        index[0]++;
        return args.shift();
      } else if (Check.isEmptyObject(args[0])) {
        index[0]++;
        return args.shift();
      }
    }
  }

  function _checkNextArgsForLooseTags(args: any[], index: [number]): Iterable<Tag> | undefined {
    if (Check.isNonStringIterable(args[0])) {
      if (Check.isTag(Loop.first(args[0]))) {
        index[0]++;
        return args.shift();
      }
    }
  
    if (Check.isTag(args[0])) {
      const tags: Tag[] = [];
      while (Check.isTag(args[0])) {
        index[0]++;
        tags.push(args.shift());
      }

      return tags;
    }
  
    return undefined;
  }

  /** @internal */
  function _checkNextArgsForLooseFilters<TDexEntry extends Entry>(args: any[], index: [number]): Iterable<XFilter<TDexEntry>> | undefined {
    if (Check.isNonStringIterable(args[0])) {
      if (Check.isObject(Loop.first(args[0]))) {
        index[0]++;
        return args.shift();
      }
    }
  
    if (Check.isFilter(args[0])) {
      const filters: XFilter<TDexEntry>[] = [args.shift()];
      while (Check.isFilter(args[0])) {
        index[0]++;
        filters.push(args.shift());
      }

      return filters;
    }
  
    return undefined;
  }

  //#endregion

  //#endregion
}

export default Filters;