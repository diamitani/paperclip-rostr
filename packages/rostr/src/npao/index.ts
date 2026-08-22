/**
 * NPAO - Necessity, Priority, Anxiety, Opportunity
 * 5D Phase Classification + 4D Priority Scoring
 * 
 * The decision engine that helps non-coders understand
 * what to focus on without drowning in task lists.
 */

import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export const PhaseSchema = z.enum(['now', 'this-week', 'this-month', 'later', 'someday']);
export type Phase = z.infer<typeof PhaseSchema>;

export const NPAOScoreSchema = z.object({
  necessity: z.number().min(0).max(10),  // Must do (contracts, deadlines, compliance)
  priority: z.number().min(0).max(10),   // Should do (revenue, growth)
  anxiety: z.number().min(0).max(10),    // Worrying about (risk, uncertainty)
  opportunity: z.number().min(0).max(10), // Could gain (upside, expansion)
  
  phase: PhaseSchema,
  score: z.number().min(0).max(10),
  
  humanExplanation: z.string(),
  actionableAdvice: z.string()
});

export type NPAOScore = z.infer<typeof NPAOScoreSchema>;

export const TaskInputSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  signals: z.array(z.string()).default([]),
  dueDate: z.string().optional(),
  assignee: z.string().optional(),
  tags: z.array(z.string()).default([])
});

export type TaskInput = z.infer<typeof TaskInputSchema>;

// ─────────────────────────────────────────────────────────────────
// Signal Dictionaries - Keywords that indicate each dimension
// ─────────────────────────────────────────────────────────────────

const NECESSITY_SIGNALS = {
  high: ['deadline', 'contract', 'legal', 'compliance', 'required', 'must', 'mandatory', 
         'lawsuit', 'audit', 'regulatory', 'policy', 'overdue', 'past due', 'expire'],
  medium: ['important', 'needed', 'should', 'expected', 'committed', 'promised'],
  low: ['optional', 'nice to have', 'if possible', 'when you can']
};

const PRIORITY_SIGNALS = {
  high: ['revenue', 'sales', 'customer', 'growth', 'critical', 'key', 'strategic',
         'launch', 'release', 'ship', 'deliver', 'investor', 'funding', 'major'],
  medium: ['important', 'significant', 'valuable', 'beneficial'],
  low: ['minor', 'small', 'incremental', 'nice to have']
};

const ANXIETY_SIGNALS = {
  high: ['risk', 'worried', 'concern', 'uncertain', 'blocked', 'failing', 'broken',
         'outage', 'emergency', 'crisis', 'urgent', 'asap', 'immediately', 'fire'],
  medium: ['issue', 'problem', 'bug', 'error', 'slow', 'degraded'],
  low: ['monitor', 'watch', 'track', 'review']
};

const OPPORTUNITY_SIGNALS = {
  high: ['opportunity', 'potential', 'expand', 'new market', 'innovation', 'upside',
         'partnership', 'acquisition', 'viral', 'trending', '10x', 'moonshot'],
  medium: ['improve', 'enhance', 'upgrade', 'optimize', 'grow'],
  low: ['experiment', 'explore', 'test', 'try']
};

// ─────────────────────────────────────────────────────────────────
// NPAO Classifier
// ─────────────────────────────────────────────────────────────────

export class NPAOClassifier {
  /**
   * Weights for the composite score
   * Necessity is weighted highest because it's about obligations
   */
  private weights = {
    necessity: 0.55,
    priority: 0.30,
    anxiety: 0.10,
    opportunity: 0.05
  };

  /**
   * Classify a task and return its NPAO score
   */
  classify(task: TaskInput): NPAOScore {
    const text = this.buildSearchText(task);
    
    const necessity = this.scoreDimension(text, NECESSITY_SIGNALS);
    const priority = this.scoreDimension(text, PRIORITY_SIGNALS);
    const anxiety = this.scoreDimension(text, ANXIETY_SIGNALS);
    const opportunity = this.scoreDimension(text, OPPORTUNITY_SIGNALS);

    // Phase is determined by the DOMINANT dimension, not composite
    // This prevents the "everything is medium priority" trap
    const phase = this.determinePhase({ necessity, priority, anxiety, opportunity }, task.dueDate);

    // Weighted composite for ordering within a phase
    const score = 
      necessity * this.weights.necessity +
      priority * this.weights.priority +
      anxiety * this.weights.anxiety +
      opportunity * this.weights.opportunity;

    const humanExplanation = this.generateExplanation({ necessity, priority, anxiety, opportunity }, phase);
    const actionableAdvice = this.generateAdvice(phase, { necessity, priority, anxiety, opportunity });

    return {
      necessity,
      priority,
      anxiety,
      opportunity,
      phase,
      score: Math.round(score * 10) / 10,
      humanExplanation,
      actionableAdvice
    };
  }

