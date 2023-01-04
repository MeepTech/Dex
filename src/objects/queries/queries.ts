import { isArray, isFunction, isObject, isTag } from "../../utilities/validators";
import { Entry } from "../subsets/entries";
import { Tag, TagOrTags } from "../subsets/tags";
import { IReadOnlyDex } from "../idex";
import { HashKey } from "../subsets/hashes";
import { Result, ResultType } from "./results";
import {
  AndFilter,
  OrFilter,
  QueryFilter,
  XQueryFilter,
  MatchFilter,
  negateFilters,
  normalizeFilters
} from "./filters";
import Dex, { InvalidQueryParamError } from "../dex";
import { Break, IBreakable } from "../../utilities/iteration";

/**
 * 
 */
export type Query<
  TValue,
  TResult extends ResultType = ResultType,
  TDexEntry extends Entry = TValue extends Entry ? TValue : Entry
> = SpecificQuery<TValue, TResult, TDexEntry>
  | FullQuery<TValue, TResult, TDexEntry>
  | FirstableQuery<TValue, Exclude<TResult, ResultType.First>, TDexEntry>;

/**
 * A query that just returns one type of value
 */
export interface SpecificQuery<
  TValue,
  TResult extends ResultType,
  TDexEntry extends Entry = TValue extends Entry ? TValue : Entry
> extends IQueryBase<TValue, TResult, TDexEntry> {
  not: SpecificNotQuery<TValue, TResult, TDexEntry>;
}

/**
 * A NOT query that just returns one type of value
 */
export interface SpecificNotQuery<
  TValue,
  TResult extends ResultType,
  TDexEntry extends Entry = TValue extends Entry ? TValue : Entry
> extends IQueryBase<TValue, TResult, TDexEntry> {}

/**
 * A query that can return many different types, and has more options than a specific query
 */
export interface FullQuery<
  TValue,
  TDefaultResult extends ResultType,
  TDexEntry extends Entry = TValue extends Entry ? TValue : Entry
> extends IQueryBase<TValue, TDefaultResult, TDexEntry> {
  not: FullNotQuery<TValue, TDefaultResult, TDexEntry>;

  <TResultType extends ResultType = TDefaultResult>(
    tag: Tag,
    options: {
      filters?: XQueryFilter<TDexEntry>[] | XQueryFilter<TDexEntry>,
      result: TResultType
    }
  ): Result<TValue, TResultType, TDexEntry>

  <TResultType extends ResultType>(
    tag: Tag,
    result: TResultType
  ): Result<TValue, TResultType, TDexEntry>

  <TResultType extends ResultType = TDefaultResult>(
    tags: TagOrTags,
    options: {
      filters?: XQueryFilter<TDexEntry>[] | XQueryFilter<TDexEntry>,
      result: TResultType
    }
  ): Result<TValue, TResultType, TDexEntry>

  <TResultType extends ResultType>(
    tags: TagOrTags,
    result: TResultType
  ): Result<TValue, TResultType, TDexEntry>

  <TResultType extends ResultType>(
    result: TResultType,
    tag: Tag
  ): Result<TValue, TResultType, TDexEntry>

  <TResultType extends ResultType>(
    result: TResultType,
    ...tags: Tag[]
  ): Result<TValue, TResultType, TDexEntry>

  <TResultType extends ResultType>(
    result: TResultType,
    ...filters: XQueryFilter<TDexEntry>[]
  ): Result<TValue, TResultType, TDexEntry>

  <TResultType extends ResultType>(
    ...tagsAndResult: [...Tag[], TResultType]
  ): Result<TValue, TResultType, TDexEntry>

  <TResultType extends ResultType = TDefaultResult>(
    filter: XQueryFilter<TDexEntry>,
    result: TResultType
  ): Result<TValue, TResultType, TDexEntry>

  <TResultType extends ResultType = TDefaultResult>(
    filters: XQueryFilter<TDexEntry>[],
    result: TResultType
  ): Result<TValue, TResultType, TDexEntry>

  <TResultType extends ResultType>(
    ...filtersAndResult: [...XQueryFilter<TDexEntry>[], TResultType]
  ): Result<TValue, TResultType, TDexEntry>
}

/**
 * A query that can return many different types, and has more options than a specific query
 */
export interface FullNotQuery<
  TValue,
  TResult extends ResultType,
  TDexEntry extends Entry = TValue extends Entry ? TValue : Entry
> extends FullQuery<TValue, TResult, TDexEntry> {}

/**
 * Represents a special kind of query that has a first parameter as well
 */
export interface FirstableQuery<
  TValue,
  TDefaultResult extends Exclude<ResultType, ResultType.First>,
  TDexEntry extends Entry = TValue extends Entry ? TValue : Entry
> extends SpecificQuery<TValue, TDefaultResult, TDexEntry> {
  first: SpecificQuery<TValue, ResultType.First, TDexEntry>;
}

interface IQueryBase<
  TValue,
  TResult extends ResultType,
  TDexEntry extends Entry = TValue extends Entry ? TValue : Entry
> {
  (
    tag: Tag,
    options?: {
      filters?: XQueryFilter<TDexEntry>[] | XQueryFilter<TDexEntry>
    }
  ): Result<TValue, TResult, TDexEntry>

  (
    tags: TagOrTags,
    options?: {
      filters?: XQueryFilter<TDexEntry>[] | XQueryFilter<TDexEntry>
    }
  ): Result<TValue, TResult, TDexEntry>

  (filter: XQueryFilter<TDexEntry>)
    : Result<TValue, TResult, TDexEntry>

  (filters: XQueryFilter<TDexEntry>[])
    : Result<TValue, TResult, TDexEntry>

  (...filters: XQueryFilter<TDexEntry>[])
    : Result<TValue, TResult, TDexEntry>
}

//#region Internal

const testQuery: FullQuery<{}, ResultType.Array, string> = {} as any;

