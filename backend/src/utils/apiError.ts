export class ApiError extends Error {
  statusCode: number;
  code?: string;

  constructor(statusCode: number, message: string, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static badRequest(message: string, code?: string): ApiError {
    return new ApiError(400, message, code);
  }

  static unauthorized(message: string = 'Unauthorized', code?: string): ApiError {
    return new ApiError(401, message, code);
  }

  static forbidden(message: string = 'Forbidden', code?: string): ApiError {
    return new ApiError(403, message, code);
  }

  static notFound(message: string = 'Resource not found', code?: string): ApiError {
    return new ApiError(404, message, code);
  }

  static internal(message: string = 'Internal server error', code?: string): ApiError {
    return new ApiError(500, message, code);
  }

  static tooManyRequests(message: string = 'Too many requests', code?: string): ApiError {
    return new ApiError(429, message, code);
  }
}
