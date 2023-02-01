import Dex, { Config as BaseConfig, CtorProps, EntryOf, IDex, InternalDexSymbols } from './dex'
import { IReadableDex, ReadableDex } from './read'
import Entry from '../subsets/entries'
import HashKey from '../subsets/hashes'
import { AccessError, DexError, InvalidEntryError } from '../errors';

export type Config<TEntry extends Entry, TIndex extends HashKey, TBase extends BaseConfig<TEntry> = BaseConfig<TEntry>> = TBase & {
  indexGenerator?: (entry: TEntry, thisDex: InDex<TEntry, TIndex, any>) => TIndex,
  indexGuard?: (key: TIndex, thisDex: InDex<TEntry, TIndex, any>) => boolean,
  onIndexAdded?: (key: TIndex, thisDex: InDex<TEntry, TIndex, any>) => void,
  onIndexRemoved?: (key: TIndex, thisDex: InDex<TEntry, TIndex, any>) => void,
}

type InDex<
  TEntry extends Entry = Entry,
  TIndex extends HashKey = HashKey,
  TDex extends IReadableDex<TEntry> = ReadableDex<TEntry>,
> = TDex
  & { [index in TIndex]: TEntry };

const InDex: {
  new <
    TDex extends IReadableDex<TEntry>,
    TEntry extends Entry = EntryOf<TDex>,
    TIndex extends HashKey = HashKey,
  >(): InDex<TEntry, TIndex, TDex>;
  new <
    TDex extends IReadableDex<TEntry>,
    TEntry extends Entry = EntryOf<TDex>,
    TIndex extends HashKey = HashKey,
  >(original: TDex): InDex<TEntry, TIndex, TDex>;
  new <
    TDex extends IReadableDex<TEntry>,
    TEntry extends Entry = EntryOf<TDex>,
    TIndex extends HashKey = HashKey,
  >(original: TDex, config: Config<TEntry, TIndex>): InDex<TEntry, TIndex, TDex>;
  new <
    TDex extends IReadableDex<TEntry>,
    TConfig extends Config<TEntry, TIndex, TBaseConfig>,
    TBaseConfig extends BaseConfig<TEntry>,
    TEntry extends Entry = EntryOf<TDex>,
    TIndex extends HashKey = HashKey,
  >(original: TDex, config: TConfig): InDex<TEntry, TIndex, TDex>;
  new <
    TDex extends IReadableDex<TEntry>,
    TEntry extends Entry,
    TConfig extends Config<TEntry, TIndex, TBaseConfig>,
    TBaseConfig extends BaseConfig<TEntry> = BaseConfig<TEntry>,
    TIndex extends HashKey = HashKey,
  >(config: TConfig): InDex<TEntry, TIndex, TDex>;
  new <
    TDex extends IReadableDex<TEntry>,
    TEntry extends Entry,
    TConfig extends Config<TEntry, TIndex, TBaseConfig>,
    TBaseConfig extends BaseConfig<TEntry>,
    TIndex extends HashKey,
  >(...args: [Exclude<CtorProps<TEntry, TConfig>[0], ReadableDex<TEntry>>, CtorProps<TEntry, TConfig>[1]]): InDex<TEntry, TIndex, TDex>;
  new <
    TEntry extends Entry = Entry,
    TIndex extends HashKey = HashKey,
    TDex extends IReadableDex<TEntry> = Dex<TEntry>
  >(...args: CtorProps<TEntry, Config<TEntry, TIndex>>): InDex<TEntry, TIndex, TDex>;
  isConfig(value: any): value is Config<any, any, any>;
  is(value: any): value is InDex<any, any, any>;
} = (
    (function InDexConstructor<
      TDex extends IReadableDex<TEntry>,
      TEntry extends Entry,
      TConfig extends Config<TEntry, TIndex, TBaseConfig>,
      TBaseConfig extends BaseConfig<TEntry>,
      TIndex extends HashKey,
    >(
      this: InDex<TEntry, TIndex, TDex>,
      ...args: [original: TDex] | [original: TDex, config: TConfig] | CtorProps<TEntry, TConfig>
    ): InDex<TEntry, TIndex, TDex> {
      let inDex: TDex;
      if (args[0] instanceof ReadableDex) {
        inDex = new ((args[0] as IReadableDex<TEntry> as TDex).constructor as any)(...args);
      } else {
        inDex = new Dex<TEntry>(...(args as any)) as IReadableDex<TEntry> as TDex;
      }

      inDex.constructor = (this as any as Function);
      const config: TConfig | undefined = InDex.isConfig(args[1])
        ? args[1] as TConfig
        : InDex.isConfig(args[0])
          ? args[0] as TConfig
          : undefined;

      const readonly = ReadableDex.is(inDex);
      const indexGenerator = config?.indexGenerator;
      const indexGuard = config?.indexGuard;
      const onIndexAdded = config?.onIndexAdded;
      const onIndexRemoved = config?.onIndexRemoved;
      const indexesByHash = new Map<HashKey, TIndex>();
      const hashesByIndex = new Map<TIndex, HashKey>();

      const proxy = new Proxy(inDex, _buildIndexedProxyHandler()) as InDex<TEntry, TIndex, TDex>;

      if (!readonly && indexGenerator) {
        for (const entry of proxy.entries()) {
          setByIndex(
            inDex as any as IDex<TEntry>,
            indexGenerator(entry, inDex),
            entry,
            indexGuard,
            indexesByHash,
            hashesByIndex,
            onIndexAdded
          )
        }
      }

      return proxy;

      // helpers
      /** @internal */
      function _buildIndexedProxyHandler(): ProxyHandler<TDex> {
        return {
          get(target: TDex, key: string | symbol | number) {
            if (key === InternalDexSymbols._addNewEntry) {
              if (readonly) {
                throw new AccessError('Cannot add entries to a readonly dex');
              }

              if (indexGenerator) {
                return (...args: any[]) => {
                  const hash = args[1];
                  (target as any)[key](...args);
                  const index = indexGenerator(args[0], target);
                  if (index !== undefined) {
                    return setByIndex<TEntry, TIndex>(
                      target as any as IDex<TEntry>,
                      key as TIndex,
                      args[0] as TEntry,
                      indexGuard,
                      indexesByHash,
                      hashesByIndex,
                      onIndexAdded
                    );
                  }

                  return hash;
                }
              };
            } else if (key === InternalDexSymbols._removeEntry) {
              if (readonly) {
                throw new AccessError('Cannot remove entries from a readonly dex');
              }

              return (...args: any[]) => {
                if (hashesByIndex.has(key as TIndex)) {
                  const hash: HashKey = args[0];
                  return removeByIndex(args[0], target, onIndexRemoved);
                }
              }
            }

            if (indexGuard?.(key as TIndex, target) ?? true) {
              const numKey = Number(key);
              const hash = hashesByIndex.get(isNaN(numKey) ? key as TIndex : numKey as TIndex);
              if (hash !== undefined) {
                return target.get(hash);
              }
            }

            return (target as any)[key];
          },
          set(target: TDex, key: string | symbol | number, newValue: TEntry | HashKey): boolean {
            if (!readonly) {
              if (Dex.isTag(newValue)) {
                if (!(target as any as IDex<TEntry>).canContain(newValue)) {
                  newValue = target.get(newValue)!;
                  if (!(target as any as IDex<TEntry>).canContain(newValue)) {
                    throw new InvalidEntryError(newValue);
                  }
                } else if (target.contains(newValue)) {
                  newValue = target.get(newValue)!;
                }
              }

              return setByIndex<TEntry, TIndex>(
                target as any as IDex<TEntry>,
                key as TIndex,
                newValue as TEntry,
                indexGuard,
                indexesByHash,
                hashesByIndex,
                onIndexAdded
              );
            }

            throw new AccessError("Cannot set values via Index on a Read-only InDex.")
          },
          deleteProperty(target: TDex, key: string | symbol | number): boolean {
            if (!readonly) {
              if (hashesByIndex.has(key as TIndex)) {
                return removeByIndex(key, target, onIndexRemoved)
              } else {
                return delete (target as any)[key];
              }
            }

            throw new AccessError("Cannot delete values via Index on a Read-only InDex.")
          }
        }
      }

      /** @internal */
      function removeByIndex(
        key: string | number | symbol,
        target: TDex,
        onIndexRemoved: ((key: TIndex, thisDex: InDex<TEntry, TIndex, any>) => void) | undefined
      ): boolean {
        const currentHash = hashesByIndex.get(key as TIndex)!
        hashesByIndex.delete(key as TIndex)
        indexesByHash.delete(currentHash);
        if ((target as any as IDex<TEntry>).remove(currentHash).wasRemoved ?? false) {
          onIndexRemoved?.(key as TIndex, target);
          return true;
        };

        return false;
      }

      /** @internal */
      function setByIndex<
        TEntry extends Entry = Entry,
        TIndex extends HashKey = HashKey,
      >(
        target: IDex<TEntry>,
        index: TIndex,
        newValue: TEntry,
        indexGuard: ((key: TIndex, thisDex: InDex<TEntry, TIndex, any>) => boolean) | undefined,
        indexesByHash: Map<HashKey, TIndex>,
        hashesByIndex: Map<TIndex, HashKey>,
        onIndexAdded: ((key: TIndex, thisDex: InDex<TEntry, TIndex, any>) => void) | undefined
      ) {
        const numKey = Number(index);
        const key = isNaN(numKey) ? index as TIndex : numKey as TIndex;

        if (indexGuard?.(key as TIndex, target) ?? true) {
          const newHash = target.hash(newValue)!;
          // if the index is new
          if (hashesByIndex.has(key as TIndex)) {
            const currentHashAtIndex = hashesByIndex.get(key as TIndex)!;

            if (newHash !== currentHashAtIndex) {
              // remove the old hash
              indexesByHash.delete(currentHashAtIndex);
              // connect the new hash to the old index
              hashesByIndex.set(key as TIndex, newHash);
              indexesByHash.set(newHash, key as TIndex);
              // add the new value to the dex.
              target.add(newValue);
            }
          } else if (target.canContain(newValue)) {
            hashesByIndex.set(key as TIndex, newHash);
            indexesByHash.set(newHash, key as TIndex);
            target.add(newValue);
            onIndexAdded?.(key as TIndex, target);
          } else {
            throw new InvalidEntryError(newValue);
          }

          return true;
        }

        return false;
      }
    }) as any
  );

InDex.isConfig = function isInDexConfig(value: any): value is Config<any, any, any> {
  if (Dex.isConfig(value)) {
    return true;
  }

  if (!value) {
    return false;
  }

  if (value.hasOwnProperty("indexGenerator")
    || value.hasOwnProperty("indexGuard")) {
    return true;
  }

  return false;
};

InDex.is = function isAnInDex(value: any): value is InDex<any, any, any> {
  if (Dex.is(value)) {
    if (value.constructor === InDex) {
      return true;
    }
  }

  return false;
};

export default InDex;