const _1 = testQuery(["a", "e", 1, 5]);
const _2 = testQuery(["a", "e", 1, 5], ResultType.Dex);
const _3 = testQuery(ResultType.Set, { and: ["one", "two"] });
const _3_1 = testQuery(ResultType.First, { and: ["one", "two"] });
const _4 = testQuery({ and: ["one", "two"] }, ResultType.First);
const _5 = testQuery({ and: ["one", "two"] }, { not: { hashes: ["ID:KW$#kj3tijergwigg"] } });
const _6 = testQuery({ not: { hashes: ["ID:KW$#kj3tijergwigg"] } });

/** @internal */
type QueryFilterOnCompleteOverrideFunction = ((matches: HashKey[]) => void);

/** @internal */
type QueryFilterOnCompleteFunctions = {
  onEmpty?: QueryFilterOnCompleteOverrideFunction;
  onEmptyNot?: QueryFilterOnCompleteOverrideFunction;
  onAnd?: QueryFilterOnCompleteOverrideFunction;
  onAndNot?: QueryFilterOnCompleteOverrideFunction;
  onOr?: QueryFilterOnCompleteOverrideFunction;
  onOrNot?: QueryFilterOnCompleteOverrideFunction;
};

/** @internal */
type QueryFilterOnCompleteLogic
  = (QueryFilterOnCompleteOverrideFunction)
  | (QueryFilterOnCompleteFunctions
    & {
      /**
       * The default
       * (is executed at the end if provided)
       */
      onDefault?: (matches: HashKey[]) => void;
    });

/** @internal */
export const FullQueryConstructor = <
  TValue,
  TDefaultResult extends ResultType,
  TDexEntry extends Entry
>(
  dex: IReadOnlyDex<TDexEntry>,
  defaultResult: TDefaultResult,
  options?: {
    transform?: ((hash: HashKey) => TValue) | false,
    modifyFilters?: (filters: QueryFilter<TDexEntry>[]) => void,
    excludeNot?: boolean,
    allOnNoParams?: boolean
  }
): FullQuery<TValue, TDefaultResult, TDexEntry> => {
  const query = function <
    TQValue extends TValue,
    TResultType extends TDefaultResult = TDefaultResult,
    TQDexEntry extends Entry = TDexEntry
  >(
    this: IReadOnlyDex<TQDexEntry>,
    ...args: any
  ): Result<TQValue, TResultType, TQDexEntry> {
    // sort params to filters
    const {
      filters,
      result: resultType = defaultResult
    } = _convertQueryParamsToFilters<TQDexEntry>(...args);
    options?.modifyFilters?.(filters as QueryFilter<TDexEntry>[]);

    // switch based on requested return type.
    options ??= {};
    let results: Result<TQValue, typeof resultType, TQDexEntry>;
    let collectMatches: (matches: Set<HashKey>) => void;
    let transform = options?.transform
      ?? (hash => dex.get(hash!));

    switch (resultType) {
      // array
      case ResultType.Array: {
        results = [];

        collectMatches = transform !== false
          ? hashes => (results = ([...hashes] as TQValue[]))
          : hashes =>
            hashes.forEach(hash => (results as TQValue[]).push((transform as any)(hash))
          );

        break;
      }
      // first
      case ResultType.First: {
        // first only logic
        let result: TQValue | HashKey | undefined = _logicFirstQuery<TQDexEntry>(this, filters);
        if (result !== undefined && transform !== false) {
          result = transform(result as HashKey) as TQValue | HashKey;
        }

        return result as Result<TQValue, TResultType, TQDexEntry>;
      }
      // set
      case ResultType.Set: {
        results = new Set<TQValue>();
        collectMatches = transform !== false
          ? hashes => (results = hashes as Set<TQValue>)
          : hashes =>
            hashes.forEach(hash => (results as Set<TQValue>).add((transform as any)(hash))
          );

        break;
      }
      // dex
      case ResultType.Dex: {
        results = new Dex<TQDexEntry>();

        collectMatches = hashes => (results as Dex<TQDexEntry>)
          .copy
          .from(this, hashes);

        break;
      }
      // vauge
      default:
      case ResultType.Vauge:
        throw new InvalidQueryParamError(resultType, "resultType");
    }

    // for no passed in params
    if (options?.allOnNoParams && !args?.length) {
      const hashes = new Set<HashKey>(dex.hashes);
      collectMatches(hashes);

      return results as Result<TQValue, TResultType, TQDexEntry>;
    }

    // multi-result logic
    const hashes = _logicMultiQuery(this, filters);
    collectMatches(hashes);

    return results as Result<TQValue, TResultType, TQDexEntry>;
  } as FullQuery<TValue, TDefaultResult, TDexEntry>;

  if (!options?.excludeNot) {
    query.not = FullQueryConstructor<TValue, TDefaultResult, TDexEntry>(dex, defaultResult, {
      ...options,
      excludeNot: true,
      // not all filters
      modifyFilters: negateFilters
    });
  }
  
  return query.bind(dex);
};

/** @internal */
export const SpecificQueryConstructor = <
  TValue,
  TResult extends ResultType,
  TDexEntry extends Entry = TValue extends Entry ? TValue : Entry
