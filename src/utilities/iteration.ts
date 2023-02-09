import Dex, {InternalDexSymbols} from "../objects/dexes/dex";
import Check from "./validators";

namespace Loop {

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
   * Get the first item of an iterable.
   */
  export function first<T>(items: Iterable<T>, where?: (item: T) => boolean): T | undefined {
    for (const item of items) {
      if (where?.(item) ?? true) {
        return item;
      }
    }

    return undefined;
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
    if (Check.isArray(items)) {
      return items.length;
    } else if (items instanceof Set || items instanceof Map) {
      return items.size;
    } else if (items instanceof Dex) {
      return items.numberOfEntries;
    } else if (Check.isNonStringIterable(items)) {
      return [...items].length;
    } else if (Check.isObject(items)) {
      return Object.keys(items).length;
    } else if (Check.isString(items)) {
      return (items as string).length;
    } else if (Check.isNumber(items)) {
      return items;
    } else if (Check.isSymbol(items)) {
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
  export interface IBreakable<TArgs extends any[], TResult = void, TBreakResultOverride = TResult> {
    (...args: TArgs): TResult | Break<TBreakResultOverride> | Break;
  }

  export function loop<TResult = void, TRestOfArgs extends any[] = [], TBreakResultOverride = TResult>(
    toLoop: IBreakable<[number, ...TRestOfArgs], TResult, TBreakResultOverride>,
    over: number,
    options?: {
      args?: any[][],
      onBreak?: (result: Break<TBreakResultOverride> | Break, ...args: [number, ...TRestOfArgs]) => void,
      onResult?: (result: TResult, loopHasBroken: boolean) => void
    }
  ): void;

  /**
   * Used to help loop over breakables easily.
   * 
   * @param toLoop The breakable to loop
   * @param over The number of loops or entries to itterate over per loop
   * @param options Options.
   */
  
  export function loop<TEntry, TResult = void, TBreakResultOverride = TResult>(
    toLoop: IBreakable<[TEntry, ...any[]], TResult, TBreakResultOverride>,
    over: Iterable<TEntry>,
    options?: {
      args?: any[],
      onBreak?: (result: Break<TBreakResultOverride> | Break, ...args: [TEntry, ...any[]]) => void;
      onResult?: (result: TResult, loopHasBroken: boolean) => void
    }
  ): void;

  /**
   * Used to help loop over breakables easily.
   * 
   * @param toLoop The breakable to loop
   * @param over The number of loops or entries to itterate over per loop
   * @param options Options.
   */
  
  export function loop<TEntry, TResult = void, TArgs extends [TEntry, ...any] = [TEntry, ...any], TBreakResultOverride = TResult>(
    toLoop: IBreakable<TArgs, TResult, TBreakResultOverride>,
    over: Iterable<TEntry> | number,
    options?: {
      args?: Partial<TArgs>[],
      onBreak?: (result: Break<TBreakResultOverride> | Break, ...args: TArgs) => void
      onResult?: (result: TResult, loopHasBroken: boolean) => void
    }
  ): void

  /**
   * Used to help loop over breakables easily.
   * 
   * @param toLoop The breakable to loop
   * @param over The number of loops or entries to itterate over per loop
   * @param options Options.
   */
  
  export function loop<TEntry, TResult = void, TArgs extends any[] = [TEntry, number, ...any], TBreakResultOverride = TResult>(
    toLoop: IBreakable<TArgs, TResult, TBreakResultOverride>,
    over: Iterable<TEntry> | number,
    options?: {
      args?: Partial<TArgs>[],
      onBreak?: (result: Break<TBreakResultOverride> | Break, ...args: TArgs) => void
      onResult?: (result: TResult, loopHasBroken: boolean) => void
    }
  ): void {
    if (!options) {
      if (Check.isIterable(over)) {
        let index = 0;
        for (const each of over) {
          toLoop(...[each, index++] as TArgs);
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
      const overIsArray = Check.isArray(over);
      let overIndex = 0;
      let indexIndex = overIsArray ? 1 : 0;
      const args: ((index: number) => any)[] = [];

      // entry
      if (overIsArray) {
        const iter = over[Symbol.iterator]();
        args[overIndex] = () => iter.next().value as TEntry;
      }

      // index
      args[indexIndex] = (i) => i;

      // args
      let indexOffset = indexIndex;
      if (options.args) {
        for (const e of options.args.entries()) {
          args[++indexOffset] = () => e;
        }
      }
    
      // loop
      const count : number = overIsArray ? over.length : Check.isIterable(over) ? Loop.count(over as Iterable<any>) : over as number;
      for (let index = 0; index < count; index++) {
        const params = args.map(get => get(index));
        const result = toLoop(...params as TArgs);
        if (result instanceof Break) {
          if (result.hasReturn) {
            options.onResult?.(result.return as TResult, true);
          } else {
            options.onBreak?.(result, ...params as TArgs);
          }
        } else {
          options.onResult?.(result as TResult, false);
        }
      }
    }
  }
}

export default Loop;