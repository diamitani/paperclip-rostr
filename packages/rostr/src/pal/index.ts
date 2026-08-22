/**
 * PAL - Prompt Assembly Language
 * Compiles natural language intent into executable agent manifests
 * 
 * The heart of the non-coder experience: users speak plain English,
 * PAL translates it into structured agent instructions.
 */

import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export const DomainSchema = z.enum([
  'business',
  'engineering', 
  'marketing',
  'operations',
  'finance',
  'creative',
  'research',
  'support'
]);

export type Domain = z.infer<typeof DomainSchema>;

export const PALIntentSchema = z.object({
  raw: z.string(),
  verb: z.string(),
  object: z.string(),
  domain: DomainSchema,
  constraints: z.array(z.string()),
  entities: z.array(z.object({
    type: z.string(),
    value: z.string(),
    confidence: z.number()
  })),
  confidence: z.number().min(0).max(1),
  suggestedClarifications: z.array(z.string()).optional()
});

export type PALIntent = z.infer<typeof PALIntentSchema>;

export const AgentManifestSchema = z.object({
  role: z.string(),
  name: z.string(),
  goal: z.string(),
  skills: z.array(z.string()),
  tools: z.array(z.string()),
  adapter: z.string().default('openclaw'),
  budget: z.number().optional(),
  deadline: z.string().optional(),
  approvalRequired: z.boolean().default(false),
  dependencies: z.array(z.string()).default([])
});

export type AgentManifest = z.infer<typeof AgentManifestSchema>;

export const TeamManifestSchema = z.object({
  goal: z.string(),
  domain: DomainSchema,
  agents: z.array(AgentManifestSchema),
  workflow: z.enum(['parallel', 'sequential', 'hybrid']),
  estimatedCost: z.object({
    min: z.number(),
    max: z.number(),
    currency: z.string().default('USD')
  }),
  estimatedTime: z.object({
    min: z.number(),
    max: z.number(),
    unit: z.enum(['minutes', 'hours', 'days'])
  })
});

export type TeamManifest = z.infer<typeof TeamManifestSchema>;

// ─────────────────────────────────────────────────────────────────
// Domain Configuration - The "brain" of intent classification
// ─────────────────────────────────────────────────────────────────

interface DomainConfig {
  signals: string[];
  verbs: string[];
  roles: { name: string; humanName: string; skills: string[]; tools: string[] }[];
  defaultWorkflow: 'parallel' | 'sequential' | 'hybrid';
}

