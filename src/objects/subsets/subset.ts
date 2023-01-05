import { Break, IBreakable } from "../../utilities/iteration";
import Dex from "../dex";
import { Result, NO_RESULT, ResultType } from "../queries/results";
import { IReadonlyDex } from "../readonly";
import { Entry } from "./entries";
import { HashKey } from "./hashes";
import { Tag } from "./tags";

/**
 * Dex uses these to store tags, hashes, and entries.
 */
interface IDexSubCollection<
  TValue extends Entry | HashKey | Tag,
  TDexEntry extends Entry,
  TArrayReturn = TValue[],
  TIteratorIndex extends [item: TValue, ...args: any] = [item: TValue, index: number],
> {

  /**
   * @alias {@link size}
   */
  get count(): number;

  /**
   * @alias {@link size}
   */
  get length(): number;

  /**
   * @alias {@link size}
   */
  get size(): number;

  /**
   * Get all entries as a record indeed by key
   */
  toArray(): TArrayReturn;

  /**
   * Get all entries as a record indeed by key
   */
  map<TResult, TResults extends ResultType>(
    transform: IBreakable<TIteratorIndex, TResult>,
    resultType?: TResults
  ): Result<TResult, TResults, TDexEntry>

  /**
   * Get the first matching entry
   */
  first(
    where: IBreakable<TIteratorIndex, boolean>
  ): TValue | undefined;

  /**
   * Get all matching entries
   */
  filter<TResultType extends ResultType>(
    where: IBreakable<TIteratorIndex, boolean>,
    resultType?: TResultType
  ): Result<TValue, TResultType>;
}

/**
 * A sub map of a dex.
 */
export interface IDexSubMap<
  TValue extends Entry | HashKey | Tag,
  TKey extends HashKey = HashKey,
  TIteratorIndex extends [item: TValue, ...args: any] = [entry: TValue, index: number],
> extends IDexSubCollection<TValue, TValue[], TIteratorIndex> {
  
  /**
   * itterate through all the keys
   */
  get keys(): IterableIterator<TKey>;

  /**
   * itterate through all the values
   */
  get values(): IterableIterator<TValue>;

  /**
   * itterate through all the entries
   */
  get pairs(): IterableIterator<[TKey, TValue]>;

  /**
   * Itterate though all the keys and values
   */
  [Symbol.iterator](): IterableIterator<[TKey, TValue]>;

  /**
   * Get all entries as a record indeed by key
   */
  toRecord(): Record<TKey, TValue>;

  /**
    * Returns a specified element from the Map object. If the value that is associated to the provided key is an object, then you will get a reference to that object and any change made to that object will effectively modify it inside the Map.
    * @returns Returns the element associated with the specified key. If no element is associated with the specified key, undefined is returned.
    */
  get(key: TKey): TValue | undefined;
  
  /**
    * @returns boolean indicating whether an element with the specified key exists or not.
    */
  has(key: TKey): boolean;

  /**
   * Do something for each entry.
   */
  forEach(doThis: (entry: TValue, key: TKey, set: Readonly<Map<TKey, TValue>>) => void, thisArg?: any): void;
}

/**
 * A subset of a Dex Set.
 */
export interface IDexSubSet<
  TValue extends Entry | HashKey | Tag,
  TEntry extends Entry,
> extends Readonly<Omit<Set<TValue>, 'add' | 'delete' | 'clear'>>,
  IDexSubCollection<TValue, TValue[], [item: TValue, index: number]>
{
  
  /**
   * Fetch all the items that match a given entry.
   */
  of(
    target: TEntry
  ): TValue[] | Set<TValue> | TValue | undefined;
}

