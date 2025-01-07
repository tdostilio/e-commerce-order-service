export class OrderNotFoundError extends Error {
  constructor(id: string) {
    super(`ORDER_NOT_FOUND:${id}`);
    this.name = 'OrderNotFoundError';
  }
}

export class InvalidParameterError extends Error {
  constructor(message: string) {
    super(`INVALID_PARAMETER:${message}`);
    this.name = 'InvalidParameterError';
  }
}
