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

/**
 * Check if it's a Dex.
 */
export const isDex = (symbol: any)
  : symbol is Dex<Entry> =>
  symbol instanceof Dex;

/**
 * Check if it's a Tag
 */
export const isTag = (symbol: any)
  : symbol is Tag =>
  (isString(symbol) && !RESULT_TYPES.has(symbol as any))
  || isNumber(symbol)
  || isSymbol(symbol);

/**
 * Check if it's a query flter
 */
export const isFilter = <TDexEntry extends Entry>(symbol: any)
  : symbol is Filters.XFilter<TDexEntry> => 
  isObject(symbol)
  && (
    (symbol.hasOwnProperty("and") && !symbol.hasOwnProperty("or"))
    || (symbol.hasOwnProperty("or") && !symbol.hasOwnProperty("and"))
    || symbol.hasOwnProperty("not")
  );

/**
 * Type guard for initial input arrays for the Dex constructor.
 */
export function isInputEntryWithTagsArray<TEntry extends Entry = Entry>(
  value: Entry
): value is Entries.XWithTagsTuple<TEntry> {
  return (isArray(value))
    // if the first item in the array is a potential complex entry or an empty tag value...
    && (isComplexEntry(value[0]) || value[0] === Entries.NONE_FOR_TAG)
    // if the second item of that array is a potental tag
    && (isTag(value[1])
      // or if it's an array of tags or empty array
      || (isArray(value[1])
        && (!value[1].length
          || !value[1].some(e => !isTag(e)))));
}

/**
 * Check if something is a simple entry instead of a complex one
 */
export function isSimpleEntry(
  value: Entry
): value is Entries.Simple {
  return isString(value) || isSymbol(value) || isNumber(value)
}

/**
 * Check if something is a simple entry instead of a complex one
 */
export function isComplexEntry(
  value: Entry
): value is Entries.Complex {
  return isObject(value) || isFunction(value) ||Check.isArray(value)
}

/**
 * Validate a dex config
 */
export function isConfig<TEntry extends Entry = Entry>(
  value: any
): value is Config<TEntry> {
  return isObject(value)
    && (typeof value.entryGuard === 'function'
      || typeof value.arrayGuard === 'function'
      || typeof value.objectGuard === 'function'
      || typeof value.hasher === 'function'
      || isEmptyObject(value));
  }
}

export default Check;