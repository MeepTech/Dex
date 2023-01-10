import Loop from "../utilities/iteration";
import Check from "../utilities/validators";
import Dex from "./dex";
import { DexError } from "./errors";
import Entry, { None, XWithTagsTuple } from "./subsets/entries";
import HashKey from "./subsets/hashes";
import { Tag, TagOrTags } from "./subsets/tags";

/**
 * Callback to be executed 
 * Returning a Break will return false, a Break with null or an error return will throw.
 * (A Break with null as a return throws a default error.)
 */
export type Callback<TArgs extends ([entry: HashKey] | [tag: Tag] | [entry: HashKey, linked: Tag] | [entry: HashKey, unlinked: Tag]) = [any, any]>
  = Loop.IBreakable<TArgs, Error | null>
  
/**
 * A slightly less eficient version of the Dex that allows for custom logic to be applied internaly on get, set, and updates.
 */
export default class NoisyDex<TEntry extends Entry> extends Dex<TEntry> {

  // callbacks
  /** @readonly */
  #callbacks : {
    onAddNewEntry?: Callback<[entry: HashKey]>
    onAddedNewEntry?: Callback<[entry: HashKey]>
    onRemoveEntry?: Callback<[entry: HashKey]>
    onRemovedEntry?: Callback<[entry: HashKey]>

    onAddNewTag?: Callback<[tag: Tag]>
    onAddedNewTag?: Callback<[tag: Tag]>
    onRemoveTag?: Callback<[tag: Tag]>
    onRemovedTag?: Callback<[tag: Tag]>

