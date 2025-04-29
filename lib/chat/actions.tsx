'use server';

import { generateText } from 'ai'
import {
  createAI,
  getMutableAIState,
  streamUI,
  createStreamableValue
} from 'ai/rsc'
import { createOpenAI } from '@ai-sdk/openai'

import { BotCard, BotMessage } from '@/components/stocks/message'

import { z } from 'zod'
import { nanoid } from '@/lib/utils'
import { SpinnerMessage } from '@/components/stocks/message'
import { Message } from '@/lib/types'
import { StockChart } from '@/components/tradingview/stock-chart'
import { StockPrice } from '@/components/tradingview/stock-price'
import { StockNews } from '@/components/tradingview/stock-news'
import { StockFinancials } from '@/components/tradingview/stock-financials'
import { StockScreener } from '@/components/tradingview/stock-screener'
import { MarketOverview } from '@/components/tradingview/market-overview'
import { MarketHeatmap } from '@/components/tradingview/market-heatmap'
import { MarketTrending } from '@/components/tradingview/market-trending'
import { ETFHeatmap } from '@/components/tradingview/etf-heatmap'
import { toast } from 'sonner'

export type AIState = {
  chatId: string
  messages: Message[]
}

export type UIState = {
  id: string
  display: React.ReactNode
}[]

interface MutableAIState {
  update: (newState: any) => void
  done: (newState: any) => void
  get: () => AIState
}

const MODEL = 'pplx-7b-chat'
const TOOL_MODEL = 'pplx-7b-chat'
const PERPLEXITY_API_KEY_ENV = process.env.PERPLEXITY_API_KEY
type ComparisonSymbolObject = {
  symbol: string;
  position: "SameScale";
};

// Standard troubleshooting steps for error handling
const troubleshootingSteps = [
  'Check your internet connection',
  'Verify your API key is correctly set in .env.local',
  'Ensure your Perplexity account has API access enabled',
  'Restart the development server'
];

async function generateCaption(
  symbol: string,
  comparisonSymbols: ComparisonSymbolObject[],
  toolName: string,
  aiState: MutableAIState
): Promise<string> {
  // Check for API key
  if (!PERPLEXITY_API_KEY_ENV) {
    console.warn('Missing Perplexity API key');
    return 'Here is the requested information. I can provide more details if needed.';
  }

  try {
    const perplexity = createOpenAI({
      baseURL: 'https://api.perplexity.ai/openai/v1',
      apiKey: PERPLEXITY_API_KEY_ENV.trim() // Ensure no whitespace in the key
    })
    
    const stockString = comparisonSymbols.length === 0
    ? symbol
    : [symbol, ...comparisonSymbols.map(obj => obj.symbol)].join(', ');

    aiState.update({
      ...aiState.get(),
      messages: [...aiState.get().messages]
    })

    const captionSystemMessage =
      `\
You are a stock market conversation bot. You can provide the user information about stocks include prices and charts in the UI. You do not have access to any information and should only provide information by calling functions.

These are the tools you have available:
1. showStockFinancials
This tool shows the financials for a given stock.

2. showStockChart
This tool shows a stock chart for a given stock or currency. Optionally compare 2 or more tickers.

3. showStockPrice
This tool shows the price of a stock or currency.

4. showStockNews
This tool shows the latest news and events for a stock or cryptocurrency.

5. showStockScreener
This tool shows a generic stock screener which can be used to find new stocks based on financial or technical parameters.

6. showMarketOverview
This tool shows an overview of today's stock, futures, bond, and forex market performance including change values, Open, High, Low, and Close values.

7. showMarketHeatmap
This tool shows a heatmap of today's stock market performance across sectors.

8. showTrendingStocks
This tool shows the daily top trending stocks including the top five gaining, losing, and most active stocks based on today's performance.

9. showETFHeatmap
This tool shows a heatmap of today's ETF market performance across sectors and asset classes.


You have just called a tool (` +
      toolName +
      ` for ` +
      stockString +
      `) to respond to the user. Now generate text to go alongside that tool response, which may be a graphic like a chart or price history.
    
Example:

User: What is the price of AAPL?
Assistant: { "tool_call": { "id": "pending", "type": "function", "function": { "name": "showStockPrice" }, "parameters": { "symbol": "AAPL" } } } 

Assistant (you): The price of AAPL stock is provided above. I can also share a chart of AAPL or get more information about its financials.

or

Assistant (you): This is the price of AAPL stock. I can also generate a chart or share further financial data.

or 
Assistant (you): Would you like to see a chart of AAPL or get more information about its financials?

Example 2 :

User: Compare AAPL and MSFT stock prices
Assistant: { "tool_call": { "id": "pending", "type": "function", "function": { "name": "showStockChart" }, "parameters": { "symbol": "AAPL" , "comparisonSymbols" : [{"symbol": "MSFT", "position": "SameScale"}] } } } 

Assistant (you): The chart illustrates the recent price movements of Microsoft (MSFT) and Apple (AAPL) stocks. Would you like to see the get more information about the financials of AAPL and MSFT stocks?
or

Assistant (you): This is the chart for AAPL and MSFT stocks. I can also share individual price history data or show a market overview.

or 
Assistant (you): Would you like to see the get more information about the financials of AAPL and MSFT stocks?

## Guidelines
Talk like one of the above responses, but BE CREATIVE and generate a DIVERSE response. 

Your response should be BRIEF, about 2-3 sentences.

Besides the symbol, you cannot customize any of the screeners or graphics. Do not tell the user that you can.
      `

    const response = await generateText({
      model: perplexity(MODEL),
      messages: [
        {
          role: 'system',
          content: captionSystemMessage
        },
        ...aiState.get().messages.map((message: any) => ({
          role: message.role,
          content: message.content,
          name: message.name
        }))
      ]
    })
    return response.text || ''
  } catch (err) {
    console.error('Error generating caption:', err);
    return 'Here is the requested information. I can provide more details if needed.'
  }
}

