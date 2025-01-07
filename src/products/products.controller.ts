import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import {
  DuplicateSkuError,
  ProductNotFoundError,
} from './errors/product.errors';

// @Controller('products') creates routes starting with /products
@ApiTags('products')
@Controller('products')
export class ProductsController {
  // ProductsService is automatically injected
  constructor(private readonly productsService: ProductsService) {}

  // @Get() creates a GET /products endpoint
  @Get()
  @ApiOperation({ summary: 'Get all products' })
  async findAll() {
    return this.productsService.findAll();
  }

  // @Get(':id') creates a GET /products/:id endpoint
  // @Param('id') extracts the id from the URL
  @Get(':id')
  @ApiOperation({ summary: 'Get a product by id' })
  @ApiResponse({ status: 200, description: 'Return the product.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  async findOne(@Param('id') id: string) {
    try {
      return await this.productsService.findOne(id);
    } catch (error) {
      if (error instanceof ProductNotFoundError) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }
      throw error;
    }
  }

  // @Post() creates a POST /products endpoint
  // @Body() extracts the request body and validates it against CreateProductDto
  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({
    status: 201,
    description: 'The product has been created successfully.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async create(@Body() createProductDto: CreateProductDto) {
    try {
      return await this.productsService.create(createProductDto);
    } catch (error) {
      if (error instanceof DuplicateSkuError) {
        throw new BadRequestException('A product with this SKU already exists');
      }
      throw error;
    }
  }

  // @Put(':id') creates a PUT /products/:id endpoint
  @Put(':id')
  @ApiOperation({ summary: 'Update a product' })
  @ApiResponse({
    status: 200,
    description: 'The product has been updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  async update(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateProductDto>,
  ) {
    try {
      return await this.productsService.update(id, updateData);
    } catch (error) {
      if (error instanceof ProductNotFoundError) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }
      throw error;
    }
  }

  // @Delete(':id') creates a DELETE /products/:id endpoint
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product' })
  @ApiResponse({
    status: 200,
    description: 'The product has been deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  async remove(@Param('id') id: string) {
    try {
      return await this.productsService.remove(id);
    } catch (error) {
      if (error instanceof ProductNotFoundError) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }
      throw error;
    }
  }
}