>(
  dex: IReadOnlyDex<TDexEntry>,
  resultType: TResult,
  options?: {
    transform?: ((hash: HashKey) => TValue) | false,
    modifyFilters?: (filters: QueryFilter<TDexEntry>[]) => void;
    excludeNot?: boolean,
    allOnNoParams?: boolean
  }
): SpecificQuery<TValue, TResult, TDexEntry> => {
  let transform
    = options?.transform
    ?? (hash => dex.get(hash!) as any as TValue);

  let query: SpecificQuery<TValue, TResult, TDexEntry>;
  
  switch (resultType) {
    // array
    case ResultType.Array: {
      query = function <TQValue extends TValue, TQDexEntry extends TDexEntry>(
        this: IReadOnlyDex<TQDexEntry>,
        ...args: any
      ): TQValue[] {
        const {
          filters
        } = _convertQueryParamsToFilters<TQDexEntry>(...args);
        options?.modifyFilters?.(filters as QueryFilter<TDexEntry>[]);

        const hashes = (options?.allOnNoParams && !args?.length) 
          ? new Set<HashKey>(dex.hashes)
          : _logicMultiQuery<TQDexEntry>(this, filters);

        if (transform === false) {
          return [...hashes] as TQValue[];
        }

        const results: TQValue[] = [];
        hashes.forEach(hash =>
          (results as TQValue[]).push((transform as any)(hash))
        );

        return results;
      }.bind(dex) as SpecificQuery<TValue, ResultType.Array, TDexEntry> as SpecificQuery<TValue, TResult, TDexEntry>;
      break;
    }
    // first
    case ResultType.First: {
      query = function <TQValue extends TValue, TQDexEntry extends TDexEntry>(
        this: IReadOnlyDex<TQDexEntry>,
        ...args: any
      ): TQValue | undefined {
        const {
          filters
        } = _convertQueryParamsToFilters<TQDexEntry>(...args);
        options?.modifyFilters?.(filters as QueryFilter<TDexEntry>[]);

        const result = _logicFirstQuery<TQDexEntry>(this, filters);
        if (result !== undefined && transform !== false) {
          return transform(result) as TQValue;
        }

        return result as TQValue | undefined;
      }.bind(dex) as SpecificQuery<TValue, ResultType.First, TDexEntry> as SpecificQuery<TValue, TResult, TDexEntry>;
      break;
    }
    // set
    case ResultType.Set: {
      query = function <TQValue extends TValue, TQDexEntry extends TDexEntry>(
        this: IReadOnlyDex<TQDexEntry>,
        ...args: any
      ): Set<TQValue> {
        const {
          filters
        } = _convertQueryParamsToFilters<TQDexEntry>(...args);
        options?.modifyFilters?.(filters as QueryFilter<TDexEntry>[]);

        const hashes = (options?.allOnNoParams && !args?.length) 
          ? new Set<HashKey>(dex.hashes)
          : _logicMultiQuery(this, filters);

        if (transform === false) {
          return hashes as Set<TQValue>;
        }

        const results: Set<TQValue> = new Set();
        hashes.forEach(hash =>
          (results as Set<TQValue>).add((transform as any)(hash))
        );

        return results;
      }.bind(dex) as SpecificQuery<TValue, ResultType.Set, TDexEntry> as SpecificQuery<TValue, TResult, TDexEntry>;
      break;
    }
    // dex
    case ResultType.Dex: {
      query = function <TQValue extends TValue, TQDexEntry extends TDexEntry>(
        this: IReadOnlyDex<TQDexEntry>,
        ...args: any
      ): Dex<TQDexEntry> {
        const {
          filters
        } = _convertQueryParamsToFilters<TQDexEntry>(...args);
        options?.modifyFilters?.(filters as QueryFilter<TDexEntry>[]);

        const hashes = (options?.allOnNoParams && !args?.length) 
          ? new Set<HashKey>(dex.hashes)
          : _logicMultiQuery(this, filters);

        const results = new Dex<TQDexEntry>();
        results.copy.from(dex as IReadOnlyDex<TDexEntry> as any as IReadOnlyDex<TQDexEntry>, hashes);

        return results;
      }.bind(dex) as SpecificQuery<TValue, ResultType.Dex, TDexEntry> as SpecificQuery<TValue, TResult, TDexEntry>;
      break;
      /*results = new Dex<TQDexEntry>();

      collectMatches = hashes => (results as Dex<TQDexEntry>)
        .copy
        .from(this, hashes)

      /*overrides = {
        onEmptyNot: () => (results as Dex<TDexEntry>)
          .copy
          .from(this, { tags: this.tags }),
        onEmpty: () => (results as Dex<TDexEntry>)
          .copy
          .from(this, { tags: [] }),
        onOr: tags => (results as Dex<TDexEntry>)
          .copy
          .from(this, { tags }),
        ...overrides
      }*/
    }
    // vauge
    case ResultType.Vauge:
    default:
      throw new InvalidQueryParamError(resultType, "resultType")
  }

  if (!options?.excludeNot) {
    query.not = SpecificQueryConstructor<TValue, TResult, TDexEntry>(dex, resultType, {
      ...options,
      excludeNot: true,
      // not all filters
      modifyFilters: negateFilters
    });
  }

  return query;
}

/** @internal */
export const FirstableQueryConstructor = <
  TValue,
  TResult extends Exclude<ResultType, ResultType.First>,
  TDexEntry extends Entry = TValue extends Entry ? TValue : Entry
>(
  dex: IReadOnlyDex<TDexEntry>,
  resultType: TResult,
  options?: {
    transform?: ((hash: HashKey) => TValue) | false,
    allOnNoParams?: boolean
  }
) => {
  const query = SpecificQueryConstructor<TValue, TResult, TDexEntry>(dex, resultType, options) as FirstableQuery<TValue, TResult, TDexEntry>;
  query.first = SpecificQueryConstructor<TValue, ResultType.First, TDexEntry>(dex, ResultType.First, options);

  return query;
}

