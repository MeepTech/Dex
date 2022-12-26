/**
 * Used to break from a breakable early.
 */
export class Break<TResult = void> {
  readonly return: TResult;
  readonly hasReturn: number;

  constructor(resultValue?: TResult) {
    this.return = resultValue!;
    this.hasReturn = arguments.length;
  }
}

/**
 * A method that can signal it's outer loop should be be broken
 */
export interface Breakable<TArgs extends [...any], TResult = void> {
  (...args: TArgs): TResult | Break<TResult> | Break;
}