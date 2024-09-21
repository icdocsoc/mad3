import { buildUrl } from 'build-url-ts';

type Secrets = {
  tenantId: string;
  clientId: string;
  clientSecret: string;
};

// https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow

// Todo: custom errors


export class MsAuthClient {
  msAuthEndpoint: string;
  scopeUrls: string[];
  statesTail = -1;
  // We only want to ensure the request originated from our website,
  // hence no identifiable information. An in memory array as your request
  // should be done pretty fast + we have a maxStates variable.
  states = [] as (string | undefined)[];

  public constructor(
    private scopes: string[],
    private secrets: Secrets,
    private redirectUri: string,
    private maxStates: number = 200
  ) {
    this.msAuthEndpoint = `https://login.microsoftonline.com/${secrets.tenantId}/oauth2/v2.0`;
    this.scopeUrls = this.scopes.map(
      val => `https://graph.microsoft.com/${val}`
    );
  }

  public getRedirectUrl(state?: string): string {
    const _state = state || crypto.randomUUID();
    this.statesTail = (this.statesTail + 1) % this.maxStates;
    this.states[this.statesTail] = _state;

    const url = buildUrl(this.msAuthEndpoint, {
      path: '/authorize',
      queryParams: {
        client_id: this.secrets.clientId,
        redirect_uri: this.redirectUri,
        scope: this.scopeUrls.join(' '),
        state: _state,
        response_type: 'code',
        response_mode: 'query',
        prompt: 'consent'
      }
    });

    return url;
  }

  public async verifyAndConsumeCode(code: string, state: string) {
    const index = this.states.indexOf(state);
    if (index == -1) {
      throw new Error(`Failed to verify code: Mismatched state.`);
    }
    this.states[index] = undefined;

    const req = await fetch(`${this.msAuthEndpoint}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: this.secrets.clientId,
        scope: this.scopeUrls.join(' '),
        code: code,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code',
        client_secret: this.secrets.clientSecret
      }).toString()
    });

    const res = await req.json();

    if (res.error)
      throw new Error(`Failed to verify code:\n ${res.error_description}`);

    return new MicrosoftGraphClient(
      res.access_token,
      res.refresh_token || null,
      res.expires_in,
      res.scope
    );
  }
}

export class MicrosoftGraphClient {
  public expiresAt: Date;
  private baseUrl = 'https://graph.microsoft.com/v1.0';

  public constructor(
    public access_token: string,
    public refresh_token: string | null,
    expires_in: number,
    public scope: string
  ) {
    this.expiresAt = new Date();
    this.expiresAt.setSeconds(this.expiresAt.getSeconds() + expires_in);
  }

  public async get<K extends string>(
    path: string,
    select?: K[]
  ): Promise<Record<K, string>> {
    const selectQuery =
      select == null
        ? undefined
        : {
            $select: select.join(',')
          };

    const url = buildUrl(this.baseUrl, {
      path: path,
      queryParams: selectQuery
    });

    const req = await fetch(url, {
      headers: {
        Authorization: this.access_token,
        'Content-Type': 'application/json'
      }
    });

    const res = await req.json();

    if (res.error) {
      throw new Error(`Microsoft Graph error:\n${res.error_description}`);
    }

    if (!select) {
      return res as Record<K, any>;
    } else {
      const toRet: Partial<Record<K, any>> = {};
      select.forEach(key => {
        toRet[key] = res[key];
      });
      return res as Record<K, any>;
    }

    // TODO: check if call failed, select failed, etc.
  }
}
