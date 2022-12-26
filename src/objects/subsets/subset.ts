import { Breakable } from "../../utilities/breakable";
import Dex from "../dex";
import { Flag, FLAGS } from "../queries/flags";
import { Entry } from "./entries";
import { HashKey } from "./hashes";
import { Tag } from "./tags";

/**
 * Dex uses these to store tags, hashes, and entries.
 *
 * @internal
 */
export interface IDexSubCollection<
  TValue extends Entry | HashKey | Tag,
  TEntry extends Entry,
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
   * Fetch all the hashes that match a given target.
   */
  where(
    target: Breakable<[entry: TEntry, index: number], boolean>,
    options?: ((typeof FLAGS.NOT | typeof FLAGS.CHAIN) | (typeof FLAGS.NOT | typeof FLAGS.FIRST))[]
  ): Set<TValue> | Dex<TEntry> | TValue | undefined;

  /**
   * Fetch all the hashes that match a given query.
   */
  where(
    tags: Tag[],
    options?: Flag[]
  ): Set<TValue> | Dex<TEntry> | TValue | undefined;

  /**
   * Get all entries as a record indeed by key
   */
  map<TResult>(
    transform: Breakable<TIteratorIndex, TResult>
  ): TResult[];

  /**
   * Get the first matching entry
   */
  first(
    where: Breakable<TIteratorIndex, boolean>
  ): TValue | undefined;

  /**
   * Get all matching entries
   */
  filter(
    where: Breakable<TIteratorIndex, boolean>
  ): Set<TValue>;
}

/**
 * A sub map of a dex.
 *
 * @internal
 */
export interface IDexSubMap<
  TValue extends Entry | HashKey | Tag,
  TKey extends HashKey | Tag,
  TEntry extends Entry,
  TIteratorIndex extends [item: TValue, ...args: any] = [entry: TValue, index: number, tags: TKey],
> extends IDexSubCollection<TValue, TEntry, TValue[], TIteratorIndex> {
  
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
}

/**
 * A subset of a Dex Set.
 *
 * @internal
 */
export interface IDexSubSet<
  TValue extends Entry | HashKey | Tag,
  TEntry extends Entry,
> extends Readonly<Omit<Set<TValue>, 'add' | 'delete' | 'clear'>>,
  IDexSubCollection<TValue, TEntry, TValue[], [item: TValue, index: number]>
{
  
  /**
   * Fetch all the items that match a given entry.
   */
  of(
    target: TEntry
  ): TValue[] | TValue | undefined;
}