/** @internal */
function _convertQueryParamsToFilters<TDexEntry extends Entry>(
  ...args: any[]
): { filters: QueryFilter<TDexEntry>[], result: ResultType | undefined } {
  let filters: XQueryFilter<TDexEntry>[] = [];
  let result: ResultType | undefined;

  if (args[0] in ResultType) {
    // 0: result
    result = args.shift();

    if (isArray(args[0])) {
      const tagOrFilters: Tag[] | XQueryFilter<TDexEntry>[] = args[0];
      // 1: filters
      if (isObject(tagOrFilters[0])) {
        filters = tagOrFilters as XQueryFilter<TDexEntry>[];
      } // 1: tags
      else {
        filters.push(
          { or: { tags: tagOrFilters as Tag[] } }
        )
      }
    } else {
      // ...1: filters:
      if (isObject(args[0])) {
        filters = args as XQueryFilter<TDexEntry>[];
      } // ...1: tags:
      else if (args[0] !== undefined) {
        filters.push({
          or: { tags: args as Tag[] }
        });
      }
    }

    return { filters: normalizeFilters(filters), result };
  } else if (isArray(args[0])) {
    const tagOrFilters: Tag[] | XQueryFilter<TDexEntry>[] = args[0];
    // 0: filters
    if (isObject(tagOrFilters[0])) {
      filters = tagOrFilters as XQueryFilter<TDexEntry>[];
    } // 0: tags
    else {
      filters.push(
        { or: { tags: tagOrFilters as Tag[] } }
      )
    }

    // 1: result
    if (args[1] in ResultType) {
      result = args[1];
    } // 1: options
    else if (isObject(args[1])) {
      result = _addQueryOptionsToFilters<TDexEntry>(args[1], filters, result);
    }

    return { filters: normalizeFilters(filters), result };
  } else if (isObject(args[0])) {
    // 0: tags
    if (args[0] instanceof Set) {
      filters.push(
        { or: { tags: args[0] as Set<Tag> } }
      )

      // 1: result
      if (args[1] in ResultType) {
        result = args[1];
      } // 1: options
      else if (isObject(args[1])) {
        result = _addQueryOptionsToFilters<TDexEntry>(args[1], filters, result);
      }

      return { filters: normalizeFilters(filters), result };
    } else {
      // 0: options:
      if (args[0].hasOwnProperty("result") || args[0].hasOwnProperty("filters")) {
        result = _addQueryOptionsToFilters<TDexEntry>(args[0], filters, result);

        return { filters: normalizeFilters(filters), result };
      } // 0: filter
      else {
        filters.push(args.shift() as XQueryFilter<TDexEntry>);

        // 1: result
        if (args[0] as any in ResultType) {
          result = args[0] as any as ResultType;
        } else if (isObject(args[0])) {
          (args as XQueryFilter<TDexEntry>[])
            .forEach(f =>
              filters.push(f));
        }

        return { filters: normalizeFilters(filters), result };
      }
    }
  } // 0: tag
  else if (isTag(args[0])) {// 1: result
    if (args[1] in ResultType) {
      filters.push(
        { or: { tag: args[0] as Tag } }
      )
      result = args[1];
    } // 1: options:
    else if (isObject(args[1])) {
      filters.push(
        { or: { tag: args[0] as Tag } }
      );
      result = _addQueryOptionsToFilters<TDexEntry>(args[1], filters, result);
    } // ...1: tags:
    else if (args[1] !== undefined) {
      filters.push({
        or: { tags: args as Tag[] }
      });
    }

    return { filters: normalizeFilters(filters), result };
  }
  else {
    throw new InvalidQueryParamError(args[0], 0);
  }
}

/** @internal */
function _addQueryOptionsToFilters<TDexEntry extends Entry>(
  options: {
    filters?: XQueryFilter<TDexEntry>[] | XQueryFilter<TDexEntry>,
    result?: ResultType
  },
  currentFilters: XQueryFilter<TDexEntry>[],
  currentResult: ResultType | undefined
): ResultType | undefined {
  if (options.filters) {
    if (isArray(options.filters)) {
      options.filters.forEach(f =>
        currentFilters.push(f));
    } else {
      currentFilters.push(options.filters);
    }
  }

  if (options.result) {
    return options.result;
  }

  return currentResult;
}

/** @internal */
export function _logicMultiQuery<TDexEntry extends Entry>(
  dex: IReadOnlyDex<TDexEntry>,
  filters: QueryFilter<TDexEntry>[]
): Set<HashKey> {
  let matches: Set<HashKey> = new Set();

  for (const filter of filters) {
    if (filter.and) {
      matches = _queryAllForAnd(dex, filter, matches);
    }
    else if (filter.not || filter.or) {
      matches = _queryAllForOr(dex, filter, matches);
    }
    else {
      throw new InvalidQueryParamError(filter, "filters");
    }
  }

  return matches;
}

/** @internal */
export function _logicFirstQuery<TDexEntry extends Entry>(
  dex: IReadOnlyDex<TDexEntry>,
  filters: QueryFilter<TDexEntry>[]
): HashKey | undefined {
  if (!filters.length) {
    return dex.entries.values.next().value;
  }

  let subset: Set<HashKey> | undefined = undefined;
  const firstableFilter = filters.shift()!;
  if (filters.length) {
    subset = _logicMultiQuery(dex, filters);
  }

  if (firstableFilter.and) {
    return _queryFirstForAnd(dex, firstableFilter, subset);
  }
  else if (firstableFilter.not || firstableFilter.or) {
    return _queryFirstForOr(dex, firstableFilter, subset);
  }
  else {
    throw new InvalidQueryParamError(firstableFilter, "filters[0]");
  }
}

// TODO: remove if not used
/** @internal */
function _spreadOnCompleteFunctionsFromLogic(onComplete: QueryFilterOnCompleteLogic): QueryFilterOnCompleteFunctions {
  var
    onEmpty: QueryFilterOnCompleteOverrideFunction = undefined!, onEmptyNot: QueryFilterOnCompleteOverrideFunction = undefined!, onAnd: QueryFilterOnCompleteOverrideFunction = undefined!, onAndNot: QueryFilterOnCompleteOverrideFunction = undefined!, onOr: QueryFilterOnCompleteOverrideFunction = undefined!, onOrNot: QueryFilterOnCompleteOverrideFunction = undefined!;

  if (isFunction(onComplete)) {
    var
      onEmpty = onComplete, onEmptyNot = onComplete, onAnd = onComplete, onAndNot = onComplete, onOr = onComplete, onOrNot = onComplete;
  } else {
    const onDefault = onComplete.onDefault!;
    var {
      onEmpty = onDefault, onEmptyNot = onDefault, onAnd = onDefault, onAndNot = onDefault, onOr = onDefault, onOrNot = onDefault
    } = onComplete;
  }
  return { onEmptyNot, onEmpty, onOrNot, onOr, onAndNot, onAnd };
}

