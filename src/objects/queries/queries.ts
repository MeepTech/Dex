import { isArray } from "../../utilities/validators";
import Dex from "../dex";
import { Flag, ResultFlag, FLAGS, LogicFlag } from "./flags";
import { Entry } from "../subsets/entries";
import { Tag } from "../subsets/tags";
import { IReadOnlyDex } from "../readonly";

export type IQuery<
  TEntry extends Entry = Entry,
  TValidFlags extends Flag = Flag,
  TDexEntry extends Entry | TEntry = TEntry,
  TDefaultResult extends QueryResults<TEntry, TDexEntry> = IQueryResult<TEntry, TValidFlags, TDexEntry>,
> = IFullQuery<TEntry, TValidFlags, TDexEntry, TDefaultResult>
  | IBasicQuery<TEntry, TValidFlags, TDexEntry, TDefaultResult>
  | IFirstableQuery<TEntry, TValidFlags, TDexEntry, TDefaultResult>
  | IQueryChain<TEntry, TValidFlags>

export interface IFullQuery<
  TEntry extends Entry = Entry,
  TValidFlags extends Flag = Flag,
  TDexEntry extends Entry | TEntry = TEntry,
  TDefaultResult extends QueryResults<TEntry, TDexEntry> = IQueryResult<TEntry, TValidFlags, TDexEntry>
