/**
 * The strict query flag (and)
 */
export const AND_FLAG: unique symbol = Symbol("and");

/**
 * The or query flag
 */
export const OR_FLAG: unique symbol = Symbol("or");

/**
 * The not/reverse query flag
 */
export const NOT_FLAG: unique symbol = Symbol("not");

/**
 * Flags that change the logic of the query
 */
const LOGIC_FLAGS : {
  AND: typeof AND_FLAG,
  OR: typeof OR_FLAG,
  NOT: typeof NOT_FLAG
} = {

  /**
   * Must match all provided values with no other options.
   */
  AND: AND_FLAG,

  /**
   * Indicates the Query can match one of any of the provided options instead of needing to match all of them.
   */
  OR: OR_FLAG,

  /**
   * Indicates the Query should return results that don't match instead of do match.
   */
  NOT: NOT_FLAG
};

/**
 * The values query flag
 */
export const VALUES_FLAG: unique symbol = Symbol("values");

/**
 * The chain query flag
 */
export const CHAIN_FLAG: unique symbol = Symbol("chain");

/**
 * The first result query flag
 */
export const FIRST_FLAG: unique symbol = Symbol("first");

/**
 * Flags that indicate a potential result.
 */
const RESULT_FLAGS  : {
  VALUES: typeof VALUES_FLAG,
  FIRST: typeof FIRST_FLAG,
  CHAIN: typeof CHAIN_FLAG
} = {

  /**
   * Flag indicating an array of values should be returned.
   */
  VALUES: VALUES_FLAG,

  /**
   * Indicates the Query should return after it's found the first item.
   */
  CHAIN: CHAIN_FLAG,

  /**
   * Returns the results as a dex for chaining.
   */
  FIRST: FIRST_FLAG
};

/**
 * Options for Dex queries like the select function.
 */
const FLAGS:
  typeof LOGIC_FLAGS &
  typeof RESULT_FLAGS &
{
  LOGIC: typeof LOGIC_FLAGS;
  RESULT: typeof RESULT_FLAGS;
  contains(symbol: any): boolean;
} = {
  ...LOGIC_FLAGS,
  ...RESULT_FLAGS
} as any;
const FLAG_SET: Set<symbol> = new Set<any>(Object.values(FLAGS));
Object.defineProperty(FLAGS, "LOGIC", {
  value: FLAGS.LOGIC,
  enumerable: false,
  writable: false,
  configurable: false
});
Object.defineProperty(FLAGS, "RESULT", {
  value: FLAGS.RESULT,
  enumerable: false,
  writable: false,
  configurable: false
});
Object.defineProperty(FLAGS, "contains", {
  value(symbol: any): boolean {
    return FLAG_SET.has(symbol);
  },
  enumerable: false,
  writable: false,
  configurable: false
});
export { FLAGS };
  
/**
 * Used to check if an entry is a logic flag.
 */
export type LogicFlag = typeof FLAGS.OR
  | typeof FLAGS.NOT
  | typeof FLAGS.AND
  | typeof OR_FLAG
  | typeof NOT_FLAG
  | typeof AND_FLAG;

/**
 * Used to check if an entry is a result flag.
 */
export type ResultFlag = typeof FLAGS.FIRST
  | typeof FLAGS.CHAIN
  | typeof FLAGS.VALUES
  | typeof FIRST_FLAG
  | typeof CHAIN_FLAG
  | typeof VALUES_FLAG;

/**
 * Used to check if an entry is a flag.
 */

export type Flag = LogicFlag | ResultFlag;
