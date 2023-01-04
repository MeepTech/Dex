import { isArray, isFunction, isObject, isTag } from "../../utilities/validators";
import { IEntry } from "../subsets/entries";
import { ITag, ITagOrTags } from "../subsets/tags";
import { IReadOnlyDex } from "../readonly";
import { IHashKey } from "../subsets/hashes";
import { IResult, ResultType } from "./results";
import {
  IAndFilterQuery,
  IOrFilterQuery,
  IQueryFilter,
  IQueryFilterInput,
  IMatchFilter,
  negateFilters,
  normalizeFilters
} from "./filters";
import Dex, { InvalidQueryParamError } from "../dex";
import { Break, IBreakable } from "../../utilities/loops";

/**
 * 
 */
export type IQuery<
  TEntry extends IEntry,
  TResult extends ResultType,
  TDexEntry extends IEntry = TEntry
> = ISpecificQuery<TEntry, TResult, TDexEntry>
  | IFullQuery<TEntry, TResult, TDexEntry>
  | IFirstableQuery<TEntry, Exclude<TResult, ResultType.First>, TDexEntry>;

/**
 * A query that just returns one type of value
 */
export interface ISpecificQuery<
  TEntry extends IEntry,
  TResult extends ResultType,
  TDexEntry extends IEntry = TEntry
> extends IQueryBase<TEntry, TResult, TDexEntry> {
  not: ISpecificNotQuery<TEntry, TResult, TDexEntry>;
}

/**
 * A NOT query that just returns one type of value
 */
export interface ISpecificNotQuery<
  TEntry extends IEntry,
  TResult extends ResultType,
  TDexEntry extends IEntry = TEntry
> extends IQueryBase<TEntry, TResult, TDexEntry> {}

/**
 * A query that can return many different types, and has more options than a specific query
 */
export interface IFullQuery<
  TEntry extends IEntry,
  TDefaultResult extends ResultType,
  TDexEntry extends IEntry = TEntry
> extends IQueryBase<TEntry, TDefaultResult, TDexEntry> {
  not: IFullNotQuery<TEntry, TDefaultResult, TDexEntry>;

  <TResultType extends ResultType = TDefaultResult>(
    tag: ITag,
    options: {
      filters?: IQueryFilterInput<TEntry>[] | IQueryFilterInput<TEntry>,
      result: TResultType
    }
  ): IResult<TEntry, TResultType, TDexEntry>

  <TResultType extends ResultType>(
    tag: ITag,
    result: TResultType
  ): IResult<TEntry, TResultType, TDexEntry>

  <TResultType extends ResultType = TDefaultResult>(
    tags: ITagOrTags,
    options: {
      filters?: IQueryFilterInput<TEntry>[] | IQueryFilterInput<TEntry>,
      result: TResultType
    }
  ): IResult<TEntry, TResultType, TDexEntry>

  <TResultType extends ResultType>(
    tags: ITagOrTags,
    result: TResultType
  ): IResult<TEntry, TResultType, TDexEntry>

  <TResultType extends ResultType>(
    result: TResultType,
    tag: ITag
  ): IResult<TEntry, TResultType, TDexEntry>

  <TResultType extends ResultType>(
    result: TResultType,
    ...tags: ITag[]
  ): IResult<TEntry, TResultType, TDexEntry>

  <TResultType extends ResultType>(
    result: TResultType,
    ...filters: IQueryFilterInput<TEntry>[]
  ): IResult<TEntry, TResultType, TDexEntry>

  <TResultType extends ResultType>(
    ...tagsAndResult: [...ITag[], TResultType]
  ): IResult<TEntry, TResultType, TDexEntry>

  <TResultType extends ResultType = TDefaultResult>(
    filter: IQueryFilterInput<TEntry>,
    result: TResultType
  ): IResult<TEntry, TResultType, TDexEntry>

  <TResultType extends ResultType = TDefaultResult>(
    filters: IQueryFilterInput<TEntry>[],
    result: TResultType
  ): IResult<TEntry, TResultType, TDexEntry>

  <TResultType extends ResultType>(
    ...filtersAndResult: [...IQueryFilterInput<TEntry>[], TResultType]
  ): IResult<TEntry, TResultType, TDexEntry>
}

/**
 * A query that can return many different types, and has more options than a specific query
 */
