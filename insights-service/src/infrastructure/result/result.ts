export default class ResultEx<T, E = Error> {
  public readonly isSuccess: boolean;
  private readonly _data?: T;
  private readonly _error?: E;

  private constructor(isSuccess: boolean, data?: T, error?: E) {
    this.isSuccess = isSuccess;
    this._data = data;
    this._error = error;
  }

  public static success<T = void, E = never>(data?: T): ResultEx<T, E> {
    return new ResultEx<T, E>(true, data);
  }

  public static failure<T = never, E = never>(error: E): ResultEx<T, E> {
    return new ResultEx<T, E>(false, undefined, error);
  }

  public get data(): T {
    if (!this.isSuccess) {
      throw new Error("No data on failure");
    }
    return this._data as T;
  }

  public get error(): E {
    if (this.isSuccess) {
      throw new Error("No error on success");
    }
    return this._error as E;
  }
}
