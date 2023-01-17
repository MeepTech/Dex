import Loop from "../../utilities/iteration";
import Check from "../../utilities/validators";
import Dex, { Config as BaseConfig, InternalDexSymbols } from "./dex";
import { DexError, NotImplementedError } from "../errors";
import Entry, { None, OrNone, XWithTags, XWithTagsObject, XWithTagsTuple } from "../subsets/entries";
import HashKey from "../subsets/hashes";
import Tags, { Tag, TagOrTags } from "../subsets/tags";
import { InternalRDexSymbols } from "./read";
import { DexModifierFunctionConstructor, EntryAdder, EntryRemover, filterModifierArgs, TagDropper, Tagger, TagResetter, TagSetter, Untagger } from "./write";
import { Copier } from "../helpers/copy";
import { NoEntryFound, NO_RESULT } from "../queries/results";

//#region Symbols

/** @internal */
export namespace InternalNDexSymbols {
  export const _buildEventConstructorListener: unique symbol = Symbol("_buildEventConstructorListener");
}

/**
 * Config for choosing which events a noisy dex will emit.
 */
export type EventsConfig = true | ({
  onAdd: true | {
    [EventTarget.Tag]?: true;
    [EventTarget.Entry]: true;
  } | {
    [EventTarget.Tag]: true;
    [EventTarget.Entry]?: true;
  };
  onRemove?: true | {
    [EventTarget.Tag]?: true;
    [EventTarget.Entry]: true;
  } | {
    [EventTarget.Tag]: true;
    [EventTarget.Entry]?: true;
  };
  onUpdate?: true | {
    [EventTarget.Tag]: true;
    [EventTarget.Entry]?: true;
  } | {
    [EventTarget.Tag]?: true;
    [EventTarget.Entry]: true;
  };
} | {
  onAdd?: true | {
    [EventTarget.Tag]: true;
    [EventTarget.Entry]: true;
  } | {
    [EventTarget.Tag]?: true;
    [EventTarget.Entry]?: true;
  };
  onRemove: true | {
    [EventTarget.Tag]: true;
    [EventTarget.Entry]?: true;
  } | {
    [EventTarget.Tag]?: true;
    [EventTarget.Entry]: true;
  };
  onUpdate?: true | {
    [EventTarget.Tag]: true;
    [EventTarget.Entry]?: true;
  } | {
    [EventTarget.Tag]?: true;
    [EventTarget.Entry]: true;
  };
} | {
  onAdd?: true | {
    [EventTarget.Tag]: true;
    [EventTarget.Entry]?: true;
  } | {
    [EventTarget.Tag]?: true;
    [EventTarget.Entry]: true;
  };
  onRemove?: true | {
    [EventTarget.Tag]: true;
    [EventTarget.Entry]?: true;
  } | {
    [EventTarget.Tag]?: true;
    [EventTarget.Entry]: true;
  };
  onUpdate: true | {
    [EventTarget.Tag]: true;
    [EventTarget.Entry]?: true;
  } | {
    [EventTarget.Tag]?: true;
    [EventTarget.Entry]: true;
  };
});

//#endregion

/**
 * Config for a Noisy Dex
 */
export type Config<TEntry extends Entry> = BaseConfig<TEntry> & Listeners<TEntry>
  & ({
    emitEvents?: never,
    eventFunnel?: never
  } | {
    emitEvents: EventsConfig,
    eventFunnel: EventFunnel
  });

//#region Events

export enum EventType {
  Add = 'added',
  Remove = 'removed',
  Update = 'updated'
}

export enum UpdateEventType {
  Link = 'link',
  Unlink = 'unlink'
}

export enum EventTarget {
  Tag = 'tag',
  Entry = 'entry'
}

export interface DexValues {
  get tags(): Set<Tag> | undefined,
  get hashes(): Set<HashKey> | undefined,
  get entries(): Map<HashKey, Entry> | undefined
}

export interface EventFunnel {
  (event: Event): Promise<void> | void
}

/** @internal */
type EventEffectedValuesConsolidator = {
  tags?: Set<Tag>,
  hashes?: Set<HashKey>,
  entries?: Map<HashKey, Entry>
}