const DOMAIN_CONFIG: Record<Domain, DomainConfig> = {
  business: {
    signals: ['strategy', 'goal', 'growth', 'hire', 'team', 'plan', 'vision', 'roadmap', 'okr'],
    verbs: ['plan', 'strategize', 'define', 'align', 'coordinate'],
    roles: [
      { name: 'strategist', humanName: 'Alex the Strategist', skills: ['planning', 'analysis'], tools: ['docs', 'calendar'] },
      { name: 'coordinator', humanName: 'Sam the Coordinator', skills: ['project-management'], tools: ['tasks', 'calendar'] }
    ],
    defaultWorkflow: 'sequential'
  },
  engineering: {
    signals: ['build', 'code', 'deploy', 'fix', 'debug', 'api', 'database', 'app', 'website', 'feature', 'bug'],
    verbs: ['build', 'create', 'develop', 'fix', 'deploy', 'implement', 'code'],
    roles: [
      { name: 'developer', humanName: 'Dev the Engineer', skills: ['coding', 'debugging', 'architecture'], tools: ['github', 'terminal', 'browser'] },
      { name: 'reviewer', humanName: 'Riley the Reviewer', skills: ['code-review', 'testing'], tools: ['github', 'terminal'] },
      { name: 'deployer', humanName: 'Dana the DevOps', skills: ['deployment', 'monitoring'], tools: ['terminal', 'cloud'] }
    ],
    defaultWorkflow: 'sequential'
  },
  marketing: {
    signals: ['campaign', 'content', 'social', 'brand', 'launch', 'audience', 'engagement', 'newsletter', 'blog', 'post'],
    verbs: ['launch', 'promote', 'create', 'write', 'publish', 'grow'],
    roles: [
      { name: 'strategist', humanName: 'Morgan the Marketer', skills: ['strategy', 'analytics'], tools: ['analytics', 'social-api'] },
      { name: 'writer', humanName: 'Casey the Content Writer', skills: ['copywriting', 'seo'], tools: ['docs', 'cms'] },
      { name: 'designer', humanName: 'Jordan the Designer', skills: ['visual-design', 'branding'], tools: ['design', 'images'] }
    ],
    defaultWorkflow: 'parallel'
  },
  operations: {
    signals: ['process', 'workflow', 'automate', 'schedule', 'monitor', 'optimize', 'efficiency'],
    verbs: ['automate', 'streamline', 'optimize', 'schedule', 'manage'],
    roles: [
      { name: 'analyst', humanName: 'Taylor the Ops Analyst', skills: ['process-design', 'analysis'], tools: ['spreadsheet', 'automation'] },
      { name: 'automator', humanName: 'Avery the Automator', skills: ['automation', 'integration'], tools: ['zapier', 'api'] }
    ],
    defaultWorkflow: 'sequential'
  },
  finance: {
    signals: ['budget', 'cost', 'revenue', 'forecast', 'expense', 'invoice', 'payment', 'profit', 'loss'],
    verbs: ['analyze', 'forecast', 'track', 'calculate', 'report'],
    roles: [
      { name: 'analyst', humanName: 'Finn the Financial Analyst', skills: ['analysis', 'forecasting'], tools: ['spreadsheet', 'database'] },
      { name: 'bookkeeper', humanName: 'Bailey the Bookkeeper', skills: ['bookkeeping', 'reconciliation'], tools: ['accounting', 'spreadsheet'] }
    ],
    defaultWorkflow: 'sequential'
  },
  creative: {
    signals: ['design', 'video', 'image', 'logo', 'brand', 'visual', 'creative', 'artwork', 'graphics'],
    verbs: ['design', 'create', 'produce', 'make', 'generate'],
    roles: [
      { name: 'designer', humanName: 'Dakota the Designer', skills: ['visual-design', 'branding'], tools: ['design', 'images'] },
      { name: 'producer', humanName: 'Parker the Producer', skills: ['video-editing', 'audio'], tools: ['video', 'audio'] }
    ],
    defaultWorkflow: 'parallel'
  },
  research: {
    signals: ['research', 'analyze', 'competitor', 'market', 'trend', 'data', 'insight', 'study', 'survey'],
    verbs: ['research', 'analyze', 'investigate', 'study', 'explore', 'discover'],
    roles: [
      { name: 'researcher', humanName: 'Robin the Researcher', skills: ['research', 'analysis'], tools: ['browser', 'database'] },
      { name: 'analyst', humanName: 'Quinn the Data Analyst', skills: ['data-analysis', 'visualization'], tools: ['spreadsheet', 'charts'] }
    ],
    defaultWorkflow: 'parallel'
  },
  support: {
    signals: ['help', 'support', 'ticket', 'customer', 'issue', 'question', 'faq', 'chat'],
    verbs: ['help', 'support', 'assist', 'resolve', 'answer'],
    roles: [
      { name: 'agent', humanName: 'Sage the Support Agent', skills: ['customer-service', 'problem-solving'], tools: ['ticketing', 'knowledge-base'] },
      { name: 'escalation', humanName: 'Reese the Escalation Manager', skills: ['conflict-resolution', 'technical-support'], tools: ['ticketing', 'communication'] }
    ],
    defaultWorkflow: 'sequential'
  }
};

// ─────────────────────────────────────────────────────────────────
// PAL Compiler - The main class
// ─────────────────────────────────────────────────────────────────

export class PALCompiler {
  private config = DOMAIN_CONFIG;

  /**
   * Compile natural language into a team manifest
   */
  async compile(input: string): Promise<{
    intent: PALIntent;
    team: TeamManifest;
    humanSummary: string;
  }> {
    // Stage 1: Extract intent
    const intent = this.extractIntent(input);
    
    // Stage 2: Generate team manifest
    const team = this.generateTeam(intent);
    
    // Stage 3: Create human-readable summary
    const humanSummary = this.generateHumanSummary(intent, team);
    
    return { intent, team, humanSummary };
  }

