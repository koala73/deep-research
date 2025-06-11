import * as fs from 'fs/promises';
import * as readline from 'readline';

import { getModel } from './ai/providers';
import {
  deepResearch,
  generateReportTitle,
  writeFinalAnswer,
  writeFinalReport,
} from './deep-research';
import { generatePDF } from './pdf-generator';
import { generateFeedback } from './feedback';
import { log } from './logger';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Helper function to get user input
function askQuestion(query: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(query, answer => {
      resolve(answer);
    });
  });
}

// run the agent
async function run() {
  const mode = process.argv[2];

  if (mode === 'api') {
    // Import and start the API server
    const { default: app } = await import('./api');
    log('API server started successfully');
    return;
  }

  log('Using model: ', getModel().modelId);

  // Get initial query
  const initialQuery = await askQuestion('What would you like to research? ');

  // Get breath and depth parameters
  const breadth =
    parseInt(
      await askQuestion(
        'Enter research breadth (recommended 2-10, default 4): ',
      ),
      10,
    ) || 4;
  const depth =
    parseInt(
      await askQuestion('Enter research depth (recommended 1-5, default 6): '),
      10,
    ) || 6;
  const outputType = await askQuestion(
    'Output format - report (long), answer (concise), or pdf (report as PDF)? (report/answer/pdf, default pdf): ',
  );
  const isReport = outputType !== 'answer';
  const isPDF = outputType === 'pdf' || outputType === '';

  let combinedQuery = initialQuery;
  if (isReport) {
    log(`Creating research plan...`);

    // Generate follow-up questions
    const followUpQuestions = await generateFeedback({
      query: initialQuery,
    });

    log(
      '\nTo better understand your research needs, please answer these follow-up questions:',
    );

    // Collect answers to follow-up questions
    const answers: string[] = [];
    for (const question of followUpQuestions) {
      const answer = await askQuestion(`\n${question}\nYour answer: `);
      answers.push(answer);
    }

    // Combine all information for deep research
    combinedQuery = `
Initial Query: ${initialQuery}
Follow-up Questions and Answers:
${followUpQuestions.map((q: string, i: number) => `Q: ${q}\nA: ${answers[i]}`).join('\n')}
`;
  }

  log('\nStarting research...\n');

  const { learnings, visitedUrls } = await deepResearch({
    query: combinedQuery,
    breadth,
    depth,
  });

  log(`\n\nLearnings:\n\n${learnings.join('\n')}`);
  log(`\n\nVisited URLs (${visitedUrls.length}):\n\n${visitedUrls.join('\n')}`);
  log('Writing final report...');

  if (isReport) {
    const report = await writeFinalReport({
      prompt: combinedQuery,
      learnings,
      visitedUrls,
    });

    await fs.writeFile('report.md', report, 'utf-8');
    log(`\n\nFinal Report:\n\n${report}`);
    
    if (isPDF) {
      log('\nGenerating PDF...');
      const reportTitle = await generateReportTitle({
        prompt: combinedQuery,
        learnings,
      });
      
      await generatePDF(report, 'report.pdf', { title: reportTitle });
      log('\nReport has been saved to report.pdf');
    } else {
      log('\nReport has been saved to report.md');
    }
  } else {
    const answer = await writeFinalAnswer({
      prompt: combinedQuery,
      learnings,
    });

    await fs.writeFile('answer.md', answer, 'utf-8');
    log(`\n\nFinal Answer:\n\n${answer}`);
    log('\nAnswer has been saved to answer.md');
  }

  if (process.argv[2] !== 'api') {
    rl.close();
  }
}

run().catch(console.error);