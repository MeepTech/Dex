import { IBreakable } from "../../utilities/breakable";
import Dex from "../dex";
import { IEntry } from '../subsets/entries'
import { IHashKey, IHashOrHashes } from "../subsets/hashes";
import { ITag, ITagOrTags } from "../subsets/tags";

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
  };

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
  extends IBreakable<[entry: TEntry, index: number, dex: Dex<TEntry>, args: IQueryFilter<TEntry>, ...rest: any], boolean> { };
