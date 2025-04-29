import { NextRequest, NextResponse } from 'next/server'
import { AI } from './actions'

// This route handler is necessary to properly handle the API requests
// from the AI component to the server actions
export async function POST(req: NextRequest) {
  try {
    const { messages, aiState } = await req.json()
    
    // Reconstruct the AI state with the handler
    const result = await AI.submitUserMessage(aiState, messages[messages.length - 1].content)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in route handler:', error)
    return NextResponse.json(
      { error: 'Error processing request' },
      { status: 500 }
    )
  }
}

// Optional GET handler for health checks
export async function GET() {
  return NextResponse.json({ status: 'ok' })
}