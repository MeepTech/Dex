import Loop from "../../utilities/iteration";
import Check from "../../utilities/validators";
import Dex, { Config as BaseConfig, InternalDexSymbols } from "./dex";
import { DexError } from "../errors";
import Entry from "../subsets/entries";
import HashKey from "../subsets/hashes";
import { Tag, TagOrTags } from "../subsets/tags";
import { InternalRDexSymbols } from "./readonly";

//#region Symbols

/** @internal */
export namespace InternalNDexSymbols {
  export const _buildEventConstructorListener: unique symbol = Symbol("_buildEventConstructorListener");
}

//#endregion

/**
 * Config for a Noisy Dex
 */
export type Config<TEntry extends Entry> = BaseConfig<TEntry> & Listeners<TEntry>
  & ({
    emitEvents?: never,
    eventFunnel?: never
  } | {
    emitEvents: true | {
      onAdd: true | {
        [EventTarget.Tag]?: true,
        [EventTarget.Entry]: true
      } | {
        [EventTarget.Tag]: true,
        [EventTarget.Entry]?: true
      },
      onRemove?: true | {
        [EventTarget.Tag]?: true,
        [EventTarget.Entry]: true
      } | {
        [EventTarget.Tag]: true,
        [EventTarget.Entry]?: true
      },
      onUpdate?: true
    } | {
      onAdd?: true | {
        [EventTarget.Tag]: true,
        [EventTarget.Entry]: true
      } | {
        [EventTarget.Tag]?: true,
        [EventTarget.Entry]?: true
      },
      onRemove: true | {
        [EventTarget.Tag]: true,
        [EventTarget.Entry]?: true
      } | {
        [EventTarget.Tag]?: true,
        [EventTarget.Entry]: true
      },
      onUpdate?: true
    } | {
      onAdd?: true | {
        [EventTarget.Tag]: true,
        [EventTarget.Entry]?: true
      } | {
        [EventTarget.Tag]?: true,
        [EventTarget.Entry]: true
      },
      onRemove?: true | {
        [EventTarget.Tag]: true,
        [EventTarget.Entry]?: true
      } | {
        [EventTarget.Tag]?: true,
        [EventTarget.Entry]: true
      },
      onUpdate: true
    },
    eventFunnel: EventFunnel
  });

//#region Events

export enum EventType {
  Add = 'added',
  Remove = 'removed',
  Update = 'updated'
}

export enum UpdateEventType {
  None = 'not-an-update',
  Link = 'link',
  Unlink = 'unlink'
}

export enum EventTarget {
  Tag = 'tag',
  HashKey = 'key',
  Entry = 'entry'
}

export enum EventTiming {
  Before = 'before',
  After = 'after'
}

export interface EventEffectedValues {
  get tags(): undefined | (() => Set<Tag> | undefined),
  get hashes(): undefined | (() => Set<HashKey> | undefined),
  get entries(): undefined | (() => Map<HashKey, Entry> | undefined)
}

export interface EventFunnel {
  (event: Event): Promise<void> | void
}

/**
 * TODO: do something with the implementation.
 * TODO: find out how to stack these in a queue; combining events that are the same enough; maybe have alternate callbacks for all collected values instead?
 */
export class Event {
  static Types = {
    Add: EventType.Add,
    Remove: EventType.Remove,
    Update: EventType.Update
  }

  static Targets = {
    Tag: EventTarget.Tag,
    Hash: EventTarget.HashKey,
    Entry: EventTarget.Entry
  }

  static Times = {
    Before: EventTiming.Before,
    After: EventTiming.After,
  }

  static Updates = {
    Link: UpdateEventType.Link,
    Unlink: UpdateEventType.Unlink,
  }

  readonly timeStamp: Date;
  readonly listener: ListenerType;
  readonly timing: EventTiming;
  readonly type: EventType;
  readonly targetType: EventTarget;
  readonly updateType: UpdateEventType;
  readonly target: HashKey | Tag | Entry;
  readonly effected: EventEffectedValues;

  constructor(
    timeStamp: Date,
    listener: ListenerType,
    timing: EventTiming,
    type: EventType.Add,
    targetType: EventTarget.HashKey | EventTarget.Tag,
    target: HashKey | Tag,
    effected: EventEffectedValues,
    updateType?: UpdateEventType.None
  )