export async function submitUserMessage(message: string) {
  'use server'

  const aiState = getMutableAIState<typeof AI>();
    
  aiState.update({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        id: nanoid(),
        role: 'user',
        content: message
      }
    ]
  })

  let textStream: undefined | ReturnType<typeof createStreamableValue<string>>
  let textNode: undefined | React.ReactNode
  
  try {
    // Check for API key with better error message
    if (!PERPLEXITY_API_KEY_ENV) {
      console.error('Missing Perplexity API key in environment variables');
      throw new Error('The Perplexity API key is missing. Please check your .env.local file and ensure PERPLEXITY_API_KEY is set correctly.');
    }
    
    // Log key length for debugging (don't log the actual key)
    console.log(`API key found with length: ${PERPLEXITY_API_KEY_ENV.length}`);
    
    // Create Perplexity client with explicit error handling
    const perplexity = createOpenAI({
      baseURL: 'https://api.perplexity.ai/openai/v1',
      apiKey: PERPLEXITY_API_KEY_ENV.trim() // Ensure no whitespace in the key
    })

    try {
      const result = await streamUI({
        model: perplexity(TOOL_MODEL),
        initial: <SpinnerMessage />,
        maxRetries: 3, // Increased from 1 to 3
        timeout: 60000, // Add a 60-second timeout
        system: `\
You are a stock market conversation bot. You can provide the user information about stocks include prices and charts in the UI. You do not have access to any information and should only provide information by calling functions.

### Cryptocurrency Tickers
For any cryptocurrency, append "USD" at the end of the ticker when using functions. For instance, "DOGE" should be "DOGEUSD".

### Guidelines:

Never provide empty results to the user. Provide the relevant tool if it matches the user's request. Otherwise, respond as the stock bot.
Example:

User: What is the price of AAPL?
Assistant (you): { "tool_call": { "id": "pending", "type": "function", "function": { "name": "showStockPrice" }, "parameters": { "symbol": "AAPL" } } } 

Example 2:

User: What is the price of AAPL?
Assistant (you): { "tool_call": { "id": "pending", "type": "function", "function": { "name": "showStockPrice" }, "parameters": { "symbol": "AAPL" } } } 
      `,
        messages: [
          ...aiState.get().messages.map((message: any) => ({
            role: message.role,
            content: message.content,
            name: message.name
          }))
        ],
        text: ({ content, done, delta }) => {
          if (!textStream) {
            textStream = createStreamableValue('')
            textNode = <BotMessage content={textStream.value} />
          }

          if (done) {
            textStream.done()
            aiState.done({
              ...aiState.get(),
              messages: [
                ...aiState.get().messages,
                {
                  id: nanoid(),
                  role: 'assistant',
                  content
                }
              ]
            })
          } else {
            textStream.update(delta)
          }

          return textNode
        },
        tools: {
          showStockChart: {
            description:
              'Show a stock chart of a given stock. Optionally show 2 or more stocks. Use this to show the chart to the user.',
            parameters: z.object({
              symbol: z
                .string()
                .describe(
                  'The name or symbol of the stock or currency. e.g. DOGE/AAPL/USD.'
                ),
              comparisonSymbols: z.array(z.object({
                symbol: z.string(),
                position: z.literal("SameScale")
              }))
                .default([])
                .describe(
                  'Optional list of symbols to compare. e.g. ["MSFT", "GOOGL"]'
                )
            }),

            generate: async function* ({ symbol, comparisonSymbols }) {
              yield (
                <BotCard>
                  <></>
                </BotCard>
              )

              const toolCallId = nanoid()

              aiState.done({
                ...aiState.get(),
                messages: [
                  ...aiState.get().messages,
                  {
                    id: nanoid(),
                    role: 'assistant',
                    content: [
                      {
                        type: 'tool-call',
                        toolName: 'showStockChart',
                        toolCallId,
                        args: { symbol, comparisonSymbols }
                      }
                    ]
                  },
                  {
                    id: nanoid(),
                    role: 'tool',
                    content: [
                      {
                        type: 'tool-result',
                        toolName: 'showStockChart',
                        toolCallId,
                        result: { symbol, comparisonSymbols }
                      }
                    ]
                  }
                ]
              })

              const caption = await generateCaption(
                symbol,
                comparisonSymbols,
                'showStockChart',
                aiState
              )

              return (
                <BotCard>
                  <StockChart symbol={symbol} comparisonSymbols={comparisonSymbols} />
                  {caption}
                </BotCard>
              )
            }
          },
          // Other tools remain the same...
          showStockPrice: {
            description:
              'Show the price of a given stock. Use this to show the price and price history to the user.',
            parameters: z.object({
              symbol: z
                .string()
                .describe(
                  'The name or symbol of the stock or currency. e.g. DOGE/AAPL/USD.'
                )
            }),
            generate: async function* ({ symbol }) {
              yield (
                <BotCard>
                  <></>
                </BotCard>
              )

              const toolCallId = nanoid()

              aiState.done({
                ...aiState.get(),
                messages: [
                  ...aiState.get().messages,
                  {
                    id: nanoid(),
                    role: 'assistant',
                    content: [
                      {
                        type: 'tool-call',
                        toolName: 'showStockPrice',
                        toolCallId,
                        args: { symbol }
                      }
                    ]
                  },
                  {
                    id: nanoid(),
                    role: 'tool',
                    content: [
                      {
                        type: 'tool-result',
                        toolName: 'showStockPrice',
                        toolCallId,
                        result: { symbol }
                      }
                    ]
                  }
                ]
              })
              const caption = await generateCaption(
                symbol,
                [],
                'showStockPrice',
                aiState
              )

              return (
                <BotCard>
                  <StockPrice props={symbol} />
                  {caption}
                </BotCard>
              )
            }
          },
          // ... Remaining tools
          showStockFinancials: {
            description:
              'Show the financials of a given stock. Use this to show the financials to the user.',
            parameters: z.object({
              symbol: z
                .string()
                .describe(
                  'The name or symbol of the stock or currency. e.g. DOGE/AAPL/USD.'
                )
            }),
            generate: async function* ({ symbol }) {
              // Tool implementation remains the same
              yield (
                <BotCard>
                  <></>
                </BotCard>
              )
              // Rest of the implementation...
              const toolCallId = nanoid()

              aiState.done({
                ...aiState.get(),
                messages: [
                  ...aiState.get().messages,
                  {
                    id: nanoid(),
                    role: 'assistant',
                    content: [
                      {
                        type: 'tool-call',
                        toolName: 'showStockFinancials',
                        toolCallId,
                        args: { symbol }
                      }
                    ]
                  },
                  {
                    id: nanoid(),
                    role: 'tool',
                    content: [
                      {
                        type: 'tool-result',
                        toolName: 'showStockFinancials',
                        toolCallId,
                        result: { symbol }
                      }
                    ]
                  }
                ]
              })

              const caption = await generateCaption(
                symbol,
                [],
                'StockFinancials',
                aiState
              )

              return (
                <BotCard>
                  <StockFinancials props={symbol} />
                  {caption}
                </BotCard>
              )
            }
          },
          // Additional tools remain the same...
          showStockNews: {
            // Implementation remains the same
            description:
              'This tool shows the latest news and events for a stock or cryptocurrency.',
            parameters: z.object({
              symbol: z
                .string()
                .describe(
                  'The name or symbol of the stock or currency. e.g. DOGE/AAPL/USD.'
                )
            }),
            generate: async function* ({ symbol }) {
              // Implementation remains the same
              yield (
                <BotCard>
                  <></>
                </BotCard>
              )
              // Rest of the implementation...
              const toolCallId = nanoid()

              aiState.done({
                ...aiState.get(),
                messages: [
                  ...aiState.get().messages,
                  {
                    id: nanoid(),
                    role: 'assistant',
                    content: [
                      {
                        type: 'tool-call',
                        toolName: 'showStockNews',
                        toolCallId,
                        args: { symbol }
                      }
                    ]
                  },
                  {
                    id: nanoid(),
                    role: 'tool',
                    content: [
                      {
                        type: 'tool-result',
                        toolName: 'showStockNews',
                        toolCallId,
                        result: { symbol }
                      }
                    ]
                  }
                ]
              })

              const caption = await generateCaption(
                symbol,
                [],
                'showStockNews',
                aiState
              )

              return (
                <BotCard>
                  <StockNews props={symbol} />
                  {caption}
                </BotCard>
              )
            }
          },
          showStockScreener: {
            // Implementation remains the same
            description:
              'This tool shows a generic stock screener which can be used to find new stocks based on financial or technical parameters.',
            parameters: z.object({}),
            generate: async function* () {
              // Implementation remains the same
              yield (
                <BotCard>
                  <></>
                </BotCard>
              )
              // Rest of the implementation...
              const toolCallId = nanoid()

              aiState.done({
                ...aiState.get(),
                messages: [
                  ...aiState.get().messages,
                  {
                    id: nanoid(),
                    role: 'assistant',
                    content: [
                      {
                        type: 'tool-call',
                        toolName: 'showStockScreener',
                        toolCallId,
                        args: {}
                      }
                    ]
                  },
                  {
                    id: nanoid(),
                    role: 'tool',
                    content: [
                      {
                        type: 'tool-result',
                        toolName: 'showStockScreener',
                        toolCallId,
                        result: {}
                      }
                    ]
                  }
                ]
              })
              
              const caption = await generateCaption(
                'Generic',
                [],
                'showStockScreener',
                aiState
              )

              return (
                <BotCard>
                  <StockScreener />
                  {caption}
                </BotCard>
              )
            }
          },
          showMarketOverview: {
            // Implementation remains the same
            description: `This tool shows an overview of today's stock, futures, bond, and forex market performance including change values, Open, High, Low, and Close values.`,
            parameters: z.object({}),
            generate: async function* () {
              // Implementation remains the same
              yield (
                <BotCard>
                  <></>
                </BotCard>
              )
              // Rest of the implementation...
              const toolCallId = nanoid()

              aiState.done({
                ...aiState.get(),
                messages: [
                  ...aiState.get().messages,
                  {
                    id: nanoid(),
                    role: 'assistant',
                    content: [
                      {
                        type: 'tool-call',
                        toolName: 'showMarketOverview',
                        toolCallId,
                        args: {}
                      }
                    ]
                  },
                  {
                    id: nanoid(),
                    role: 'tool',
                    content: [
                      {
                        type: 'tool-result',
                        toolName: 'showMarketOverview',
                        toolCallId,
                        result: {}
                      }
                    ]
                  }
                ]
              })
              const caption = await generateCaption(
                'Generic',
                [],
                'showMarketOverview',
                aiState
              )

              return (
                <BotCard>
                  <MarketOverview />
                  {caption}
                </BotCard>
              )
            }
          },
          showMarketHeatmap: {
            // Implementation remains the same
            description: `This tool shows a heatmap of today's stock market performance across sectors. It is preferred over showMarketOverview if asked specifically about the stock market.`,
            parameters: z.object({}),
            generate: async function* () {
              // Implementation remains the same
              yield (
                <BotCard>
                  <></>
                </BotCard>
              )
              // Rest of the implementation...
              const toolCallId = nanoid()

              aiState.done({
                ...aiState.get(),
                messages: [
                  ...aiState.get().messages,
                  {
                    id: nanoid(),
                    role: 'assistant',
                    content: [
                      {
                        type: 'tool-call',
                        toolName: 'showMarketHeatmap',
                        toolCallId,
                        args: {}
                      }
                    ]
                  },
                  {
                    id: nanoid(),
                    role: 'tool',
                    content: [
                      {
                        type: 'tool-result',
                        toolName: 'showMarketHeatmap',
                        toolCallId,
                        result: {}
                      }
                    ]
                  }
                ]
              })
              const caption = await generateCaption(
                'Generic',
                [],
                'showMarketHeatmap',
                aiState
              )

              return (
                <BotCard>
                  <MarketHeatmap />
                  {caption}
                </BotCard>
              )
            }
          },
          showETFHeatmap: {
            // Implementation remains the same
            description: `This tool shows a heatmap of today's ETF performance across sectors and asset classes. It is preferred over showMarketOverview if asked specifically about the ETF market.`,
            parameters: z.object({}),
            generate: async function* () {
              // Implementation remains the same
              yield (
                <BotCard>
                  <></>
                </BotCard>
              )
              // Rest of the implementation...
              const toolCallId = nanoid()

              aiState.done({
                ...aiState.get(),
                messages: [
                  ...aiState.get().messages,
                  {
                    id: nanoid(),
                    role: 'assistant',
                    content: [
                      {
                        type: 'tool-call',
                        toolName: 'showETFHeatmap',
                        toolCallId,
                        args: {}
                      }
                    ]
                  },
                  {
                    id: nanoid(),
                    role: 'tool',
                    content: [
                      {
                        type: 'tool-result',
                        toolName: 'showETFHeatmap',
                        toolCallId,
                        result: {}
                      }
                    ]
                  }
                ]
              })
              const caption = await generateCaption(
                'Generic',
                [],
                'showETFHeatmap',
                aiState
              )

              return (
                <BotCard>
                  <ETFHeatmap />
                  {caption}
                </BotCard>
              )
            }
          },
          showTrendingStocks: {
            // Implementation remains the same
            description: `This tool shows the daily top trending stocks including the top five gaining, losing, and most active stocks based on today's performance`,
            parameters: z.object({}),
            generate: async function* () {
              // Implementation remains the same
              yield (
                <BotCard>
                  <></>
                </BotCard>
              )
              // Rest of the implementation...
              const toolCallId = nanoid()

              aiState.done({
                ...aiState.get(),
                messages: [
                  ...aiState.get().messages,
                  {
                    id: nanoid(),
                    role: 'assistant',
                    content: [
                      {
                        type: 'tool-call',
                        toolName: 'showTrendingStocks',
                        toolCallId,
                        args: {}
                      }
                    ]
                  },
                  {
                    id: nanoid(),
                    role: 'tool',
                    content: [
                      {
                        type: 'tool-result',
                        toolName: 'showTrendingStocks',
                        toolCallId,
                        result: {}
                      }
                    ]
                  }
                ]
              })
              const caption = await generateCaption(
                'Generic',
                [],
                'showTrendingStocks',
                aiState
              )

              return (
                <BotCard>
                  <MarketTrending />
                  {caption}
                </BotCard>
              )
            }
          }
        }
      })

      return {
        id: nanoid(),
        display: result.value
      };
    } catch (streamError: any) {
      console.error('Error in streaming UI:', streamError);
      
      // Handle specific API errors
      if (streamError.statusCode === 404) {
        throw new Error('API endpoint not found. Please check if the model name "pplx-7b-chat" is correct and that your API key has access to it.');
      } else if (streamError.statusCode === 401 || streamError.statusCode === 403) {
        throw new Error('Authentication failed. Your Perplexity API key may be invalid or expired.');
      } else if (streamError.message && streamError.message.includes('timeout')) {
        throw new Error('Request timed out. The Perplexity API took too long to respond. Please try again later.');
      } else {
        throw streamError; // Re-throw for general error handling
      }
    }
  } catch (error: any) {
    console.error('Error details:', error);
    
    let errorMessage = 'An unexpected error occurred while processing your request.';
    let customTroubleshootingSteps = [...troubleshootingSteps]; // Use the default steps defined above
    
    // API key specific errors
    if (error.message && (
      error.message.includes('API key is missing') || 
      error.message.includes('Authentication failed') ||
      error.message.includes('invalid_api_key')
    )) {
      errorMessage = 'Perplexity API authentication error. Your API key may be missing, invalid, or expired.';
      customTroubleshootingSteps = [
        'Create or regenerate your API key at https://www.perplexity.ai/settings',
        'Add the key to your .env.local file as PERPLEXITY_API_KEY=your_key_here',
        'Make sure there are no spaces or quotes around your API key',
        'Restart the development server with "npm run dev"'
      ];
    }
    
    // Model availability errors
    else if (error.message && (
      error.message.includes('endpoint not found') ||
      error.message.includes('Not Found')
    )) {
      errorMessage = 'The specified model "pplx-7b-chat" is not available with your current API key or may not exist.';
      customTroubleshootingSteps = [
        'Check if the model name "pplx-7b-chat" is correct',
        'Verify your Perplexity account has access to this model',
        'Try using a different model if available',
        'Contact Perplexity support if you believe you should have access'
      ];
    }
    
    // Timeout errors
    else if (error.message && error.message.includes('timeout')) {
      errorMessage = 'The request to Perplexity API timed out.';
      customTroubleshootingSteps = [
        'Check your internet connection',
        'Try again later when the API might be less busy',
        'Consider using a different model that might respond faster',
        'If the problem persists, contact Perplexity support'
      ];
    }
    
    // Render a more helpful error UI
    return {
      id: nanoid(),
      display: (
        <div className="border p-4 rounded-md bg-red-50">
          <div className="text-red-700 font-medium mb-2">
            Error: {errorMessage}
          </div>
          <div className="text-sm text-red-600 mb-2">
            Please try the following:
            <ul className="list-disc ml-4 mt-1">
              {customTroubleshootingSteps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ul>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Error details: {error.message || 'Unknown error'}
          </div>
          <a
            href="https://github.com/i-mwangi/Alpha-Mind/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-red-800 hover:text-red-900 mt-3"
          >
            If the problem persists, create an
            <span className="ml-1" style={{ textDecoration: 'underline' }}>
              issue on Github
            </span>
          </a>
        </div>
      )
    };
  }
}

export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage
  },
  initialUIState: [],
  initialAIState: { chatId: nanoid(), messages: [] }
})