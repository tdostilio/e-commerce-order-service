/**
 * Custom error classes for order-related operations
 * These help with error handling and provide meaningful error messages
 */

// Thrown when an order cannot be found by ID
export class OrderNotFoundError extends Error {
  constructor(id: string) {
    super(`ORDER_NOT_FOUND:${id}`);
    this.name = 'OrderNotFoundError';
  }
}

// Thrown when invalid parameters are provided
export class InvalidParameterError extends Error {
  constructor(message: string) {
    super(`INVALID_PARAMETER:${message}`);
    this.name = 'InvalidParameterError';
  }
}
