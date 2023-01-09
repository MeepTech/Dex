import { isArray, isFunction, isNonStringIterable, isObject, isTag } from "../../utilities/validators";
import { Entry } from "../subsets/entries";
import { Tag, TagOrTags, Tags } from "../subsets/tags";
import { IReadonlyDex } from "../readonly";
import { HashKey } from "../subsets/hashes";
import { NO_RESULT, RESULT_TYPES, Result, ResultType, VALID_RESULT_REQUEST_TYPES } from "./results";
import {
  AndFilter,
  OrFilter,
  QueryFilter,
  XQueryFilter,
  MatchFilter,
  negateFilters,
  processArgsIntoFilters
} from "./filters";
import Dex from "../dex";
import { InvalidQueryParamError } from "../errors";
import { Break, first, forEach, IBreakable } from "../../utilities/iteration";

//#region Types

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
  and: SpecificAndQuery<TValue, TResult, TDexEntry>;
}

/**
 * A NOT query that just returns one type of value
 */
export interface SpecificNotQuery<
  TValue,
  TResult extends ResultType,
  TDexEntry extends Entry = TValue extends Entry ? TValue : Entry
> extends IQueryBase<TValue, TResult, TDexEntry> {
  and: SpecificAndNotQuery<TValue, TResult, TDexEntry>;
}

/**
 * A AND query that just returns one type of value
 */
export interface SpecificAndQuery<
  TValue,
  TResult extends ResultType,
  TDexEntry extends Entry = TValue extends Entry ? TValue : Entry
> extends IQueryBase<TValue, TResult, TDexEntry> {
  not: SpecificAndNotQuery<TValue, TResult, TDexEntry>;
}

/**
 * A AND NOT query that just returns one type of value
 */
export interface SpecificAndNotQuery<
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
> extends IFullQuery<TValue, TDefaultResult, TDexEntry> {
  not: FullNotQuery<TValue, TDefaultResult, TDexEntry>;
  and: FullAndNotQuery<TValue, TDefaultResult, TDexEntry>;
}

/**
 * A query that can return many different types, and has more options than a specific query
 */
export interface FullNotQuery<
  TValue,
  TDefaultResult extends ResultType,
  TDexEntry extends Entry = TValue extends Entry ? TValue : Entry
> extends FullQuery<TValue, TDefaultResult, TDexEntry> {
  and: FullAndNotQuery<TValue, TDefaultResult, TDexEntry>;
}

/**
 * A query that can return many different types, and has more options than a specific query
 */
export interface FullAndQuery<
  TValue,
  TDefaultResult extends ResultType,
  TDexEntry extends Entry = TValue extends Entry ? TValue : Entry
> extends FullQuery<TValue, TDefaultResult, TDexEntry> {
  not: FullAndNotQuery<TValue, TDefaultResult, TDexEntry>;
}
/**
 * A query that can return many different types, and has more options than a specific query
 */
export interface FullAndNotQuery<
  TValue,
  TDefaultResult extends ResultType,
  TDexEntry extends Entry = TValue extends Entry ? TValue : Entry
> extends FullQuery<TValue, TDefaultResult, TDexEntry> {}

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

  (...tags: Tag[])
    : Result<TValue, TResult, TDexEntry>

  (filter: XQueryFilter<TDexEntry>)
    : Result<TValue, TResult, TDexEntry>

  (filters: XQueryFilter<TDexEntry>[])
    : Result<TValue, TResult, TDexEntry>

  (...filters: XQueryFilter<TDexEntry>[])
    : Result<TValue, TResult, TDexEntry>

  (
    tag: Tag,
    ...filters: XQueryFilter<TDexEntry>[]
  ) : Result<TValue, TResult, TDexEntry>
  
  (
    tags: Tags,
    ...filters: XQueryFilter<TDexEntry>[]
  ) : Result<TValue, TResult, TDexEntry>

  (
    tag: Tag,
    filters: XQueryFilter<TDexEntry>[]
  ) : Result<TValue, TResult, TDexEntry>
  
  (
    tags: Tags,
    filters: XQueryFilter<TDexEntry>[]
  ) : Result<TValue, TResult, TDexEntry>
}

/**
 * A query that can return many different types, and has more options than a specific query
 */
interface IFullQuery<
  TValue,
  TDefaultResult extends ResultType,
  TDexEntry extends Entry = TValue extends Entry ? TValue : Entry
