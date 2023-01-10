import Loop from "../utilities/iteration";
import Dex from "./dex";
import { DexError } from "./errors";
import Entry, { None } from "./subsets/entries";
import HashKey from "./subsets/hashes";
import { Tag } from "./subsets/tags";

/**
 * A slightly less eficient version of the Dex that allows for custom logic to be applied internaly on get, set, and updates.
 */
export default class ControledDex<TEntry extends Entry> extends Dex<TEntry> {
  // callbacks
  /** @readonly */
  private _callbacks : {
    onAddNewEntry?: Loop.IBreakable<[entry: HashKey], string>
    onAddedNewEntry?: Loop.IBreakable<[entry: HashKey], string>
    onRemoveEntry?: Loop.IBreakable<[entry: HashKey], string>
    onRemovedEntry?: Loop.IBreakable<[entry: HashKey], string>

    onAddNewTag?: Loop.IBreakable<[tag: Tag], string>
    onAddedNewTag?: Loop.IBreakable<[tag: Tag], string>
    onRemoveTag?: Loop.IBreakable<[tag: Tag], string>
    onRemovedTag?: Loop.IBreakable<[tag: Tag], string>

    onLinkedTagToEntry?: Loop.IBreakable<[entry: HashKey, linked: Tag], string>
    onUnlinkedTagFromEntry?: Loop.IBreakable<[entry: HashKey, unlinked: Tag], string>
  } = null!;

  private _tryCallback(
    callback: Loop.IBreakable<[...any], string> | undefined,
    ...args: any[]
  ): void {
    if (!callback) {
      return;
    }
    
    let message = callback?.(...args);
    if (message instanceof Loop.Break) {
      throw new DexError(`Error during callback: ${callback.name}, in a controled dex.`)
    } 
  }

  private _tryCallbackOrUndo(
    callback: Loop.IBreakable<[...any], string> | undefined,
    undo: () => void,
    ...args: any[]
  ): void {
    if (!callback) {
      return;
    }

    let message = callback?.(...args);
    if (message instanceof Loop.Break) {
      undo();
      throw new DexError(`Error during callback: ${callback.name}, in a controled dex.`)
    } 
  }

  //#region Methods

  //#region Modify

  //#region Add

  //#region Tags

  /** @internal */
  protected override _addNewTag(tag: Tag, hashesToSet = new Set<HashKey>()): void {
    this._tryCallback(this._callbacks.onAddNewTag, tag);

    super._addNewTag(tag, hashesToSet);

    this._tryCallbackOrUndo(
      this._callbacks.onAddedNewTag,
      () => {
        this._allTags.delete(tag);
        this._hashesByTag.delete(tag);
      },
      tag
    );
  }

  protected override _setEntriesForExistingTag(
    tag: Tag,
    hashesToSet: [] | Set<HashKey>
  ): {
    added?: HashKey[];
    removed?: HashKey[];
    effected: HashKey[];
  } {
    const results = super._setEntriesForExistingTag(tag, hashesToSet);

    if (results.added?.length && this._callbacks.onLinkedTagToEntry) {
      results.added.forEach(result => 
        this._tryCallbackOrUndo.call(this, this._callbacks.onLinkedTagToEntry, () => {
          // TODO: this may cause a loop, I should make a minimal logic version of untag too.
          this.untag(result, tag);
        }, result, tag)
      );
    } else if (results.removed?.length && this._callbacks.onUnlinkedTagFromEntry) {
      results.removed.forEach(result => 
        this._tryCallbackOrUndo.call(this, this._callbacks.onUnlinkedTagFromEntry, () => {
          // TODO: this may cause a loop, I should make a minimal logic version of add too.
          this.add(result, tag);
        }, result, tag)
      );
    }

    return results;
  }

  //#endregion

  //#endregion

  //#endregion

  //#endregion
}