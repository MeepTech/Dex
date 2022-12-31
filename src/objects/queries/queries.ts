import { isArray, isFunction } from "../../utilities/validators";
import Dex from "../dex";
import { IFlag, IResultFlag, FLAGS, ILogicFlag, IFlagOrFlags, hasFlag } from "./flags";
import { IEntry } from "../subsets/entries";
import { ITag, ITagOrTags, toSet } from "../subsets/tags";
import { IReadOnlyDex } from "../readonly";
import { IHashKey } from "../subsets/hashes";

export type IQuery<
  TEntry extends IEntry = IEntry,
  TValidFlags extends IFlag = IFlag,
  TDexEntry extends IEntry | TEntry = TEntry,
  TDefaultResult extends QueryResults<TEntry, TDexEntry> = IQueryResult<TEntry, TValidFlags, TDexEntry>,
> = IFullQuery<TEntry, TValidFlags, TDexEntry, TDefaultResult>
  | IBasicQuery<TEntry, TValidFlags, TDexEntry, TDefaultResult>
  | IFirstableQuery<TEntry, TValidFlags, TDexEntry, TDefaultResult>
  | IQueryChain<TEntry, TValidFlags>

export interface IFullQuery<
  TEntry extends IEntry = IEntry,
  TValidFlags extends IFlag = IFlag,
  TDexEntry extends IEntry | TEntry = TEntry,
  TDefaultResult extends QueryResults<TEntry, TDexEntry> = IQueryResult<TEntry, TValidFlags, TDexEntry>