/** @internal */
function _queryAllForOr<TDexEntry extends Entry>(
  dex: IReadOnlyDex<TDexEntry>,
  filter: OrFilter<TDexEntry>,
  subset?: Set<HashKey>
): Set<HashKey> {
  let results: Set<HashKey>;
  let toIgnore: Set<HashKey> | undefined;
  let withTags: Set<Tag> | undefined;
  let withoutTags: Set<Tag> | undefined;
  let isValidIfTrue: MatchFilter<TDexEntry>[] | undefined;
  let isValidIfFalse: MatchFilter<TDexEntry>[] | undefined;

  if (filter.not) {
    if (filter.not === true) {
      results = new Set();
      withTags = undefined;
      isValidIfTrue = undefined;
      toIgnore = filter.or.hashes;
      withoutTags = filter.or.tags;
      isValidIfFalse = filter.or.filters.map(filter => isFunction(filter) ? filter : filter.where!);
    } else {
      results = filter.or.hashes;
      withTags = filter.or.tags;
      isValidIfTrue = filter.or.filters.map(filter => isFunction(filter) ? filter : filter.where!);
      toIgnore = filter.not.hashes;
      withoutTags = filter.not.tags;
      isValidIfFalse = filter.not.filters.map(filter => isFunction(filter) ? filter : filter.where!);
    }
  } else {
    results = filter.or.hashes;
    withTags = filter.or.tags;
    isValidIfTrue = filter.or.filters.map(filter => isFunction(filter) ? filter : filter.where!);
  }

  let tagsToSearch: () => Iterable<Tag> = subset?.size ? null! : withTags?.size
    ? () => withTags!
    : () => dex.tags;

  // (tag || tag) & !(tag || tag)
  if (!subset?.size && withoutTags?.size) {
    const base = tagsToSearch;
    tagsToSearch = function* () {
      for (const tag in base()) {
        if (!withoutTags!.has(tag)) {
          yield tag;
        }
      }
    }
  }

  const isValid: MatchFilter<TDexEntry> | true
    = isValidIfTrue
      ? isValidIfFalse
        ? _orWithNotOr
        : _or
      : isValidIfFalse
        ? _notOr
        : true;

  let matcher = _buildOrMatcher<TDexEntry>(isValid, withoutTags);
  _matchAll<TDexEntry>(toIgnore, subset, results, matcher, dex, filter, tagsToSearch);

  if (toIgnore?.size) {
    toIgnore.forEach(e => results.delete(e));
  }

  return results;
}

/** @internal */
function _queryAllForAnd<TDexEntry extends Entry>(
  dex: IReadOnlyDex<TDexEntry>,
  filter: AndFilter<TDexEntry>,
  subset?: Set<HashKey>
): Set<HashKey> {
  let results: Set<HashKey>;
  let toIgnore: Set<HashKey> | undefined;
  let withTags: Set<Tag> | undefined;
  let withoutTags: Set<Tag> | undefined;
  let isValidIfTrue: MatchFilter<TDexEntry>[] | undefined;
  let isValidIfFalse: MatchFilter<TDexEntry>[] | undefined;

  if (filter.not) {
    if (filter.not === true) {
      results = new Set();
      withTags = undefined;
      isValidIfTrue = undefined;
      toIgnore = filter.and.hashes;
      withoutTags = filter.and.tags;
      isValidIfFalse = filter.and.filters.map(filter => isFunction(filter) ? filter : filter.where!);
    } else {
      results = filter.and.hashes;
      withTags = filter.and.tags;
      isValidIfTrue = filter.and.filters.map(filter => isFunction(filter) ? filter : filter.where!);
      toIgnore = filter.and.hashes;
      withoutTags = filter.and.tags;
      isValidIfFalse = filter.and.filters.map(filter => isFunction(filter) ? filter : filter.where!);
    }
  } else {
    results = filter.and.hashes;
    withTags = filter.and.tags;
    isValidIfTrue = filter.and.filters.map(filter => isFunction(filter) ? filter : filter.where!);
  }

  let tagsToSearch: () => Iterable<Tag> = subset?.size ? null! : withTags?.size
    ? () => [withTags?.entries().next().value as Tag]
    : () => dex.tags;

  const isValid: MatchFilter<TDexEntry> | true
    = isValidIfTrue
      ? isValidIfFalse
        ? _andWithNotAnd
        : _and
      : isValidIfFalse
        ? _notAnd
        : true;

  let matcher = _buildAndMatcher<TDexEntry>(isValid, withTags, withoutTags);
  _matchAll<TDexEntry>(toIgnore, subset, results, matcher, dex, filter, tagsToSearch);

  if (toIgnore?.size) {
    toIgnore.forEach(e => results.delete(e))
  }

  return results;
}

