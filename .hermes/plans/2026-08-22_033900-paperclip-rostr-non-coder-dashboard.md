# Paperclip + ROSTR: Non-Coder AI Agent Dashboard

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Transform Paperclip into the #1 UI/UX dashboard for non-coders to orchestrate AI agent teams — merging ROSTR framework for intent compilation, priority classification, and knowledge retrieval.

**Architecture:** Paperclip's four pillars (Task Manager, Org Chart, Agent Training, Agentic OS) map perfectly to ROSTR's four pillars (PAL, NPAO, RAG DAL, Hub). The integration adds a "non-coder layer" — natural language intent → agent actions with zero configuration.

**Tech Stack:** Node.js + Express (server), React + Vite + Tailwind (UI), Drizzle ORM (DB), ROSTR Python modules (PAL/NPAO/RAG DAL/Hub), TypeScript throughout.

---

## Part 1: ROSTR Framework Integration

### Phase 1.1: Core ROSTR Modules

#### Task 1: Add ROSTR Python package to project

**Objective:** Embed ROSTR core modules into the Paperclip monorepo.

**Files:**
- Create: `packages/rostr/src/pal/index.ts`
- Create: `packages/rostr/src/npao/index.ts`
- Create: `packages/rostr/src/ragdal/index.ts`
- Create: `packages/rostr/src/hub/index.ts`
- Create: `packages/rostr/package.json`
- Create: `packages/rostr/tsconfig.json`

**Implementation:**

The ROSTR pillars translated to TypeScript for native Paperclip integration:

```typescript
// packages/rostr/src/pal/index.ts
// PAL = Prompt Assembly Language — compiles natural language to agent manifest

export interface PALIntent {
  raw: string;
  verb: string;
  object: string;
  domain: 'business' | 'engineering' | 'marketing' | 'operations' | 'finance';
  constraints: string[];
  confidence: number;
}

export interface AgentManifest {
  role: string;
  goal: string;
  skills: string[];
  tools: string[];
  budget?: number;
  deadline?: string;
}

export class PALCompiler {
  async compile(input: string): Promise<{ intent: PALIntent; manifest: AgentManifest }> {
    // Stage 1: Extract intent
    const intent = await this.extractIntent(input);
    
    // Stage 2: Map to domain signals
    const domain = this.classifyDomain(intent);
    
    // Stage 3: Generate agent manifest
    const manifest = this.generateManifest(intent, domain);
    
    return { intent, manifest };
  }

  private async extractIntent(input: string): Promise<PALIntent> {
    // Use LLM or rule-based extraction
    const verbs = ['build', 'create', 'hire', 'launch', 'analyze', 'monitor', 'optimize'];
    const verb = verbs.find(v => input.toLowerCase().includes(v)) || 'execute';
    
    return {
      raw: input,
      verb,
      object: input.replace(new RegExp(verb, 'i'), '').trim(),
      domain: 'business',
      constraints: [],
      confidence: 0.85
    };
  }

  private classifyDomain(intent: PALIntent): string {
    const domainSignals: Record<string, string[]> = {
      engineering: ['build', 'code', 'deploy', 'fix', 'debug', 'api', 'database'],
      marketing: ['campaign', 'content', 'social', 'brand', 'launch', 'audience'],
      operations: ['process', 'workflow', 'automate', 'schedule', 'monitor'],
      finance: ['budget', 'cost', 'revenue', 'forecast', 'expense'],
      business: ['strategy', 'goal', 'growth', 'hire', 'team']
    };

    for (const [domain, signals] of Object.entries(domainSignals)) {
      if (signals.some(s => intent.raw.toLowerCase().includes(s))) {
        return domain;
      }
    }
    return 'business';
  }

  private generateManifest(intent: PALIntent, domain: string): AgentManifest {
    const roleMap: Record<string, string> = {
      engineering: 'Software Engineer',
      marketing: 'Marketing Manager',
      operations: 'Operations Specialist',
      finance: 'Financial Analyst',
      business: 'Business Strategist'
    };

    return {
      role: roleMap[domain] || 'General Agent',
      goal: intent.raw,
      skills: this.inferSkills(domain),
      tools: this.inferTools(domain)
    };
  }

  private inferSkills(domain: string): string[] {
    const skillMap: Record<string, string[]> = {
      engineering: ['code-review', 'debugging', 'architecture', 'testing'],
      marketing: ['copywriting', 'analytics', 'social-media', 'seo'],
      operations: ['process-design', 'automation', 'reporting'],
      finance: ['forecasting', 'budgeting', 'analysis'],
      business: ['strategy', 'planning', 'stakeholder-management']
    };
    return skillMap[domain] || [];
  }

  private inferTools(domain: string): string[] {
    const toolMap: Record<string, string[]> = {
      engineering: ['github', 'terminal', 'browser'],
      marketing: ['analytics', 'social-api', 'cms'],
      operations: ['scheduler', 'email', 'crm'],
      finance: ['spreadsheet', 'database', 'reporting'],
      business: ['docs', 'calendar', 'communication']
    };
    return toolMap[domain] || [];
  }
}
```

