/**
 * ROSTR Hub - Agent OS
 * 4-Level State Management + Knowledge Compounding
 * 
 * The orchestration layer that manages agent teams,
 * persists learnings, and enables non-coders to build
 * on past successes.
 */

import { z } from 'zod';
import { RAGDAL, createRAGDAL } from '../ragdal/index.js';
import { NPAOClassifier, type NPAOScore, type TaskInput } from '../npao/index.js';
import { PALCompiler, type TeamManifest } from '../pal/index.js';

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export const AgentStatusSchema = z.enum([
  'idle',
  'working',
  'paused',
  'blocked',
  'awaiting_approval',
  'completed',
  'failed'
]);

export type AgentStatus = z.infer<typeof AgentStatusSchema>;

export const AgentStateSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  avatar: z.string().optional(),
  status: AgentStatusSchema,
  currentTask: z.string().optional(),
  currentAction: z.string().optional(),
  progress: z.number().min(0).max(100).default(0),
  learnings: z.array(z.string()),
  tokensUsed: z.number().default(0),
  costIncurred: z.number().default(0),
  tasksCompleted: z.number().default(0),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type AgentState = z.infer<typeof AgentStateSchema>;

export const TaskStatusSchema = z.enum([
  'pending',
  'assigned',
  'in_progress',
  'awaiting_approval',
  'approved',
  'completed',
  'failed',
  'cancelled'
]);

export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const ManagedTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  status: TaskStatusSchema,
  assigneeId: z.string().optional(),
  npao: z.custom<NPAOScore>().optional(),
  output: z.string().optional(),
  artifacts: z.array(z.object({
    type: z.string(),
    url: z.string(),
    name: z.string()
  })).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
  completedAt: z.string().optional()
});

export type ManagedTask = z.infer<typeof ManagedTaskSchema>;

