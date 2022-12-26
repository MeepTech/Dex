import Dex from "../dex";
import {
  IBasicQuery,
  IQueryChain,
  QueryConstructor,
  QueryResultCalculator,
} from "./queries";
import {
  FLAGS,
  LogicFlag
  } from "./flags";
import { IReadOnlyDex } from "../readonly";
import { Entry } from "../subsets/entries";
import { FirstQueryConstructor } from "./first";

/** @internal */
export function QueryChainConstructor<TEntry extends Entry>(
  dex: IReadOnlyDex<TEntry>,
  base: IBasicQuery<TEntry, typeof FLAGS.CHAIN | LogicFlag, TEntry, Dex<TEntry>>
): IQueryChain<TEntry> {
  const chain = QueryConstructor<
    TEntry,
    TEntry,
    typeof FLAGS.CHAIN | LogicFlag,
    Dex<TEntry>,
    Dex<TEntry>,
    Dex<TEntry>,
    typeof FLAGS.CHAIN | LogicFlag
  > (
    base,
    dex
  ) as IQueryChain<TEntry>;

  Object.defineProperty(chain, "not", {
    get(): IQueryChain<TEntry> {
      return NotQueryChainConstructor<TEntry>(dex, base);
    }
  });

  Object.defineProperty(chain, "and", {
    get(): IQueryChain<TEntry> {
      return AndQueryChainConstructor<TEntry>(dex, base);
    }
  });

  Object.defineProperty(chain, "or", {
    get(): IQueryChain<TEntry> {
      return OrQueryChainConstructor<TEntry>(dex, base);
    }
  });

  Object.defineProperty(chain, "first", {
    value: FirstQueryConstructor<TEntry>(dex)
  });

  return chain;
}

/** @internal */
export function NotQueryChainConstructor<TEntry extends Entry>(
  dex: IReadOnlyDex<TEntry>,
  base: IBasicQuery<TEntry, typeof FLAGS.CHAIN | LogicFlag, TEntry, Dex<TEntry>>
): IQueryChain<TEntry> {
  return QueryChainConstructor<TEntry>(dex, (a, b) => {
    if (!b?.includes(FLAGS.OR)) {
      return base(a, b?.concat([FLAGS.OR]) ?? [FLAGS.OR]);
    } else {
      return base(a, b?.filter(f => f !== FLAGS.OR).concat([FLAGS.OR]));
    }
  });
}

/** @internal */
export function AndQueryChainConstructor<TEntry extends Entry>(
  dex: IReadOnlyDex<TEntry>,
  base: IBasicQuery<TEntry, typeof FLAGS.CHAIN | LogicFlag, TEntry, Dex<TEntry>>
): IQueryChain<TEntry> {
  return QueryChainConstructor<TEntry>(dex, (a, b) => {
    if (!b?.includes(FLAGS.OR)) {
      return base(a, b?.concat([FLAGS.OR]) ?? [FLAGS.OR]);
    } else {
      return base(a, b?.filter(f => f !== FLAGS.OR).concat([FLAGS.OR]));
    }
  });
}

/** @internal */
export function OrQueryChainConstructor<TEntry extends Entry>(
  dex: IReadOnlyDex<TEntry>,
  base: IBasicQuery<TEntry, typeof FLAGS.CHAIN | LogicFlag, TEntry, Dex<TEntry>>
): IQueryChain<TEntry> {
  return QueryChainConstructor<TEntry>(dex, (a, b) => {
    if (!b?.includes(FLAGS.NOT)) {
      return base(a, b?.concat([FLAGS.NOT]) ?? [FLAGS.NOT]);
    } else {
      return base(a, b?.filter(f => f !== FLAGS.NOT));
    }
  });
}