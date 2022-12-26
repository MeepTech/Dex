import { isArray } from "../../utilities/validators";
import Dex from "../dex";
import { Flag, ResultFlag, FLAGS, LogicFlag } from "./flags";
import { Entry } from "../subsets/entries";
import { Tag } from "../subsets/tags";

/*
export interface IQuery<
  TEntry extends Entry = Entry,
  TDexEntry extends Entry | TEntry = TEntry,
  TValidFlags extends Flag = Flag,
  TDefaultResult extends QueryResults<TEntry, TDexEntry> = IQueryResult<TEntry, TValidFlags, TDexEntry>
> {
  // 0 flags
  //  - one tag
  (tag: Tag): TDefaultResult;

  //  - spread of tags
  (...tags: Tag[]): TDefaultResult;

  //  - tag array
  (tags: Tag[]): TDefaultResult;

  // # Flags/Options First

  // 1 flag
  //  - one tag
  (resultFlag: typeof FLAGS.CHAIN, tag: Tag): Dex<TDexEntry>;
  (resultFlag: typeof FLAGS.FIRST, tag: Tag): TEntry | undefined;
  (resultFlag: typeof FLAGS.VALUES, tag: Tag): TEntry[];
  (logicFlag: LogicFlag, tag: Tag): TDefaultResult;
  (resultFlag: [typeof FLAGS.CHAIN], tag: Tag): Dex<TDexEntry>;
  (resultFlag: [typeof FLAGS.FIRST], tag: Tag): TEntry | undefined;
  (resultFlag: [typeof FLAGS.VALUES], tag: Tag): TEntry[];
  (logicFlag: [LogicFlag], tag: Tag): TDefaultResult;

  //  - spread of tags
  (resultFlag: typeof FLAGS.CHAIN, ...tags: Tag[]): Dex<TDexEntry>;
  (resultFlag: typeof FLAGS.FIRST, ...tags: Tag[]): TEntry | undefined;
  (resultFlag: typeof FLAGS.VALUES, ...tags: Tag[]): TEntry[];
  (logicFlag: LogicFlag, ...tags: Tag[]): TDefaultResult;
  (resultFlag: [typeof FLAGS.CHAIN], ...tags: Tag[]): Dex<TDexEntry>;
  (resultFlag: [typeof FLAGS.FIRST], ...tags: Tag[]): TEntry | undefined;
  (resultFlag: [typeof FLAGS.VALUES], ...tags: Tag[]): TEntry[];
  (logicFlag: [LogicFlag], ...tags: Tag[]): TDefaultResult;

  //  - tag array
  (resultFlag: typeof FLAGS.CHAIN, tags: Tag[]): Dex<TDexEntry>;
  (resultFlag: typeof FLAGS.FIRST, tags: Tag[]): TEntry | undefined;
  (resultFlag: typeof FLAGS.VALUES, tags: Tag[]): TEntry[];
  (logicFlag: LogicFlag, tags: Tag[]): TDefaultResult;
  (resultFlag: [typeof FLAGS.CHAIN], tags: Tag[]): Dex<TDexEntry>;
  (resultFlag: [typeof FLAGS.FIRST], tags: Tag[]): TEntry | undefined;
  (resultFlag: [typeof FLAGS.VALUES], tags: Tag[]): TEntry[];
  (logicFlag: [LogicFlag], tags: Tag[]): TDefaultResult;

  // 2 flags
  //  - one tag
  (resultFlag: typeof FLAGS.CHAIN, logicFlag: LogicFlag, tag: Tag): Dex<TDexEntry>;
  (resultFlag: typeof FLAGS.FIRST, logicFlag: LogicFlag, tag: Tag): TEntry | undefined;
  (resultFlag: typeof FLAGS.VALUES, logicFlag: LogicFlag, tag: Tag): TEntry[];
  (logicFlag: LogicFlag, resultFlag: typeof FLAGS.CHAIN, tag: Tag): Dex<TDexEntry>;
  (logicFlag: LogicFlag, resultFlag: typeof FLAGS.FIRST, tag: Tag): TEntry | undefined;
  (logicFlag: LogicFlag, resultFlag: typeof FLAGS.VALUES, tag: Tag): TEntry[];
  (logicFlag1: LogicFlag, logicFlag2: LogicFlag, tag: Tag): TDefaultResult;
  (options: [resultFlag: typeof FLAGS.FIRST, logicFlag: LogicFlag], tag: Tag): TEntry | undefined;
  (options: [resultFlag: typeof FLAGS.VALUES, logicFlag: LogicFlag], tag: Tag): TEntry[];
  (options: [logicFlag: LogicFlag, resultFlag: typeof FLAGS.CHAIN], tag: Tag): Dex<TDexEntry>;
  (options: [logicFlag: LogicFlag, resultFlag: typeof FLAGS.FIRST], tag: Tag): TEntry | undefined;
  (options: [logicFlag: LogicFlag, resultFlag: typeof FLAGS.VALUES], tag: Tag): TEntry[];
  (options: [logicFlag1: LogicFlag, logicFlag2: LogicFlag], tag: Tag): TDefaultResult;

  //  - spread of tags
  (resultFlag: typeof FLAGS.CHAIN, logicFlag: LogicFlag, ...tags: Tag[]): Dex<TDexEntry>;
  (resultFlag: typeof FLAGS.FIRST, logicFlag: LogicFlag, ...tags: Tag[]): TEntry | undefined;
  (resultFlag: typeof FLAGS.VALUES, logicFlag: LogicFlag, ...tags: Tag[]): TEntry[];
  (logicFlag: LogicFlag, resultFlag: typeof FLAGS.CHAIN, ...tags: Tag[]): Dex<TDexEntry>;
  (logicFlag: LogicFlag, resultFlag: typeof FLAGS.FIRST, ...tags: Tag[]): TEntry | undefined;
  (logicFlag: LogicFlag, resultFlag: typeof FLAGS.VALUES, ...tags: Tag[]): TEntry[];
  (logicFlag1: LogicFlag, logicFlag2: LogicFlag, ...tags: Tag[]): TDefaultResult;
  (options: [resultFlag: typeof FLAGS.CHAIN, logicFlag: LogicFlag], ...tags: Tag[]): Dex<TDexEntry>;
  (options: [resultFlag: typeof FLAGS.FIRST, logicFlag: LogicFlag], ...tags: Tag[]): TEntry | undefined;
  (options: [resultFlag: typeof FLAGS.VALUES, logicFlag: LogicFlag], ...tags: Tag[]): TEntry[];
  (options: [logicFlag: LogicFlag, resultFlag: typeof FLAGS.CHAIN], ...tags: Tag[]): Dex<TDexEntry>;
  (options: [logicFlag: LogicFlag, resultFlag: typeof FLAGS.FIRST], ...tags: Tag[]): TEntry | undefined;
  (options: [logicFlag: LogicFlag, resultFlag: typeof FLAGS.VALUES], ...tags: Tag[]): TEntry[];
  (options: [logicFlag1: LogicFlag, logicFlag2: LogicFlag], ...tags: Tag[]): TDefaultResult;

  //  - tag array
  (resultFlag: typeof FLAGS.CHAIN, logicFlag: LogicFlag, tags: Tag[]): Dex<TDexEntry>;
  (resultFlag: typeof FLAGS.FIRST, logicFlag: LogicFlag, tags: Tag[]): TEntry | undefined;
  (resultFlag: typeof FLAGS.VALUES, logicFlag: LogicFlag, tags: Tag[]): TEntry[];
  (logicFlag: LogicFlag, resultFlag: typeof FLAGS.CHAIN, tags: Tag[]): Dex<TDexEntry>;
  (logicFlag: LogicFlag, resultFlag: typeof FLAGS.FIRST, tags: Tag[]): TEntry | undefined;
  (logicFlag: LogicFlag, resultFlag: typeof FLAGS.VALUES, tags: Tag[]): TEntry[];
  (logicFlag1: LogicFlag, logicFlag2: LogicFlag, tags: Tag[]): TDefaultResult;
  (options: [resultFlag: typeof FLAGS.CHAIN, logicFlag: LogicFlag], tags: Tag[]): Dex<TDexEntry>;
  (options: [resultFlag: typeof FLAGS.FIRST, logicFlag: LogicFlag], tags: Tag[]): TEntry | undefined;
  (options: [resultFlag: typeof FLAGS.VALUES, logicFlag: LogicFlag], tags: Tag[]): TEntry[];
  (options: [logicFlag: LogicFlag, resultFlag: typeof FLAGS.CHAIN], tags: Tag[]): Dex<TDexEntry>;
  (options: [logicFlag: LogicFlag, resultFlag: typeof FLAGS.FIRST], tags: Tag[]): TEntry | undefined;
  (options: [logicFlag: LogicFlag, resultFlag: typeof FLAGS.VALUES], tags: Tag[]): TEntry[];
  (options: [logicFlag1: LogicFlag, logicFlag2: LogicFlag], tags: Tag[]): TDefaultResult;

  // 3 flags
  //  - one tag
  (resultFlag: typeof FLAGS.CHAIN, andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT, tag: Tag): Dex<TDexEntry>;
  (resultFlag: typeof FLAGS.CHAIN, notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR, tag: Tag): Dex<TDexEntry>;
  (resultFlag: typeof FLAGS.FIRST, andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT, tag: Tag): TEntry | undefined;
  (resultFlag: typeof FLAGS.FIRST, notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR, tag: Tag): TEntry | undefined;
  (resultFlag: typeof FLAGS.VALUES, andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT, tag: Tag): TEntry[];
  (resultFlag: typeof FLAGS.VALUES, notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR, tag: Tag): TEntry[];
  (notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.CHAIN, tag: Tag): Dex<TDexEntry>;
  (andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.CHAIN, tag: Tag): Dex<TDexEntry>;
  (notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.FIRST, tag: Tag): TEntry | undefined;
  (andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.FIRST, tag: Tag): TEntry | undefined;
  (notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.VALUES, tag: Tag): TEntry[];
  (andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.VALUES, tag: Tag): TEntry[];
  (andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.CHAIN, notFlag: typeof FLAGS.NOT, tag: Tag): Dex<TDexEntry>;
  (notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.CHAIN, andFlag: typeof FLAGS.OR, tag: Tag): Dex<TDexEntry>;
  (andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.FIRST, notFlag: typeof FLAGS.NOT, tag: Tag): TEntry | undefined;
  (notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.FIRST, andFlag: typeof FLAGS.OR, tag: Tag): TEntry | undefined;
  (andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.VALUES, notFlag: typeof FLAGS.NOT, tag: Tag): TEntry[];
  (notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.VALUES, andFlag: typeof FLAGS.OR, tag: Tag): TEntry[];
  (options: [resultFlag: typeof FLAGS.CHAIN, andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT], tag: Tag): Dex<TDexEntry>;
  (options: [resultFlag: typeof FLAGS.CHAIN, notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR], tag: Tag): Dex<TDexEntry>;
  (options: [resultFlag: typeof FLAGS.FIRST, andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT], tag: Tag): TEntry | undefined;
  (options: [resultFlag: typeof FLAGS.FIRST, notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR], tag: Tag): TEntry | undefined;
  (options: [resultFlag: typeof FLAGS.VALUES, andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT], tag: Tag): TEntry[];
  (options: [resultFlag: typeof FLAGS.VALUES, notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR], tag: Tag): TEntry[];
  (options: [notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.CHAIN], tag: Tag): Dex<TDexEntry>;
  (options: [andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.CHAIN], tag: Tag): Dex<TDexEntry>;
  (options: [notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.FIRST], tag: Tag): TEntry | undefined;
  (options: [andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.FIRST], tag: Tag): TEntry | undefined;
  (options: [notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.VALUES], tag: Tag): TEntry[];
  (options: [andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.VALUES], tag: Tag): TEntry[];
  (options: [andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.CHAIN, notFlag: typeof FLAGS.NOT], tag: Tag): Dex<TDexEntry>;
  (options: [notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.CHAIN, andFlag: typeof FLAGS.OR], tag: Tag): Dex<TDexEntry>;
  (options: [andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.FIRST, notFlag: typeof FLAGS.NOT], tag: Tag): TEntry | undefined;
  (options: [notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.FIRST, andFlag: typeof FLAGS.OR], tag: Tag): TEntry | undefined;
  (options: [andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.VALUES, notFlag: typeof FLAGS.NOT], tag: Tag): TEntry[];
  (options: [notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.VALUES, andFlag: typeof FLAGS.OR], tag: Tag): TEntry[];

  //  - spread of tags
  (resultFlag: typeof FLAGS.CHAIN, andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT, ...tags: Tag[]): Dex<TDexEntry>;
  (resultFlag: typeof FLAGS.CHAIN, notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR, ...tags: Tag[]): Dex<TDexEntry>;
  (resultFlag: typeof FLAGS.FIRST, andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT, ...tags: Tag[]): TEntry | undefined;
  (resultFlag: typeof FLAGS.FIRST, notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR, ...tags: Tag[]): TEntry | undefined;
  (resultFlag: typeof FLAGS.VALUES, andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT, ...tags: Tag[]): TEntry[];
  (resultFlag: typeof FLAGS.VALUES, notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR, ...tags: Tag[]): TEntry[];
  (notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.CHAIN, ...tags: Tag[]): Dex<TDexEntry>;
  (andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.CHAIN, ...tags: Tag[]): Dex<TDexEntry>;
  (notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.FIRST, ...tags: Tag[]): TEntry | undefined;
  (andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.FIRST, ...tags: Tag[]): TEntry | undefined;
  (notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.VALUES, ...tags: Tag[]): TEntry[];
  (andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.VALUES, ...tags: Tag[]): TEntry[];
  (andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.CHAIN, notFlag: typeof FLAGS.NOT, ...tags: Tag[]): Dex<TDexEntry>;
  (notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.CHAIN, andFlag: typeof FLAGS.OR, ...tags: Tag[]): Dex<TDexEntry>;
  (andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.FIRST, notFlag: typeof FLAGS.NOT, ...tags: Tag[]): TEntry | undefined;
  (notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.FIRST, andFlag: typeof FLAGS.OR, ...tags: Tag[]): TEntry | undefined;
  (andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.VALUES, notFlag: typeof FLAGS.NOT, ...tags: Tag[]): TEntry[];
  (notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.VALUES, andFlag: typeof FLAGS.OR, ...tags: Tag[]): TEntry[];
  (options: [resultFlag: typeof FLAGS.CHAIN, andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT], ...tags: Tag[]): Dex<TDexEntry>;
  (options: [resultFlag: typeof FLAGS.CHAIN, notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR], ...tags: Tag[]): Dex<TDexEntry>;
  (options: [resultFlag: typeof FLAGS.FIRST, andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT], ...tags: Tag[]): TEntry | undefined;
  (options: [resultFlag: typeof FLAGS.FIRST, notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR], ...tags: Tag[]): TEntry | undefined;
  (options: [resultFlag: typeof FLAGS.VALUES, andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT], ...tags: Tag[]): TEntry[];
  (options: [resultFlag: typeof FLAGS.VALUES, notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR], ...tags: Tag[]): TEntry[];
  (options: [notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.CHAIN], ...tags: Tag[]): Dex<TDexEntry>;
  (options: [andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.CHAIN], ...tags: Tag[]): Dex<TDexEntry>;
  (options: [notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.FIRST], ...tags: Tag[]): TEntry | undefined;
  (options: [andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.FIRST], ...tags: Tag[]): TEntry | undefined;
  (options: [notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.VALUES], ...tags: Tag[]): TEntry[];
  (options: [andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.VALUES], ...tags: Tag[]): TEntry[];
  (options: [andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.CHAIN, notFlag: typeof FLAGS.NOT], ...tags: Tag[]): Dex<TDexEntry>;
  (options: [notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.CHAIN, andFlag: typeof FLAGS.OR], ...tags: Tag[]): Dex<TDexEntry>;
  (options: [andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.FIRST, notFlag: typeof FLAGS.NOT], ...tags: Tag[]): TEntry | undefined;
  (options: [notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.FIRST, andFlag: typeof FLAGS.OR], ...tags: Tag[]): TEntry | undefined;
  (options: [andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.VALUES, notFlag: typeof FLAGS.NOT], ...tags: Tag[]): TEntry[];
  (options: [notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.VALUES, andFlag: typeof FLAGS.OR], ...tags: Tag[]): TEntry[];

  //  - tag array
  (resultFlag: typeof FLAGS.CHAIN, andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT, tags: Tag[]): Dex<TDexEntry>;
  (resultFlag: typeof FLAGS.CHAIN, notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR, tags: Tag[]): Dex<TDexEntry>;
  (resultFlag: typeof FLAGS.FIRST, andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT, tags: Tag[]): TEntry | undefined;
  (resultFlag: typeof FLAGS.FIRST, notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR, tags: Tag[]): TEntry | undefined;
  (resultFlag: typeof FLAGS.VALUES, andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT, tags: Tag[]): TEntry[];
  (resultFlag: typeof FLAGS.VALUES, notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR, tags: Tag[]): TEntry[];
  (notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.CHAIN, tags: Tag[]): Dex<TDexEntry>;
  (andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.CHAIN, tags: Tag[]): Dex<TDexEntry>;
  (notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.FIRST, tags: Tag[]): TEntry | undefined;
  (andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.FIRST, tags: Tag[]): TEntry | undefined;
  (notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.VALUES, tags: Tag[]): TEntry[];
  (andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.VALUES, tags: Tag[]): TEntry[];
  (andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.CHAIN, notFlag: typeof FLAGS.NOT, tags: Tag[]): Dex<TDexEntry>;
  (notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.CHAIN, andFlag: typeof FLAGS.OR, tags: Tag[]): Dex<TDexEntry>;
  (andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.FIRST, notFlag: typeof FLAGS.NOT, tags: Tag[]): TEntry | undefined;
  (notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.FIRST, andFlag: typeof FLAGS.OR, tags: Tag[]): TEntry | undefined;
  (andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.VALUES, notFlag: typeof FLAGS.NOT, tags: Tag[]): TEntry[];
  (notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.VALUES, andFlag: typeof FLAGS.OR, tags: Tag[]): TEntry[];
  (options: [resultFlag: typeof FLAGS.CHAIN, andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT], tags: Tag[]): Dex<TDexEntry>;
  (options: [resultFlag: typeof FLAGS.CHAIN, notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR], tags: Tag[]): Dex<TDexEntry>;
  (options: [resultFlag: typeof FLAGS.FIRST, andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT], tags: Tag[]): TEntry | undefined;
  (options: [resultFlag: typeof FLAGS.FIRST, notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR], tags: Tag[]): TEntry | undefined;
  (options: [resultFlag: typeof FLAGS.VALUES, andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT], tags: Tag[]): TEntry[];
  (options: [resultFlag: typeof FLAGS.VALUES, notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR], tags: Tag[]): TEntry[];
  (options: [notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.CHAIN], tags: Tag[]): Dex<TDexEntry>;
  (options: [andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.CHAIN], tags: Tag[]): Dex<TDexEntry>;
  (options: [notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.FIRST], tags: Tag[]): TEntry | undefined;
  (options: [andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.FIRST], tags: Tag[]): TEntry | undefined;
  (options: [notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.VALUES], tags: Tag[]): TEntry[];
  (options: [andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.VALUES], tags: Tag[]): TEntry[];
  (options: [andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.CHAIN, notFlag: typeof FLAGS.NOT], tags: Tag[]): Dex<TDexEntry>;
  (options: [notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.CHAIN, andFlag: typeof FLAGS.OR], tags: Tag[]): Dex<TDexEntry>;
  (options: [andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.FIRST, notFlag: typeof FLAGS.NOT], tags: Tag[]): TEntry | undefined;
  (options: [notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.FIRST, andFlag: typeof FLAGS.OR], tags: Tag[]): TEntry | undefined;
  (options: [andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.VALUES, notFlag: typeof FLAGS.NOT], tags: Tag[]): TEntry[];
  (options: [notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.VALUES, andFlag: typeof FLAGS.OR], tags: Tag[]): TEntry[];

  // ? flags
  //  - one tag
  (flags: Flag[], tag: Tag): QueryResults<TEntry, TDexEntry>;

  //  - spread of tags
  (flags: Flag[], ...tags: Tag[]): QueryResults<TEntry, TDexEntry>;

  //  - tag array
  (flags: Flag[], tags: Tag[]): QueryResults<TEntry, TDexEntry>;

  // # Tags First
  
  // 1 flag
  //  - one tag
  (tag: Tag, resultFlag?: typeof FLAGS.CHAIN): Dex<TDexEntry>;
  (tag: Tag, resultFlag?: typeof FLAGS.FIRST): TEntry | undefined;
  (tag: Tag, resultFlag?: typeof FLAGS.VALUES): TEntry[];
  (tag: Tag, logicFlag?: LogicFlag): TDefaultResult;
  (tag: Tag, resultFlag?: [typeof FLAGS.CHAIN]): Dex<TDexEntry>;
  (tag: Tag, resultFlag?: [typeof FLAGS.FIRST]): TEntry | undefined;
  (tag: Tag, resultFlag?: [typeof FLAGS.VALUES]): TEntry[];
  (tag: Tag, logicFlag?: [LogicFlag]): TDefaultResult;

  //  - tag array
  (tags: Tag[], resultFlag?: typeof FLAGS.CHAIN): Dex<TDexEntry>;
  (tags: Tag[], resultFlag?: typeof FLAGS.FIRST): TEntry | undefined;
  (tags: Tag[], resultFlag?: typeof FLAGS.VALUES): TEntry[];
  (tags: Tag[], logicFlag?: LogicFlag): TDefaultResult;
  (tags: Tag[], resultFlag?: [typeof FLAGS.CHAIN]): Dex<TDexEntry>;
  (tags: Tag[], resultFlag?: [typeof FLAGS.FIRST]): TEntry | undefined;
  (tags: Tag[], resultFlag?: [typeof FLAGS.VALUES]): TEntry[];
  (tags: Tag[], logicFlag?: [LogicFlag]): TDefaultResult;

  // 2 flags
  //  - one tag
  (tag: Tag, resultFlag?: typeof FLAGS.CHAIN, logicFlag?: LogicFlag): Dex<TDexEntry>;
  (tag: Tag, resultFlag?: typeof FLAGS.FIRST, logicFlag?: LogicFlag): TEntry | undefined;
  (tag: Tag, resultFlag?: typeof FLAGS.VALUES, logicFlag?: LogicFlag): TEntry[];
  (tag: Tag, logicFlag?: LogicFlag, resultFlag?: typeof FLAGS.CHAIN): Dex<TDexEntry>;
  (tag: Tag, logicFlag?: LogicFlag, resultFlag?: typeof FLAGS.FIRST): TEntry | undefined;
  (tag: Tag, logicFlag?: LogicFlag, resultFlag?: typeof FLAGS.VALUES): TEntry[];
  (tag: Tag, logicFlag1?: LogicFlag, logicFlag2?: LogicFlag): TDefaultResult;
  (tag: Tag, options?: [resultFlag: typeof FLAGS.FIRST, logicFlag: LogicFlag]): TEntry | undefined;
  (tag: Tag, options?: [resultFlag: typeof FLAGS.VALUES, logicFlag: LogicFlag]): TEntry[];
  (tag: Tag, options?: [logicFlag: LogicFlag, resultFlag: typeof FLAGS.CHAIN]): Dex<TDexEntry>;
  (tag: Tag, options?: [logicFlag: LogicFlag, resultFlag: typeof FLAGS.FIRST]): TEntry | undefined;
  (tag: Tag, options?: [logicFlag: LogicFlag, resultFlag: typeof FLAGS.VALUES]): TEntry[];
  (tag: Tag, options?: [logicFlag1: LogicFlag, logicFlag2: LogicFlag]): TDefaultResult;

  //  - tag array
  (tags: Tag[], resultFlag?: typeof FLAGS.CHAIN, logicFlag?: LogicFlag): Dex<TDexEntry>;
  (tags: Tag[], resultFlag?: typeof FLAGS.FIRST, logicFlag?: LogicFlag): TEntry | undefined;
  (tags: Tag[], resultFlag?: typeof FLAGS.VALUES, logicFlag?: LogicFlag): TEntry[];
  (tags: Tag[], logicFlag?: LogicFlag, resultFlag?: typeof FLAGS.CHAIN): Dex<TDexEntry>;
  (tags: Tag[], logicFlag?: LogicFlag, resultFlag?: typeof FLAGS.FIRST): TEntry | undefined;
  (tags: Tag[], logicFlag?: LogicFlag, resultFlag?: typeof FLAGS.VALUES): TEntry[];
  (tags: Tag[], logicFlag1?: LogicFlag, logicFlag2?: LogicFlag): TDefaultResult;
  (tags: Tag[], options?: [resultFlag: typeof FLAGS.CHAIN, logicFlag: LogicFlag]): Dex<TDexEntry>;
  (tags: Tag[], options?: [resultFlag: typeof FLAGS.FIRST, logicFlag: LogicFlag]): TEntry | undefined;
  (tags: Tag[], options?: [resultFlag: typeof FLAGS.VALUES, logicFlag: LogicFlag]): TEntry[];
  (tags: Tag[], options?: [logicFlag: LogicFlag, resultFlag: typeof FLAGS.CHAIN]): Dex<TDexEntry>;
  (tags: Tag[], options?: [logicFlag: LogicFlag, resultFlag: typeof FLAGS.FIRST]): TEntry | undefined;
  (tags: Tag[], options?: [logicFlag: LogicFlag, resultFlag: typeof FLAGS.VALUES]): TEntry[];
  (tags: Tag[], options?: [logicFlag1: LogicFlag, logicFlag2: LogicFlag]): TDefaultResult;

  // 3 flags
  //  - one tag
  (tag: Tag, resultFlag?: typeof FLAGS.CHAIN, andFlag?: typeof FLAGS.OR, notFlag?: typeof FLAGS.NOT): Dex<TDexEntry>;
  (tag: Tag, resultFlag?: typeof FLAGS.CHAIN, notFlag?: typeof FLAGS.NOT, andFlag?: typeof FLAGS.OR): Dex<TDexEntry>;
  (tag: Tag, resultFlag?: typeof FLAGS.FIRST, andFlag?: typeof FLAGS.OR, notFlag?: typeof FLAGS.NOT): TEntry | undefined;
  (tag: Tag, resultFlag?: typeof FLAGS.FIRST, notFlag?: typeof FLAGS.NOT, andFlag?: typeof FLAGS.OR): TEntry | undefined;
  (tag: Tag, resultFlag?: typeof FLAGS.VALUES, andFlag?: typeof FLAGS.OR, notFlag?: typeof FLAGS.NOT): TEntry[];
  (tag: Tag, resultFlag?: typeof FLAGS.VALUES, notFlag?: typeof FLAGS.NOT, andFlag?: typeof FLAGS.OR): TEntry[];
  (tag: Tag, notFlag?: typeof FLAGS.NOT, andFlag?: typeof FLAGS.OR, resultFlag?: typeof FLAGS.CHAIN): Dex<TDexEntry>;
  (tag: Tag, andFlag?: typeof FLAGS.OR, notFlag?: typeof FLAGS.NOT, resultFlag?: typeof FLAGS.CHAIN): Dex<TDexEntry>;
  (tag: Tag, notFlag?: typeof FLAGS.NOT, andFlag?: typeof FLAGS.OR, resultFlag?: typeof FLAGS.FIRST): TEntry | undefined;
  (tag: Tag, andFlag?: typeof FLAGS.OR, notFlag?: typeof FLAGS.NOT, resultFlag?: typeof FLAGS.FIRST): TEntry | undefined;
  (tag: Tag, notFlag?: typeof FLAGS.NOT, andFlag?: typeof FLAGS.OR, resultFlag?: typeof FLAGS.VALUES): TEntry[];
  (tag: Tag, andFlag?: typeof FLAGS.OR, notFlag?: typeof FLAGS.NOT, resultFlag?: typeof FLAGS.VALUES): TEntry[];
  (tag: Tag, andFlag?: typeof FLAGS.OR, resultFlag?: typeof FLAGS.CHAIN, notFlag?: typeof FLAGS.NOT): Dex<TDexEntry>;
  (tag: Tag, notFlag?: typeof FLAGS.NOT, resultFlag?: typeof FLAGS.CHAIN, andFlag?: typeof FLAGS.OR): Dex<TDexEntry>;
  (tag: Tag, andFlag?: typeof FLAGS.OR, resultFlag?: typeof FLAGS.FIRST, notFlag?: typeof FLAGS.NOT): TEntry | undefined;
  (tag: Tag, notFlag?: typeof FLAGS.NOT, resultFlag?: typeof FLAGS.FIRST, andFlag?: typeof FLAGS.OR): TEntry | undefined;
  (tag: Tag, andFlag?: typeof FLAGS.OR, resultFlag?: typeof FLAGS.VALUES, notFlag?: typeof FLAGS.NOT): TEntry[];
  (tag: Tag, notFlag?: typeof FLAGS.NOT, resultFlag?: typeof FLAGS.VALUES, andFlag?: typeof FLAGS.OR): TEntry[];
  (tag: Tag, options?: [resultFlag: typeof FLAGS.CHAIN, andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT]): Dex<TDexEntry>;
  (tag: Tag, options?: [resultFlag: typeof FLAGS.CHAIN, notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR]): Dex<TDexEntry>;
  (tag: Tag, options?: [resultFlag: typeof FLAGS.FIRST, andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT]): TEntry | undefined;
  (tag: Tag, options?: [resultFlag: typeof FLAGS.FIRST, notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR]): TEntry | undefined;
  (tag: Tag, options?: [resultFlag: typeof FLAGS.VALUES, andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT]): TEntry[];
  (tag: Tag, options?: [resultFlag: typeof FLAGS.VALUES, notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR]): TEntry[];
  (tag: Tag, options?: [notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.CHAIN]): Dex<TDexEntry>;
  (tag: Tag, options?: [andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.CHAIN]): Dex<TDexEntry>;
  (tag: Tag, options?: [notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.FIRST]): TEntry | undefined;
  (tag: Tag, options?: [andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.FIRST]): TEntry | undefined;
  (tag: Tag, options?: [notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.VALUES]): TEntry[];
  (tag: Tag, options?: [andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.VALUES]): TEntry[];
  (tag: Tag, options?: [andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.CHAIN, notFlag: typeof FLAGS.NOT]): Dex<TDexEntry>;
  (tag: Tag, options?: [notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.CHAIN, andFlag: typeof FLAGS.OR]): Dex<TDexEntry>;
  (tag: Tag, options?: [andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.FIRST, notFlag: typeof FLAGS.NOT]): TEntry | undefined;
  (tag: Tag, options?: [notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.FIRST, andFlag: typeof FLAGS.OR]): TEntry | undefined;
  (tag: Tag, options?: [andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.VALUES, notFlag: typeof FLAGS.NOT]): TEntry[];
  (tag: Tag, options?: [notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.VALUES, andFlag: typeof FLAGS.OR]): TEntry[];

  //  - tag array
  (tags: Tag[], resultFlag?: typeof FLAGS.CHAIN, andFlag?: typeof FLAGS.OR, notFlag?: typeof FLAGS.NOT): Dex<TDexEntry>;
  (tags: Tag[], resultFlag?: typeof FLAGS.CHAIN, notFlag?: typeof FLAGS.NOT, andFlag?: typeof FLAGS.OR): Dex<TDexEntry>;
  (tags: Tag[], resultFlag?: typeof FLAGS.FIRST, andFlag?: typeof FLAGS.OR, notFlag?: typeof FLAGS.NOT): TEntry | undefined;
  (tags: Tag[], resultFlag?: typeof FLAGS.FIRST, notFlag?: typeof FLAGS.NOT, andFlag?: typeof FLAGS.OR): TEntry | undefined;
  (tags: Tag[], resultFlag?: typeof FLAGS.VALUES, andFlag?: typeof FLAGS.OR, notFlag?: typeof FLAGS.NOT): TEntry[];
  (tags: Tag[], resultFlag?: typeof FLAGS.VALUES, notFlag?: typeof FLAGS.NOT, andFlag?: typeof FLAGS.OR): TEntry[];
  (tags: Tag[], notFlag?: typeof FLAGS.NOT, andFlag?: typeof FLAGS.OR, resultFlag?: typeof FLAGS.CHAIN): Dex<TDexEntry>;
  (tags: Tag[], andFlag?: typeof FLAGS.OR, notFlag?: typeof FLAGS.NOT, resultFlag?: typeof FLAGS.CHAIN): Dex<TDexEntry>;
  (tags: Tag[], notFlag?: typeof FLAGS.NOT, andFlag?: typeof FLAGS.OR, resultFlag?: typeof FLAGS.FIRST): TEntry | undefined;
  (tags: Tag[], andFlag?: typeof FLAGS.OR, notFlag?: typeof FLAGS.NOT, resultFlag?: typeof FLAGS.FIRST): TEntry | undefined;
  (tags: Tag[], notFlag?: typeof FLAGS.NOT, andFlag?: typeof FLAGS.OR, resultFlag?: typeof FLAGS.VALUES): TEntry[];
  (tags: Tag[], andFlag?: typeof FLAGS.OR, notFlag?: typeof FLAGS.NOT, resultFlag?: typeof FLAGS.VALUES): TEntry[];
  (tags: Tag[], andFlag?: typeof FLAGS.OR, resultFlag?: typeof FLAGS.CHAIN, notFlag?: typeof FLAGS.NOT): Dex<TDexEntry>;
  (tags: Tag[], notFlag?: typeof FLAGS.NOT, resultFlag?: typeof FLAGS.CHAIN, andFlag?: typeof FLAGS.OR): Dex<TDexEntry>;
  (tags: Tag[], andFlag?: typeof FLAGS.OR, resultFlag?: typeof FLAGS.FIRST, notFlag?: typeof FLAGS.NOT): TEntry | undefined;
  (tags: Tag[], notFlag?: typeof FLAGS.NOT, resultFlag?: typeof FLAGS.FIRST, andFlag?: typeof FLAGS.OR): TEntry | undefined;
  (tags: Tag[], andFlag?: typeof FLAGS.OR, resultFlag?: typeof FLAGS.VALUES, notFlag?: typeof FLAGS.NOT): TEntry[];
  (tags: Tag[], notFlag?: typeof FLAGS.NOT, resultFlag?: typeof FLAGS.VALUES, andFlag?: typeof FLAGS.OR): TEntry[];
  (tags: Tag[], options?: [resultFlag: typeof FLAGS.CHAIN, andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT]): Dex<TDexEntry>;
  (tags: Tag[], options?: [resultFlag: typeof FLAGS.CHAIN, notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR]): Dex<TDexEntry>;
  (tags: Tag[], options?: [resultFlag: typeof FLAGS.FIRST, andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT]): TEntry | undefined;
  (tags: Tag[], options?: [resultFlag: typeof FLAGS.FIRST, notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR]): TEntry | undefined;
  (tags: Tag[], options?: [resultFlag: typeof FLAGS.VALUES, andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT]): TEntry[];
  (tags: Tag[], options?: [resultFlag: typeof FLAGS.VALUES, notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR]): TEntry[];
  (tags: Tag[], options?: [notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.CHAIN]): Dex<TDexEntry>;
  (tags: Tag[], options?: [andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.CHAIN]): Dex<TDexEntry>;
  (tags: Tag[], options?: [notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.FIRST]): TEntry | undefined;
  (tags: Tag[], options?: [andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.FIRST]): TEntry | undefined;
  (tags: Tag[], options?: [notFlag: typeof FLAGS.NOT, andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.VALUES]): TEntry[];
  (tags: Tag[], options?: [andFlag: typeof FLAGS.OR, notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.VALUES]): TEntry[];
  (tags: Tag[], options?: [andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.CHAIN, notFlag: typeof FLAGS.NOT]): Dex<TDexEntry>;
  (tags: Tag[], options?: [notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.CHAIN, andFlag: typeof FLAGS.OR]): Dex<TDexEntry>;
  (tags: Tag[], options?: [andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.FIRST, notFlag: typeof FLAGS.NOT]): TEntry | undefined;
  (tags: Tag[], options?: [notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.FIRST, andFlag: typeof FLAGS.OR]): TEntry | undefined;
  (tags: Tag[], options?: [andFlag: typeof FLAGS.OR, resultFlag: typeof FLAGS.VALUES, notFlag: typeof FLAGS.NOT]): TEntry[];
  (tags: Tag[], options?: [notFlag: typeof FLAGS.NOT, resultFlag: typeof FLAGS.VALUES, andFlag: typeof FLAGS.OR]): TEntry[];

  // ? flags
  //  - one tag
  (tag: Tag, flags: Flag[]): QueryResults<TEntry, TDexEntry>;

  //  - tag array
  (tags: Tag[], flags: Flag[]): QueryResults<TEntry, TDexEntry>;
}*/

