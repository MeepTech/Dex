import { IBreakable } from "../../utilities/breakable";
import { IReadOnlyDex } from "../readonly";
import { IEntry } from "../subsets/entries";
import { ITag } from "../subsets/tags";

/**
 * Interface for the map helper object.
 */
export interface IMapper<TEntry> {

  /**
   * Get a map of the entries and their tags, or map all unique pairs to your own array of values.
   *
   * @param transform The transform function. Takes every unique pair. If not provided, this returns a map of type Map<Entry, Tag[]>
   * @param outerLoopType The type to use in the outer loop. This is to help speed in certain cases where you want to break out of the loop early.
   *
   * @returns A mapped array of values, or a Map<Entry, Tag[]> if no transform was provided.
   */
  <TResult = undefined>(
    transform?: IBreakable<[entry: TEntry, tag: ITag, index: number], TResult>,
    outerLoopType?: 'entry' | 'tag'
  ): TResult extends undefined ? Map<TEntry, Set<ITag>> : TResult[];

  /**
   * Map all unique entries
   */
  entries: <TResult = TEntry>(
    transform?: IBreakable<[entry: TEntry, index: number, tags: Set<ITag>], TResult>
  ) => TResult[];

  /**
   * Map all unique tags
   */
  tags: <TResult = ITag>(
    transform?: IBreakable<[tag: ITag, index: number, entries: Set<TEntry>], TResult>
  ) => TResult[];
}

/** @internal */
export function MapperConstructor<TEntry extends IEntry>(dex: IReadOnlyDex<TEntry>): IMapper<TEntry> {
  const func = dex.toMap as IMapper<TEntry>;
  func.tags = dex.splay;
  func.entries = dex.toArray;

  return func;
}