  constructor(
    timeStamp: Date,
    listener: ListenerType,
    timing: EventTiming,
    type: EventType.Update,
    targetType: EventTarget.HashKey | EventTarget.Tag,
    target: HashKey | Tag,
    effected: EventEffectedValues,
    updateType: UpdateEventType.Link | UpdateEventType.Unlink
  )

  constructor(
    timeStamp: Date,
    listener: ListenerType,
    timing: EventTiming,
    type: EventType.Remove,
    targetType: EventTarget.Entry | EventTarget.Tag,
    target: Entry | Tag,
    effected: EventEffectedValues,
    updateType?: UpdateEventType.None
  )

  constructor(
    time: Date,
    listener: ListenerType,
    timing: EventTiming,
    type: EventType,
    targetType: EventTarget,
    target: HashKey | Tag | Entry,
    effected: {
      get tags(): undefined | (() => Set<Tag> | undefined),
      get hashes(): undefined | (() => Set<HashKey> | undefined),
      get entries(): undefined | (() => Map<HashKey, Entry> | undefined)
    },
    updateType: UpdateEventType = UpdateEventType.None
  ) {
    this.timeStamp = time;
    this.listener = listener;
    this.timing = timing;
    this.type = type;
    this.targetType = targetType;
    this.updateType = updateType;
    this.target = target;
    this.effected = effected as EventEffectedValues;
  }
}

//#endregion

//#region Listeners

/**
 * Types of Listeners you can add to a NoisyDex
 */
export enum ListenerType {
  OnAddNewEntry = "onAddNewEntry",
  OnAddedNewEntry = "onAddedNewEntry",
  OnRemoveEntry = "onRemoveEntry",
  OnRemovedEntry = "onRemovedEntry",
  OnAddNewTag = "onAddNewTag",
  OnAddedNewTag = "onAddedNewTag",
  OnRemoveTag = "onRemoveTag",
  OnRemovedTag = "onRemovedTag",
  OnLinkTagToEntry = "onLinkTagToEntry",
  OnUnlinkTagFromEntry = "onUnlinkTagFromEntry",
  OnLinkedTagToEntry = "onLinkedTagToEntry",
  OnUnlinkedTagFromEntry = "onUnlinkedTagFromEntry",
}

/**
 * Listeners you can add to a NoisyDex
 * 
 * // TODO: add listeners for bulk updates to improve performance slightly
 */
export interface Listeners<TEntry extends Entry = Entry> {
  [ListenerType.OnAddNewEntry]?: Listener<[entry: TEntry], TEntry>[]
  [ListenerType.OnAddedNewEntry]?: Listener<[entry: HashKey], TEntry>[]
  [ListenerType.OnRemoveEntry]?: Listener<[entry: HashKey], TEntry>[]
  [ListenerType.OnRemovedEntry]?: Listener<[entry: TEntry], TEntry>[]

  [ListenerType.OnAddNewTag]?: Listener<[tag: Tag], TEntry>[]
  [ListenerType.OnAddedNewTag]?: Listener<[tag: Tag], TEntry>[]
  [ListenerType.OnRemoveTag]?: Listener<[tag: Tag], TEntry>[]
  [ListenerType.OnRemovedTag]?: Listener<[tag: Tag], TEntry>[]

  [ListenerType.OnLinkTagToEntry]?: Listener<[entry: HashKey, linked: Tag], TEntry>[]
  [ListenerType.OnUnlinkTagFromEntry]?: Listener<[entry: HashKey, unlinked: Tag], TEntry>[]
  [ListenerType.OnLinkedTagToEntry]?: Listener<[entry: HashKey, linked: Tag], TEntry>[]
  [ListenerType.OnUnlinkedTagFromEntry]?: Listener<[entry: HashKey, unlinked: Tag], TEntry>[]
}

/**
 * Callback to be executed 
 * Returning a Break will return false, a Break with null or an error return will throw.
 * (A Break with null as a return throws a default error.)
 */
export type Listener<TArgs extends ([entry: HashKey | TEntry] | [tag: Tag] | [entry: HashKey, linked: Tag] | [entry: HashKey, unlinked: Tag]) = [HashKey | Tag, Tag], TEntry extends Entry = Entry>
  = Loop.IBreakable<TArgs, void, Error | null>

/**
 * Keys of Listeners you can add to a NoisyDex
 */
