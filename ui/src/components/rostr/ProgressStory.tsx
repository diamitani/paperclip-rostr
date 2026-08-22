/**
 * Progress Story - Convert technical logs into human stories
 * Non-coders see "Alex finished the draft" not "task_id: abc123"
 */

import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertCircle, Loader2, HandRaised, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StoryEvent {
  id: string;
  timestamp: Date;
  agentName: string;
  action: string;
  status: 'completed' | 'in-progress' | 'waiting' | 'blocked' | 'error';
  details?: string;
}

interface ProgressStoryProps {
  events: StoryEvent[];
  className?: string;
}

const statusIcons: Record<StoryEvent['status'], typeof CheckCircle> = {
  completed: CheckCircle,
  'in-progress': Loader2,
  waiting: Clock,
  blocked: HandRaised,
  error: XCircle
};

const statusColors: Record<StoryEvent['status'], string> = {
  completed: 'var(--color-status-success)',
  'in-progress': 'var(--color-status-running)',
  waiting: 'var(--color-status-waiting)',
  blocked: 'var(--color-status-blocked)',
  error: 'var(--color-status-error)'
};

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function ProgressStory({ events, className }: ProgressStoryProps) {
  if (events.length === 0) {
    return (
      <div className={cn("progress-story progress-story--empty", className)}>
        <p className="empty-message">
          No activity yet. Your team will show progress here as they work.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("progress-story", className)}>
      <h2 className="story-title">What's happening</h2>
      
      <div className="story-timeline">
        {events.map((event, index) => {
          const Icon = statusIcons[event.status];
          const isLatest = index === 0;
          
          return (
            <motion.div
              key={event.id}
              className={cn(
                "story-event",
                `story-event--${event.status}`,
                isLatest && "story-event--latest"
              )}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              style={{ 
                '--event-color': statusColors[event.status]
              } as React.CSSProperties}
            >
              <div className="event-icon">
                <Icon 
                  className={cn(
                    "icon",
                    event.status === 'in-progress' && 'animate-spin'
                  )} 
                />
              </div>
              
              <div className="event-content">
                <p className="event-text">
                  <strong>{event.agentName}</strong> {event.action}
                </p>
                {event.details && (
                  <p className="event-details">{event.details}</p>
                )}
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

export default ProgressStory;