/** @internal */
type UnconstructedEvents = Record<EventTarget, Record<HashKey | Tag, Record<EventType, Record<UpdateEventType | "", EventEffectedValuesConsolidator>>>>;

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
    Entry: EventTarget.Entry
  }

  static Updates = {
    Link: UpdateEventType.Link,
    Unlink: UpdateEventType.Unlink,
  }

  readonly actionName: string;
  readonly params: DexValues;
  readonly timeStamp: Date;
  readonly type: EventType;
  readonly updateType?: UpdateEventType;
  readonly targetType: EventTarget;
  readonly target: Entry | HashKey | Tag;
  readonly effected: DexValues;

  constructor(
    actionName: string | ListenerType,
    timeStamp: Date,
    type: EventType.Add,
    targetType: EventTarget,
    mainTarget: Entry | HashKey | Tag,
    targeted: DexValues,
    effected: DexValues
  )

  constructor(
    actionName: string | ListenerType,
    timeStamp: Date,
    type: EventType.Update,
    targetType: EventTarget,
    target: Entry | HashKey | Tag,
    params: DexValues,
    effected: DexValues,
    updateType: UpdateEventType.Link | UpdateEventType.Unlink
  )

  constructor(
    actionName: string | ListenerType,
    timeStamp: Date,
    type: EventType.Remove,
    targetType: EventTarget,
    mainTarget: Entry | HashKey | Tag,
    targeted: DexValues,
    effected: DexValues
  )

  constructor(
    actionName: string | ListenerType,
    time: Date,
    type: EventType,
    targetType: EventTarget,
    mainTarget: Entry | HashKey | Tag,
    targeted: DexValues,
    effected: DexValues,
    updateType?: UpdateEventType
  ) {
    this.actionName = actionName;
    this.timeStamp = time;
    this.type = type;
    this.targetType = targetType;
    this.target = mainTarget;
    this.updateType = updateType;
    this.params = targeted;
    this.effected = effected as DexValues;
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
      [ListenerType.OnAddedNewEntry, EventTarget.Entry],
      [ListenerType.OnRemoveEntry, EventTarget.Entry],
      [ListenerType.OnRemovedEntry, EventTarget.Entry],
      [ListenerType.OnAddNewTag, EventTarget.Tag],
      [ListenerType.OnAddedNewTag, EventTarget.Tag],
      [ListenerType.OnRemoveTag, EventTarget.Tag],
      [ListenerType.OnRemovedTag, EventTarget.Tag],
      [ListenerType.OnLinkTagToEntry, EventTarget.Entry],
      [ListenerType.OnLinkedTagToEntry, EventTarget.Entry],
      [ListenerType.OnUnlinkTagFromEntry, EventTarget.Entry],
      [ListenerType.OnUnlinkedTagFromEntry, EventTarget.Entry]
    ]
  )
);

//#endregion

/**
 * A slightly less eficient version of the Dex that allows for listening into events and custom logic to be applied internaly on get, set, and updates.
 */
export default class NoisyDex<TEntry extends Entry> extends Dex<TEntry> {
  // config
  #eventOptions?: EventsConfig;
  // lazy
  // - callbacks
  #callbacks: Listeners = null!;
  // - modifiers
  #noisyTagSetter?: TagSetter<TEntry>;
  #noisyTagResetter?: TagResetter;
  #noisyTagDropper?: TagDropper;
  #noisyEntryAdder?: EntryAdder<TEntry>;
  #noisyEntryRemover?: EntryRemover<TEntry>;
  #noisyTagger?: Tagger<TEntry>;
  #noisyUntagger?: Untagger<TEntry>;
  #noisyClearer?: () => void;
  #noisyCleaner?: (options?: { tags?: boolean, entries?: boolean }) => { entries: number, tags: number };
  // - helpers
  #copier?: Copier<TEntry>;

  //#region Initialization

  //#region Ctor
  /**
   * Make a new empty dex
   */
  constructor()

  /**
   * Copy a new dex from an existing one
   */
  constructor(original: Dex<TEntry>, options?: Config<TEntry>)

  /**
   * Make a new dex from a map
   */
  constructor(map: Map<OrNone<TEntry>, TagOrTags>, options?: Config<TEntry>)

  /**
   * Make a new dex of just empty tags
   */
  constructor(options: Config<TEntry>)

  /**
   * Make a new dex with just one empty tag
   */
  constructor(options: Config<TEntry>, tag: Tag)

  /**
   * Make a new dex with just empty tags
   */
  constructor(options: Config<TEntry>, ...tags: Tag[])

  /**
   * Make a new dex with just empty tags
   */
  constructor(options: Config<TEntry>, tags: Tag[])

  /**
   * Make a new dex from entries with their tags. 
   */
  constructor(options: Config<TEntry>, entriesWithTags: XWithTagsTuple<TEntry>[])

  /**
   * Make a new dex from an object with entries and tags
   */
  constructor(options: Config<TEntry>, entryWithTags: XWithTagsObject<TEntry>)

  /**
   * Make a new dex from an object with entries and tags
   */
  constructor(options: Config<TEntry>, ...entriesWithTags: XWithTagsObject<TEntry>[])

  /**
   * Make a new dex from an object with entries and tags
   */
  constructor(options: Config<TEntry>, entriesWithTags: XWithTags<TEntry>[])

  /**
   * Make a new dex with just one empty tag
   */
  constructor(tag: Tag, options?: Config<TEntry>)

  /**
   * Make a new dex with just empty tags
   */
  constructor(tags: TagOrTags, options?: Config<TEntry>)

