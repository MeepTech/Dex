import { IFlag, ILogicFlag, FLAGS, hasFlag } from "./flags";
import { IBasicQuery, IFirstableQuery, IFullQuery, QueryConstructor, QueryResults } from "./queries";
import { IReadOnlyDex } from "../readonly";
import { IEntry } from "../subsets/entries";

/** @internal */
export function FirstableQueryConstructor<
  TEntry extends IEntry,
  TDexEntry extends IEntry,
  TResults extends QueryResults<TEntry, TDexEntry>,
  TValidFlags extends IFlag
>(
  base: IBasicQuery<TEntry, TValidFlags, TDexEntry, TResults>,
  first: IFullQuery<TEntry, typeof FLAGS.FIRST | ILogicFlag, TDexEntry, TEntry>
): IFirstableQuery<TEntry, TValidFlags, TDexEntry, TResults> {
  (base as any as IFirstableQuery<TEntry, TValidFlags, TDexEntry, TResults>)
    .first = first;

  return base as IFirstableQuery<TEntry, TValidFlags, TDexEntry, TResults>;
}

/** @internal */
export function FirstQueryConstructor<TEntry extends IEntry>(dex: IReadOnlyDex<TEntry>): IFullQuery<TEntry, typeof FLAGS.FIRST | ILogicFlag, TEntry, TEntry> {
  return QueryConstructor<
    TEntry,
    TEntry,
    typeof FLAGS.FIRST | ILogicFlag,
    TEntry | undefined,
    TEntry,
    TEntry | undefined,
    IFlag
  >(
    (a, b) => dex.value(
      a,
      b
        ? (hasFlag(b, FLAGS.VALUES) || hasFlag(b, FLAGS.CHAIN))
          ? FLAGS.add(FLAGS.drop(b, [FLAGS.VALUES, FLAGS.CHAIN]), FLAGS.FIRST)
          : FLAGS.add(b, FLAGS.FIRST)
        : [FLAGS.FIRST] as any
    ),
    dex
  );
}