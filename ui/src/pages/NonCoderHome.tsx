/**
 * Non-Coder Home Page
 * The main dashboard for users who don't code
 * Friendly, approachable, zero technical jargon
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, HelpCircle, Settings } from 'lucide-react';
import { 
  IntentCommander, 
  TeamVisualizer, 
  ProgressStory,
  TemplateGallery,
  OnboardingWizard,
  DEFAULT_TEMPLATES,
  type Agent,
  type StoryEvent,
  type Template
} from '@/components/rostr';
import { cn } from '@/lib/utils';

export function NonCoderHome() {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [events, setEvents] = useState<StoryEvent[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);

  // Check if user has completed onboarding before
  useEffect(() => {
    const hasOnboarded = localStorage.getItem('rostr-onboarded');
    if (hasOnboarded === 'true') {
      setShowOnboarding(false);
    }
  }, []);

  const handleOnboardingComplete = async (result: { 
    goalType: string; 
    template?: Template; 
    customGoal?: string 
  }) => {
    localStorage.setItem('rostr-onboarded', 'true');
    setShowOnboarding(false);

    // If they selected a template, deploy it
    if (result.template) {
      await handleDeploy(result.template.intent);
    } else if (result.customGoal) {
      await handleDeploy(result.customGoal);
    }
  };

  const handleDeploy = async (intent: string) => {
    try {
      const response = await fetch('/api/rostr/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          companyId: activeCompanyId,
          intent 
        })
      });

      if (!response.ok) throw new Error('Deploy failed');

      const result = await response.json();
      setActiveCompanyId(result.companyId);
      
      // Convert agents to UI format
      setAgents(result.agents.map((a: unknown) => ({
        ...(a as Agent),
        tasksCompleted: 0,
        costIncurred: 0
      })));

      // Add initial event
      setEvents([{
        id: `event-${Date.now()}`,
        timestamp: new Date(),
        agentName: 'Paperclip',
        action: `assembled your team for "${result.humanSummary}"`,
        status: 'completed'
      }]);

      // Start polling for updates
      pollForUpdates(result.companyId);
    } catch (error) {
      console.error('Deploy error:', error);
    }
  };

  const pollForUpdates = (companyId: string) => {
    // Poll company state every 2 seconds
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/rostr/company/${companyId}`);
        if (!response.ok) return;

        const result = await response.json();
        
        // Update agents
        setAgents(result.company.agents);
        
        // Check if all tasks are complete
        const allComplete = result.company.tasks.every(
          (t: { status: string }) => t.status === 'completed' || t.status === 'failed'
        );
        
        if (allComplete) {
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Poll error:', error);
      }
    }, 2000);

    // Cleanup after 10 minutes max
    setTimeout(() => clearInterval(interval), 600000);
  };

  const handleTemplateSelect = (template: Template) => {
    handleDeploy(template.intent);
  };

  // Show onboarding wizard for new users
  if (showOnboarding) {
    return (
      <div className="noncoder-page noncoder-page--onboarding">
        <OnboardingWizard 
          onComplete={handleOnboardingComplete}
          onSkip={() => {
            localStorage.setItem('rostr-onboarded', 'true');
            setShowOnboarding(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="noncoder-page">
      {/* Header */}
      <header className="noncoder-header">
        <div className="header-brand">
          <Sparkles className="brand-icon" />
          <h1>Paperclip <span className="brand-rostr">ROSTR</span></h1>
        </div>
        <div className="header-actions">
          <button className="header-button" title="Help">
            <HelpCircle className="icon" />
          </button>
          <button className="header-button" title="Settings">
            <Settings className="icon" />
          </button>
        </div>
      </header>

      <main className="noncoder-main">
        {/* Left column - Input and Templates */}
        <section className="noncoder-input-section">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <IntentCommander 
              onDeploy={(result) => {
                setActiveCompanyId(result.companyId);
                setAgents(result.agents as Agent[]);
                setEvents([{
                  id: `event-${Date.now()}`,
                  timestamp: new Date(),
                  agentName: 'Paperclip',
                  action: `assembled your team for "${result.humanSummary}"`,
                  status: 'completed'
                }]);
                pollForUpdates(result.companyId);
              }}
            />
          </motion.div>

          {/* Show templates when no active team */}
          {agents.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <TemplateGallery 
                templates={DEFAULT_TEMPLATES}
                onSelect={handleTemplateSelect}
              />
            </motion.div>
          )}
        </section>

        {/* Right column - Team and Progress */}
        <aside className={cn("noncoder-status-section", agents.length === 0 && "hidden")}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <TeamVisualizer agents={agents} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <ProgressStory events={events} />
          </motion.div>
        </aside>
      </main>
    </div>
  );
}

export default NonCoderHome;
