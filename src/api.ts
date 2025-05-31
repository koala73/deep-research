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
import { log } from './logger';

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
    const { query, depth = 3, breadth = 3 } = req.body;

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
}

const jobs: Record<string, Job> = {};

app.post('/api/jobs', async (req: Request, res: Response) => {
  const { query, depth = 3, breadth = 3 } = req.body;

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
  };

  log(
    `Created job ${jobId} for query "${query}" (breadth: ${breadth}, depth: ${depth})`,
  );

  return res.json({ jobId, followUpQuestions });
});

app.post('/api/jobs/:id/answers', (req: Request, res: Response) => {
  const id = req.params.id;
  const job = jobs[id];
  const { answers = [] } = req.body;

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  if (job.status !== 'awaiting-answers') {
    return res.status(400).json({ error: 'Job already started' });
  }

  job.status = 'pending';
  log(`Job ${id} started`);

  const combinedQuery = `
${job.query}
Follow-up Questions and Answers:
${job.followUpQuestions
    ?.map((q, i) => `Q: ${q}\nA: ${answers[i] ?? ''}`)
    .join('\n')}`;

  (async () => {
    try {
      const { learnings, visitedUrls } = await deepResearch({
        query: combinedQuery,
        breadth: job.breadth!,
        depth: job.depth!,
        onProgress: progress => {
          job.progress = progress;
          log(`Job ${id} progress:`, progress);
        },
      });

      const report = await writeFinalReport({
        prompt: combinedQuery,
        learnings,
        visitedUrls,
      });

      job.status = 'completed';
      job.report = report;
      log(`Job ${id} completed`);
    } catch (error: any) {
      job.status = 'error';
      job.error = error instanceof Error ? error.message : String(error);
      log(`Job ${id} error:`, job.error);
    }
  })();

  return res.json({ success: true });
});

app.get('/api/jobs/:id', (req: Request, res: Response) => {
  const job = jobs[req.params.id];
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  return res.json(job);
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

// Start the server
app.listen(port, '0.0.0.0', () => {
  log(`Deep Research API running on port ${port}`);
});

export default app;
