import { from } from "./from";

export interface PredicateFn<TItem> {
  (item: TItem): boolean;
}

export interface SelectorFn<TItem, TResult> {
  (item: TItem): TResult;
}

export interface Callback<TItem> {
  (item: TItem): void;
}

export interface ReduceCallback<TPrevious, TCurrent> {
  (previousValue: TPrevious, currentValue: TCurrent): TPrevious;
}

export interface ComparerFn<TItem> {
  (a: TItem, b: TItem): number;
}

export type KeySelectorFn<TItem, TKey> = SelectorFn<TItem, TKey>;

const identityFn = (x: any): boolean => x;

const defaultComparer = <TKey>(a: TKey, b: TKey) => {
  if (a === b) {
    return 0;
  }

  if (a < b) {
    return -1;
  }

  return 1;
};

const getKeySelectorOrDefault = <TItem, TKey>(
  keySelector?: KeySelectorFn<TItem, TKey>
) =>
  keySelector
    ? keySelector
    : ((((x: TItem) => x) as unknown) as KeySelectorFn<TItem, TKey>);

const getComparerOrDefault = <TKey>(
  descending: boolean,
  comparer?: ComparerFn<TKey>
): ComparerFn<TKey> => {
  if (descending && comparer) {
    return (a, b) => comparer(b, a);
  } else if (descending) {
    return (a, b) => defaultComparer(b, a);
  } else if (comparer) {
    return comparer;
  } else {
    return defaultComparer;
  }
};

/**
 * Enumerable sequence
 */
export class Enumerable<T> implements Iterable<T> {
  constructor(protected _iterable: Iterable<T>) {}

  [Symbol.iterator](): Iterator<T> {
    return this._iterable[Symbol.iterator]();
  }

  /**
   * Returns a new sequence that contains the items in the current sequence
   * and items from the given iterable.
   *
   * @example
   * // Returns sequence with values 1, 2, 3, 4
   * from([1, 2]).concat([3, 4]);
   */
  concat<U>(other: Iterable<U>): Enumerable<T | U> {
    return from(this._concat(other));
  }

  private *_concat<U>(other: Iterable<U>): IterableIterator<T | U> {
    for (const item of this._iterable) {
      yield item;
    }

    for (const item of from(other)) {
      yield item;
    }
  }

