import OpenAI from 'openai';

if (!process.env.PERPLEXITY_API_KEY) {
  throw new Error(
    'PERPLEXITY_API_KEY is not set in environment variables. Please check your .env.local file.'
  );
}

// Available Perplexity models:
// - pplx-7b-chat (recommended for basic usage)
// - pplx-70b-chat (more capable but more expensive)
// - pplx-7b-online
// - pplx-70b-online
// - mistral-7b-instruct
// - codellama-34b-instruct
// - llama-2-70b-chat

const DEFAULT_MODEL = 'pplx-7b-chat';

export const perplexityClient = new OpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY,
  baseURL: 'https://api.perplexity.ai'
});

export async function generateChatResponse(messages: Array<{ role: string; content: string }>) {
  try {
    const response = await perplexityClient.chat.completions.create({
      messages,
      temperature: 0.7,
      model: DEFAULT_MODEL
    });

    return response.choices[0].message.content;
  } catch (error: any) {
    console.error('Error generating chat response:', error);
    throw new Error(error.message || 'Failed to generate chat response');
  }
}

export async function generateStreamingChatResponse(messages: Array<{ role: string; content: string }>) {
  try {
    const stream = await perplexityClient.chat.completions.create({
      messages,
      temperature: 0.7,
      model: DEFAULT_MODEL,
      stream: true
    });

    return stream;
  } catch (error: any) {
    console.error('Error generating streaming chat response:', error);
    throw new Error(error.message || 'Failed to generate streaming chat response');
  }
}

// Remove the generateCompletion function as it's not commonly used with Perplexity API




