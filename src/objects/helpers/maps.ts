import { IBreakable } from "../../utilities/iteration";
import { IReadOnlyDex } from "../idex";
import { Entry } from "../subsets/entries";
import { Tag } from "../subsets/tags";

/**
 * Interface for the map helper object.
 */
export interface Mapper<TEntry> {

  /**
   * Get a map of the entries and their tags, or map all unique pairs to your own array of values.
   *
   * @param transform The transform function. Takes every unique pair. If not provided, this returns a map of type Map<Entry, Tag[]>
   * @param outerLoopType The type to use in the outer loop. This is to help speed in certain cases where you want to break out of the loop early.
   *
   * @returns A mapped array of values, or a Map<Entry, Tag[]> if no transform was provided.
   */
  <TResult = undefined>(
    transform?: IBreakable<[entry: TEntry, tag: Tag, index: number], TResult>,
    outerLoopType?: 'entry' | 'tag'
  ): TResult extends undefined ? Map<TEntry, Set<Tag>> : TResult[];

  /**
   * Map all unique entries
   */
  entries: <TResult = TEntry>(
    transform?: IBreakable<[entry: TEntry, index: number, tags: Set<Tag>], TResult>
  ) => TResult[];

  /**
   * Map all unique tags
   */
  tags: <TResult = Tag>(
    transform?: IBreakable<[tag: Tag, index: number, entries: Set<TEntry>], TResult>
  ) => TResult[];
}

/** @internal */
export function MapperConstructor<TEntry extends Entry>(dex: IReadOnlyDex<TEntry>): Mapper<TEntry> {
  const func = dex.toMap as Mapper<TEntry>;
  func.tags = dex.splay;
  func.entries = dex.toArray;

  return func;
}