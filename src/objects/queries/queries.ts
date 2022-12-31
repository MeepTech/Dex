import { isArray, isFunction, isObject, isTag } from "../../utilities/validators";
import { IEntry } from "../subsets/entries";
import { ITag, ITagOrTags, toSet } from "../subsets/tags";
import { IReadOnlyDex } from "../readonly";
import { IHashKey } from "../subsets/hashes";
import { IResult, ResultType } from "./results";
import { IFilter, IQueryFilter } from "./params";
import Dex, { InvalidQueryParamError, NotImplementedError } from "../dex";

/**
 * 
 */
export type IQuery<TEntry extends IEntry, TResult extends ResultType>
  = ISpecificQuery<TEntry, TResult>
  | IFullQuery<TEntry, TResult>;

/**
 * A query that just returns one type of value
 */
export interface ISpecificQuery
  <TEntry extends IEntry, TResult extends ResultType>
  extends IQueryBase<TEntry, TResult> { }

/**
 * A query that can return many different types, and has more options than a specific query
 */
export interface IFullQuery<
  TEntry extends IEntry,
  TDefaultResult extends ResultType
> extends IQueryBase<TEntry, TDefaultResult> {

  <TResultType extends ResultType = TDefaultResult>(
    tag: ITag,
    options: {
      filters?: IQueryFilter<TEntry>[] | IQueryFilter<TEntry>,
      result: TResultType
    }
  ): IResult<TEntry, TResultType>

  <TResultType extends ResultType>(
    tag: ITag,
    result: TResultType
  ): IResult<TEntry, TResultType>

  <TResultType extends ResultType = TDefaultResult>(
    tags: ITagOrTags,
    options: {
      filters?: IQueryFilter<TEntry>[] | IQueryFilter<TEntry>,
      result: TResultType
    }
  ): IResult<TEntry, TResultType>

  <TResultType extends ResultType>(
    tags: ITagOrTags,
    result: TResultType
  ): IResult<TEntry, TResultType>

  <TResultType extends ResultType>(
    result: TResultType,
    tag: ITag
  ): IResult<TEntry, TResultType>

  <TResultType extends ResultType>(
    result: TResultType,
    ...tags: ITag[]
  ): IResult<TEntry, TResultType>

  <TResultType extends ResultType>(
    result: TResultType,
    ...filters: IQueryFilter<TEntry>[]
  ): IResult<TEntry, TResultType>

  <TResultType extends ResultType>(
    ...tagsAndResult: [...ITag[], TResultType]
  ): IResult<TEntry, TResultType>

  <TResultType extends ResultType = TDefaultResult>(
    filter: IQueryFilter<TEntry>,
    result: TResultType
  ): IResult<TEntry, TResultType>

  <TResultType extends ResultType = TDefaultResult>(
    filters: IQueryFilter<TEntry>[],
    result: TResultType
  ): IResult<TEntry, TResultType>

  <TResultType extends ResultType>(
    ...filtersAndResult: [...IQueryFilter<TEntry>[], TResultType]
  ): IResult<TEntry, TDefaultResult>
}

/**
 * Represents a special kind of query that has a first parameter as well
 *
 * @internal
 */
export interface IFirstableQuery<
  TEntry extends IEntry,
  TDefaultResult extends ResultType,
> extends ISpecificQuery<TEntry, TDefaultResult> {
  first: IFullQuery<TEntry, ResultType.First>;
}

/** @internal */
interface IQueryBase<TEntry extends IEntry, TResult extends ResultType> {
  (
    tag: ITag,
    options?: {
      filters?: IQueryFilter<TEntry>[] | IQueryFilter<TEntry>
    }
  ): IResult<TEntry, TResult>

  (
    tags: ITagOrTags,
    options?: {
      filters?: IQueryFilter<TEntry>[] | IQueryFilter<TEntry>
    }
  ): IResult<TEntry, TResult>

  (filter: IQueryFilter<TEntry>)
    : IResult<TEntry, TResult>

  (filters: IQueryFilter<TEntry>[])
    : IResult<TEntry, TResult>

