/**
 * @paperclipai/rostr
 * 
 * ROSTR Framework for Paperclip
 * - PAL: Prompt Assembly Language (intent → agent manifest)
 * - NPAO: Necessity/Priority/Anxiety/Opportunity classification
 * - RAG DAL: Knowledge retrieval and compounding
 * - Hub: Agent OS and state management
 */

// PAL - Intent Compilation
export { 
  PALCompiler, 
  palCompiler,
  type PALIntent,
  type AgentManifest,
  type TeamManifest,
  type Domain,
  PALIntentSchema,
  AgentManifestSchema,
  TeamManifestSchema,
  DomainSchema
} from './pal/index.js';

// NPAO - Priority Classification
export {
  NPAOClassifier,
  npaoClassifier,
  type NPAOScore,
  type TaskInput,
  type Phase,
  NPAOScoreSchema,
  TaskInputSchema,
  PhaseSchema
} from './npao/index.js';

// RAG DAL - Knowledge Retrieval
export {
  RAGDAL,
  createRAGDAL,
  ragdal,
  type KnowledgeChunk,
  type RetrievalResult,
  type RetrievalStrategy,
  KnowledgeChunkSchema,
  RetrievalResultSchema,
  RetrievalStrategySchema
} from './ragdal/index.js';

// Hub - Agent OS
export {
  RostrHub,
  rostrHub,
  type AgentState,
  type AgentStatus,
  type CompanyState,
  type ManagedTask,
  type TaskStatus,
  type HubEvent,
  type HubEventListener,
  AgentStateSchema,
  AgentStatusSchema,
  CompanyStateSchema,
  ManagedTaskSchema,
  TaskStatusSchema
} from './hub/index.js';

// Version
export const VERSION = '1.0.0';
