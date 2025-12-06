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

    public hasData(): this is { isSuccess: true } {
        return this.isSuccess === true && this._data !== undefined;
    }

    public get data(): T {
        if (!this.isSuccess) {
            throw new Error('No data on failure');
        }
        return this._data as T;
    }

    public get error(): E {
        if (this.isSuccess) {
            throw new Error('No error on success');
        }
        return this._error as E;
    }

    // Back-compat alias for existing code that expects `result.errors`
    public get errors(): E {
        return (this._error as unknown) as E;
    }

    public map<U>(fn: (data: T) => U): ResultEx<U, E> {
        return this.isSuccess ? ResultEx.success(fn(this.data)) : ResultEx.failure(this.error);
    }

    public mapError<F>(fn: (error: E) => F): ResultEx<T, F> {
        return this.isSuccess ? ResultEx.success(this.data) : ResultEx.failure(fn(this.error));
    }

    public fold<R>(onErr: (e: E) => R, onOk: (t: T) => R): R {
        return this.isSuccess ? onOk(this.data) : onErr(this.error);
    }
}
