export interface ReservationConfirmedEvent {
  orderId: string;
}

export interface ReservationFailedEvent {
  orderId: string;
}

export interface ReservationCancelledEvent {
  orderId: string;
}
