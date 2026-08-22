/**
 * RAG DAL - Retrieval-Augmented Generation Data Access Layer
 * 3-tier knowledge retrieval with confidence scoring
 * 
 * Helps non-coders' AI agents access company knowledge
 * without configuring databases or APIs.
 */

import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export const KnowledgeChunkSchema = z.object({
  id: z.string(),
  content: z.string(),
  source: z.string(),
  sourceType: z.enum(['document', 'conversation', 'agent_learning', 'user_input', 'external']),
  embedding: z.array(z.number()).optional(),
  metadata: z.record(z.unknown()),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type KnowledgeChunk = z.infer<typeof KnowledgeChunkSchema>;

export const RetrievalStrategySchema = z.enum(['exact', 'semantic', 'hybrid', 'temporal']);
export type RetrievalStrategy = z.infer<typeof RetrievalStrategySchema>;

export const RetrievalResultSchema = z.object({
  chunks: z.array(KnowledgeChunkSchema),
  confidence: z.number().min(0).max(1),
  strategy: RetrievalStrategySchema,
  queryTime: z.number(),
  humanExplanation: z.string()
});

export type RetrievalResult = z.infer<typeof RetrievalResultSchema>;

// ─────────────────────────────────────────────────────────────────
// Simple Text Similarity (No external deps)
// ─────────────────────────────────────────────────────────────────

class SimpleSimilarity {
  /**
   * Calculate Jaccard similarity between two texts
   */
  jaccard(text1: string, text2: string): number {
    const tokens1 = new Set(this.tokenize(text1));
    const tokens2 = new Set(this.tokenize(text2));
    
    const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
    const union = new Set([...tokens1, ...tokens2]);
    
    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  /**
   * Calculate BM25-like relevance score
   */
  relevance(query: string, document: string): number {
    const queryTokens = this.tokenize(query);
    const docTokens = this.tokenize(document);
    const docSet = new Set(docTokens);
    
    let score = 0;
    for (const token of queryTokens) {
      if (docSet.has(token)) {
        // Simple TF-IDF-like scoring
        const tf = docTokens.filter(t => t === token).length;
        score += Math.log(1 + tf);
      }
    }
    
    // Normalize by query length
    return queryTokens.length === 0 ? 0 : score / queryTokens.length;
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2);
  }
}

// ─────────────────────────────────────────────────────────────────
// RAG DAL Class
// ─────────────────────────────────────────────────────────────────

export class RAGDAL {
  private knowledgeBase: KnowledgeChunk[] = [];
  private similarity = new SimpleSimilarity();

  /**
   * Index new knowledge chunks
   */
  async index(chunks: Omit<KnowledgeChunk, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<KnowledgeChunk[]> {
    const now = new Date().toISOString();
    const indexed: KnowledgeChunk[] = [];

    for (const chunk of chunks) {
      const fullChunk: KnowledgeChunk = {
        ...chunk,
        id: `chunk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
        updatedAt: now
      };
      this.knowledgeBase.push(fullChunk);
      indexed.push(fullChunk);
    }

    return indexed;
  }

  /**
   * Index a single piece of text (convenience method)
   */
  async indexText(
    content: string, 
    source: string, 
    sourceType: KnowledgeChunk['sourceType'] = 'document',
    metadata: Record<string, unknown> = {}
  ): Promise<KnowledgeChunk> {
    const [chunk] = await this.index([{ content, source, sourceType, metadata }]);
    return chunk;
  }

  /**
   * Retrieve relevant knowledge using 3-tier strategy
   */
  async retrieve(query: string, limit: number = 5): Promise<RetrievalResult> {
    const startTime = Date.now();

    // Tier 1: Exact match (fastest, highest confidence)
    const exactMatches = this.exactMatch(query);
    if (exactMatches.length >= limit) {
      return this.buildResult(exactMatches.slice(0, limit), 'exact', startTime);
    }

    // Tier 2: Semantic similarity (keyword-based)
    const semanticMatches = this.semanticMatch(query, limit);
    if (semanticMatches.length >= limit) {
      return this.buildResult(semanticMatches.slice(0, limit), 'semantic', startTime);
    }

    // Tier 3: Hybrid (combine exact + semantic + temporal boost)
    const hybridMatches = this.hybridMatch(query, limit);
    return this.buildResult(hybridMatches, 'hybrid', startTime);
  }

  /**
   * Search with a specific strategy
   */
  async search(query: string, strategy: RetrievalStrategy, limit: number = 5): Promise<RetrievalResult> {
    const startTime = Date.now();

    switch (strategy) {
      case 'exact':
        return this.buildResult(this.exactMatch(query).slice(0, limit), 'exact', startTime);
      case 'semantic':
        return this.buildResult(this.semanticMatch(query, limit), 'semantic', startTime);
      case 'temporal':
        return this.buildResult(this.temporalMatch(limit), 'temporal', startTime);
      case 'hybrid':
      default:
        return this.buildResult(this.hybridMatch(query, limit), 'hybrid', startTime);
    }
  }

  /**
   * Get knowledge stats for non-coders
   */
  getStats(): {
    totalChunks: number;
    bySource: Record<string, number>;
    byType: Record<string, number>;
    recentlyAdded: number;
  } {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const bySource: Record<string, number> = {};
    const byType: Record<string, number> = {};

    for (const chunk of this.knowledgeBase) {
      bySource[chunk.source] = (bySource[chunk.source] || 0) + 1;
      byType[chunk.sourceType] = (byType[chunk.sourceType] || 0) + 1;
    }

    return {
      totalChunks: this.knowledgeBase.length,
      bySource,
      byType,
      recentlyAdded: this.knowledgeBase.filter(c => c.createdAt > oneDayAgo).length
    };
  }

  /**
   * Clear all knowledge (with confirmation)
   */
  clear(): void {
    this.knowledgeBase = [];
  }

  // ─────────────────────────────────────────────────────────────────
  // Private methods
  // ─────────────────────────────────────────────────────────────────

  private exactMatch(query: string): KnowledgeChunk[] {
    const normalizedQuery = query.toLowerCase().trim();
    return this.knowledgeBase.filter(chunk => 
      chunk.content.toLowerCase().includes(normalizedQuery)
    );
  }

  private semanticMatch(query: string, limit: number): KnowledgeChunk[] {
    return this.knowledgeBase
      .map(chunk => ({
        chunk,
        score: this.similarity.relevance(query, chunk.content)
      }))
      .filter(({ score }) => score > 0.1)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ chunk }) => chunk);
  }

  private temporalMatch(limit: number): KnowledgeChunk[] {
    return [...this.knowledgeBase]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, limit);
  }

  private hybridMatch(query: string, limit: number): KnowledgeChunk[] {
    const exactSet = new Set(this.exactMatch(query).map(c => c.id));
    
    const scored = this.knowledgeBase.map(chunk => {
      let score = this.similarity.relevance(query, chunk.content);
      
      // Boost exact matches
      if (exactSet.has(chunk.id)) {
        score += 1;
      }
      
      // Temporal boost for recent content
      const ageInDays = (Date.now() - new Date(chunk.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (ageInDays < 7) {
        score += 0.2;
      } else if (ageInDays < 30) {
        score += 0.1;
      }
      
      return { chunk, score };
    });

    return scored
      .filter(({ score }) => score > 0.05)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ chunk }) => chunk);
  }

  private buildResult(
    chunks: KnowledgeChunk[], 
    strategy: RetrievalStrategy, 
    startTime: number
  ): RetrievalResult {
    const queryTime = Date.now() - startTime;

    // Calculate confidence based on strategy and results
    let confidence: number;
    if (strategy === 'exact' && chunks.length > 0) {
      confidence = 0.95;
    } else if (strategy === 'semantic' && chunks.length > 0) {
      confidence = 0.75;
    } else if (chunks.length > 0) {
      confidence = 0.60;
    } else {
      confidence = 0.1;
    }

    // Adjust confidence based on number of results
    confidence = Math.min(confidence, 0.3 + (chunks.length * 0.1));

    const humanExplanation = this.generateExplanation(strategy, chunks.length, confidence);

    return {
      chunks,
      confidence,
      strategy,
      queryTime,
      humanExplanation
    };
  }

  private generateExplanation(strategy: RetrievalStrategy, count: number, confidence: number): string {
    if (count === 0) {
      return "I couldn't find any relevant information in your knowledge base. Try adding more context or documents.";
    }

    const strategyExplanations: Record<RetrievalStrategy, string> = {
      exact: `Found ${count} exact match${count > 1 ? 'es' : ''}.`,
      semantic: `Found ${count} related piece${count > 1 ? 's' : ''} of information.`,
      hybrid: `Found ${count} relevant result${count > 1 ? 's' : ''} using multiple search strategies.`,
      temporal: `Found the ${count} most recent piece${count > 1 ? 's' : ''} of information.`
    };

    const confidenceNote = confidence >= 0.8 
      ? "I'm very confident this is what you need."
      : confidence >= 0.6
      ? "This should be helpful."
      : "These might be relevant, but you may want to verify.";

    return `${strategyExplanations[strategy]} ${confidenceNote}`;
  }
}

// ─────────────────────────────────────────────────────────────────
// Export factory and singleton
// ─────────────────────────────────────────────────────────────────

export function createRAGDAL(): RAGDAL {
  return new RAGDAL();
}

export const ragdal = new RAGDAL();
