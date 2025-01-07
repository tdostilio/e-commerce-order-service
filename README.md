# Order Service

A NestJS microservice for managing orders in our e-commerce platform.

## Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose
- Yarn

## Getting Started

1. **Clone the repository**

   ```
   git clone <repository-url>
   ```

2. **Set up environment variables**
   Copy the example env file

   ```
   cp .env.example .env
   ```

   The .env file should contain:

   ```
   DATABASE_URL="mongodb://localhost:27018/orders?replicaSet=rs0_orders&directConnection=true"
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

The service runs on `http://localhost:3001` with the following endpoints:

- `POST /api/orders` - Create an order
- `GET /api/orders` - List all orders
- `GET /api/orders/:id` - Get a single order
- `PUT /api/orders/:id` - Update an order
- `DELETE /api/orders/:id` - Delete an order

Documentation is available at `http://localhost:3001/api/docs`

## Example Request

Create an order

```
curl -X POST http://localhost:3001/api/orders \
-H "Content-Type: application/json" \
-d '{
"sku": "TEST-001",
"quantity": 100
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
