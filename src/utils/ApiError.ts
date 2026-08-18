export class ApiError extends Error {
  public statusCode: number;
  public errors: string[];
  public isOperational: boolean; // true = expected error (bad input), false = bug
  public code?: string; // machine-readable, for cases the frontend needs to branch on (not just display)

  constructor(
    statusCode: number,
    message: string,
    errors: string[] = [],
    code?: string,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    if (code !== undefined) {
      this.code = code;
    }
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

  static conflict(message: string, code?: string) {
    return new ApiError(409, message, [], code);
  }

  static tooManyRequests(message = "Too many requests") {
    return new ApiError(429, message);
  }

  static internal(message = "Internal server error") {
    return new ApiError(500, message);
  }
}