  (...filters: IQueryFilter<TEntry>[])
    : IResult<TEntry, TResult>
}


const testQuery: IFullQuery<IEntry, ResultType.Array> = {} as any;

const _1 = testQuery(["a", "e", 1, 5]);
const _2 = testQuery(["a", "e", 1, 5], ResultType.Dex);
const _3 = testQuery(ResultType.Set, { and: ["one", "two"] });
const _3_1 = testQuery(ResultType.First, { and: ["one", "two"] });
const _4 = testQuery({ and: ["one", "two"] }, ResultType.First);
const _5 = testQuery({ and: ["one", "two"] }, { not: { hashes: ["ID:KW$#kj3tijergwigg"] } });
const _6 = testQuery({ not: { hashes: ["ID:KW$#kj3tijergwigg"] } });

/*
export function QueryConstructor<
  TEntry extends IEntry,
  TDexEntry extends IEntry | TEntry = TEntry,
  TValidFlags extends IFlag = IFlag,
  TValidResults extends QueryResults<TEntry, TDexEntry> = QueryResults<TEntry, TDexEntry>,
  TDefaultResult extends QueryResults<TEntry, TDexEntry> = IQueryResult<TEntry, TValidFlags, TDexEntry>,
  TBaseValidResults extends QueryResults<TEntry, TDexEntry> = QueryResults<TEntry, TDexEntry>,
  TBaseValidFlags extends IFlag = TValidFlags
>(
  base: IBasicQuery<TEntry, TBaseValidFlags, TDexEntry, TBaseValidResults>,
  dex: IReadOnlyDex<TDexEntry>
): IFullQuery<TEntry, TValidFlags, TDexEntry, TDefaultResult> {
  const query: IFullQuery<TEntry, TValidFlags, TDexEntry, TDefaultResult> = function <
    TFlag1 extends IFlag | undefined = undefined,
    TFlag2 extends IFlag | undefined = undefined,
    TFlag3 extends IFlag | undefined = undefined
  >(
    ...args: any[]
  ): TValidResults extends TDefaultResult ? TValidResults : TDefaultResult {
    const flags = [];
    const tags = [];

    let index = 0;
    for (const arg of args) {
      if (isArray(arg)) {
        // only first two args could be an array of flags
        if (index < 2 && FLAGS.is(arg[0])) {
          for (const f of arg) {
            flags.push(f);
          }
        } else {
          for (const t of arg) {
            tags.push(t);
          }
        }
      } else if (arg instanceof Set) {
        // only first two args could be an array of flags
        if (index < 2 && FLAGS.is(arg.values().next().value)) {
          for (const f of arg) {
            flags.push(f);
          }
        } else {
          for (const t of arg) {
            tags.push(t);
          }
        }
      }

      index++;
    }

    return base.bind(dex)(
      tags,
      flags
    ) as TValidResults extends TDefaultResult
      ? TValidResults
      : TDefaultResult;
  }

  return query;
}*/


/** @internal */
type QueryFilterLogicOverrides = {
  onEmpty?: ((tags: Set<ITag>) => void) | undefined;
  onEmptyNot?: ((tags: Set<ITag>) => void) | undefined;
  onAnd?: ((tags: Set<ITag>) => void) | undefined;
  onAndNot?: ((tags: Set<ITag>) => void) | undefined;
  onOr?: ((tags: Set<ITag>) => void) | undefined;
  onOrNot?: ((tags: Set<ITag>) => void) | undefined;
};

/** @internal */
export const FullQueryConstructor = <TEntry extends IEntry, TDefaultResult extends ResultType, TDexEntry extends IEntry = TEntry>(
  dex: IReadOnlyDex<TDexEntry>,
  defaultResult: TDefaultResult,
  overrides?: QueryFilterLogicOverrides & {
    transform?: (hash: IHashKey) => TEntry
  }
): IFullQuery<TEntry, TDefaultResult> => function <
  TEntry extends IEntry,
  TResultType extends ResultType