  /**
   * Extract structured intent from natural language
   */
  private extractIntent(input: string): PALIntent {
    const normalizedInput = input.toLowerCase().trim();
    
    // Find matching domain
    const domain = this.classifyDomain(normalizedInput);
    const domainConfig = this.config[domain];
    
    // Extract verb
    const verb = this.extractVerb(normalizedInput, domainConfig.verbs);
    
    // Extract entities (numbers, dates, names)
    const entities = this.extractEntities(input);
    
    // Extract constraints (deadlines, budgets, requirements)
    const constraints = this.extractConstraints(normalizedInput);
    
    // Calculate confidence
    const confidence = this.calculateConfidence(normalizedInput, domain, verb);
    
    // Suggest clarifications if confidence is low
    const suggestedClarifications = confidence < 0.7 
      ? this.suggestClarifications(normalizedInput, domain)
      : undefined;
    
    return {
      raw: input,
      verb,
      object: this.extractObject(normalizedInput, verb),
      domain,
      constraints,
      entities,
      confidence,
      suggestedClarifications
    };
  }

  private classifyDomain(input: string): Domain {
    const scores: Record<Domain, number> = {
      business: 0, engineering: 0, marketing: 0, operations: 0,
      finance: 0, creative: 0, research: 0, support: 0
    };

    for (const [domain, config] of Object.entries(this.config)) {
      for (const signal of config.signals) {
        if (input.includes(signal)) {
          scores[domain as Domain] += 2;
        }
      }
      for (const verb of config.verbs) {
        if (input.includes(verb)) {
          scores[domain as Domain] += 1;
        }
      }
    }

    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    return (sorted[0][1] > 0 ? sorted[0][0] : 'business') as Domain;
  }

  private extractVerb(input: string, domainVerbs: string[]): string {
    const allVerbs = [
      'build', 'create', 'make', 'develop', 'design', 'write',
      'analyze', 'research', 'study', 'investigate',
      'launch', 'deploy', 'publish', 'release',
      'fix', 'improve', 'optimize', 'update',
      'automate', 'streamline', 'integrate',
      'track', 'monitor', 'report',
      'help', 'support', 'assist',
      ...domainVerbs
    ];

    for (const verb of allVerbs) {
      if (input.includes(verb)) {
        return verb;
      }
    }
    return 'execute';
  }

  private extractObject(input: string, verb: string): string {
    // Remove the verb and clean up
    let object = input.replace(new RegExp(`\\b${verb}\\b`, 'gi'), '').trim();
    
    // Remove common filler words at the start
    object = object.replace(/^(a|an|the|my|our|some|this|that)\s+/i, '');
    
    // Capitalize first letter
    return object.charAt(0).toUpperCase() + object.slice(1);
  }

  private extractEntities(input: string): PALIntent['entities'] {
    const entities: PALIntent['entities'] = [];
    
    // Extract numbers
    const numbers = input.match(/\$?[\d,]+(\.\d{2})?/g);
    if (numbers) {
      for (const num of numbers) {
        entities.push({
          type: num.startsWith('$') ? 'currency' : 'number',
          value: num,
          confidence: 0.9
        });
      }
    }
    
    // Extract dates
    const datePatterns = [
      /by\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi,
      /by\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{1,2}/gi,
      /in\s+(\d+)\s+(days?|weeks?|months?)/gi,
      /(tomorrow|next\s+week|next\s+month|end\s+of\s+(week|month|year))/gi
    ];
    
    for (const pattern of datePatterns) {
      const matches = input.match(pattern);
      if (matches) {
        for (const match of matches) {
          entities.push({ type: 'deadline', value: match, confidence: 0.85 });
        }
      }
    }
    
    // Extract email addresses
    const emails = input.match(/[\w.-]+@[\w.-]+\.\w+/g);
    if (emails) {
      for (const email of emails) {
        entities.push({ type: 'email', value: email, confidence: 0.95 });
      }
    }
    
    return entities;
  }

  private extractConstraints(input: string): string[] {
    const constraints: string[] = [];
    
    // Budget constraints
    if (input.includes('budget') || input.includes('cost') || input.includes('spend')) {
      const budgetMatch = input.match(/(\$[\d,]+|\d+\s*dollars?)/i);
      if (budgetMatch) {
        constraints.push(`budget:${budgetMatch[0]}`);
      }
    }
    
    // Time constraints
    if (input.includes('asap') || input.includes('urgent')) {
      constraints.push('priority:high');
    }
    if (input.includes('by ') || input.includes('deadline')) {
      constraints.push('has_deadline');
    }
    
    // Quality constraints
    if (input.includes('professional') || input.includes('high quality')) {
      constraints.push('quality:high');
    }
    
    return constraints;
  }

