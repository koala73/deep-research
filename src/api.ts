import cors from 'cors';
import express, { Request, Response } from 'express';

import { v4 as uuidv4 } from 'uuid';

import {
  deepResearch,
  writeFinalAnswer,
  writeFinalReport,
  ResearchProgress,
} from './deep-research';

const app = express();
const port = process.env.PORT || 3051;

// Middleware
app.use(cors());
app.use(express.json());

// Helper function for consistent logging
function log(...args: any[]) {
  console.log(...args);
}

// API endpoint to run research
app.post('/api/research', async (req: Request, res: Response) => {
  try {
    const { query, depth = 3, breadth = 3 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    log('\nStarting research...\n');

    const { learnings, visitedUrls } = await deepResearch({
      query,
      breadth,
      depth,
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

type JobStatus = 'pending' | 'completed' | 'error';
interface Job {
  status: JobStatus;
  progress?: ResearchProgress;
  report?: string;
  error?: string;
}

const jobs: Record<string, Job> = {};

app.post('/api/jobs', (req: Request, res: Response) => {
  const { query, depth = 3, breadth = 3 } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  const jobId = uuidv4();
  jobs[jobId] = { status: 'pending' };

  (async () => {
    try {
      const { learnings, visitedUrls } = await deepResearch({
        query,
        breadth,
        depth,
        onProgress: progress => {
          jobs[jobId].progress = progress;
        },
      });

      const report = await writeFinalReport({
        prompt: query,
        learnings,
        visitedUrls,
      });

      jobs[jobId].status = 'completed';
      jobs[jobId].report = report;
    } catch (error: any) {
      jobs[jobId].status = 'error';
      jobs[jobId].error = error instanceof Error ? error.message : String(error);
    }
  })();

  return res.json({ jobId });
});

app.get('/api/jobs/:id', (req: Request, res: Response) => {
  const job = jobs[req.params.id];
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  return res.json(job);
});

// Start the server
app.listen(port, () => {
  console.log(`Deep Research API running on port ${port}`);
});

export default app;
