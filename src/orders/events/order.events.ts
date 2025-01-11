/**
 * Event interfaces for order-related messages via RabbitMQ
 * These define the contract between the order service and inventory service
 */

// Sent when inventory service confirms stock reservation
export interface ReservationConfirmedEvent {
  orderId: string;
}

// Sent when inventory service cannot reserve stock
export interface ReservationFailedEvent {
  orderId: string;
}

// Sent when inventory service confirms cancellation
export interface ReservationCancelledEvent {
  orderId: string;
}
