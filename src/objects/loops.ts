import { Breakable } from "../utilities/breakable";
import { IReadOnlyDex } from "./readonly";
import { Entry } from "./subsets/entries";
import { Tag } from "./subsets/tags";

/**
 * Interface for the for helper object.
 */
export interface Looper<TEntry> {

  /**
   * Do some logic for each unique tag-entry pair.
   *
   * @param func The function to loop on each entry and tag pair
   * @param outerLoopType The type to use in the outer loop. This is to help speed in certain cases where you want to break out of the loop early.
   */
  (func: Breakable<[entry: TEntry, tag: Tag, index: number], any>,
    outerLoopType?: 'entry' | 'tag'
  ): void;

  /**
   * Do some logic for each unique tag.
   *
   * @param func The function to loop on each tag
   */
  tags: (
    func: Breakable<[tag: Tag, index: number, entries: Set<TEntry>], any>
  ) => void;

  /**
   * Do some logic for each unique entry.
   *
   * @param func The function to loop on each entry
   */
  entries: (
    func: Breakable<[entry: TEntry, index: number, tags: Set<Tag>], any>
  ) => void;
}

/** @internal */
export function LooperConstructor<TEntry extends Entry>(dex: IReadOnlyDex<TEntry>): Looper<TEntry> {
  const func = dex.forEach as Looper<TEntry>;
  func.tags = dex.forEachTag;
  func.entries = dex.forEachEntry;

  return func;
}