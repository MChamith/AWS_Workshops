import {
  AdminAddUserToGroupCommand,
  AdminConfirmSignUpCommand,
  AdminDeleteUserCommand,
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  ResourceNotFoundException,
  SignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";

import {
  GetRandomPasswordCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";

export interface UsersData {
  apiEndpoint: string;
  userPool: string;
  userPoolClient: string;
  userPoolAdminGroupName: string;
}

export interface User {
  username: string;
  password: string;
  sub: string;
  idToken: string;
  accessToken: string;
  refreshToken: string;
}

export class UsersTestFixture {
  private readonly cognitoClient: CognitoIdentityProviderClient;
  private readonly secretsManagerClient: SecretsManagerClient;
  private readonly createdUsers: User[];

  private envConfig: UsersData;
  private userApi?: string;
  private userPool?: string;
  private userPoolClient?: string;
  private userPoolAdminGroupName?: string;

  constructor(envConfig: UsersData) {
    this.cognitoClient = new CognitoIdentityProviderClient({});
    this.secretsManagerClient = new SecretsManagerClient();
    this.createdUsers = [];
    this.envConfig = envConfig;
  }

  public async setup(): Promise<UsersData> {
    this.userApi = this.envConfig.apiEndpoint;
    this.userPool = this.envConfig.userPool;
    this.userPoolClient = this.envConfig.userPoolClient;
    this.userPoolAdminGroupName = this.envConfig.userPoolAdminGroupName;

    return {
      apiEndpoint: this.userApi,
      userPool: this.userPool,
      userPoolClient: this.userPoolClient,
      userPoolAdminGroupName: this.userPoolAdminGroupName,
    };
  }

  public async createUser(username: string): Promise<User> {
    if (!this.userPoolClient || !this.userPool) {
      throw new Error("UsersTestFixture is not initialised. Call setup() first.");
    }

    const randomPasswordCommand = new GetRandomPasswordCommand({
      ExcludeCharacters: "\"'`[]{}():;,$/\\<>|=&",
      RequireEachIncludedType: true,
    });

    const passwordResponse = await this.secretsManagerClient.send(
      randomPasswordCommand
    );
    const password = passwordResponse.RandomPassword || "";
    const userAttributes = [{ Name: "name", Value: username }];

    const idpResponse = await this.cognitoClient.send(
      new SignUpCommand({
        ClientId: this.userPoolClient,
        Username: username,
        Password: password,
        UserAttributes: userAttributes,
      })
    );

    await this.cognitoClient.send(
      new AdminConfirmSignUpCommand({
        UserPoolId: this.userPool,
        Username: username,
      })
    );

    const response = await this.cognitoClient.send(
      new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password,
        },
        ClientId: this.userPoolClient,
      })
    );

    const authenticationResult = response.AuthenticationResult;
    if (!authenticationResult) {
      throw new Error("AuthenticationResult is undefined");
    }

    const user = {
      username,
      password,
      sub: idpResponse.UserSub || "",
      idToken: authenticationResult.IdToken || "",
      accessToken: authenticationResult.AccessToken || "",
      refreshToken: authenticationResult.RefreshToken || "",
    };

    this.createdUsers.push(user);
    return user;
  }

  public async getUser(
    username: string,
    password: string,
    sub: string
  ): Promise<User> {
    if (!this.userPoolClient) {
      throw new Error("UsersTestFixture is not initialised. Call setup() first.");
    }

    const response = await this.cognitoClient.send(
      new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password,
        },
        ClientId: this.userPoolClient,
      })
    );

    const authenticationResult = response.AuthenticationResult;
    if (!authenticationResult) {
      throw new Error("AuthenticationResult is undefined");
    }

    return {
      username,
      password,
      sub,
      idToken: authenticationResult.IdToken || "",
      accessToken: authenticationResult.AccessToken || "",
      refreshToken: authenticationResult.RefreshToken || "",
    };
  }

  public async addUserToAdminGroup(username: string): Promise<void> {
    if (!this.userPool || !this.userPoolAdminGroupName) {
      throw new Error("UsersTestFixture is not initialised. Call setup() first.");
    }

    await this.cognitoClient.send(
      new AdminAddUserToGroupCommand({
        UserPoolId: this.userPool,
        Username: username,
        GroupName: this.userPoolAdminGroupName,
      })
    );
  }

  public async tearDown(): Promise<void> {
    for (const user of this.createdUsers) {
      await this.deleteUser(user.username);
    }
    this.createdUsers.length = 0;
  }

  private async deleteUser(username: string): Promise<void> {
    if (!this.userPool) {
      return;
    }
    try {
      await this.cognitoClient.send(
        new AdminDeleteUserCommand({
          UserPoolId: this.userPool,
          Username: username,
        })
      );
    } catch (error) {
      if (!(error instanceof ResourceNotFoundException)) {
        throw error;
      }
    }
  }
}

