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
  const message = args
    .map(arg => (typeof arg === 'string' ? arg : JSON.stringify(arg, null, 2)))
    .join(' ');
  console.log(message);

  const jobId = storage.getStore();
  if (jobId) {
    jobLogs[jobId] = jobLogs[jobId] ?? [];
    jobLogs[jobId].push(message);
  }
}
