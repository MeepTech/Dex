import Dex from "../dex";
import {
  IBasicQuery,
  IQueryChain,
  QueryConstructor,
} from "./queries";
import {
  FLAGS,
  ILogicFlag
  } from "./flags";
import { IReadOnlyDex } from "../readonly";
import { IEntry } from "../subsets/entries";
import { FirstQueryConstructor } from "./first";

/** @internal */
export function QueryChainConstructor<TEntry extends IEntry>(
  dex: IReadOnlyDex<TEntry>,
  base: IBasicQuery<TEntry, typeof FLAGS.CHAIN | ILogicFlag, TEntry, Dex<TEntry>>
): IQueryChain<TEntry> {
  const chain = QueryConstructor<
    TEntry,
    TEntry,
    typeof FLAGS.CHAIN | ILogicFlag,
    Dex<TEntry>,
    Dex<TEntry>,
    Dex<TEntry>,
    typeof FLAGS.CHAIN | ILogicFlag
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
export function NotQueryChainConstructor<TEntry extends IEntry>(
  dex: IReadOnlyDex<TEntry>,
  base: IBasicQuery<TEntry, typeof FLAGS.CHAIN | ILogicFlag, TEntry, Dex<TEntry>>
): IQueryChain<TEntry> {
  return QueryChainConstructor<TEntry>(dex, (tags, flags) => {
    if (!flags) {
      return base(tags, [FLAGS.NOT]);
    }

    if (!FLAGS.has(flags, FLAGS.NOT)) {
      return base(tags, FLAGS.add(flags, FLAGS.NOT));
    } else {
      return base(tags, FLAGS.drop(flags, FLAGS.NOT));
    }
  });
}

/** @internal */
export function AndQueryChainConstructor<TEntry extends IEntry>(
  dex: IReadOnlyDex<TEntry>,
  base: IBasicQuery<TEntry, typeof FLAGS.CHAIN | ILogicFlag, TEntry, Dex<TEntry>>
): IQueryChain<TEntry> {
  return QueryChainConstructor<TEntry>(dex, (tags,flags) => {
    if (!flags) {
      return base(tags, [FLAGS.AND]);
    }

    if (!FLAGS.has(flags, FLAGS.OR)) {
      return base(tags, FLAGS.add(flags, FLAGS.AND));
    } else {
      return base(tags, FLAGS.add(FLAGS.drop(flags, FLAGS.OR), FLAGS.AND));
    }
  });
}

/** @internal */
export function OrQueryChainConstructor<TEntry extends IEntry>(
  dex: IReadOnlyDex<TEntry>,
  base: IBasicQuery<TEntry, typeof FLAGS.CHAIN | ILogicFlag, TEntry, Dex<TEntry>>
): IQueryChain<TEntry> {
  return QueryChainConstructor<TEntry>(dex, (tags,flags) => {
    if (!flags) {
      return base(tags, [FLAGS.OR]);
    }

    if (!FLAGS.has(flags, FLAGS.OR)) {
      return base(tags, FLAGS.add(flags, FLAGS.OR));
    } else {
      return base(tags, FLAGS.add(FLAGS.drop(flags, FLAGS.AND), FLAGS.OR));
    }
  });
}