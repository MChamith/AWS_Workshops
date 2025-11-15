declare module 'order-utils' {
  export interface Order {
    userId: string;
    orderId: string;
    restaurantId: string;
    totalAmount: number;
    orderItems: Record<string, unknown>[];
    status: string;
    orderTime: string;
  }

  export const getOrder: (userId: string, orderId: string) => Promise<Order>;
}

