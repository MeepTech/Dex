import Dex, { Config } from '../objects/dex';
import { FLAGS } from '../objects/queries/flags';
import {
  IComplexEntry,
  IEntry,
  IInputEntryWithTagsArray,
  ISimpleEntry,
  NO_ENTRIES_FOR_TAG
} from '../objects/subsets/entries';
import { ITag } from '../objects/subsets/tags';
import IUnique from '../objects/unique';

/**
 * Helper to check if something's a function.
 * 
 * @param symbol The symbol to test
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
 * 
 * @returns true if it's an object 
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

  return symbol.prototype === Object.prototype;
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
 * 
 * @param symbol The symbol to check 
 * 
 * @returns true if it's an array
 */
export const isArray = (symbol: any)
  : symbol is Array<any> =>
  Array.isArray(symbol);

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
  : symbol is Dex<IEntry> =>
  symbol instanceof Dex;

/**
 * Check if it's a Tag
 */
export const isTag = (symbol: any)
  : symbol is ITag =>
  isString(symbol)
  || isNumber(symbol)
  || (isSymbol(symbol)
    && !FLAGS.is(symbol)
  );

export function isInputEntryWithTagsArray<TEntry extends IEntry = IEntry>(
  value: IEntry
): value is IInputEntryWithTagsArray<TEntry> {
  return (isArray(value))
    // if the first item in the array is a potential complex entry or an empty tag value...
    && (isComplexEntry(value[0]) || value[0] === NO_ENTRIES_FOR_TAG)
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
  value: IEntry
): value is ISimpleEntry {
  return isString(value) || isSymbol(value) || isNumber(value)
}

/**
 * Check if something is a simple entry instead of a complex one
 */
export function isComplexEntry(
  value: IEntry
): value is IComplexEntry {
  return isObject(value) || isFunction(value) || isArray(value)
}

export function isConfig<TEntry extends IEntry = IEntry>(
  value: any
): value is Config<TEntry> {
  return isObject(value)
    && (typeof value.entryGuard === 'function'
      || typeof value.arrayGuard === 'function'
      || typeof value.objectGuard === 'function'
      || typeof value.hasher === 'function'
      || isEmptyObject(value));
}