    onLinkTagToEntry?: Callback<[entry: HashKey, linked: Tag]>
    onUnlinkTagFromEntry?: Callback<[entry: HashKey, unlinked: Tag]>
    onLinkedTagToEntry?: Callback<[entry: HashKey, linked: Tag]>
    onUnlinkedTagFromEntry?: Callback<[entry: HashKey, unlinked: Tag]>
  } = null!;

  /** @internal */
  #tryCallback(
    callback: Callback | undefined,
    ...args: (HashKey | Tag | number)[]
  ): boolean {
    if (!callback) {
      return true;
    }
    
    let result = callback?.(args[0], args[1]);
    if (result instanceof Loop.Break) {
      if (result.hasReturn && result.return instanceof Error || result.return === null) {
        throw result.return ?? new DexError(`Error during callback: ${callback.name}, in a controled dex.`);
      }

      return false;
    }

    return true;
  }

  /** @internal */
  #tryCallbackOrUndo(
    callback: Callback | undefined,
    undo: () => void,
    ...args: (HashKey | Tag | number)[]
  ): boolean {
    if (!callback) {
      return true;
    }

    let result = callback?.(args[0], args[1]);
    if (result instanceof Loop.Break) {
      undo();
      if (result.hasReturn && result.return instanceof Error || result.return === null) {
        throw result.return ?? new DexError(`Error during callback: ${callback.name}, in a controled dex.`);
      }

      return false;
    } 

    return true;
  }

  //#region Methods

  /** @internal */
  protected override _addNewTag(tag: Tag, hashesToSet = new Set<HashKey>()): void {
    this.#tryCallback(this.#callbacks.onAddNewTag, tag);

    super._addNewTag(tag, hashesToSet);

    this.#tryCallbackOrUndo(
      this.#callbacks.onAddedNewTag,
      () => super._removeTag(tag),
      tag
    );
  }

  /** @internal */
  protected override _removeTag(tag: Tag): void {
    this.#tryCallback(this.#callbacks.onRemoveTag, tag);

    super._removeTag(tag);

    this.#tryCallbackOrUndo(
      this.#callbacks.onRemovedTag,
      () => super._addNewTag(tag),
      tag
    );
  }

  /** @internal */
  protected override _addNewEntry(entry: TEntry, key: HashKey) {
    this.#tryCallback(this.#callbacks.onAddNewEntry, key);

    super._addNewEntry(entry, key);

    this.#tryCallbackOrUndo(
      this.#callbacks.onAddedNewEntry,
      () => super._removeEntry(key),
      key
    );
  }

  /** @internal */
  protected override _removeEntry(key: HashKey) {
    this.#tryCallback(this.#callbacks.onRemoveEntry, key);
    const entry = this.get(key)!;

    super._removeEntry(key);

    this.#tryCallbackOrUndo(
      this.#callbacks.onRemovedEntry,
      () => super._addNewEntry(entry, key),
      key
    );
  }

  /** @internal */
  protected override _addTagToEntry(tag: Tag, key: HashKey) {
    this.#tryCallback(this.#callbacks.onLinkTagToEntry, key, tag);

    super._addTagToEntry(tag, key);

    this.#tryCallbackOrUndo(
      this.#callbacks.onLinkedTagToEntry,
      () => super._removeTagFromEntry.call(this, tag, key),
      key,
      tag
    );
  }

  /** @internal */
  protected override _removeTagFromEntry(tag: Tag, key: HashKey) {
    this.#tryCallback(this.#callbacks.onUnlinkTagFromEntry, key, tag);

    super._removeTagFromEntry(tag, key);

    this.#tryCallbackOrUndo(
      this.#callbacks.onUnlinkedTagFromEntry,
      () => super._addTagToEntry.call(this, tag, key),
      key,
      tag
    );
  }

  /** @internal */
  protected override _setEntriesForExistingTag(
    tag: Tag,
    hashesToSet: [] | Set<HashKey>
  ): {
    added?: HashKey[];
    removed?: HashKey[];
    effected: HashKey[];
  } {
    const results = super._setEntriesForExistingTag(
      tag,
      hashesToSet,
      results => {
        if (results.added?.length && this.#callbacks.onLinkTagToEntry) {
          results.added.forEach(result => 
            this.#tryCallback.call(this, this.#callbacks.onLinkTagToEntry, result, tag)
          );
        } else if (results.removed?.length && this.#callbacks.onUnlinkTagFromEntry) {
          results.removed.forEach(result => 
            this.#tryCallback.call(this, this.#callbacks.onUnlinkedTagFromEntry, result, tag)
          );
        }
      }
    );

    if (results.added?.length && this.#callbacks.onLinkedTagToEntry) {
      results.added.forEach(result => 
        this.#tryCallbackOrUndo.call(this, this.#callbacks.onLinkedTagToEntry, () => {
          // TODO: this may cause a loop, I should make a minimal logic version of untag too.
          super._removeTagFromEntry(tag, result);
        }, result, tag)
      );
    } else if (results.removed?.length && this.#callbacks.onUnlinkedTagFromEntry) {
      results.removed.forEach(result => 
        this.#tryCallbackOrUndo.call(this, this.#callbacks.onUnlinkedTagFromEntry, () => {
          // TODO: this may cause a loop, I should make a minimal logic version of add too.
          super._addTagToEntry(tag, result);
        }, result, tag)
      );
    }

    return results;
  }

  /** @internal */
  protected override _untagEntry(entry: HashKey, tagsToRemove?: TagOrTags): void {
    const hash = this.hash(entry);
    const currentTagsForEntry = this._tagsByHash.get(hash);
    const originalTags = [...this._tagsByHash.get(hash) ?? []];
    const removedTags: Tag[] = []; 

    if (!tagsToRemove) {
      let tagsToSet: Set<Tag> | undefined = undefined;
      for (const tag of originalTags) {
        if (this.#tryCallback(this.#callbacks.onUnlinkTagFromEntry, entry, tag)) {
          super._removeTagFromEntry(tag, entry);
          removedTags.push(tag);
        } else {
          tagsToSet ??= new Set();
          tagsToSet.add(tag);
        }
      }

      if (tagsToSet) {
        this._tagsByHash.set(entry, tagsToSet);
      }
    } else if (Check.isNonStringIterable(tagsToRemove)) {
      for (const tag of tagsToRemove) {
        if (currentTagsForEntry?.has(tag)) {
          if (this.#tryCallback(this.#callbacks.onUnlinkTagFromEntry, entry, tag)) {
            super._removeTagFromEntry(tag, entry);
            removedTags.push(tag);
          }
        }
      }
    } else if (Check.isTag(tagsToRemove)) {
      if (this.#tryCallback(this.#callbacks.onUnlinkTagFromEntry, entry, tagsToRemove)) {
        super._removeTagFromEntry(tagsToRemove, entry);
        removedTags.push(tagsToRemove);
      }
    }

    removedTags.forEach(tag =>
      this.#tryCallbackOrUndo(this.#callbacks.onUnlinkedTagFromEntry,
        () => super._addTagToEntry(tag, entry),
        entry,
        tag));
      
  }

  //#endregion
}