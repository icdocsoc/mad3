import { AuthorizationCodeCredential } from "@azure/identity";
import { Client } from "@microsoft/microsoft-graph-client";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials";

type Secrets = {
  tenantId: string;
  clientId: string;
  clientSecret: string;
};

export class MsAuthClient {
  graphClient: Client | undefined;
  msAuthEndpoint: string;

  public constructor(
    private scopes: string[],
    private secrets: Secrets,
    private redirectUri: string
  ) {
    this.msAuthEndpoint = `https://login.microsoftonline.com/${secrets.tenantId}/oauth2/v2.0`;
  }

  public getRedirectUrl(): string {
    const scopeUrls = this.scopes.map(
      (val) => `https://graph.microsoft.com/${val}`
    );
    // Todo: Add a state & build url
    return `${this.msAuthEndpoint}/authorize?client_id=${
      this.secrets.clientId
    }&response_type=code&redirect_uri=${
      this.redirectUri
    }&response_mode=query&prompt=consent&scope=${scopeUrls.join(" ")}`;
  }

  public verifyAndConsumeCode(code: string): TypedGraphClient {
    const creds = new AuthorizationCodeCredential(
      this.secrets.tenantId,
      this.secrets.clientId,
      this.secrets.clientSecret,
      code!,
      this.redirectUri
    );

    const authProvider = new TokenCredentialAuthenticationProvider(creds, {
      scopes: this.scopes,
    });

    const graphClient = Client.initWithMiddleware({
      authProvider: authProvider,
    });

    return new TypedGraphClient(graphClient);
    // TODO: Throw an error if this fails.
  }
}

export class TypedGraphClient {
  static ClientNotInitializedError = class extends Error {
    constructor() {
      super(
        "Microsoft Graph Client not initialized. Initiailize with `verifyAndConsumeCode(code)` before attempting to use the API."
      );
      this.name = "ClientNotInitializedError";
    }
  };

  public constructor(private graphClient: Client) {}

  private checkClient() {
    if (!this.graphClient)
      throw new TypedGraphClient.ClientNotInitializedError();
  }

  public async msGet<K extends string>(
    path: string,
    select?: K[]
  ): Promise<Record<K, string>> {
    this.checkClient();

    if (!select) {
      return (await this.graphClient!.api(path).get()) as Record<K, any>;
    } else {
      const res: Partial<Record<K, any>> = {};
      const apiCall = await this.graphClient!.api(path)
        .select(select.join(","))
        .get();
      select.forEach((key) => {
        res[key] = apiCall[key];
      });
      return res as Record<K, any>;
    }

    // TODO: check if call failed, select failed, etc.
  }
}
