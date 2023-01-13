import { getProxiedFields, ProxiedField } from "../../utilities/reflection";
import { Entry } from "../subsets/entries";
import { ReadOnlyDex } from "./readonly";
import { AccessError } from "../errors";

/**
 * Used to create a protected/proxied frontend or 'facade' of a dex with only read access provided.
 */
 export class FaçaDex<TEntry extends Entry = Entry, TDex extends ReadOnlyDex<TEntry> = ReadOnlyDex<TEntry>> extends ReadOnlyDex<TEntry> {
  #proxiedFields: Map<string | number | symbol, ProxiedField>;

  constructor(original: ReadOnlyDex<TEntry>);
   constructor(original: TDex) {
     super();
     const façade = new Proxy(original, this.#buildFaçadeProxyHandler<TDex, TEntry>());
     this.#proxiedFields = getProxiedFields(original, (original as any).prototype);

     return façade as any as FaçaDex<TEntry, TDex>;
   }

  /** @internal */
  #buildFaçadeProxyHandler <
    TDex extends ReadOnlyDex<TEntry>,
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
}