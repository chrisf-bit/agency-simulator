// =============================================================================
// PITCH PERFECT - FACILITATOR DEBRIEF VIEW
// =============================================================================

import React, { useState } from 'react';

// Types (duplicated from server for client use)
interface DebriefQuestion {
  id: string;
  text: string;
  theme: string;
  triggers: string[];
  priority: number;
  scope: 'team' | 'all';
  followUp?: string;
}

interface TriggerResult {
  type: string;
  fired: boolean;
  intensity: number;
  context: string;
  quarters?: number[];
}

interface TeamAnalysis {
  teamId: string;
  companyName: string;
  triggers: TriggerResult[];
  keyObservations: string[];
  suggestedQuestions: DebriefQuestion[];
}

interface FacilitatorPrompts {
  gameNarrative: string;
  allTeams: DebriefQuestion[];
  perTeam: TeamAnalysis[];
}

interface QuarterlyPrompts {
  quarter: number;
  perTeam: {
    teamId: string;
    companyName: string;
    keyObservations: string[];
    suggestedQuestions: DebriefQuestion[];
  }[];
  allTeams: DebriefQuestion[];
}

interface Props {
  prompts: FacilitatorPrompts | QuarterlyPrompts;
  mode: 'end_of_game' | 'quarterly';
}

export const FacilitatorDebriefView: React.FC<Props> = ({ prompts, mode }) => {
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [askedQuestions, setAskedQuestions] = useState<Set<string>>(new Set());

  const toggleQuestion = (questionId: string) => {
    setAskedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  const isEndOfGame = (p: FacilitatorPrompts | QuarterlyPrompts): p is FacilitatorPrompts => {
    return 'gameNarrative' in p;
  };

  return (
    <div className="bg-slate-900 text-slate-100 p-6 rounded-lg">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-amber-400 mb-2">
          {mode === 'quarterly'
            ? `Quarter ${(prompts as QuarterlyPrompts).quarter} Debrief`
            : 'Game Debrief'}
        </h2>
        {isEndOfGame(prompts) && prompts.gameNarrative && (
          <p className="text-slate-400 italic">{prompts.gameNarrative}</p>
        )}
      </div>

      {/* All Teams Section */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-emerald-400 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
          Ask All Teams
        </h3>
        <div className="space-y-3">
          {prompts.allTeams.map(question => (
            <QuestionCard
              key={question.id}
              question={question}
              isAsked={askedQuestions.has(question.id)}
              onToggle={() => toggleQuestion(question.id)}
            />
          ))}
        </div>
      </section>

      {/* Per Team Section */}
      <section>
        <h3 className="text-lg font-semibold text-blue-400 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
          Team-Specific Questions
        </h3>

        <div className="space-y-4">
          {prompts.perTeam.map(team => (
            <div key={team.teamId} className="bg-slate-800 rounded-lg overflow-hidden">
              {/* Team Header */}
              <button
                onClick={() => setExpandedTeam(
                  expandedTeam === team.teamId ? null : team.teamId
                )}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-white">{team.companyName}</span>
                  <span className="text-xs text-slate-500">
                    {team.suggestedQuestions.length} questions
                  </span>
                </div>
                <span className="text-slate-400">
                  {expandedTeam === team.teamId ? '▼' : '▶'}
                </span>
              </button>

              {/* Team Details */}
              {expandedTeam === team.teamId && (
                <div className="px-4 pb-4 space-y-4">
                  {/* Observations */}
                  {team.keyObservations.length > 0 && (
                    <div className="bg-slate-700/50 rounded p-3">
                      <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">
                        Key Observations
                      </p>
                      <ul className="space-y-1">
                        {team.keyObservations.map((obs, i) => (
                          <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                            <span className="text-amber-500">•</span>
                            {obs}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Triggers (end of game only) */}
                  {'triggers' in team && team.triggers.length > 0 && (
                    <div className="bg-slate-700/50 rounded p-3">
                      <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">
                        Notable Patterns
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {team.triggers
                          .sort((a, b) => b.intensity - a.intensity)
                          .slice(0, 5)
                          .map((trigger, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-slate-600 rounded text-xs text-slate-200"
                              title={trigger.context}
                            >
                              {formatTriggerName(trigger.type)}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Questions */}
                  <div className="space-y-2">
                    {team.suggestedQuestions.map(question => (
                      <QuestionCard
                        key={question.id}
                        question={question}
                        isAsked={askedQuestions.has(`${team.teamId}-${question.id}`)}
                        onToggle={() => toggleQuestion(`${team.teamId}-${question.id}`)}
                        compact
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

// =============================================================================
// QUESTION CARD COMPONENT
// =============================================================================

interface QuestionCardProps {
  question: DebriefQuestion;
  isAsked: boolean;
  onToggle: () => void;
  compact?: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  isAsked,
  onToggle,
  compact
}) => {
  return (
    <div
      className={`
        rounded-lg p-3 transition-all cursor-pointer
        ${isAsked
          ? 'bg-slate-700/30 border border-slate-600'
          : 'bg-slate-800 border border-transparent hover:border-slate-600'
        }
        ${compact ? 'text-sm' : ''}
      `}
      onClick={onToggle}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div className={`
          mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
          ${isAsked
            ? 'bg-emerald-500 border-emerald-500'
            : 'border-slate-500'
          }
        `}>
          {isAsked && <span className="text-white text-xs">✓</span>}
        </div>

        <div className="flex-1">
          {/* Question Text */}
          <p className={isAsked ? 'text-slate-400 line-through' : 'text-white'}>
            "{question.text}"
          </p>

          {/* Follow-up */}
          {question.followUp && !compact && (
            <p className="text-slate-500 text-sm mt-1 italic">
              Follow-up: {question.followUp}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs px-2 py-0.5 rounded ${getThemeColor(question.theme)}`}>
              {formatTheme(question.theme)}
            </span>
            {!compact && (
              <span className="text-xs text-slate-500">
                Priority: {'●'.repeat(question.priority)}{'○'.repeat(5 - question.priority)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// HELPERS
// =============================================================================

function formatTriggerName(trigger: string): string {
  return trigger
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatTheme(theme: string): string {
  const labels: Record<string, string> = {
    story: 'Story',
    decision_quality: 'Decision Quality',
    systems_thinking: 'Systems',
    team_dynamics: 'Team Dynamics',
    strategy: 'Strategy',
    lessons: 'Lessons',
    capacity: 'Capacity',
    focus: 'Focus',
    investment: 'Investment'
  };
  return labels[theme] || theme;
}

function getThemeColor(theme: string): string {
  const colors: Record<string, string> = {
    story: 'bg-purple-500/20 text-purple-300',
    decision_quality: 'bg-amber-500/20 text-amber-300',
    systems_thinking: 'bg-blue-500/20 text-blue-300',
    team_dynamics: 'bg-pink-500/20 text-pink-300',
    strategy: 'bg-emerald-500/20 text-emerald-300',
    lessons: 'bg-cyan-500/20 text-cyan-300',
    capacity: 'bg-red-500/20 text-red-300',
    focus: 'bg-orange-500/20 text-orange-300',
    investment: 'bg-indigo-500/20 text-indigo-300'
  };
  return colors[theme] || 'bg-slate-500/20 text-slate-300';
}

export default FacilitatorDebriefView;
