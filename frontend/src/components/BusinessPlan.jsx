import React, { useState } from 'react';
import { LayoutGrid, Target, CircleDollarSign, CheckSquare, Download, Share2 } from 'lucide-react';

export default function BusinessPlan({ plan, isTamil }) {
  const [activeTab, setActiveTab] = useState('canvas');
  const [checkedItems, setCheckedItems] = useState({});

  if (!plan) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white/2">
        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-gray-400">
          <LayoutGrid className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-medium text-white mb-1">
          {isTamil ? 'தொழில் திட்டம் எதுவும் இல்லை' : 'No Business Plan Active'}
        </h3>
        <p className="text-sm text-gray-400 max-w-xs">
          {isTamil 
            ? 'தொழில் யோசனை பெற இடது பக்க அரட்டையில் தட்டச்சு செய்ய தொடங்குங்கள்!' 
            : 'Start talking in the chat panel to generate a visual business blueprint!'}
        </p>
      </div>
    );
  }

  const { title, description, canvas, marketing, financials, checklist } = plan;

  const handleToggleChecklist = (index) => {
    setCheckedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const completedCount = Object.values(checkedItems).filter(Boolean).length;
  const progressPercent = checklist ? Math.round((completedCount / checklist.length) * 100) : 0;

  // Export plan as Markdown file
  const handleExport = () => {
    const markdownContent = `
# ${title}
${description}

## Business Model Canvas
- **Key Partners:** ${canvas.key_partners}
- **Key Activities:** ${canvas.key_activities}
- **Value Proposition:** ${canvas.value_proposition}
- **Customer Relationships:** ${canvas.customer_relationships}
- **Customer Segments:** ${canvas.customer_segments}
- **Key Resources:** ${canvas.key_resources}
- **Channels:** ${canvas.channels}
- **Cost Structure:** ${canvas.cost_structure}
- **Revenue Streams:** ${canvas.revenue_streams}

## Marketing Strategy
- **Target Channels:** ${marketing.channels}
- **Launch Strategy:** ${marketing.strategy}
- **Brand Messaging:** ${marketing.messaging}

## Financial Plan
- **Setup Costs:** ${financials.setup_costs}
- **Monthly Expenses:** ${financials.monthly_expenses}
- **Pricing Model:** ${financials.pricing}
- **First Year Projections:** ${financials.projections}

## Launch Checklist
${checklist.map((item, idx) => `- [ ] ${item}`).join('\n')}
    `;

    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_business_plan.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Plan Header */}
      <div className="p-6 border-b border-white/10 bg-white/[0.01]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-accentPurple/20 text-accentPurple border border-accentPurple/30">
              {isTamil ? 'தொழில் யோசனை அறிக்கை' : 'Generated Business Blueprint'}
            </span>
            <h2 className="text-xl font-bold text-white mt-2 mb-1">{title}</h2>
            <p className="text-sm text-gray-300 line-clamp-2">{description}</p>
          </div>
          <button 
            onClick={handleExport}
            className="flex items-center gap-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>{isTamil ? 'பதிவிறக்கம்' : 'Export'}</span>
          </button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-white/10 px-4 bg-white/[0.005]">
        {[
          { id: 'canvas', label: isTamil ? 'வணிக மாதிரி' : 'Canvas', icon: LayoutGrid },
          { id: 'marketing', label: isTamil ? 'சந்தைப்படுத்தல்' : 'Marketing', icon: Target },
          { id: 'financials', label: isTamil ? 'நிதி திட்டம்' : 'Financials', icon: CircleDollarSign },
          { id: 'checklist', label: isTamil ? 'சரிபார்ப்பு பட்டியல்' : 'Launch Steps', icon: CheckSquare },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 py-3.5 px-4 text-xs font-semibold border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-accentPurple text-white bg-white/[0.02]'
                  : 'border-transparent text-gray-400 hover:text-white hover:bg-white/[0.005]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Panels */}
      <div className="flex-1 overflow-y-auto p-6 bg-[#0f101d]/20">
        
        {/* CANVAS VIEW */}
        {activeTab === 'canvas' && canvas && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Value Proposition (Highlight) */}
            <div className="md:col-span-3 p-4 rounded-xl bg-gradient-to-r from-accentPurple/10 to-accentPink/10 border border-accentPurple/20">
              <h4 className="text-xs font-bold uppercase tracking-wider text-accentPurple mb-1.5">
                {isTamil ? 'மதிப்பு முன்மொழிவு (Value Proposition)' : 'Value Proposition'}
              </h4>
              <p className="text-sm text-white font-medium">{canvas.value_proposition}</p>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                {isTamil ? 'முக்கிய பங்காளிகள் (Key Partners)' : 'Key Partners'}
              </h4>
              <p className="text-sm text-gray-300">{canvas.key_partners}</p>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                {isTamil ? 'முக்கிய செயல்பாடுகள் (Key Activities)' : 'Key Activities'}
              </h4>
              <p className="text-sm text-gray-300">{canvas.key_activities}</p>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                {isTamil ? 'வாடிக்கையாளர் உறவுகள் (Customer Relationships)' : 'Customer Relationships'}
              </h4>
              <p className="text-sm text-gray-300">{canvas.customer_relationships}</p>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                {isTamil ? 'வாடிக்கையாளர் பிரிவுகள் (Customer Segments)' : 'Customer Segments'}
              </h4>
              <p className="text-sm text-gray-300">{canvas.customer_segments}</p>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                {isTamil ? 'முக்கிய வளங்கள் (Key Resources)' : 'Key Resources'}
              </h4>
              <p className="text-sm text-gray-300">{canvas.key_resources}</p>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                {isTamil ? 'சேனல்கள் / ஊடகங்கள் (Channels)' : 'Channels'}
              </h4>
              <p className="text-sm text-gray-300">{canvas.channels}</p>
            </div>

            {/* Bottom Row */}
            <div className="md:col-span-1.5 p-4 rounded-xl bg-rose-500/5 border border-rose-500/10">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300 mb-1.5">
                {isTamil ? 'செலவு அமைப்பு (Cost Structure)' : 'Cost Structure'}
              </h4>
              <p className="text-sm text-gray-300">{canvas.cost_structure}</p>
            </div>

            <div className="md:col-span-1.5 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300 mb-1.5">
                {isTamil ? 'வருவாய் ஆதாரங்கள் (Revenue Streams)' : 'Revenue Streams'}
              </h4>
              <p className="text-sm text-gray-300">{canvas.revenue_streams}</p>
            </div>

          </div>
        )}

        {/* MARKETING STRATEGY VIEW */}
        {activeTab === 'marketing' && marketing && (
          <div className="space-y-6">
            <div className="p-5 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-sm font-bold text-accentPink mb-2">{isTamil ? 'சந்தைப்படுத்தல் சேனல்கள்' : 'Primary Marketing Channels'}</h3>
              <p className="text-sm text-gray-200">{marketing.channels}</p>
            </div>
            
            <div className="p-5 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-sm font-bold text-accentPink mb-2">{isTamil ? 'துவக்க உத்தி' : 'Go-To-Market Strategy'}</h3>
              <p className="text-sm text-gray-200 leading-relaxed">{marketing.strategy}</p>
            </div>

            <div className="p-5 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-sm font-bold text-accentPink mb-2">{isTamil ? 'பிராண்ட் செய்தி மற்றும் மதிப்புரை' : 'Brand Messaging'}</h3>
              <div className="p-3 bg-black/40 rounded-lg border border-white/5 italic text-gray-300 text-sm">
                "{marketing.messaging}"
              </div>
            </div>
          </div>
        )}

        {/* FINANCIALS VIEW */}
        {activeTab === 'financials' && financials && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-rose-500/5 border border-rose-500/10 flex flex-col justify-between">
                <span className="text-xs font-bold uppercase text-rose-300 tracking-wider">
                  {isTamil ? 'தொடக்க செலவுகள்' : 'Setup Budget'}
                </span>
                <p className="text-2xl font-bold text-white mt-3">{financials.setup_costs}</p>
              </div>

              <div className="p-5 rounded-xl bg-amber-500/5 border border-amber-500/10 flex flex-col justify-between">
                <span className="text-xs font-bold uppercase text-amber-300 tracking-wider">
                  {isTamil ? 'மாதாந்திர செயல்பாட்டு செலவுகள்' : 'Monthly Expenses'}
                </span>
                <p className="text-2xl font-bold text-white mt-3">{financials.monthly_expenses}</p>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-sm font-bold text-emerald-400 mb-2">{isTamil ? 'விலை மாதிரி' : 'Pricing Model'}</h3>
              <p className="text-sm text-gray-200">{financials.pricing}</p>
            </div>

            <div className="p-5 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-sm font-bold text-emerald-400 mb-2">{isTamil ? '1-ஆம் ஆண்டு வருவாய் கணிப்பு' : 'First Year Projections'}</h3>
              <p className="text-sm text-gray-200">{financials.projections}</p>
            </div>
          </div>
        )}

        {/* CHECKLIST VIEW */}
        {activeTab === 'checklist' && checklist && (
          <div className="space-y-6">
            {/* Progress bar */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-300">{isTamil ? 'வளர்ச்சி முன்னேற்றம்' : 'Launch Progress'}</span>
                <span className="text-xs font-bold text-accentPurple">{progressPercent}%</span>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-accentPurple to-accentPink h-full transition-all duration-500" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="space-y-3">
              {checklist.map((item, index) => (
                <div 
                  key={index}
                  onClick={() => handleToggleChecklist(index)}
                  className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                    checkedItems[index]
                      ? 'bg-accentPurple/5 border-accentPurple/30 text-gray-400 line-through'
                      : 'bg-white/5 border-white/10 text-gray-200 hover:bg-white/8 hover:border-white/20'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!checkedItems[index]}
                    onChange={() => {}} // handled by parent onClick
                    className="w-4.5 h-4.5 rounded border-white/20 text-accentPurple focus:ring-accentPurple mt-0.5 pointer-events-none"
                  />
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
