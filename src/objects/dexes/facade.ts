import { Entry } from "../subsets/entries";
import { IReadableDex, InternalRDexSymbols, ReadableDex } from "./read";
import { AccessError } from "../errors";
import { InternalDexSymbols } from "./dex";
import { InternalNDexSymbols } from "./noisy";

/**
 * The default warded dex property keys.
 * 
 * // TODO: when TS implements stage 3: replace with use of decorators
 */
export enum WardedKeys {
  "set" = "set",
  "put" = "put",
  "add" = "add",
  "update" = "update",
  "take" = "take",
  "remove" = "remove",
  "tag" = "tag",
  "untag" = "untag",
  "drop" = "drop",
  "reset" = "reset",
  "clean" = "clean",
  "clear" = "clear",
  "copy.from" = "copy.from"
}

/**
 * The default warded dex property keys.
 * 
* // TODO: when TS implements stage 3: replace with use of decorators
 */
export const WARDED_KEYS = Object.freeze(
  new Set(Object.values(WardedKeys))
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
export type FaçadeConfig = {

  /**
   * Keys of default warded fields that we don't want warded/proxied.
   */
  passthroughKeys?: WardedKeys[];

  /**
   * Extra fields to proxy/ward
   */
  extraWards: Ward[];
};

export type FaçaDex<
  TDex extends ReadableDex<any>
> = TDex & {
  new <
    TcDex extends TDex
  >(
    original: TcDex,
    options?: FaçadeConfig
  ): FaçaDex<TcDex>
}

function FaçaDexConstructor<
  TDex extends ReadableDex<any>
>(
  original: TDex,
  options?: FaçadeConfig
): FaçaDex<TDex> {
  const façade = new Proxy(original, _buildFaçadeProxyHandler<TDex>());
  const proxiedFields = _getProxiedFields(original, options);

  return façade as FaçaDex<TDex>;

  /** @internal */
  function _buildFaçadeProxyHandler<
    TDex extends ReadableDex<any>
  >(): ProxyHandler<TDex> {
    return {
      get(base: TDex, propKey: string, proxy: FaçaDex<TDex>) {
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
        .concat(options?.extraWards.map(field => [field.key as string | symbol, field]) ?? [])
        .concat([...WARDED_KEYS]
          .map(name => [name, { key: name, isHidden: true }])));

    result.set("copy", {
      key: "copy",
      getter(): any {
        return (baseDex as ReadableDex<TEntry>)[InternalRDexSymbols._getSimpleCopier];
      }
    });

    if (options?.passthroughKeys && options.passthroughKeys.length) {
      for (const key in options.passthroughKeys) {
        if (key == WardedKeys["copy.from"]) {
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
  = FaçaDexConstructor as any as (
    new <
      TDex extends ReadableDex<any>
    >(
      original: TDex,
      options?: FaçadeConfig
    ) => FaçaDex<TDex>
  )

/**
 * Used to create a protected/proxied frontend or 'facade' of a dex with only read access provided.
 *//*
export class FaçaDex<TEntry extends Entry = Entry, TDex extends ReadableDex<TEntry> = ReadableDex<TEntry>> extends ReadableDex<TEntry> {
#proxiedFields: Map<string | number | symbol, Ward>;

constructor(original: ReadableDex<TEntry>, options?: FaçadeConfig);
constructor(original: TDex, options?: FaçadeConfig) {
super();
const façade = new Proxy(original, this.#buildFaçadeProxyHandler<TDex, TEntry>());
this.#proxiedFields = this.#getProxiedFields(original, options);

return façade as any as FaçaDex<TEntry, TDex>;
}

/** @internal *//*
#buildFaçadeProxyHandler <
 TDex extends ReadableDex<TEntry>,
 TEntry extends Entry
>(): ProxyHandler<TDex> {
 const dex = this;
 return {
   get(base: TDex, propKey: string, proxy: FaçaDex<TEntry>) {
     const proxyProp = dex.#proxiedFields.get(propKey);
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
       p => !dex.#proxiedFields.has(p)
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

/** @internal *//*
#getProxiedFields<TEntry extends Entry>(baseDex: ReadableDex<TEntry>, options?: FaçadeConfig): Map<symbol | string | number, Ward> {
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
      .concat(options?.extraWards.map(field => [field.key as string | symbol, field]) ?? [])
      .concat([...WARDED_KEYS]
        .map(name => [name, { key: name, isHidden: true }])));

  result.set("copy", {
    key: "copy",
    getter(): any {
      return (baseDex)[InternalRDexSymbols._getSimpleCopier];
    }
  });

  if (options?.passthroughKeys && options.passthroughKeys.length) {
    for (const key in options.passthroughKeys) {
      if (key == WardedKeys["copy.from"]) {
        result.delete("copy");
      } else {
        result.delete(key);
      }
    }
  }

  return result;
}
}*/
