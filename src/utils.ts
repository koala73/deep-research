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
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await generateObject<T>(options);
    } catch (err) {
      lastError = err;
      log(`generateObject attempt ${attempt + 1} failed`, err);
    }
  }
  throw lastError;
}
