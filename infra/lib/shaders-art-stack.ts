import { CfnOutput, Stack, type StackProps } from "aws-cdk-lib";
import type { ICertificate } from "aws-cdk-lib/aws-certificatemanager";
import type { Construct } from "constructs";
import { Auth } from "./auth.ts";
import { NextjsSite } from "./nextjs-site.ts";
import { WorksTable } from "./works-table.ts";

export interface ShadersArtStackProps extends StackProps {
  /** WafStack(us-east-1)の Web ACL ARN。クロスリージョンで受け取る */
  webAclArn: string;
  /** 独自ドメイン(例: shaders.art)。bin/shaders-art.ts が cdk.json の context "domainName" から渡す */
  domainName?: string;
  /** domainName の証明書(WafStack が us-east-1 で作ったもの) */
  certificate?: ICertificate;
}

// 構成: 利用者 → CloudFront(+ WAF) → Lambda(SSR, Next.js本体 + Route Handler) → DynamoDB
//                                         └→ Cognito(Hosted UI でログイン)
// 利用者に近いリージョン(ap-northeast-1)に置く。WAF だけは仕様上 us-east-1 にしか
// 作れないので WafStack に分けてあり、ここでは ARN を受け取るだけ(bin/shaders-art.ts 参照)。
// 以前はAPI Gateway + 専用Lambdaで作品APIだけ別サーバーにしていたが、
// SSR移行に伴いNext.jsのRoute Handlerに統合し、SSRと同じLambdaで動かす
// (詳細はNotionの設計判断欄)。
export class ShadersArtStack extends Stack {
  constructor(scope: Construct, id: string, props: ShadersArtStackProps) {
    super(scope, id, props);

    // 本番のオリジン。cdk.json の context "siteUrl"(理由は auth.ts の AuthProps.siteUrl)。
    // 独自ドメインがあって siteUrl が空なら、そのドメインにする
    const siteUrl =
      parseSiteUrl(this.node.tryGetContext("siteUrl")) ?? (props.domainName ? `https://${props.domainName}` : undefined);
    // Claude Platform on AWS のワークスペース ID。cdk.json の context "claudeWorkspaceId"(無ければ Claude は選べない)
    const claudeWorkspaceId = parseWorkspaceId(this.node.tryGetContext("claudeWorkspaceId"));
    // AI を上限なしで使える人(運営)のメールアドレス(カンマ区切り)。公開リポジトリなので cdk.json には書かず、
    // デプロイのときに -c aiUnlimitedEmails=… で渡す
    const aiUnlimitedEmails = parseEmails(this.node.tryGetContext("aiUnlimitedEmails"), "aiUnlimitedEmails");
    // 運営(通報の一覧・作品の非公開と削除ができる人)のメールアドレス(カンマ区切り)。aiUnlimitedEmails と同じく
    // デプロイのときに -c adminEmails=… で渡す。確認済みのアドレスだけが運営になる(src/lib/moderation の isAdmin)
    const adminEmails = parseEmails(this.node.tryGetContext("adminEmails"), "adminEmails");

    const { table } = new WorksTable(this, "WorksTable");
    const auth = new Auth(this, "Auth", { siteUrl });
    const { nextjs } = new NextjsSite(this, "Site", {
      table,
      webAclArn: props.webAclArn,
      auth,
      siteUrl,
      claudeWorkspaceId,
      aiUnlimitedEmails,
      adminEmails,
      domain: props.domainName && props.certificate ? { domainName: props.domainName, certificate: props.certificate } : undefined,
    });

    new CfnOutput(this, "SiteUrl", { value: nextjs.url });
    new CfnOutput(this, "TableName", { value: table.tableName });
    new CfnOutput(this, "UserPoolId", { value: auth.userPool.userPoolId });
    new CfnOutput(this, "UserPoolClientId", { value: auth.client.userPoolClientId });
    new CfnOutput(this, "CognitoDomain", { value: auth.domainUrl });
  }
}

function parseSiteUrl(value: unknown): string | undefined {
  if (value === undefined || value === "") return undefined;
  if (typeof value !== "string" || !/^https:\/\/[^/]+$/.test(value)) {
    throw new Error(`context "siteUrl" は "https://<host>" の形で、末尾スラッシュ無しで指定してください: ${String(value)}`);
  }
  return value;
}

function parseEmails(value: unknown, name: string): string | undefined {
  if (value === undefined || value === "") return undefined;
  if (typeof value !== "string" || !value.split(",").every((email) => /^[^@\s,]+@[^@\s,]+$/.test(email.trim()))) {
    throw new Error(`context "${name}" はカンマ区切りのメールアドレスで指定してください: ${String(value)}`);
  }
  return value;
}

function parseWorkspaceId(value: unknown): string | undefined {
  if (value === undefined || value === "") return undefined;
  if (typeof value !== "string" || !/^wrkspc_[A-Za-z0-9]+$/.test(value)) {
    throw new Error(`context "claudeWorkspaceId" は "wrkspc_…" の形で指定してください: ${String(value)}`);
  }
  return value;
}