/** @internal */
function _queryFirstForOr<TDexEntry extends Entry>(
  dex: IReadOnlyDex<TDexEntry>,
  filter: OrFilter<TDexEntry>,
  subset?: Set<HashKey>
): HashKey | undefined {
  let toIgnore: Set<HashKey> | undefined;
  let withTags: Set<Tag> | undefined;
  let withoutTags: Set<Tag> | undefined;
  let isValidIfTrue: MatchFilter<TDexEntry>[] | undefined;
  let isValidIfFalse: MatchFilter<TDexEntry>[] | undefined;

  if (filter.not) {
    if (filter.not === true) {
      withTags = undefined;
      isValidIfTrue = undefined;
      toIgnore = filter.or.hashes;
      withoutTags = filter.or.tags;
      isValidIfFalse = filter.or.filters.map(filter => isFunction(filter) ? filter : filter.where!);
    } else {
      subset = filter.or.hashes;
      withTags = filter.or.tags;
      isValidIfTrue = filter.or.filters.map(filter => isFunction(filter) ? filter : filter.where!);
      toIgnore = filter.or.hashes;
      withoutTags = filter.or.tags;
      isValidIfFalse = filter.or.filters.map(filter => isFunction(filter) ? filter : filter.where!);
    }
  } else {
    subset = filter.or.hashes;
    withTags = filter.or.tags;
    isValidIfTrue = filter.or.filters.map(filter => isFunction(filter) ? filter : filter.where!);
  }

  let tagsToSearch: () => Iterable<Tag> = subset?.size ? null! : withTags?.size
    ? () => withTags!
    : () => dex.tags;

  // (tag || tag) & !(tag || tag)
  if (!subset?.size && withoutTags?.size) {
    const base = tagsToSearch;
    tagsToSearch = function* () {
      for (const tag in base()) {
        if (!withoutTags!.has(tag)) {
          yield tag;
        }
      }
    }
  }

  const isValid: MatchFilter<TDexEntry> | true
    = isValidIfTrue
      ? isValidIfFalse
        ? _orWithNotOr
        : _or
      : isValidIfFalse
        ? _notOr
        : true;

  let matcher = _buildOrMatcher<TDexEntry>(isValid, withoutTags);
  return _matchFirst<TDexEntry>(toIgnore, subset, matcher, dex, filter, tagsToSearch);
}

/** @internal */
function _queryFirstForAnd<TDexEntry extends Entry>(
  dex: IReadOnlyDex<TDexEntry>,
  filter: AndFilter<TDexEntry>,
  subset?: Set<HashKey>
): HashKey | undefined {
  let toIgnore: Set<HashKey> | undefined;
  let withTags: Set<Tag> | undefined;
  let withoutTags: Set<Tag> | undefined;
  let isValidIfTrue: MatchFilter<TDexEntry>[] | undefined;
  let isValidIfFalse: MatchFilter<TDexEntry>[] | undefined;

  if (filter.not) {
    if (filter.not === true) {
      withTags = undefined;
      isValidIfTrue = undefined;
      toIgnore = filter.and.hashes;
      withoutTags = filter.and.tags;
      isValidIfFalse = filter.and.filters.map(filter => isFunction(filter) ? filter : filter.where!);
    } else {
      subset = filter.and.hashes;
      withTags = filter.and.tags;
      isValidIfTrue = filter.and.filters.map(filter => isFunction(filter) ? filter : filter.where!);
      toIgnore = filter.and.hashes;
      withoutTags = filter.and.tags;
      isValidIfFalse = filter.and.filters.map(filter => isFunction(filter) ? filter : filter.where!);
    }
  } else {
    subset = filter.and.hashes;
    withTags = filter.and.tags;
    isValidIfTrue = filter.and.filters.map(filter => isFunction(filter) ? filter : filter.where!);
  }

  let tagsToSearch: () => Iterable<Tag> = subset?.size ? null! : withTags?.size
    ? () => [withTags?.entries().next().value as Tag]
    : () => dex.tags;

  const isValid: MatchFilter<TDexEntry> | true
    = isValidIfTrue
      ? isValidIfFalse
        ? _andWithNotAnd
        : _and
      : isValidIfFalse
        ? _notAnd
        : true;

  let matcher = _buildAndMatcher<TDexEntry>(isValid, withTags, withoutTags);
  return _matchFirst<TDexEntry>(toIgnore, subset, matcher, dex, filter, tagsToSearch);
}

/** @internal */
function _orWithNotOr<TDexEntry extends Entry>(e: TDexEntry, t: Set<Tag>, i: number, d: IReadOnlyDex<TDexEntry>, args: QueryFilter<TDexEntry>, isValidIfTrue: MatchFilter<TDexEntry>[], isValidIfFalse: MatchFilter<TDexEntry>[]): boolean | Break<boolean> | Break {
  let hasBroken: boolean = false;
  const result = _or(e, t, i, d, args, isValidIfTrue);
  if (result === true) {
    return true;
  }

  if (result instanceof Break) {
    if (result.hasReturn && result.return === true) {
      return result;
    }

    hasBroken = true;
  }

  const notResult = _notOr(e, t, i, d, args, isValidIfFalse);
  if (notResult === true) {
    return true;
  }

  if (notResult instanceof Break) {
    if (notResult.hasReturn && notResult.return === true) {
      return notResult;
    }

    hasBroken = true;
  }

  return hasBroken ? new Break(false) : false;
}

// (x | y | z)
/** @internal */
function _or<TDexEntry extends Entry>(e: TDexEntry, t: Set<Tag>, i: number, d: IReadOnlyDex<TDexEntry>, args: QueryFilter<TDexEntry>, isValidIfTrue: MatchFilter<TDexEntry>[]): boolean | Break<boolean> | Break {
  let hasBroken: boolean = false;
  for (const test of isValidIfTrue!) {
    const result = test(e, t, i, d, args);
    if (result instanceof Break) {
      // if any are true, return true. (if null break then return the null break)
      if (result.return || !result.hasReturn) {
        return result;
      }

      hasBroken = true;
    } else {
      // if any are true, return true.
      if (result) {
        return hasBroken ? new Break(true) : true;
      }
    }
  }

  // if none are true, return false.
  return hasBroken ? new Break(false) : false;
}

// !(x | y | z)
/** @internal */
function _notOr<TDexEntry extends Entry>(e: TDexEntry, t: Set<Tag>, i: number, d: IReadOnlyDex<TDexEntry>, args: QueryFilter<TDexEntry>, isValidIfFalse: MatchFilter<TDexEntry>[]): boolean | Break<boolean> | Break {
  let hasBroken: boolean = false;
  for (const test of isValidIfFalse!) {
    const result = test(e, t, i, d, args);
    if (result instanceof Break) {
      // if any are true, return false.  
      if (result.hasReturn && !result.return) {
        return hasBroken ? new Break(false) : false;
      } // (if null break then return the null break)
      else if (!result.hasReturn) {
        return result;
      }

      hasBroken = true;
    } // if there's a single true result, then we need to return false.
    else if (!result) {
      return hasBroken ? new Break(false) : false;
    }
  }

  // if all are false, we return true!
  return hasBroken ? new Break(true) : true;
}

