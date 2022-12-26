import { HashKey } from "./subsets/hashes";

/**
 * A unique entry or item.
 */
export default interface IUnique {

  /**
   * Get a consistent and relitively unique identifier hash code for this item.
   */
  getHashKey(): HashKey;
}
