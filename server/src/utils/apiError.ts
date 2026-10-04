// An expected error with an HTTP status code. Thrown from controllers and
// middleware, and turned into a JSON response by errorHandler.
export class ApiError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}
