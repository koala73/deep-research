# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Running the Application
- **CLI Mode**: `npm start` - Interactive command-line research interface
  - Choose output format: `report` (Markdown), `answer` (concise), or `pdf` (full report as PDF)
- **API Server**: `npm run api` - REST API server on port 3051
- **Docker**: `npm run docker` - Run in Docker container

### Code Quality
- **Format Code**: `npm run format` - Auto-format TypeScript files using Prettier

### Direct Execution
- **With Environment Variables**: `npm run tsx <file>` - Run any TypeScript file with .env.local loaded

## High-Level Architecture

This is an AI-powered deep research system that performs iterative web research by combining search engines, web scraping, and large language models. The system follows a recursive depth-first search pattern to explore topics progressively.

### Core Research Flow
1. **Query Refinement**: System generates follow-up questions to clarify research goals
2. **Recursive Research**: For each depth level, the system:
   - Generates multiple SERP queries based on current context
   - Scrapes and processes web content using Firecrawl API
   - Extracts learnings using AI models
   - Generates new research directions for deeper exploration
3. **Output Generation**: Produces either comprehensive reports or concise answers

### Key Components

**Entry Points**
- `src/run.ts`: CLI interface that handles user interaction and orchestrates research workflow
- `src/api.ts`: Express REST API with both synchronous and asynchronous job-based endpoints

**Core Engine**
- `src/deep-research.ts`: Main research algorithm implementing recursive exploration with configurable breadth/depth parameters

**AI Integration**
- `src/ai/providers.ts`: Flexible model provider system supporting OpenAI (o3-mini), Fireworks (DeepSeek R1), and custom endpoints
- Includes automatic prompt trimming for context size management

**Supporting Modules**
- `src/feedback.ts`: Generates clarifying questions to enhance research quality
- `src/ai/text-splitter.ts`: Handles chunking of large texts for processing
- `src/prompt.ts`: Defines the AI researcher persona and behavior

### Environment Configuration
Required API keys:
- `FIRECRAWL_KEY`: Web scraping service
- `OPENAI_KEY` or `FIREWORKS_KEY`: AI model provider

Optional configurations:
- `FIRECRAWL_BASE_URL`: Self-hosted Firecrawl instance
- `OPENAI_ENDPOINT`, `CUSTOM_MODEL`: Custom AI endpoints
- `CONTEXT_SIZE`: Maximum token context (default 128k)
- `FIRECRAWL_CONCURRENCY`: Parallel scraping limit
- `ACCESS_KEY`: API authentication key

### Research Parameters
- **Breadth**: Number of parallel searches per level (recommended: 3-10)
- **Depth**: Number of recursive levels to explore (recommended: 1-5)
- Each depth level automatically reduces breadth by half

### API Usage
The REST API supports:
- Synchronous research: `POST /api/research`
- Asynchronous jobs: `POST /api/jobs` → poll `GET /api/jobs/{jobId}`
  - Include `"outputFormat": "pdf"` in request body for PDF generation
  - Download PDF: `GET /api/jobs/{jobId}/pdf`
- Health checks: `GET /api/health`

All API requests require `Authorization` header with ACCESS_KEY value.

### PDF Generation
The system can generate research reports as PDFs with:
- Dynamic titles based on research content
- Professional styling with Unicode/emoji support
- Automatic character sanitization
- Uses Puppeteer for high-quality rendering