  private calculateConfidence(input: string, domain: Domain, verb: string): number {
    let score = 0.5; // Base confidence
    
    const config = this.config[domain];
    
    // Boost for domain signal matches
    const domainMatches = config.signals.filter(s => input.includes(s)).length;
    score += Math.min(domainMatches * 0.1, 0.3);
    
    // Boost for verb match
    if (config.verbs.includes(verb)) {
      score += 0.15;
    }
    
    // Boost for length (more detail = more confident)
    if (input.length > 50) score += 0.05;
    if (input.length > 100) score += 0.05;
    
    return Math.min(score, 0.99);
  }

  private suggestClarifications(input: string, domain: Domain): string[] {
    const suggestions: string[] = [];
    
    if (!input.match(/\$[\d,]+/)) {
      suggestions.push('What budget do you have in mind?');
    }
    
    if (!input.match(/(by|deadline|asap|urgent|tomorrow|week|month)/i)) {
      suggestions.push('When do you need this done?');
    }
    
    const config = this.config[domain];
    if (config.roles.length > 2) {
      suggestions.push('Would you like to specify which team members to involve?');
    }
    
    return suggestions;
  }

  /**
   * Generate a team manifest from the intent
   */
  private generateTeam(intent: PALIntent): TeamManifest {
    const config = this.config[intent.domain];
    
    // Select agents based on the task complexity
    const taskComplexity = this.estimateComplexity(intent);
    const agentCount = Math.min(taskComplexity + 1, config.roles.length);
    const selectedRoles = config.roles.slice(0, agentCount);
    
    const agents: AgentManifest[] = selectedRoles.map((role, index) => ({
      role: role.name,
      name: role.humanName,
      goal: index === 0 
        ? intent.raw 
        : `Support the team in: ${intent.object}`,
      skills: role.skills,
      tools: role.tools,
      adapter: 'openclaw',
      approvalRequired: intent.constraints.includes('priority:high'),
      dependencies: index > 0 ? [selectedRoles[0].name] : []
    }));

    // Estimate cost and time
    const estimatedCost = this.estimateCost(agents, taskComplexity);
    const estimatedTime = this.estimateTime(agents, taskComplexity);

    return {
      goal: intent.raw,
      domain: intent.domain,
      agents,
      workflow: config.defaultWorkflow,
      estimatedCost,
      estimatedTime
    };
  }

  private estimateComplexity(intent: PALIntent): number {
    let complexity = 1;
    
    if (intent.constraints.includes('quality:high')) complexity++;
    if (intent.constraints.includes('has_deadline')) complexity++;
    if (intent.raw.length > 100) complexity++;
    if (intent.entities.length > 2) complexity++;
    
    return Math.min(complexity, 4);
  }

  private estimateCost(agents: AgentManifest[], complexity: number): TeamManifest['estimatedCost'] {
    const basePerAgent = 0.5; // $0.50 base per agent
    const complexityMultiplier = 1 + (complexity * 0.5);
    
    const min = agents.length * basePerAgent * complexityMultiplier;
    const max = min * 3;
    
    return {
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      currency: 'USD'
    };
  }

  private estimateTime(agents: AgentManifest[], complexity: number): TeamManifest['estimatedTime'] {
    const baseMinutes = 5;
    const complexityMultiplier = complexity;
    
    return {
      min: baseMinutes * complexityMultiplier,
      max: baseMinutes * complexityMultiplier * 3,
      unit: 'minutes'
    };
  }

  /**
   * Generate a human-readable summary for non-coders
   */
  private generateHumanSummary(intent: PALIntent, team: TeamManifest): string {
    const agentNames = team.agents.map(a => a.name.split(' ')[0]).join(', ');
    const timeRange = `${team.estimatedTime.min}-${team.estimatedTime.max} ${team.estimatedTime.unit}`;
    const costRange = `$${team.estimatedCost.min.toFixed(2)}-$${team.estimatedCost.max.toFixed(2)}`;
    
    return `I'll assemble a team of ${team.agents.length} AI agents (${agentNames}) to help you ${intent.verb} ${intent.object.toLowerCase()}. This should take about ${timeRange} and cost approximately ${costRange}.`;
  }
}

// ─────────────────────────────────────────────────────────────────
// Export singleton for convenience
// ─────────────────────────────────────────────────────────────────

export const palCompiler = new PALCompiler();
