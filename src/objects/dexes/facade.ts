import { Entry } from "../subsets/entries";
import { IReadableDex, InternalRDexSymbols, ReadOnlyDex } from "./read";
import { AccessError } from "../errors";
import { EntryOf, InternalDexSymbols } from "./dex";
import { InternalNDexSymbols } from "./noisy";
import Check from "../../utilities/validators";

/**
 * The default warded dex property keys.
 * 
 * // TODO: when TS implements stage 3: replace with use of decorators
 */
export enum WardedKey {
  Set = "set",
  Put = "put",
  Add = "add",
  Update = "update",
  Take = "take",
  Remove = "remove",
  Tag = "tag",
  Untag = "untag",
  Drop = "drop",
  Reset = "reset",
  Clean = "clean",
  Clear = "clear",
  CopyFrom = "copy.from"
};

export type WardedKeys = `${WardedKey}`;

/**
 * The default warded dex property keys.
 */
export const WARDED_KEYS_ARRAY = Object.freeze(
  Object.values(WardedKey)
)

/**
 * The default warded dex property keys.
 */
export const WARDED_KEYS_SET = Object.freeze(
  new Set(WARDED_KEYS_ARRAY)
)

/**
 * A way to proxy a field in a facade.
 */
export interface Ward {
  key: string | number | symbol,
  value?: any,
  getter?: (thisArg: any) => any,
  isHidden?: boolean
}

/**
 * Settings for a FacaDex.
 */
export type FaçadeConfig<TPassthroughKeys extends WardedKey[] = WardedKey[]> = {

  /**
   * Keys of default warded fields that we don't want warded/proxied.
   */
  passthroughKeys?: TPassthroughKeys;

  /**
   * Extra fields to proxy/ward
   */
  extraWards?: Ward[];
};

/** @internal */
const _defaultHiddenKeysForTypes: Map<any, (string | symbol)[]> = new Map();

/**
 * A way to access a Dex while warding and hiding some of it's functionality.
 */
export type FaçaDex<
  TDex extends IReadableDex<any>,
  TPassthroughKeys extends WardedKey[] = []
> = Omit<TDex, Exclude<WardedKeys, `${TPassthroughKeys[number]}`>>
  & ReadOnlyDex<EntryOf<TDex>>
  & {
    new <
      TcDex extends TDex
    >(
      original: TcDex
    ): FaçaDex<TcDex, []>
    new <
      TcDex extends TDex,
      TcPassthroughKeys extends TPassthroughKeys
    >(
      original: TcDex,
      options: FaçadeConfig<TcPassthroughKeys>
    ): FaçaDex<TcDex, TcPassthroughKeys>
    new <
      TcDex extends TDex,
      TcPassthroughKeys extends TPassthroughKeys
    >(
      original: TcDex,
      ...passthoughKeys: TcPassthroughKeys | [TcPassthroughKeys]
    ): FaçaDex<TcDex, TcPassthroughKeys>
  }

function FaçaDexConstructor<
  TDex extends IReadableDex<any>,
  TPassthroughKeys extends WardedKey[]
