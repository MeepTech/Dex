import Dex from "../dex";
import { IEntry } from "../subsets/entries";

/**
 * The types of results possible from a query.
 */
export enum ResultType {

  /**
   * Unknown return type. 
   * Usually signifies an error.
   * You can't request a result type of vauge.
   */
  Vauge = '=>vauge;',

  /**
   * Array of values
   */
  Array = '=>array;',

  /**
   * Set of values
   */
  Set = '=>set;',

  /**
   * A new filtered dex
   */
  Dex = '=>dex;',

  /**
   * Just the first matching item.
   */
  First = '=>first;'
}

/**
 * Returned when an entry is not found by a query.
 */
export const NO_RESULT = undefined;

export const INVALID_RESULT_REQUEST_TYPES: Readonly<Set<ResultType>> = new Set<ResultType>([
  ResultType.Vauge
]);

export const VALID_RESULT_REQUEST_TYPES: Readonly<Set<ResultType>> = new Set<ResultType>([
  ResultType.Array,
  ResultType.Dex,
  ResultType.Set,
  ResultType.First
]);

/**
 * Returned when an entry is not found by a query.
 */
export type NoEntryFound
  = typeof NO_RESULT;

/**
 * A result of a query.
 */
export type IResult<TEntry extends IEntry, TResultType extends ResultType = ResultType.Vauge, TDexEntry extends IEntry = TEntry>
  = ResultType extends ResultType.Vauge
  ? IVaugeResult<TEntry, TDexEntry>
  : ISpecificResult<TEntry, TResultType, TDexEntry>;

/** @internal */
type ISpecificResult<TEntry extends IEntry, TResultType extends ResultType, TDexEntry extends IEntry = TEntry>
  = TResultType extends ResultType.First
  ? (TEntry | NoEntryFound)
  : TResultType extends ResultType.Array
  ? TEntry[]
  : TResultType extends ResultType.Set
  ? Set<TEntry>
  : TResultType extends ResultType.Dex
  ? Dex<TDexEntry>
  : never;

/** @internal */
type IVaugeResult<TEntry extends IEntry, TDexEntry extends IEntry = TEntry>
  = TEntry[]
  | Dex<TDexEntry>
  | Set<TEntry>
  | (TEntry | undefined);