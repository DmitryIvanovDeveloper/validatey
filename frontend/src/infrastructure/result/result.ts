export default class Result<T, E = Error> {
    public readonly isSuccess: boolean;
    public readonly isFailure: boolean;
    private readonly _data?: T;
    private readonly _error?: E;

    private constructor(isSuccess: boolean, data?: T, error?: E) {
        this.isSuccess = isSuccess;
        this.isFailure = !isSuccess;
        this._data = data;
        this._error = error;
    }

    public static success<T = void, E = never>(data?: T): Result<T, E> {
        return new Result<T, E>(true, data);
    }

    public static failure<T = never, E = never>(error: E): Result<T, E> {
        return new Result<T, E>(false, undefined, error);
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

    public map<U>(fn: (data: T) => U): Result<U, E> {
        return this.isSuccess ? Result.success(fn(this.data)) : Result.failure(this.error);
    }

    public mapError<F>(fn: (error: E) => F): Result<T, F> {
        return this.isSuccess ? Result.success(this.data) : Result.failure(fn(this.error));
    }

    public fold<R>(onErr: (e: E) => R, onOk: (t: T) => R): R {
        return this.isSuccess ? onOk(this.data) : onErr(this.error);
    }
}
