import { Flag, LogicFlag, FLAGS } from "./flags";
import { IBasicQuery, IFirstableQuery, IQuery, QueryConstructor, QueryResults } from "./queries";
import { IReadOnlyDex } from "../readonly";
import { Entry } from "../subsets/entries";

/** @internal */
export function FirstableQueryConstructor<
  TEntry extends Entry,
  TDexEntry extends Entry,
  TResults extends QueryResults<TEntry, TDexEntry>,
  TValidFlags extends Flag
>(
  base: IBasicQuery<TEntry, TDexEntry, TResults, TValidFlags>,
  first: IQuery<TEntry, TDexEntry, typeof FLAGS.FIRST | LogicFlag, TEntry>
): IFirstableQuery<TEntry, TDexEntry, TResults, TValidFlags> {
  (base as any as IFirstableQuery<TEntry, TDexEntry, TResults, TValidFlags>)
    .first = first;

  return base as IFirstableQuery<TEntry, TDexEntry, TResults, TValidFlags>;
}

/** @internal */
export function FirstQueryConstructor<TEntry extends Entry>(dex: IReadOnlyDex<TEntry>): IQuery<TEntry, TEntry, typeof FLAGS.FIRST | LogicFlag, TEntry> {
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
  );
}