/** @internal */
function _andWithNotAnd<TDexEntry extends Entry>(e: TDexEntry, t: Set<Tag>, i: number, d: IReadOnlyDex<TDexEntry>, args: QueryFilter<TDexEntry>, isValidIfTrue: MatchFilter<TDexEntry>[], isValidIfFalse: MatchFilter<TDexEntry>[]): boolean | Break<boolean> | Break {
  let hasBroken: boolean = false;
  // (x & y & z)
  const result = _and(e,t, i, d, args, isValidIfTrue);
  if (result === false) {
    return false;
  }

  if (result instanceof Break) {
    if (result.hasReturn && result.return === false) {
      return result;
    }

    hasBroken = true;
  }

  // !(x & y & z)
  const notResult = _notAnd(e, t,i, d, args, isValidIfFalse);
  if (notResult === false) {
    return false;
  }

  if (notResult instanceof Break) {
    if (notResult.hasReturn && notResult.return === false) {
      return notResult;
    }

    hasBroken = true;
  }

  return hasBroken ? new Break(true) : true;
}

// (x & y & z)
/** @internal */
function _and<TDexEntry extends Entry>(e: TDexEntry, t: Set<Tag>, i: number, d: IReadOnlyDex<TDexEntry>, args: QueryFilter<TDexEntry>, isValidIfTrue: MatchFilter<TDexEntry>[]): boolean | Break<boolean> | Break {
  let hasBroken: boolean = false;
  for (const test of isValidIfTrue!) {
    const result = test(e,t, i, d, args);
    if (result instanceof Break) {
      // if any are false, we break and return false. (if null break then return the null break)
      if (!result.hasReturn || !result.return) {
        return result;
      }

      hasBroken = true;
    } else {
      // on a single false, return false.
      if (!result) {
        return hasBroken ? new Break(false) : false;
      }
    }
  }

  // all success!
  return hasBroken ? new Break(true) : true;
}

// !(x & y & z)
/** @internal */
function _notAnd<TDexEntry extends Entry>(e: TDexEntry, t: Set<Tag>, i: number, d: IReadOnlyDex<TDexEntry>, args: QueryFilter<TDexEntry>, isValidIfFalse: MatchFilter<TDexEntry>[]): boolean | Break<boolean> | Break {
  let hasBroken: boolean = false;
  let successes: number = 0;
  for (const test of isValidIfFalse!) {
    const result = test(e,t, i, d, args);
    if (result instanceof Break) {
      // count all true values
      if (result.hasReturn && result.return) {
        successes++;
      }
      // return a null break.
      if (!result.hasReturn) {
        return result;
      }

      hasBroken = true;
    } else {
      // count all true values
      if (result) {
        successes++;
      }
    }
  }

  // make sure they aren't all successes.
  return hasBroken
    ? new Break(successes !== isValidIfFalse.length)
    : successes !== isValidIfFalse.length;
}

/** @internal */
function _buildOrMatcher<TDexEntry extends Entry>(isValid: true | MatchFilter<TDexEntry>, withoutTags: Set<Tag> | undefined) {
  let matcher: IBreakable<[
    hash: HashKey,
    tags: Set<Tag>,
    index: number,
    dex: IReadOnlyDex<TDexEntry>,
    args: QueryFilter<TDexEntry>
  ], boolean> | true;
  if (isValid === true) {
    if (withoutTags?.size) {
      // (tag || tag) & !(tag || tag)
      matcher = function orMatcherWithoutTags(e, t, i, d, args) {
        for (const withoutTag of withoutTags!) {
          if (t.has(withoutTag)) {
            return false;
          }
        }

        return true;
      };
    } else {
      matcher = true;
    }
  } else {
    if (withoutTags?.size) {
      // (tag || tag) & !(tag || tag)
      matcher = function orMatcherWithoutTags(e, t, i, d, args) {
        for (const withoutTag of withoutTags!) {
          if (t.has(withoutTag)) {
            return false;
          }
        }

        return isValid(d.get(e)!, t, i, d, args);
      };
    } else {
      matcher = function orMatcherWithoutTags(e, t, i, d, args) {
        return isValid(d.get(e)!, t, i, d, args);
      };
    }
  }

  return matcher;
}

/** @internal */
function _buildAndMatcher<TDexEntry extends Entry>(isValid: true | MatchFilter<TDexEntry>, withTags: Set<Tag> | undefined, withoutTags: Set<Tag> | undefined) {
  let matcher: IBreakable<[
    hash: HashKey,
    tags: Set<Tag>,
    index: number,
    dex: IReadOnlyDex<TDexEntry>,
    args: QueryFilter<TDexEntry>
  ], boolean> | true;

  if (isValid === true) {
    if (withTags?.size) {
      if (withoutTags?.size) {
        matcher = function andMatcherWithOrWithoutTags(e, t, i, d, args, ...rest) {
          for (const withTag of withTags!) {
            if (!t.has(withTag)) {
              return false;
            }
          }

          for (const withoutTag of withoutTags!) {
            if (!t.has(withoutTag)) {
              return true;
            }
          }

          return false;
        };
      } else {
        matcher = function andMatcherWithTags(e, t, i, d, args) {
          for (const withTag of withTags!) {
            if (!t.has(withTag)) {
              return false;
            }
          }

          return true;
        };
      }
    } else if (withoutTags?.size) {
      matcher = function orMatcherWithoutTags(e, t, i, d, args) {
        for (const withoutTag of withoutTags!) {
          if (!t.has(withoutTag)) {
            return true;
          }
        }

        return false;
      };
    } else {
      matcher = true;
    }
  } // w/ valid checks
  else {
    if (withTags?.size) {
      if (withoutTags?.size) {
        matcher = function andMatcherWithOrWithoutTagsWithValid(e, t, i, d, args) {
          for (const withTag of withTags!) {
            if (!t.has(withTag)) {
              return false;
            }
          }

          for (const withoutTag of withoutTags!) {
            if (!t.has(withoutTag)) {
              return isValid(d.get(e)!, t, i, d, args);
            }
          }

          return false;
        };
      } else {
        matcher = function andMatcherWithTagsWithValid(e, t, i, d, args) {
          for (const withTag of withTags!) {
            if (!t.has(withTag)) {
              return false;
            }
          }

          return isValid(d.get(e)! as any, t,i, d, args);
        };
      }
    } else if (withoutTags?.size) {
      matcher = function orMatcherWithoutTagsWithValid(e, t, i, d, args) {
        for (const withoutTag of withoutTags!) {
          if (!t.has(withoutTag)) {
            return isValid(d.get(e)! as any, t,i, d, args);
          }
        }

        return false;
      };
    } else {
      matcher = function orMatcherWithoutTagsWithValid(e, t, i, d, args) {
        return isValid(d.get(e)! as any,t, i, d, args);
      };
    }
  }

  return matcher;
}

