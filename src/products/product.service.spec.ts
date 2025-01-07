import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: PrismaService;

  // Mock all Prisma operations we'll need
  const mockPrismaService = {
    product: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  // CREATE
  describe('create', () => {
    it('should create a product successfully', async () => {
      // Arrange
      const productData = {
        name: 'Test Product',
        description: 'Test Description',
        price: 29.99,
        sku: 'TEST-001',
        stock: 100,
      };
      const expectedProduct = {
        id: '123',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...productData,
      };
      mockPrismaService.product.create.mockResolvedValue(expectedProduct);

      // Act
      const result = await service.create(productData);

      // Assert
      expect(result).toEqual(expectedProduct);
      expect(prisma.product.create).toHaveBeenCalledWith({ data: productData });
    });

    it('should handle duplicate SKU error', async () => {
      // Arrange
      const productData = {
        name: 'Test Product',
        description: 'Test Description',
        price: 29.99,
        sku: 'DUPLICATE',
        stock: 100,
      };
      mockPrismaService.product.create.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['sku'] },
      });

      // Act & Assert
      await expect(service.create(productData)).rejects.toThrow();
    });
  });

  // READ
  describe('findAll', () => {
    it('should return all products', async () => {
      // Arrange
      const expectedProducts = [
        { id: '1', name: 'Product 1' },
        { id: '2', name: 'Product 2' },
      ];
      mockPrismaService.product.findMany.mockResolvedValue(expectedProducts);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual(expectedProducts);
      expect(prisma.product.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a product if found', async () => {
      // Arrange
      const expectedProduct = {
        id: '123',
        name: 'Test Product',
      };
      mockPrismaService.product.findUnique.mockResolvedValue(expectedProduct);

      // Act
      const result = await service.findOne('123');

      // Assert
      expect(result).toEqual(expectedProduct);
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: '123' },
      });
    });

    it('should throw an error if product not found', async () => {
      // Arrange
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      // Assert
      await expect(service.findOne('nonexistent')).rejects.toThrow();
    });
  });

  // UPDATE
  describe('update', () => {
    it('should update a product successfully', async () => {
      // Arrange
      const updateData = { name: 'Updated Name', price: 39.99 };
      const expectedProduct = {
        id: '123',
        ...updateData,
        updatedAt: new Date(),
      };
      mockPrismaService.product.update.mockResolvedValue(expectedProduct);

      // Act
      const result = await service.update('123', updateData);

      // Assert
      expect(result).toEqual(expectedProduct);
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: updateData,
      });
    });

    it('should throw error if product not found during update', async () => {
      // Arrange
      mockPrismaService.product.update.mockRejectedValue({
        code: 'P2025', // Prisma's "Record not found" error
      });

      // Act & Assert
      await expect(
        service.update('nonexistent', { name: 'New Name' }),
      ).rejects.toThrow();
    });
  });

  // DELETE
  describe('remove', () => {
    it('should delete a product successfully', async () => {
      // Arrange
      const productToDelete = {
        id: '123',
        name: 'To Be Deleted',
      };
      mockPrismaService.product.delete.mockResolvedValue(productToDelete);

      // Act
      const result = await service.remove('123');

      // Assert
      expect(result).toEqual(productToDelete);
      expect(prisma.product.delete).toHaveBeenCalledWith({
        where: { id: '123' },
      });
    });

    it('should throw error if product not found during delete', async () => {
      // Arrange
      mockPrismaService.product.delete.mockRejectedValue({
        code: 'P2025',
      });

      // Act & Assert
      await expect(service.remove('nonexistent')).rejects.toThrow();
    });
  });
});