export interface IFullNotQuery<
  TEntry extends IEntry,
  TResult extends ResultType,
  TDexEntry extends IEntry = TEntry
> extends IFullQuery<TEntry, TResult, TDexEntry> {}

/**
 * Represents a special kind of query that has a first parameter as well
 */
export interface IFirstableQuery<
  TEntry extends IEntry,
  TDefaultResult extends Exclude<ResultType, ResultType.First>,
  TDexEntry extends IEntry = TEntry
> extends ISpecificQuery<TEntry, TDefaultResult, TDexEntry> {
  first: ISpecificQuery<TEntry, ResultType.First, TDexEntry>;
}

/** @internal */
interface IQueryBase<
  TEntry extends IEntry,
  TResult extends ResultType,
  TDexEntry extends IEntry = TEntry
> {
  (
    tag: ITag,
    options?: {
      filters?: IQueryFilterInput<TEntry>[] | IQueryFilterInput<TEntry>
    }
  ): IResult<TEntry, TResult, TDexEntry>

  (
    tags: ITagOrTags,
    options?: {
      filters?: IQueryFilterInput<TEntry>[] | IQueryFilterInput<TEntry>
    }
  ): IResult<TEntry, TResult, TDexEntry>

  (filter: IQueryFilterInput<TEntry>)
    : IResult<TEntry, TResult, TDexEntry>

  (filters: IQueryFilterInput<TEntry>[])
    : IResult<TEntry, TResult, TDexEntry>

  (...filters: IQueryFilterInput<TEntry>[])
    : IResult<TEntry, TResult, TDexEntry>
}


const testQuery: IFullQuery<IEntry, ResultType.Array> = {} as any;

const _1 = testQuery(["a", "e", 1, 5]);
const _2 = testQuery(["a", "e", 1, 5], ResultType.Dex);
const _3 = testQuery(ResultType.Set, { and: ["one", "two"] });
const _3_1 = testQuery(ResultType.First, { and: ["one", "two"] });
const _4 = testQuery({ and: ["one", "two"] }, ResultType.First);
const _5 = testQuery({ and: ["one", "two"] }, { not: { hashes: ["ID:KW$#kj3tijergwigg"] } });
const _6 = testQuery({ not: { hashes: ["ID:KW$#kj3tijergwigg"] } });

/** @internal */
type QueryFilterOnCompleteOverrideFunction = ((matches: IHashKey[]) => void);

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
      onDefault?: (matches: IHashKey[]) => void;
    });

/** @internal */
export const FullQueryConstructor = <
  TEntry extends IEntry,
  TDefaultResult extends ResultType,
  TDexEntry extends IEntry = TEntry
