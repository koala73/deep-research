import { AsyncLocalStorage } from 'async_hooks';

const storage = new AsyncLocalStorage<string | undefined>();
const jobLogs: Record<string, string[]> = {};

export function withJobContext<T>(jobId: string, fn: () => Promise<T>): Promise<T> {
  return storage.run(jobId, fn);
}

export function getJobLogs(jobId: string): string[] {
  return jobLogs[jobId] ?? [];
}

export function log(...args: any[]) {
  const timestamp = new Date().toISOString();
  const message = args
    .map(arg => (typeof arg === 'string' ? arg : JSON.stringify(arg, null, 2)))
    .join(' ');
  
  const logMessage = `[${timestamp}] ${message}`;
  
  // Always log to console
  console.log(logMessage);
  
  const jobId = storage.getStore();
  if (jobId) {
    jobLogs[jobId] = jobLogs[jobId] ?? [];
    jobLogs[jobId].push(logMessage);
  }
}
