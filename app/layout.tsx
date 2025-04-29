import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'

import '@/app/globals.css'
import { cn } from '@/lib/utils'
// import { ThemeToggle } from '@/components/theme-toggle'
import { Providers } from '@/components/providers'
import { Header } from '@/components/header'
import { Toaster } from '@/components/ui/sonner'
import { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'Alpha Mind - StockBot',
  description: 'AI-powered stock analysis and trading assistant',
  openGraph: {
    title: 'Alpha Mind - StockBot',
    description: 'AI-powered stock analysis and trading assistant',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'Alpha Mind',
    images: [
      {
        url: 'https://i.imgur.com/f1C7EdN.png',
        width: 250,
        height: 250,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
}

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' }
  ]
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'font-sans antialiased',
          GeistSans.variable,
          GeistMono.variable
        )}
      >
        <Toaster position="top-center" />
        <Providers
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex flex-col flex-1 bg-muted/50">{children}</main>
          </div>
          {/* <ThemeToggle /> */}
        </Providers>
      </body>
    </html>
  )
}