```typescript
// packages/rostr/src/npao/index.ts
// NPAO = Necessity, Priority, Anxiety, Opportunity — 5D phase + 4D priority

export interface NPAOScore {
  necessity: number;  // 0-10: Must do (contracts, deadlines, compliance)
  priority: number;   // 0-10: Should do (revenue, growth)
  anxiety: number;    // 0-10: Worrying about (risk, uncertainty)
  opportunity: number; // 0-10: Could gain (upside, expansion)
  phase: 'now' | 'this-week' | 'this-month' | 'later';
  score: number;      // Weighted composite
}

export interface Task {
  id: string;
  title: string;
  description: string;
  signals: string[];
}

export class NPAOClassifier {
  private weights = {
    necessity: 0.55,
    priority: 0.30,
    anxiety: 0.10,
    opportunity: 0.05
  };

  classify(task: Task): NPAOScore {
    const scores = {
      necessity: this.scoreNecessity(task),
      priority: this.scorePriority(task),
      anxiety: this.scoreAnxiety(task),
      opportunity: this.scoreOpportunity(task)
    };

    // Phase determined by dominant lens
    const phase = this.determinePhase(scores);

    // Weighted composite for ordering within phase
    const score = 
      scores.necessity * this.weights.necessity +
      scores.priority * this.weights.priority +
      scores.anxiety * this.weights.anxiety +
      scores.opportunity * this.weights.opportunity;

    return { ...scores, phase, score };
  }

  private scoreNecessity(task: Task): number {
    const signals = ['deadline', 'contract', 'compliance', 'legal', 'required', 'must'];
    return this.matchSignals(task, signals);
  }

  private scorePriority(task: Task): number {
    const signals = ['revenue', 'growth', 'customer', 'important', 'key', 'critical'];
    return this.matchSignals(task, signals);
  }

  private scoreAnxiety(task: Task): number {
    const signals = ['risk', 'worry', 'concern', 'uncertain', 'blocked', 'failing'];
    return this.matchSignals(task, signals);
  }

  private scoreOpportunity(task: Task): number {
    const signals = ['potential', 'opportunity', 'expand', 'new', 'innovation', 'upside'];
    return this.matchSignals(task, signals);
  }

  private matchSignals(task: Task, signals: string[]): number {
    const text = `${task.title} ${task.description} ${task.signals.join(' ')}`.toLowerCase();
    const matches = signals.filter(s => text.includes(s)).length;
    return Math.min(10, matches * 2);
  }

  private determinePhase(scores: { necessity: number; priority: number; anxiety: number; opportunity: number }): 'now' | 'this-week' | 'this-month' | 'later' {
    if (scores.necessity >= 5) return 'now';
    if (scores.necessity >= 3 || scores.priority >= 5) return 'this-week';
    if (scores.priority >= 3 || scores.opportunity >= 5) return 'this-month';
    return 'later';
  }
}
```