> {

  /**
   * Query for entries that match a single tag.
   */
  (
    tag: Tag
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult
  >;

  /**
   * Query for entries that match a single tag and the provided option flags.
   */
  <TFlag extends Flag>(
    tag: Tag,
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
    TFlag1 extends Flag,
    TFlag2 extends Flag,
    TFlag3 extends Flag
  >(
    tag: Tag,
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
    TFlag1 extends Flag,
    TFlag2 extends Flag,
    TFlag3 extends Flag
  >(
    tag: Tag,
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
    tags: Tag[]
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult
  >

  /**
   * Query for entries that match a single tag and the provided option flags.
   */
  <TFlag extends Flag | NoEntryFound = NoEntryFound>(
    tags: Tag[],
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
    TFlag1 extends Flag | NoEntryFound = NoEntryFound,
    TFlag2 extends Flag | NoEntryFound = NoEntryFound,
    TFlag3 extends Flag | NoEntryFound = NoEntryFound
  >(
    tags: Tag[],
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
    TFlag1 extends Flag,
    TFlag2 extends Flag,
    TFlag3 extends Flag
  >(
    tags: Tag[],
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
    TFlag1 extends Flag,
    TFlag2 extends Flag,
    TFlag3 extends Flag
  >(
    tags: Tag[],
    flags: Flag[]
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    typeof flags[0],
    typeof flags[1],
    typeof flags[2]
  >;

  <
    TFlag1 extends Flag,
    TFlag2 extends Flag,
    TFlag3 extends Flag
  >(
    tags: Tag[],
    flags: Flag[]
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    typeof flags[0],
    typeof flags[1],
    typeof flags[2]
  >;

  <
    TFlag1 extends Flag,
    TFlag2 extends Flag,
    TFlag3 extends Flag
  >(
    tags: Tag[],
    flags?: Flag[]
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult
  >;

  <TFlag extends Flag>(
    flag: TFlag,
    tag: Tag
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    TFlag
  >

  <TFlag extends Flag>(
    flag: TFlag,
    ...tags: Tag[]
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    TFlag
  >

  <TFlag extends Flag>(
    flag: TFlag,
    tags: Tag[]
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    TFlag
  >

  <TFlag1 extends Flag, TFlag2 extends Flag>(
    flag1: TFlag1,
    flag2: TFlag2,
    tag: Tag
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    TFlag1,
    TFlag2
  >;

  <TFlag1 extends Flag, TFlag2 extends Flag>(
    flag1: TFlag1,
    flag2: TFlag2,
    ...tags: Tag[]
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    TFlag1,
    TFlag2
  >;

  <TFlag1 extends Flag, TFlag2 extends Flag>(
    flag1: TFlag1,
    flag2: TFlag2,
    tags: Tag[]
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    TFlag1,
    TFlag2
  >;

  //
  <
    TFlag1 extends Flag,
    TFlag2 extends Flag,
    TFlag3 extends Flag
  >(
    flag1: TFlag1,
    flag2: TFlag2,
    flag3: TFlag3,
    tag: Tag
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    TFlag1,
    TFlag2,
    TFlag3
  >;

  <
    TFlag1 extends Flag,
    TFlag2 extends Flag,
    TFlag3 extends Flag
  >(
    flag1: TFlag1,
    flag2: TFlag2,
    flag3: TFlag3,
    ...tags: Tag[]
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    TFlag1,
    TFlag2,
    TFlag3
  >;

  <
    TFlag1 extends Flag,
    TFlag2 extends Flag,
    TFlag3 extends Flag
  >(
    flag1: TFlag1,
    flag2: TFlag2,
    flag3: TFlag3,
    tags: Tag[]
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    TFlag1,
    TFlag2,
    TFlag3
  >;

  <
    TFlag1 extends Flag,
    TFlag2 extends Flag | undefined = undefined,
    TFlag3 extends Flag | undefined = undefined
  >(
    flags: [TFlag1, TFlag2?, TFlag3?],
    ...tags: Tag[]
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    TFlag1,
    TFlag2,
    TFlag3
  >;

  <
    TFlag1 extends Flag,
    TFlag2 extends Flag | undefined = undefined,
    TFlag3 extends Flag | undefined = undefined
  >(
    flags: [TFlag1, TFlag2?, TFlag3?],
    tags: Tag[]
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    TFlag1,
    TFlag2,
    TFlag3
  >;

  <
    TFlag1 extends Flag,
    TFlag2 extends Flag | undefined = undefined,
    TFlag3 extends Flag | undefined = undefined
  >(
    flags: [TFlag1, TFlag2?, TFlag3?],
    tag: Tag
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    TFlag1,
    TFlag2,
    TFlag3
  >;

  (
    ...tags: Tag[]
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
  TEntry extends Entry = Entry,
  TValidFlags extends Flag = Flag,
  TDexEntry extends Entry | TEntry = TEntry,
  TResults extends QueryResults<TEntry, TDexEntry> = IQueryResult<TEntry, TValidFlags, TDexEntry>
> {
  (tags: Tag[], options?: TValidFlags[]): TResults;
}

/**
 * Represents a special kind of query that selects and returns a sub-Dex
 *
 * @internal
 */
export interface IQueryChain<
  TEntry extends Entry = Entry,
  TValidFlags extends Flag = Flag
> extends IFullQuery<TEntry, TValidFlags, TEntry, Dex<TEntry>> {
  not: IQueryChain<TEntry, ResultFlag | typeof FLAGS.OR | typeof FLAGS.OR | typeof FLAGS.NOT>;
  and: IQueryChain<TEntry, ResultFlag | typeof FLAGS.NOT | typeof FLAGS.OR>;
  or: IQueryChain<TEntry, ResultFlag | typeof FLAGS.NOT | typeof FLAGS.OR>;
  first: IFullQuery<TEntry, LogicFlag | typeof FLAGS.FIRST, TEntry, TEntry>;
}

/**
 * Represents a special kind of query that has a first parameter as well
 *
 * @internal
 */
export interface IFirstableQuery<
  TEntry extends Entry = Entry,
  TValidFlags extends Flag = Flag,
  TDexEntry extends Entry = TEntry,
  TResults extends QueryResults<TEntry, TDexEntry> = IQueryResult<TEntry, TValidFlags, TDexEntry>
> extends IBasicQuery<TEntry, TValidFlags, TDexEntry, TResults> {
  (tags?: Tag[], options?: TValidFlags[]): TResults;
  first: IFullQuery<TEntry, typeof FLAGS.FIRST | LogicFlag, TDexEntry, TEntry>;
}

/**
 * Returned when an entry is not found by a query.
 */
export const NO_RESULTS_FOUND_FOR_QUERY = undefined;

/**
 * Returned when an entry is not found by a query.
 */
export type NoEntryFound
  = typeof NO_RESULTS_FOUND_FOR_QUERY;

/**
 * Get the specific query result type for a given set of flags.
 */
export type IQueryResult<
  TEntry extends Entry,
  TFlag extends Flag | undefined = typeof FLAGS.VALUES,
  TDexEntry extends Entry = TEntry,
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
export type QueryResults<TEntry extends Entry = Entry, TDexEntry extends Entry = TEntry>
  = TEntry | Dex<TDexEntry> | TEntry[] | NoEntryFound;

/** @internal */
export type QueryResultCalculator<
  TEntry extends Entry,
  TDexEntry extends Entry = TEntry,
  TDefaultResult extends QueryResults<TEntry, TDexEntry> = TEntry[],
  TFlag1 extends Flag | undefined = undefined,
  TFlag2 extends Flag | undefined = undefined,
  TFlag3 extends Flag | undefined = undefined
> = IQueryResult<
  TEntry,
  TFlag1 extends ResultFlag
  ? TFlag1
  : TFlag2 extends ResultFlag
  ? TFlag2
  : TFlag3,
  TDexEntry,
  TDefaultResult
>;

/** @internal */
export function QueryConstructor<
  TEntry extends Entry,
  TDexEntry extends Entry | TEntry = TEntry,
  TValidFlags extends Flag = Flag,
  TValidResults extends QueryResults<TEntry, TDexEntry> = QueryResults<TEntry, TDexEntry>,
  TDefaultResult extends QueryResults<TEntry, TDexEntry> = IQueryResult<TEntry, TValidFlags, TDexEntry>,
  TBaseValidResults extends QueryResults<TEntry, TDexEntry> = QueryResults<TEntry, TDexEntry>,
  TBaseValidFlags extends Flag = TValidFlags
>(
  base: IBasicQuery<TEntry, TBaseValidFlags, TDexEntry, TBaseValidResults>,
  dex: IReadOnlyDex<TDexEntry>
): IFullQuery<TEntry, TValidFlags, TDexEntry, TDefaultResult> {
  const query: IFullQuery<TEntry, TValidFlags, TDexEntry, TDefaultResult> = function <
    TFlag1 extends Flag | undefined = undefined,
    TFlag2 extends Flag | undefined = undefined,
    TFlag3 extends Flag | undefined = undefined
  >(
    ...args: any[]
  ): TValidResults extends TDefaultResult ? TValidResults : TDefaultResult {
    const flags = [];
    const tags = [];

    let index = 0;
    for (const arg of args) {
      if (isArray(arg)) {
        if (arg && index < 2 && FLAGS.contains(arg[0])) {
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