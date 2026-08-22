/**
 * Onboarding Wizard - 3-step friendly onboarding for non-coders
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Users, Play, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEFAULT_TEMPLATES, type Template } from './TemplateGallery';

interface OnboardingWizardProps {
  onComplete: (result: { goalType: string; template?: Template; customGoal?: string }) => void;
  onSkip?: () => void;
  className?: string;
}

type Step = 'welcome' | 'goal' | 'ready';

export function OnboardingWizard({ onComplete, onSkip, className }: OnboardingWizardProps) {
  const [step, setStep] = useState<Step>('welcome');
  const [goalType, setGoalType] = useState<'template' | 'custom' | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [customGoal, setCustomGoal] = useState('');

  const handleNext = () => {
    if (step === 'welcome') {
      setStep('goal');
    } else if (step === 'goal') {
      setStep('ready');
    } else if (step === 'ready') {
      onComplete({
        goalType: goalType || 'custom',
        template: selectedTemplate || undefined,
        customGoal: customGoal || undefined
      });
    }
  };

  const handleBack = () => {
    if (step === 'goal') {
      setStep('welcome');
    } else if (step === 'ready') {
      setStep('goal');
    }
  };

  const canProceed = () => {
    if (step === 'welcome') return true;
    if (step === 'goal') {
      return goalType === 'template' ? selectedTemplate !== null : customGoal.length > 20;
    }
    return true;
  };

  return (
    <div className={cn("onboarding-wizard", className)}>
      {/* Progress indicator */}
      <div className="onboarding-progress">
        {(['welcome', 'goal', 'ready'] as Step[]).map((s, i) => (
          <div 
            key={s} 
            className={cn(
              "progress-step",
              step === s && "progress-step--active",
              (['welcome', 'goal', 'ready'].indexOf(step) > i) && "progress-step--completed"
            )}
          >
            {(['welcome', 'goal', 'ready'].indexOf(step) > i) ? (
              <Check className="icon" />
            ) : (
              <span>{i + 1}</span>
            )}
          </div>
        ))}
        <div 
          className="progress-line" 
          style={{ 
            '--progress': `${(['welcome', 'goal', 'ready'].indexOf(step) / 2) * 100}%`
          } as React.CSSProperties}
        />
      </div>

      <AnimatePresence mode="wait">
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            className="onboarding-step step-welcome"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="step-icon">
              <Sparkles className="icon" />
            </div>
            <h2 className="step-title">Welcome to Paperclip ROSTR</h2>
            <p className="step-description">
              Build AI teams without writing code. Just describe what you need, 
              and we'll assemble the perfect team to get it done.
            </p>
            
            <div className="feature-cards">
              <div className="feature-card">
                <span className="feature-emoji">💬</span>
                <h4>Plain English</h4>
                <p>No technical jargon. Describe tasks in your own words.</p>
              </div>
              <div className="feature-card">
                <span className="feature-emoji">🤖</span>
                <h4>Smart Teams</h4>
                <p>AI agents with specialized roles work together.</p>
              </div>
              <div className="feature-card">
                <span className="feature-emoji">👀</span>
                <h4>Full Visibility</h4>
                <p>Watch progress in real-time with friendly updates.</p>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'goal' && (
          <motion.div
            key="goal"
            className="onboarding-step step-goal"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="step-icon">
              <Users className="icon" />
            </div>
            <h2 className="step-title">What do you want to accomplish?</h2>
            <p className="step-description">
              Pick a template to get started quickly, or describe your own goal.
            </p>

            <div className="goal-options">
              <button 
                className={cn("goal-option", goalType === 'template' && 'goal-option--selected')}
                onClick={() => setGoalType('template')}
              >
                <span className="option-emoji">📋</span>
                <span className="option-title">Start with a template</span>
                <span className="option-desc">Quick start with proven AI teams</span>
              </button>
              
              <button 
                className={cn("goal-option", goalType === 'custom' && 'goal-option--selected')}
                onClick={() => setGoalType('custom')}
              >
                <span className="option-emoji">✨</span>
                <span className="option-title">Describe my own goal</span>
                <span className="option-desc">I know exactly what I need</span>
              </button>
            </div>

            {goalType === 'template' && (
              <motion.div 
                className="template-picker"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <h4>Popular templates:</h4>
                <div className="template-list">
                  {DEFAULT_TEMPLATES.slice(0, 4).map((template) => (
                    <button
                      key={template.id}
                      className={cn(
                        "template-option",
                        selectedTemplate?.id === template.id && "template-option--selected"
                      )}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <span className="template-icon">{template.icon}</span>
                      <span className="template-name">{template.title}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {goalType === 'custom' && (
              <motion.div 
                className="custom-goal"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <textarea
                  className="goal-input"
                  placeholder="Describe what you want to accomplish..."
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                  rows={4}
                />
              </motion.div>
            )}
          </motion.div>
        )}

        {step === 'ready' && (
          <motion.div
            key="ready"
            className="onboarding-step step-ready"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="step-icon step-icon--success">
              <Play className="icon" />
            </div>
            <h2 className="step-title">You're all set! 🎉</h2>
            <p className="step-description">
              {selectedTemplate 
                ? `We'll set up your "${selectedTemplate.title}" team right away.`
                : "We'll analyze your goal and build the perfect team."}
            </p>

            <div className="ready-preview">
              {selectedTemplate && (
                <div className="preview-team">
                  <h4>Your team:</h4>
                  <div className="team-members">
                    {selectedTemplate.agents.map((agent, i) => (
                      <div key={i} className="team-member">
                        <span className="member-emoji">{agent.emoji}</span>
                        <span className="member-name">{agent.name}</span>
                        <span className="member-role">{agent.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {customGoal && (
                <div className="preview-goal">
                  <h4>Your goal:</h4>
                  <p className="goal-text">{customGoal}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="onboarding-nav">
        {step !== 'welcome' && (
          <button className="nav-button nav-button--back" onClick={handleBack}>
            <ArrowLeft className="icon" />
            Back
          </button>
        )}
        
        {onSkip && step === 'welcome' && (
          <button className="nav-button nav-button--skip" onClick={onSkip}>
            Skip for now
          </button>
        )}
        
        <button 
          className="nav-button nav-button--next"
          onClick={handleNext}
          disabled={!canProceed()}
        >
          {step === 'ready' ? 'Get Started' : 'Continue'}
          <ArrowRight className="icon" />
        </button>
      </div>
    </div>
  );
}

export default OnboardingWizard;