```typescript
// packages/rostr/src/ragdal/index.ts
// RAG DAL = Retrieval-Augmented Generation Data Access Layer — 3-tier knowledge retrieval

export interface KnowledgeChunk {
  id: string;
  content: string;
  source: string;
  embedding?: number[];
  metadata: Record<string, unknown>;
}

export interface RetrievalResult {
  chunks: KnowledgeChunk[];
  confidence: number;
  strategy: 'exact' | 'semantic' | 'hybrid';
}

export class RAGDAL {
  private knowledgeBase: KnowledgeChunk[] = [];

  async index(chunks: KnowledgeChunk[]): Promise<void> {
    this.knowledgeBase.push(...chunks);
  }

  async retrieve(query: string, limit: number = 5): Promise<RetrievalResult> {
    // Tier 1: Exact match
    const exactMatches = this.exactMatch(query);
    if (exactMatches.length >= limit) {
      return { chunks: exactMatches.slice(0, limit), confidence: 0.95, strategy: 'exact' };
    }

    // Tier 2: Keyword match (simulated semantic)
    const keywordMatches = this.keywordMatch(query);
    if (keywordMatches.length >= limit) {
      return { chunks: keywordMatches.slice(0, limit), confidence: 0.75, strategy: 'semantic' };
    }

    // Tier 3: Hybrid (combine both)
    const hybrid = [...new Set([...exactMatches, ...keywordMatches])];
    return { chunks: hybrid.slice(0, limit), confidence: 0.60, strategy: 'hybrid' };
  }

  private exactMatch(query: string): KnowledgeChunk[] {
    return this.knowledgeBase.filter(chunk => 
      chunk.content.toLowerCase().includes(query.toLowerCase())
    );
  }

  private keywordMatch(query: string): KnowledgeChunk[] {
    const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    return this.knowledgeBase
      .map(chunk => ({
        chunk,
        score: keywords.filter(k => chunk.content.toLowerCase().includes(k)).length
      }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ chunk }) => chunk);
  }
}
```

```typescript
// packages/rostr/src/hub/index.ts
// Hub = Agent OS — 4-level state + knowledge compounding

export interface AgentState {
  id: string;
  name: string;
  role: string;
  status: 'idle' | 'working' | 'paused' | 'blocked' | 'completed';
  currentTask?: string;
  memory: Map<string, unknown>;
  learnings: string[];
}

export interface CompanyState {
  id: string;
  name: string;
  goal: string;
  agents: Map<string, AgentState>;
  tasks: Map<string, Task>;
  knowledge: RAGDAL;
}

import { Task } from './npao';
import { RAGDAL } from './ragdal';

export class RostrHub {
  private companies: Map<string, CompanyState> = new Map();

  createCompany(id: string, name: string, goal: string): CompanyState {
    const company: CompanyState = {
      id,
      name,
      goal,
      agents: new Map(),
      tasks: new Map(),
      knowledge: new RAGDAL()
    };
    this.companies.set(id, company);
    return company;
  }

  getCompany(id: string): CompanyState | undefined {
    return this.companies.get(id);
  }

  hireAgent(companyId: string, agent: Omit<AgentState, 'memory' | 'learnings'>): AgentState {
    const company = this.companies.get(companyId);
    if (!company) throw new Error(`Company ${companyId} not found`);

    const fullAgent: AgentState = {
      ...agent,
      memory: new Map(),
      learnings: []
    };
    company.agents.set(agent.id, fullAgent);
    return fullAgent;
  }

  assignTask(companyId: string, agentId: string, task: Task): void {
    const company = this.companies.get(companyId);
    if (!company) throw new Error(`Company ${companyId} not found`);

    const agent = company.agents.get(agentId);
    if (!agent) throw new Error(`Agent ${agentId} not found`);

    company.tasks.set(task.id, task);
    agent.currentTask = task.id;
    agent.status = 'working';
  }

  recordLearning(companyId: string, agentId: string, learning: string): void {
    const company = this.companies.get(companyId);
    if (!company) throw new Error(`Company ${companyId} not found`);

    const agent = company.agents.get(agentId);
    if (!agent) throw new Error(`Agent ${agentId} not found`);

    agent.learnings.push(learning);
    
    // Compound knowledge into company knowledge base
    company.knowledge.index([{
      id: `learning-${Date.now()}`,
      content: learning,
      source: `agent:${agentId}`,
      metadata: { agentId, timestamp: new Date().toISOString() }
    }]);
  }
}
```

**Step 1: Create package.json**

