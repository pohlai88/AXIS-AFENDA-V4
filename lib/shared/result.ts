export type Ok<T> = { ok: true; value: T }
export type Err<E> = { ok: false; error: E }
export type Result<T, E> = Ok<T> | Err<E>

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value })
export const err = <E>(error: E): Err<E> => ({ ok: false, error })

/**
 * Checks if a Result is Ok
 */
export const isOk = <T, E>(result: Result<T, E>): result is Ok<T> => result.ok

/**
 * Checks if a Result is Err
 */
export const isErr = <T, E>(result: Result<T, E>): result is Err<E> => !result.ok

/**
 * Maps the Ok value of a Result
 */
export const map = <T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> => {
    return result.ok ? ok(fn(result.value)) : result
}

/**
 * Maps the Err value of a Result
 */
export const mapErr = <T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> => {
    return result.ok ? result : err(fn(result.error))
}

/**
 * Chains Results together
 */
export const flatMap = <T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E> => {
    return result.ok ? fn(result.value) : result
}

/**
 * Returns the Ok value or a default
 */
export const unwrapOr = <T, E>(result: Result<T, E>, defaultValue: T): T => {
    return result.ok ? result.value : defaultValue
}

/**
 * Returns the Ok value or throws the error
 */
export const unwrap = <T, E>(result: Result<T, E>): T => {
    if (result.ok) return result.value
    throw result.error
}

/**
 * Converts a Promise to a Result
 */
export const fromPromise = async <T, E = Error>(promise: Promise<T>): Promise<Result<T, E>> => {
    try {
        const value = await promise
        return ok(value)
    } catch (error) {
        return err(error as E)
    }
}

/**
 * Creates a Result from a function that might throw
 */
export const fromThrowable = <T, E = Error>(fn: () => T, errorFn?: (error: unknown) => E): Result<T, E> => {
    try {
        return ok(fn())
    } catch (error) {
        return err(errorFn ? errorFn(error) : error as E)
    }
}
