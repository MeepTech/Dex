import Dex, { Config as BaseConfig, CtorProps, IDex, InternalDexSymbols } from './dex'
import { IReadableDex, ReadableDex } from './read'
import Entry from '../subsets/entries'
import HashKey from '../subsets/hashes'
import { AccessError, DexError, InvalidEntryError } from '../errors'

export type Config<TEntry extends Entry, TKey extends HashKey, TBase extends BaseConfig<TEntry> = BaseConfig<TEntry>> = TBase & {
  indexGenerator?: (entry: TEntry) => TKey,
  indexGuard?: (key: TKey) => boolean
}

/*export type InDexConstructors<
  TcEntry extends Entry,
  TcDex extends IReadableDex<TcEntry>,
  TKey extends HashKey = HashKey,
  TcBaseConfig extends BaseConfig<TcEntry> = BaseConfig<TcEntry>,
  TcConfig extends Config<TcEntry, TKey, TcBaseConfig> = Config<TcEntry, TKey, TcBaseConfig>
> = {
  new <
    TDex extends TcDex,
  >(original: TDex): InDex<TcEntry, TDex, TKey, TcBaseConfig, TcConfig>;
  new <
    TEntry extends TcEntry,
    TDex extends TcDex,
    TConfig extends TcConfig,
  >(original: TDex, config: TConfig): InDex<TEntry, TDex, TKey, TcBaseConfig, TConfig>;
  new(...args: CtorProps<TcEntry, TcConfig>): InDex<TcEntry, TcDex, TKey, TcBaseConfig, TcConfig>;
}*/

type EntryOf<Type> = Type extends IReadableDex<infer X> ? X : never

export type InDex<
  TdDex extends IReadableDex<TdEntry>,
  TdEntry extends Entry,
  TdKey extends HashKey = HashKey,
> = TdDex
  & { [index in TdKey]: TdEntry };


const InDex: {
  new <
    TDex extends IReadableDex<TEntry>,
    TEntry extends Entry = EntryOf<TDex>,
    TKey extends HashKey = HashKey,
  >(original: TDex): InDex<TDex, TEntry, TKey>;
  new <
    TDex extends IReadableDex<TEntry>,
    TConfig extends Config<TEntry, TKey, TBaseConfig>,
    TBaseConfig extends BaseConfig<TEntry>,
    TEntry extends Entry = EntryOf<TDex>,
    TKey extends HashKey = HashKey,
  >(original: TDex, config: TConfig): InDex<TDex, TEntry, TKey>;
  new <
    TDex extends IReadableDex<TEntry>,
    TEntry extends Entry,
    TConfig extends Config<TEntry, TKey, TBaseConfig>,
    TBaseConfig extends BaseConfig<TEntry>,
    TKey extends HashKey,
  >(...args: [Exclude<CtorProps<TEntry, TConfig>[0], ReadableDex<TEntry>>, CtorProps<TEntry, TConfig>[1]]): InDex<TDex, TEntry, TKey>;
  isConfig(value: any): value is Config<any, any, any>;
  is(value: any): value is InDex<any, any, any>;
} = (
    (function InDexConstructor<
      TDex extends IReadableDex<TEntry>,
      TEntry extends Entry,
      TConfig extends Config<TEntry, TKey, TBaseConfig>,
      TBaseConfig extends BaseConfig<TEntry>,
      TKey extends HashKey,
    >(
      this: InDex<TDex, TEntry, TKey>,
      ...args: [original: TDex] | [original: TDex, config: TConfig] | CtorProps<TEntry, TConfig>
    ): InDex<TDex, TEntry, TKey> {
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
      const indexesByHash = new Map<HashKey, TKey>();
      const hashesByIndex = new Map<TKey, HashKey>();

      const proxy = new Proxy(inDex, _buildIndexedProxyHandler()) as InDex<TDex, TEntry, TKey>;

      if (!readonly && indexGenerator) {
        for (const entry of proxy.entries()) {
          setByIndex(
            inDex as any as IDex<TEntry>,
            indexGenerator(entry),
            entry,
            indexGuard,
            indexesByHash,
            hashesByIndex
          )
        }
      }

      return proxy;

      // helpers
      /** @internal */
      function _buildIndexedProxyHandler(): ProxyHandler<TDex> {
        return {
          get(target: TDex, key: string | symbol | number) {
            if (!readonly && indexGenerator && key === InternalDexSymbols._addNewEntry) {
              return (...args: any[]) => {
                const hash = args[1];
                (target as any)[key](...args);
                const index = indexGenerator(args[0]);
                if (index !== undefined) {
                  return setByIndex<TEntry, TKey>(
                    target as any as IDex<TEntry>,
                    key as TKey,
                    args[0] as TEntry,
                    indexGuard,
                    indexesByHash,
                    hashesByIndex
                  );
                }

                return hash;
              };
            }

            if (indexGuard?.(key as TKey) ?? true) {
              const hash = hashesByIndex.get(key as TKey);
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

              return setByIndex<TEntry, TKey>(
                target as any as IDex<TEntry>,
                key as TKey,
                newValue as TEntry,
                indexGuard,
                indexesByHash,
                hashesByIndex
              );
            }

            throw new AccessError("Cannot set values via Index on a Read-only Index.")
          }
        }
      }

      /** @internal */
      function setByIndex<
        TEntry extends Entry = Entry,
        TKey extends HashKey = HashKey,
      >(
        target: IDex<TEntry>,
        key: TKey,
        newValue: TEntry,
        indexGuard: ((key: TKey) => boolean) | undefined,
        indexesByHash: Map<HashKey, TKey>,
        hashesByIndex: Map<TKey, HashKey>
      ) {
        if (indexGuard?.(key as TKey) ?? true) {
          const newHash = target.hash(newValue)!;
          if (hashesByIndex.has(key as TKey)) {
            const currentHashAtIndex = hashesByIndex.get(key as TKey)!;

            if (newHash !== currentHashAtIndex) {
              hashesByIndex.set(key as TKey, newHash);
              indexesByHash.set(newHash, key as TKey);
              indexesByHash.delete(currentHashAtIndex);
              target.add(newValue);
            }
          } else if (target.canContain(newValue)) {
            hashesByIndex.set(key as TKey, newHash);
            indexesByHash.set(newHash, key as TKey);
            target.add(newValue);
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