>(
  this: IReadOnlyDex<TDexEntry>,
  ...args: any
): IResult<TEntry, TResultType, TDexEntry> {
  // sort params to filters
  const {
    filters,
    result: resultType = defaultResult
  } = _convertQueryParamsToFilters(...args);

  // switch based on requested return type.
  overrides ??= {};
  let results: IResult<TEntry, typeof resultType, TDexEntry>;
  let collectMatches: ((matches: IHashKey[]) => void);
  let transform
    = overrides?.transform
    ?? (hash => dex.get(hash!));
  
  switch (resultType) {
    // array
    case ResultType.Array:
      collectMatches = hashes => results =
        hashes.map(transform);
      
      break;
    // first
    case ResultType.First:
      // first only logic
      _logicFirstQuery(this, filters, hash =>
        results = hash === undefined
          ? undefined
          : transform(hash));
          
      return results as IResult<TEntry, TResultType, TDexEntry>;
    // set
    case ResultType.Set:
      results = new Set<TEntry>();
      collectMatches = hashes => {
        for (const hash of hashes) {
          (results as Set<TEntry>).add(transform(hash));
        }
      }

      break;
    // dex
    case ResultType.Dex:
      results = new Dex<TDexEntry>();
      collectMatches = hashes => (results as Dex<TDexEntry>)
        .copy
        .from(this, hashes)
      
      overrides = {
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
      }
      
      break;
    // vauge
    case ResultType.Vauge:
      throw new InvalidQueryParamError(resultType, "resultType")
  }

  // multi-result logic
  _logicMultiQuery(this, filters, collectMatches, overrides);

  return results as IResult<TEntry, TResultType, TDexEntry>;
};

/** @internal */
function _convertQueryParamsToFilters<TEntry extends IEntry>(
  ...args: any[]
): { filters: IQueryFilter<TEntry>[], result: ResultType | undefined } {
  let filters: IQueryFilter<TEntry>[] = [];
  let result: ResultType | undefined;

  if (args[0] in ResultType) {
    // 0: result
    result = args.shift();

    if (isArray(args[0])) {
      const tagOrFilters: ITag[] | IQueryFilter<TEntry>[] = args[0];
      // 1: filters
      if (isObject(tagOrFilters[0])) {
        filters = tagOrFilters as IQueryFilter<TEntry>[];
      } // 1: tags
      else {
        filters.push(
          { or: { tags: tagOrFilters as ITag[] } }
        )
      }
    } else {
      // ...1: filters:
      if (isObject(args[0])) {
        filters = args as IQueryFilter<TEntry>[];
      } // ...1: tags:
      else if (args[0] !== undefined) {
        filters.push({
          or: { tags: args as ITag[] }
        });
      }
    }

    return { filters, result };
  } else if (isArray(args[0])) {
    const tagOrFilters: ITag[] | IQueryFilter<TEntry>[] = args[0];
    // 0: filters
    if (isObject(tagOrFilters[0])) {
      filters = tagOrFilters as IQueryFilter<TEntry>[];
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
      result = _addQueryOptionsToFilters<TEntry>(args[1], filters, result);
    }

    return { filters, result };
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
        result = _addQueryOptionsToFilters<TEntry>(args[1], filters, result);
      }

      return { filters, result };
    } else {
      // 0: options:
      if (args[0].hasOwnProperty("result") || args[0].hasOwnProperty("filters")) {
        result = _addQueryOptionsToFilters<TEntry>(args[0], filters, result);

        return { filters, result };
      } // 0: filter
      else {
        filters.push(args.shift() as IQueryFilter<TEntry>);

        // 1: result
        if (args[0] as any in ResultType) {
          result = args[0] as any as ResultType;
        } else if (isObject(args[0])) {
          (args as IQueryFilter<TEntry>[])
            .forEach(f =>
              filters.push(f));
        }

        return { filters, result };
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
      result = _addQueryOptionsToFilters<TEntry>(args[1], filters, result);
    } // ...1: tags:
    else if (args[1] !== undefined) {
      filters.push({
        or: { tags: args as ITag[] }
      });
    }

    return { filters, result };
  }
  else {
    throw new InvalidQueryParamError(args[0], 0);
  }
}