export const LISTENER_KEYS
  = Object.freeze(
    new Set<keyof Listeners>(
      Object.values(
        ListenerType
      ) as any));

/**
 * Types of Listeners executed before an action takes place
 */
export const BEFORE_EVENT_LISTENERS = Object.freeze(
  new Set<keyof Listeners>(
    [
      ListenerType.OnAddedNewEntry,
      ListenerType.OnRemovedEntry,
      ListenerType.OnAddedNewTag,
      ListenerType.OnRemovedTag,
      ListenerType.OnLinkedTagToEntry,
      ListenerType.OnUnlinkedTagFromEntry
    ]
  )
);

/**
 * Types of Listeners executed after an action takes place
 */
export const AFTER_EVENT_LISTENERS = Object.freeze(
  new Set<keyof Listeners>(
    [
      ListenerType.OnAddNewEntry,
      ListenerType.OnRemoveEntry,
      ListenerType.OnAddNewTag,
      ListenerType.OnRemoveTag,
      ListenerType.OnLinkTagToEntry,
      ListenerType.OnUnlinkTagFromEntry
    ]
  )
);

/**
 * When the listeners are executed (before or after) the action
 */
export const LISTENER_EVENT_TIMES = Object.freeze(
  new Map<keyof Listeners, EventTiming>(
    [...BEFORE_EVENT_LISTENERS].map(listener =>
      [listener, EventTiming.Before as EventTiming] as [keyof Listeners, EventTiming]
    ).concat(([...AFTER_EVENT_LISTENERS].map(listener =>
      [listener, EventTiming.After]
    )))
  )
);

/**
 * Event Types of Listeners
 */
export const LISTENER_EVENT_TYPES = Object.freeze(
  new Map<keyof Listeners, EventType>(
    [
      [ListenerType.OnAddNewEntry, EventType.Add],
      [ListenerType.OnAddedNewEntry, EventType.Add],
      [ListenerType.OnRemoveEntry, EventType.Remove],
      [ListenerType.OnRemovedEntry, EventType.Remove],
      [ListenerType.OnAddNewTag, EventType.Add],
      [ListenerType.OnAddedNewTag, EventType.Add],
      [ListenerType.OnRemoveTag, EventType.Remove],
      [ListenerType.OnRemovedTag, EventType.Remove],
      [ListenerType.OnLinkTagToEntry, EventType.Update],
      [ListenerType.OnLinkedTagToEntry, EventType.Update],
      [ListenerType.OnUnlinkTagFromEntry, EventType.Update],
      [ListenerType.OnUnlinkedTagFromEntry, EventType.Update]
    ]
  )
);

/**
 * Event Update Types of Listeners
 */
export const UPDATE_LISTERNER_EVENT_TYPES = Object.freeze(
  new Map<keyof Listeners, UpdateEventType>(
    [
      [ListenerType.OnLinkTagToEntry, UpdateEventType.Link],
      [ListenerType.OnLinkedTagToEntry, UpdateEventType.Link],
      [ListenerType.OnUnlinkTagFromEntry, UpdateEventType.Unlink],
      [ListenerType.OnUnlinkedTagFromEntry, UpdateEventType.Unlink]
    ]
  )
);

/**
 * Event Targets of Listeners
 */
export const LISTENER_EVENT_TARGETS = Object.freeze(
  new Map<keyof Listeners, EventTarget>(
    [
      [ListenerType.OnAddNewEntry, EventTarget.Entry],
      [ListenerType.OnAddedNewEntry, EventTarget.HashKey],
      [ListenerType.OnRemoveEntry, EventTarget.Entry],
      [ListenerType.OnRemovedEntry, EventTarget.HashKey],
      [ListenerType.OnAddNewTag, EventTarget.Tag],
      [ListenerType.OnAddedNewTag, EventTarget.Tag],
      [ListenerType.OnRemoveTag, EventTarget.Tag],
      [ListenerType.OnRemovedTag, EventTarget.Tag],
      [ListenerType.OnLinkTagToEntry, EventTarget.HashKey],
      [ListenerType.OnLinkedTagToEntry, EventTarget.HashKey],
      [ListenerType.OnUnlinkTagFromEntry, EventTarget.HashKey],
      [ListenerType.OnUnlinkedTagFromEntry, EventTarget.HashKey]
    ]
  )
);

//#endregion

