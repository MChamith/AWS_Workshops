import axios, { AxiosError } from 'axios';
import { faker } from '@faker-js/faker';


import {
    OrdersTestFixture,
    Order,
    OrdersData,
    OrdersTestFixtureConfig,
    UsersData,
    User
} from './orders-fixtures';

import envJson from './env.json';

type EnvConfig = {
    users: UsersData;
    orders: OrdersData;
};

describe('Orders api service', () => {
    const envConfig = envJson as EnvConfig;
    const { users: userEnvConfig, orders: ordersEnvConfig } = envConfig;
    const fixture = new OrdersTestFixture(userEnvConfig, ordersEnvConfig);
    let config: OrdersTestFixtureConfig;
    beforeAll(async () => {
        config = await fixture.setup();
    }, 10000);

    afterAll(async () => {
        await fixture.tearDown();
    });

    describe('Unauthenticated user', () => {
        it('should not have access to api', async () => {
            expect.assertions(2);

            const orderRequest: Order = {
                resturantId: 'unauthenticated-restaurant',
                orderId: "1123",
                orderItems: [],
                totalAmount: 0,
                status: 'PLACED',
            };

            try {
                await axios.post(`${config.ordersConfig.apiEndpoint}orders`, orderRequest);
                fail('Expected unauthenticated request to fail');
            } catch (error) {
                expect(error).toBeInstanceOf(AxiosError);
                expect((error as AxiosError).response?.status).toBe(401);
            }
        });
    });

    describe('Add new order', () => {
        let regularUser: User;

        beforeAll(async () => {
            const username = faker.internet.userName();
            regularUser = await fixture.createUser(`${username}@example.com`);

        });

        it('should add order successfully for authenticated user', async () => {
            expect.assertions(4);
            const orderRequest: Order = {
                resturantId: 'dv4()1',
                orderId: "1123",
                orderItems: [
                    {
                        id: 1,
                        name: 'Spaghetti',
                        price: 9.99,
                        quantity: 1,
                    },
                    {
                        id: 2,
                        name: 'Pizza - SMALL',
                        price: 4.99,
                        quantity: 2,
                    },
                ],
                totalAmount: 19.97,
                status: 'PLACED',
            };

            const createdOrder = await fixture.createOrder(regularUser, orderRequest);
        
            const createdOrderId = (createdOrder.orderId as string | undefined)
                ?? ((createdOrder.data as Record<string, unknown> | undefined)?.orderId as string | undefined);
            const createdOrderData = createdOrder.data as Record<string, unknown> | undefined;

            expect(createdOrderId).toEqual(orderRequest.orderId);
            expect(createdOrderData?.restaurantId).toEqual(orderRequest.resturantId);
            expect(createdOrderData?.status).toEqual('PLACED');
            expect(createdOrderData?.orderItems).toBeDefined();
        });
    });

  describe('Get order', () => {
    let regularUser: User;
    let orderRequest: Order;

    beforeAll(async () => {
      const username = faker.internet.userName();
      regularUser = await fixture.createUser(`${username}@example.com`);

      orderRequest = {
        resturantId: 'rest-get-123',
        orderId: faker.string.uuid(),
        orderItems: [
          {
            id: 101,
            name: 'Tacos',
            price: 7.5,
            quantity: 3,
          },
        ],
        totalAmount: 22.5,
        status: 'PLACED',
      };

      await fixture.createOrder(regularUser, orderRequest);
    });

    it('should retrieve existing order for authenticated user', async () => {
      expect.assertions(4);
      const retrievedOrder = await fixture.getOrder(regularUser, orderRequest.orderId);
      const retrievedOrderData = retrievedOrder.data as Record<string, unknown> | undefined;

      expect(retrievedOrder.orderId).toEqual(orderRequest.orderId);
      expect(retrievedOrderData?.restaurantId).toEqual(orderRequest.resturantId);
      expect(retrievedOrderData?.status).toEqual('PLACED');
      expect(retrievedOrderData?.orderItems).toEqual(orderRequest.orderItems);
    });
  });
});
