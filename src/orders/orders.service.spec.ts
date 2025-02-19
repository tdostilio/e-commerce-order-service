import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from './enums/order-status.enum';
import { OrderNotFoundError } from './errors/order.errors';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: PrismaService;
  let mockInventoryClient: { emit: jest.Mock; connect: jest.Mock };

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
        {
          provide: 'INVENTORY_SERVICE',
          useValue: { emit: jest.fn(), connect: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prisma = module.get<PrismaService>(PrismaService);
    mockInventoryClient = module.get('INVENTORY_SERVICE');
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
        data: {
          status: 'pending',
          orderData: {},
          ...orderData,
        },
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

  // DELETE
  describe('cancelOrder', () => {
    it('should cancel an order successfully', async () => {
      // Arrange
      const orderToCancel = {
        id: '123',
        status: OrderStatus.CANCELLING,
      };
      mockPrismaService.order.update.mockResolvedValue(orderToCancel);

      // Act
      const result = await service.cancelOrder('123');

      // Assert
      expect(result).toEqual(orderToCancel);
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: { status: OrderStatus.CANCELLING },
      });
      expect(mockInventoryClient.emit).toHaveBeenCalledWith('order.cancelled', {
        orderId: '123',
      });
    });

    it('should throw error if order not found during cancellation', async () => {
      // Arrange
      mockPrismaService.order.update.mockRejectedValue(
        new OrderNotFoundError('nonexistent'),
      );

      // Act & Assert
      await expect(service.cancelOrder('nonexistent')).rejects.toThrow(
        OrderNotFoundError,
      );
    });
  });
});
