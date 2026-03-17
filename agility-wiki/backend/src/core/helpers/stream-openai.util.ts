import type { Response } from 'express';

type OpenAIStream = AsyncIterable<any>;

export async function streamToResponse(
  stream: OpenAIStream,
  res: Response,
  onToken?: (token: string) => void,
) {
  try {
    for await (const chunk of stream) {
      const token = chunk?.choices?.[0]?.delta?.content;

      if (token) {
        res.write(token);

        // optional hook (log, debug, save history...)
        if (onToken) {
          onToken(token);
        }
      }
    }
  } catch (error) {
    console.error('Stream processing error:', error);
    throw error;
  } finally {
    res.end();
  }
}