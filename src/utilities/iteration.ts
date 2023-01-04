import Dex from "../objects/dex";
import { isArray, isIterable, isNumber, isObject, isString, isSymbol } from "./validators";

/**
 * Can be used to for(of) any iterable
 */
export function forEach<T>(items: Iterable<T>, doThis: (item: T) => void) {
  for (const item of items) {
    doThis(item);
  } 
}

/**
 * Can be used to for(of) any iterable
 */
export function forIn<T, K>(items: Iterable<T>, doThis: (key: K) => void) {
  for (const item in items) {
    doThis(item as K);
  } 
}

/**
 * Can be used to map any iterable
 */
export function map<T, R>(items: Iterable<T>, transform: (item: T) => R): Iterable<R> {
  const result = [];
  for (const item of items) {
    result.push(transform(item));
  } 

  return result;
}

/**
 * Returns the size of the given set
 */
export function count(items: Set<any>): number;

/**
 * Returns the size of the given map
 */
export function count(items: Map<any, any>): number;

/**
 * Returns the length of the given array
 */
export function count(items: Array<any>): number;

/**
 * Returns the number of entries in the given dex
 */
export function count(items: Dex<any>): number;

/**
 * Returns the number of values (size/length/count) of the given set of items.
 */
export function count(items: Iterable<any>): number;

/**
 * Returns the number of enumerable properties in the object
 */
export function count(items: object): number;

/**
 * Returns the number of chars in the string
 */
export function count(items: string): number;

/**
 * Returns the number
 */
export function count(items: number): number;

/**
 * Returns 1: for 1 unique symbol.
 */
export function count(items: symbol): 1;

export function count(items: Iterable<any> | object | string | number | symbol): number {
  if (isArray(items)) {
    return items.length;
  } else if (items instanceof Set || items instanceof Map) {
    return items.size;
  } else if (items instanceof Dex) {
    return items.numberOfEntries;
  } else if (isIterable(items)) {
    return [...items].length;
  } else if (isObject(items)) {
    return Object.keys(items).length;
  } else if (isString(items)) {
    return (items as string).length;
  } else if (isNumber(items)) {
    return items;
  } else if (isSymbol(items)) {
    return 1;
  } else {
    throw new Error("Unrecognized Type For Counting: " + (typeof items))
  }
}

/**
 * Used to break from a breakable early.
 */
export class Break<TResult = void> {
  readonly return: TResult;
  readonly hasReturn: number;

  constructor(resultValue?: TResult) {
    this.return = resultValue!;
    this.hasReturn = arguments.length;
  }
}

/**
 * A method that can signal it's outer loop should be be broken
 */
export interface IBreakable<TArgs extends any[], TResult = void> {
  (...args: TArgs): TResult | Break<TResult> | Break;
}

export function loop<TResult = void>(
  toLoop: IBreakable<any[], TResult>,
  over: number,
  options?: {
    /**
     * The index to insert the numeric index at.
     * If undefined it's added first
     */
    indexIndex?: number,
    args?: any[][],
    onBreak?: (...args: any[]) => void,
    onResult?: (result: TResult) => void
  }
): void;

export function loop<TArgs extends any[], TResult = void>(
  toLoop: IBreakable<TArgs, TResult>,
  over: TArgs[],
  options?: {
    /**
     * The index to insert the numeric index at.
     * If undefined it's added after all provided args.
     */
    indexIndex?: number,
    /**
     * The index to insert the current value index at.
     * If undefined it's provided first.
     */
    overIndex?: number,
    args?: TArgs[],
    onBreak?: (...args: TArgs) => void
    onResult?: (result: TResult) => void
  }
): void;

/**
 * Used to help loop over breakables easily.
 * 
 * @param toLoop The breakable to loop
 * @param over The number of loops or entries to itterate over per loop
 * @param options Options.
 */
export function loop<TArgs extends any[] = any[], TResult = void, TEntry = undefined>(
  toLoop: IBreakable<TArgs, TResult>,
  over: number | Iterable<TEntry>,
  options?: {
    /**
     * The index to insert the numeric index at.
     * If undefined it's added after all provided args.
     */
    indexIndex?: number,
    /**
     * The index to insert the current value index at.
     * If undefined it's provided first.
     */
    overIndex?: number,
    args?: Partial<TArgs>[],
    onBreak?: (args: TArgs) => void
    onResult?: (result: TResult) => void
  }
): void {
  if (!options) {
    if (isArray(over)) {
      let index = 0;
      for (const each of over) {
        /** @ts-expect-error: spread issue*/
        toLoop(each, index++);
      }
    } // over an index.
    else {
      for (let index = 0; index < over; index++) {
        /** @ts-expect-error: spread issue*/
        toLoop(index);
      }
    }
  } else {
    // setup params
    const overIsArray = isArray(over);
    let overIndex = 0;
    let indexIndex = overIsArray ? 1 : 0;
    const args: ((index: number) => any)[] = [];

    // entry
    if (overIsArray) {
      if (options.overIndex) {
        overIndex = options.overIndex;
      }

      const iter = over[Symbol.iterator]();
      args[overIndex] = () => iter.next().value as TEntry;
    }

    if (options.indexIndex) {
      indexIndex = options.indexIndex;
    }

    // index
    args[indexIndex] = (i) => i;

    // args
    let indexOffset = 0;
    if (options.args) {
      for (const [index, _] of options.args.entries()) {
        if (index === overIndex || index === indexIndex) {
          indexOffset++;
        }

        args[index + indexOffset] = (i) => options.args![i][index];
      }
    }
    
    // loop
    const count = overIsArray ? over.length : over;
    for (let index = 0; index < count; index++) {
      const params = args.map(get => get(index));
      /** @ts-expect-error: spread issue*/
      const result = toLoop(...params);
      if (result instanceof Break) {
        if (result.hasReturn) {
          options.onResult?.(result.return as TResult);
        } else {
          options.onBreak?.(params as any);
        }
      } else {
        options.onResult?.(result as TResult);
      }
    }
  }
}