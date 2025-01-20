# Order Service

A NestJS microservice for managing orders in our e-commerce platform.

## Prerequisites

- Docker and Docker Compose
- MongoDB Atlas account
- RabbitMQ (running via shared infrastructure https://github.com/tdostilio/local-infrastructure)

## Getting Started

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   ```

2. **Set up environment variables**
   Copy the example env file and update with your MongoDB Atlas URL

   ```bash
   cp .env.example .env
   ```

   The .env file should contain:

   ```
   DATABASE_URL="your-mongodb-atlas-connection-string"
   RABBITMQ_URL="amqp://guest:guest@localhost:5672"
   RABBITMQ_INVENTORY_QUEUE="inventory_queue"
   PORT=3001
   ```

3. **Start the service**

   ```bash
   # Ensure the message_broker_network exists
   docker network create message_broker_network || true

   # Start the development service
   docker compose up

   # Or for production build
   docker compose -f docker-compose.prod.yml up
   ```

## Debugging

- Debug port: 9229 (development only)
- Breakpoints can be set directly in TypeScript files
- Use the "Debug Order Service (Docker)" launch configuration in VSCode
- Hot reloading is enabled in development mode

## API Endpoints

The service runs on `http://localhost:3001` with the following endpoints:

- `POST /orders` - Create an order
- `GET /orders` - List all orders
- `GET /orders/:id` - Get a single order
- `DELETE /orders/:id` - Cancel an order

## Message Patterns

The service listens for the following RabbitMQ events:

- `inventory.reservation_confirmed` - Handle successful inventory reservations
- `inventory.reservation_failed` - Handle failed inventory reservations

## Documentation

Swagger documentation is available at `http://localhost:3001/api`
