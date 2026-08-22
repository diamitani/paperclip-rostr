/**
 * Team Visualizer - Show AI agents as friendly avatars
 * Non-coders see their team, not technical processes
 */

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface Agent {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  status: 'idle' | 'working' | 'paused' | 'blocked' | 'awaiting_approval' | 'completed' | 'failed';
  currentAction?: string;
  progress: number;
  tasksCompleted: number;
  costIncurred: number;
}

interface TeamVisualizerProps {
  agents: Agent[];
  className?: string;
}

const statusConfig: Record<Agent['status'], { emoji: string; color: string; label: string }> = {
  idle: { emoji: '😊', color: 'var(--color-status-idle)', label: 'Ready' },
  working: { emoji: '🧑‍💻', color: 'var(--color-status-running)', label: 'Working' },
  paused: { emoji: '⏸️', color: 'var(--color-status-paused)', label: 'Paused' },
  blocked: { emoji: '😕', color: 'var(--color-status-blocked)', label: 'Needs help' },
  awaiting_approval: { emoji: '✋', color: 'var(--color-status-waiting)', label: 'Waiting for you' },
  completed: { emoji: '🎉', color: 'var(--color-status-success)', label: 'Done!' },
  failed: { emoji: '😢', color: 'var(--color-status-error)', label: 'Had an issue' }
};

export function TeamVisualizer({ agents, className }: TeamVisualizerProps) {
  if (agents.length === 0) {
    return (
      <div className={cn("team-visualizer team-visualizer--empty", className)}>
        <p className="empty-message">
          No team members yet. Use the command above to hire your first AI team!
        </p>
      </div>
    );
  }

  return (
    <div className={cn("team-visualizer", className)}>
      <h2 className="team-title">Your Team</h2>
      
      <div className="agent-grid">
        <AnimatePresence mode="popLayout">
          {agents.map((agent) => {
            const status = statusConfig[agent.status];
            
            return (
              <motion.div
                key={agent.id}
                className={cn("agent-card", `agent-card--${agent.status}`)}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                style={{ 
                  '--agent-status-color': status.color
                } as React.CSSProperties}
              >
                <div className="agent-avatar">
                  {agent.avatar ? (
                    <img src={agent.avatar} alt={agent.name} />
                  ) : (
                    <div className="avatar-placeholder">
                      {agent.name.charAt(0)}
                    </div>
                  )}
                  <span className="status-badge" title={status.label}>
                    {status.emoji}
                  </span>
                </div>
                
                <div className="agent-info">
                  <h3 className="agent-name">{agent.name}</h3>
                  <p className="agent-role">{agent.role}</p>
                </div>

                {/* Progress bar for working agents */}
                {agent.status === 'working' && (
                  <div className="agent-progress">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${agent.progress}%` }}
                    />
                  </div>
                )}

                {/* Current action */}
                {agent.currentAction && (
                  <motion.p 
                    className="agent-action"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    {agent.currentAction}
                  </motion.p>
                )}

                {/* Stats for completed agents */}
                {agent.status === 'completed' && (
                  <div className="agent-stats">
                    <span className="stat">
                      ✓ {agent.tasksCompleted} task{agent.tasksCompleted !== 1 ? 's' : ''}
                    </span>
                    <span className="stat">
                      ${agent.costIncurred.toFixed(2)}
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default TeamVisualizer;