/** @internal */
export namespace SubSet {
  /** @internal */
  export function map<TResult, TResults extends ResultType, TValue = HashKey, TDexEntry extends Entry = Entry>(
    dex: IReadonlyDex<TDexEntry>,
    transform: IBreakable<[key: TValue, index: number], TResult>,
    resultType?: TResults,
    preTransform?: (key: HashKey) => TValue
  ): Result<TResult, TResults, TDexEntry> {
    let results: Result<TResult, TResults, TDexEntry>;
    let collector: ((e: TResult) => void) | false;
    switch (resultType) {
      default:
      case undefined:
      case ResultType.Array: {
        results = [] as TResult[] as Result<TResult, TResults, TDexEntry>;
        collector = e => (results as TResult[]).push(e);
        break;
      }
      case ResultType.Dex: {
        results = new Dex<TDexEntry>() as Result<TResult, TResults, TDexEntry>;
        collector = e => (results as Dex<TDexEntry>).copy.from(dex, e as HashKey);
        break;
      }
      case ResultType.First: {
        results = undefined as Result<TResult, TResults, TDexEntry>;
        collector = false;
        break;
      }
      case ResultType.Set: {
        results = new Set<TDexEntry>() as Result<TResult, TResults, TDexEntry>;
        collector = e => (results as Set<TResult>).add(e);
        break;
      }
    }

    let index = 0;
    for (const e of dex.hashes) {
      const result = transform((preTransform?.(e)! ?? e), index++);
      if (result instanceof Break) {
        if (result.hasReturn) {
          if (collector === false) {
            return result.return as TResult as Result<TResult, TResults, TDexEntry>;
          }

          if (resultType === ResultType.Dex) {
            collector(e as any);
          } else { 
            collector(result.return as TResult);
          }
        }

        break;
      } else {
        if (collector === false) {
          return result as TResult as Result<TResult, TResults, TDexEntry>;
        }

        if (resultType === ResultType.Dex) {
          collector(e as any);
        } else { 
          collector(result);
        }
      }
    }

    return results;
  }
  /** @internal */
  export function filter<TResults extends ResultType, TValue, TDexEntry extends Entry = Entry>(
    dex: IReadonlyDex<TDexEntry>,
    where: IBreakable<[entry: TValue, index: number], boolean>,
    resultType?: TResults,
    transform?: (key: HashKey) => TValue
  ): Result<TValue, TResults, TDexEntry> {
    let results: Result<TValue, TResults, TDexEntry>;
    let collector: ((e: TValue) => void) | false;
    switch (resultType) {
      default:
      case undefined:
      case ResultType.Array: {
        results = [] as TValue[] as Result<TValue, TResults, TDexEntry>;
        collector = e => (results as TValue[]).push(e);
        break;
      }
      case ResultType.Dex: {
        results = new Dex<TDexEntry>() as Result<TValue, TResults, TDexEntry>;
        collector = e => (results as Dex<TDexEntry>).copy.from(dex, e as HashKey);
        break;
      }
      case ResultType.First: {
        results = undefined as Result<TValue, TResults, TDexEntry>;
        collector = false;
        break;
      }
      case ResultType.Set: {
        results = new Set<TDexEntry>() as Result<TValue, TResults, TDexEntry>;
        collector = e => (results as Set<TValue>).add(e);
        break;
      }
    }

    let index = 0;
    for (const e of dex.hashes) {
      const value = (transform?.(e)! ?? e);
      const result = where(value, index++);
      if (result instanceof Break) {
        if (result.hasReturn && result.return) {
          if (collector === false) {
            return e as Result<TValue, TResults, TDexEntry>;
          }

          if (resultType === ResultType.Dex) {
            collector(e as any);
          } else { 
            collector(result.return as TValue);
          }
        }

        break;
      } else if (result) {
        if (collector === false) {
          return e as Result<TValue, TResults, TDexEntry>;
        }

        if (resultType === ResultType.Dex) {
          collector(e as any);
        } else { 
          collector(value);
        }
      }
    }

    return results;
  }
  /** @internal */
  export function first<TValue, TDexEntry extends Entry = Entry>(
    dex: IReadonlyDex<TDexEntry>,
    where: IBreakable<[entry: TValue, index: number], boolean>,
    transform?: (key: HashKey) => TValue
  ): Result<TValue, ResultType.First, TDexEntry> {
    let index = 0;
    for (const e of dex.hashes) {
      const value = (transform?.(e)! ?? e);
      const result = where(value, index++);
      if (result instanceof Break) {
        if (result.hasReturn && result.return) {
          return (transform?.(e) ?? e) as TValue;
        }

        break;
      } else if (result) {
        return (transform?.(e) ?? e) as TValue;
      }
    }

    return NO_RESULT;
  }
}