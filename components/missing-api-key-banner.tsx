import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'

import { Button, buttonVariants } from '@/components/ui/button'

export function MissingApiKeyBanner({
  missingKeys
}: {
  missingKeys: string[]
}) {
  if (!missingKeys.includes('PERPLEXITY_API_KEY')) {
    return null
  }

  return (
    <div className="border p-4">
      <div className="text-red-700 font-medium">
        You need to provide a Perplexity API Key.
      </div>
      <a
        href="https://www.perplexity.ai/account/api/keys"
        rel="noopener noreferrer"
        className="inline-flex items-center text-sm text-red-800 hover:text-red-900"
      >
        <span
          className="ml-1 text-primary font-semibold"
          style={{ textDecoration: 'underline' }}
        >
          {' '}
          Get a Perplexity API Key
        </span>
      </a>
    </div>
  )
}
