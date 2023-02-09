/**
 * Used to make a getter lazy load and cache it's contents.
 *
 * @decorator 
 */
export function lazy() {
  return function asLazy(
    get: any,
    _: any
  ): any {
    let initialized: boolean = false;
    const cached: { value: any } = { value: undefined! };

    return function getLazily(this: any) {
      if (!initialized) {
        Object.defineProperty(cached, "value", {
          value: get.call(this),
          writable: false,
          enumerable: false,
          configurable: false
        });

        initialized = true;
      }

      return cached.value;
    }
  }
};