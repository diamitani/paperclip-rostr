/**
 * ROSTR API Routes
 * Exposes PAL, NPAO, RAG DAL, and Hub capabilities via REST
 */

import { Router, Request, Response } from 'express';
import { 
  PALCompiler, 
  NPAOClassifier, 
  RostrHub,
  createRAGDAL,
  type TaskInput 
} from '@paperclipai/rostr';

const router = Router();

// Singleton instances
const palCompiler = new PALCompiler();
const npaoClassifier = new NPAOClassifier();
const rostrHub = new RostrHub();

// ─────────────────────────────────────────────────────────────────
// PAL Routes - Intent Compilation
// ─────────────────────────────────────────────────────────────────

/**
 * POST /api/rostr/compile
 * Compile natural language to agent team manifest
 */
router.post('/compile', async (req: Request, res: Response) => {
  try {
    const { input } = req.body;
    
    if (!input || typeof input !== 'string') {
      return res.status(400).json({ 
        error: 'Missing or invalid input',
        hint: 'Send a JSON body with { "input": "your natural language request" }'
      });
    }

    const result = await palCompiler.compile(input);
    
    res.json({
      success: true,
      intent: result.intent,
      team: result.team,
      humanSummary: result.humanSummary
    });
  } catch (error) {
    console.error('PAL compile error:', error);
    res.status(500).json({ 
      error: 'Failed to compile intent',
      message: (error as Error).message 
    });
  }
});

// ─────────────────────────────────────────────────────────────────
// NPAO Routes - Priority Classification
// ─────────────────────────────────────────────────────────────────

/**
 * POST /api/rostr/classify
 * Classify a task's priority using NPAO
 */
router.post('/classify', (req: Request, res: Response) => {
  try {
    const { task } = req.body;
    
    if (!task || !task.id || !task.title) {
      return res.status(400).json({ 
        error: 'Invalid task',
        hint: 'Send { "task": { "id": "...", "title": "...", "description": "...", "signals": [], "tags": [] } }'
      });
    }

    const taskInput: TaskInput = {
      id: task.id,
      title: task.title,
      description: task.description || '',
      signals: task.signals || [],
      tags: task.tags || [],
      dueDate: task.dueDate,
      assignee: task.assignee
    };

    const result = npaoClassifier.classify(taskInput);
    
    res.json({
      success: true,
      npao: result
    });
  } catch (error) {
    console.error('NPAO classify error:', error);
    res.status(500).json({ 
      error: 'Failed to classify task',
      message: (error as Error).message 
    });
  }
});

/**
 * POST /api/rostr/classify-batch
 * Classify multiple tasks and return sorted by priority
 */
router.post('/classify-batch', (req: Request, res: Response) => {
  try {
    const { tasks } = req.body;
    
    if (!Array.isArray(tasks)) {
      return res.status(400).json({ 
        error: 'Invalid tasks array',
        hint: 'Send { "tasks": [{ "id": "...", "title": "..." }, ...] }'
      });
    }

    const result = npaoClassifier.classifyBatch(tasks);
    
    res.json({
      success: true,
      tasks: result
    });
  } catch (error) {
    console.error('NPAO batch classify error:', error);
    res.status(500).json({ 
      error: 'Failed to classify tasks',
      message: (error as Error).message 
    });
  }
});

// ─────────────────────────────────────────────────────────────────
// Hub Routes - Agent OS
// ─────────────────────────────────────────────────────────────────

/**
 * POST /api/rostr/company
 * Create a new company (AI team workspace)
 */
router.post('/company', (req: Request, res: Response) => {
  try {
    const { id, name, goal, budget } = req.body;
    
    if (!id || !name || !goal) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        hint: 'Send { "id": "...", "name": "...", "goal": "...", "budget": 100 }'
      });
    }

    const company = rostrHub.createCompany(id, name, goal, budget || 100);
    
    res.json({
      success: true,
      company: {
        id: company.id,
        name: company.name,
        goal: company.goal,
        budget: company.budget,
        budgetUsed: company.budgetUsed,
        agentCount: company.agents.size,
        taskCount: company.tasks.size
      }
    });
  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({ 
      error: 'Failed to create company',
      message: (error as Error).message 
    });
  }
});

/**
 * GET /api/rostr/company/:id
 * Get company details
 */
router.get('/company/:id', (req: Request, res: Response) => {
  try {
    const company = rostrHub.getCompany(req.params.id);
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json({
      success: true,
      company: {
        id: company.id,
        name: company.name,
        goal: company.goal,
        budget: company.budget,
        budgetUsed: company.budgetUsed,
        agents: Array.from(company.agents.values()),
        tasks: Array.from(company.tasks.values()),
        createdAt: company.createdAt,
        updatedAt: company.updatedAt
      }
    });
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ 
      error: 'Failed to get company',
      message: (error as Error).message 
    });
  }
});

/**
 * GET /api/rostr/companies
 * List all companies
 */
