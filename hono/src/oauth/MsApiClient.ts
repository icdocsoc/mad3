import { AuthorizationCodeCredential } from "@azure/identity";
import { Client } from "@microsoft/microsoft-graph-client";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials";

const tenantId = process.env.TENANT_ID!;
const clientId = process.env.CLIENT_ID!;
const clientSecret = process.env.CLIENT_SECRET!;
const redirectUri = `http://${process.env.BASE_URL}/api/oauth/callback`;

const msAuthEndpoint =
  "https://login.microsoftonline.com/2b897507-ee8c-4575-830b-4f8267c3d307/oauth2/v2.0";

export default class MsApiClient {
  graphClient: Client | undefined;

  static ClientNotInitializedError = class extends Error {
    constructor() {
      super(
        "Microsoft Graph Client not initialized. Initiailize with `verifyAndConsumeCode(code)` before attempting to use the API."
      );
      this.name = "ClientNotInitializedError";
    }
  };

  public constructor(private scopes: string[]) {}

  public getRedirectUrl(): string {
    const scopeUrls = this.scopes.map(
      (val) => `https://graph.microsoft.com/${val}`
    );
    // Todo: Add a state & build url
    return `${msAuthEndpoint}/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&response_mode=query&prompt=consent&scope=${scopeUrls.join(
      " "
    )}`;
  }

  public static getRedirectUrl(scopes: string[]): string {
    // const signInUrl = buildUrl(msAuthEndpoint, {
    //     path: 'authorize',
    //     queryParams: {
    //         client_id: clientId,
    //         response_type: 'code',
    //         redirect_uri: redirectUri,
    //         scope: [].join(' '),
    //         response_mode: 'query',
    //         prompt: 'consent',
    //     }
    // })!

    const scopeUrls = scopes.map((val) => `https://graph.microsoft.com/${val}`);
    return `${msAuthEndpoint}/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&response_mode=query&prompt=consent&scope=${scopeUrls.join(
      " "
    )}`;
  }

  public verifyAndConsumeCode(code: string) {
    const creds = new AuthorizationCodeCredential(
      tenantId,
      clientId,
      clientSecret,
      code!,
      redirectUri
    );

    const authProvider = new TokenCredentialAuthenticationProvider(creds, {
      scopes: this.scopes,
    });

    this.graphClient = Client.initWithMiddleware({
      authProvider: authProvider,
    });

    // TODO: Throw an error if this fails.
  }

  private checkClient() {
    if (!this.graphClient) throw new MsApiClient.ClientNotInitializedError();
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

    // TODO: handle call properly
  }
}
