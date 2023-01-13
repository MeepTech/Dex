import { InternalNDexSymbols } from "../objects/dexes/controled";
import { DexMethodKeysToHideInProxy, InternalDexSymbols } from "../objects/dexes/dex";
import { InternalRDexSymbols, ReadOnlyDex } from "../objects/dexes/readonly";
import Entry from "../objects/subsets/entries";
import Check from "./validators";

const FIELDS = Symbol("fields");

export interface ProxiedField {
  key: string | number | symbol,
  value?: any,
  getter?: (thisArg: any) => any,
  isHidden?: boolean
}

export function hideInProxy(target: any, name: string): void {
  (target[FIELDS] || (target[FIELDS] = new Map<string, ProxiedField>())).set(name, { key: name, isHidden: true } as ProxiedField);
}

export function replaceInProxy(proxy: { $key: string }): Function;
export function replaceInProxy(proxy: { $get: (thisArg: any) => any }): Function;
export function replaceInProxy(proxy: any | { $key?: string, $_get?: ($get: any) => any }): Function {
  function decorator_ReplaceInProxy(target: any, name: string) {
    let proxyProp;
    if (Check.isString(proxy.$key)) {
      proxyProp = target[proxy.$key]
      if (Check.isFunction(proxyProp)) {
        proxyProp = proxyProp.bind(target);
      }
    } else if (Check.isFunction(proxy.$get)) {
      proxyProp = proxy.$get.bind(target);
    } else {
      proxyProp = proxy;
    }

    (target[FIELDS] || (target[FIELDS] = new Map<string, ProxiedField>())).set(name, { key: name, value: proxyProp } as ProxiedField);
    return name as any;
  }

  return decorator_ReplaceInProxy;
}

export function getProxiedFields<TEntry extends Entry>(baseDex: ReadOnlyDex<TEntry>, type: any): Map<symbol | string | number, ProxiedField> {
  const dexFields = Object.getOwnPropertyNames(InternalDexSymbols).map(s =>
    [
      InternalDexSymbols[(s as keyof typeof InternalDexSymbols)],
      { key: s, isHidden: true }
    ] as [symbol, ProxiedField]
  );
  const rDexFields = Object.getOwnPropertyNames(InternalRDexSymbols).map(s =>
    [
      InternalRDexSymbols[(s as keyof typeof InternalRDexSymbols)],
      { key: s, isHidden: true }
    ] as [symbol, ProxiedField]
  );
  const nDexFields = Object.getOwnPropertyNames(InternalNDexSymbols).map(s =>
    [
      InternalNDexSymbols[(s as keyof typeof InternalNDexSymbols)],
      { key: s, isHidden: true }
    ] as [symbol, ProxiedField]
  );

  const result = new Map<symbol | string | number, ProxiedField>(
    (dexFields as [symbol | string, ProxiedField][])
      .concat(rDexFields)
      .concat(nDexFields)
      .concat(DexMethodKeysToHideInProxy
        .map(name => [name, { key: name, isHidden: true }])));

  result.set("copy", {
    key: "copy",
    getter(): any {
      return (baseDex)[InternalRDexSymbols._getSimpleCopier];
    }
  });

  return result;
  // TODO: when TS implements stage 3:  return type.prototype[FIELDS];
}