  /**
   * Checks that all items in the sequence pass the test implemented by the
   * provided function.
   */
  every(predicate: PredicateFn<T> = identityFn): boolean {
    for (const item of this._iterable) {
      if (!predicate(item)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Returns a new sequence where items are filtered out for which the
   * predicate function returns a falsy value.
   */
  filter(predicate: PredicateFn<T>): Enumerable<T> {
    return from(this._filter(predicate));
  }

  private *_filter(predicate: PredicateFn<T>): IterableIterator<T> {
    for (const item of this._iterable) {
      if (predicate(item)) {
        yield item;
      }
    }
  }

  /**
   * Returns the value of the first element in the sequence that satisfies the
   * provided testing function. Otherwise undefined is returned.
   *
   * @example
   * // Returns 4
   * from([2, 4, 6]).find(x => x === 4);
   */
  find(predicate: PredicateFn<T>): T | undefined {
    for (const item of this._iterable) {
      if (predicate(item)) {
        return item;
      }
    }

    return undefined;
  }

  /**
   * First maps each element of the sequence using the given mapping function,
   * then flattens the result into a new sequence.
   *
   * @example
   * // Returns [1, 2, 3, 4, 5, 6]
   * from([1, 3, 5]).flatMap(x => [x, x + 1]).toArray();
   */
  flatMap<U>(mapperFn: SelectorFn<T, U[]>): Enumerable<U> {
    return from(this._flatMap(mapperFn));
  }

  private *_flatMap<U>(mapperFn: SelectorFn<T, U[]>): IterableIterator<U> {
    for (const item of this._iterable) {
      const sequence = from(mapperFn(item));

      for (const mappedItem of sequence) {
        yield mappedItem;
      }
    }
  }

  /**
   * Calls the given callback function with each item in the sequence.
   *
   * @example
   * // Logs 1, 2 and 3 to console
   * from([1, 2, 3]).forEach(i => console.log(i));
   */
  forEach(callback: Callback<T>): void {
    for (const item of this._iterable) {
      callback(item);
    }
  }

  /**
   * Determines whether the sequence includes the given element,
   * returning true or false as appropriate. The check is done
   * using '==='.
   *
   * @example
   * // Returns true
   * from([1, 2, 3]).includes(3);
   */
  includes(searchItem: T): boolean {
    for (const item of this._iterable) {
      if (item === searchItem) {
        return true;
      }
    }

    return false;
  }

  /**
   * Maps the sequence to a new sequence where each item is converted
   * to a new value using the given mapper function.
   *
   * @example
   * // Returns [2, 4, 6]
   * from([1, 2, 3]).map(x => x * 2);
   */
  map<TResult>(mapFn: SelectorFn<T, TResult>): Enumerable<TResult> {
    return from(this._map(mapFn));
  }

  private *_map<TResult>(
    mapFn: SelectorFn<T, TResult>
  ): IterableIterator<TResult> {
    for (const item of this._iterable) {
      yield mapFn(item);
    }
  }

  /**
   * Executes a reducer function on each item in the sequence resulting
   * in a single output value.
   */
  reduce<U>(callback: ReduceCallback<U, T>, accumulator: U): U {
    for (const item of this._iterable) {
      accumulator = callback(accumulator, item);
    }

    return accumulator;
  }

  /**
   * Reverses the order of the items in the sequence
   *
   * @example
   * // Returns [3, 2, 1]
   * from([1, 2, 3]).reverse().toArray();
   */
  reverse(): Enumerable<T> {
    return from(this._reverse());
  }

  private *_reverse(): IterableIterator<T> {
    const items = Array.from(this._iterable);

    for (let i = items.length - 1; i >= 0; i--) {
      yield items[i];
    }
  }

  /**
   * Skips the first N items in the sequence
   *
   * @example
   * // Returns [3, 4]
   * from([1, 2, 3, 4]).skip(2);
   */
  skip(howMany: number): Enumerable<T> {
    return from(this._skip(howMany));
  }

  private *_skip(howMany: number): IterableIterator<T> {
    let numSkipped = 0;

    for (const item of this._iterable) {
      if (numSkipped < howMany) {
        numSkipped++;
        continue;
      }

      yield item;
    }
  }

  /**
   * Sorts the elements of a sequence in ascending order according to a key
   * by using a specified comparer.
   *
   * @param keySelector  A function to extract a key from an element.
   * @param comparer     A function to compare the keys
   */
  sortBy<TKey = T>(
    keySelector?: KeySelectorFn<T, TKey>,
    comparer?: ComparerFn<TKey>
  ): OrderedEnumerable<T, TKey> {
    return new OrderedEnumerable(this._iterable, keySelector, comparer);
  }

  /**
   * Sorts the elements of a sequence in descending order according to a key
   * by using a specified comparer.
   *
   * @param keySelector  A function to extract a key from an element.
   * @param comparer     A function to compare the keys
   */
  sortByDescending<TKey = T>(
    keySelector?: KeySelectorFn<T, TKey>,
    comparer?: ComparerFn<TKey>
  ): OrderedEnumerable<T, TKey> {
    return new OrderedEnumerable(this._iterable, keySelector, comparer, true);
  }

  /**
   * Takes the firt N items from the sequence
   *
   * @example
   * // Returns [1, 2]
   * from([1, 2, 3, 4]).take(2);
   */
  take(howMany: number): Enumerable<T> {
    return from(this._take(howMany));
  }

  private *_take(howMany: number): IterableIterator<T> {
    let numTaken = 0;

    for (const item of this._iterable) {
      if (numTaken < howMany) {
        numTaken++;
        yield item;
      } else {
        break;
      }
    }
  }

  /**
   * Converts the sequence to an array
   *
   * @example
   * // Return [1, 2, 3]
   * from([1, 2, 3]).toArray();
   */
  toArray(): T[] {
    return Array.from(this);
  }

  /**
   * Converts the sequence to a Map using the given keySelectorFn and
   * possible elementSelectorFn.
   *
   * @example
   * // Returns map with elements:
   * // 1 -> { id: 1, name: "John" }
   * // 2 -> { id: 2, name: "Jane"}
   * const users = [{ id: 1, name: "John" }, { id: 2, name: "Jane"}]
   * from(users).toMap(u => u.id);
   *
   * @param keySelectorFn
   * @param elementSelectorFn
   */
  toMap<TKey, TElement = T>(
    keySelectorFn: SelectorFn<T, TKey>,
    elementSelectorFn?: SelectorFn<T, TElement>
  ): Map<TKey, TElement> {
    const map = new Map<TKey, TElement>();

    for (const item of this) {
      const key = keySelectorFn(item);
      const value = elementSelectorFn ? elementSelectorFn(item) : item;

      map.set(key, value as TElement);
    }

    return map;
  }

  /**
   * Converts the sequence to a Set
   *
   * @example
   * // Return a Set with elements 1, 2, 3
   * from([1, 1, 2, 3]).toSet();
   */
  toSet(): Set<T> {
    return new Set(this);
  }
}

/**
 * Ordered sequence of elements
 */
export class OrderedEnumerable<TItem, TKey> extends Enumerable<TItem> {
  private _keySelector?: KeySelectorFn<TItem, TKey>;
  private _comparer: ComparerFn<TKey>;

  constructor(
    iterable: Iterable<TItem>,
    keySelector?: KeySelectorFn<TItem, TKey>,
    comparer?: ComparerFn<TKey>,
    descending: boolean = false
  ) {
    super(iterable);

    this._keySelector = getKeySelectorOrDefault(keySelector);
    this._comparer = getComparerOrDefault(descending, comparer);
  }

  [Symbol.iterator](): Iterator<TItem> {
    const items = Array.from(this._iterable);

    return items.sort(this.getComparerForSort())[Symbol.iterator]();
  }

  private getComparerForSort(): ComparerFn<TItem> | undefined {
    if (this._keySelector) {
      return (a, b) =>
        this._comparer(this._keySelector!(a), this._keySelector!(b));
    } else {
      return undefined;
    }
  }
}