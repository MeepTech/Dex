import Dex, { Config } from '../objects/dexes/dex';
import Filters from '../objects/queries/filters';
import { RESULT_TYPES } from '../objects/queries/results';
import {Entry} from '../objects/subsets/entries';
import * as Entries from '../objects/subsets/entries';
import { Tag } from '../objects/subsets/tags';
import IUnique from '../objects/unique';

namespace Check {

  /**
   * Helper to check if something's a function.
   * 
   * @returns true if the item is a function
   */
  export const isFunction = (symbol: any)
    : symbol is Function =>
    typeof symbol === "function";

  /**
   * Helper to check if somethings an object.
   * 
   * @param symbol The symbol to check 
   * @param includeNulls (optional) If the value of 'null' returns true or not. (Defaults to false)
   */
  export const isObject = (symbol: any)
    : symbol is Record<any, any> & object =>
    typeof symbol === "object" && symbol !== null;

  /**
   * Check if an item specifically matches "{}"
   */
  export function isEmptyObject(
    symbol: any
  ): symbol is {} {
    for (var prop in symbol) {
      return false;
    }

    const proto = Object.getPrototypeOf(symbol);
    return !proto || (proto === Object.prototype);
  }

  /**
   * Helper to check if something is a number.
   */
  export const isNumber = (symbol: any)
    : symbol is number =>
    typeof symbol === "number";

  /**
   * Helper to check if something is a string.
   */
  export const isString = (symbol: any)
    : symbol is string =>
    typeof symbol === "string";

  /**
   * Helper to check if something is a string.
   */
  export const isSymbol = (symbol: any)
    : symbol is symbol =>
    typeof symbol === "symbol";

  /**
   * Helper to check if somethings specifically an array.
   */
  export const isArray = <T = any>(
    symbol: any,
    options: {
      entryGuard?: (item: any) => item is T,
      allowEmpty?: boolean
    } = {
        allowEmpty: true
      })
    : symbol is Array<T> =>
    Array.isArray(symbol)
    && (symbol.length
      ? options?.entryGuard?.(symbol) || true
      : options?.allowEmpty ?? true)

  /**
   * Check if something is an itterable.
   */
  export const isNonStringIterable = (symbol: any)
    : symbol is Exclude<Iterable<any>, string> =>
    Symbol.iterator in Object(symbol) && !isString(symbol);

  /**
   * Check if something is an itterable.
   */
  export const isIterable = (symbol: any)
    : symbol is Iterable<any> =>
    Symbol.iterator in Object(symbol);

  /**
   * Check if it's a unique object. (IUnique)
   */
  export const isUnique = (symbol: any)
    : symbol is IUnique =>
    isObject(symbol)
    && isFunction(symbol.toHashCode)

}

export default Check;