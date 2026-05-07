// Prompt templates for the AI Employer Agent

export const SYSTEM_PROMPTS = {
  EMPLOYER_AGENT: `You are an autonomous AI Employer Agent on the Celo blockchain.
Your role is to decompose high-level job objectives into concrete, atomic microtasks
that can be completed by human workers or AI agents.

Rules:
- Each microtask must be completable in under 30 minutes
- Tasks must be specific, measurable, and verifiable
- Assign realistic reward amounts in cUSD (typically $0.10 - $2.00 per task)
- Consider worker skill requirements for each task
- Balance task distribution for parallelism`,

  VALIDATOR_AGENT: `You are an autonomous AI Validator Agent on the Celo blockchain.
Your role is to evaluate worker submissions for quality, accuracy, and completeness.

Rules:
- Be objective and consistent in your evaluation
- Score submissions from 0-100
- Provide specific, actionable feedback
- Approve if score >= 60, reject if < 60
- Detect obvious spam, plagiarism, or low-effort submissions`,

  WORKER_AGENT: `You are a simulated AI Worker Agent participating in the amEmployer platform.
Your role is to complete assigned microtasks and submit quality work.

Rules:
- Read the task description carefully
- Complete the exact work requested
- Submit concise but complete responses
- Do not hallucinate data or fabricate results`,
};

export interface TaskDecompositionResult {
  tasks: Array<{
    title: string;
    description: string;
    reward: string; // cUSD amount as string
    estimatedMinutes: number;
    requiredReputation: number; // Min reputation score 0-100
  }>;
  summary: string;
}

export interface ValidationResult {
  approved: boolean;
  score: number;        // 0–100
  notes: string;
}

export interface WorkerSubmissionResult {
  submission: string;
  confidence: number;   // 0–100
}

export function buildDecompositionPrompt(
  jobTitle: string,
  jobDescription: string,
  totalBudget: string,
  workerCount: number
): Array<{ role: 'user' | 'system'; content: string }> {
  return [
    {
      role: 'system',
      content: SYSTEM_PROMPTS.EMPLOYER_AGENT,
    },
    {
      role: 'user',
      content: `
Decompose this job into microtasks:

Job Title: ${jobTitle}
Job Description: ${jobDescription}
Total Budget: ${totalBudget} cUSD
Available Workers: ${workerCount}

Respond with this exact JSON structure:
{
  "tasks": [
    {
      "title": "short task title",
      "description": "exact instructions for worker",
      "reward": "0.50",
      "estimatedMinutes": 10,
      "requiredReputation": 30
    }
  ],
  "summary": "brief summary of decomposition strategy"
}

Aim for tasks worth $0.10–$2.00 each. Create enough tasks to fill ${workerCount} workers.
      `.trim(),
    },
  ];
}

export function buildValidationPrompt(
  taskTitle: string,
  taskDescription: string,
  submission: string
): Array<{ role: 'user' | 'system'; content: string }> {
  return [
    {
      role: 'system',
      content: SYSTEM_PROMPTS.VALIDATOR_AGENT,
    },
    {
      role: 'user',
      content: `
Validate this task submission:

Task: ${taskTitle}
Instructions: ${taskDescription}

Worker Submission:
${submission}

Respond with this exact JSON structure:
{
  "approved": true,
  "score": 85,
  "notes": "Specific feedback about the submission quality."
}
      `.trim(),
    },
  ];
}

export function buildWorkerSubmissionPrompt(
  taskTitle: string,
  taskDescription: string,
  personaName?: string
): Array<{ role: 'user' | 'system'; content: string }> {
  return [
    {
      role: 'system',
      content: `${SYSTEM_PROMPTS.WORKER_AGENT}\n\nYour worker persona: ${personaName || 'General Worker'}`,
    },
    {
      role: 'user',
      content: `
Complete this task:

Task: ${taskTitle}
Instructions: ${taskDescription}

Submit your completed work as JSON:
{
  "submission": "your complete response here",
  "confidence": 90
}
      `.trim(),
    },
  ];
}
