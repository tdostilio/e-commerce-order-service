# Product Service

A NestJS microservice for managing products in our e-commerce platform.

## Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose
- Yarn

## Getting Started

1. **Clone the repository**

   ```
   git clone <repository-url>
   cd e-commerce/packages/product-service
   ```

2. **Set up environment variables**
   Copy the example env file

   ```
   cp .env.example .env
   ```

   The .env file should contain:

   ```
   DATABASE_URL="mongodb://localhost:27017/products?replicaSet=rs0&directConnection=true"
   ```

3. **Start MongoDB with Docker**

   ```
   docker compose up -d
   ```

4. **Run the application**

   ```
   yarn start
   ```

5. **Install dependencies**

   ```
   yarn install
   ```

6. **Generate Prisma client**

   ```
   yarn prisma generate
   ```

7. **Start the development server**
   ```
   yarn start:dev
   ```

## API Endpoints

The service runs on `http://localhost:3000` with the following endpoints:

- `POST /api/products` - Create a product
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get a single product
- `PUT /api/products/:id` - Update a product
- `DELETE /api/products/:id` - Delete a product

Documentation is available at `http://localhost:3000/api/docs`

## Example Request

Create a product

```
curl -X POST http://localhost:3000/api/products \
-H "Content-Type: application/json" \
-d '{
"name": "Test Product",
"description": "A test product",
"price": 29.99,
"sku": "TEST-001",
"stock": 100
}'
```

## Development

- `yarn start:dev` - Start with hot-reload
- `yarn start:debug` - Start with debugging
- `yarn test` - Run tests
- `yarn lint` - Run linting

## Troubleshooting

1. **MongoDB Connection Issues**

   - Ensure Docker is running
   - Try restarting the containers: `docker-compose down -v && docker-compose up -d`
   - Check MongoDB logs: `docker-compose logs mongodb`

2. **Prisma Issues**
   - Regenerate Prisma client: `yarn prisma:generate`
   - Reset database: `yarn prisma:reset`

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

MIT
