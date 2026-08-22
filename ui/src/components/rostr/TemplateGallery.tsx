/**
 * Template Gallery - Pre-built AI teams for common use cases
 * Non-coders can start with one click
 */

import { motion } from 'framer-motion';
import { Users, Play, Clock, DollarSign, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Template {
  id: string;
  title: string;
  description: string;
  category: 'content' | 'research' | 'marketing' | 'operations' | 'sales';
  icon: string;
  agents: {
    role: string;
    name: string;
    emoji: string;
  }[];
  estimatedTime: string;
  estimatedCost: string;
  intent: string; // The pre-written intent to execute
  popularity?: number;
  isNew?: boolean;
}

const categoryColors: Record<Template['category'], string> = {
  content: 'var(--color-category-content)',
  research: 'var(--color-category-research)',
  marketing: 'var(--color-category-marketing)',
  operations: 'var(--color-category-operations)',
  sales: 'var(--color-category-sales)'
};

interface TemplateGalleryProps {
  templates: Template[];
  onSelect: (template: Template) => void;
  className?: string;
}

export function TemplateGallery({ templates, onSelect, className }: TemplateGalleryProps) {
  const categories = Array.from(new Set(templates.map(t => t.category)));
  
  return (
    <div className={cn("template-gallery", className)}>
      <div className="gallery-header">
        <h2 className="gallery-title">Start with a Template</h2>
        <p className="gallery-subtitle">
          Pre-built AI teams for common tasks. Just click and go.
        </p>
      </div>

      {categories.map((category) => (
        <div key={category} className="category-section">
          <h3 
            className="category-title"
            style={{ 
              '--category-color': categoryColors[category]
            } as React.CSSProperties}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </h3>
          
          <div className="template-grid">
            {templates
              .filter(t => t.category === category)
              .map((template, index) => (
                <motion.div
                  key={template.id}
                  className="template-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onSelect(template)}
                  style={{ 
                    '--card-accent': categoryColors[template.category]
                  } as React.CSSProperties}
                >
                  {template.isNew && (
                    <span className="new-badge">New</span>
                  )}
                  
                  <div className="template-icon">
                    {template.icon}
                  </div>
                  
                  <h4 className="template-title">{template.title}</h4>
                  <p className="template-description">{template.description}</p>
                  
                  <div className="template-team">
                    <Users className="icon" />
                    <div className="agent-avatars">
                      {template.agents.slice(0, 3).map((agent, i) => (
                        <span key={i} className="agent-avatar" title={agent.name}>
                          {agent.emoji}
                        </span>
                      ))}
                      {template.agents.length > 3 && (
                        <span className="more-agents">
                          +{template.agents.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="template-meta">
                    <span className="meta-item">
                      <Clock className="icon" />
                      {template.estimatedTime}
                    </span>
                    <span className="meta-item">
                      <DollarSign className="icon" />
                      {template.estimatedCost}
                    </span>
                  </div>

                  <button className="template-cta">
                    <Play className="icon" />
                    Use this team
                    <ArrowRight className="icon arrow" />
                  </button>
                </motion.div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Default templates for non-coders
export const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'newsletter-writer',
    title: 'Newsletter Writer',
    description: 'Research trending topics and write engaging weekly newsletters',
    category: 'content',
    icon: '📰',
    agents: [
      { role: 'researcher', name: 'Riley', emoji: '🔍' },
      { role: 'writer', name: 'Whitney', emoji: '✍️' },
      { role: 'editor', name: 'Eddie', emoji: '📝' }
    ],
    estimatedTime: '2-3 hours',
    estimatedCost: '$3-5',
    intent: 'Create a weekly newsletter about my industry. Research the latest trends, write engaging articles, and format it professionally.',
    popularity: 95,
    isNew: false
  },
  {
    id: 'competitor-research',
    title: 'Competitor Analysis',
    description: 'Deep dive into competitor pricing, features, and positioning',
    category: 'research',
    icon: '🎯',
    agents: [
      { role: 'researcher', name: 'Riley', emoji: '🔍' },
      { role: 'analyst', name: 'Alex', emoji: '📊' },
      { role: 'reporter', name: 'Rory', emoji: '📋' }
    ],
    estimatedTime: '4-6 hours',
    estimatedCost: '$8-12',
    intent: 'Research my top 5 competitors. Analyze their pricing, features, customer reviews, and market positioning. Create a comparison report.',
    popularity: 88
  },
  {
    id: 'social-media-manager',
    title: 'Social Media Content',
    description: 'Create a month of engaging social media posts',
    category: 'marketing',
    icon: '📱',
    agents: [
      { role: 'strategist', name: 'Sam', emoji: '🎯' },
      { role: 'creator', name: 'Casey', emoji: '🎨' },
      { role: 'scheduler', name: 'Sidney', emoji: '📅' }
    ],
    estimatedTime: '3-4 hours',
    estimatedCost: '$5-8',
    intent: 'Create 30 days of social media content for my business. Include engaging posts, hashtags, and best times to post.',
    popularity: 92,
    isNew: true
  },
  {
    id: 'meeting-summarizer',
    title: 'Meeting Notes Team',
    description: 'Summarize recordings, extract action items, send follow-ups',
    category: 'operations',
    icon: '📝',
    agents: [
      { role: 'transcriber', name: 'Taylor', emoji: '🎧' },
      { role: 'summarizer', name: 'Skylar', emoji: '📑' },
      { role: 'coordinator', name: 'Charlie', emoji: '✉️' }
    ],
    estimatedTime: '30-60 min',
    estimatedCost: '$1-2',
    intent: 'Process my meeting recordings. Transcribe, summarize key points, extract action items, and draft follow-up emails.',
    popularity: 85
  },
  {
    id: 'lead-qualifier',
    title: 'Lead Qualification',
    description: 'Research leads, score them, and prepare personalized outreach',
    category: 'sales',
    icon: '🎯',
    agents: [
      { role: 'researcher', name: 'Riley', emoji: '🔍' },
      { role: 'scorer', name: 'Quinn', emoji: '⭐' },
      { role: 'copywriter', name: 'Cameron', emoji: '💬' }
    ],
    estimatedTime: '1-2 hours per batch',
    estimatedCost: '$2-4',
    intent: 'Research my list of leads. Find their company info, role, and needs. Score them by fit and prepare personalized outreach messages.',
    popularity: 79,
    isNew: true
  }
];

export default TemplateGallery;