>(
  dex: IReadOnlyDex<TDexEntry>,
  defaultResult: TDefaultResult,
  options?: {
    transform?: ((hash: IHashKey) => TEntry) | false,
    modifyFilters?: (filters: IQueryFilter<TDexEntry>[]) => void,
    excludeNot?: boolean,
    allOnNoParams?: boolean
  }
): IFullQuery<TEntry, TDefaultResult, TDexEntry> => {
  const query = function <
    TQEntry extends TEntry,
    TResultType extends TDefaultResult = TDefaultResult,
    TQDexEntry extends TQEntry = TQEntry
  >(
    this: IReadOnlyDex<TQDexEntry>,
    ...args: any
  ): IResult<TQEntry, TResultType, TQDexEntry> {
    // sort params to filters
    const {
      filters,
      result: resultType = defaultResult
    } = _convertQueryParamsToFilters<TQEntry, TQDexEntry>(...args);
    options?.modifyFilters?.(filters as IQueryFilter<TDexEntry>[]);

    // switch based on requested return type.
    options ??= {};
    let results: IResult<TQEntry, typeof resultType, TQDexEntry>;
    let collectMatches: (matches: Set<IHashKey>) => void;
    let transform = options?.transform
      ?? (hash => dex.get(hash!));

    switch (resultType) {
      // array
      case ResultType.Array: {
        results = [];

        collectMatches = transform !== false
          ? hashes => (results = ([...hashes] as TQEntry[]))
          : hashes =>
            hashes.forEach(hash => (results as TQEntry[]).push((transform as any)(hash))
          );

        break;
      }
      // first
      case ResultType.First: {
        // first only logic
        let result: TQEntry | IHashKey | undefined = _logicFirstQuery<TQEntry, TQDexEntry>(this, filters);
        if (result !== undefined && transform !== false) {
          result = transform(result as IHashKey) as TQEntry | IHashKey;
        }

        return result as IResult<TQEntry, TResultType, TQDexEntry>;
      }
      // set
      case ResultType.Set: {
        results = new Set<TQEntry>();
        collectMatches = transform !== false
          ? hashes => (results = hashes as Set<TQEntry>)
          : hashes =>
            hashes.forEach(hash => (results as Set<TQEntry>).add((transform as any)(hash))
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
      case ResultType.Vauge:
        throw new InvalidQueryParamError(resultType, "resultType");
    }

    // for no passed in params
    if (options?.allOnNoParams && !args?.length) {
      const hashes = new Set<IHashKey>(dex.hashes);
      collectMatches(hashes);

      return results as IResult<TQEntry, TResultType, TQDexEntry>;
    }

    // multi-result logic
    const hashes = _logicMultiQuery(this, filters);
    collectMatches(hashes);

    return results as IResult<TQEntry, TResultType, TQDexEntry>;
  } as IFullQuery<TEntry, TDefaultResult, TDexEntry>;

  if (!options?.excludeNot) {
    query.not = FullQueryConstructor<TEntry, TDefaultResult, TDexEntry>(dex, defaultResult, {
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
  TEntry extends IEntry,
  TResult extends ResultType,
  TDexEntry extends IEntry = TEntry
>(
  dex: IReadOnlyDex<TDexEntry>,
  resultType: TResult,
  options?: {
    transform?: ((hash: IHashKey) => TEntry) | false,
    modifyFilters?: (filters: IQueryFilter<TDexEntry>[]) => void;
    excludeNot?: boolean,
    allOnNoParams?: boolean
  }
): ISpecificQuery<TEntry, TResult, TDexEntry> => {
  let transform
    = options?.transform
    ?? (hash => dex.get(hash!) as any as TEntry);

  let query: ISpecificQuery<TEntry, TResult, TDexEntry>;
  
  switch (resultType) {
    // array
    case ResultType.Array: {
      query = function <TQEntry extends TEntry, TQDexEntry extends TDexEntry>(
        this: IReadOnlyDex<TQDexEntry>,
        ...args: any
      ): TQEntry[] {
        const {
          filters
        } = _convertQueryParamsToFilters<TQEntry, TQDexEntry>(...args);
        options?.modifyFilters?.(filters as IQueryFilter<TDexEntry>[]);

        const hashes = (options?.allOnNoParams && !args?.length) 
          ? new Set<IHashKey>(dex.hashes)
          : _logicMultiQuery<TQEntry, TQDexEntry>(this, filters);

        if (transform === false) {
          return [...hashes] as TQEntry[];
        }

        const results: TQEntry[] = [];
        hashes.forEach(hash =>
          (results as TQEntry[]).push((transform as any)(hash))
        );

        return results;
      }.bind(dex) as ISpecificQuery<TEntry, ResultType.Array, TDexEntry> as ISpecificQuery<TEntry, TResult, TDexEntry>;
      break;
    }
    // first
    case ResultType.First: {
      query = function <TQEntry extends TEntry, TQDexEntry extends TDexEntry>(
        this: IReadOnlyDex<TQDexEntry>,
        ...args: any
      ): TQEntry | undefined {
        const {
          filters
        } = _convertQueryParamsToFilters<TQEntry, TQDexEntry>(...args);
        options?.modifyFilters?.(filters as IQueryFilter<TDexEntry>[]);

        const result = _logicFirstQuery<TQEntry, TQDexEntry>(this, filters);
        if (result !== undefined && transform !== false) {
          return transform(result) as TQEntry;
        }

        return result as TQEntry | undefined;
      }.bind(dex) as ISpecificQuery<TEntry, ResultType.First, TDexEntry> as ISpecificQuery<TEntry, TResult, TDexEntry>;
      break;
    }
    // set
    case ResultType.Set: {
      query = function <TQEntry extends TEntry, TQDexEntry extends TDexEntry>(
        this: IReadOnlyDex<TQDexEntry>,
        ...args: any
      ): Set<TQEntry> {
        const {
          filters
        } = _convertQueryParamsToFilters<TQEntry, TQDexEntry>(...args);
        options?.modifyFilters?.(filters as IQueryFilter<TDexEntry>[]);

        const hashes = (options?.allOnNoParams && !args?.length) 
          ? new Set<IHashKey>(dex.hashes)
          : _logicMultiQuery(this, filters);

        if (transform === false) {
          return hashes as Set<TQEntry>;
        }

        const results: Set<TQEntry> = new Set();
        hashes.forEach(hash =>
          (results as Set<TQEntry>).add((transform as any)(hash))
        );

        return results;
      }.bind(dex) as ISpecificQuery<TEntry, ResultType.Set, TDexEntry> as ISpecificQuery<TEntry, TResult, TDexEntry>;
      break;
    }
    // dex
    case ResultType.Dex: {
      query = function <TQEntry extends TEntry, TQDexEntry extends TDexEntry>(
        this: IReadOnlyDex<TQDexEntry>,
        ...args: any
      ): Dex<TQDexEntry> {
        const {
          filters
        } = _convertQueryParamsToFilters<TQEntry, TQDexEntry>(...args);
        options?.modifyFilters?.(filters as IQueryFilter<TDexEntry>[]);

        const hashes = (options?.allOnNoParams && !args?.length) 
          ? new Set<IHashKey>(dex.hashes)
          : _logicMultiQuery(this, filters);

        const results = new Dex<TQDexEntry>();
        results.copy.from(dex as IReadOnlyDex<TDexEntry> as any as IReadOnlyDex<TQDexEntry>, hashes);

        return results;
      }.bind(dex) as ISpecificQuery<TEntry, ResultType.Dex, TDexEntry> as ISpecificQuery<TEntry, TResult, TDexEntry>;
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
    query.not = SpecificQueryConstructor<TEntry, TResult, TDexEntry>(dex, resultType, {
      ...options,
      excludeNot: true,
      // not all filters
      modifyFilters: negateFilters
    });
  }

  return query;
}

export const FirstableQueryConstructor = <
  TEntry extends IEntry,
  TResult extends Exclude<ResultType, ResultType.First>,
  TDexEntry extends IEntry = TEntry
>(
  dex: IReadOnlyDex<TDexEntry>,
  resultType: TResult,
  options?: {
    transform?: ((hash: IHashKey) => TEntry) | false,
    allOnNoParams?: boolean
  }
) => {
  const query = SpecificQueryConstructor<TEntry, TResult, TDexEntry>(dex, resultType, options) as IFirstableQuery<TEntry, TResult, TDexEntry>;
  query.first = SpecificQueryConstructor<TEntry, ResultType.First, TDexEntry>(dex, ResultType.First, options);

  return query;
}

/** @internal */
function _convertQueryParamsToFilters<TEntry extends IEntry, TDexEntry extends IEntry>(
  ...args: any[]
): { filters: IQueryFilter<TDexEntry>[], result: ResultType | undefined } {
  let filters: IQueryFilterInput<TDexEntry>[] = [];
  let result: ResultType | undefined;

  if (args[0] in ResultType) {
    // 0: result
    result = args.shift();

    if (isArray(args[0])) {
      const tagOrFilters: ITag[] | IQueryFilterInput<TEntry>[] = args[0];
      // 1: filters
      if (isObject(tagOrFilters[0])) {
        filters = tagOrFilters as IQueryFilterInput<TDexEntry>[];
      } // 1: tags
      else {
        filters.push(
          { or: { tags: tagOrFilters as ITag[] } }
        )
      }
    } else {
      // ...1: filters:
      if (isObject(args[0])) {
        filters = args as IQueryFilterInput<TDexEntry>[];
      } // ...1: tags:
      else if (args[0] !== undefined) {
        filters.push({
          or: { tags: args as ITag[] }
        });
      }
    }

    return { filters: normalizeFilters(filters), result };
  } else if (isArray(args[0])) {
    const tagOrFilters: ITag[] | IQueryFilterInput<TDexEntry>[] = args[0];
    // 0: filters
    if (isObject(tagOrFilters[0])) {
      filters = tagOrFilters as IQueryFilterInput<TDexEntry>[];
    } // 0: tags
    else {
      filters.push(
        { or: { tags: tagOrFilters as ITag[] } }
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
        { or: { tags: args[0] as Set<ITag> } }
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
        filters.push(args.shift() as IQueryFilterInput<TDexEntry>);

        // 1: result
        if (args[0] as any in ResultType) {
          result = args[0] as any as ResultType;
        } else if (isObject(args[0])) {
          (args as IQueryFilterInput<TDexEntry>[])
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
        { or: { tag: args[0] as ITag } }
      )
      result = args[1];
    } // 1: options:
    else if (isObject(args[1])) {
      filters.push(
        { or: { tag: args[0] as ITag } }
      );
      result = _addQueryOptionsToFilters<TDexEntry>(args[1], filters, result);
    } // ...1: tags:
    else if (args[1] !== undefined) {
      filters.push({
        or: { tags: args as ITag[] }
      });
    }

    return { filters: normalizeFilters(filters), result };
  }
  else {
    throw new InvalidQueryParamError(args[0], 0);
  }
}

/** @internal */
function _addQueryOptionsToFilters<TEntry extends IEntry>(
  options: {
    filters?: IQueryFilterInput<TEntry>[] | IQueryFilterInput<TEntry>,
    result?: ResultType
  },
  currentFilters: IQueryFilterInput<TEntry>[],
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
export function _logicMultiQuery<TEntry extends IEntry, TDexEntry extends IEntry>(
  dex: IReadOnlyDex<TDexEntry>,
  filters: IQueryFilter<TDexEntry>[]
): Set<IHashKey> {
  let matches: Set<IHashKey> = new Set();

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
export function _logicFirstQuery<TEntry extends IEntry, TDexEntry extends IEntry>(
  dex: IReadOnlyDex<TDexEntry>,
  filters: IQueryFilter<TDexEntry>[]
): IHashKey | undefined {
  if (!filters.length) {
    return dex.entries.values.next().value;
  }

  let subset: Set<IHashKey> | undefined = undefined;
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
function _queryAllForOr<TEntry extends IEntry, TDexEntry extends IEntry>(
  dex: IReadOnlyDex<TDexEntry>,
  filter: IOrFilterQuery<TDexEntry>,
  subset?: Set<IHashKey>
): Set<IHashKey> {
  let results: Set<IHashKey>;
  let toIgnore: Set<IHashKey> | undefined;
  let withTags: Set<ITag> | undefined;
  let withoutTags: Set<ITag> | undefined;
  let isValidIfTrue: IMatchFilter<TDexEntry>[] | undefined;
  let isValidIfFalse: IMatchFilter<TDexEntry>[] | undefined;

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

  let tagsToSearch: () => Iterable<ITag> = subset?.size ? null! : withTags?.size
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

  const isValid: IMatchFilter<TDexEntry> | true
    = isValidIfTrue
      ? isValidIfFalse
        ? _orWithNotOr
        : _or
      : isValidIfFalse
        ? _notOr
        : true;

  let matcher = _buildOrMatcher<TEntry, TDexEntry>(isValid, withoutTags);
  _matchAll<TEntry, TDexEntry>(toIgnore, subset, results, matcher, dex, filter, tagsToSearch);

  if (toIgnore?.size) {
    toIgnore.forEach(e => results.delete(e));
  }

  return results;
}

/** @internal */
function _queryAllForAnd<TEntry extends IEntry, TDexEntry extends IEntry>(
  dex: IReadOnlyDex<TDexEntry>,
  filter: IAndFilterQuery<TDexEntry>,
  subset?: Set<IHashKey>
): Set<IHashKey> {
  let results: Set<IHashKey>;
  let toIgnore: Set<IHashKey> | undefined;
  let withTags: Set<ITag> | undefined;
  let withoutTags: Set<ITag> | undefined;
  let isValidIfTrue: IMatchFilter<TDexEntry>[] | undefined;
  let isValidIfFalse: IMatchFilter<TDexEntry>[] | undefined;

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

  let tagsToSearch: () => Iterable<ITag> = subset?.size ? null! : withTags?.size
    ? () => [withTags?.entries().next().value as ITag]
    : () => dex.tags;

  const isValid: IMatchFilter<TDexEntry> | true
    = isValidIfTrue
      ? isValidIfFalse
        ? _andWithNotAnd
        : _and
      : isValidIfFalse
        ? _notAnd
        : true;

  let matcher = _buildAndMatcher<TEntry, TDexEntry>(isValid, withTags, withoutTags);
  _matchAll<TEntry, TDexEntry>(toIgnore, subset, results, matcher, dex, filter, tagsToSearch);

  if (toIgnore?.size) {
    toIgnore.forEach(e => results.delete(e))
  }

  return results;
}

/** @internal */
function _queryFirstForOr<TEntry extends IEntry, TDexEntry extends IEntry>(
  dex: IReadOnlyDex<TDexEntry>,
  filter: IOrFilterQuery<TDexEntry>,
  subset?: Set<IHashKey>
): IHashKey | undefined {
  let toIgnore: Set<IHashKey> | undefined;
  let withTags: Set<ITag> | undefined;
  let withoutTags: Set<ITag> | undefined;
  let isValidIfTrue: IMatchFilter<TDexEntry>[] | undefined;
  let isValidIfFalse: IMatchFilter<TDexEntry>[] | undefined;

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

  let tagsToSearch: () => Iterable<ITag> = subset?.size ? null! : withTags?.size
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

  const isValid: IMatchFilter<TDexEntry> | true
    = isValidIfTrue
      ? isValidIfFalse
        ? _orWithNotOr
        : _or
      : isValidIfFalse
        ? _notOr
        : true;

  let matcher = _buildOrMatcher<TEntry, TDexEntry>(isValid, withoutTags);
  return _matchFirst<TEntry, TDexEntry>(toIgnore, subset, matcher, dex, filter, tagsToSearch);
}

/** @internal */
function _queryFirstForAnd<TEntry extends IEntry, TDexEntry extends IEntry>(
  dex: IReadOnlyDex<TDexEntry>,
  filter: IAndFilterQuery<TDexEntry>,
  subset?: Set<IHashKey>
): IHashKey | undefined {
  let toIgnore: Set<IHashKey> | undefined;
  let withTags: Set<ITag> | undefined;
  let withoutTags: Set<ITag> | undefined;
  let isValidIfTrue: IMatchFilter<TDexEntry>[] | undefined;
  let isValidIfFalse: IMatchFilter<TDexEntry>[] | undefined;

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

  let tagsToSearch: () => Iterable<ITag> = subset?.size ? null! : withTags?.size
    ? () => [withTags?.entries().next().value as ITag]
    : () => dex.tags;

  const isValid: IMatchFilter<TDexEntry> | true
    = isValidIfTrue
      ? isValidIfFalse
        ? _andWithNotAnd
        : _and
      : isValidIfFalse
        ? _notAnd
        : true;

  let matcher = _buildAndMatcher<TEntry, TDexEntry>(isValid, withTags, withoutTags);
  return _matchFirst<TEntry, TDexEntry>(toIgnore, subset, matcher, dex, filter, tagsToSearch);
}

/** @internal */
function _orWithNotOr<TEntry extends IEntry, TDexEntry extends IEntry>(e: TDexEntry, t: Set<ITag>, i: number, d: IReadOnlyDex<TDexEntry>, args: IQueryFilter<TDexEntry>, isValidIfTrue: IMatchFilter<TDexEntry>[], isValidIfFalse: IMatchFilter<TDexEntry>[]): boolean | Break<boolean> | Break {
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
function _or<TEntry extends IEntry, TDexEntry extends IEntry>(e: TDexEntry, t: Set<ITag>, i: number, d: IReadOnlyDex<TDexEntry>, args: IQueryFilter<TDexEntry>, isValidIfTrue: IMatchFilter<TDexEntry>[]): boolean | Break<boolean> | Break {
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
function _notOr<TEntry extends IEntry, TDexEntry extends IEntry>(e: TDexEntry, t: Set<ITag>, i: number, d: IReadOnlyDex<TDexEntry>, args: IQueryFilter<TDexEntry>, isValidIfFalse: IMatchFilter<TDexEntry>[]): boolean | Break<boolean> | Break {
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
function _andWithNotAnd<TEntry extends IEntry, TDexEntry extends IEntry>(e: TDexEntry, t: Set<ITag>, i: number, d: IReadOnlyDex<TDexEntry>, args: IQueryFilter<TDexEntry>, isValidIfTrue: IMatchFilter<TDexEntry>[], isValidIfFalse: IMatchFilter<TDexEntry>[]): boolean | Break<boolean> | Break {
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
function _and<TEntry extends IEntry, TDexEntry extends IEntry>(e: TDexEntry, t: Set<ITag>, i: number, d: IReadOnlyDex<TDexEntry>, args: IQueryFilter<TDexEntry>, isValidIfTrue: IMatchFilter<TDexEntry>[]): boolean | Break<boolean> | Break {
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
function _notAnd<TEntry extends IEntry, TDexEntry extends IEntry>(e: TDexEntry, t: Set<ITag>, i: number, d: IReadOnlyDex<TDexEntry>, args: IQueryFilter<TDexEntry>, isValidIfFalse: IMatchFilter<TDexEntry>[]): boolean | Break<boolean> | Break {
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
function _buildOrMatcher<TEntry extends IEntry, TDexEntry extends IEntry>(isValid: true | IMatchFilter<TDexEntry>, withoutTags: Set<ITag> | undefined) {
  let matcher: IBreakable<[
    hash: IHashKey,
    tags: Set<ITag>,
    index: number,
    dex: IReadOnlyDex<TDexEntry>,
    args: IQueryFilter<TDexEntry>
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
function _buildAndMatcher<TEntry extends IEntry, TDexEntry extends IEntry>(isValid: true | IMatchFilter<TDexEntry>, withTags: Set<ITag> | undefined, withoutTags: Set<ITag> | undefined) {
  let matcher: IBreakable<[
    hash: IHashKey,
    tags: Set<ITag>,
    index: number,
    dex: IReadOnlyDex<TDexEntry>,
    args: IQueryFilter<TDexEntry>
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
function _matchAll<TEntry extends IEntry, TDexEntry extends IEntry>(
  toIgnore: Set<IHashKey> | undefined,
  subset: Set<IHashKey> | undefined,
  results: Set<IHashKey>,
  matcher: true | IBreakable<[hash: IHashKey, tags: Set<ITag>, index: number, dex: IReadOnlyDex<TDexEntry>, args: IQueryFilter<TDexEntry>], boolean>,
  dex: IReadOnlyDex<TDexEntry>,
  filter: IQueryFilter<TDexEntry>,
  tagsToSearch: () => Iterable<ITag>
) {
  const alreadySeen = new Set<IHashKey>();
  const shouldIgnore = toIgnore?.size
    ? (k: IHashKey) => alreadySeen.has(k) || results.has(k) || toIgnore!.has(k)
    : (k: IHashKey) => alreadySeen.has(k) || results.has(k);
  const ignore = (hash: IHashKey) => alreadySeen.add(hash);

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
          const allTags = (dex as any)._tagsByEntryHash.get(hash) as Set<ITag>;
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
        for (const hash in (dex as any)._hashesByTag.get(tag) as Set<IHashKey>) {
          if (!shouldIgnore(hash)) {
            results.add(hash);
            ignore(hash);
          }
        }
      }
    } else {
      let index = 0;
      for (const tag in tagsToSearch()) {
        for (const hash in (dex as any)._hashesByTag.get(tag) as Set<IHashKey>) {
          if (!shouldIgnore(hash)) {
            const allTags = (dex as any)._tagsByEntryHash.get(hash) as Set<ITag>;
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
function _matchFirst<TEntry extends IEntry, TDexEntry extends IEntry>(
  toIgnore: Set<IHashKey> | undefined,
  subset: Set<IHashKey> | undefined,
  matcher: true | IBreakable<[hash: IHashKey, tags: Set<ITag>, index: number, dex: IReadOnlyDex<TDexEntry>, args: IQueryFilter<TDexEntry>], boolean>,
  dex: IReadOnlyDex<TDexEntry>,
  filter: IQueryFilter<TDexEntry>,
  tagsToSearch: () => Iterable<ITag>
): IHashKey | undefined {
  const shouldIgnore = (hash: IHashKey) => toIgnore?.has(hash);
  const ignore = (hash: IHashKey) => toIgnore?.add(hash);

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
          const allTags = (dex as any)._tagsByEntryHash.get(hash) as Set<ITag>;
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
        for (const hash in (dex as any)._hashesByTag.get(tag) as Set<IHashKey>) {
          if (!shouldIgnore(hash)) {
            return hash;
          }
        }
      }
    } else {
      let index = 0;
      for (const tag in tagsToSearch()) {
        for (const hash in (dex as any)._hashesByTag.get(tag) as Set<IHashKey>) {
          if (!shouldIgnore(hash)) {
            const allTags = (dex as any)._tagsByEntryHash.get(hash) as Set<ITag>;
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