  /**
   * Make a new dex from entries with their tags. 
   */
  constructor(entriesWithTags: XWithTagsTuple<TEntry>[], options?: Config<TEntry>)

  /**
   * Make a new dex from an object with entries and tags
   */
  constructor(entryWithTags: XWithTagsObject<TEntry>, options?: Config<TEntry>)

  /**
   * Make a new dex from an object with entries and tags
   */
  constructor(entriesWithTags: XWithTags<TEntry>[], options?: Config<TEntry>)

  /**
   * Make a new dex from an object with entries and tags
   */
  constructor(...entriesWithTags: XWithTagsObject<TEntry>[])

  /**
   * Make a new dex with just empty tags
   */
  constructor(...tags: Tag[])

  constructor(...args: any[]) {
    super(...args);
  }

  //#endregion

  /** @internal */
  protected override[InternalDexSymbols._initOptions](config?: Config<TEntry>) {
    this.#callbacks = {};

    /*if ((config?.emitEvents as any)?.fromListeners) {
      config = <Config<TEntry>>config;
      this.#eventFunnel = config?.eventFunnel;
      if (!Check.isObject(config.emitEvents)) {
        for (const callbackKey of LISTENER_KEYS) {
          let callbackArray: Listener[] | undefined = (config as any)[callbackKey];

          if (!callbackArray) {
            callbackArray = [];
          }

          callbackArray.push(
            this.#buildEventConstructorListener(callbackKey)
          );

          this.#callbacks[callbackKey] = callbackArray as Listener<any>[];
        }

      } else {
        for (const callbackKey of LISTENER_KEYS) {
          let callbackArray: Listener[] | undefined = (config as any)[callbackKey];

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
            this.#buildEventConstructorListener(callbackKey)
          );

          this.#callbacks[callbackKey] = callbackArray as Listener<any>[];
        }
      }
    } else*/

    if (Check.isObject(config)) {
      for (const callbackKey of LISTENER_KEYS) {
        this.#callbacks[callbackKey] = (config as any)[callbackKey];
      }

      if (config.emitEvents) {
        this.#NoisyTagSetterConstructor();
        this.#NoisyEntryAdderConstructor();
        this.#NoisyTaggerConstructor();
        this.#NoisyEntryRemoverConstructor();
        this.#NoisyTagDropperConstructor();
        this.#NoisyTagResetterConstructor();
      }
    }
  }

  /** @internal */
  /*#buildEventConstructorListener(callbackKey: ListenerType): Listener<any> {
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
        effected as DexValues,
        UPDATE_LISTERNER_EVENT_TYPES.get(callbackKey) as any
      );

      this.#eventFunnel!(event);
    };
  }*/

  //#region Consolodated Events

  //#region Noisy Constructors