/**
 * A slightly less eficient version of the Dex that allows for listening into events and custom logic to be applied internaly on get, set, and updates.
 */
export default class NoisyDex<TEntry extends Entry> extends Dex<TEntry> {

  // callbacks
  #callbacks: Listeners = null!;
  #eventFunnel?: EventFunnel;

  //#region Initialization

  /** @internal */
  protected override [InternalDexSymbols._initOptions](config?: Config<TEntry>) {
    this.#callbacks = {};

    if (config?.emitEvents) {
      this.#eventFunnel = config?.eventFunnel;
      for (const callbackKey of LISTENER_KEYS) {
        let callbackArray: Listener[] | undefined = (config as any)[callbackKey];
        if (Check.isObject(config.emitEvents)) {
          switch (LISTENER_EVENT_TYPES.get(callbackKey)) {
            case EventType.Add: {
              if (config.emitEvents.onAdd) {
                if (config.emitEvents.onAdd === true) {
                  break;
                } else {
                  switch (LISTENER_EVENT_TARGETS.get(callbackKey)) {
                    case EventTarget.Entry:
                    case EventTarget.HashKey: {
                      if (config.emitEvents.onAdd.entry) {
                        break;
                      }

                      continue;
                    }
                    case EventTarget.Tag: {
                      if (config.emitEvents.onAdd.tag) {
                        break;
                      }

                      continue;
                    }
                  }
                }
              } else {
                continue;
              }

              break;
            }
              
            case EventType.Remove: {
              if (config.emitEvents.onRemove) {
                if (config.emitEvents.onRemove === true) {
                  break;
                } else {
                  switch (LISTENER_EVENT_TARGETS.get(callbackKey)) {
                    case EventTarget.Entry:
                    case EventTarget.HashKey: {
                      if (config.emitEvents.onRemove.entry) {
                        break;
                      }

                      continue;
                    }
                    case EventTarget.Tag: {
                      if (config.emitEvents.onRemove.tag) {
                        break;
                      }

                      continue;
                    }
                  }
                }
              } else {
                continue;
              }
              
              break;
            }
              
            case EventType.Update: {
              if (!config.emitEvents.onUpdate) {
                continue;
              }

              break;
            }
          }
          
          if (!callbackArray) {
            callbackArray = [];
          }

          callbackArray.push(
            this[InternalNDexSymbols._buildEventConstructorListener](callbackKey)
          );
        } else {
          if (!callbackArray) {
            callbackArray = [];
          }

          callbackArray.push(
            this[InternalNDexSymbols._buildEventConstructorListener](callbackKey)
          );
        }

        this.#callbacks[callbackKey] = callbackArray as Listener<any>[];
      }
    } else {
      for (const callbackKey of LISTENER_KEYS) {
        this.#callbacks[callbackKey] = (config as any)[callbackKey];
      }
    }
  }

  /** @internal */
  private [InternalNDexSymbols._buildEventConstructorListener](callbackKey: ListenerType): Listener<any> {
    return function eventDistributor(
      this: NoisyDex<TEntry>,
      target: HashKey | TEntry | Tag,
      effectedTag
    ): void {
      const timeStamp = new Date();
      let effected: {
        _tagSet?: Set<Tag>,
        _hashSet?: Set<HashKey>,
        _entryMap?: Map<HashKey, Entry>,
        get tags(): undefined | (() => Set<Tag> | undefined),
        get hashes(): undefined | (() => Set<HashKey> | undefined),
        get entries(): undefined | (() => Map<HashKey, Entry> | undefined)
      };

      const targetType = LISTENER_EVENT_TARGETS.get(callbackKey);

      if (targetType === EventTarget.Tag) {
        effected = {
          get tags() {
            return (() => this._tagSet ??= new Set([target as Tag])).bind(this);
          },
          get hashes() {
            return undefined
          },
          get entries() {
            return undefined
          },
        };
      } else {
        const dex = this;
        if (targetType === EventTarget.Entry) {
          effected = {
            get tags() {
              return effectedTag
                ? (() => this._tagSet
                  ??= new Set([effectedTag])).bind(this)
                : undefined;
            },
            get hashes() {
              return (() => this._hashSet
                ??= new Set([dex.hash(target)])).bind(this);
            },
            get entries() {
              return (() => this._entryMap
                ??= new Map([[dex.hash(target), target]])).bind(this);
            },
          };
        } else {
          effected = {
            get tags() {
              return effectedTag
                ? (() => this._tagSet
                  ??= new Set([effectedTag])).bind(this)
                : undefined;
            },
            get hashes() {
              return (() => this._hashSet
                ??= new Set([target as HashKey])).bind(this);
            },
            get entries() {
              return (() => this._entryMap
                ??= new Map([[target as HashKey, dex.get(target as HashKey)!]])).bind(this);
            },
          };
        }
      }

      const event = new Event(
        timeStamp,
        callbackKey,
        LISTENER_EVENT_TIMES.get(callbackKey)!,
        LISTENER_EVENT_TYPES.get(callbackKey) as any,
        LISTENER_EVENT_TARGETS.get(callbackKey) as any,
        target as any,
        effected as EventEffectedValues,
        UPDATE_LISTERNER_EVENT_TYPES.get(callbackKey) as any
      );

      this.#eventFunnel!(event);
    };
  }

