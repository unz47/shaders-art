import { Duration, RemovalPolicy, Stack } from "aws-cdk-lib";
import {
  AccountRecovery,
  FeaturePlan,
  OAuthScope,
  UserPool,
  UserPoolClient,
  UserPoolClientIdentityProvider,
} from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

export interface AuthProps {
  /** Hosted UI のドメイン接頭辞。開発用スタックでは本番と分ける */
  domainPrefix?: string;
  /**
   * 本番サイトのオリジン(例: https://dxxxx.cloudfront.net)。末尾スラッシュ無し。
   * Cognito のコールバック URL に登録する。
   *
   * CloudFront のドメインは Nextjs コンストラクトが作るまで決まらず、しかも Lambda が
   * このクライアントの ID を環境変数で受け取るため、ここで distribution を参照すると
   * 循環参照になる(Lambda → Client → Distribution → Function URL → Lambda)。
   * なので cdk.json の context `siteUrl` で文字列として渡す。初回デプロイ後に CloudFront の
   * ドメインを書き込んで再デプロイする。独自ドメインを当てたらその URL に差し替える。
   */
  siteUrl?: string;
}

// ログイン(投稿・いいね・将来の AI 機能に必要。閲覧は不要)。
// Hosted UI + Authorization Code + PKCE。トークン交換はサーバー(Route Handler)で行い、
// トークンは httpOnly クッキーに入れるので、ブラウザの JS からは触れない。
export class Auth extends Construct {
  readonly userPool: UserPool;
  readonly client: UserPoolClient;
  /** Hosted UI のベース URL(https://<prefix>.auth.<region>.amazoncognito.com) */
  readonly domainUrl: string;

  constructor(scope: Construct, id: string, props: AuthProps) {
    super(scope, id);

    const origins = ["http://localhost:3000", ...(props.siteUrl ? [props.siteUrl] : [])];

    this.userPool = new UserPool(this, "UserPool", {
      // Lite: 従来の Hosted UI が使え、無料枠は Essentials と同じで超過単価が安い
      featurePlan: FeaturePlan.LITE,
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      // 表示名は投稿ごとの自己申告にしているので、必須属性は増やさない
      // (必須属性は作成後に変更できないため、プロフィール設計が決まるまで最小にしておく)
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const domain = this.userPool.addDomain("Domain", {
      cognitoDomain: { domainPrefix: props.domainPrefix ?? `shaders-art-${Stack.of(this).account}` },
    });
    this.domainUrl = domain.baseUrl();

    this.client = this.userPool.addClient("WebClient", {
      // PKCE を使う公開クライアント。シークレットを Lambda の環境変数に平文で置かずに済む
      generateSecret: false,
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [OAuthScope.OPENID, OAuthScope.EMAIL, OAuthScope.PROFILE],
        callbackUrls: origins.map((o) => `${o}/api/auth/callback`),
        logoutUrls: origins.map((o) => `${o}/`),
      },
      supportedIdentityProviders: [UserPoolClientIdentityProvider.COGNITO],
      preventUserExistenceErrors: true,
      idTokenValidity: Duration.hours(1),
      accessTokenValidity: Duration.hours(1),
      refreshTokenValidity: Duration.days(30),
    });
  }
}
