'use client'

import React, { useEffect, useRef, memo } from 'react'

// Define the component props (even though empty, this ensures proper TypeScript compatibility)
interface StockScreenerProps {}

export function StockScreener({}: StockScreenerProps) {
  const container = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (!container.current) return
    
    // Create the TradingView script
    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-screener.js'
    script.type = 'text/javascript'
    script.async = true
    
    // Configure the widget
    script.innerHTML = JSON.stringify({
      width: '100%',
      height: '100%',
      defaultColumn: 'overview',
      defaultScreen: 'most_capitalized',
      market: 'america',
      showToolbar: true,
      colorTheme: 'light',
      locale: 'en',
      isTransparent: true
    })
    
    // Add script to container
    container.current.appendChild(script)
    
    // Clean up on unmount
    return () => {
      if (container.current && script.parentNode === container.current) {
        container.current.removeChild(script)
      }
    }
  }, [])
  
  return (
    <div style={{ height: '500px' }}>
      <div
        className="tradingview-widget-container"
        ref={container}
        style={{ height: '100%', width: '100%' }}
      >
        <div
          className="tradingview-widget-container__widget"
          style={{ height: 'calc(100% - 32px)', width: '100%' }}
        ></div>
        <div className="tradingview-widget-copyright">
          <a
            href="https://www.tradingview.com/"
            rel="noopener nofollow"
            target="_blank"
          >
            <span className="">Track all markets on TradingView</span>
          </a>
        </div>
      </div>
    </div>
  )
}

// Using memo to prevent unnecessary re-renders
export default memo(StockScreener)