  //#endregion

  //#region Methods

  /** @internal */
  protected override [InternalDexSymbols._addNewTag](tag: Tag, hashesToSet = new Set<HashKey>()): void {
    this.#tryCallbacks(this.#callbacks.onAddNewTag, tag);

    super[InternalDexSymbols._addNewTag](tag, hashesToSet);

    this.#tryCallbacks(
      this.#callbacks.onAddedNewTag,
      () => super[InternalDexSymbols._removeTag](tag),
      tag
    );
  }

  /** @internal */
  protected override [InternalDexSymbols._removeTag](tag: Tag): void {
    this.#tryCallbacks(this.#callbacks.onRemoveTag, tag);

    super[InternalDexSymbols._removeTag](tag);

    this.#tryCallbacks(
      this.#callbacks.onRemovedTag,
      () => super[InternalDexSymbols._addNewTag](tag),
      tag
    );
  }

  /** @internal */
  protected override [InternalDexSymbols._addNewEntry](entry: TEntry, key: HashKey) {
    this.#tryCallbacks(this.#callbacks.onAddNewEntry, key);

    super[InternalDexSymbols._addNewEntry](entry, key);

    this.#tryCallbacks(
      this.#callbacks.onAddedNewEntry,
      () => super[InternalDexSymbols._removeEntry](key),
      key
    );
  }

  /** @internal */
  protected override [InternalDexSymbols._removeEntry](key: HashKey) {
    this.#tryCallbacks(this.#callbacks.onRemoveEntry, key);
    const entry = this.get(key)!;

    super[InternalDexSymbols._removeEntry](key);

    this.#tryCallbacks(
      this.#callbacks.onRemovedEntry,
      () => super[InternalDexSymbols._addNewEntry](entry, key),
      key
    );
  }

  /** @internal */
  protected override [InternalDexSymbols._addTagToEntry](tag: Tag, key: HashKey) {
    this.#tryCallbacks(this.#callbacks.onLinkTagToEntry, key, tag);

    super[InternalDexSymbols._addTagToEntry](tag, key);

    this.#tryCallbacks(
      this.#callbacks.onLinkedTagToEntry,
      () => super[InternalDexSymbols._removeTagFromEntry].call(this, tag, key),
      key,
      tag
    );
  }

  /** @internal */
  protected override [InternalDexSymbols._removeTagFromEntry](tag: Tag, key: HashKey) {
    this.#tryCallbacks(this.#callbacks.onUnlinkTagFromEntry, key, tag);

    super[InternalDexSymbols._removeTagFromEntry](tag, key);

    this.#tryCallbacks(
      this.#callbacks.onUnlinkedTagFromEntry,
      () => super[InternalDexSymbols._addTagToEntry].call(this, tag, key),
      key,
      tag
    );
  }

  /** @internal */
  protected override [InternalDexSymbols._setEntriesForExistingTag](
    tag: Tag,
    hashesToSet: [] | Set<HashKey>
  ): {
    added?: HashKey[];
    removed?: HashKey[];
    effected: HashKey[];
  } {
    const results = super[InternalDexSymbols._setEntriesForExistingTag](
      tag,
      hashesToSet,
      results => {
        if (results.added?.length && this.#callbacks.onLinkTagToEntry) {
          results.added.forEach(result =>
            this.#tryCallbacks.call(this, this.#callbacks.onLinkTagToEntry, result, tag)
          );
        } else if (results.removed?.length && this.#callbacks.onUnlinkTagFromEntry) {
          results.removed.forEach(result =>
            this.#tryCallbacks.call(this, this.#callbacks.onUnlinkedTagFromEntry, result, tag)
          );
        }
      }
    );

    if (results.added?.length && this.#callbacks.onLinkedTagToEntry) {
      results.added.forEach(result =>
        this.#tryCallbacks.call(this, this.#callbacks.onLinkedTagToEntry, () => {
          // TODO: this may cause a loop, I should make a minimal logic version of untag too.
          super[InternalDexSymbols._removeTagFromEntry](tag, result);
        }, result, tag)
      );
    } else if (results.removed?.length && this.#callbacks.onUnlinkedTagFromEntry) {
      results.removed.forEach(result =>
        this.#tryCallbacks.call(this, this.#callbacks.onUnlinkedTagFromEntry, () => {
          // TODO: this may cause a loop, I should make a minimal logic version of add too.
          super[InternalDexSymbols._addTagToEntry](tag, result);
        }, result, tag)
      );
    }

    return results;
  }

  /** @internal */
  protected override[InternalDexSymbols._untagEntry](entry: HashKey, tagsToRemove?: TagOrTags): void {
    const hash = this.hash(entry);
    const currentTagsForEntry = this[InternalRDexSymbols._tagsByHash].get(hash);
    const originalTags = [...this[InternalRDexSymbols._tagsByHash].get(hash) ?? []];
    const removedTags: Tag[] = [];

    if (!tagsToRemove) {
      let tagsToSet: Set<Tag> | undefined = undefined;
      for (const tag of originalTags) {
        if (this.#tryCallbacks(this.#callbacks.onUnlinkTagFromEntry, entry, tag)) {
          super[InternalDexSymbols._removeTagFromEntry](tag, entry);
          removedTags.push(tag);
        } else {
          tagsToSet ??= new Set();
          tagsToSet.add(tag);
        }
      }

      if (tagsToSet) {
        this[InternalRDexSymbols._tagsByHash].set(entry, tagsToSet);
      }
    } else if (Check.isNonStringIterable(tagsToRemove)) {
      for (const tag of tagsToRemove) {
        if (currentTagsForEntry?.has(tag)) {
          if (this.#tryCallbacks(this.#callbacks.onUnlinkTagFromEntry, entry, tag)) {
            super[InternalDexSymbols._removeTagFromEntry](tag, entry);
            removedTags.push(tag);
          }
        }
      }
    } else if (Check.isTag(tagsToRemove)) {
      if (this.#tryCallbacks(this.#callbacks.onUnlinkTagFromEntry, entry, tagsToRemove)) {
        super[InternalDexSymbols._removeTagFromEntry](tagsToRemove, entry);
        removedTags.push(tagsToRemove);
      }
    }

    removedTags.forEach(tag =>
      this.#tryCallbacks(this.#callbacks.onUnlinkedTagFromEntry,
        () => super[InternalDexSymbols._addTagToEntry](tag, entry),
        entry,
        tag));

  }

  //#region Internal

  /** @internal */
  #tryCallbacks(
    callback: Listener[] | undefined,
    shouldUndoOrArg: (() => void) | (HashKey | Tag | number),
    firstArgOrSecondArg?: (HashKey | Tag | number),
    secondArgOrUndefined?: (HashKey | Tag | number)
  ): boolean {
    if (!callback) {
      return true;
    }

    let undo: undefined | (() => void),
      arg1: (HashKey | Tag | number),
      arg2: (HashKey | Tag | number) | undefined;

    if (Check.isFunction(shouldUndoOrArg)) {
      undo = shouldUndoOrArg;
      arg1 = firstArgOrSecondArg!;
      arg2 = secondArgOrUndefined;
    } else {
      arg1 = shouldUndoOrArg;
      arg2 = firstArgOrSecondArg;
    }

    let result = true;

    Loop.loop(
      c => c(arg1, arg2!),
      callback,
      {
        onBreak: (breakResult, callback) => {
          if (undo) {
            undo();
          }

          if (breakResult.hasReturn && (breakResult.return instanceof Error || breakResult.return === null)) {
            throw breakResult.return ?? new DexError(`Error during callback: ${callback.name}, in a controled dex.`);
          }

          result = false
        }
      }
    )

    return result;
  }

  //#endregion

  //#endregion
}