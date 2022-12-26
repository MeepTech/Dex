import { Flag, LogicFlag, FLAGS } from "./flags";
import { IBasicQuery, IFirstableQuery, IFullQuery, QueryConstructor, QueryResults } from "./queries";
import { IReadOnlyDex } from "../readonly";
import { Entry } from "../subsets/entries";

/** @internal */
export function FirstableQueryConstructor<
  TEntry extends Entry,
  TDexEntry extends Entry,
  TResults extends QueryResults<TEntry, TDexEntry>,
  TValidFlags extends Flag
>(
  base: IBasicQuery<TEntry, TValidFlags, TDexEntry, TResults>,
  first: IFullQuery<TEntry, typeof FLAGS.FIRST | LogicFlag, TDexEntry, TEntry>
): IFirstableQuery<TEntry, TValidFlags, TDexEntry, TResults> {
  (base as any as IFirstableQuery<TEntry, TValidFlags, TDexEntry, TResults>)
    .first = first;

  return base as IFirstableQuery<TEntry, TValidFlags, TDexEntry, TResults>;
}

/** @internal */
export function FirstQueryConstructor<TEntry extends Entry>(dex: IReadOnlyDex<TEntry>): IFullQuery<TEntry, typeof FLAGS.FIRST | LogicFlag, TEntry, TEntry> {
  return QueryConstructor<
    TEntry,
    TEntry,
    typeof FLAGS.FIRST | LogicFlag,
    TEntry | undefined,
    TEntry,
    TEntry | undefined,
    Flag
  >(
    (a, b) => dex.value(
      a,
      (b?.includes(FLAGS.VALUES) || b?.includes(FLAGS.CHAIN))
        ? b?.filter(f => f !== FLAGS.VALUES && f !== FLAGS.CHAIN).concat([FLAGS.FIRST])
        : (b
          ? b.concat([FLAGS.FIRST])
          : [FLAGS.FIRST]
      ) as any)
    , dex
  );
}