  /**
   * Classify multiple tasks and return them sorted by priority
   */
  classifyBatch(tasks: TaskInput[]): Array<TaskInput & { npao: NPAOScore }> {
    const classified = tasks.map(task => ({
      ...task,
      npao: this.classify(task)
    }));

    // Sort by phase first, then by score within phase
    const phaseOrder: Record<Phase, number> = {
      'now': 0,
      'this-week': 1,
      'this-month': 2,
      'later': 3,
      'someday': 4
    };

    return classified.sort((a, b) => {
      const phaseDiff = phaseOrder[a.npao.phase] - phaseOrder[b.npao.phase];
      if (phaseDiff !== 0) return phaseDiff;
      return b.npao.score - a.npao.score;
    });
  }

  /**
   * Build the text to search for signals
   */
  private buildSearchText(task: TaskInput): string {
    return [
      task.title,
      task.description || '',
      task.signals.join(' '),
      task.tags.join(' ')
    ].join(' ').toLowerCase();
  }

  /**
   * Score a dimension (0-10) based on signal matches
   */
  private scoreDimension(text: string, signals: { high: string[]; medium: string[]; low: string[] }): number {
    let score = 0;
    
    for (const signal of signals.high) {
      if (text.includes(signal)) score += 3;
    }
    for (const signal of signals.medium) {
      if (text.includes(signal)) score += 2;
    }
    for (const signal of signals.low) {
      if (text.includes(signal)) score += 1;
    }

    // Normalize to 0-10
    return Math.min(10, score);
  }

  /**
   * Determine phase based on dominant dimension + deadline
   * 
   * CRITICAL: The dominant lens decides the band. A pure "necessary" task
   * (royalties, contracts, filings) should be "do now" even if other dimensions
   * are zero. Weighted composites alone would score it ~4/10 = "this-week".
   */
  private determinePhase(
    scores: { necessity: number; priority: number; anxiety: number; opportunity: number },
    dueDate?: string
  ): Phase {
    // Check for explicit deadline first
    if (dueDate) {
      const due = new Date(dueDate);
      const now = new Date();
      const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue <= 1) return 'now';
      if (daysUntilDue <= 7) return 'this-week';
      if (daysUntilDue <= 30) return 'this-month';
    }

    // Anxiety can override everything (emergencies)
    if (scores.anxiety >= 7) return 'now';

    // Necessity determines the base band
    if (scores.necessity >= 5) return 'now';
    if (scores.necessity >= 3 || scores.priority >= 5) return 'this-week';
    
    // Priority and opportunity for lower bands
    if (scores.priority >= 3 || scores.opportunity >= 5) return 'this-month';
    if (scores.opportunity >= 3) return 'later';
    
    return 'someday';
  }

  /**
   * Generate a human-readable explanation for non-coders
   */
  private generateExplanation(
    scores: { necessity: number; priority: number; anxiety: number; opportunity: number },
    phase: Phase
  ): string {
    const dominant = this.findDominantDimension(scores);
    
    const dimensionExplanations: Record<string, string> = {
      necessity: 'This involves obligations or commitments that need to be fulfilled.',
      priority: 'This directly impacts your business goals and revenue.',
      anxiety: 'This is causing stress and needs attention to reduce risk.',
      opportunity: 'This could open up new possibilities for growth.'
    };

    const phaseExplanations: Record<Phase, string> = {
      'now': 'Handle this immediately.',
      'this-week': 'Plan to complete this within the next few days.',
      'this-month': 'Schedule this for sometime this month.',
      'later': 'Keep this on your radar but no rush.',
      'someday': 'Nice to have when you have extra time.'
    };

    return `${dimensionExplanations[dominant]} ${phaseExplanations[phase]}`;
  }

  /**
   * Generate actionable advice for non-coders
   */
  private generateAdvice(
    phase: Phase,
    scores: { necessity: number; priority: number; anxiety: number; opportunity: number }
  ): string {
    const adviceByPhase: Record<Phase, string[]> = {
      'now': [
        'Block time on your calendar today to handle this.',
        'Consider delegating other tasks to make room.',
        'This is your top priority right now.'
      ],
      'this-week': [
        'Add this to your weekly goals.',
        'Schedule a specific time slot this week.',
        'Don\'t let this slip to next week.'
      ],
      'this-month': [
        'Add this to your monthly planning.',
        'Review progress in your next weekly review.',
        'Break this into smaller weekly tasks.'
      ],
      'later': [
        'Add this to your someday/maybe list.',
        'Review this in your monthly planning.',
        'Consider if this aligns with your long-term goals.'
      ],
      'someday': [
        'Keep this in your ideas backlog.',
        'Revisit when you have extra capacity.',
        'Don\'t let this distract from current priorities.'
      ]
    };

    const advice = adviceByPhase[phase];
    return advice[Math.floor(Math.random() * advice.length)];
  }

  private findDominantDimension(
    scores: { necessity: number; priority: number; anxiety: number; opportunity: number }
  ): string {
    const entries = Object.entries(scores);
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0];
  }
}

// ─────────────────────────────────────────────────────────────────
// Export singleton for convenience
// ─────────────────────────────────────────────────────────────────

export const npaoClassifier = new NPAOClassifier();
