import { IBreakable } from "../../utilities/breakable";
import { isArray, isObject } from "../../utilities/validators";
import Dex, { DexError } from "../dex";
import { IReadOnlyDex } from "../readonly";
import { IEntry } from '../subsets/entries'
import { IHashKey, IHashOrHashes, IHashSet } from "../subsets/hashes";
import { ITag, ITagOrTags, ITags } from "../subsets/tags";
import { IBasicQuery } from "./queries";

/**
 * The types of results possible from a query.
 */
export enum ResultType {

  /**
   * Unknown return type. 
   * Usually signifies an error.
   * You can't request a result type of vauge.
   */
  Vauge = '=>vauge;',

  /**
   * Array of values
   */
  Array = '=>array;',

  /**
   * Set of values
   */
  Set = '=>set;',

  /**
   * A new filtered dex
   */
  Dex = '=>dex;',

  /**
   * 
   */
  First = '=>first;'
}

export const INVALID_RESULT_REQUEST_TYPES: Readonly<Set<ResultType>> = new Set<ResultType>([
  ResultType.Vauge
]);

export const VALID_RESULT_REQUEST_TYPES: Readonly<Set<ResultType>> = new Set<ResultType>([
  ResultType.Array,
  ResultType.Dex,
  ResultType.Set,
  ResultType.First
]);

export interface IDexQuery<TEntry extends IEntry, TDefaultResult extends ResultType> {
  <TResultType extends ResultType = TDefaultResult>(
    tag: ITag,
    options?: {
      filters?: IQueryFilter<TEntry>,
      result?: TResultType
    }
  ): IResult<TEntry, TResultType>

  <TResultType extends ResultType = TDefaultResult>(
    tag: ITag,
    result: TResultType
  ): IResult<TEntry, TResultType>

  <TResultType extends ResultType = TDefaultResult>(
    tags: ITagOrTags,
    options?: {
      filters?: IQueryFilter<TEntry>,
      result?: TResultType
    }
  ): IResult<TEntry, TResultType>

  <TResultType extends ResultType = TDefaultResult>(
    result: TResultType,
    tag: ITag
  ): IResult<TEntry, TResultType>

  <TResultType extends ResultType = TDefaultResult>(
    result: TResultType,
    ...tags: ITag[]
  ): IResult<TEntry, TResultType>

  <TResultType extends ResultType = TDefaultResult>(
    ...tagsAndResult: [...ITag[], TResultType]
  ): IResult<TEntry, TResultType>

  <TResultType extends ResultType = TDefaultResult>(
    tags: ITagOrTags,
    result: TResultType
  ): IResult<TEntry, TResultType>

  <TResultType extends ResultType = TDefaultResult>(
    filter: IQueryFilter<TEntry>,
    result?: TResultType
  ): IResult<TEntry, TResultType>

  <TResultType extends ResultType = TDefaultResult>(
    filters: IQueryFilter<TEntry>[],
    result?: TResultType
  ): IResult<TEntry, TResultType>

  <TResultType extends ResultType = TDefaultResult>(
    result: TResultType,
    ...filters: IQueryFilter<TEntry>[]
  ): IResult<TEntry, TResultType>

  (...filters: IQueryFilter<TEntry>[])
    : IResult<TEntry, TDefaultResult>

  <TResultType extends ResultType = TDefaultResult>(
    ...filtersAndResult: [...IQueryFilter<TEntry>[], TResultType]
  ): IResult<TEntry, TDefaultResult>
}

export type IQueryFilter<TEntry extends IEntry>
  = {
    /**
     * X and Y and Z
     */
    and: boolean | ITagOrTagsWithFilters<TEntry>
    not?: boolean | ITagOrTagsWithFilters<TEntry>
  } | {
    /**
     * X or Y or Z
     */
    or: ITagOrTagsWithFilters<TEntry>
    not?: boolean | ITagOrTagsWithFilters<TEntry>
  } | {
    /**
     * X or Y or Z
     */
    or?: boolean | ITagOrTagsWithFilters<TEntry>
    not: ITagOrTagsWithFilters<TEntry>
  }

/** @internal */
export const QueryConstructor = <TEntry extends IEntry, TDefaultResult extends ResultType> (
  
): IDexQuery<TEntry, TDefaultResult> => function queryBase<
  TEntry extends IEntry,
  TDefaultResult extends ResultType,
  TResultType extends ResultType = TDefaultResult
>(
  this: IReadOnlyDex<TEntry>,
  ...args: any
): IResult<TEntry, TDefaultResult> {
  if (args[0] in ResultType) {

  } else if (isArray(args[0])) {

  } else if (isObject(args[0])) {

  } else {
    throw new DexError(`Unknown Query Parameter at index 0: ${args[0]}`);
  }
};


