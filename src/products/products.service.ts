import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import {
  DuplicateSkuError,
  ProductNotFoundError,
} from './errors/product.errors';

// @Injectable() marks this as a service that can be injected into other classes
@Injectable()
export class ProductsService {
  // Prisma is automatically injected by NestJS's dependency injection
  constructor(private prisma: PrismaService) {}

  // Get all products from the database
  async findAll() {
    return this.prisma.product.findMany();
  }

  // Get a single product by ID
  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new ProductNotFoundError(id);
    }

    return product;
  }

  // Create a new product
  async create(data: CreateProductDto) {
    try {
      return await this.prisma.product.create({
        data, // Prisma will validate this matches our schema
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new DuplicateSkuError();
      }
      throw error;
    }
  }

  // Update an existing product
  // Partial<CreateProductDto> means all fields are optional
  async update(id: string, data: Partial<CreateProductDto>) {
    try {
      return await this.prisma.product.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new ProductNotFoundError(id);
      }
      throw error;
    }
  }

  // Delete a product
  async remove(id: string) {
    try {
      return await this.prisma.product.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new ProductNotFoundError(id);
      }
      throw error;
    }
  }
}