  /** @internal */
  #NoisyTagSetterConstructor() {
    return this.#noisyTagSetter ??= DexModifierFunctionConstructor<
      TEntry,
      [tag: Tag],
      TEntry | HashKey,
      number,
      [entries: [] | Iterable<TEntry | HashKey>] | []
    >(
      this,
      ((
        tag: Tag,
        entries?: Iterable<TEntry | HashKey> | [],
        ...rest: any[]
      ): number => {
        const events = rest[rest.length - 2] as UnconstructedEvents;
        
        // undefined means nothing gets touched and we verify the tag exists.
        if (entries === undefined) {
          if (!this.has(tag)) {
            this[InternalDexSymbols._addNewTag](tag);
            this.#queueNewTagAddedEvent(events, tag);
          }
        } else {
          // None(null) or [] is passed in, set to empty:
          if (!entries || !Loop.count(entries)) {
            if (this.has(tag)) {
              const unlinkedEntryHashes = this.hashes(tag);
              this[InternalDexSymbols._setEntriesForExistingTag](tag, []);
              this.#queueNewUnlinkedFromTagEvent(events, tag, unlinkedEntryHashes);
            } else {
              this[InternalDexSymbols._addNewTag](tag);
              this.#queueNewTagAddedEvent(events, tag);
            }

          } // set entries provided
          else {
            const hashesToSet: Set<HashKey> = new Set<HashKey>();
            const newEntries = new Map<HashKey, TEntry>();
            for (const entry of entries) {
              const hash = this.hash(entry);
              if (!this.has(hash) && this.canContain(entry)) {
                newEntries.set(hash, entry);
                this[InternalDexSymbols._addNewEntry](entry, hash);
                this.#queueNewEntryAddedEvent(events, hash);
              }

              hashesToSet.add(hash);
            }

            if (this.has(tag)) {
              const initial = this.hashes(tag);
              const added = [...hashesToSet].filter(h => !initial.has(h));
              const removed = [...initial].filter(h => !hashesToSet.has(h));
              this[InternalDexSymbols._setEntriesForExistingTag](tag, hashesToSet);
              this.#queueNewLinkedToTagEvent(events, tag, added);
              this.#queueNewUnlinkedFromTagEvent(events, tag, removed);
            } else {
              this[InternalDexSymbols._addNewTag](tag, hashesToSet);
              this.#queueNewTagAddedEvent(events, tag);
              this.#queueNewLinkedToTagEvent(events, tag, hashesToSet);
            }
          }
        }

        return this.hashes(tag).size;
      }).bind(this),
      filterModifierArgs as any,
      () => {
        return [{} as UnconstructedEvents, new Date()];
      },
      (wasEach: boolean, ...rest: any[]) => {
        const events = rest[rest.length - 2] as UnconstructedEvents;
        const time = rest[rest.length - 1] as Date;

        this.#broadcast("set" + (wasEach ? ".each" : ""), time, events);
      }
    ) as TagSetter<TEntry>
  }

  /** @internal */
  #NoisyEntryAdderConstructor() {
    return this.#noisyEntryAdder ??= DexModifierFunctionConstructor<
      TEntry,
      [entry: TEntry | HashKey],
      Tag,
      { hashKey: HashKey | None, tagCount: number, isNew: boolean },
      [Iterable<Tag>] | []
    >(
      this,
      ((
        entry: TEntry | HashKey,
        tags?: Iterable<Tag>,
        ...rest: any[]
      ): { hashKey: HashKey | None, tagCount: number, isNew: boolean } => {
        const events = rest[rest.length - 2] as UnconstructedEvents;

        let isNew: boolean;
        const hash = this.hash(entry);
        if (!this.has(hash) && this.canContain(entry)) {
          isNew = true;
          this[InternalDexSymbols._addNewEntry](entry, hash);
          this.#queueNewEntryAddedEvent(events, hash);
        } else {
          isNew = false;
        }

        tags = [...tags ?? []];
        const newTags = (<Tag[]>tags).filter(t => !this.tags(hash).has(t));
        (<Tag[]>tags).forEach(tag => {
          if (!this.has(tag)) {
            this[InternalDexSymbols._addNewTag](tag);
            this.#queueNewTagAddedEvent(events, tag);
          }

          this[InternalDexSymbols._addTagToEntry](tag, hash)
          this.#queueNewLinkedToTagEvent(events, tag, [hash])
        });

        return { isNew, hashKey: hash, tagCount: this.tags(hash).size };
      }).bind(this),
      filterModifierArgs as any,
      () => {
        return [{} as UnconstructedEvents, new Date()];
      },
      (wasEach: boolean, ...rest: any[]) => {
        const events = rest[rest.length - 2] as UnconstructedEvents;
        const time = rest[rest.length - 1] as Date;

        this.#broadcast("add" + (wasEach ? ".each" : ""), time, events);
      }
    ) as EntryAdder<TEntry>
  }

  /** @internal */
  #NoisyEntryRemoverConstructor() {
    return this.#noisyEntryRemover ??= DexModifierFunctionConstructor<
      TEntry,
      [entry: TEntry],
      Tag,
      { wasRemoved: boolean | NoEntryFound, tagCount?: number },
      []
      | [unlinkFromTag: Tag]
      | [unlinkTags: Iterable<Tag>]
      | [unlinkTags: Iterable<Tag>, options: { keepTaglessEntries?: true, dropEmptyTags?: true }]
      | [...unlinkTags: Tag[], options: { keepTaglessEntries?: true, dropEmptyTags?: true }]
      | [options?: { keepTaglessEntries?: true, dropEmptyTags?: true }]
    >(
      this,
      ((
        entry: TEntry | HashKey,
        tags?: Iterable<Tag>,
        options?: { keepTaglessEntries?: true, dropEmptyTags?: true },
        ...rest: any[]
      ): { wasRemoved: boolean | NoEntryFound, tagCount: number } => {
        const events = rest[rest.length - 2] as UnconstructedEvents;
        if (!options) {
          const hash = this.hash(entry);
          if (this.contains(hash)) {
            this[InternalDexSymbols._untagEntry](hash, tags);
            for (const tag of tags ?? []) {
              this.#queueNewUnlinkedFromTagEvent(events, tag, [hash]);
            }
            const remainingTagCount = this[InternalRDexSymbols._tagsByHash].get(hash)?.size;
            if (!remainingTagCount) {
              const e = this.get(hash)!;
              this[InternalDexSymbols._removeEntry](hash);
              this.#queueNewEntryRemovedEvent(events, hash, e);
              return { wasRemoved: true, tagCount: 0 };
            } else {
              return { wasRemoved: false, tagCount: remainingTagCount };
            }
          } else {
            return { wasRemoved: NO_RESULT, tagCount: 0 };
          }
        } else {
          const hash = this.hash(entry);
          if (this.contains(hash)) {
            this[InternalDexSymbols._untagEntry](hash, tags);
            for (const tag of tags ?? []) {
              this.#queueNewUnlinkedFromTagEvent(events, tag, [hash]);
            }
            if (options.dropEmptyTags) {
              for (const tag in tags) {
                if (this.has(tag) && !this[InternalRDexSymbols._hashesByTag].get(tag)?.size) {
                  this[InternalDexSymbols._resetTag](tag, {
                    ...options, onRemove: key => {
                      this.#queueNewEntryRemovedEvent(events, key, this.get(key)!);
                    }
                  });
                  this[InternalDexSymbols._removeTag](tag);
                  this.#queueNewTagRemovedEvent(events, tag);
                }
              }
            }

            const remainingTagCount = this[InternalRDexSymbols._tagsByHash].get(hash)?.size;
            if (!remainingTagCount && !options.keepTaglessEntries) {
              this[InternalDexSymbols._removeEntry](hash);
              this.#queueNewEntryRemovedEvent(events, hash, this.get(hash)!);
              return { wasRemoved: true, tagCount: 0 };
            } else {
              return { wasRemoved: false, tagCount: remainingTagCount ?? 0 };
            }
          } else {
            return { wasRemoved: NO_RESULT, tagCount: 0 };
          }
        }
      }).bind(this),
      filterModifierArgs as any,
      () => {
        return [{} as UnconstructedEvents, new Date()];
      },
      (wasEach: boolean, ...rest: any[]) => {
        const events = rest[rest.length - 2] as UnconstructedEvents;
        const time = rest[rest.length - 1] as Date;

        this.#broadcast("remove" + (wasEach ? ".each" : ""), time, events);
      }
    ) as EntryRemover<TEntry>
  }

  /** @internal */
  #NoisyUntaggerConstructor() {
    return this.#noisyUntagger ??= DexModifierFunctionConstructor<
      TEntry,
      [entry: TEntry],
      Tag,
      { foundEntry: boolean | NoEntryFound, tagCount?: number },
      [...tags: Tag[]] | [tags: Iterable<Tag>] | [tag: Tag]
    >(
      this,
      ((
        entry: TEntry | HashKey,
        tags?: Iterable<Tag>,
        ...rest: any[]
      ): { foundEntry: boolean | NoEntryFound, tagCount: number } => {
        const events = rest[rest.length - 2] as UnconstructedEvents;
        if (this.contains(entry)) {
          const hash = this.hash(entry);
          this[InternalDexSymbols._untagEntry](hash, tags as Tags);
          for (const tag of tags ?? []) {
            this.#queueNewUnlinkedFromTagEvent(events, tag, [hash]);
          }
          return { foundEntry: true, tagCount: this[InternalRDexSymbols._tagsByHash].get(hash)!.size }
        }

        return { foundEntry: false, tagCount: 0 };
      }
    ).bind(this),
      filterModifierArgs as any,
      () => {
        return [{} as UnconstructedEvents, new Date()];
      },
      (wasEach: boolean, ...rest: any[]) => {
        const events = rest[rest.length - 2] as UnconstructedEvents;
        const time = rest[rest.length - 1] as Date;

        this.#broadcast("untag" + (wasEach ? ".each" : ""), time, events);
      }
    ) as Untagger<TEntry>
  }

  /** @internal */
  #NoisyTaggerConstructor() {
    return this.#noisyTagger ??= DexModifierFunctionConstructor<
      TEntry,
      [entry: TEntry | HashKey],
      Tag,
      number,
      [...tags: Tag[]]
      | [tags: Iterable<Tag>]
      | [tag: Tag]
      | []
    >(
      this,
      ((
        entry: TEntry | HashKey,
        tags: Iterable<Tag>,
        ...rest: any[]
      ) => {
        const events = rest[rest.length - 2] as UnconstructedEvents;
        const hash = this.hash(entry);
        if (this.contains(hash)) {
          const currentTags = this.tags.of(hash)!;
          for (const tag of tags) {
            if (!this.has(tag)) {
              this[InternalDexSymbols._addNewTag](tag);
              this.#queueNewTagAddedEvent(events, tag);
            }

            if (!currentTags.has(tag)) {
              this[InternalDexSymbols._addTagToEntry](tag, hash)
              this.#queueNewLinkedToTagEvent(events, tag, [hash]);
            }
          }

          return this.tags(entry).size;
        }

        return 0;
      }
    ).bind(this),
      filterModifierArgs as any,
      () => {
        return [{} as UnconstructedEvents, new Date()];
      },
      (wasEach: boolean, ...rest: any[]) => {
        const events = rest[rest.length - 2] as UnconstructedEvents;
        const time = rest[rest.length - 1] as Date;

        this.#broadcast("tag" + (wasEach ? ".each" : ""), time, events);
      }
    ) as Tagger<TEntry>
  }

  /** @internal */
  #NoisyTagDropperConstructor() {
    return this.#noisyTagDropper ??= ((
      ...args: ({ keepTaglessEntries?: true } | TagOrTags)[]
    ): boolean | Set<Tag> => {
      let time = new Date();
      let events = undefined! as UnconstructedEvents;

      let options: { keepTaglessEntries?: true } | undefined = undefined;
      let tags: Tag[] = [];
      for (const arg in args) {
        if (Check.isTag(arg)) {
          tags.push(arg);
        } else if (Check.isArray(arg)) {
          tags.concat(arg);
        } else {
          options ??= arg as { keepTaglessEntries?: true };
        }
      }

      const result = new Set<Tag>();
      for (const tag of tags) {
        if (this.has(tag)) {
          this[InternalDexSymbols._resetTag](tag, {
            ...options, onRemove: key => {
              this.#queueNewEntryRemovedEvent(events, key, this.get(key)!);
            }
          });
          this[InternalDexSymbols._removeTag](tag);
          this.#queueNewTagRemovedEvent(events, tag);
          result.add(tag);
        }
      }

      this.#broadcast("drop", time, events);

      return tags.length === 1
        ? !!result.size
        : result;
    }) as TagDropper
  }

  /** @internal */
  #NoisyTagResetterConstructor() {
    return this.#noisyTagResetter ??= ((
      ...args: ({ keepTaglessEntries?: true } | TagOrTags)[]
    ): boolean | Set<Tag> => {
      let time = new Date();
      let events = undefined! as UnconstructedEvents;

      let options: { keepTaglessEntries?: true } | undefined = undefined;
      let tags: Tag[] = [];
      for (const arg in args) {
        if (Check.isTag(arg)) {
          tags.push(arg);
        } else if (Check.isArray(arg)) {
          tags.concat(arg);
        } else {
          options ??= arg as { keepTaglessEntries?: true };
        }
      }

      const results = new Set<Tag>();
      for (const tag of tags) {
        if (this.has(tag)) {
          const result = this[InternalDexSymbols._resetTag](tag, {
            ...options, onRemove: key => {
              this.#queueNewEntryRemovedEvent(events, key, this.get(key)!);
            }
          });

          if (result !== undefined) {
            results.add(result);
          }
        }
      }

      this.#broadcast("reset", time, events);

      return tags.length === 1
        ? !!results.size
        : results;
    }) as TagResetter
  }

  #NoisyCleanerConstructor() {
    return this.#noisyCleaner ??= function (this: NoisyDex<TEntry>, options?: { tags?: boolean, entries?: boolean }): { entries: number, tags: number } {
      let time = new Date();
      let events = undefined! as UnconstructedEvents;

      const result = {entries: 0, tags: 0};
      if (options?.entries) {
        for (const [k, t] of this[InternalRDexSymbols._tagsByHash]) {
          if (!t.size) {
            result.entries++;
            this.#queueNewEntryRemovedEvent(events, k, this.get(k)!);
            this[InternalDexSymbols._removeEntry](k);
          }
        }
      }
  
      if (options?.tags) {
        for (const [t, k] of this[InternalRDexSymbols._hashesByTag]) {
          if (!k.size) {
            result.tags++;
            this.#queueNewTagRemovedEvent(events, t);
            this[InternalDexSymbols._removeTag](t);
          }
        }
      }

      this.#broadcast("reset", time, events);
  
      return result;
    }.bind(this)
  }

  //#endregion

  //#endregion

  //#endregion

  //#region Methods

  //#region Events

  override get set(): TagSetter<TEntry> {
    return this.#noisyTagSetter ?? super.set;
  }

  //#region Event Queue
  
  /** @internal */
  #broadcast(label: string, time: Date, events: UnconstructedEvents) {
    throw new NotImplementedError("#broadcast");
  }

  /** @internal */
  #queueNewUnlinkedFromTagEvent(
    events: UnconstructedEvents,
    tag: Tag,
    unlinkedEntries: Set<HashKey> | HashKey[]
  ) {
    if (this.#eventOptions === true || this.#eventOptions?.onUpdate === true || this.#eventOptions?.onUpdate?.[EventTarget.Tag]) {
      if (!events[EventTarget.Tag]) {
        events[EventTarget.Tag] = {};
      }
      const tagEvents = events[EventTarget.Tag];

      if (!tagEvents.hasOwnProperty(tag)) {
        tagEvents[tag] = {} as any;
      }
      if (!tagEvents[tag].hasOwnProperty(EventType.Update)) {
        tagEvents[tag][EventType.Update] = {} as any;
      }
      if (!tagEvents[tag][EventType.Update].hasOwnProperty(UpdateEventType.Unlink)) {
        tagEvents[tag][EventType.Update][UpdateEventType.Unlink] = {} as any;
        tagEvents[tag][EventType.Update][UpdateEventType.Unlink].hashes = new Set<HashKey>(unlinkedEntries);
        tagEvents[tag][EventType.Update][UpdateEventType.Unlink].tags = new Set<Tag>([tag]);
        tagEvents[tag][EventType.Update][UpdateEventType.Link].entries = new Map<HashKey, TEntry>([...unlinkedEntries].map((h => [h, this.get(h)!])));
      } else {
        unlinkedEntries.forEach(tagEvents[tag][EventType.Update][UpdateEventType.Unlink].hashes!.add);
        unlinkedEntries.forEach(h => tagEvents[tag][EventType.Update][UpdateEventType.Link].entries!.set(h, this.get(h)!));
      }
    }

    if (this.#eventOptions === true || this.#eventOptions?.onUpdate === true || this.#eventOptions?.onUpdate?.[EventTarget.Entry]) {
      if (!events[EventTarget.Entry]) {
        events[EventTarget.Entry] = {};
      }
      const entryEvents = events[EventTarget.Entry];

      for (const hash in unlinkedEntries) {
        if (!entryEvents.hasOwnProperty(hash)) {
          entryEvents[hash] = {} as any;
        }
        if (!entryEvents[hash].hasOwnProperty(EventType.Update)) {
          entryEvents[hash][EventType.Update] = {} as any;
        }
        if (!entryEvents[hash][EventType.Update].hasOwnProperty(UpdateEventType.Unlink)) {
          entryEvents[hash][EventType.Update][UpdateEventType.Unlink] = {} as any;
          entryEvents[hash][EventType.Update][UpdateEventType.Unlink].hashes = new Set<HashKey>(hash);
          entryEvents[hash][EventType.Update][UpdateEventType.Unlink].tags = new Set<Tag>([tag]);
        } else {
          entryEvents[hash][EventType.Update][UpdateEventType.Unlink].tags!.add(tag);
        }
      }
    }
  }

  /** @internal */
  #queueNewLinkedToTagEvent(
    events: UnconstructedEvents,
    tag: Tag,
    linkedEntries: Set<HashKey> | HashKey[]
  ) {
    if (this.#eventOptions === true || this.#eventOptions?.onUpdate === true || this.#eventOptions?.onUpdate?.[EventTarget.Tag]) {
      if (!events[EventTarget.Tag]) {
        events[EventTarget.Tag] = {};
      }
      const tagEvents = events[EventTarget.Tag];

      if (!tagEvents.hasOwnProperty(tag)) {
        tagEvents[tag] = {} as any;
      }
      if (!tagEvents[tag].hasOwnProperty(EventType.Update)) {
        tagEvents[tag][EventType.Update] = {} as any;
      }
      if (!tagEvents[tag][EventType.Update].hasOwnProperty(UpdateEventType.Link)) {
        tagEvents[tag][EventType.Update][UpdateEventType.Link] = {} as any;
        tagEvents[tag][EventType.Update][UpdateEventType.Link].hashes = new Set<HashKey>(linkedEntries);
        tagEvents[tag][EventType.Update][UpdateEventType.Link].tags = new Set<Tag>([tag]);
        tagEvents[tag][EventType.Update][UpdateEventType.Link].entries = new Map<HashKey, TEntry>([...linkedEntries].map((h => [h, this.get(h)!])));
      } else {
        linkedEntries.forEach(tagEvents[tag][EventType.Update][UpdateEventType.Link].hashes!.add);
        linkedEntries.forEach(h => tagEvents[tag][EventType.Update][UpdateEventType.Link].entries!.set(h, this.get(h)!));
      }
    }

    if (this.#eventOptions === true || this.#eventOptions?.onUpdate === true || this.#eventOptions?.onUpdate?.[EventTarget.Entry]) {
      if (!events[EventTarget.Entry]) {
        events[EventTarget.Entry] = {};
      }
      const entryEvents = events[EventTarget.Entry];

      for (const hash in linkedEntries) {
        if (!entryEvents.hasOwnProperty(hash)) {
          entryEvents[hash] = {} as any;
        }
        if (!entryEvents[hash].hasOwnProperty(EventType.Update)) {
          entryEvents[hash][EventType.Update] = {} as any;
        }
        if (!entryEvents[hash][EventType.Update].hasOwnProperty(UpdateEventType.Link)) {
          entryEvents[hash][EventType.Update][UpdateEventType.Link] = {} as any;
          entryEvents[hash][EventType.Update][UpdateEventType.Link].hashes = new Set<HashKey>(hash);
          entryEvents[hash][EventType.Update][UpdateEventType.Link].tags = new Set<Tag>([tag]);
        } else {
          entryEvents[hash][EventType.Update][UpdateEventType.Link].tags!.add(tag);
        }
      }
    }
  }

  /** @internal */
  #queueNewTagAddedEvent(
    events: UnconstructedEvents,
    tag: Tag,
  ) {
    if (this.#eventOptions === true || this.#eventOptions?.onAdd === true || this.#eventOptions?.onAdd?.[EventTarget.Tag]) {
      if (!events[EventTarget.Tag]) {
        events[EventTarget.Tag] = {};
      }
      const tagEvents = events[EventTarget.Tag];
      if (!tagEvents.hasOwnProperty(tag)) {
        tagEvents[tag] = {} as any;
      }
      if (!tagEvents[tag].hasOwnProperty(EventType.Add)) {
        tagEvents[tag][EventType.Add][""] = {} as any;
        tagEvents[tag][EventType.Add][""].tags = new Set<Tag>([tag]);
      }
    }
  }

  /** @internal */
  #queueNewEntryAddedEvent(
    events: UnconstructedEvents,
    hash: HashKey
  ) {
    if (this.#eventOptions === true || this.#eventOptions?.onAdd === true || this.#eventOptions?.onAdd?.[EventTarget.Entry]) {
      if (!events[EventTarget.Entry]) {
        events[EventTarget.Entry] = {};
      }
      const entryEvents = events[EventTarget.Entry];
      if (!entryEvents.hasOwnProperty(hash)) {
        entryEvents[hash] = {} as any;
      }
      if (!entryEvents[hash].hasOwnProperty(EventType.Add)) {
        entryEvents[hash][EventType.Add][""] = {} as any;
        entryEvents[hash][EventType.Add][""].hashes = new Set<Tag>([hash]);
        entryEvents[hash][EventType.Remove][""].entries = new Map<HashKey, TEntry>([[hash, this.get(hash)!]]);
      }
    }
  }
  /** @internal */
  #queueNewTagRemovedEvent(
    events: UnconstructedEvents,
    tag: Tag,
  ) {
    if (this.#eventOptions === true || this.#eventOptions?.onRemove === true || this.#eventOptions?.onRemove?.[EventTarget.Tag]) {
      if (!events[EventTarget.Tag]) {
        events[EventTarget.Tag] = {};
      }
      const tagEvents = events[EventTarget.Tag];
      if (!tagEvents.hasOwnProperty(tag)) {
        tagEvents[tag] = {} as any;
      }
      if (!tagEvents[tag].hasOwnProperty(EventType.Add)) {
        tagEvents[tag][EventType.Remove][""] = {} as any;
        tagEvents[tag][EventType.Remove][""].tags = new Set<Tag>([tag]);
      }
    }
  }

  /** @internal */
  #queueNewEntryRemovedEvent(
    events: UnconstructedEvents,
    hash: HashKey,
    entry: TEntry
  ) {
    if (this.#eventOptions === true || this.#eventOptions?.onRemove === true || this.#eventOptions?.onRemove?.[EventTarget.Entry]) {
      if (!events[EventTarget.Entry]) {
        events[EventTarget.Entry] = {};
      }
      const entryEvents = events[EventTarget.Entry];
      if (!entryEvents.hasOwnProperty(hash)) {
        entryEvents[hash] = {} as any;
      }
      if (!entryEvents[hash].hasOwnProperty(EventType.Remove)) {
        entryEvents[hash][EventType.Remove][""] = {} as any;
        entryEvents[hash][EventType.Remove][""].hashes = new Set<HashKey>([hash]);
        entryEvents[hash][EventType.Remove][""].entries = new Map<HashKey, TEntry>([[hash, entry]]);
      }
    }
  }

  //#endregion

  //#endregion

  /** @internal */
  protected override[InternalDexSymbols._addNewTag](tag: Tag, hashesToSet = new Set<HashKey>()): void {
    this.#tryCallbacks(this.#callbacks.onAddNewTag, tag);

    super[InternalDexSymbols._addNewTag](tag, hashesToSet);

    this.#tryCallbacks(
      this.#callbacks.onAddedNewTag,
      () => super[InternalDexSymbols._removeTag](tag),
      tag
    );
  }

  /** @internal */
  protected override[InternalDexSymbols._removeTag](tag: Tag): void {
    this.#tryCallbacks(this.#callbacks.onRemoveTag, tag);

    super[InternalDexSymbols._removeTag](tag);

    this.#tryCallbacks(
      this.#callbacks.onRemovedTag,
      () => super[InternalDexSymbols._addNewTag](tag),
      tag
    );
  }

  /** @internal */
  protected override[InternalDexSymbols._addNewEntry](entry: TEntry, key: HashKey) {
    this.#tryCallbacks(this.#callbacks.onAddNewEntry, key);

    super[InternalDexSymbols._addNewEntry](entry, key);

    this.#tryCallbacks(
      this.#callbacks.onAddedNewEntry,
      () => super[InternalDexSymbols._removeEntry](key),
      key
    );
  }

  /** @internal */
  protected override[InternalDexSymbols._removeEntry](key: HashKey) {
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
  protected override[InternalDexSymbols._addTagToEntry](tag: Tag, key: HashKey) {
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
  protected override[InternalDexSymbols._removeTagFromEntry](tag: Tag, key: HashKey) {
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
  protected override[InternalDexSymbols._setEntriesForExistingTag](
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