function _addQueryOptionsToFilters<TEntry extends IEntry>(
  options: {
    filters?: IQueryFilter<TEntry>[] | IQueryFilter<TEntry>,
    result?: ResultType
  },
  currentFilters: IQueryFilter<TEntry>[],
  currentResult: ResultType | undefined
): ResultType | undefined {
  if (options.filters) {
    if (isArray(options.filters)) {
      options.filters.forEach(f => currentFilters.push(f));
    } else {
      currentFilters.push(options.filters);
    }
  }

  if (options.result) {
    return options.result;
  }

  return currentResult;
}

// TODO: fix the two functions below.
/** @internal */
export function _logicMultiQuery<TEntry extends IEntry>(
  dex: IReadOnlyDex<TEntry>,
  filters: IQueryFilter<TEntry>[],
  /**
   * A single logic function to use for all results, or one for each type of result. 
   *     (onComplete is the default in the second case.)
   */
  onComplete: ((matches: IHashKey[]) => void)
    | {
      onEmpty?: (matches: IHashKey[]) => void,
      onEmptyNot?: (matches: IHashKey[]) => void,
      onAnd?: (matches: IHashKey[]) => void,
      onAndNot?: (matches: IHashKey[]) => void,
      onOr?: (matches: IHashKey[]) => void,
      onOrNot?: (matches: IHashKey[]) => void,
      /**
       * The default
       * (is executed at the end if provided)
       */
      onDefault?: (matches: IHashKey[]) => void
    },
  overrides?: {
    onEmpty?: (tags: Set<ITag>) => void,
    onEmptyNot?: (tags: Set<ITag>) => void,
    onAnd?: (tags: Set<ITag>) => void,
    onAndNot?: (tags: Set<ITag>) => void,
    onOr?: (tags: Set<ITag>) => void,
    onOrNot?: (tags: Set<ITag>) => void
  }
) {
  var
    onEmpty: ((matches: IHashKey[]) => void) = undefined!,
    onEmptyNot: ((matches: IHashKey[]) => void) = undefined!,
    onAnd: ((matches: IHashKey[]) => void) = undefined!,
    onAndNot: ((matches: IHashKey[]) => void) = undefined!,
    onOr: ((matches: IHashKey[]) => void) = undefined!,
    onOrNot: ((matches: IHashKey[]) => void) = undefined!;

  const tags = toSet(tagOrTags);
  if (isFunction(onComplete)) {
    var
      onEmpty = onComplete as ((matches: IHashKey[]) => void),
      onEmptyNot = onComplete as ((matches: IHashKey[]) => void),
      onAnd = onComplete as ((matches: IHashKey[]) => void),
      onAndNot = onComplete as ((matches: IHashKey[]) => void),
      onOr = onComplete as ((matches: IHashKey[]) => void),
      onOrNot = onComplete as ((matches: IHashKey[]) => void);
  } else {
    const onDefault = (onComplete as any).onDefault as ((matches: IHashKey[]) => void);
    var {
      onEmpty = onDefault,
      onEmptyNot = onDefault,
      onAnd = onDefault,
      onAndNot = onDefault,
      onOr = onDefault,
      onOrNot = onDefault
    } = onComplete as {
      onEmpty?: (matches: IHashKey[]) => void,
      onEmptyNot?: (matches: IHashKey[]) => void,
      onAnd?: (matches: IHashKey[]) => void,
      onAndNot?: (matches: IHashKey[]) => void,
      onOr?: (matches: IHashKey[]) => void,
      onOrNot?: (matches: IHashKey[]) => void
    };
  }
  let matches: IHashKey[] = [];

  for (const filter of filters) {
    let matchesForFilter: IHashKey[];

    switch(filter) {
      case filter.and: {
        matchesForFilter = _queryAllForAnd(filter, overrides);
      }
      case filter.or: {
        matchesForFilter = _queryAllForOr(filter, overrides);
      }
    }


    // []
    if (!tags.size) {
      // NOT []
      if (hasFlag(flagOrFlags, FLAGS.NOT)) {
        // Get items with any tags at all
        if (overrides?.onEmptyNot) {
          overrides.onEmptyNot(tags);
        } else {
          for (const hash in dex.hashes) {
            const tagsForHash = ((dex as any)._tagsByEntryHash as Map<IHashKey, Set<ITag>>).get(hash);
            if (tagsForHash && tagsForHash.size) {
              matchesForFilter.push(hash);
            }
          }

          return onEmptyNot(matchesForFilter);
        }
      } // [] []
      else {
        // Get items with no tags at all
        if (overrides?.onEmpty) {
          overrides.onEmpty(tags);
        } else {
          for (const [hash, tagsForHash] of (dex as any)._tagsByEntryHash as Map<IHashKey, Set<ITag>>) {
            if (!tagsForHash || !tagsForHash.size) {
              matchesForFilter.push(hash);
            }
          }

          return onEmpty(matchesForFilter);
        }
      }
    } else {
      // OR
      if (hasFlag(flagOrFlags, FLAGS.OR)) {
        // OR NOT
        if (hasFlag(flagOrFlags, FLAGS.NOT)) {
          if (overrides?.onOrNot) {
            overrides.onOrNot(tags);
          } else {
            matchesForFilter = dex.keys([]);
            const validTags = [...dex.tags.filter(f => !tags.has(f))];
            const hashes = dex.keys(validTags, FLAGS.OR);

            for (const hash of hashes) {
              const entryTags = (dex as any)._tagsByEntryHash.get(hash)! as Set<ITag>;
              let hasInvalidTags: boolean = false;
              for (const tag of tags) {
                if (entryTags.has(tag)) {
                  hasInvalidTags = true;
                  break;
                }
              }

              if (!hasInvalidTags) {
                matchesForFilter.push(hash);
              }
            }

            return onOrNot(matchesForFilter);
          }
        } // OR OR
        else {
          if (overrides?.onOr) {
            overrides.onOr(tags);
          } else {
            for (const tag in tags) {
              const hashesForTag: Set<IHashKey> | undefined = (dex as any)._hashesByTag.get(tag)!;
              if (hashesForTag) {
                for (const hash in hashesForTag) {
                  matchesForFilter.push(hash);
                }
              }
            }

            return onOr(matchesForFilter);
          }
        }
      } // AND 
      else {
        // AND NOT
        if (hasFlag(flagOrFlags, FLAGS.NOT)) {
          if (overrides?.onAndNot) {
            overrides.onAndNot(tags);
          } else {
            for (const [hash, tagsForHash] of (dex as any)._tagsByEntryHash as Map<IHashKey, Set<ITag>>) {
              let count = 0;
              for (const tag of tags) {
                if (tagsForHash.has(tag)) {
                  count++;
                }
              }

              if (count != tags.size) {
                matchesForFilter.push(hash);
              }
            }

            return onAndNot(matchesForFilter);
          }
        } // AND AND
        else {
          if (overrides?.onAnd) {
            overrides.onAnd(tags);
          } else {
            let potentialResults = new Set<IHashKey>();
            let isFirstLoop: boolean = true;

            for (const tag of tags) {
              const hashesForTag
                = ((dex as any)._hashesByTag as Map<ITag, Set<IHashKey>>).get(tag)
                ?? new Set<IHashKey>();

              if (isFirstLoop) {
                potentialResults = hashesForTag;
              } else {
                for (const key of potentialResults) {
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

            return onAnd([...potentialResults]);
          }
        }
      }
    }
  }
}

/** @internal */
export function _logicFirstQuery<TEntry extends IEntry>(
  dex: IReadOnlyDex<TEntry>,
  filters: IQueryFilter<TEntry>[],
  /**
   * A single logic function to use for all results, or one for each type of result. 
   *     (onComplete is the default in the second case.)
   */
  onComplete: ((match?: IHashKey) => void)
    | {
      onEmpty?: (match?: IHashKey) => void,
      onEmptyNot?: (match?: IHashKey) => void,
      onAnd?: (match?: IHashKey) => void,
      onAndNot?: (match?: IHashKey) => void,
      onOr?: (match?: IHashKey) => void,
      onOrNot?: (match?: IHashKey) => void,
      /**
       * The default
       * (is executed at the end if provided)
       */
      onDefault?: (match?: IHashKey) => void
    },
  overrides?: {
    onEmpty?: (tags: Set<ITag>) => void,
    onEmptyNot?: (tags: Set<ITag>) => void,
    onAnd?: (tags: Set<ITag>) => void,
    onAndNot?: (tags: Set<ITag>) => void,
    onOr?: (tags: Set<ITag>) => void,
    onOrNot?: (tags: Set<ITag>) => void
  }
) {
  var
    onEmpty: ((match?: IHashKey) => void) = undefined!,
    onEmptyNot: ((match?: IHashKey) => void) = undefined!,
    onAnd: ((match?: IHashKey) => void) = undefined!,
    onAndNot: ((match?: IHashKey) => void) = undefined!,
    onOr: ((match?: IHashKey) => void) = undefined!,
    onOrNot: ((match?: IHashKey) => void) = undefined!;

  const tags = toSet(tagOrTags);
  if (isFunction(onComplete)) {
    var
      onEmpty = onComplete as ((match?: IHashKey) => void),
      onEmptyNot = onComplete as ((match?: IHashKey) => void),
      onAnd = onComplete as ((match?: IHashKey) => void),
      onAndNot = onComplete as ((match?: IHashKey) => void),
      onOr = onComplete as ((match?: IHashKey) => void),
      onOrNot = onComplete as ((match?: IHashKey) => void);
  } else {
    const onDefault = (onComplete as any).onDefault as ((match?: IHashKey) => void);
    var {
      onEmpty = onDefault,
      onEmptyNot = onDefault,
      onAnd = onDefault,
      onAndNot = onDefault,
      onOr = onDefault,
      onOrNot = onDefault
    } = onComplete as {
      onEmpty?: (match?: IHashKey) => void,
      onEmptyNot?: (match?: IHashKey) => void,
      onAnd?: (match?: IHashKey) => void,
      onAndNot?: (match?: IHashKey) => void,
      onOr?: (match?: IHashKey) => void,
      onOrNot?: (match?: IHashKey) => void
    };
  }

  // []
  if (!tags.size) {
    if (hasFlag(flagOrFlags, FLAGS.NOT)) { // NOT []
      if (overrides?.onEmptyNot) {
        overrides.onEmptyNot(tags);
      } else {
        for (const hash in dex.hashes) {
          const tagsForHash = ((dex as any)._tagsByEntryHash as Map<IHashKey, Set<ITag>>).get(hash);
          if (tagsForHash && tagsForHash.size) {
            return onEmptyNot(hash);
          }
        }

        return onEmptyNot(NO_RESULT);
      }
    } else { // [] []
      if (overrides?.onEmpty) {
        overrides.onEmpty(tags);
      } else {
        for (const [hash, tagsForHash] of (dex as any)._tagsByEntryHash as Map<IHashKey, Set<ITag>>) {
          if (!tagsForHash || !tagsForHash.size) {
            return onEmpty(hash);
          }
        }

        return onEmpty(NO_RESULT);
      }
    }
  } else {
    // OR
    if (hasFlag(flagOrFlags, FLAGS.OR)) {
      // OR NOT
      if (hasFlag(flagOrFlags, FLAGS.NOT)) {
        if (overrides?.onOrNot) {
          overrides.onOrNot(tags);
        } else {
          // TODO: can this be optomized for first?
          const validTags = [...dex.tags.filter(f => !tags.has(f))];
          const hashes = dex.keys(validTags);

          for (const hash of hashes) {
            const entryTags = (dex as any)._tagsByEntryHash.get(hash)! as Set<ITag>;
            let hasInvalidTags: boolean = false;
            for (const tag of tags) {
              if (entryTags.has(tag)) {
                hasInvalidTags = true;
                break;
              }
            }

            if (!hasInvalidTags) {
              return onOrNot(hash);
            }
          }

          return onOrNot(NO_RESULT);
        }
      } // OR OR
      else {
        if (overrides?.onOr) {
          overrides.onOr(tags);
        } else {
          for (const tag in tags) {
            const hashesForTag: Set<IHashKey> | undefined = (dex as any)._hashesByTag.get(tag)!;
            if (hashesForTag) {
              for (const hash in hashesForTag) {
                return onOr(hash);
              }
            }
          }

          return onOr(NO_RESULT);
        }
      }
    } // AND 
    else {
      // AND NOT
      if (hasFlag(flagOrFlags, FLAGS.NOT)) {
        if (overrides?.onAndNot) {
          overrides.onAndNot(tags);
        } else {
          for (const [hash, tagsForHash] of (dex as any)._tagsByEntryHash as Map<IHashKey, Set<ITag>>) {
            let count = 0;
            for (const tag of tags) {
              if (tagsForHash.has(tag)) {
                count++;
              }
            }

            if (count != tags.size) {
              return onAndNot(hash);
            }
          }

          return onAndNot(NO_RESULT);
        }
      } // AND AND
      else {
        if (overrides?.onAnd) {
          overrides.onAnd(tags);
        } else {
          let potentialResults = new Set<IHashKey>();
          let isFirstLoop: boolean = true;

          for (const tag of tags) {
            const hashesForTag
              = ((dex as any)._hashesByTag as Map<ITag, Set<IHashKey>>).get(tag)
              ?? new Set<IHashKey>();

            if (isFirstLoop) {
              potentialResults = hashesForTag;
            } else {
              for (const key of potentialResults) {
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

          return onAnd(potentialResults.size ? potentialResults.entries().next().value : NO_RESULT);
        }
      }
    }
  }
}

function _queryAllForOr<TEntry extends IEntry>(filter: IQueryFilter<TEntry>, overrides: { onEmpty?: ((tags: Set<ITag>) => void) | undefined; onEmptyNot?: ((tags: Set<ITag>) => void) | undefined; onAnd?: ((tags: Set<ITag>) => void) | undefined; onAndNot?: ((tags: Set<ITag>) => void) | undefined; onOr?: ((tags: Set<ITag>) => void) | undefined; onOrNot?: ((tags: Set<ITag>) => void) | undefined; } | undefined): IHashKey[] {
  throw new Error("Function not implemented.");
}

function _queryAllForAnd<TEntry extends IEntry>(filter: IQueryFilter<TEntry>, overrides: QueryFilterLogicOverrides): IHashKey[] {
  throw new Error("Function not implemented.");
}

function _queryFirstForOr<TEntry extends IEntry>(
  filter: IQueryFilter<TEntry>,
  overrides: { onEmpty?: ((tags: Set<ITag>) => void) | undefined; onEmptyNot?: ((tags: Set<ITag>) => void) | undefined; onAnd?: ((tags: Set<ITag>) => void) | undefined; onAndNot?: ((tags: Set<ITag>) => void) | undefined; onOr?: ((tags: Set<ITag>) => void) | undefined; onOrNot?: ((tags: Set<ITag>) => void) | undefined; } | undefined): IHashKey[] {
  throw new Error("Function not implemented.");
}

function _queryFirstForAnd<TEntry extends IEntry>(filter: IQueryFilter<TEntry>, overrides: { onEmpty?: ((tags: Set<ITag>) => void) | undefined; onEmptyNot?: ((tags: Set<ITag>) => void) | undefined; onAnd?: ((tags: Set<ITag>) => void) | undefined; onAndNot?: ((tags: Set<ITag>) => void) | undefined; onOr?: ((tags: Set<ITag>) => void) | undefined; onOrNot?: ((tags: Set<ITag>) => void) | undefined; } | undefined): IHashKey[] {
  throw new Error("Function not implemented.");
}