> extends IQueryBase<TValue, TDefaultResult, TDexEntry> {

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

//#endregion

//#region Constructors

/** @internal */
export const FullQueryConstructor = <
  TValue,
  TDefaultResult extends ResultType,
  TDexEntry extends Entry
>(
  dex: IReadonlyDex<TDexEntry>,
  defaultResult: TDefaultResult,
  options?: {
    transform?: ((hash: HashKey) => TValue) | false,
    modifyFilters?: (filters: QueryFilter<TDexEntry>[]) => void,
    excludeNot?: boolean,
    excludeAnd?: boolean,
    defaultFilterType?: 'and' | 'or',
    allOnNoParams?: boolean
  }
): FullQuery<TValue, TDefaultResult, TDexEntry> => {
  const query = function fullQuery<
    TQValue extends TValue,
    TResultType extends TDefaultResult = TDefaultResult,
    TQDexEntry extends Entry = TDexEntry
  >(
    this: IReadonlyDex<TQDexEntry>,
    ...args: any
  ): Result<TQValue, TResultType, TQDexEntry> {
    // sort params to filters
    const {
      filters,
      result: resultType = defaultResult
    } = processArgsIntoFilters<TQDexEntry>({ defaultFilterType: options?.defaultFilterType ?? 'or' }, ...args);
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

        collectMatches
          = (transform === false)
            ? (hashes => (results = ([...hashes] as TQValue[])))
            : (hashes =>
              hashes.forEach(hash =>
                (results as TQValue[])
                  .push((transform as any)(hash))));

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
        collectMatches = (transform === false)
          ? (hashes => (results = hashes as Set<TQValue>))
          : (hashes =>
            hashes.forEach(hash =>
              (results as Set<TQValue>)
                .add((transform as any)(hash))
            ));

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
      modifyFilters: options?.modifyFilters ? filters => (negateFilters(filters), options!.modifyFilters?.(filters)) : negateFilters
    });
  }

  if (!options?.excludeAnd) {
    query.and = FullQueryConstructor<TValue, TDefaultResult, TDexEntry>(dex, defaultResult, {
      ...options,
      excludeAnd: true,
      defaultFilterType: 'and',
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
  dex: IReadonlyDex<TDexEntry>,
  resultType: TResult,
  options?: {
    transform?: ((hash: HashKey) => TValue) | false,
    modifyFilters?: (filters: QueryFilter<TDexEntry>[]) => void;
    excludeNot?: boolean,
    excludeAnd?: boolean,
    defaultFilterType?: 'and' | 'or', 
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
        this: IReadonlyDex<TQDexEntry>,
        ...args: any
      ): TQValue[] {
        const {
          filters
        } = processArgsIntoFilters<TQDexEntry>({defaultFilterType: options?.defaultFilterType ?? 'or'}, ...args);
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
        this: IReadonlyDex<TQDexEntry>,
        ...args: any
      ): TQValue | undefined {
        const {
          filters
        } = processArgsIntoFilters<TQDexEntry>({defaultFilterType: options?.defaultFilterType ?? 'or'}, ...args);
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
        this: IReadonlyDex<TQDexEntry>,
        ...args: any
      ): Set<TQValue> {
        const {
          filters
        } = processArgsIntoFilters<TQDexEntry>({defaultFilterType: options?.defaultFilterType ?? 'or'}, ...args);
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
        this: IReadonlyDex<TQDexEntry>,
        ...args: any
      ): Dex<TQDexEntry> {
        const {
          filters
        } = processArgsIntoFilters<TQDexEntry>({defaultFilterType: options?.defaultFilterType ?? 'or'}, ...args);
        options?.modifyFilters?.(filters as QueryFilter<TDexEntry>[]);

        const hashes = (options?.allOnNoParams && !args?.length) 
          ? new Set<HashKey>(dex.hashes)
          : _logicMultiQuery(this, filters);

        const results = new Dex<TQDexEntry>();
        results.copy.from(dex as IReadonlyDex<TDexEntry> as any as IReadonlyDex<TQDexEntry>, hashes);

        return results;
      }.bind(dex) as SpecificQuery<TValue, ResultType.Dex, TDexEntry> as SpecificQuery<TValue, TResult, TDexEntry>;
      break;
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
      modifyFilters: options?.modifyFilters ? filters => (negateFilters(filters), options!.modifyFilters?.(filters)) : negateFilters
    });
  }

  if (!options?.excludeAnd) {
    query.and = SpecificQueryConstructor<TValue, TResult, TDexEntry>(dex, resultType, {
      ...options,
      excludeAnd: true,
      defaultFilterType: 'and',
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
  dex: IReadonlyDex<TDexEntry>,
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

//#endregion

//#region Logic

/** @internal */
export function _logicMultiQuery<TDexEntry extends Entry>(
  dex: IReadonlyDex<TDexEntry>,
  filters: QueryFilter<TDexEntry>[]
): Set<HashKey> {
  let matches: Set<HashKey> | undefined = undefined;

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

    if (matches.size === 0) {
      return matches;
    }
  }

  return matches ?? new Set();
}

/** @internal */
export function _logicFirstQuery<TDexEntry extends Entry>(
  dex: IReadonlyDex<TDexEntry>,
  filters: QueryFilter<TDexEntry>[]
): HashKey | undefined {
  if (!filters.length) {
    return dex.entries.values.next().value;
  }

  let subset: Set<HashKey> | undefined = undefined;
  const firstableFilter = filters.shift()!;
  if (filters.length) {
    subset = _logicMultiQuery(dex, filters);
    if (subset.size === 0) {
      return NO_RESULT;
    }
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

/** @internal */
function _queryAllForOr<TDexEntry extends Entry>(
  dex: IReadonlyDex<TDexEntry>,
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
      isValidIfFalse = filter.or.logic?.map(filter => isFunction(filter) ? filter : filter.where!);
    } else {
      results = filter.or.hashes ?? new Set();
      withTags = filter.or.tags;
      isValidIfTrue = filter.or.logic?.map(filter => isFunction(filter) ? filter : filter.where!);
      toIgnore = filter.not.hashes;
      withoutTags = filter.not.tags;
      isValidIfFalse = filter.not.logic?.map(filter => isFunction(filter) ? filter : filter.where!);
    }
  } else {
    results = filter.or.hashes ?? new Set();
    withTags = filter.or.tags;
    isValidIfTrue = filter.or.logic?.map(filter => isFunction(filter) ? filter : filter.where!);
  }

  let tagsToSearch: () => Iterable<Tag>
    = (subset?.size
      ? null!
      : (withTags?.size
        ? (() => withTags!)
        : (() => dex.tags)));

  // (tag || tag) & !(tag || tag)
  if (!subset?.size && withoutTags?.size) {
    const base = tagsToSearch;
    tagsToSearch = function* () {
      for (const tag of base()) {
        if (!withoutTags!.has(tag)) {
          yield tag;
        }
      }
    }
  }

  const isValid: MatchFilter<TDexEntry> | true
    = isValidIfTrue?.length
      ? isValidIfFalse?.length
        ? _orWithNotOr
        : _or
      : isValidIfFalse?.length
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
  dex: IReadonlyDex<TDexEntry>,
  filter: AndFilter<TDexEntry>,
  subset?: Set<HashKey>
): Set<HashKey> {
  let results: Set<HashKey>;
  let toIgnore: Set<HashKey> | undefined;
  let withTags: Set<Tag> | undefined;
  let withoutTags: Set<Tag> | undefined;
  let isValidIfTrue: MatchFilter<TDexEntry>[] | undefined;
  let isValidIfFalse: MatchFilter<TDexEntry>[] | undefined;

  results = new Set();
  if (filter.not) {
    if (filter.not === true) {
      withTags = undefined;
      isValidIfTrue = undefined;
      toIgnore = filter.and.hashes;
      withoutTags = filter.and.tags;
      isValidIfFalse = filter.and.logic?.map(filter => isFunction(filter) ? filter : filter.where!);
    } else {
      if (subset && filter.and.hashes) {
        if (!filter.and.hashes.size) {
          return new Set();
        }
        
        forEach(subset, entry => {
          if (!filter.and.hashes?.has(entry)) {
            subset!.delete(entry);
          }
        });

        if (!subset.size) {
          return subset;
        }
      } else if (filter.and.hashes?.size) {
        subset = filter.and.hashes;
      }

      withTags = filter.and.tags;
      isValidIfTrue = filter.and.logic?.map(filter => isFunction(filter) ? filter : filter.where!);
      toIgnore = filter.and.hashes;
      withoutTags = filter.and.tags;
      isValidIfFalse = filter.and.logic?.map(filter => isFunction(filter) ? filter : filter.where!);
    }
  } else {
    if (subset && filter.and.hashes) {
      if (!filter.and.hashes.size) {
        return new Set();
      }

      forEach(subset, entry => {
        if (!filter.and.hashes?.has(entry)) {
          subset!.delete(entry);
        }
      });

      if (!subset.size) {
        return subset;
      }
    } else if (filter.and.hashes?.size) {
      subset = filter.and.hashes;
    }

    withTags = filter.and.tags;
    isValidIfTrue = filter.and.logic?.map(filter => isFunction(filter) ? filter : filter.where!);
  }

  let tagsToSearch: () => Iterable<Tag> = subset ? null! : withTags?.size
    ? () => [withTags?.entries().next().value as Tag]
    : () => dex.tags;

  const isValid: MatchFilter<TDexEntry> | true
    = isValidIfTrue?.length
      ? isValidIfFalse?.length
        ? _andWithNotAnd
        : _and
      : isValidIfFalse?.length
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
  dex: IReadonlyDex<TDexEntry>,
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
      isValidIfFalse = filter.or.logic?.map(filter => isFunction(filter) ? filter : filter.where!);
    } else {
      withTags = filter.or.tags;
      isValidIfTrue = filter.or.logic?.map(filter => isFunction(filter) ? filter : filter.where!);
      toIgnore = filter.or.hashes;
      withoutTags = filter.or.tags;
      isValidIfFalse = filter.or.logic?.map(filter => isFunction(filter) ? filter : filter.where!);
    }
  } else {
    withTags = filter.or.tags;
    isValidIfTrue = filter.or.logic?.map(filter => isFunction(filter) ? filter : filter.where!);
  }

  let tagsToSearch: () => Iterable<Tag> = subset ? null! : withTags?.size
    ? () => withTags!
    : () => dex.tags;

  // (tag || tag) & !(tag || tag)
  if (!subset && withoutTags?.size) {
    const base = tagsToSearch;
    tagsToSearch = function* () {
      for (const tag of base()) {
        if (!withoutTags!.has(tag)) {
          yield tag;
        }
      }
    }
  }

  const isValid: MatchFilter<TDexEntry> | true
    = isValidIfTrue?.length
      ? isValidIfFalse?.length
        ? _orWithNotOr
        : _or
      : isValidIfFalse?.length
        ? _notOr
        : true;

  let matcher = _buildOrMatcher<TDexEntry>(isValid, withoutTags);
  const result = _matchFirst<TDexEntry>(toIgnore, subset, matcher, dex, filter, tagsToSearch);
  if (result === undefined && filter.or.hashes?.size) {
    return first(filter.or.hashes);
  }

  return result;
}

