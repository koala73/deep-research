import cors from 'cors';
import express, { Request, Response } from 'express';

import { v4 as uuidv4 } from 'uuid';

import {
  deepResearch,
  writeFinalAnswer,
  writeFinalReport,
  ResearchProgress,
} from './deep-research';
import { generateFeedback } from './feedback';
import { log, withJobContext, getJobLogs } from './logger';

const app = express();
const port = process.env.PORT || 3051;
const accessKey = process.env.ACCESS_KEY;

// Middleware
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  if (!accessKey) {
    return next();
  }
  const header = req.get('Authorization');
  if (header === accessKey || header === `Bearer ${accessKey}`) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized' });
});


// API endpoint to run research
app.post('/api/research', async (req: Request, res: Response) => {
  try {
    const { query, depth = 4, breadth = 4 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    log(`\nStarting research job for "${query}" (breadth: ${breadth}, depth: ${depth})`);

    const { learnings, visitedUrls } = await deepResearch({
      query,
      breadth,
      depth,
      onProgress: progress => log('Research progress:', progress),
    });

    log(`\n\nLearnings:\n\n${learnings.join('\n')}`);
    log(
      `\n\nVisited URLs (${visitedUrls.length}):\n\n${visitedUrls.join('\n')}`,
    );

    const answer = await writeFinalAnswer({
      prompt: query,
      learnings,
    });

    // Return the results
    return res.json({
      success: true,
      answer,
      learnings,
      visitedUrls,
    });
  } catch (error: unknown) {
    console.error('Error in research API:', error);
    return res.status(500).json({
      error: 'An error occurred during research',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

type JobStatus = 'awaiting-answers' | 'pending' | 'completed' | 'error';
interface Job {
  status: JobStatus;
  progress?: ResearchProgress;
  report?: string;
  error?: string;
  followUpQuestions?: string[];
  query?: string;
  breadth?: number;
  depth?: number;
  logs?: string[];
}

const jobs: Record<string, Job> = {};

app.post('/api/jobs', async (req: Request, res: Response) => {
  const { query, depth = 4, breadth = 4 } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  const jobId = uuidv4();
  const followUpQuestions = await generateFeedback({ query });

  jobs[jobId] = {
    status: 'awaiting-answers',
    followUpQuestions,
    query,
    breadth,
    depth,
    logs: [],
  };

  console.log(`[CONSOLE] Created job ${jobId}, total jobs in memory: ${Object.keys(jobs).length}`);
  console.log(`[CONSOLE] All job IDs:`, Object.keys(jobs));
  log(
    `Created job ${jobId} for query "${query}" (breadth: ${breadth}, depth: ${depth})`,
  );

  return res.json({ jobId, followUpQuestions });
});

app.post('/api/jobs/:id/answers', (req: Request, res: Response) => {
  const id = req.params.id;
  const job = jobs[id];
  const { answers = [] } = req.body;

  console.log(`[CONSOLE] Looking for job ${id}`);
  console.log(`[CONSOLE] Available jobs:`, Object.keys(jobs));
  console.log(`[CONSOLE] Job found:`, !!job);

  if (!job) {
    console.log(`[CONSOLE] Job ${id} not found in jobs object`);
    return res.status(404).json({ error: 'Job not found' });
  }

  if (job.status !== 'awaiting-answers') {
    return res.status(400).json({ error: 'Job already started' });
  }

  job.status = 'pending';
  console.log(`[CONSOLE] Job ${id} started with answers:`, JSON.stringify(answers, null, 2));
  log(`Job ${id} started with ${answers.length} answers`);

  const combinedQuery = `
${job.query}
Follow-up Questions and Answers:
${job.followUpQuestions
    ?.map((q, i) => `Q: ${q}\nA: ${answers[i] ?? ''}`)
    .join('\n')}`;

  // Add job timeout protection
  const jobTimeout = setTimeout(() => {
    if (job.status === 'pending') {
      console.error(`[TIMEOUT] Job ${id} timed out after 10 minutes`);
      job.status = 'error';
      job.error = 'Job timed out after 10 minutes';
      log(`Job ${id} timed out`);
    }
  }, 10 * 60 * 1000); // 10 minutes

  withJobContext(id, async () => {
    try {
      console.log(`[CONSOLE] ====== STARTING JOB ${id} ======`);
      console.log(`[CONSOLE] Query: ${combinedQuery.substring(0, 200)}...`);
      console.log(`[CONSOLE] Breadth: ${job.breadth}, Depth: ${job.depth}`);
      log(`Starting deep research for job ${id} with combined query`);

      console.log(`[CONSOLE] Calling deepResearch...`);
      const startTime = Date.now();

      const { learnings, visitedUrls } = await deepResearch({
        query: combinedQuery,
        breadth: job.breadth!,
        depth: job.depth!,
        onProgress: progress => {
          job.progress = progress;
          console.log(`[CONSOLE] Job ${id} progress: ${progress.completedQueries}/${progress.totalQueries} queries, depth ${progress.currentDepth}/${progress.totalDepth}`);
          if (progress.currentQuery) {
            console.log(`[CONSOLE] Current query: ${progress.currentQuery.substring(0, 100)}...`);
          }
          log(`Job ${id} progress:`, progress);
        },
      });

      const researchTime = Date.now() - startTime;
      console.log(`[CONSOLE] Research completed for job ${id} in ${researchTime}ms`);
      console.log(`[CONSOLE] Found ${learnings.length} learnings and ${visitedUrls.length} URLs`);
      log(`Research completed for job ${id}, found ${learnings.length} learnings and ${visitedUrls.length} URLs`);

      console.log(`[CONSOLE] Generating final report for job ${id}...`);
      const reportStartTime = Date.now();

      const report = await writeFinalReport({
        prompt: combinedQuery,
        learnings,
        visitedUrls,
      });

      const reportTime = Date.now() - reportStartTime;
      console.log(`[CONSOLE] Report generated for job ${id} in ${reportTime}ms`);

      clearTimeout(jobTimeout);
      job.status = 'completed';
      job.report = report;
      console.log(`[CONSOLE] ====== JOB ${id} COMPLETED SUCCESSFULLY ======`);
      log(`Job ${id} completed successfully`);
    } catch (error: any) {
      clearTimeout(jobTimeout);
      job.status = 'error';
      job.error = error instanceof Error ? error.message : String(error);
      console.error(`[CONSOLE] ====== JOB ${id} FAILED ======`);
      console.error(`[CONSOLE] Job ${id} error:`, job.error);
      console.error(`[CONSOLE] Full error stack:`, error);
      console.error(`[CONSOLE] Error details:`, {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
        cause: error?.cause
      });
      log(`Job ${id} error:`, job.error);
    }
  }).catch(error => {
    clearTimeout(jobTimeout);
    console.error(`[FATAL] withJobContext failed for job ${id}:`, error);
    job.status = 'error';
    job.error = `Context error: ${error.message}`;
    log(`Job ${id} context error:`, error.message);
  });

  return res.json({ success: true });
});

app.get('/api/jobs/:id', (req: Request, res: Response) => {
  const job = jobs[req.params.id];
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  return res.json({ ...job, logs: getJobLogs(req.params.id) });
});

app.get('/api/jobs/:id/logs', (req: Request, res: Response) => {
  return res.json({ logs: getJobLogs(req.params.id) });
});

// Debug endpoint to list all jobs
app.get('/api/jobs', (req: Request, res: Response) => {
  const jobList = Object.entries(jobs).map(([id, job]) => ({
    id,
    status: job.status,
    query: job.query,
    created: 'unknown' // We don't track creation time currently
  }));

  return res.json({ 
    totalJobs: Object.keys(jobs).length,
    jobs: jobList 
  });
});

// Debug endpoint to clear all jobs
app.delete('/api/jobs', (req: Request, res: Response) => {
  const clearedCount = Object.keys(jobs).length;
  Object.keys(jobs).forEach(key => delete jobs[key]);

  console.log(`[CONSOLE] Cleared ${clearedCount} jobs from memory`);
  log(`Cleared ${clearedCount} jobs from memory`);

  return res.json({ 
    message: `Cleared ${clearedCount} jobs`,
    totalJobs: Object.keys(jobs).length
  });
});

// Health check endpoint for deployment
app.get('/', (req: Request, res: Response) => {
  return res.status(200).json({ 
    status: 'healthy',
    service: 'deep-research-api',
    timestamp: new Date().toISOString() 
  });
});

// Keepalive endpoint for Replit uptime monitoring
app.get('/keepalive', (req: Request, res: Response) => {
  log(`Keepalive check at ${new Date().toISOString()}`);
  return res.status(200).json({ 
    status: 'ok',
    service: 'deep-research-api',
    timestamp: new Date().toISOString() 
  });
});

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('[FATAL] Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  log(`FATAL: Uncaught Exception - ${error.message}`);
  // Don't exit immediately, let current operations complete
  setTimeout(() => process.exit(1), 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Promise Rejection at:', promise, 'reason:', reason);
  log(`FATAL: Unhandled Promise Rejection - ${reason}`);
  // Don't exit immediately, let current operations complete
  setTimeout(() => process.exit(1), 1000);
});

process.on('SIGTERM', () => {
  console.log('[INFO] SIGTERM received, shutting down gracefully');
  log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[INFO] SIGINT received, shutting down gracefully');
  log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Enhanced error handling middleware
app.use((error: any, req: Request, res: Response, next: any) => {
  console.error('[ERROR] Express error handler:', error);
  log(`Express error: ${error.message}`);

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// Start the server with error handling
const server = app.listen(port, '0.0.0.0', () => {
  log(`Deep Research API running on port ${port}`);
  console.log(`[INFO] Server started successfully on port ${port}`);
});

server.on('error', (error: any) => {
  console.error('[FATAL] Server error:', error);
  log(`Server error: ${error.message}`);
  process.exit(1);
});

// Keep alive monitoring
setInterval(() => {
  const memUsage = process.memoryUsage();
  console.log(`[MONITOR] Memory usage: RSS=${Math.round(memUsage.rss/1024/1024)}MB, Heap=${Math.round(memUsage.heapUsed/1024/1024)}MB`);
  console.log(`[MONITOR] Active jobs: ${Object.keys(jobs).length}`);
}, 30000); // Log every 30 seconds

export default app;