import { isArray } from "../../utilities/validators";

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
const LOGIC_FLAGS: {
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
const RESULT_FLAGS: {
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
  typeof LOGIC_FLAGS
  & typeof RESULT_FLAGS
  & {
    LOGIC: typeof LOGIC_FLAGS;
    RESULT: typeof RESULT_FLAGS;

    /**
     * Check if the given symbol is a type of flag
     */
    is(symbol: any): symbol is IFlag;
    has<TValidFlags extends IFlag, TFlagsToCheck extends IFlag>(
      currentFlags: IFlagOrFlags<TValidFlags>,
      flagOrFlagsToCheckFor: IFlagOrFlags<TFlagsToCheck>
    ): currentFlags is IFlagOrFlags<TFlagsToCheck> & IFlagOrFlags<TValidFlags>

    add<
      TCurrentFlags extends IFlag,
      TFlagsToAdd extends IFlag
    >(
      currentFlags: IFlagOrFlags<TCurrentFlags>,
      flagsToAdd: IFlagOrFlags<TFlagsToAdd>
    ): IFlagOrFlags<TCurrentFlags | TFlagsToAdd> & Set<TCurrentFlags | TFlagsToAdd>
    drop<
      TCurrentFlags extends IFlag,
      TFlagsToRemove extends IFlag
    >(
      currentFlags: IFlagOrFlags<TCurrentFlags>,
      flagsToDrop: IFlagOrFlags<TFlagsToRemove>
    ): IFlagOrFlags<Exclude<TCurrentFlags, TFlagsToRemove>> & Set<Exclude<TCurrentFlags, TFlagsToRemove>>

    toSet<TFlag extends IFlag>(
      flags: IFlagOrFlags<TFlag>
    ): Set<TFlag>;
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
Object.defineProperty(FLAGS, "is", {
  value(symbol: any): boolean {
    return FLAG_SET.has(symbol);
  },
  enumerable: false,
  writable: false,
  configurable: false
});
Object.defineProperty(FLAGS, "has", {
  value: hasFlag,
  enumerable: false,
  writable: false,
  configurable: false
});
Object.defineProperty(FLAGS, "add", {
  value: addFlags,
  enumerable: false,
  writable: false,
  configurable: false
});
Object.defineProperty(FLAGS, "drop", {
  value: dropFlags,
  enumerable: false,
  writable: false,
  configurable: false
});
Object.defineProperty(FLAGS, "toSet", {
  value: toSet,
  enumerable: false,
  writable: false,
  configurable: false
});
export { FLAGS };

/**
 * Used to check if an entry is a logic flag.
 */
export type ILogicFlag = typeof FLAGS.OR
  | typeof FLAGS.NOT
  | typeof FLAGS.AND
  | typeof OR_FLAG
  | typeof NOT_FLAG
  | typeof AND_FLAG;

/**
 * Used to check if an entry is a result flag.
 */
export type IResultFlag = typeof FLAGS.FIRST
  | typeof FLAGS.CHAIN
  | typeof FLAGS.VALUES
  | typeof FIRST_FLAG
  | typeof CHAIN_FLAG
  | typeof VALUES_FLAG;

/**
 * Used to check if an entry is a flag.
 */

export type IFlag = ILogicFlag | IResultFlag;

/**
 * A single flag or set of flags.
 */
export type IFlagOrFlags<TValidFlags extends IFlag = IFlag>
  = TValidFlags | TValidFlags[] | Set<TValidFlags> | [];

/**
 * Gets a set from an IFlagOrFlags
 */
export function toSet<TFlag extends IFlag>(flags: IFlagOrFlags<TFlag>): Set<TFlag> {
  return flags instanceof Set
    ? new Set<TFlag>(flags)
    : isArray(flags)
      ? new Set<TFlag>(flags)
      : new Set<TFlag>([flags])
}

/**
 * Used to easily add sets of flags together
 */
export function addFlags<
  TCurrentFlags extends IFlag,
  TFlagsToAdd extends IFlag
>(
  currentFlags: IFlagOrFlags<TCurrentFlags>,
  flagsToAdd: IFlagOrFlags<TFlagsToAdd>
): IFlagOrFlags<TCurrentFlags | TFlagsToAdd> & Set<TCurrentFlags | TFlagsToAdd> {
  if (isArray(currentFlags)) {
    if (!currentFlags.length) {
      return toSet<TCurrentFlags | TFlagsToAdd>(flagsToAdd);
    } else {
      const flags = toSet<TCurrentFlags | TFlagsToAdd>(flagsToAdd);
      currentFlags.forEach(f => flags.add(f));

      return flags;
    }
  }

  if (currentFlags instanceof Set) {
    if (!currentFlags.size) {
      return toSet<TCurrentFlags | TFlagsToAdd>(flagsToAdd);
    } else {
      const flags = toSet<TCurrentFlags | TFlagsToAdd>(currentFlags);
      if (FLAGS.is(flagsToAdd)) {
        flags.add(flagsToAdd);
      } else {
        flagsToAdd.forEach(f => flags.add(f));
      }

      return flags;
    }
  }

  const flags = toSet<TCurrentFlags | TFlagsToAdd>(flagsToAdd);
  flags.add(currentFlags);

  return flags;
}

/**
 * Remove flags from an IFlagOrFlags
 */
export function dropFlags<
  TCurrentFlags extends IFlag,
  TFlagsToRemove extends IFlag
>(
  currentFlags: IFlagOrFlags<TCurrentFlags>,
  flagsToDrop: IFlagOrFlags<TFlagsToRemove>
): IFlagOrFlags<Exclude<TCurrentFlags, TFlagsToRemove>> & Set<Exclude<TCurrentFlags, TFlagsToRemove>> {
  const flags = toSet(currentFlags);
  if (!flags.size) {
    return flags as any;
  }

  const toDrop = toSet(flagsToDrop);
  if (!toDrop.size) {
    return flags as any;
  }

  toDrop.forEach(f => flags.delete(f as any));

  return flags as any;
}

/**
 * Check if a flag or flags has the given options.
 */
export function hasFlag<
  TValidFlags extends IFlag,
  TFlagsToCheck extends IFlag
>(
  currentFlags: IFlagOrFlags<TValidFlags>,
  flagOrFlagsToCheckFor: IFlagOrFlags<TFlagsToCheck>
): currentFlags is IFlagOrFlags<TFlagsToCheck> & IFlagOrFlags<TValidFlags> {
  if (isArray(flagOrFlagsToCheckFor)) {
    if (!flagOrFlagsToCheckFor.length) {
      return true;
    } else {
      if (isArray(currentFlags)) {
        return flagOrFlagsToCheckFor.every(flagToCheck => (currentFlags as TValidFlags[]).includes(flagToCheck as any))
      } // or set
      else if (currentFlags instanceof Set) {
        return flagOrFlagsToCheckFor.every(flagToCheck => (currentFlags as Set<TValidFlags>).has(flagToCheck as any))
      }// check if the only item is this
      else if (flagOrFlagsToCheckFor.length === 1) {
        return (currentFlags as any) === flagOrFlagsToCheckFor[0];
      } // not the same # of items.
      else {
        return false;
      }
    }
  } else if (flagOrFlagsToCheckFor instanceof Set) {
    if (!flagOrFlagsToCheckFor.size) {
      return true;
    } else {
      if (isArray(currentFlags)) {
        for (const flagToCheck of flagOrFlagsToCheckFor) {
          if (!(currentFlags as TValidFlags[]).includes(flagToCheck as any)) {
            return false;
          }
        }

        return true;
      } // or set
      else if (currentFlags instanceof Set) {
        for (const flagToCheck of flagOrFlagsToCheckFor) {
          if (!(currentFlags as Set<TValidFlags>).has(flagToCheck as any)) {
            return false;
          }
        }

        return true;
      }// check if the only item is this
      else if (flagOrFlagsToCheckFor.size === 1) {
        return currentFlags === flagOrFlagsToCheckFor.entries().next().value;
      } // not the same # of items.
      else {
        return false;
      }
    }
  } else {
    if (isArray(currentFlags)) {
      return (currentFlags as TValidFlags[]).includes(flagOrFlagsToCheckFor as any);
    } // or set
    else if (currentFlags instanceof Set) {
      return (currentFlags as Set<TValidFlags>).has(flagOrFlagsToCheckFor as any);
    }// check if the only item is this
    else {
      return (currentFlags as any) === flagOrFlagsToCheckFor;
    }
  }
}

