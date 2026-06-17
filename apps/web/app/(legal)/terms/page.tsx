import Link from "next/link"
import type { Metadata } from "next"
import { FooterLanguageSelect } from "@/components/shared/footer-language-select"
import { getTranslations } from "next-intl/server"

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: "Terms and Conditions of use for Breezy.",
}

const LAST_UPDATED = "June 16, 2025"
const CONTACT_EMAIL = "legal@breezy.app"
const APP_NAME = "Breezy"
const COMPANY = "Breezy SAS"

export default async function TermsPage() {
  const t = await getTranslations("terms")

  const boldRenderer = (chunks: React.ReactNode) => <strong className="font-semibold">{chunks}</strong>
  const linkRenderer = (chunks: React.ReactNode) => <Link href='/privacy' className='text-foreground underline'>{chunks}</Link>
  const emailLinkRenderer = (chunks: React.ReactNode) => <a href={`mailto:${CONTACT_EMAIL}`} className='text-foreground underline'>{chunks}</a>

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
            {t("title")}
          </h1>
          <p className='mt-2 text-sm text-muted-foreground'>
            {t("lastUpdated", { date: LAST_UPDATED })}
          </p>
        </div>

        <div className='space-y-10 text-sm leading-7 text-foreground'>
          {/* Introduction */}
          <section>
            <p>
              {t.rich("intro1", {
                appName: APP_NAME,
                company: COMPANY,
                bold: boldRenderer
              })}
            </p>
            <p className='mt-4'>
              {t("intro2")}
            </p>
          </section>

          <hr className='border-border' />

          {/* 1 */}
          <section>
            <h2 className='mb-4 text-lg font-semibold text-foreground'>{t("s1Title")}</h2>
            <ul className='list-disc space-y-2 pl-6 text-muted-foreground'>
              <li>{t.rich("s1_1", { appName: APP_NAME, bold: boldRenderer })}</li>
              <li>{t("s1_2")}</li>
              <li>{t("s1_3")}</li>
            </ul>
          </section>

          <hr className='border-border' />

          {/* 3 */}
          <section>
            <h2 className='mb-4 text-lg font-semibold text-foreground'>{t("s3Title")}</h2>
            <p className='mb-3 text-muted-foreground'>{t("s3_0", { appName: APP_NAME })}</p>
            <ul className='list-disc space-y-2 pl-6 text-muted-foreground'>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <li key={`s3_${i}`}>{t(`s3_${i}` as any, { appName: APP_NAME })}</li>
              ))}
            </ul>
          </section>

          <hr className='border-border' />

          {/* 4 */}
          <section>
            <h2 className='mb-4 text-lg font-semibold text-foreground'>{t("s4Title")}</h2>
            <ul className='list-disc space-y-2 pl-6 text-muted-foreground'>
              <li>{t.rich("s4_1", { appName: APP_NAME, bold: boldRenderer })}</li>
              <li>{t.rich("s4_2", { company: COMPANY, bold: boldRenderer })}</li>
              <li>{t.rich("s4_3", { bold: boldRenderer })}</li>
              <li>{t.rich("s4_4", { bold: boldRenderer })}</li>
              <li>{t.rich("s4_5", { bold: boldRenderer })}</li>
            </ul>
          </section>

          <hr className='border-border' />

          {/* 5 */}
          <section>
            <h2 className='mb-4 text-lg font-semibold text-foreground'>{t("s5Title")}</h2>
            <ul className='list-disc space-y-2 pl-6 text-muted-foreground'>
              <li>{t("s5_1", { company: COMPANY })}</li>
              <li>{t("s5_2")}</li>
              <li>{t("s5_3")}</li>
            </ul>
          </section>

          <hr className='border-border' />

          {/* 6 */}
          <section>
            <h2 className='mb-4 text-lg font-semibold text-foreground'>{t("s6Title")}</h2>
            <p className='text-muted-foreground'>
              {t.rich("s6_1", { link: linkRenderer })}
            </p>
          </section>

          <hr className='border-border' />

          {/* 7 */}
          <section>
            <h2 className='mb-4 text-lg font-semibold text-foreground'>{t("s7Title")}</h2>
            <ul className='list-disc space-y-2 pl-6 text-muted-foreground'>
              <li>{t("s7_1")}</li>
              <li>{t("s7_2")}</li>
            </ul>
          </section>

          <hr className='border-border' />

          {/* 8 */}
          <section>
            <h2 className='mb-4 text-lg font-semibold text-foreground'>{t("s8Title")}</h2>
            <ul className='list-disc space-y-2 pl-6 text-muted-foreground'>
              <li>{t.rich("s8_1", { bold: boldRenderer })}</li>
              <li>{t("s8_2")}</li>
              <li>{t("s8_3")}</li>
            </ul>
          </section>

          <hr className='border-border' />

          {/* 9 */}
          <section>
            <h2 className='mb-4 text-lg font-semibold text-foreground'>{t("s9Title")}</h2>
            <p className='text-muted-foreground'>
              {t("s9_1", { company: COMPANY })}
            </p>
            <p className='mt-3 text-muted-foreground'>
              {t("s9_2")}
            </p>
          </section>

          <hr className='border-border' />

          {/* 10 */}
          <section>
            <h2 className='mb-4 text-lg font-semibold text-foreground'>{t("s10Title")}</h2>
            <p className='text-muted-foreground'>
              {t("s10_1", { company: COMPANY })}
            </p>
          </section>

          <hr className='border-border' />

          {/* 11 */}
          <section>
            <h2 className='mb-4 text-lg font-semibold text-foreground'>{t("s11Title")}</h2>
            <ul className='list-disc space-y-2 pl-6 text-muted-foreground'>
              <li>{t("s11_1")}</li>
              <li>{t.rich("s11_2", { email: CONTACT_EMAIL, link: emailLinkRenderer })}</li>
              <li>{t("s11_3")}</li>
            </ul>
          </section>

          <hr className='border-border' />

          {/* 12 */}
          <section>
            <h2 className='mb-4 text-lg font-semibold text-foreground'>{t("s12Title")}</h2>
            <p className='text-muted-foreground'>
              {t("s12_1")}
            </p>
          </section>

          <hr className='border-border' />

          {/* 13 */}
          <section>
            <h2 className='mb-4 text-lg font-semibold text-foreground'>{t("s13Title")}</h2>
            <ul className='list-disc space-y-2 pl-6 text-muted-foreground'>
              <li>{t.rich("s13_1", { bold: boldRenderer })}</li>
              <li>{t.rich("s13_2", { bold: boldRenderer })}</li>
              <li>{t("s13_3")}</li>
            </ul>
          </section>

          <hr className='border-border' />

          {/* 14 */}
          <section>
            <h2 className='mb-4 text-lg font-semibold text-foreground'>{t("s14Title")}</h2>
            <ul className='list-disc space-y-2 pl-6 text-muted-foreground'>
              <li>{t.rich("s14_1", { company: COMPANY, bold: boldRenderer })}</li>
              <li>{t.rich("s14_2", { bold: boldRenderer })}</li>
              <li>{t.rich("s14_3", { bold: boldRenderer })}</li>
              <li>{t.rich("s14_4", { bold: boldRenderer })}</li>
            </ul>
          </section>

          <hr className='border-border' />

          {/* Contact */}
          <section>
            <h2 className='mb-4 text-lg font-semibold text-foreground'>{t("s15Title")}</h2>
            <p className='text-muted-foreground'>
              {t("s15_1")}
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
          <p>{t("footerRights", { year: new Date().getFullYear(), company: COMPANY })}</p>
          <div className='mt-2 flex items-center justify-center gap-4'>
            <Link href='/' className='hover:text-foreground hover:underline'>{t("home")}</Link>
            <Link href='/privacy' className='hover:text-foreground hover:underline'>{t("privacyPolicy")}</Link>
            <FooterLanguageSelect />
          </div>
        </div>
      </div>
    </div>
  )
}