export interface IQuery<
  TEntry extends Entry = Entry,
  TDexEntry extends Entry | TEntry = TEntry,
  TValidFlags extends Flag = Flag,
  TDefaultResult extends QueryResults<TEntry, TDexEntry> = IQueryResult<TEntry, TValidFlags, TDexEntry>
> {

  /**
   * Query for entries that match a single tag.
   */
  (
    tag: Tag
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult
  >;

  /**
   * Query for entries that match a single tag and the provided option flags.
   */
  <TFlag extends Flag>(
    tag: Tag,
    flag: TFlag
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    TFlag
  >;

  /**
   * Query for entries that match a single tag and the provided option flags.
   */
  <
    TFlag1 extends Flag,
    TFlag2 extends Flag,
    TFlag3 extends Flag
  >(
    tag: Tag,
    flag1: TFlag1,
    flag2: TFlag2,
    flag3?: TFlag3,
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    TFlag1,
    TFlag2,
    TFlag3
  >;

  /**
   * Query for entries that match a single tag and flag options.
   */
  <
    TFlag1 extends Flag,
    TFlag2 extends Flag,
    TFlag3 extends Flag
  >(
    tag: Tag,
    flags: [TFlag1, TFlag2?, TFlag3?]
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    TFlag1,
    TFlag2,
    TFlag3
  >;

  (
    tags: Tag[]
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult
  >

  /**
   * Query for entries that match a single tag and the provided option flags.
   */
  <TFlag extends Flag | undefined = undefined>(
    tags: Tag[],
    flag: TFlag
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult
  >

  /**
   * Query for entries that match a single tag and the provided option flags.
   */
  <
    TFlag1 extends Flag | undefined = undefined,
    TFlag2 extends Flag | undefined = undefined,
    TFlag3 extends Flag | undefined = undefined
  >(
    tags: Tag[],
    flag1: TFlag1,
    flag2: TFlag2,
    flag3?: TFlag3,
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    TFlag1,
    TFlag2,
    TFlag3
  >;

  <
    TFlag1 extends Flag,
    TFlag2 extends Flag,
    TFlag3 extends Flag
  >(
    tags: Tag[],
    flags: [TFlag1?, TFlag2?, TFlag3?]
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    TFlag1,
    TFlag2,
    TFlag3
  >;

  <
    TFlag1 extends Flag,
    TFlag2 extends Flag,
    TFlag3 extends Flag
  >(
    tags: Tag[],
    flags: Flag[]
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    typeof flags[0],
    typeof flags[1],
    typeof flags[2]
  >;

  <
    TFlag1 extends Flag,
    TFlag2 extends Flag,
    TFlag3 extends Flag
  >(
    tags: Tag[],
    flags: Flag[]
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    typeof flags[0],
    typeof flags[1],
    typeof flags[2]
  >;

  <
    TFlag1 extends Flag,
    TFlag2 extends Flag,
    TFlag3 extends Flag
  >(
    tags: Tag[],
    flags?: Flag[]
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult
  >;

  <TFlag extends Flag>(
    flag: TFlag,
    tag: Tag
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    TFlag
  >

  <TFlag extends Flag>(
    flag: TFlag,
    ...tags: Tag[]
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    TFlag
  >

  <TFlag extends Flag>(
    flag: TFlag,
    tags: Tag[]
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    TFlag
  >

  <TFlag1 extends Flag, TFlag2 extends Flag>(
    flag1: TFlag1,
    flag2: TFlag2,
    tag: Tag
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    TFlag1,
    TFlag2
  >;

  <TFlag1 extends Flag, TFlag2 extends Flag>(
    flag1: TFlag1,
    flag2: TFlag2,
    ...tags: Tag[]
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    TFlag1,
    TFlag2
  >;

  <TFlag1 extends Flag, TFlag2 extends Flag>(
    flag1: TFlag1,
    flag2: TFlag2,
    tags: Tag[]
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    TFlag1,
    TFlag2
  >;

  //
  <
    TFlag1 extends Flag,
    TFlag2 extends Flag,
    TFlag3 extends Flag
  >(
    flag1: TFlag1,
    flag2: TFlag2,
    flag3: TFlag3,
    tag: Tag
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    TFlag1,
    TFlag2,
    TFlag3
  >;

  <
    TFlag1 extends Flag,
    TFlag2 extends Flag,
    TFlag3 extends Flag
  >(
    flag1: TFlag1,
    flag2: TFlag2,
    flag3: TFlag3,
    ...tags: Tag[]
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    TFlag1,
    TFlag2,
    TFlag3
  >;

  <
    TFlag1 extends Flag,
    TFlag2 extends Flag,
    TFlag3 extends Flag
  >(
    flag1: TFlag1,
    flag2: TFlag2,
    flag3: TFlag3,
    tags: Tag[]
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    TFlag1,
    TFlag2,
    TFlag3
  >;

  <
    TFlag1 extends Flag,
    TFlag2 extends Flag | undefined = undefined,
    TFlag3 extends Flag | undefined = undefined
  >(
    flags: [TFlag1, TFlag2?, TFlag3?],
    ...tags: Tag[]
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    TFlag1,
    TFlag2,
    TFlag3
  >;

  <
    TFlag1 extends Flag,
    TFlag2 extends Flag | undefined = undefined,
    TFlag3 extends Flag | undefined = undefined
  >(
    flags: [TFlag1, TFlag2?, TFlag3?],
    tags: Tag[]
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    TFlag1,
    TFlag2,
    TFlag3
  >;

  <
    TFlag1 extends Flag,
    TFlag2 extends Flag | undefined = undefined,
    TFlag3 extends Flag | undefined = undefined
  >(
    flags: [TFlag1, TFlag2?, TFlag3?],
    tag: Tag
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult,
    TFlag1,
    TFlag2,
    TFlag3
  >;

  (
    ...tags: Tag[]
  ): QueryResultCalculator<
    TEntry,
    TDexEntry,
    TDefaultResult
  >
}

/**
 * The base of other more complex QueryMethods.
 */
export interface IBasicQuery<
  TEntry extends Entry = Entry,
  TDexEntry extends Entry | TEntry = TEntry,
  TResults extends QueryResults<TEntry, TDexEntry> = QueryResults<TEntry, TDexEntry>,
  TValidFlags extends Flag = Flag
> {
  (tags: Tag[], options?: TValidFlags[]): TResults;
}

/**
 * Represents a special kind of query that selects and returns a sub-Dex
 *
 * @internal
 */
export interface IQueryChain<
  TEntry extends Entry = Entry,
  TValidFlags extends Flag = Flag
> extends IQuery<TEntry, TEntry, TValidFlags, Dex<TEntry>> {
  not: IQueryChain<TEntry, ResultFlag | typeof FLAGS.OR | typeof FLAGS.OR | typeof FLAGS.NOT>;
  and: IQueryChain<TEntry, ResultFlag | typeof FLAGS.NOT | typeof FLAGS.OR>;
  or: IQueryChain<TEntry, ResultFlag | typeof FLAGS.NOT | typeof FLAGS.OR>;
  first: IQuery<TEntry, TEntry, LogicFlag | typeof FLAGS.FIRST, TEntry>;
}

/**
 * Represents a special kind of query that has a first parameter as well
 *
 * @internal
 */
export interface IFirstableQuery<
  TEntry extends Entry = Entry,
  TDexEntry extends Entry = TEntry,
  TResults extends QueryResults<TEntry, TDexEntry> = QueryResults<TEntry, TDexEntry>,
  TValidFlags extends Flag = Flag
> extends IBasicQuery<TEntry, TDexEntry, TResults, TValidFlags> {
  (tags?: Tag[], options?: TValidFlags[]): TResults;
  first: IQuery<TEntry, TDexEntry, typeof FLAGS.FIRST | LogicFlag, TEntry>;
}

/**
 * Get the specific query result type for a given set of flags.
 */
export type IQueryResult<
  TEntry extends Entry,
  TFlag extends Flag | undefined = typeof FLAGS.VALUES,
  TDexEntry extends Entry = TEntry,
  TDefaultResult extends QueryResults<TEntry, TDexEntry> = TEntry[],
> = TFlag extends typeof FLAGS.FIRST
  ? (TEntry | undefined)
  : TFlag extends typeof FLAGS.CHAIN
  ? Dex<TDexEntry>
  : TFlag extends typeof FLAGS.VALUES
  ? TEntry[]
  : TDefaultResult;

/**
 * All the types of query results
 */
export type QueryResults<TEntry extends Entry = Entry, TDexEntry extends Entry = TEntry>
  = TEntry | Dex<TDexEntry> | TEntry[] | undefined;

/** @internal */
export type QueryResultCalculator<
  TEntry extends Entry,
  TDexEntry extends Entry = TEntry,
  TDefaultResult extends QueryResults<TEntry, TDexEntry> = TEntry[],
  TFlag1 extends Flag | undefined = undefined,
  TFlag2 extends Flag | undefined = undefined,
  TFlag3 extends Flag | undefined = undefined
> = IQueryResult<
  TEntry,
  TFlag1 extends ResultFlag
  ? TFlag1
  : TFlag2 extends ResultFlag
  ? TFlag2
  : TFlag3,
  TDexEntry,
  TDefaultResult
>;

/** @internal */
export function QueryConstructor<
  TEntry extends Entry,
  TDexEntry extends Entry | TEntry = TEntry,
  TValidFlags extends Flag = Flag,
  TValidResults extends QueryResults<TEntry, TDexEntry> = QueryResults<TEntry, TDexEntry>,
  TDefaultResult extends QueryResults<TEntry, TDexEntry> = IQueryResult<TEntry, TValidFlags, TDexEntry>,
  TBaseValidResults extends QueryResults<TEntry, TDexEntry> = QueryResults<TEntry, TDexEntry>,
  TBaseValidFlags extends Flag = TValidFlags
>(
  base: IBasicQuery<TEntry, TDexEntry, TBaseValidResults, TBaseValidFlags>
): IQuery<TEntry, TDexEntry, TValidFlags, TDefaultResult> {
  const query: IQuery<TEntry, TDexEntry, TValidFlags, TDefaultResult> = function <
    TFlag1 extends Flag | undefined = undefined,
    TFlag2 extends Flag | undefined = undefined,
    TFlag3 extends Flag | undefined = undefined
  >(
    ...args: any[]
  ): TValidResults extends TDefaultResult ? TValidResults : TDefaultResult {
    const flags = [];
    const tags = [];

    let index = 0;
    for (const arg of args) {
      if (isArray(arg)) {
        if (arg && index < 2 && FLAGS.contains(arg[0])) {
          for (const f of arg) {
            flags.push(f);
          }
        } else {
          for (const t of arg) {
            tags.push(t);
          }
        }
      }

      index++;
    }

    return base(tags, flags) as TValidResults extends TDefaultResult ? TValidResults : TDefaultResult;
  }

  return query;
}