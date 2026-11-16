import { H3, InternalLink, List, P, Section } from "../terms/parts";

// プライバシーポリシーの英語版。日本語版(PrivacyJa)の翻訳で、食い違うときは日本語版が優先する(冒頭にもそう書く)。
// 日本語版を変えたら、こちらも合わせて変えること(根拠のコードの一覧は PrivacyJa の冒頭)。

const UPDATED = "November 15, 2026";

export function PrivacyEn() {
  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium text-text-primary">Privacy Policy</h1>
        <p className="font-mono text-xs text-text-muted">Last updated: {UPDATED}</p>
        <p className="rounded-control border border-border-subtle bg-bg-raised px-3 py-2 text-xs leading-6 text-text-secondary">
          This English version is a translation provided for convenience. If it differs from the Japanese version, the
          Japanese version prevails.
        </p>
        <P>
          This Privacy Policy (the “Policy”) explains how the operator of shaders.art (the “Service”) collects, uses,
          and protects information about users. The Service is run by an individual operator (the “operator”).
        </P>
      </div>

      <Section title="1. Operator">
        <List>
          <li>Operator: unz47</li>
          <li>Contact: chipandquu0403@icloud.com</li>
          <li>The operator’s address will be provided without delay on request.</li>
        </List>
      </Section>

      <Section title="2. Information we collect">
        <H3>2.1 Accounts</H3>
        <P>
          Sign-in uses Amazon Cognito from Amazon Web Services (AWS). When you create an account, the following is
          stored in Cognito.
        </P>
        <List>
          <li>Your email address</li>
          <li>
            Your password. You enter it on the Cognito sign-in page, and Cognito manages it. It never reaches the
            Service’s servers, and the operator cannot see it.
          </li>
          <li>
            Your account ID (a value assigned by Cognito), when the account was created, and whether your email address
            has been verified
          </li>
        </List>
        <P>
          The account ID is used to link your works, favorites, and Make with AI usage counts to your account. It is not
          shown to other users. Your email address is shown only on your own screen while you are signed in.
        </P>

        <H3>2.2 Works you post</H3>
        <List>
          <li>Title, author name, description, tags, code, license, whether it is public or private, and when it was posted</li>
          <li>Your account ID, to check who owns the work</li>
        </List>
        <P>
          Public works can be viewed by anyone, including people who are not signed in. The author name is shown with
          them. The author name is self-declared for each post, and your email address is never shown on a work. On the
          Service, a private work (one you made private, or one made private after reports or by the operator) can be
          viewed only by the person who posted it and the operator.
        </P>
        <P>
          The account ID stored with a work is not made public, so other people cannot link together works you posted
          under different author names.
        </P>

        <H3>2.3 Favorites and reports</H3>
        <P>
          Which account favorited which work, and when. The number of favorites on each work is public, but who
          favorited it is not.
        </P>
        <P>
          When you report a work, we keep which account reported which work, when, for which reason, and any details
          you added. The operator uses this to review the work. Who reported a work and the number of reports are
          not shown to other users, including the author. The operator’s screen does not show who reported it either.
          When several reports make a work private automatically, the author is told only that.
        </P>

        <H3 id="ai">2.4 Make with AI</H3>
        <List>
          <li>
            Your request, the work’s code at that moment, and the recent exchange in the panel (up to 6 previous requests
            and replies). These are sent to the AI model to create a suggestion (see section 4 for where). The operator
            does not store their content.
          </li>
          <li>
            For each account, the number of requests, credits used, and cost per day and per month. These are stored to
            manage usage limits.
          </li>
          <li>
            A record of each request: the account ID, the model used, the number of tokens used, the cost, and the
            reason when a request was refused because of a limit or congestion. This is kept in the server records
            (logs). It does not include your request or code.
          </li>
        </List>

        <H3>2.5 Usage records (analytics)</H3>
        <P>
          As described in <InternalLink href="/terms#records">“Usage records” in the Terms of Service</InternalLink>, the
          following is kept in the server records (logs).
        </P>
        <List>
          <li>
            The path of each page you open, the domain of the site you came from (if you came from another site), the
            display language, and whether you use a smartphone. The query part of the URL (such as search terms) and
            the part after # (such as draft code) are not recorded. When a work embedded in another site is shown, the
            domain of that site may be recorded.
          </li>
          <li>
            A value used to count visits by the same person: a hash of your IP address and browser information
            (User-Agent) combined with a secret value that is replaced every month. Your IP address itself is not
            recorded. The secret value is deleted when the month ends, so the records cannot be traced back to a person
            or linked across months.
          </li>
        </List>
        <P>
          These records are not linked to accounts and do not use cookies. If your browser is set not to be tracked
          (Global Privacy Control or Do Not Track), they are not sent.
        </P>

        <H3>2.6 Information handled in transit</H3>
        <List>
          <li>
            The Service is delivered through Amazon CloudFront and protected by AWS WAF. To block IP addresses that send
            many requests in a short time, WAF counts requests per IP address.
          </li>
          <li>
            WAF keeps sample requests (including the IP address, the URL opened, and browser information) for about 3
            hours. The operator may view them in the AWS console when investigating unauthorized access.
          </li>
          <li>CloudFront access logs (a record of every request) are not enabled.</li>
          <li>When a problem occurs on the server, the error is kept in the server records (logs).</li>
        </List>
      </Section>

      <Section title="3. Why we use it">
        <List>
          <li>To sign you in and confirm that an account is yours</li>
          <li>To provide the features of the Service, such as posting and showing works, favorites, and Make with AI</li>
          <li>To manage usage limits for Make with AI and keep track of its cost</li>
          <li>To prevent unauthorized or excessive access and keep the Service running safely</li>
          <li>To understand how the Service is used and improve it</li>
          <li>
            To answer your inquiries, and to contact you when something important must be communicated, such as a change
            to the terms
          </li>
          <li>To deal with conduct that violates the Terms of Service</li>
        </List>
        <P>The operator does not use the information for any other purpose, and does not use it for advertising.</P>
      </Section>

      <Section id="processors" title="4. Outside services and where information is sent">
        <P>
          The operator uses services from the following companies to run the Service. These companies handle
          information on the operator’s behalf.
        </P>

        <H3>4.1 Amazon Web Services (AWS)</H3>
        <List>
          <li>
            Used for the server (AWS Lambda), data storage (Amazon DynamoDB), sign-in (Amazon Cognito), server records
            (Amazon CloudWatch Logs), delivery (Amazon CloudFront), protection against unauthorized access (AWS WAF),
            and AI models (Amazon Bedrock).
          </li>
          <li>
            Accounts, works, favorites, Make with AI usage counts, and server records are stored in the AWS Tokyo region
            (Japan).
          </li>
          <li>
            CloudFront, WAF, and the function that signs requests from CloudFront to the server (Lambda@Edge) process
            requests at locations around the world close to the user, so requests may pass through locations outside
            Japan. The WAF configuration is in a US region (N. Virginia).
          </li>
        </List>

        <H3>4.2 AI models</H3>
        <P>
          Make with AI requests (the content described in 2.4) are sent to one of the following, depending on the model
          you choose in the panel.
        </P>
        <List>
          <li>
            Models on Amazon Bedrock (AWS): Qwen3 Coder, gpt-oss, MiniMax, Devstral, Kimi, Claude Sonnet 4.6, and Claude
            Haiku 4.5. They are processed in the AWS Tokyo region. Claude Sonnet 4.6 and Claude Haiku 4.5 are called with
            a setting that keeps processing in Japan (Tokyo and Osaka). According to AWS, content sent to Bedrock is not
            shared with the model developers.
          </li>
          <li>
            Models on Claude Platform on AWS: Claude Haiku 5.5, Claude Sonnet 5.5, and Claude Opus 5.5 (only when they
            are available in the panel). This service is operated by Anthropic, PBC in the United States. Your request is
            sent to Anthropic and may be processed outside Japan. Anthropic handles it under its own terms and policies.
          </li>
        </List>
        <P>
          What is sent to the AI does not include your email address or account ID. Do not write personal information
          about yourself or others in your requests or code.
        </P>

        <H3>4.3 Sharing with third parties</H3>
        <P>The operator does not provide personal information to third parties, except in the following cases.</P>
        <List>
          <li>When you consent</li>
          <li>When required by law</li>
          <li>
            When permitted by law, such as when it is necessary to protect someone’s life, body, or property and it is
            difficult to obtain your consent
          </li>
        </List>
        <P>
          The companies in 4.1 and 4.2 handling information on the operator’s behalf is not “providing” in this sense.
          Public works (including the author name) can be viewed by anyone.
        </P>
      </Section>

      <Section id="cookies" title="5. Cookies and storage on your device">
        <H3>5.1 Cookies</H3>
        <List>
          <li>sa_id … shows that you are signed in. Expires in about 1 hour.</li>
          <li>sa_refresh … keeps you signed in. Expires in 30 days.</li>
          <li>sa_oauth … checks that sign-in follows the correct steps while it is in progress. Expires in 10 minutes.</li>
          <li>lang … the language you chose with the switch in the footer. Expires in 1 year.</li>
        </List>
        <P>
          Sign-in cookies cannot be read by JavaScript on the page. The sign-in page (on the Amazon Cognito domain) also
          uses cookies for sign-in. No cookies are used for advertising or for tracking across sites.
        </P>

        <H3>5.2 Browser storage</H3>
        <P>
          The following are stored only in your browser (localStorage) and are not sent to the server: the display
          theme, the draft code and title you are editing, the position of the editor’s dividers, whether the AI panel is
          closed and which model you chose, and your learning progress.
        </P>
        <P>
          Code is sent to the server only when you post a work or send a request to Make with AI. You can delete cookies
          and browser storage in your browser settings. Deleting the sign-in cookies signs you out.
        </P>
      </Section>

      <Section title="6. How long we keep it">
        <List>
          <li>Accounts … until you ask for deletion</li>
          <li>Works … until the author or the operator deletes them. Deleting a work also deletes its favorites and reports immediately.</li>
          <li>Reports … until the operator reviews the work and restores it, or the work is deleted</li>
          <li>Favorites … until you remove them. They are deleted immediately when removed.</li>
          <li>Make with AI usage counts … about 8 days for daily records, about 13 months for monthly records</li>
          <li>Server records (analytics, records of each Make with AI request, errors) … 13 months</li>
          <li>The secret value for analytics … until the end of that month</li>
          <li>WAF sample requests … about 3 hours (set by AWS)</li>
        </List>
        <P>Expired records are deleted automatically. Deletion may take a few days.</P>
      </Section>

      <Section title="7. Security measures">
        <List>
          <li>Communication is encrypted with HTTPS.</li>
          <li>Passwords are managed by Cognito and never reach the Service’s servers.</li>
          <li>Sign-in cookies cannot be read by JavaScript on the page.</li>
          <li>
            The server can only be reached through CloudFront, and the operations the server can perform on data are
            limited to those it needs.
          </li>
          <li>Only the operator can access the stored information.</li>
          <li>Analytics does not keep IP addresses themselves.</li>
          <li>
            The country where information is stored, and the foreign countries involved in delivery and AI processing, are
            described in section 4.
          </li>
        </List>
      </Section>

      <Section id="requests" title="8. Checking, correcting, and deleting your information">
        <H3>8.1 What you can do on the Service</H3>
        <List>
          <li>Remove favorites</li>
          <li>Make your work private, make it public again, or delete it (from “Manage” on the work’s page)</li>
          <li>Change your password from “Forgot your password?” on the sign-in page</li>
          <li>Sign out</li>
          <li>Delete cookies and browser storage in your browser settings</li>
          <li>Turn off analytics by setting your browser not to be tracked</li>
        </List>

        <H3>8.2 Requests to the operator</H3>
        <P>
          Editing a posted work, deleting your account, and changing your email address cannot yet be done on the
          Service. Please send a request to chipandquu0403@icloud.com.
        </P>
        <P>
          You can also ask the operator, regarding your information that the operator holds, to notify you of the
          purposes of use, to disclose it (including records of provision to third parties), to correct, add to, or delete it, to stop
          using or erase it, or to stop providing it to third parties. Please send requests to chipandquu0403@icloud.com.
        </P>
        <List>
          <li>We confirm your identity using the email address registered to your account.</li>
          <li>There is no fee.</li>
          <li>
            We respond without delay, except where the law allows us to refuse. If we cannot respond, we will tell you
            why.
          </li>
          <li>
            Server records (logs) are hard to delete one entry at a time, so they may remain until the period in section
            6 has passed, even after your account is deleted.
          </li>
        </List>
        <P>Questions and complaints about this Policy are also accepted at chipandquu0403@icloud.com.</P>
      </Section>

      <Section title="9. Changes to this Policy">
        <P>
          The operator may change this Policy as needed. The revised Policy takes effect when it is posted on the
          Service. When the purposes of use are changed, they are changed within the scope permitted by law, and the
          changes are posted on the Service.
        </P>
      </Section>

      <Section title="10. Effective date">
        <P>This Policy applies from November 15, 2026.</P>
      </Section>
    </>
  );
}