/** @internal */
function _queryFirstForAnd<TDexEntry extends Entry>(
  dex: IReadonlyDex<TDexEntry>,
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
      isValidIfFalse = filter.and.logic?.map(filter => isFunction(filter) ? filter : filter.where!);
    } else {
      if (subset && filter.and.hashes) {
        if (!filter.and.hashes.size) {
          return NO_RESULT;
        }

        forEach(subset, entry => {
          if (!filter.and.hashes?.has(entry)) {
            subset!.delete(entry);
          }
        });
      } else if (filter.and.hashes?.size) {
        subset = filter.and.hashes;
      }

      withTags = filter.and.tags;
      isValidIfTrue = filter.and.logic?.map(filter => isFunction(filter) ? filter : filter.where!);
      toIgnore = filter.and.hashes;
      withoutTags = filter.and.tags;
      isValidIfFalse = filter.and.logic?.map(filter => isFunction(filter) ? filter : filter.where!);
    }
  } else {
    if (subset && filter.and.hashes) {
      if (!filter.and.hashes.size) {
        return NO_RESULT;
      }

      forEach(subset, entry => {
        if (!filter.and.hashes?.has(entry)) {
          subset!.delete(entry);
        }
      });
    } else if (filter.and.hashes?.size) {
      subset = filter.and.hashes;
    }

    withTags = filter.and.tags;
    isValidIfTrue = filter.and.logic?.map(filter => isFunction(filter) ? filter : filter.where!);
  }
  
  if (subset && subset.size === 0) {
    return NO_RESULT;
  }

  let tagsToSearch: () => Iterable<Tag> = subset ? null! : withTags?.size
    ? () => [withTags?.entries().next().value as Tag]
    : () => dex.tags;

  const isValid: MatchFilter<TDexEntry> | true
    = isValidIfTrue?.length
      ? isValidIfFalse?.length
        ? _andWithNotAnd
        : _and
      : isValidIfFalse?.length
        ? _notAnd
        : true;

  let matcher = _buildAndMatcher<TDexEntry>(isValid, withTags, withoutTags);
  return _matchFirst<TDexEntry>(toIgnore, subset, matcher, dex, filter, tagsToSearch);
}