```json
{
  "name": "@paperclipai/rostr",
  "version": "1.0.0",
  "description": "ROSTR Framework for Paperclip - PAL, NPAO, RAG DAL, Hub",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {},
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

**Step 2: Create index.ts**

```typescript
// packages/rostr/src/index.ts
export * from './pal';
export * from './npao';
export * from './ragdal';
export * from './hub';
```

**Verification:**

```bash
cd packages/rostr && pnpm install && pnpm build
```

---

### Phase 1.2: Server Integration

#### Task 2: Add ROSTR API routes

**Objective:** Expose ROSTR capabilities through Paperclip's REST API.

**Files:**
- Create: `server/src/routes/rostr.ts`
- Modify: `server/src/index.ts` (add route import)

**Implementation:**

```typescript
// server/src/routes/rostr.ts
import { Router } from 'express';
import { PALCompiler, NPAOClassifier, RostrHub } from '@paperclipai/rostr';

const router = Router();
const palCompiler = new PALCompiler();
const npaoClassifier = new NPAOClassifier();
const rostrHub = new RostrHub();

// POST /api/rostr/compile — Compile natural language to agent manifest
router.post('/compile', async (req, res) => {
  try {
    const { input } = req.body;
    const result = await palCompiler.compile(input);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// POST /api/rostr/classify — Classify task priority with NPAO
router.post('/classify', (req, res) => {
  try {
    const { task } = req.body;
    const result = npaoClassifier.classify(task);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// POST /api/rostr/company — Create a new company
router.post('/company', (req, res) => {
  try {
    const { id, name, goal } = req.body;
    const company = rostrHub.createCompany(id, name, goal);
    res.json({ id: company.id, name: company.name, goal: company.goal });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// POST /api/rostr/hire — Hire an agent to a company
router.post('/hire', (req, res) => {
  try {
    const { companyId, agent } = req.body;
    const result = rostrHub.hireAgent(companyId, agent);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

export default router;
```

---

## Part 2: Non-Coder Dashboard UI

### Phase 2.1: Command Center — The "Zero Code" Experience

#### Task 3: Create the Intent Commander component

**Objective:** A single input that lets non-coders express what they want in plain English.

**Files:**
- Create: `ui/src/components/rostr/IntentCommander.tsx`
- Create: `ui/src/components/rostr/IntentCommander.module.css`

**Design Principles (Non-Coder First):**
1. **Single input field** — not forms, not dropdowns, just type what you want
2. **Real-time intent preview** — show them what the system understood
3. **One-click execution** — "Make it happen" button
4. **Progress storytelling** — show agents working in human-readable terms

**Implementation:**

```tsx
// ui/src/components/rostr/IntentCommander.tsx
import { useState } from 'react';
import { Sparkles, Play, Users, Target, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IntentPreview {
  domain: string;
  agents: { role: string; task: string }[];
  estimatedCost: string;
  estimatedTime: string;
}

export function IntentCommander() {
  const [input, setInput] = useState('');
  const [preview, setPreview] = useState<IntentPreview | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  const handleInputChange = async (value: string) => {
    setInput(value);
    if (value.length > 10) {
      setIsCompiling(true);
      // Debounced compile
      const response = await fetch('/api/rostr/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: value })
      });
      const result = await response.json();
      setPreview({
        domain: result.intent.domain,
        agents: [{ role: result.manifest.role, task: result.manifest.goal }],
        estimatedCost: '$0.50 - $2.00',
        estimatedTime: '5-15 minutes'
      });
      setIsCompiling(false);
    }
  };

  const handleExecute = async () => {
    setIsExecuting(true);
    // Create company, hire agents, assign tasks
    // ... execution logic
  };

  return (
    <div className="intent-commander">
      {/* Hero Input */}
      <div className="intent-input-container">
        <Sparkles className="input-icon" />
        <textarea
          className="intent-input"
          placeholder="What do you want to accomplish? Just describe it in your own words..."
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          rows={3}
        />
      </div>

      {/* Real-time Preview */}
      {preview && (
        <div className="intent-preview">
          <h3 className="preview-title">
            <Brain className="icon" /> Here's what I understood
          </h3>
          
          <div className="preview-cards">
            <div className="preview-card domain">
              <Target className="card-icon" />
              <span className="card-label">Domain</span>
              <span className="card-value">{preview.domain}</span>
            </div>
            
            <div className="preview-card agents">
              <Users className="card-icon" />
              <span className="card-label">Team Needed</span>
              <div className="agent-list">
                {preview.agents.map((agent, i) => (
                  <div key={i} className="agent-chip">{agent.role}</div>
                ))}
              </div>
            </div>

            <div className="preview-card estimates">
              <span className="estimate">
                <strong>Time:</strong> {preview.estimatedTime}
              </span>
              <span className="estimate">
                <strong>Cost:</strong> {preview.estimatedCost}
              </span>
            </div>
          </div>

          <button 
            className="execute-button"
            onClick={handleExecute}
            disabled={isExecuting}
          >
            <Play className="icon" />
            {isExecuting ? 'Building your team...' : 'Make it happen'}
          </button>
        </div>
      )}
    </div>
  );
}
```

---

#### Task 4: Create the Agent Team Visualizer

**Objective:** Show non-coders their AI team as friendly avatars with status.

**Files:**
- Create: `ui/src/components/rostr/TeamVisualizer.tsx`

**Design:**
- **Avatar-based** — each agent has a distinct avatar (not technical icons)
- **Status as emotion** — working = focused, blocked = confused, completed = happy
- **Progress as stories** — "Sarah is researching competitors..." not "GET /api/search 200 OK"

```tsx
// ui/src/components/rostr/TeamVisualizer.tsx
import { motion, AnimatePresence } from 'framer-motion';

interface Agent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: 'idle' | 'working' | 'blocked' | 'completed';
  currentAction?: string;
}

const statusEmoji: Record<string, string> = {
  idle: '😊',
  working: '🧑‍💻',
  blocked: '😕',
  completed: '🎉'
};

const statusColors: Record<string, string> = {
  idle: 'var(--status-agent-idle)',
  working: 'var(--status-agent-running)',
  blocked: 'var(--status-agent-blocked)',
  completed: 'var(--status-agent-completed)'
};

export function TeamVisualizer({ agents }: { agents: Agent[] }) {
  return (
    <div className="team-visualizer">
      <h2 className="team-title">Your Team</h2>
      
      <div className="agent-grid">
        <AnimatePresence>
          {agents.map((agent) => (
            <motion.div
              key={agent.id}
              className="agent-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{ 
                borderColor: statusColors[agent.status],
                '--glow-color': statusColors[agent.status]
              } as React.CSSProperties}
            >
              <div className="agent-avatar">
                <img src={agent.avatar} alt={agent.name} />
                <span className="status-badge">{statusEmoji[agent.status]}</span>
              </div>
              
              <div className="agent-info">
                <h3 className="agent-name">{agent.name}</h3>
                <p className="agent-role">{agent.role}</p>
              </div>

              {agent.currentAction && (
                <motion.div 
                  className="agent-action"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  {agent.currentAction}
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
```

---

#### Task 5: Create the Progress Storyteller

**Objective:** Convert technical logs into human-readable progress stories.

**Files:**
- Create: `ui/src/components/rostr/ProgressStory.tsx`

**Design:**
- No JSON, no technical terms
- "Alex finished the first draft and sent it for review" not "task_id: abc123 status: completed"

```tsx
// ui/src/components/rostr/ProgressStory.tsx
import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertCircle, Loader } from 'lucide-react';

interface StoryEvent {
  id: string;
  timestamp: Date;
  agentName: string;
  action: string;
  status: 'completed' | 'in-progress' | 'waiting' | 'error';
}

const statusIcons = {
  completed: CheckCircle,
  'in-progress': Loader,
  waiting: Clock,
  error: AlertCircle
};

export function ProgressStory({ events }: { events: StoryEvent[] }) {
  return (
    <div className="progress-story">
      <h2 className="story-title">What's happening</h2>
      
      <div className="story-timeline">
        {events.map((event, index) => {
          const Icon = statusIcons[event.status];
          return (
            <motion.div
              key={event.id}
              className={`story-event story-event--${event.status}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="event-icon">
                <Icon className={event.status === 'in-progress' ? 'animate-spin' : ''} />
              </div>
              <div className="event-content">
                <p className="event-text">
                  <strong>{event.agentName}</strong> {event.action}
                </p>
                <span className="event-time">
                  {formatTimeAgo(event.timestamp)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}
```

---

### Phase 2.2: Templates & Quick Actions

#### Task 6: Create One-Click Business Templates

**Objective:** Pre-built templates for common non-coder use cases.

**Files:**
- Create: `ui/src/components/rostr/TemplateGallery.tsx`
- Create: `ui/src/data/business-templates.ts`

**Templates:**
1. **Content Creator** — Blog posts, social media, newsletters
2. **Market Research** — Competitor analysis, trend reports
3. **Customer Support** — FAQ bot, ticket triage
4. **Sales Automation** — Lead generation, outreach sequences
5. **Financial Analysis** — Budget tracking, expense reports

```typescript
// ui/src/data/business-templates.ts
export const businessTemplates = [
  {
    id: 'content-creator',
    name: 'Content Creator',
    description: 'An AI team that creates blog posts, social media content, and newsletters',
    icon: '✍️',
    agents: [
      { role: 'Content Strategist', description: 'Plans topics and content calendar' },
      { role: 'Writer', description: 'Creates engaging content' },
      { role: 'Editor', description: 'Reviews and polishes content' }
    ],
    estimatedCost: '$2-10/task',
    popular: true
  },
  {
    id: 'market-research',
    name: 'Market Research',
    description: 'Analyze competitors, identify trends, and generate insights',
    icon: '🔍',
    agents: [
      { role: 'Research Analyst', description: 'Gathers market data' },
      { role: 'Competitor Analyst', description: 'Tracks competitor moves' },
      { role: 'Report Writer', description: 'Summarizes findings' }
    ],
    estimatedCost: '$5-20/report',
    popular: true
  },
  {
    id: 'customer-support',
    name: 'Customer Support',
    description: 'AI team to handle FAQs, triage tickets, and escalate issues',
    icon: '💬',
    agents: [
      { role: 'FAQ Bot', description: 'Answers common questions' },
      { role: 'Ticket Triager', description: 'Categorizes and routes tickets' },
      { role: 'Escalation Manager', description: 'Handles complex issues' }
    ],
    estimatedCost: '$0.01-0.05/interaction',
    popular: false
  },
  {
    id: 'sales-automation',
    name: 'Sales Automation',
    description: 'Generate leads, personalize outreach, and track follow-ups',
    icon: '📈',
    agents: [
      { role: 'Lead Researcher', description: 'Finds potential customers' },
      { role: 'Outreach Specialist', description: 'Crafts personalized messages' },
      { role: 'Follow-up Bot', description: 'Manages sequences' }
    ],
    estimatedCost: '$0.50-2/lead',
    popular: true
  },
  {
    id: 'financial-analysis',
    name: 'Financial Analysis',
    description: 'Track budgets, analyze expenses, and generate reports',
    icon: '💰',
    agents: [
      { role: 'Bookkeeper', description: 'Tracks transactions' },
      { role: 'Analyst', description: 'Identifies patterns' },
      { role: 'Report Generator', description: 'Creates summaries' }
    ],
    estimatedCost: '$1-5/report',
    popular: false
  }
];
```

```tsx
// ui/src/components/rostr/TemplateGallery.tsx
import { businessTemplates } from '@/data/business-templates';
import { Star, ArrowRight } from 'lucide-react';

export function TemplateGallery({ onSelect }: { onSelect: (templateId: string) => void }) {
  return (
    <div className="template-gallery">
      <h2 className="gallery-title">Start with a template</h2>
      <p className="gallery-subtitle">
        Pre-built AI teams ready to work. Click to customize or launch immediately.
      </p>

      <div className="template-grid">
        {businessTemplates.map((template) => (
          <button
            key={template.id}
            className="template-card"
            onClick={() => onSelect(template.id)}
          >
            <div className="template-header">
              <span className="template-icon">{template.icon}</span>
              {template.popular && (
                <span className="popular-badge">
                  <Star className="icon" /> Popular
                </span>
              )}
            </div>

            <h3 className="template-name">{template.name}</h3>
            <p className="template-description">{template.description}</p>

            <div className="template-agents">
              {template.agents.map((agent, i) => (
                <span key={i} className="agent-chip">{agent.role}</span>
              ))}
            </div>

            <div className="template-footer">
              <span className="cost">{template.estimatedCost}</span>
              <span className="launch-hint">
                Click to launch <ArrowRight className="icon" />
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
```

---

### Phase 2.3: Main Dashboard Layout

#### Task 7: Create the Non-Coder Home Page

**Objective:** A clean, friendly home that guides non-coders to success.

**Files:**
- Create: `ui/src/pages/rostr/Home.tsx`
- Modify: `ui/src/App.tsx` (add route)

**Layout:**
1. **Hero section** — Intent Commander
2. **Quick actions** — Template gallery
3. **Active teams** — Team visualizer
4. **Progress feed** — Story timeline

```tsx
// ui/src/pages/rostr/Home.tsx
import { useState } from 'react';
import { IntentCommander } from '@/components/rostr/IntentCommander';
import { TemplateGallery } from '@/components/rostr/TemplateGallery';
import { TeamVisualizer } from '@/components/rostr/TeamVisualizer';
import { ProgressStory } from '@/components/rostr/ProgressStory';

export function RostrHome() {
  const [activeTeams, setActiveTeams] = useState([]);
  const [events, setEvents] = useState([]);

  const handleTemplateSelect = (templateId: string) => {
    // Pre-fill the Intent Commander with template
    console.log('Selected template:', templateId);
  };

  return (
    <div className="rostr-home">
      {/* Hero: Intent Commander */}
      <section className="hero-section">
        <h1 className="hero-title">
          What would you like your AI team to do today?
        </h1>
        <IntentCommander />
      </section>

      {/* Quick Actions: Templates */}
      <section className="templates-section">
        <TemplateGallery onSelect={handleTemplateSelect} />
      </section>

      {/* Active Teams */}
      {activeTeams.length > 0 && (
        <section className="teams-section">
          <TeamVisualizer agents={activeTeams} />
        </section>
      )}

      {/* Progress Feed */}
      {events.length > 0 && (
        <section className="progress-section">
          <ProgressStory events={events} />
        </section>
      )}
    </div>
  );
}
```

---

## Part 3: Design System Enhancements

### Phase 3.1: Non-Coder Tokens

#### Task 8: Add ROSTR-specific design tokens

**Objective:** Extend Paperclip's token system with ROSTR-specific values.

**Files:**
- Modify: `ui/src/index.css`

**Tokens to add:**
- Intent Commander gradient
- Agent avatar ring colors
- Progress story status colors
- Template card hover states

```css
/* ROSTR Non-Coder Dashboard Tokens */
:root {
  /* Intent Commander */
  --rostr-intent-bg: oklch(0.15 0.02 260);
  --rostr-intent-border: oklch(0.3 0.05 260);
  --rostr-intent-glow: oklch(0.5 0.15 260);
  --rostr-intent-text: oklch(0.95 0.01 260);
  
  /* Agent Status Rings */
  --rostr-agent-idle: oklch(0.7 0.1 220);
  --rostr-agent-working: oklch(0.7 0.2 145);
  --rostr-agent-blocked: oklch(0.7 0.2 25);
  --rostr-agent-completed: oklch(0.7 0.2 145);
  
  /* Progress Story */
  --rostr-story-completed: oklch(0.7 0.15 145);
  --rostr-story-inprogress: oklch(0.7 0.15 220);
  --rostr-story-waiting: oklch(0.6 0.05 260);
  --rostr-story-error: oklch(0.7 0.2 25);
  
  /* Template Cards */
  --rostr-template-bg: oklch(0.12 0.02 260);
  --rostr-template-border: oklch(0.2 0.03 260);
  --rostr-template-hover: oklch(0.18 0.04 260);
  --rostr-popular-badge: oklch(0.7 0.2 60);
  
  /* Motion - Non-Coder Friendly (slower, smoother) */
  --rostr-motion-ease: cubic-bezier(0.4, 0, 0.2, 1);
  --rostr-motion-duration-fast: 200ms;
  --rostr-motion-duration-normal: 400ms;
  --rostr-motion-duration-slow: 600ms;
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --rostr-motion-duration-fast: 0ms;
    --rostr-motion-duration-normal: 0ms;
    --rostr-motion-duration-slow: 0ms;
  }
}
```

---

## Part 4: Onboarding Flow

### Phase 4.1: First-Time User Experience

#### Task 9: Create the Onboarding Wizard

**Objective:** Guide non-coders through their first AI team setup in 3 steps.

**Files:**
- Create: `ui/src/components/rostr/OnboardingWizard.tsx`

**Steps:**
1. **What's your goal?** — Natural language input
2. **Meet your team** — Preview auto-generated agents
3. **Set guardrails** — Budget limits, approval gates

```tsx
// ui/src/components/rostr/OnboardingWizard.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Users, Shield, ArrowRight, Check } from 'lucide-react';

type Step = 'goal' | 'team' | 'guardrails';

export function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<Step>('goal');
  const [goal, setGoal] = useState('');
  const [team, setTeam] = useState<any[]>([]);
  const [budget, setBudget] = useState(100);

  const steps: { id: Step; title: string; icon: typeof Target }[] = [
    { id: 'goal', title: "What's your goal?", icon: Target },
    { id: 'team', title: 'Meet your team', icon: Users },
    { id: 'guardrails', title: 'Set guardrails', icon: Shield }
  ];

  return (
    <div className="onboarding-wizard">
      {/* Progress Bar */}
      <div className="wizard-progress">
        {steps.map((s, i) => (
          <div
            key={s.id}
            className={`progress-step ${step === s.id ? 'active' : ''} ${
              steps.findIndex(x => x.id === step) > i ? 'completed' : ''
            }`}
          >
            <s.icon className="step-icon" />
            <span className="step-title">{s.title}</span>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="wizard-content"
        >
          {step === 'goal' && (
            <div className="step-goal">
              <h2>What would you like to accomplish?</h2>
              <p>Describe your goal in plain English. Don't worry about being technical.</p>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Example: I want to grow my newsletter to 10,000 subscribers by creating weekly content and promoting it on social media..."
                rows={4}
              />
              <button
                className="next-button"
                onClick={() => setStep('team')}
                disabled={goal.length < 20}
              >
                Next: See your team <ArrowRight />
              </button>
            </div>
          )}

          {step === 'team' && (
            <div className="step-team">
              <h2>Here's the team I've assembled for you</h2>
              <p>Based on your goal, these AI agents will work together:</p>
              {/* Team preview cards */}
              <button className="next-button" onClick={() => setStep('guardrails')}>
                Next: Set limits <ArrowRight />
              </button>
            </div>
          )}

          {step === 'guardrails' && (
            <div className="step-guardrails">
              <h2>Set your guardrails</h2>
              <p>Control how much your team can spend before asking for approval.</p>
              
              <div className="budget-slider">
                <label>Monthly budget limit</label>
                <input
                  type="range"
                  min={10}
                  max={1000}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                />
                <span className="budget-value">${budget}/month</span>
              </div>

              <button className="complete-button" onClick={onComplete}>
                <Check /> Launch my team
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
```

---

## Part 5: Deployment & Documentation

### Phase 5.1: README & Branding

#### Task 10: Update README with ROSTR integration

**Objective:** Document the fork and ROSTR features.

**Files:**
- Modify: `README.md`

---

## Implementation Priority

| Phase | Tasks | Est. Time | Non-Coder Impact |
|-------|-------|-----------|------------------|
| 1.1 | ROSTR core modules | 2 hours | Foundation |
| 1.2 | Server routes | 1 hour | API layer |
| 2.1 | Intent Commander | 3 hours | **HIGH** — primary interaction |
| 2.1 | Team Visualizer | 2 hours | **HIGH** — builds trust |
| 2.1 | Progress Story | 2 hours | **HIGH** — reduces anxiety |
| 2.2 | Template Gallery | 2 hours | **MEDIUM** — quick start |
| 2.3 | Home Page | 2 hours | **HIGH** — first impression |
| 3.1 | Design tokens | 1 hour | Polish |
| 4.1 | Onboarding Wizard | 2 hours | **HIGH** — retention |
| 5.1 | Documentation | 1 hour | Community |

**Total estimated time:** 18 hours

---

## Success Metrics

For non-coders, we measure:

1. **Time to first success** — How long from signup to first completed task?
   - Target: < 5 minutes

2. **Zero-code completion rate** — % of tasks completed without touching code
   - Target: > 90%

3. **Intent accuracy** — Does the system understand what they meant?
   - Target: > 85% first-try accuracy

4. **Trust indicators** — Do users understand what their agents are doing?
   - Target: < 10% "I don't know what's happening" feedback

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| PAL misunderstands intent | User frustration | Add "Did you mean...?" confirmation step |
| Agents take too long | User abandonment | Show engaging progress stories |
| Costs exceed expectations | User churn | Hard budget limits with clear warnings |
| Technical jargon leaks through | Confusion | Lint rule to flag technical terms in UI copy |

---

**Plan complete and saved.**

Ready to execute using subagent-driven-development — I'll dispatch a fresh subagent per task with two-stage review. Shall I proceed?