router.get('/companies', (_req: Request, res: Response) => {
  try {
    const companies = rostrHub.listCompanies().map(c => ({
      id: c.id,
      name: c.name,
      goal: c.goal,
      budget: c.budget,
      budgetUsed: c.budgetUsed,
      agentCount: c.agents.size,
      taskCount: c.tasks.size
    }));

    res.json({ success: true, companies });
  } catch (error) {
    console.error('List companies error:', error);
    res.status(500).json({ 
      error: 'Failed to list companies',
      message: (error as Error).message 
    });
  }
});

/**
 * POST /api/rostr/hire
 * Hire an agent to a company
 */
router.post('/hire', (req: Request, res: Response) => {
  try {
    const { companyId, agent } = req.body;
    
    if (!companyId || !agent || !agent.id || !agent.name || !agent.role) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        hint: 'Send { "companyId": "...", "agent": { "id": "...", "name": "...", "role": "..." } }'
      });
    }

    const result = rostrHub.hireAgent(companyId, {
      id: agent.id,
      name: agent.name,
      role: agent.role,
      avatar: agent.avatar,
      status: 'idle',
      progress: 0
    });

    res.json({ success: true, agent: result });
  } catch (error) {
    console.error('Hire agent error:', error);
    res.status(500).json({ 
      error: 'Failed to hire agent',
      message: (error as Error).message 
    });
  }
});

/**
 * POST /api/rostr/deploy
 * One-click team deployment from natural language
 * This is the MAIN entry point for non-coders
 */
router.post('/deploy', async (req: Request, res: Response) => {
  try {
    const { companyId, intent } = req.body;
    
    if (!intent) {
      return res.status(400).json({ 
        error: 'Missing intent',
        hint: 'Send { "companyId": "optional", "intent": "what you want to accomplish" }'
      });
    }

    const id = companyId || `company_${Date.now()}`;
    const result = await rostrHub.deployTeam(id, intent);

    res.json({
      success: true,
      companyId: result.company.id,
      team: result.team,
      task: result.task,
      humanSummary: result.humanSummary,
      agents: Array.from(result.company.agents.values())
    });
  } catch (error) {
    console.error('Deploy team error:', error);
    res.status(500).json({ 
      error: 'Failed to deploy team',
      message: (error as Error).message 
    });
  }
});

/**
 * POST /api/rostr/task
 * Create a task from natural language
 */
router.post('/task', async (req: Request, res: Response) => {
  try {
    const { companyId, intent } = req.body;
    
    if (!companyId || !intent) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        hint: 'Send { "companyId": "...", "intent": "what you want done" }'
      });
    }

    const task = await rostrHub.createTaskFromIntent(companyId, intent);
    res.json({ success: true, task });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ 
      error: 'Failed to create task',
      message: (error as Error).message 
    });
  }
});

/**
 * POST /api/rostr/assign
 * Assign a task to an agent
 */
router.post('/assign', (req: Request, res: Response) => {
  try {
    const { companyId, taskId, agentId } = req.body;
    
    if (!companyId || !taskId || !agentId) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        hint: 'Send { "companyId": "...", "taskId": "...", "agentId": "..." }'
      });
    }

    rostrHub.assignTask(companyId, taskId, agentId);
    res.json({ success: true });
  } catch (error) {
    console.error('Assign task error:', error);
    res.status(500).json({ 
      error: 'Failed to assign task',
      message: (error as Error).message 
    });
  }
});

/**
 * POST /api/rostr/complete
 * Complete a task with output
 */
router.post('/complete', (req: Request, res: Response) => {
  try {
    const { companyId, taskId, output, artifacts } = req.body;
    
    if (!companyId || !taskId || !output) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        hint: 'Send { "companyId": "...", "taskId": "...", "output": "..." }'
      });
    }

    rostrHub.completeTask(companyId, taskId, output, artifacts || []);
    res.json({ success: true });
  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({ 
      error: 'Failed to complete task',
      message: (error as Error).message 
    });
  }
});

/**
 * POST /api/rostr/learning
 * Record a learning from an agent
 */
router.post('/learning', (req: Request, res: Response) => {
  try {
    const { companyId, agentId, learning } = req.body;
    
    if (!companyId || !agentId || !learning) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        hint: 'Send { "companyId": "...", "agentId": "...", "learning": "..." }'
      });
    }

    rostrHub.recordLearning(companyId, agentId, learning);
    res.json({ success: true });
  } catch (error) {
    console.error('Record learning error:', error);
    res.status(500).json({ 
      error: 'Failed to record learning',
      message: (error as Error).message 
    });
  }
});

/**
 * POST /api/rostr/search
 * Search company knowledge
 */
router.post('/search', async (req: Request, res: Response) => {
  try {
    const { companyId, query } = req.body;
    
    if (!companyId || !query) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        hint: 'Send { "companyId": "...", "query": "..." }'
      });
    }

    const result = await rostrHub.searchKnowledge(companyId, query);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Search knowledge error:', error);
    res.status(500).json({ 
      error: 'Failed to search knowledge',
      message: (error as Error).message 
    });
  }
});

/**
 * GET /api/rostr/export
 * Export hub state for persistence
 */
router.get('/export', (_req: Request, res: Response) => {
  try {
    const data = rostrHub.export();
    res.json({ success: true, data });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ 
      error: 'Failed to export',
      message: (error as Error).message 
    });
  }
});

export default router;
