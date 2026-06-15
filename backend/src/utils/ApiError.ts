class ApiError extends Error{
    statusCode: number;
    data = null;
    success = false;
    errors: unknown[];

    constructor(
        statusCode: number,
        message: string = "Something Went Wrong",
        errors: unknown[] = [],
    ){
        super(message)

        this.statusCode = statusCode;
        this.errors = errors;

        Error.captureStackTrace(this, this.constructor);
    }
}

export default ApiError;