import Dex from "../dex";
import { Entry } from "../subsets/entries";

/**
 * The types of results possible from a query.
 */
export enum ResultType {

  /**
   * Unknown return type. 
   * Usually signifies an error.
   * You can't request a result type of vauge.
   */
  Vauge = '=>unknown;',

  /**
   * Array of values
   */
  Array = '=>TEntry[];',

  /**
   * Set of values
   */
  Set = '=>Set<TEntry>;',

  /**
   * A new filtered dex
   */
  Dex = '=>Dex<TEntry>;',

  /**
   * Just the first matching item.
   */
  First = '=>TEntry;',

  /**
   * Returns the key and value pairs.
   // TODO implement
   */
  Pairs = '=>[IHashKey, TEntry];',

  /**
   * Returns the entries and their tag sets in a tuple.
   // TODO implement
   */
  Tuples = '=>[TEntry, Set<ITag>];',

  /**
   * Returns the key, entry, and tags for the entry as a 3 element tuple.
   // TODO implement
   */
  Full = '=>[IHashKey, TEntry, Set<ITag>];'
}

/**
 * All request types.
 */
export const RESULT_TYPES : Readonly<Set<ResultType>> = new Set<ResultType>([
  ResultType.Vauge,
  ResultType.Array,
  ResultType.Dex,
  ResultType.Set,
  ResultType.First,
  ResultType.Full,
  ResultType.Pairs,
  ResultType.Tuples
]);

/**
 * Returned when an entry is not found by a query.
 */
export const NO_RESULT = undefined;

/**
 * These result types cannot be passed into a query.
 */
export const INVALID_RESULT_REQUEST_TYPES: Readonly<Set<ResultType>> = new Set<ResultType>([
  ResultType.Vauge,
  // TODO implement
  ResultType.Full,
  ResultType.Pairs,
  ResultType.Tuples
]);

/**
 * These result types can be passed into a query.
 */
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
export type Result<TValue, TResultType extends ResultType = ResultType.Vauge, TDexEntry extends Entry = TValue extends Entry ? TValue : Entry>
  = ResultType extends ResultType.Vauge
  ? VaugeResult<TValue, TDexEntry>
  : SpecificResult<TValue, TResultType, TDexEntry>;

/**
 * A specific result
 */
export type SpecificResult<TValue, TResultType extends ResultType, TDexEntry extends Entry = TValue extends Entry ? TValue : Entry>
  = TResultType extends ResultType.First
  ? (TValue | NoEntryFound)
  : TResultType extends ResultType.Array
  ? TValue[]
  : TResultType extends ResultType.Set
  ? Set<TValue>
  : TResultType extends ResultType.Dex
  ? Dex<TDexEntry>
  : never;

/**
 * A vauge result
 */
export type VaugeResult<TValue, TDexEntry extends Entry = TValue extends Entry ? TValue : Entry>
  = TValue[]
  | Dex<TDexEntry>
  | Set<TValue>
  | (TValue | undefined);