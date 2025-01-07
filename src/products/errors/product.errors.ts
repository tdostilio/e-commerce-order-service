export class DuplicateSkuError extends Error {
  constructor() {
    super('DUPLICATE_SKU');
    this.name = 'DuplicateSkuError';
  }
}

export class ProductNotFoundError extends Error {
  constructor(id: string) {
    super(`PRODUCT_NOT_FOUND:${id}`);
    this.name = 'ProductNotFoundError';
  }
}
