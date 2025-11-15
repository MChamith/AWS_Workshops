import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DeleteCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

import { UsersTestFixture } from "./users-fixture";
import type { User, UsersData } from "./users-fixture";

export type { UsersData, User } from "./users-fixture";

export interface OrdersData {
  apiEndpoint: string;
  tableName: string;
}

export interface Order {
  resturantId: string;
  totalAmount: number;
  orderItems: Record<string, unknown>[];
  orderId: string;
  status?: string;
}

export interface OrdersTestFixtureConfig {
  userConfig: UsersData;
  ordersConfig: OrdersData;
}

export class OrdersTestFixture {
  private readonly documentClient: DynamoDBDocumentClient;
  private readonly usersFixture: UsersTestFixture;
  private readonly createdOrderIds: string[];

  private ordersConfig: OrdersData;
  private ordersApiBaseUrl?: string;
  private ordersTableName?: string;

  constructor(userEnvConfig: UsersData, ordersEnvConfig: OrdersData) {
    this.documentClient = DynamoDBDocumentClient.from(new DynamoDBClient());
    this.usersFixture = new UsersTestFixture(userEnvConfig);
    this.ordersConfig = ordersEnvConfig;
    this.createdOrderIds = [];
  }

  public async setup(): Promise<OrdersTestFixtureConfig> {
    const userConfig = await this.usersFixture.setup();

    this.ordersTableName = this.ordersConfig.tableName;
    this.ordersApiBaseUrl = this.ordersConfig.apiEndpoint;

    return {
      userConfig: userConfig,
      ordersConfig: this.ordersConfig,
    };
  }

  public async createUser(username: string): Promise<User> {
    return this.usersFixture.createUser(username);
  }

  public async getUser(
    username: string,
    password: string,
    sub: string
  ): Promise<User> {
    return this.usersFixture.getUser(username, password, sub);
  }

  public async addUserToAdminGroup(username: string): Promise<void> {
    await this.usersFixture.addUserToAdminGroup(username);
  }

  public async createOrder(
    user: User,
    order: Order
  ): Promise<Record<string, unknown>> {
    if (!this.ordersApiBaseUrl) {
      throw new Error("Orders API is not initialised. Call setup() first.");
    }

    const fetchFn = (globalThis as { fetch?: any }).fetch;
    if (typeof fetchFn !== "function") {
      throw new Error("Fetch API is not available in the current runtime.");
    }

    const response = await fetchFn(`${this.ordersApiBaseUrl}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${user.idToken}`,
      },
      body: JSON.stringify(order),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Failed to create order: ${response.status} ${response.statusText} - ${errorBody}`
      );
    }

    const payload = (await response.json()) as Record<string, unknown>;
    const orderId = this.extractOrderId(payload);
    if (orderId) {
      this.createdOrderIds.push(orderId);
    }

    return payload;
  }

  public async getOrder(
    user: User,
    orderId: string
  ): Promise<Record<string, unknown>> {
    if (!this.ordersApiBaseUrl) {
      throw new Error("Orders API is not initialised. Call setup() first.");
    }

    const fetchFn = (globalThis as { fetch?: any }).fetch;
    if (typeof fetchFn !== "function") {
      throw new Error("Fetch API is not available in the current runtime.");
    }

    const response = await fetchFn(`${this.ordersApiBaseUrl}/orders/${orderId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${user.idToken}`,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Failed to get order: ${response.status} ${response.statusText} - ${errorBody}`
      );
    }

    return (await response.json()) as Record<string, unknown>;
  }


  public async tearDown(): Promise<void> {
    await this.usersFixture.tearDown();
  }


  private extractOrderId(payload: Record<string, unknown>): string | undefined {
    const orderId = payload.orderId;
    if (typeof orderId === "string") {
      return orderId;
    }

    const data = payload.data as Record<string, unknown> | undefined;
    if (data && typeof data.orderId === "string") {
      return data.orderId;
    }

    return undefined;
  }
}