> {

  /**
   * Query for entries that match a single tag.
   */
  (
    tag: ITag
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult
  >;

  /**
   * Query for entries that match a single tag and the provided option flags.
   */
  <TFlag extends IFlag>(
    tag: ITag,
    flag: TFlag
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    TFlag
  >;

  /**
   * Query for entries that match a single tag and the provided option flags.
   */
  <
    TFlag1 extends IFlag,
    TFlag2 extends IFlag,
    TFlag3 extends IFlag
  >(
    tag: ITag,
    flag1: TFlag1,
    flag2: TFlag2,
    flag3?: TFlag3,
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    TFlag1,
    TFlag2,
    TFlag3
  >;

  /**
   * Query for entries that match a single tag and flag options.
   */
  <
    TFlag1 extends IFlag,
    TFlag2 extends IFlag,
    TFlag3 extends IFlag
  >(
    tag: ITag,
    flags: [TFlag1, TFlag2?, TFlag3?]
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    TFlag1,
    TFlag2,
    TFlag3
  >;

  (
    tags: ITagOrTags
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult
  >

  /**
   * Query for entries that match a single tag and the provided option flags.
   */
  <TFlag extends IFlag | NoEntryFound = NoEntryFound>(
    tags: ITagOrTags,
    flag: TFlag
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult
  >

  /**
   * Query for entries that match a single tag and the provided option flags.
   */
  <
    TFlag1 extends IFlag | NoEntryFound = NoEntryFound,
    TFlag2 extends IFlag | NoEntryFound = NoEntryFound,
    TFlag3 extends IFlag | NoEntryFound = NoEntryFound
  >(
    tags: ITagOrTags,
    flag1: TFlag1,
    flag2: TFlag2,
    flag3?: TFlag3,
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    TFlag1,
    TFlag2,
    TFlag3
  >;

  <
    TFlag1 extends IFlag,
    TFlag2 extends IFlag,
    TFlag3 extends IFlag
  >(
    tags: ITagOrTags,
    flags: [TFlag1?, TFlag2?, TFlag3?]
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    TFlag1,
    TFlag2,
    TFlag3
  >;

  <
    TFlag1 extends IFlag,
    TFlag2 extends IFlag,
    TFlag3 extends IFlag
  >(
    tags: ITagOrTags,
    flags: IFlag[]
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    typeof flags[0],
    typeof flags[1],
    typeof flags[2]
  >;

  (
    tags: ITagOrTags,
    flags?: IFlagOrFlags
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    typeof flags extends IFlag ? typeof flags : undefined
  >;

  <
    TFlag1 extends IFlag,
    TFlag2 extends IFlag,
    TFlag3 extends IFlag
  >(
    tags: ITagOrTags,
    flags?: IFlag[]
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult
  >;

  <TFlag extends IFlag>(
    flag: TFlag,
    tag: ITag
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    TFlag
  >

  <TFlag extends IFlag>(
    flag: TFlag,
    ...tags: ITag[]
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    TFlag
  >

  <TFlag extends IFlag>(
    flag: TFlag,
    tags: ITagOrTags
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    TFlag
  >

  <TFlag1 extends IFlag, TFlag2 extends IFlag>(
    flag1: TFlag1,
    flag2: TFlag2,
    tag: ITag
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    TFlag1,
    TFlag2
  >;

  <TFlag1 extends IFlag, TFlag2 extends IFlag>(
    flag1: TFlag1,
    flag2: TFlag2,
    ...tags: ITag[]
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    TFlag1,
    TFlag2
  >;

  <TFlag1 extends IFlag, TFlag2 extends IFlag>(
    flag1: TFlag1,
    flag2: TFlag2,
    tags: ITagOrTags
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    TFlag1,
    TFlag2
  >;

  //
  <
    TFlag1 extends IFlag,
    TFlag2 extends IFlag,
    TFlag3 extends IFlag
  >(
    flag1: TFlag1,
    flag2: TFlag2,
    flag3: TFlag3,
    tag: ITag
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    TFlag1,
    TFlag2,
    TFlag3
  >;

  <
    TFlag1 extends IFlag,
    TFlag2 extends IFlag,
    TFlag3 extends IFlag
  >(
    flag1: TFlag1,
    flag2: TFlag2,
    flag3: TFlag3,
    ...tags: ITag[]
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    TFlag1,
    TFlag2,
    TFlag3
  >;

  <
    TFlag1 extends IFlag,
    TFlag2 extends IFlag,
    TFlag3 extends IFlag
  >(
    flag1: TFlag1,
    flag2: TFlag2,
    flag3: TFlag3,
    tags: ITagOrTags
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    TFlag1,
    TFlag2,
    TFlag3
  >;

  <
    TFlag1 extends IFlag,
    TFlag2 extends IFlag | undefined = undefined,
    TFlag3 extends IFlag | undefined = undefined
  >(
    flags: [TFlag1, TFlag2?, TFlag3?],
    ...tags: ITag[]
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    TFlag1,
    TFlag2,
    TFlag3
  >;

  <
    TFlag1 extends IFlag,
    TFlag2 extends IFlag | undefined = undefined,
    TFlag3 extends IFlag | undefined = undefined
  >(
    flags: [TFlag1, TFlag2?, TFlag3?],
    tags: ITagOrTags
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    TFlag1,
    TFlag2,
    TFlag3
  >;

  <
    TFlag1 extends IFlag,
    TFlag2 extends IFlag | undefined = undefined,
    TFlag3 extends IFlag | undefined = undefined
  >(
    flags: [TFlag1, TFlag2?, TFlag3?],
    tag: ITag
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    TFlag1,
    TFlag2,
    TFlag3
  >;

  (
    ...tags: ITag[]
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult
  >
}

/**
 * The base of other more complex QueryMethods.
 */
export interface IBasicQuery<
  TEntry extends IEntry = IEntry,
  TValidFlags extends IFlag = IFlag,
  TDexEntry extends IEntry | TEntry = TEntry,
  TResults extends QueryResults<TEntry, TDexEntry> = IQueryResult<TEntry, TValidFlags, TDexEntry>
> {
  (tags: ITagOrTags, options?: IFlagOrFlags<TValidFlags>): TResults;
}

/**
 * Represents a special kind of query that selects and returns a sub-Dex
 *
 * @internal
 */
export interface IQueryChain<
  TEntry extends IEntry = IEntry,
  TValidFlags extends IFlag = IFlag
> extends IFullQuery<TEntry, TValidFlags, TEntry, Dex<TEntry>> {
  not: IQueryChain<TEntry, IResultFlag | typeof FLAGS.OR | typeof FLAGS.OR | typeof FLAGS.NOT>;
  and: IQueryChain<TEntry, IResultFlag | typeof FLAGS.NOT | typeof FLAGS.OR>;
  or: IQueryChain<TEntry, IResultFlag | typeof FLAGS.NOT | typeof FLAGS.OR>;
  first: IFullQuery<TEntry, ILogicFlag | typeof FLAGS.FIRST, TEntry, TEntry>;
}

/**
 * Represents a special kind of query that has a first parameter as well
 *
 * @internal
 */
export interface IFirstableQuery<
  TEntry extends IEntry = IEntry,
  TValidFlags extends IFlag = IFlag,
  TDexEntry extends IEntry = TEntry,
  TResults extends QueryResults<TEntry, TDexEntry> = IQueryResult<TEntry, TValidFlags, TDexEntry>
> extends IBasicQuery<TEntry, TValidFlags, TDexEntry, TResults> {
  (tags?: ITagOrTags, options?: TValidFlags[] | TValidFlags): TResults;
  first: IFullQuery<TEntry, typeof FLAGS.FIRST | ILogicFlag, TDexEntry, TEntry>;
}

/**
 * Returned when an entry is not found by a query.
 */
export const NO_RESULT_FOUND_FOR_QUERY = undefined;

/**
 * Returned when an entry is not found by a query.
 */
export type NoEntryFound
  = typeof NO_RESULT_FOUND_FOR_QUERY;

/**
 * Get the specific query result type for a given set of flags.
 */
export type IQueryResult<
  TEntry extends IEntry,
  TFlag extends IFlag | undefined = typeof FLAGS.VALUES,
  TDexEntry extends IEntry = TEntry,
  TDefaultResult extends QueryResults<TEntry, TDexEntry> = TEntry[],
> = TFlag extends typeof FLAGS.FIRST
  ? (TEntry | NoEntryFound)
  : TFlag extends typeof FLAGS.CHAIN
  ? Dex<TDexEntry>
  : TFlag extends typeof FLAGS.VALUES
  ? TEntry[]
  : TDefaultResult;

/**
 * All the types of query results
 */
export type QueryResults<TEntry extends IEntry = IEntry, TDexEntry extends IEntry = TEntry>
  = TEntry | Dex<TDexEntry> | TEntry[] | NoEntryFound;

/** @internal */
export type QueryResultCalculator<
  TEntry extends IEntry,
  TDexEntry extends IEntry = TEntry,
  TDefaultResult extends QueryResults<TEntry, TDexEntry> = TEntry[],
  TFlag1 extends IFlag | undefined = undefined,
  TFlag2 extends IFlag | undefined = undefined,
  TFlag3 extends IFlag | undefined = undefined
> = IQueryResult<
  TEntry,
  TFlag1 extends IResultFlag
  ? TFlag1
  : TFlag2 extends IResultFlag
  ? TFlag2
  : TFlag3,
  TDexEntry,
  TDefaultResult
>;

/** @internal */
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
}

/** @internal */
export function _logicMultiQuery<TEntry extends IEntry>(
  dex: IReadOnlyDex<TEntry>,
  tagOrTags: ITagOrTags,
  flagOrFlags: IFlagOrFlags<ILogicFlag>,
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

  let matchingEntryKeys: IHashKey[] = [];

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
            matchingEntryKeys.push(hash);
          }
        }

        return onEmptyNot(matchingEntryKeys);
      }
    } // [] []
    else {
      // Get items with no tags at all
      if (overrides?.onEmpty) {
        overrides.onEmpty(tags);
      } else {
        for (const [hash, tagsForHash] of (dex as any)._tagsByEntryHash as Map<IHashKey, Set<ITag>>) {
          if (!tagsForHash || !tagsForHash.size) {
            matchingEntryKeys.push(hash);
          }
        }

        return onEmpty(matchingEntryKeys);
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
          matchingEntryKeys = dex.keys([]);
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
              matchingEntryKeys.push(hash);
            }
          }

          return onOrNot(matchingEntryKeys);
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
                matchingEntryKeys.push(hash);
              }
            }
          }

          return onOr(matchingEntryKeys);
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
              matchingEntryKeys.push(hash);
            }
          }

          return onAndNot(matchingEntryKeys);
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

/** @internal */
export function _logicFirstQuery<TEntry extends IEntry>(
  dex: IReadOnlyDex<TEntry>,
  tagOrTags: ITagOrTags,
  flagOrFlags: IFlagOrFlags<ILogicFlag>,
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
        
        return onEmptyNot(NO_RESULT_FOUND_FOR_QUERY);
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

        return onEmpty(NO_RESULT_FOUND_FOR_QUERY);
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

          return onOrNot(NO_RESULT_FOUND_FOR_QUERY);
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

          return onOr(NO_RESULT_FOUND_FOR_QUERY);
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

          return onAndNot(NO_RESULT_FOUND_FOR_QUERY);
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

          return onAnd(potentialResults.size ? potentialResults.entries().next().value : NO_RESULT_FOUND_FOR_QUERY);
        }
      }
    }
  }
}