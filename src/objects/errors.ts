import Entry from "./subsets/entries";

/**
 * Error related to a Dex.
 */
export class DexError extends Error implements Error {
  constructor(message: string) {
    super(message);
  }
}

export class InvalidEntryError extends DexError {
  constructor(entry: Entry, message?: string, dexType?: any) {
    let err = "Invalid Entry: " + entry.toString();
    if (dexType) {
      err += ", in Dex of type: " + dexType.toString()
    }
    if (message) {
      err += ". " + message;
    }

    super(err);
  }
}

/**
 * Error related to an Access error in a Dex.
 */
export class AccessError extends DexError {
  constructor(message: string) {
    super(message);
  }
}

/**
 * This is something that needs to be implemented but has not been yet.
 */
export class NotImplementedError extends DexError {
  constructor(propertyOrMethodName: string, message?: string) {
    super("NOT IMPLEMENTED ERROR: " + propertyOrMethodName + ", has not been implemented by meep.tech yet.\n" + (message ?? ""));
  }
}

/**
 * An error signifying an invalid combination of flags were passed to a Dex Query
 */
export class InvalidQueryParamError extends DexError {
  readonly arg: any;
  constructor(arg: any, index: number | string, extraMessage?: string) {
    super(`Missing or Invalid Query Parameter: ${arg ?? 'undefined'}, at index: ${index}` + (extraMessage ? ( ".\n\t" + extraMessage) : ""));
  }
}