>(
  original: TDex,
  ...args: [FaçadeConfig<TPassthroughKeys>] | TPassthroughKeys | [TPassthroughKeys]
): FaçaDex<TDex, TPassthroughKeys> {
  const options = Array.isArray(args[0])
    ? { passthroughKeys: args[0] } as FaçadeConfig<TPassthroughKeys>
    : Check.isObject(args[0])
      ? args[0] as FaçadeConfig<TPassthroughKeys>
      : { passthroughKeys: args } as FaçadeConfig<TPassthroughKeys>;
  const façade = new Proxy(original, _buildFaçadeProxyHandler<TDex>());
  const proxiedFields = _getProxiedFields(original, options);

  return façade as any as FaçaDex<TDex, TPassthroughKeys>;

  /** @internal */
  function _buildFaçadeProxyHandler<
    TDex extends IReadableDex<any>
  >(): ProxyHandler<TDex> {
    return {
      get(base: TDex, propKey: string, proxy: FaçaDex<TDex, TPassthroughKeys>) {
        const proxyProp = proxiedFields.get(propKey);

        if (proxyProp) {
          if (proxyProp.isHidden) {
            return undefined;
          }
          if ((proxyProp as object).hasOwnProperty("value")) {
            return proxyProp.value;
          }
          if ((proxyProp as object).hasOwnProperty("getter")) {
            return proxyProp.getter!(base);
          }
        }

        return base[propKey as keyof TDex];
      },
      set(): boolean {
        throw new AccessError("Cannot call 'Set Property' on a Façade");
      },
      deleteProperty(): boolean {
        throw new AccessError("Cannot call 'Delete Property' on a Façade");
      },
      ownKeys(base: TDex): ArrayLike<string | symbol> {
        return Object.getOwnPropertyNames(base).filter(
          p => !proxiedFields.has(p)
        );
      },
      defineProperty(): boolean {
        throw new AccessError("Cannot call 'Define Property' on a Façade");
      },
      setPrototypeOf(): boolean {
        throw new AccessError("Cannot call 'Set Prototype' on a Façade");
      }
    };
  }

  /** @internal */
  function _getProxiedFields<TEntry extends Entry>(baseDex: IReadableDex<TEntry>, options?: FaçadeConfig): Map<symbol | string | number, Ward> {
    const dexFields = Object.getOwnPropertyNames(InternalDexSymbols).map(s =>
      [
        InternalDexSymbols[(s as keyof typeof InternalDexSymbols)],
        { key: s, isHidden: true }
      ] as [symbol, Ward]
    );
    const rDexFields = Object.getOwnPropertyNames(InternalRDexSymbols).map(s =>
      [
        InternalRDexSymbols[(s as keyof typeof InternalRDexSymbols)],
        { key: s, isHidden: true }
      ] as [symbol, Ward]
    );
    const nDexFields = Object.getOwnPropertyNames(InternalNDexSymbols).map(s =>
      [
        InternalNDexSymbols[(s as keyof typeof InternalNDexSymbols)],
        { key: s, isHidden: true }
      ] as [symbol, Ward]
    );

    const result = new Map<symbol | string | number, Ward>(
      (dexFields as [symbol | string, Ward][])
        .concat(rDexFields)
        .concat(nDexFields)
        .concat(options?.extraWards?.map(field => [field.key as string | symbol, field]) ?? [])
        .concat([...WARDED_KEYS_SET]
          .map(name => [name, { key: name, isHidden: true }])));

    result.set("copy", {
      key: "copy",
      getter(): any {
        return (baseDex as ReadOnlyDex<TEntry>)[InternalRDexSymbols._getSimpleCopier];
      }
    });

    if (options?.passthroughKeys && options.passthroughKeys.length) {
      for (const key of options.passthroughKeys) {
        if (key === WardedKey.CopyFrom) {
          result.delete("copy");
        } else {
          result.delete(key);
        }
      }
    }

    return result;
  }
}

export const FaçaDex
  = FaçaDexConstructor as any as {
    new <
      TDex extends IReadableDex<any>
    >(
      original: TDex,
    ): FaçaDex<TDex, []>
    new <
      TcDex extends IReadableDex<any>,
      TPassthroughKeys extends WardedKey[]
    >(
      original: TcDex,
      options: FaçadeConfig<TPassthroughKeys>
    ): FaçaDex<TcDex, TPassthroughKeys>
    new <
      TcDex extends IReadableDex<any>,
      TcPassthroughKeys extends WardedKey[]
    >(
      original: TcDex,
      ...passthoughKeys: TcPassthroughKeys | [TcPassthroughKeys]
    ): FaçaDex<TcDex, TcPassthroughKeys>
  };

/**
 * A decorator used to indicate members of a dex to hide in a facade by default.
 */
export function hideInFacade<TKey extends string[]>(...keysToHideInFacadesByDefault: TKey | [TKey]): ClassDecorator {
  return function setHiddenKeysForType<T>(thisClass: T): T {
    keysToHideInFacadesByDefault = Check.isNonStringIterable(keysToHideInFacadesByDefault[0])
      ? keysToHideInFacadesByDefault[0] as TKey
      : keysToHideInFacadesByDefault as TKey;

    _defaultHiddenKeysForTypes.set(thisClass, keysToHideInFacadesByDefault);
    return thisClass;
  }
}