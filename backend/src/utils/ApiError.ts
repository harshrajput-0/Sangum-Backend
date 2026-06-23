export class ApiError extends Error {
  public statusCode: number;
  public errors: string[];
  public isOperational: boolean; // true = expected error (bad input), false = bug

  constructor(statusCode: number, message: string, errors: string[] = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  // Static Error Helper
  static badRequest(message: string, errors: string[] = []) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = "Unauthorized") {
    return new ApiError(401, message);
  }

  static forbidden(message = "Forbidden") {
    return new ApiError(403, message);
  }

  static notFound(message = "Resource not found") {
    return new ApiError(404, message);
  }

  static conflict(message: string) {
    return new ApiError(409, message);
  }

  static tooManyRequests(message = "Too many requests") {
    return new ApiError(429, message);
  }

  static internal(message = "Internal server error") {
    return new ApiError(500, message);
  }
}

// class ApiError extends Error{
//     statusCode: number;
//     data = null;
//     success = false;
//     errors: unknown[];

//     constructor(
//         statusCode: number,
//         message: string = "Something Went Wrong",
//         errors: unknown[] = [],
//     ){
//         super(message)

//         this.statusCode = statusCode;
//         this.errors = errors;

//         Error.captureStackTrace(this, this.constructor);
//     }
// }

export default ApiError;