export const CompanyStateSchema = z.object({
  id: z.string(),
  name: z.string(),
  goal: z.string(),
  budget: z.number().default(100),
  budgetUsed: z.number().default(0),
  agents: z.map(z.string(), AgentStateSchema),
  tasks: z.map(z.string(), ManagedTaskSchema),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type CompanyState = Omit<z.infer<typeof CompanyStateSchema>, 'agents' | 'tasks'> & {
  agents: Map<string, AgentState>;
  tasks: Map<string, ManagedTask>;
  knowledge: RAGDAL;
};

// ─────────────────────────────────────────────────────────────────
// Event System (for non-coder friendly updates)
// ─────────────────────────────────────────────────────────────────

export type HubEvent = 
  | { type: 'agent_hired'; agentId: string; agentName: string; role: string }
  | { type: 'agent_started'; agentId: string; taskId: string; action: string }
  | { type: 'agent_progress'; agentId: string; progress: number; action: string }
  | { type: 'agent_completed'; agentId: string; taskId: string; output: string }
  | { type: 'agent_blocked'; agentId: string; reason: string }
  | { type: 'task_created'; taskId: string; title: string }
  | { type: 'task_completed'; taskId: string; output: string }
  | { type: 'learning_recorded'; agentId: string; learning: string }
  | { type: 'budget_warning'; used: number; total: number; percentUsed: number };

export type HubEventListener = (event: HubEvent) => void;

// ─────────────────────────────────────────────────────────────────
// ROSTR Hub Class
// ─────────────────────────────────────────────────────────────────

export class RostrHub {
  private companies: Map<string, CompanyState> = new Map();
  private listeners: HubEventListener[] = [];
  private palCompiler = new PALCompiler();
  private npaoClassifier = new NPAOClassifier();

  // ─────────────────────────────────────────────────────────────────
  // Event System
  // ─────────────────────────────────────────────────────────────────

  /**
   * Subscribe to hub events (for UI updates)
   */
  subscribe(listener: HubEventListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private emit(event: HubEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (e) {
        console.error('Hub event listener error:', e);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Company Management
  // ─────────────────────────────────────────────────────────────────

  /**
   * Create a new company (AI team workspace)
   */
  createCompany(id: string, name: string, goal: string, budget: number = 100): CompanyState {
    const now = new Date().toISOString();
    
    const company: CompanyState = {
      id,
      name,
      goal,
      budget,
      budgetUsed: 0,
      agents: new Map(),
      tasks: new Map(),
      knowledge: createRAGDAL(),
      createdAt: now,
      updatedAt: now
    };

    this.companies.set(id, company);

    // Index the company goal as knowledge
    company.knowledge.indexText(
      `Company Goal: ${goal}`,
      'company_setup',
      'user_input',
      { type: 'goal' }
    );

    return company;
  }

  /**
   * Get a company by ID
   */
  getCompany(id: string): CompanyState | undefined {
    return this.companies.get(id);
  }

  /**
   * List all companies
   */
  listCompanies(): CompanyState[] {
    return Array.from(this.companies.values());
  }

  // ─────────────────────────────────────────────────────────────────
  // Agent Management
  // ─────────────────────────────────────────────────────────────────

  /**
   * Hire an agent to a company
   */
  hireAgent(
    companyId: string, 
    agent: Omit<AgentState, 'learnings' | 'tokensUsed' | 'costIncurred' | 'tasksCompleted' | 'createdAt' | 'updatedAt'>
  ): AgentState {
    const company = this.companies.get(companyId);
    if (!company) throw new Error(`Company ${companyId} not found`);

    const now = new Date().toISOString();
    
    const fullAgent: AgentState = {
      ...agent,
      learnings: [],
      tokensUsed: 0,
      costIncurred: 0,
      tasksCompleted: 0,
      createdAt: now,
      updatedAt: now
    };

    company.agents.set(agent.id, fullAgent);
    company.updatedAt = now;

    this.emit({ 
      type: 'agent_hired', 
      agentId: agent.id, 
      agentName: agent.name,
      role: agent.role 
    });

    return fullAgent;
  }

  /**
   * Get agent by ID
   */
  getAgent(companyId: string, agentId: string): AgentState | undefined {
    return this.companies.get(companyId)?.agents.get(agentId);
  }

  /**
   * Update agent status with a human-readable action
   */
  updateAgentStatus(
    companyId: string, 
    agentId: string, 
    status: AgentStatus, 
    action?: string,
    progress?: number
  ): void {
    const company = this.companies.get(companyId);
    if (!company) throw new Error(`Company ${companyId} not found`);

    const agent = company.agents.get(agentId);
    if (!agent) throw new Error(`Agent ${agentId} not found`);

    agent.status = status;
    if (action) agent.currentAction = action;
    if (progress !== undefined) agent.progress = progress;
    agent.updatedAt = new Date().toISOString();

    if (status === 'working' && action) {
      this.emit({ 
        type: 'agent_progress', 
        agentId, 
        progress: progress || 0, 
        action 
      });
    } else if (status === 'blocked') {
      this.emit({ 
        type: 'agent_blocked', 
        agentId, 
        reason: action || 'Unknown issue' 
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Task Management
  // ─────────────────────────────────────────────────────────────────

  /**
   * Create a task from natural language (uses PAL + NPAO)
   */
  async createTaskFromIntent(companyId: string, intent: string): Promise<ManagedTask> {
    const company = this.companies.get(companyId);
    if (!company) throw new Error(`Company ${companyId} not found`);

    const now = new Date().toISOString();
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Use PAL to understand the intent
    const { intent: palIntent, humanSummary } = await this.palCompiler.compile(intent);

    // Use NPAO to classify priority
    const npaoInput: TaskInput = {
      id: taskId,
      title: intent,
      description: humanSummary,
      signals: palIntent.constraints,
      tags: []
    };
    const npao = this.npaoClassifier.classify(npaoInput);

    const task: ManagedTask = {
      id: taskId,
      title: intent,
      description: humanSummary,
      status: 'pending',
      npao,
      artifacts: [],
      createdAt: now,
      updatedAt: now
    };

    company.tasks.set(taskId, task);
    company.updatedAt = now;

    this.emit({ type: 'task_created', taskId, title: intent });

    return task;
  }

  /**
   * Assign a task to an agent
   */
  assignTask(companyId: string, taskId: string, agentId: string): void {
    const company = this.companies.get(companyId);
    if (!company) throw new Error(`Company ${companyId} not found`);

    const task = company.tasks.get(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    const agent = company.agents.get(agentId);
    if (!agent) throw new Error(`Agent ${agentId} not found`);

    task.assigneeId = agentId;
    task.status = 'assigned';
    task.updatedAt = new Date().toISOString();

    agent.currentTask = taskId;
    agent.status = 'working';
    agent.progress = 0;
    agent.updatedAt = task.updatedAt;

    this.emit({ 
      type: 'agent_started', 
      agentId, 
      taskId, 
      action: `Started working on: ${task.title}` 
    });
  }

  /**
   * Complete a task with output
   */
  completeTask(companyId: string, taskId: string, output: string, artifacts: ManagedTask['artifacts'] = []): void {
    const company = this.companies.get(companyId);
    if (!company) throw new Error(`Company ${companyId} not found`);

    const task = company.tasks.get(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    const now = new Date().toISOString();

    task.status = 'completed';
    task.output = output;
    task.artifacts = artifacts;
    task.completedAt = now;
    task.updatedAt = now;

    // Update agent if assigned
    if (task.assigneeId) {
      const agent = company.agents.get(task.assigneeId);
      if (agent) {
        agent.status = 'idle';
        agent.currentTask = undefined;
        agent.currentAction = undefined;
        agent.progress = 100;
        agent.tasksCompleted++;
        agent.updatedAt = now;

        this.emit({ type: 'agent_completed', agentId: agent.id, taskId, output });
      }
    }

    this.emit({ type: 'task_completed', taskId, output });

    // Index the task output as knowledge for future reference
    company.knowledge.indexText(
      `Task: ${task.title}\nOutput: ${output}`,
      `task:${taskId}`,
      'agent_learning',
      { taskId, completedAt: now }
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // Learning & Knowledge Compounding
  // ─────────────────────────────────────────────────────────────────

  /**
   * Record a learning from an agent (compounds into knowledge base)
   */
  recordLearning(companyId: string, agentId: string, learning: string): void {
    const company = this.companies.get(companyId);
    if (!company) throw new Error(`Company ${companyId} not found`);

    const agent = company.agents.get(agentId);
    if (!agent) throw new Error(`Agent ${agentId} not found`);

    agent.learnings.push(learning);
    agent.updatedAt = new Date().toISOString();

    // Index learning into company knowledge base
    company.knowledge.indexText(
      learning,
      `agent:${agentId}`,
      'agent_learning',
      { agentId, agentName: agent.name, role: agent.role }
    );

    this.emit({ type: 'learning_recorded', agentId, learning });
  }

  /**
   * Search company knowledge
   */
  async searchKnowledge(companyId: string, query: string) {
    const company = this.companies.get(companyId);
    if (!company) throw new Error(`Company ${companyId} not found`);

    return company.knowledge.retrieve(query);
  }

  // ─────────────────────────────────────────────────────────────────
  // Budget Management
  // ─────────────────────────────────────────────────────────────────

  /**
   * Record cost incurred by an agent
   */
  recordCost(companyId: string, agentId: string, cost: number, tokens: number = 0): void {
    const company = this.companies.get(companyId);
    if (!company) throw new Error(`Company ${companyId} not found`);

    const agent = company.agents.get(agentId);
    if (!agent) throw new Error(`Agent ${agentId} not found`);

    agent.costIncurred += cost;
    agent.tokensUsed += tokens;
    agent.updatedAt = new Date().toISOString();

    company.budgetUsed += cost;
    company.updatedAt = agent.updatedAt;

    // Emit warning if approaching budget limit
    const percentUsed = (company.budgetUsed / company.budget) * 100;
    if (percentUsed >= 80) {
      this.emit({ 
        type: 'budget_warning', 
        used: company.budgetUsed, 
        total: company.budget, 
        percentUsed 
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Quick Start - One-click team deployment
  // ─────────────────────────────────────────────────────────────────

  /**
   * Deploy a complete team from natural language intent
   * This is the main entry point for non-coders
   */
  async deployTeam(companyId: string, intent: string): Promise<{
    company: CompanyState;
    team: TeamManifest;
    task: ManagedTask;
    humanSummary: string;
  }> {
    let company = this.companies.get(companyId);
    
    if (!company) {
      // Create company if it doesn't exist
      company = this.createCompany(
        companyId,
        `Company ${companyId}`,
        intent
      );
    }

    // Compile intent to team manifest
    const { team, humanSummary } = await this.palCompiler.compile(intent);

    // Hire all agents from the manifest
    for (const agentManifest of team.agents) {
      const agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.hireAgent(companyId, {
        id: agentId,
        name: agentManifest.name,
        role: agentManifest.role,
        avatar: this.generateAvatar(agentManifest.role),
        status: 'idle',
        progress: 0
      });
    }

    // Create the main task
    const task = await this.createTaskFromIntent(companyId, intent);

    // Assign to first agent
    const firstAgent = Array.from(company.agents.values())[0];
    if (firstAgent) {
      this.assignTask(companyId, task.id, firstAgent.id);
    }

    return { company, team, task, humanSummary };
  }

  /**
   * Generate a friendly avatar URL for an agent role
   */
  private generateAvatar(role: string): string {
    // Use DiceBear for consistent, friendly avatars
    const seed = encodeURIComponent(role);
    return `https://api.dicebear.com/7.x/personas/svg?seed=${seed}`;
  }

  // ─────────────────────────────────────────────────────────────────
  // Serialization (for persistence)
  // ─────────────────────────────────────────────────────────────────

  /**
   * Export hub state for persistence
   */
  export(): Record<string, unknown> {
    const companies: Record<string, unknown>[] = [];

    for (const [id, company] of this.companies) {
      companies.push({
        id,
        name: company.name,
        goal: company.goal,
        budget: company.budget,
        budgetUsed: company.budgetUsed,
        agents: Array.from(company.agents.values()),
        tasks: Array.from(company.tasks.values()),
        createdAt: company.createdAt,
        updatedAt: company.updatedAt
      });
    }

    return { companies, exportedAt: new Date().toISOString() };
  }
}

// ─────────────────────────────────────────────────────────────────
// Export singleton
// ─────────────────────────────────────────────────────────────────

export const rostrHub = new RostrHub();
