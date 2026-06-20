import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lightbulb, Settings, Milestone, HelpCircle, Layers, ArrowRight, Languages, Sparkles } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/chat');
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Glows */}
      <div className="gradient-bg-glow top-10 left-10 w-96 h-96 bg-accentPurple/20" />
      <div className="gradient-bg-glow bottom-20 right-10 w-[500px] h-[500px] bg-accentPink/10" />

      {/* Nav Header */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-accentPurple to-accentPink flex items-center justify-center font-bold text-white shadow-lg shadow-accentPurple/30">
            I
          </div>
          <span className="text-lg font-bold text-white tracking-wide">IgniteStart</span>
        </div>
        
        {/* Name on the top right which navigates to the project */}
        <button 
          onClick={handleStart}
          className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-accentPurple to-accentPink hover:opacity-80 transition-all flex items-center gap-1.5"
        >
          <Sparkles className="w-4 h-4 text-accentPurple" />
          <span>Launch Project</span>
        </button>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-12 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-gray-300 mb-6">
            <Languages className="w-3.5 h-3.5 text-accentPurple" />
            English & தமிழ் (Tamil) Supported
          </span>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6">
            Generate Startup Ideas <br />
            <span className="text-gradient-primary">Based on Your Skills & Interests</span>
          </h1>

          <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            IgniteStart is an intelligent business planner assistant. Tell the advisor what you love doing and your core skills, and watch it structure complete Business Canvases, marketing maps, and detailed finances instantly.
          </p>

          <div className="flex justify-center gap-4">
            <button
              onClick={handleStart}
              className="px-8 py-3.5 bg-gradient-to-r from-accentPurple to-accentPink hover:opacity-95 text-white font-bold rounded-xl shadow-lg shadow-accentPurple/25 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span>Build My Startup</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        {/* How It Works Section */}
        <div className="mt-32 text-left relative">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">How It Works</h2>
            <p className="text-sm text-gray-400 max-w-md mx-auto">Three simple steps to structure your next business venture.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Share Passions & Skills',
                desc: 'Chat with IgniteStart about what industries you like (e.g. Agriculture) and what skills you possess (e.g. Sales, Coding).',
                icon: Lightbulb
              },
              {
                step: '02',
                title: 'Get Curated Blueprints',
                desc: 'Our engine parses your interest matrices to suggest complete ideas, from smart devices to services, localized in English or Tamil.',
                icon: Layers
              },
              {
                step: '03',
                title: 'Explore Planning Panels',
                desc: 'Click through active tabs to view complete Business Canvases, Launch Checklist items, marketing playbooks, and financials.',
                icon: Milestone
              }
            ].map((stepItem, index) => {
              const IconComp = stepItem.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15, duration: 0.5 }}
                  className="p-6 rounded-2xl glassmorphism-card flex flex-col justify-between h-64"
                >
                  <div>
                    <span className="text-gradient-secondary text-2xl font-bold">{stepItem.step}</span>
                    <h3 className="text-lg font-bold text-white mt-4 mb-2">{stepItem.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{stepItem.desc}</p>
                  </div>
                  <div className="flex justify-end">
                    <IconComp className="w-6 h-6 text-accentPurple/40" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mt-32 text-left">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Key Benefits</h2>
            <p className="text-sm text-gray-400 max-w-md mx-auto">Engineered to accelerate early-stage business validation.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: 'Fully Multi-Lingual Support',
                desc: 'Ask questions or requests in English or Tamil (தமிழ்). The system automatically answers in the language you prefer, keeping guides friendly and culturally relevant.',
                icon: Languages
              },
              {
                title: 'Business Model Canvas Creator',
                desc: 'Instantly view visual canvas blocks (Value Propositions, Channels, Costs) to understand how your startup operates behind the scenes.',
                icon: Layers
              },
              {
                title: 'Setup Budgets & Revenue Projections',
                desc: 'Understand what it costs to launch, what monthly subscriptions are required, and view pricing guidelines mapped in real-time.',
                icon: HelpCircle
              },
              {
                title: 'Interactive Launch Steps',
                desc: 'Get a step-by-step checklist of milestones. Toggle completion status interactively to follow your roadmap to launch.',
                icon: Milestone
              }
            ].map((benefit, index) => {
              const IconComp = benefit.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  className="p-6 rounded-2xl glassmorphism border-white/5 flex gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-accentPurple/10 flex items-center justify-center text-accentPurple flex-shrink-0">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">{benefit.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{benefit.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 text-center mt-20">
        <p className="text-xs text-gray-500">© 2026 IgniteStart. Sparking innovation in English and தமிழ்.</p>
      </footer>
    </div>
  );
}
