import { UseChatHelpers } from 'ai/react'
import { Button } from '@/components/ui/button'
import { ExternalLink } from '@/components/external-link'
import { IconArrowRight } from '@/components/ui/icons'

export function EmptyScreen() {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="flex flex-col gap-2 border bg-background p-8">
        <h1 className="text-lg font-semibold">
          Welcome to the Alpha mind!
        </h1>
        <p className="leading-normal text-sm">
        Alpha Mind is a Perplexity-powered chatbot that offers TradingView stock widgets, market insights via perplexity analysis, and a live trading simulator to practice strategies without financial risk.{' '}
          <span className="font-muted-foreground">
            Built with{' '}
            <ExternalLink href="https://sdk.vercel.ai">
              Vercel AI SDK{' '}
            </ExternalLink>
            <ExternalLink href="https://tradingview.com">
              , TradingView Widgets
            </ExternalLink>
            , and powered by{' '}
            <ExternalLink href="https://perplexity.ai">pplx-7b-chat</ExternalLink>
          </span>
        </p>
      </div>
    </div>
  )
}