/** @internal */
function _matchAll<TDexEntry extends Entry>(
  toIgnore: Set<HashKey> | undefined,
  subset: Set<HashKey> | undefined,
  results: Set<HashKey>,
  matcher: true | IBreakable<[hash: HashKey, tags: Set<Tag>, index: number, dex: IReadOnlyDex<TDexEntry>, args: QueryFilter<TDexEntry>], boolean>,
  dex: IReadOnlyDex<TDexEntry>,
  filter: QueryFilter<TDexEntry>,
  tagsToSearch: () => Iterable<Tag>
) {
  const alreadySeen = new Set<HashKey>();
  const shouldIgnore = toIgnore?.size
    ? (k: HashKey) => alreadySeen.has(k) || results.has(k) || toIgnore!.has(k)
    : (k: HashKey) => alreadySeen.has(k) || results.has(k);
  const ignore = (hash: HashKey) => alreadySeen.add(hash);

  if (subset) {
    if (matcher === true) {
      for (const hash of subset) {
        if (!shouldIgnore(hash)) {
          results.add(hash);
          ignore(hash);
        }
      }
    } else {
      let index = 0;
      for (const hash of subset) {
        if (!shouldIgnore(hash)) {
          const allTags = (dex as any)._tagsByHash.get(hash) as Set<Tag>;
          const result = matcher(hash, allTags, index++, dex, filter);
          if (result instanceof Break) {
            if (result.return) {
              results.add(hash);
            }

            break;
          }

          if (result) {
            results.add(hash);
            ignore(hash);
          }
        }
      }
    }
  } else {
    if (matcher === true) {
      for (const tag in tagsToSearch()) {
        for (const hash in (dex as any)._hashesByTag.get(tag) as Set<HashKey>) {
          if (!shouldIgnore(hash)) {
            results.add(hash);
            ignore(hash);
          }
        }
      }
    } else {
      let index = 0;
      for (const tag in tagsToSearch()) {
        for (const hash in (dex as any)._hashesByTag.get(tag) as Set<HashKey>) {
          if (!shouldIgnore(hash)) {
            const allTags = (dex as any)._tagsByHash.get(hash) as Set<Tag>;
            const result = matcher(hash, allTags, index++, dex, filter);
            if (result instanceof Break) {
              if (result.return) {
                results.add(hash);
              }

              break;
            }

            if (result) {
              results.add(hash);
              ignore(hash);
            }
          }
        }
      }
    }
  }
}

/** @internal */
function _matchFirst<TDexEntry extends Entry>(
  toIgnore: Set<HashKey> | undefined,
  subset: Set<HashKey> | undefined,
  matcher: true | IBreakable<[hash: HashKey, tags: Set<Tag>, index: number, dex: IReadOnlyDex<TDexEntry>, args: QueryFilter<TDexEntry>], boolean>,
  dex: IReadOnlyDex<TDexEntry>,
  filter: QueryFilter<TDexEntry>,
  tagsToSearch: () => Iterable<Tag>
): HashKey | undefined {
  const shouldIgnore = (hash: HashKey) => toIgnore?.has(hash);
  const ignore = (hash: HashKey) => toIgnore?.add(hash);

  if (subset) {
    if (matcher === true) {
      for (const hash of subset) {
        if (!shouldIgnore(hash)) {
          return hash;
        }
      }
    } else {
      let index = 0;
      for (const hash of subset) {
        if (!shouldIgnore(hash)) {
          const allTags = (dex as any)._tagsByHash.get(hash) as Set<Tag>;
          const result = matcher(hash, allTags, index++, dex, filter);
          if (result instanceof Break) {
            if (result.return) {
              return hash;
            }

            break;
          }

          if (result) {
            return hash;
          }

          ignore(hash);
        }
      }
    }
  } else {
    if (matcher === true) {
      for (const tag in tagsToSearch()) {
        for (const hash in (dex as any)._hashesByTag.get(tag) as Set<HashKey>) {
          if (!shouldIgnore(hash)) {
            return hash;
          }
        }
      }
    } else {
      let index = 0;
      for (const tag in tagsToSearch()) {
        for (const hash in (dex as any)._hashesByTag.get(tag) as Set<HashKey>) {
          if (!shouldIgnore(hash)) {
            const allTags = (dex as any)._tagsByHash.get(hash) as Set<Tag>;
            const result = matcher(hash, allTags, index++, dex, filter);
            if (result instanceof Break) {
              if (result.return) {
                return hash;
              }

              break;
            }

            if (result) {
              return hash;
            }

            ignore(hash);
          }
        }
      }
    }
  }

  return undefined;
}

//#endregion