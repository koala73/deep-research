import { generateObject } from 'ai';

import { log } from './logger';

/**
 * Wrapper around `generateObject` that retries on JSON parse errors.
 * Some language models occasionally return malformed JSON which causes
 * `generateObject` to throw. This helper retries the call a few times
 * before ultimately propagating the error.
 */
export async function generateObjectWithRetry<T>(
  options: any,
  retries = 2,
): Promise<any> {
  let lastError: unknown;

  const extractJSON = (text: string) => {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  };

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await generateObject(options);
    } catch (err: any) {
      lastError = err;
      log(`generateObject attempt ${attempt + 1} failed`, err);

      // Try to salvage JSON if the model returned malformed output
      const text = err?.cause?.text ?? err?.text ?? '';
      if (typeof text === 'string' && text.trim()) {
        const parsed = extractJSON(text);
        if (parsed) {
          log('Successfully extracted JSON from malformed response');
          return parsed as T;
        }
      }
    }
  }

  throw lastError;
}
