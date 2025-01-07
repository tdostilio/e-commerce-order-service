import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: PrismaService;

  // Mock all Prisma operations we'll need
  const mockPrismaService = {
    order: {
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
        OrdersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  // CREATE
  describe('create', () => {
    it('should create an order successfully', async () => {
      // Arrange
      const orderData = {
        sku: 'TEST-001',
        quantity: 100,
      };
      const expectedOrder = {
        id: '123',
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'pending',
        ...orderData,
      };
      mockPrismaService.order.create.mockResolvedValue(expectedOrder);

      // Act
      const result = await service.create(orderData);

      // Assert
      expect(result).toEqual(expectedOrder);
      expect(prisma.order.create).toHaveBeenCalledWith({
        data: { status: 'pending', ...orderData },
      });
    });

    it('should handle quantity of zero error', async () => {
      // Arrange
      const orderData = {
        sku: 'TEST-001',
        quantity: 0,
      };
      mockPrismaService.order.create.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['sku'] },
      });

      // Act & Assert
      await expect(service.create(orderData)).rejects.toThrow();
    });
  });

  // READ
  describe('findAll', () => {
    it('should return all products', async () => {
      // Arrange
      const expectedOrders = [
        { id: '1', sku: 'Product 1', quantity: 100, status: 'pending' },
        { id: '2', sku: 'Product 2', quantity: 200, status: 'pending' },
      ];
      mockPrismaService.order.findMany.mockResolvedValue(expectedOrders);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual(expectedOrders);
      expect(prisma.order.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a product if found', async () => {
      // Arrange
      const expectedOrder = {
        id: '123',
        sku: 'TEST-001',
        quantity: 100,
        status: 'pending',
      };
      mockPrismaService.order.findUnique.mockResolvedValue(expectedOrder);

      // Act
      const result = await service.findOne('123');

      // Assert
      expect(result).toEqual(expectedOrder);
      expect(prisma.order.findUnique).toHaveBeenCalledWith({
        where: { id: '123' },
      });
    });

    it('should throw an error if product not found', async () => {
      // Arrange
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      // Assert
      await expect(service.findOne('nonexistent')).rejects.toThrow();
    });
  });

  // UPDATE
  describe('update', () => {
    it('should update a product successfully', async () => {
      // Arrange
      const updateData = { sku: 'TEST-001', quantity: 10 };
      const expectedOrder = {
        id: '123',
        ...updateData,
        updatedAt: new Date(),
        status: 'pending',
      };
      mockPrismaService.order.update.mockResolvedValue(expectedOrder);

      // Act
      const result = await service.update('123', updateData);

      // Assert
      expect(result).toEqual(expectedOrder);
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: '123', status: 'pending' },
        data: { ...updateData },
      });
    });

    it('should throw error if product not found during update', async () => {
      // Arrange
      mockPrismaService.order.update.mockRejectedValue({
        code: 'P2025', // Prisma's "Record not found" error
      });

      // Act & Assert
      await expect(
        service.update('nonexistent', { quantity: 10 }),
      ).rejects.toThrow();
    });
  });

  // DELETE
  describe('remove', () => {
    it('should delete a product successfully', async () => {
      // Arrange
      const orderToDelete = {
        id: '123',
      };
      mockPrismaService.order.delete.mockResolvedValue(orderToDelete);

      // Act
      const result = await service.remove('123');

      // Assert
      expect(result).toEqual(orderToDelete);
      expect(prisma.order.delete).toHaveBeenCalledWith({
        where: { id: '123' },
      });
    });

    it('should throw error if product not found during delete', async () => {
      // Arrange
      mockPrismaService.order.delete.mockRejectedValue({
        code: 'P2025',
      });

      // Act & Assert
      await expect(service.remove('nonexistent')).rejects.toThrow();
    });
  });
});
