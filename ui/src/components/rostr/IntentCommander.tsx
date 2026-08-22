/**
 * Intent Commander - The primary input for non-coders
 * Type what you want in plain English, get an AI team
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Sparkles, Play, Users, Target, Brain, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IntentPreview {
  domain: string;
  agents: { role: string; name: string }[];
  estimatedCost: { min: number; max: number; currency: string };
  estimatedTime: { min: number; max: number; unit: string };
  humanSummary: string;
  confidence: number;
}

interface IntentCommanderProps {
  onDeploy?: (result: DeployResult) => void;
  className?: string;
}

interface DeployResult {
  companyId: string;
  team: unknown;
  task: unknown;
  humanSummary: string;
  agents: unknown[];
}

export function IntentCommander({ onDeploy, className }: IntentCommanderProps) {
  const [input, setInput] = useState('');
  const [preview, setPreview] = useState<IntentPreview | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced compile on input change
  const compileIntent = useCallback(async (value: string) => {
    if (value.length < 15) {
      setPreview(null);
      return;
    }

    setIsCompiling(true);
    setError(null);

    try {
      const response = await fetch('/api/rostr/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: value })
      });

      if (!response.ok) {
        throw new Error('Failed to understand your request');
      }

      const result = await response.json();
      
      setPreview({
        domain: result.intent.domain,
        agents: result.team.agents.map((a: { role: string; name: string }) => ({
          role: a.role,
          name: a.name
        })),
        estimatedCost: result.team.estimatedCost,
        estimatedTime: result.team.estimatedTime,
        humanSummary: result.humanSummary,
        confidence: result.intent.confidence
      });
    } catch (err) {
      setError((err as Error).message);
      setPreview(null);
    } finally {
      setIsCompiling(false);
    }
  }, []);

  // Debounce input changes
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      compileIntent(input);
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [input, compileIntent]);

  const handleExecute = async () => {
    if (!preview) return;

    setIsExecuting(true);
    setError(null);

    try {
      const response = await fetch('/api/rostr/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: input })
      });

      if (!response.ok) {
        throw new Error('Failed to deploy your team');
      }

      const result = await response.json();
      onDeploy?.(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className={cn("rostr-intent-commander", className)}>
      {/* Hero Input */}
      <div className="intent-input-container">
        <div className="input-icon-wrapper">
          {isCompiling ? (
            <Loader2 className="input-icon animate-spin" />
          ) : (
            <Sparkles className="input-icon" />
          )}
        </div>
        <textarea
          className="intent-input"
          placeholder="What do you want to accomplish? Just describe it in your own words...

Examples:
• Create a weekly newsletter about AI trends
• Research my competitors and summarize their pricing
• Help me plan a product launch campaign"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={4}
          disabled={isExecuting}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="intent-error">
          <AlertCircle className="icon" />
          <span>{error}</span>
        </div>
      )}

      {/* Real-time Preview */}
      {preview && (
        <div className="intent-preview">
          <h3 className="preview-title">
            <Brain className="icon" /> Here's what I understood
          </h3>
          
          <p className="preview-summary">{preview.humanSummary}</p>
          
          <div className="preview-cards">
            <div className="preview-card domain">
              <Target className="card-icon" />
              <span className="card-label">Domain</span>
              <span className="card-value">{preview.domain}</span>
            </div>
            
            <div className="preview-card agents">
              <Users className="card-icon" />
              <span className="card-label">Team</span>
              <div className="agent-list">
                {preview.agents.map((agent, i) => (
                  <div key={i} className="agent-chip">
                    {agent.name.split(' ')[0]}
                  </div>
                ))}
              </div>
            </div>

            <div className="preview-card estimates">
              <div className="estimate">
                <span className="estimate-label">Time</span>
                <span className="estimate-value">
                  {preview.estimatedTime.min}-{preview.estimatedTime.max} {preview.estimatedTime.unit}
                </span>
              </div>
              <div className="estimate">
                <span className="estimate-label">Cost</span>
                <span className="estimate-value">
                  ${preview.estimatedCost.min.toFixed(2)}-${preview.estimatedCost.max.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Confidence indicator */}
          <div className="confidence-bar">
            <div 
              className="confidence-fill" 
              style={{ width: `${preview.confidence * 100}%` }}
            />
            <span className="confidence-label">
              {preview.confidence >= 0.8 ? 'High confidence' : 
               preview.confidence >= 0.6 ? 'Good understanding' : 
               'May need clarification'}
            </span>
          </div>

          <button 
            className="execute-button"
            onClick={handleExecute}
            disabled={isExecuting}
          >
            {isExecuting ? (
              <>
                <Loader2 className="icon animate-spin" />
                Building your team...
              </>
            ) : (
              <>
                <Play className="icon" />
                Make it happen
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default IntentCommander;
