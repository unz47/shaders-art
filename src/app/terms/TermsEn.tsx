import { findLicense, type LicenseId, licenseUrl } from "@/lib/submission";
import { ExternalLink, H3, List, P, Section } from "./parts";

// 利用規約の英語版。日本語版(TermsJa)の翻訳で、食い違うときは日本語版が優先する(冒頭にもそう書く)。
// 日本語版を変えたら、こちらも合わせて変えること。

const UPDATED = "October 24, 2026";

/** クリエイティブ・コモンズの説明ページ(英語) */
const cc = (id: LicenseId) => licenseUrl(findLicense(id)!, "en");

export function TermsEn() {
  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium text-text-primary">Terms of Service</h1>
        <p className="font-mono text-xs text-text-muted">Last updated: {UPDATED}</p>
        <p className="rounded-control border border-border-subtle bg-bg-raised px-3 py-2 text-xs leading-6 text-text-secondary">
          This English version is a translation provided for convenience. If it differs from the Japanese version, the
          Japanese version prevails.
        </p>
        <P>
          These Terms of Service (the “Terms”) set out the conditions for using shaders.art (the “Service”). By using the
          Service, you (the “User”) agree to these Terms.
        </P>
      </div>

      <Section title="1. About the Service">
        <P>
          The Service lets you write and run GLSL shader works, and post and exhibit them. You can view works without
          signing in. Signing in is required to post works, use favorites, and use Make with AI.
        </P>
      </Section>

      <Section title="2. Accounts">
        <List>
          <li>You are responsible for managing your own account.</li>
          <li>
            The author name shown on a work is self-declared. You may not use an author name that impersonates someone
            else.
          </li>
        </List>
      </Section>

      <Section title="3. Works you post">
        <List>
          <li>
            You may post only works that you made or that you have the right to post. If you build on someone else’s
            work, follow the license of the original work.
          </li>
          <li>
            The operator may make private or delete, without notice, any work that violates these Terms or that may
            infringe the rights of others.
          </li>
        </List>
      </Section>

      <Section id="license" title="4. Licenses for works">
        <H3>4.1 Copyright</H3>
        <P>
          The copyright in a posted work stays with its author. Posting a work to the Service does not transfer its
          copyright to the operator.
        </P>

        <H3>4.2 License to the operator</H3>
        <P>
          The author grants the operator, free of charge, permission to store, reproduce, display, and distribute the
          work, and to create still images and videos (such as thumbnails) from it, to the extent necessary to provide,
          improve, and promote the Service. This applies to works under any license.
        </P>

        <H3 id="standard">4.3 shaders.art Standard</H3>
        <P>
          This is the default license when posting. For works under “shaders.art Standard,” the author grants other
          users, free of charge, permission for the following uses through the features of the Service:
        </P>
        <List>
          <li>Viewing the work on the Service</li>
          <li>
            Displaying the work as a stream background, a wallpaper, or an embed in a web page through the “Stream &
            embed” feature on the work page (including on monetized streams and sites)
          </li>
          <li>
            Using the Service’s remix feature to make a new work based on the work and post it to the Service. A remix
            shows the original work’s author and title, and is also under “shaders.art Standard”
          </li>
        </List>
        <P>
          Copying, modifying, distributing, or selling the work’s code outside the Service requires the author’s
          permission. This does not restrict uses permitted by copyright law (such as running it on your own computer to
          learn).
        </P>

        <H3>4.4 CC BY 4.0</H3>
        <P>
          Works under “CC BY 4.0” may be used by anyone, including outside the Service, under the{" "}
          <ExternalLink href={cc("CC-BY-4.0")}>Creative Commons Attribution 4.0 International License</ExternalLink>.
          People who use them credit the author and the license. This license cannot be revoked later.
        </P>

        <H3>4.5 Licenses that were available before</H3>
        <P>
          <ExternalLink href={cc("CC0-1.0")}>CC0 1.0</ExternalLink> and{" "}
          <ExternalLink href={cc("CC-BY-NC-SA-4.0")}>CC BY-NC-SA 4.0</ExternalLink> were also available before. Works
          under them may be used under the terms of each license.
        </P>

        <H3>4.6 When a work is made private or deleted</H3>
        <P>
          Once a work is made private or deleted, other users can no longer use it through the features of the Service.
          Remixes already made, and copies already received under licenses such as CC BY, remain under the license that
          applied at that time.
        </P>
      </Section>

      <Section title="5. Prohibited conduct">
        <List>
          <li>Conduct that violates laws or public order and morals</li>
          <li>Conduct that infringes the rights of others (such as copyright or portrait rights)</li>
          <li>
            Posting works that put excessive load on the Service or on users’ devices, or accessing the Service
            excessively
          </li>
          <li>Unauthorized access, or using someone else’s account</li>
          <li>Any other conduct that interferes with the operation of the Service</li>
        </List>
      </Section>

      <Section title="6. Make with AI">
        <List>
          <li>AI suggestions may contain mistakes. You decide whether to apply a suggestion.</li>
          <li>
            Your requests and the work’s code are sent to the AI provider (such as Amazon Web Services) to create
            suggestions.
          </li>
        </List>
      </Section>

      <Section title="7. Disclaimer">
        <List>
          <li>
            The Service is provided as is. The operator does not guarantee that the Service will run without
            interruption, or that works are fit for any particular purpose.
          </li>
          <li>The operator may change the Service or stop providing it.</li>
        </List>
      </Section>

      <Section title="8. Changes to these Terms">
        <P>
          The operator may change these Terms as needed. The revised Terms take effect when they are posted on the
          Service.
        </P>
      </Section>

      <Section title="9. Governing law">
        <P>These Terms are governed by and interpreted under the laws of Japan.</P>
      </Section>
    </>
  );
}