/*
export type IQueryFilters<TEntry extends IEntry>
  = IOrQueryFilters<TEntry> | IAndQueryFilters<TEntry>;

type IOrQueryFilters<TEntry extends IEntry>
  = [...orFilters: (IOrQueryFilter<TEntry> | IOrNotQueryFilter<TEntry> | ILoneNotQueryFilter<TEntry>)[]];

type IAndQueryFilters<TEntry extends IEntry>
  = [...andFilters: (IAndQueryFilter<TEntry> | IAndNotQueryFilter<TEntry> | ILoneNotQueryFilter<TEntry>)[]];

export type IQueryFilter<TEntry extends IEntry>
  = [
    ...(
      IOrQueryFilter<TEntry>
      | IOrNotQueryFilter<TEntry>
      | IAndQueryFilter<TEntry>
      | IAndNotQueryFilter<TEntry>
    )
  ];

type IOrQueryFilter<TEntry extends IEntry>
  = [
    FilterTypes.Or,
    ...IQueryFilterParams<TEntry>
  ];

type IOrNotQueryFilter<TEntry extends IEntry>
  = [
    ...(
      [
        FilterTypes.Not,
      ] | [
        FilterTypes.Or,
        FilterTypes.Not
      ] | [
        FilterTypes.Not,
        FilterTypes.Or,
      ]
    ),
    ...IQueryFilterParams<TEntry>
  ]

type IAndQueryFilter<TEntry extends IEntry>
  = [
    FilterTypes.And,
    ...IQueryFilterParams<TEntry>
  ]

type IAndNotQueryFilter<TEntry extends IEntry>
  = [
    ...(
      [
        FilterTypes.And,
        FilterTypes.Not
      ] | [
        FilterTypes.Not,
        FilterTypes.And,
      ]
    ),
    ...IQueryFilterParams<TEntry>
  ]

type ILoneNotQueryFilter<TEntry extends IEntry>
  = [
    ...(
      [
        FilterTypes.Not
      ]
    ),
    ...IQueryFilterParams<TEntry>
  ]

export type IQueryFilterParams<TEntry extends IEntry> = [
  ...(
    [
      tag: ITag
    ] | [
      ...tags: ITag[]
    ] | [
      ...filters: (ITag | IFilter<TEntry>)[]
    ] | [
      tags: ITags,
    ] | [
      filter: IFilter<TEntry>,
    ] | [
      filters: IFilter<TEntry>[],
    ] | [
      filters: ITagOrTagsWithFilters<TEntry>,
    ] 
  )
]
*/

export type ITagOrTagsWithFilters<TEntry extends IEntry> =
  | Array<ITag | IFilter<TEntry>>
  | IFilterObject<TEntry>;

type IFilterObject<TEntry extends IEntry>
  = ITagFilters & IFilterOrFilters<TEntry> & IHashKeyFilters;

type IHashKeyFilters = {
  hash?: IHashKey,
} | {
  hashes?: IHashOrHashes
} | {
  key?: IHashKey
} | {
  hashes?: IHashOrHashes
}

type ITagFilters = {
  tags?: ITagOrTags,
} | {
  tag?: ITag
}

type IFilterOrFilters<TEntry extends IEntry> = {
  filter?: IFilter<TEntry>
} | {
  filters?: IFilter<TEntry> | IFilter<TEntry>[]
}

export type IFilter<TEntry extends IEntry> = {
  where?: IMatchFilter<TEntry>
} | IMatchFilter<TEntry>

export interface IMatchFilter<TEntry extends IEntry>
  extends IBreakable<[entry: TEntry, index: number, dex: Dex<TEntry>, args: Parameters<IBasicQuery<TEntry>>, ...rest: any], boolean> { };

const testQuery: IDexQuery<IEntry, ResultType.Array> = {} as any;

const _1 = testQuery(["a", "e", 1, 5]);
const _2 = testQuery(["a", "e", 1, 5], ResultType.Dex);
const _3 = testQuery(ResultType.First, {and: ["one", "two"]});
const _3_1 = testQuery(ResultType.First, {and: ["one", "two"]});
const _4 = testQuery({and: ["one", "two"]}, ResultType.First);
const _5 = testQuery({ and: ["one", "two"] }, { not: {hashes: ["ID:KW$#kj3tijergwigg"]} });
const _6 = testQuery( { not: {hashes: ["ID:KW$#kj3tijergwigg"]} });

/**
 * A result of a query.
 */
export type IResult<TEntry extends IEntry, TResultType extends ResultType = ResultType.Vauge>
  = ResultType extends ResultType.Vauge
  ? IVaugeResult<TEntry>
  : ISpecificResult<TEntry, TResultType>;

type ISpecificResult<TEntry extends IEntry, TResultType extends ResultType>
  = TResultType extends ResultType.First
  ? TEntry
  : TResultType extends ResultType.Array
  ? TEntry[]
  : TResultType extends ResultType.Set
  ? Set<TEntry>
  : TResultType extends ResultType.Dex
  ? Dex<TEntry>
  : never;

type IVaugeResult<TEntry extends IEntry> =
  TEntry[]
  | Dex<TEntry>
  | Set<TEntry>
  | (TEntry | undefined);