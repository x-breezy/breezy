import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: "Terms and Conditions of use for Breezy.",
}

const LAST_UPDATED = "June 16, 2025"
const CONTACT_EMAIL = "legal@breezy.app"
const APP_NAME = "Breezy"
const COMPANY = "Breezy SAS"

export default function TermsPage() {
  return (
    <div className='min-h-screen bg-background'>
      <div className='mx-auto max-w-3xl px-6 py-16'>
        {/* Header */}
        <div className='mb-12'>
          <Link
            href='/'
            className='mb-8 inline-block font-geom text-2xl font-semibold tracking-tight text-foreground'
          >
            {APP_NAME}
          </Link>
          <h1 className='mt-6 text-3xl font-bold tracking-tight text-foreground'>
            Terms and Conditions
          </h1>
          <p className='mt-2 text-sm text-muted-foreground'>Last updated: {LAST_UPDATED}</p>
        </div>

        <div className='space-y-10 text-sm leading-7 text-foreground'>
          {/* Introduction */}
          <section>
            <p>
              Welcome to <strong>{APP_NAME}</strong>. These Terms and Conditions (&quot;Terms&quot;)
              govern your access to and use of the {APP_NAME} platform, including our website,
              mobile applications, and all related services (collectively, the &quot;Service&quot;),
              operated by <strong>{COMPANY}</strong> (&quot;we&quot;, &quot;us&quot;, or
              &quot;our&quot;).
            </p>
            <p className='mt-4'>
              By creating an account or using the Service in any way, you agree to be bound by these
              Terms. If you do not agree, you must not access or use the Service.
            </p>
          </section>

          <hr className='border-border' />

          {/* 1 */}
          <section>
            <h2 className='mb-4 text-lg font-semibold text-foreground'>1. Eligibility</h2>
            <ul className='list-disc space-y-2 pl-6 text-muted-foreground'>
              <li>
                You must be at least <strong>13 years old</strong> to use {APP_NAME}. If you are
                under 18, you must have consent from a parent or legal guardian.
              </li>
              <li>
                By using the Service, you represent and warrant that you meet these age requirements
                and that all information you provide is accurate and complete.
              </li>
              <li>
                The Service is not directed to children under 13. If we become aware that a user is
                under 13, we will immediately terminate their account.
              </li>
            </ul>
          </section>

          <hr className='border-border' />

          {/* 2 */}
          <section>
            <h2 className='mb-4 text-lg font-semibold text-foreground'>2. Account Registration</h2>
            <ul className='list-disc space-y-2 pl-6 text-muted-foreground'>
              <li>
                You must create an account to access most features of the Service. You agree to
                provide accurate, current, and complete information during registration.
              </li>
              <li>
                You are solely responsible for maintaining the confidentiality of your credentials
                and for all activities that occur under your account.
              </li>
              <li>
                You must notify us immediately at{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className='text-foreground underline'>
                  {CONTACT_EMAIL}
                </a>{" "}
                if you suspect unauthorized use of your account.
              </li>
              <li>
                We reserve the right to suspend or terminate accounts that violate these Terms or
                that we believe pose a risk to the Service or other users.
              </li>
              <li>
                You may not transfer your account to another person without our prior written
                consent.
              </li>
            </ul>
          </section>

          <hr className='border-border' />

          {/* 3 */}
          <section>
            <h2 className='mb-4 text-lg font-semibold text-foreground'>3. Acceptable Use</h2>
            <p className='mb-3 text-muted-foreground'>
              You agree to use {APP_NAME} only for lawful purposes and in accordance with these
              Terms. You must not:
            </p>
            <ul className='list-disc space-y-2 pl-6 text-muted-foreground'>
              <li>
                Post, share, or transmit any content that is unlawful, harmful, threatening,
                abusive, harassing, defamatory, vulgar, obscene, or otherwise objectionable.
              </li>
              <li>
                Impersonate any person or entity, or falsely claim an affiliation with any person or
                entity.
              </li>
              <li>
                Upload or share content that infringes the intellectual property rights of others,
                including copyrights, trademarks, patents, or trade secrets.
              </li>
              <li>Engage in spamming, phishing, or any other deceptive practices.</li>
              <li>
                Use automated means (bots, scrapers, crawlers) to access, collect, or interact with
                the Service without our express written permission.
              </li>
              <li>
                Attempt to gain unauthorized access to any part of the Service or its related
                systems or networks.
              </li>
              <li>Interfere with or disrupt the integrity or performance of the Service.</li>
              <li>Use the Service to transmit malware, viruses, or any other malicious code.</li>
              <li>Collect or harvest personal data of other users without their consent.</li>
              <li>
                Use the Service in any manner that could damage our reputation or that of {APP_NAME}
                .
              </li>
            </ul>
          </section>

          <hr className='border-border' />

          {/* 4 */}
          <section>
            <h2 className='mb-4 text-lg font-semibold text-foreground'>4. User Content</h2>
            <ul className='list-disc space-y-2 pl-6 text-muted-foreground'>
              <li>
                <strong>Your content:</strong> You retain ownership of all content you post, upload,
                or share on {APP_NAME} (&quot;User Content&quot;).
              </li>
              <li>
                <strong>License to us:</strong> By posting User Content, you grant {COMPANY} a
                worldwide, non-exclusive, royalty-free, sublicensable, and transferable license to
                use, reproduce, distribute, prepare derivative works of, display, and perform your
                User Content solely in connection with operating and improving the Service.
              </li>
              <li>
                <strong>Responsibility:</strong> You are solely responsible for your User Content
                and the consequences of posting it. We do not endorse any User Content or any
                opinion expressed therein.
              </li>
              <li>
                <strong>Removal:</strong> We reserve the right to remove any User Content that
                violates these Terms or that we deem harmful to the Service or its users, without
                prior notice.
              </li>
              <li>
                <strong>Backup:</strong> We are not responsible for loss or corruption of User
                Content. You are encouraged to keep independent backups of your content.
              </li>
            </ul>
          </section>

          <hr className='border-border' />

          {/* 5 */}
          <section>
            <h2 className='mb-4 text-lg font-semibold text-foreground'>5. Intellectual Property</h2>
            <ul className='list-disc space-y-2 pl-6 text-muted-foreground'>
              <li>
                The Service and its original content (excluding User Content), features, and
                functionality are and will remain the exclusive property of {COMPANY} and its
                licensors.
              </li>
              <li>
                Our trademarks, logos, and service marks may not be used without our prior written
                permission.
              </li>
              <li>
                You may not copy, modify, distribute, sell, or lease any part of the Service or its
                software, nor may you reverse engineer or attempt to extract the source code, unless
                permitted by applicable law.
              </li>
            </ul>
          </section>

          <hr className='border-border' />

          {/* 6 */}
          <section>
            <h2 className='mb-4 text-lg font-semibold text-foreground'>6. Privacy</h2>
            <p className='text-muted-foreground'>
              Your use of the Service is also governed by our{" "}
              <Link href='/privacy' className='text-foreground underline'>
                Privacy Policy
              </Link>
              , which is incorporated into these Terms by reference. By using the Service, you
              consent to our collection, use, and sharing of your data as described in the Privacy
              Policy.
            </p>
          </section>

          <hr className='border-border' />

          {/* 7 */}
          <section>
            <h2 className='mb-4 text-lg font-semibold text-foreground'>7. Third-Party Services</h2>
            <ul className='list-disc space-y-2 pl-6 text-muted-foreground'>
              <li>
                The Service may contain links to third-party websites or services. We are not
                responsible for the content, privacy practices, or terms of any third-party
                services.
              </li>
              <li>
                Your use of third-party services, including authentication providers (e.g. Google),
                is subject to their respective terms of service and privacy policies.
              </li>
            </ul>
          </section>

          <hr className='border-border' />

          {/* 8 */}
          <section>
            <h2 className='mb-4 text-lg font-semibold text-foreground'>8. Disclaimers</h2>
            <ul className='list-disc space-y-2 pl-6 text-muted-foreground'>
              <li>
                The Service is provided on an &quot;<strong>as is</strong>&quot; and &quot;
                <strong>as available</strong>&quot; basis, without warranties of any kind, express
                or implied.
              </li>
              <li>
                We do not warrant that the Service will be uninterrupted, error-free, secure, or
                free of viruses or other harmful components.
              </li>
              <li>
                We do not warrant that the results obtained from using the Service will be accurate
                or reliable.
              </li>
            </ul>
          </section>

          <hr className='border-border' />

          {/* 9 */}
          <section>
            <h2 className='mb-4 text-lg font-semibold text-foreground'>
              9. Limitation of Liability
            </h2>
            <p className='text-muted-foreground'>
              To the fullest extent permitted by applicable law, {COMPANY} and its officers,
              directors, employees, and agents shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages, including but not limited to loss of
              profits, data, goodwill, or other intangible losses, arising out of or in connection
              with your use of or inability to use the Service, even if we have been advised of the
              possibility of such damages.
            </p>
            <p className='mt-3 text-muted-foreground'>
              Our total liability to you for any claims arising out of or relating to these Terms or
              the Service shall not exceed the greater of (a) the amount you paid us in the twelve
              months prior to the claim, or (b) €50.
            </p>
          </section>

          <hr className='border-border' />

          {/* 10 */}
          <section>
            <h2 className='mb-4 text-lg font-semibold text-foreground'>10. Indemnification</h2>
            <p className='text-muted-foreground'>
              You agree to defend, indemnify, and hold harmless {COMPANY} and its affiliates,
              officers, directors, employees, and agents from and against any claims, liabilities,
              damages, losses, and expenses, including reasonable legal fees, arising out of or in
              any way connected with your access to or use of the Service, your User Content, or
              your violation of these Terms.
            </p>
          </section>

          <hr className='border-border' />

          {/* 11 */}
          <section>
            <h2 className='mb-4 text-lg font-semibold text-foreground'>11. Termination</h2>
            <ul className='list-disc space-y-2 pl-6 text-muted-foreground'>
              <li>
                We may suspend or terminate your access to the Service at any time, with or without
                cause or notice, if we believe you have violated these Terms.
              </li>
              <li>
                You may terminate your account at any time by contacting us at{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className='text-foreground underline'>
                  {CONTACT_EMAIL}
                </a>
                .
              </li>
              <li>
                Upon termination, your right to use the Service will immediately cease. Provisions
                of these Terms that by their nature should survive termination shall survive.
              </li>
            </ul>
          </section>

          <hr className='border-border' />

          {/* 12 */}
          <section>
            <h2 className='mb-4 text-lg font-semibold text-foreground'>
              12. Modifications to the Terms
            </h2>
            <p className='text-muted-foreground'>
              We reserve the right to modify these Terms at any time. When we do, we will update the
              &quot;Last updated&quot; date at the top of this page and, where appropriate, notify
              you by email or via a prominent notice on the Service. Your continued use of the
              Service after any modifications constitutes your acceptance of the revised Terms.
            </p>
          </section>

          <hr className='border-border' />

          {/* 13 */}
          <section>
            <h2 className='mb-4 text-lg font-semibold text-foreground'>
              13. Governing Law and Dispute Resolution
            </h2>
            <ul className='list-disc space-y-2 pl-6 text-muted-foreground'>
              <li>
                These Terms shall be governed by and construed in accordance with the laws of{" "}
                <strong>France</strong>, without regard to its conflict of law provisions.
              </li>
              <li>
                Any dispute arising out of or relating to these Terms or the Service shall first be
                submitted to mediation. If mediation fails, disputes shall be submitted to the
                exclusive jurisdiction of the courts of <strong>Paris, France</strong>.
              </li>
              <li>
                Notwithstanding the foregoing, we reserve the right to seek injunctive or other
                equitable relief in any court of competent jurisdiction.
              </li>
            </ul>
          </section>

          <hr className='border-border' />

          {/* 14 */}
          <section>
            <h2 className='mb-4 text-lg font-semibold text-foreground'>14. Miscellaneous</h2>
            <ul className='list-disc space-y-2 pl-6 text-muted-foreground'>
              <li>
                <strong>Entire agreement:</strong> These Terms constitute the entire agreement
                between you and {COMPANY} regarding the Service and supersede all prior agreements.
              </li>
              <li>
                <strong>Severability:</strong> If any provision of these Terms is held to be invalid
                or unenforceable, the remaining provisions will continue in full force and effect.
              </li>
              <li>
                <strong>Waiver:</strong> Our failure to enforce any right or provision of these
                Terms will not be considered a waiver of those rights.
              </li>
              <li>
                <strong>Assignment:</strong> You may not assign or transfer your rights under these
                Terms without our prior written consent. We may assign our rights without
                restriction.
              </li>
            </ul>
          </section>

          <hr className='border-border' />

          {/* Contact */}
          <section>
            <h2 className='mb-4 text-lg font-semibold text-foreground'>15. Contact Us</h2>
            <p className='text-muted-foreground'>
              If you have any questions about these Terms, please contact us at:
            </p>
            <div className='mt-3 rounded-xl border border-border bg-muted/40 p-4 text-muted-foreground'>
              <p className='font-medium text-foreground'>{COMPANY}</p>
              <p>
                Email:{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className='text-foreground underline'>
                  {CONTACT_EMAIL}
                </a>
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className='mt-16 border-t border-border pt-8 text-center text-xs text-muted-foreground'>
          <p>
            © {new Date().getFullYear()} {COMPANY}. All rights reserved.
          </p>
          <div className='mt-2 flex justify-center gap-4'>
            <Link href='/' className='hover:text-foreground hover:underline'>
              Home
            </Link>
            <Link href='/privacy' className='hover:text-foreground hover:underline'>
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
