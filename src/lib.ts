/**
 * Specific Type Prefixes:
 * =========================
 * I...: (for Interface) Not an instantiateable Class, but provides parts of implementations and chunksof functionality. 'Or'(|) Union types are usually not interfaces
 * T...: (for Type) A Generic Type Argument
 * X...: (for eXtended) An extension of a Solid type or interface type, usually just for varying the shapes of allowed input.
 */

// dex classes
import Dex from './objects/dexes/dex';
export default Dex;
export {Config, hash} from './objects/dexes/dex';

export {
  IReadableDex as IReadOnlyDex,
  ReadableDex as ReadOnlyDex,
  ArchiDex,
  ArchiDex as Archive
} from './objects/dexes/read';

export {
  FaçaDex,
  FaçaDex as FacaDex,
  FaçaDex as Facadex,
  FaçaDex as Facade
} from './objects/dexes/facade';

import NoisyDex from './objects/dexes/noisy';
export {
  NoisyDex,
  NoisyDex as NDex
};
  
export {
  Config as NoisyConfig
} from './objects/dexes/noisy';

// sub types and sets
export {
  Entry,
  OrNone as EntryOrNone,
  EntrySet as EntrySet
} from './objects/subsets/entries';

export {
  Tag,
  TagOrTags,
  TagSet
} from './objects/subsets/tags';

export {
  HashKey,
  HashKeys,
  HashKeyOrKeys,
  HashSet
} from './objects/subsets/hashes'

export {
  Query
} from './objects/queries/queries';

export {
  Filter
} from './objects/queries/filters';

// child namespaces
export * as Entries from './objects/subsets/entries';
export * as Tags from './objects/subsets/tags';
export * as Hashes from './objects/subsets/hashes';
import Filters from './objects/queries/filters'
import Queries from './objects/queries/queries'
export {
  Filters,
  Queries
}

// helpers
export {
  Copier
} from './objects/helpers/copy';
export {
  Looper
} from './objects/helpers/loops';
export {
  Mapper
} from './objects/helpers/maps';

// utility
import IUnique from './objects/unique'
import Check from './utilities/validators';
import Loop from './utilities/iteration';

export {
  IUnique,
  Check,
  Loop,
}

// loose validators
export const isDex = Check.isDex;
export const isTag = Check.isTag;
export const isFilter = Check.isFilter;
export const isConfig = Check.isDex;