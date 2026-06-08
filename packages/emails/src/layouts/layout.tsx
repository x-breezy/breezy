import { Body, Container, Hr, Html, Preview, Row, Section, Tailwind, Text } from "react-email"
import React from "react"
import tailwindConfig from "../../tailwind"

type EmailLayoutProps = {
  children: React.ReactNode
  previewMessage?: string
  appUrl: string
}

export function Layout({ children, previewMessage }: EmailLayoutProps) {
  return (
    <Tailwind config={tailwindConfig}>
      <Html lang='en'>
        <Body className='m-0 bg-background px-4 py-10 font-sans'>
          {previewMessage && <Preview>{previewMessage}</Preview>}
          <Container className='mx-auto max-w-lg rounded-2xl bg-card'>
            <Section className='px-8 pt-8 pb-4 text-center'>
              <svg
                width='28'
                height='33'
                viewBox='0 0 21 25'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
              >
                <g clipPath='url(#clip0_85_103)'>
                  <mask
                    id='mask0_85_103'
                    maskUnits='userSpaceOnUse'
                    x='0'
                    y='0'
                    width='21'
                    height='25'
                  >
                    <path d='M21 0H0V24.9375H21V0Z' fill='white' />
                  </mask>
                  <g mask='url(#mask0_85_103)'>
                    <path
                      d='M0.49218 16.1555C1.14551 14.5478 2.28029 14.1459 2.76603 14.1459C3.66276 13.9877 4.83169 15.4909 4.03104 17.7853C3.2304 20.0797 1.7572 20.5227 0.844462 20.0954C-0.0682747 19.6682 -0.324481 18.165 0.49218 16.1555Z'
                      fill='black'
                    />
                    <path
                      d='M2.06323 21.9903C2.40408 19.9338 4.79857 19.7742 6.05495 19.7742H9.23934C13.6123 19.7742 14.9802 18.1344 15.81 17.0707C16.6397 16.0071 16.55 13.7468 14.1729 13.4144C11.7959 13.0819 10.3382 14.7218 9.82241 15.3423C9.30662 15.9628 8.18535 17.7853 6.88469 17.5804C5.58401 17.3756 4.64214 16.4946 4.8664 12.5945C5.09066 8.69431 7.22107 3.3981 8.67871 1.55882C10.1364 -0.280449 12.5583 -0.324767 13.9711 0.561628C15.3839 1.44802 15.7876 4.04073 13.9711 6.3232C12.1546 8.60568 8.53206 9.26586 6.638 12.5945C5.75519 14.1459 7.04165 16.4724 8.94782 13.7468C10.854 11.0211 11.1197 10.5656 13.0741 9.62504C15.641 8.38963 23.8158 10.312 20.0036 17.0707C16.1912 23.8295 7.64715 24.8489 5.85312 24.9818C4.05909 25.1147 1.63714 24.5607 2.06323 21.9903Z'
                      fill='black'
                    />
                  </g>
                </g>
                <defs>
                  <clipPath id='clip0_85_103'>
                    <rect width='21' height='25' fill='white' />
                  </clipPath>
                </defs>
              </svg>
            </Section>

            <Section className='px-8 pt-7 pb-8'>{children}</Section>

            <Hr className='m-0 border-border' />

            <Section className='px-8 pt-5 pb-7 text-center'>
              <Row>
                <Text className='m-0 mt-2 text-xs text-muted-foreground'>
                  You received this email because you have a Breezy account.
                </Text>
              </Row>
              <Row>
                <Text className='m-0 mt-1 text-xs text-muted-foreground'>
                  © 2026 Breezy. All rights reserved.
                </Text>
              </Row>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  )
}
