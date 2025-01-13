import { Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { OrdersService } from '../orders.service';
import {
  ReservationConfirmedEvent,
  ReservationFailedEvent,
} from '../events/order.events';

@Controller()
export class OrdersMessageController {
  constructor(private readonly ordersService: OrdersService) {}

  @EventPattern('inventory.reservation_confirmed')
  async handleReservationConfirmed(event: ReservationConfirmedEvent) {
    await this.ordersService.handleReservationConfirmed(event);
  }

  @EventPattern('inventory.reservation_failed')
  async handleReservationFailed(event: ReservationFailedEvent) {
    await this.ordersService.handleReservationFailed(event);
  }
}