/** @internal */
function _orWithNotOr<TDexEntry extends Entry>(e: TDexEntry, t: Set<Tag>, i: number, d: IReadonlyDex<TDexEntry>, args: QueryFilter<TDexEntry>, isValidIfTrue: MatchFilter<TDexEntry>[], isValidIfFalse: MatchFilter<TDexEntry>[]): boolean | Break<boolean> | Break {
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
function _or<TDexEntry extends Entry>(e: TDexEntry, t: Set<Tag>, i: number, d: IReadonlyDex<TDexEntry>, args: QueryFilter<TDexEntry>, isValidIfTrue: MatchFilter<TDexEntry>[]): boolean | Break<boolean> | Break {
  let hasBroken: boolean = false;
  for (const test of isValidIfTrue) {
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
function _notOr<TDexEntry extends Entry>(e: TDexEntry, t: Set<Tag>, i: number, d: IReadonlyDex<TDexEntry>, args: QueryFilter<TDexEntry>, isValidIfFalse: MatchFilter<TDexEntry>[]): boolean | Break<boolean> | Break {
  let hasBroken: boolean = false;
  for (const test of isValidIfFalse ?? []) {
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
function _andWithNotAnd<TDexEntry extends Entry>(e: TDexEntry, t: Set<Tag>, i: number, d: IReadonlyDex<TDexEntry>, args: QueryFilter<TDexEntry>, isValidIfTrue: MatchFilter<TDexEntry>[], isValidIfFalse: MatchFilter<TDexEntry>[]): boolean | Break<boolean> | Break {
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
function _and<TDexEntry extends Entry>(e: TDexEntry, t: Set<Tag>, i: number, d: IReadonlyDex<TDexEntry>, args: QueryFilter<TDexEntry>, isValidIfTrue: MatchFilter<TDexEntry>[]): boolean | Break<boolean> | Break {
  let hasBroken: boolean = false;
  for (const test of isValidIfTrue ?? []) {
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
function _notAnd<TDexEntry extends Entry>(e: TDexEntry, t: Set<Tag>, i: number, d: IReadonlyDex<TDexEntry>, args: QueryFilter<TDexEntry>, isValidIfFalse: MatchFilter<TDexEntry>[]): boolean | Break<boolean> | Break {
  let hasBroken: boolean = false;
  let successes: number = 0;
  for (const test of isValidIfFalse ?? []) {
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
    dex: IReadonlyDex<TDexEntry>,
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
    dex: IReadonlyDex<TDexEntry>,
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
  matcher: true | IBreakable<[hash: HashKey, tags: Set<Tag>, index: number, dex: IReadonlyDex<TDexEntry>, args: QueryFilter<TDexEntry>], boolean>,
  dex: IReadonlyDex<TDexEntry>,
  filter: QueryFilter<TDexEntry>,
  tagsToSearch: () => Iterable<Tag>
) {
  const alreadySeen = new Set<HashKey>();
  const shouldIgnore = toIgnore?.size
    ? (k: HashKey) => alreadySeen.has(k) || results.has(k) || toIgnore!.has(k)
    : (k: HashKey) => alreadySeen.has(k) || results.has(k);
  const ignore = (hash: HashKey) => alreadySeen.add(hash);

  if (subset?.size) {
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
      for (const tag of tagsToSearch()) {
        const hashesForTag = (dex as any)._hashesByTag.get(tag) as Set<HashKey>;
        if (!hashesForTag) {
          continue;
        }

        for (const hash of hashesForTag) {
          if (!shouldIgnore(hash)) {
            results.add(hash);
            ignore(hash);
          }
        }
      }
    } else {
      let index = 0;
      for (const tag of tagsToSearch()) {
        const hashesForTag = (dex as any)._hashesByTag.get(tag) as Set<HashKey>;
          if (!hashesForTag) {
            continue;
          }
        for (const hash of hashesForTag) {
          
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
  matcher: true | IBreakable<[hash: HashKey, tags: Set<Tag>, index: number, dex: IReadonlyDex<TDexEntry>, args: QueryFilter<TDexEntry>], boolean>,
  dex: IReadonlyDex<TDexEntry>,
  filter: QueryFilter<TDexEntry>,
  tagsToSearch: () => Iterable<Tag>
): HashKey | undefined {
  const shouldIgnore = (hash: HashKey) => toIgnore?.has(hash);
  const ignore = (hash: HashKey) => toIgnore?.add(hash);

  if (subset?.size) {
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
      for (const tag of tagsToSearch()) {
        const hashesForTag = (dex as any)._hashesByTag.get(tag) as Set<HashKey>;
        if (!hashesForTag) {
          continue;
        }

        for (const hash of hashesForTag) {
          if (!shouldIgnore(hash)) {
            return hash;
          }
        }
      }
    } else {
      let index = 0;
      for (const tag of tagsToSearch()) {
        const hashesForTag = (dex as any)._hashesByTag.get(tag) as Set<HashKey>;
        if (!hashesForTag) {
          continue;
        }

        for (const hash of hashesForTag) {

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