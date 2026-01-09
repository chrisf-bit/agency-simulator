// client/src/components/InputPanel.tsx
// Team decision input panel - Reorganized with better contrast

import { useState, useEffect } from 'react';
import { 
  TeamState, 
  TeamInputs, 
  ClientOpportunity,
  SERVICE_LINE_INFO,
  QualityLevel,
  formatCurrency,
} from '../types';

interface InputPanelProps {
  teamState: TeamState;
  opportunities: ClientOpportunity[];
  onSubmit: (inputs: TeamInputs) => void;
  disabled?: boolean;
}

interface PitchDecision {
  opportunityId: string;
  discountPercent: number;
  qualityLevel: QualityLevel;
}

export default function InputPanel({ teamState, opportunities = [], disabled }: InputPanelProps) {
  const [selectedPitches, setSelectedPitches] = useState<PitchDecision[]>([]);
  const safeOpportunities = opportunities || [];
  const [techInvestment, setTechInvestment] = useState(0);
  const [trainingInvestment, setTrainingInvestment] = useState(0);
  const [marketingSpend, setMarketingSpend] = useState(0);
  const [hiringCount, setHiringCount] = useState(0);
  const [firingCount, setFiringCount] = useState(0);
  const [wellbeingSpend, setWellbeingSpend] = useState(0);
  const [clientSatisfactionSpend, setClientSatisfactionSpend] = useState(0);
  const [growthFocus, setGrowthFocus] = useState(50);

  const hiringCost = hiringCount * 15000;
  const firingCost = firingCount * 5000;
  const totalInvestments = techInvestment + trainingInvestment + marketingSpend + wellbeingSpend + clientSatisfactionSpend;
  const totalCommitment = totalInvestments + hiringCost + firingCost;

  const currentCash = teamState.cash || 0;
  const currentStaff = teamState.staff || 5;
  const currentClients = teamState.clients || [];

  const projectedStaff = currentStaff + hiringCount - firingCount;
  const capacityPerStaff = 520;
  const totalCapacity = projectedStaff * capacityPerStaff;
  
  const selectedOpportunities = safeOpportunities.filter(opp => 
    selectedPitches.some(p => p.opportunityId === opp.id)
  );
  const estimatedWorkload = selectedOpportunities.reduce((sum, opp) => sum + (opp.hoursRequired || 0), 0);
  const existingClientWorkload = currentClients.reduce((sum, c) => sum + (c.hoursPerQuarter || 0), 0);
  const totalProjectedWorkload = existingClientWorkload + estimatedWorkload;
  const utilizationPercent = totalCapacity > 0 ? Math.round((totalProjectedWorkload / totalCapacity) * 100) : 0;

  const togglePitch = (opportunityId: string) => {
    setSelectedPitches(prev => {
      const exists = prev.find(p => p.opportunityId === opportunityId);
      if (exists) {
        return prev.filter(p => p.opportunityId !== opportunityId);
      }
      return [...prev, { opportunityId, discountPercent: 0, qualityLevel: 'standard' as QualityLevel }];
    });
  };

  const updateDiscount = (opportunityId: string, discount: number) => {
    setSelectedPitches(prev => 
      prev.map(p => p.opportunityId === opportunityId 
        ? { ...p, discountPercent: Math.min(50, Math.max(0, discount)) } 
        : p
      )
    );
  };

  const updateQuality = (opportunityId: string, quality: QualityLevel) => {
    setSelectedPitches(prev => 
      prev.map(p => p.opportunityId === opportunityId 
        ? { ...p, qualityLevel: quality } 
        : p
      )
    );
  };

  useEffect(() => {
    // Convert PitchDecision to PitchInput by enriching with opportunity data
    const pitchInputs = selectedPitches.map(pitch => {
      const opp = safeOpportunities.find(o => o.id === pitch.opportunityId);
      if (!opp) return null;
      return {
        opportunityId: pitch.opportunityId,
        clientName: opp.clientName,
        clientType: opp.clientType,
        serviceLine: opp.serviceLine,
        budget: opp.budget,
        discountPercent: pitch.discountPercent,
        complexity: opp.complexity,
        deadline: opp.deadline,
        qualityLevel: pitch.qualityLevel,
      };
    }).filter((p): p is NonNullable<typeof p> => p !== null);

    const inputs: TeamInputs = {
      pitches: pitchInputs,
      hiringCount,
      firingCount,
      techInvestment,
      trainingInvestment,
      marketingSpend,
      wellbeingSpend,
      clientSatisfactionSpend,
      growthFocus,
    };
    if (teamState.currentInputs) {
      Object.assign(teamState.currentInputs, inputs);
    }
  }, [selectedPitches, hiringCount, firingCount, techInvestment, trainingInvestment, marketingSpend, wellbeingSpend, clientSatisfactionSpend, growthFocus, safeOpportunities]);

  const clientsAtRisk = currentClients.filter(c => 
    c.status === 'notice_given' || (c.satisfactionLevel && c.satisfactionLevel < 40)
  ).length;

  return (
    <div className="space-y-3 text-white">
      {/* Capacity Summary */}
      <div className="bg-black/40 rounded-lg p-3 border border-white/10">
        <h3 className="text-sm font-bold mb-2 text-cyan-400">📊 Capacity Planning</h3>
        <div className="flex items-center justify-between text-sm">
          <div className="flex gap-4">
            <span><strong className="text-white">{existingClientWorkload.toLocaleString()}</strong> existing hrs</span>
            <span>+ <strong className="text-white">{estimatedWorkload.toLocaleString()}</strong> new hrs</span>
            <span>/ <strong className="text-white">{totalCapacity.toLocaleString()}</strong> capacity</span>
          </div>
          <span className={`font-bold text-lg ${utilizationPercent > 100 ? 'text-red-400' : utilizationPercent > 80 ? 'text-green-400' : 'text-yellow-400'}`}>
            {utilizationPercent}%
          </span>
        </div>
        {utilizationPercent > 100 && (
          <p className="text-red-400 text-sm mt-2">⚠️ Over capacity!</p>
        )}
      </div>

      {/* Client Opportunities */}
      <div className="bg-black/40 rounded-lg p-3 border border-white/10">
        <h3 className="text-sm font-bold mb-3 text-cyan-400">
          🎯 Client Opportunities ({safeOpportunities.length})
        </h3>
        
        {safeOpportunities.length === 0 ? (
          <p className="text-white/60 text-sm">No opportunities this quarter</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {safeOpportunities.map(opp => {
              const isSelected = selectedPitches.some(p => p.opportunityId === opp.id);
              const pitch = selectedPitches.find(p => p.opportunityId === opp.id);
              const serviceInfo = SERVICE_LINE_INFO[opp.serviceLine] || { icon: '📋', name: opp.serviceLine };
              
              return (
                <div key={opp.id} className={`rounded-lg p-3 border transition-all ${
                  isSelected 
                    ? 'bg-cyan-900/60 border-cyan-500' 
                    : opp.isExistingClientProject 
                      ? 'bg-purple-900/30 border-purple-500/50 hover:border-purple-500'
                      : 'bg-black/30 border-white/10 hover:border-white/30'
                }`}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => togglePitch(opp.id)}
                        disabled={disabled}
                        className="w-4 h-4 accent-cyan-500"
                      />
                      <span className="font-medium text-white">{opp.clientName}</span>
                      {opp.isExistingClientProject && (
                        <span className="text-xs px-2 py-0.5 rounded bg-purple-500/40 text-purple-200">
                          🔄 Existing Client
                        </span>
                      )}
                      <span className="text-white/80">{serviceInfo.icon} {serviceInfo.name}</span>
                    </label>
                    <div className="text-right flex items-center gap-3">
                      {opp.baseWinChance && (
                        <span className={`text-sm px-2 py-0.5 rounded ${
                          opp.baseWinChance >= 70 ? 'bg-green-500/30 text-green-300' :
                          opp.baseWinChance >= 50 ? 'bg-yellow-500/30 text-yellow-300' :
                          'bg-red-500/30 text-red-300'
                        }`}>
                          {opp.baseWinChance}% win
                        </span>
                      )}
                      <div>
                        <span className="font-bold text-lg text-green-400">{formatCurrency(opp.budget)}</span>
                        <span className="text-white/80 ml-2">{opp.hoursRequired} hrs</span>
                      </div>
                    </div>
                  </div>
                  
                  {isSelected && pitch && (
                    <div className="mt-3 pt-3 border-t border-white/20 space-y-2">
                      {/* Discount Slider */}
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-white/80 w-16">Discount:</span>
                        <input
                          type="range"
                          min="0"
                          max="50"
                          step="5"
                          value={pitch.discountPercent}
                          onChange={(e) => updateDiscount(opp.id, parseInt(e.target.value))}
                          disabled={disabled}
                          className="flex-1"
                        />
                        <span className="font-bold text-yellow-400 w-12 text-right">{pitch.discountPercent}%</span>
                      </div>
                      {/* Quality Buttons */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white/80 w-16">Quality:</span>
                        <div className="flex gap-1 flex-1">
                          {(['budget', 'standard', 'premium'] as QualityLevel[]).map(q => (
                            <button
                              key={q}
                              onClick={() => updateQuality(opp.id, q)}
                              disabled={disabled}
                              className={`px-3 py-1 rounded text-sm transition-all flex-1 ${
                                pitch.qualityLevel === q 
                                  ? 'bg-cyan-600 text-white font-medium' 
                                  : 'bg-black/50 text-white/80 hover:bg-black/70 hover:text-white'
                              }`}
                            >
                              {q === 'budget' ? '💰 Budget' : q === 'standard' ? '⚖️ Standard' : '⭐ Premium'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Staffing */}
      <div className="bg-black/40 rounded-lg p-3 border border-white/10">
        <h3 className="text-sm font-bold mb-3 text-cyan-400">
          👥 Staffing: {currentStaff} → <span className="text-white">{projectedStaff}</span>
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-white/60 mb-2">Hire Staff (£15k each)</div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setHiringCount(Math.max(0, hiringCount - 1))} 
                disabled={disabled || hiringCount <= 0}
                className="bg-white/10 hover:bg-white/20 w-8 h-8 rounded disabled:opacity-50"
              >-</button>
              <span className="w-8 text-center font-bold text-lg text-white">{hiringCount}</span>
              <button 
                onClick={() => setHiringCount(hiringCount + 1)} 
                disabled={disabled}
                className="bg-white/10 hover:bg-white/20 w-8 h-8 rounded disabled:opacity-50"
              >+</button>
              {hiringCount > 0 && <span className="text-sm text-yellow-400">= {formatCurrency(hiringCost)}</span>}
            </div>
          </div>
          <div>
            <div className="text-sm text-white/60 mb-2">Let Go (£5k severance)</div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setFiringCount(Math.max(0, firingCount - 1))} 
                disabled={disabled || firingCount <= 0}
                className="bg-white/10 hover:bg-white/20 w-8 h-8 rounded disabled:opacity-50"
              >-</button>
              <span className="w-8 text-center font-bold text-lg text-white">{firingCount}</span>
              <button 
                onClick={() => setFiringCount(Math.min(currentStaff - 5, firingCount + 1))} 
                disabled={disabled}
                className="bg-white/10 hover:bg-white/20 w-8 h-8 rounded disabled:opacity-50"
              >+</button>
              {firingCount > 0 && <span className="text-sm text-yellow-400">= {formatCurrency(firingCost)}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Growth Focus - Separate */}
      <div className="bg-black/40 rounded-lg p-3 border border-white/10">
        <h3 className="text-sm font-bold mb-2 text-cyan-400">🎚️ Growth Focus</h3>
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/60 w-20">Organic</span>
          <input
            type="range" min="0" max="100" step="10"
            value={growthFocus}
            onChange={(e) => setGrowthFocus(parseInt(e.target.value))}
            disabled={disabled}
            className="flex-1"
          />
          <span className="text-sm text-white/60 w-20 text-right">New Biz</span>
          <span className="font-bold text-yellow-400 w-16 text-right">{growthFocus}/{100 - growthFocus}</span>
        </div>
      </div>

      {/* Investments - with Client Satisfaction at top */}
      <div className="bg-black/40 rounded-lg p-3 border border-white/10">
        <h3 className="text-sm font-bold mb-3 text-cyan-400">💼 Investments</h3>
        <div className="space-y-2">
          {/* Client Satisfaction - at top */}
          <div className="pb-2 mb-2 border-b border-white/10">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-white/60">💝 Client Satisfaction {clientsAtRisk > 0 && <span className="text-red-400">({clientsAtRisk} at risk)</span>}</span>
              <span className="font-bold text-yellow-400">{formatCurrency(clientSatisfactionSpend)}</span>
            </div>
            <input
              type="range" min="0" max="100000" step="10000"
              value={clientSatisfactionSpend}
              onChange={(e) => setClientSatisfactionSpend(parseInt(e.target.value))}
              disabled={disabled}
              className="w-full"
            />
          </div>
          
          <InvestmentSlider label="🖥️ Technology" value={techInvestment} onChange={setTechInvestment} max={50000} disabled={disabled} />
          <InvestmentSlider label="📚 Training" value={trainingInvestment} onChange={setTrainingInvestment} max={30000} disabled={disabled} />
          <InvestmentSlider label="📣 Marketing" value={marketingSpend} onChange={setMarketingSpend} max={40000} disabled={disabled} />
          <InvestmentSlider label="🧘 Wellbeing" value={wellbeingSpend} onChange={setWellbeingSpend} max={30000} disabled={disabled} />
        </div>
      </div>

      {/* Budget Summary */}
      <div className={`rounded-lg p-3 border ${totalCommitment > currentCash ? 'bg-red-500/30 border-red-500' : 'bg-black/40 border-white/10'}`}>
        <div className="flex justify-between items-center">
          <span className="text-sm text-white/80">Total Commitments:</span>
          <span className="text-lg font-bold">
            <span className={totalCommitment > currentCash ? 'text-red-400' : 'text-green-400'}>{formatCurrency(totalCommitment)}</span>
            <span className="text-white/60"> / {formatCurrency(currentCash)} available</span>
          </span>
        </div>
        {totalCommitment > currentCash && (
          <p className="text-red-400 text-sm mt-2">⚠️ Spending exceeds available cash!</p>
        )}
      </div>
    </div>
  );
}

// Investment slider component
function InvestmentSlider({ label, value, onChange, max, disabled }: { 
  label: string; value: number; onChange: (v: number) => void; max: number; disabled?: boolean 
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-white/60">{label}</span>
        <span className="font-bold text-yellow-400">{formatCurrency(value)}</span>
      </div>
      <input
        type="range" min="0" max={max} step="5000"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        disabled={disabled}
        className="w-full"
      />
    </div>
  );
}
