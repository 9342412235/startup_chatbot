import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageSquare, Plus, Trash2, Send, Settings, ArrowLeft, 
  Languages, Sparkles, SidebarOpen, SidebarClose, HelpCircle, Loader2
} from 'lucide-react';
import SettingsModal from './SettingsModal';
import BusinessPlan from './BusinessPlan';
import { 
  getSessions, 
  getSessionMessages, 
  deleteSession, 
  sendChatMessage, 
  getIsOffline 
} from '../services/chatService';

export default function ChatInterface() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Settings & Language
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTamil, setIsTamil] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Active Plan Metadata
  const [activePlan, setActivePlan] = useState(null);
  const [isOffline, setIsOffline] = useState(true);

  const messagesEndRef = useRef(null);

  // Load past sessions on mount
  useEffect(() => {
    fetchSessions();
  }, []);

  // Fetch messages when current session changes
  useEffect(() => {
    if (currentSessionId) {
      fetchMessages(currentSessionId);
    } else {
      setMessages([]);
      setActivePlan(null);
    }
  }, [currentSessionId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const fetchSessions = async () => {
    try {
      const data = await getSessions();
      setSessions(data);
      setIsOffline(getIsOffline());
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    }
  };

  const fetchMessages = async (sessionId) => {
    try {
      const data = await getSessionMessages(sessionId);
      setMessages(data);
      
      // Find the last message that has a business plan metadata
      const planMsg = [...data].reverse().find(m => m.metadata);
      if (planMsg) {
        let metadataObj = planMsg.metadata;
        if (typeof metadataObj === 'string') {
          try {
            metadataObj = JSON.parse(metadataObj);
          } catch (e) {}
        }
        setActivePlan(metadataObj);
      } else {
        setActivePlan(null);
      }
      setIsOffline(getIsOffline());
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const handleCreateSession = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setActivePlan(null);
  };

  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    if (confirm(isTamil ? 'இந்த அரட்டையை நீக்க வேண்டுமா?' : 'Delete this chat session?')) {
      try {
        await deleteSession(sessionId);
        fetchSessions();
        if (currentSessionId === sessionId) {
          handleCreateSession();
        }
        setIsOffline(getIsOffline());
      } catch (err) {
        console.error('Failed to delete session:', err);
      }
    }
  };

  const handleSendMessage = async (promptText) => {
    const textToSend = promptText || input;
    if (!textToSend.trim()) return;

    if (!promptText) setInput('');
    setLoading(true);

    // Optimistically add User message to local state
    const tempUserMsg = {
      id: Date.now().toString(),
      sender: 'user',
      content: textToSend,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const apiKey = localStorage.getItem('ignite_gemini_key') || '';
      const data = await sendChatMessage(currentSessionId, textToSend, apiKey);
      
      // Update session ID if it was a new session
      if (!currentSessionId) {
        setCurrentSessionId(data.session_id);
        fetchSessions();
      } else {
        // Refresh session list to update titles if needed
        fetchSessions();
      }
      
      // Add Bot message to state
      setMessages(prev => [...prev, data.message]);
      
      // Update active plan panel if metadata is generated
      if (data.message.metadata) {
        let metadataObj = data.message.metadata;
        if (typeof metadataObj === 'string') {
          try {
            metadataObj = JSON.parse(metadataObj);
          } catch (e) {}
        }
        setActivePlan(metadataObj);
      }
      setIsOffline(getIsOffline());
    } catch (err) {
      console.error('Failed to send message:', err);
      // Add error message
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'bot',
        content: isTamil 
          ? 'மன்னிக்கவும், யோசனை உருவாக்குவதில் பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.' 
          : 'Sorry, failed to generate startup ideas. Please try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Quick suggestion chips
  const suggestionPills = isTamil ? [
    { label: 'விவசாயம் + குறியீட்டு முறை', value: 'நான் விவசாயம் மற்றும் தொழில்நுட்பத்தில் ஆர்வமாக உள்ளேன். எனக்கு குறியீட்டுத் திறன் உள்ளது. ஒரு தொழில் யோசனை கூறுங்கள்.' },
    { label: 'மின்-வணிகம் + விற்பனை', value: 'மின்-வணிகம் மற்றும் விற்பனை திறன்களை அடிப்படையாகக் கொண்டு ஒரு வணிகத் திட்டம் தாருங்கள்.' },
    { label: 'கல்வி + எழுதுதல்', value: 'எனக்கு உள்ளடக்க எழுத்துத் திறன் உள்ளது, மின்-கற்றல் துறையில் ஒரு தொழில் யோசனை வேண்டும்.' },
  ] : [
    { label: 'Agriculture + Coding', value: 'I am interested in Agriculture, and I have Coding/Development skills. Suggest a startup idea.' },
    { label: 'E-Commerce + Sales', value: 'Provide a business blueprint for E-Commerce using my Sales skills.' },
    { label: 'E-Learning + Writing', value: 'I have content writing skills and want to start an E-Learning platform.' }
  ];

  return (
    <div className="h-screen flex overflow-hidden bg-darkBg text-gray-200">
      
      {/* Session List Sidebar */}
      <div 
        className={`glassmorphism border-r border-white/10 flex flex-col transition-all duration-300 ${
          isSidebarOpen ? 'w-80' : 'w-0 overflow-hidden border-none'
        }`}
      >
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-wider uppercase text-gray-400">
              {isTamil ? 'அரட்டைகள்' : 'Conversations'}
            </span>
          </div>
          <button 
            onClick={handleCreateSession}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-all flex items-center gap-1 text-xs font-semibold"
          >
            <Plus className="w-4 h-4 text-accentPurple" />
            <span>{isTamil ? 'புதியது' : 'New'}</span>
          </button>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-500">
              {isTamil ? 'அரட்டைகள் எதுவும் இல்லை' : 'No past conversations'}
            </div>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => setCurrentSessionId(s.id)}
                className={`group p-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all border ${
                  currentSessionId === s.id
                    ? 'bg-accentPurple/15 border-accentPurple/30 text-white'
                    : 'bg-white/2 border-white/5 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <MessageSquare className={`w-4 h-4 flex-shrink-0 ${
                    currentSessionId === s.id ? 'text-accentPurple' : 'text-gray-400'
                  }`} />
                  <span className="text-xs font-medium truncate">{s.title}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteSession(e, s.id)}
                  className="p-1 rounded opacity-0 group-hover:opacity-100 text-gray-400 hover:text-rose-400 hover:bg-white/5 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Pane */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0c0d16]/30">
        
        {/* Chat Header */}
        <header className="h-16 border-b border-white/10 px-6 flex items-center justify-between glassmorphism relative z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              {isSidebarOpen ? <SidebarClose className="w-4 h-4" /> : <SidebarOpen className="w-4 h-4" />}
            </button>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">IgniteStart Advisor</span>
                {isOffline ? (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-accentPurple/20 text-accentPurple border border-accentPurple/30 uppercase tracking-wide">
                    {isTamil ? 'உள்ளூர்' : 'Browser DB'}
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wide">
                    {isTamil ? 'சர்வர்' : 'Django Server'}
                  </span>
                )}
              </div>
              <span className="text-2xs text-gray-500 font-medium mt-0.5">
                {currentSessionId ? (isTamil ? 'அமர்வு செயலில் உள்ளது' : 'Active Session') : (isTamil ? 'புதிய அரட்டை' : 'Draft Session')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <button
              onClick={() => setIsTamil(!isTamil)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-all"
            >
              <Languages className="w-3.5 h-3.5 text-accentPurple" />
              <span>{isTamil ? 'English' : 'தமிழ்'}</span>
            </button>

            {/* API Settings */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Message Panel */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center max-w-md mx-auto text-center">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-accentPurple to-accentPink flex items-center justify-center font-bold text-white shadow-xl shadow-accentPurple/25 mb-4 animate-bounce">
                I
              </div>
              <h2 className="text-lg font-bold text-white mb-2">
                {isTamil ? 'தொழில் யோசனை ஆலோசகருக்கு வரவேற்கிறோம்!' : 'Welcome to IgniteStart!'}
              </h2>
              <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                {isTamil 
                  ? 'உங்கள் தொழில் வாய்ப்புகளைக் கண்டறிந்து திட்டமிட ஆரம்பிக்கலாம். எங்களை வழிநடத்த உங்கள் ஆர்வங்கள் மற்றும் திறன்களைப் பகிர்ந்து கொள்ளுங்கள் அல்லது கீழே உள்ள உதாரணத் திட்டங்களைத் தேர்ந்தெடுக்கவும்.'
                  : 'Let\'s unlock your entrepreneurial potential. Describe your skills and interests to generate a structured blueprint, or pick a suggestion below to test.'}
              </p>
              
              {/* Suggestions */}
              <div className="w-full space-y-2">
                {suggestionPills.map((pill, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(pill.value)}
                    className="w-full text-left p-3 text-xs bg-white/5 border border-white/8 hover:bg-white/10 rounded-xl transition-all text-gray-300 hover:text-white flex items-center justify-between"
                  >
                    <span>{pill.label}</span>
                    <Sparkles className="w-3.5 h-3.5 text-accentPurple" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-tr from-accentPurple to-accentIndigo text-white rounded-br-none shadow-md shadow-accentPurple/10'
                      : 'bg-white/5 border border-white/8 rounded-bl-none text-gray-200'
                  }`}
                >
                  {/* Content Renderer */}
                  <div className="whitespace-pre-wrap">{m.content}</div>
                </div>
              </div>
            ))
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/8 rounded-2xl rounded-bl-none p-4 flex items-center gap-2.5 text-sm text-gray-400">
                <Loader2 className="w-4 h-4 text-accentPurple animate-spin" />
                <span>{isTamil ? 'யோசனை உருவாக்கப்படுகிறது...' : 'Crafting startup model...'}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-white/10 bg-[#0c0d16]/50">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isTamil ? 'உதாரணம்: நான் விவசாயத்தில் ஆர்வம் கொண்டவன், மென்பொருள் எழுதத் தெரியும்...' : 'Describe interests and skills...'}
              disabled={loading}
              className="flex-1 py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:border-accentPurple transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="p-3 bg-gradient-to-r from-accentPurple to-accentPink text-white rounded-xl shadow-lg shadow-accentPurple/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>

      {/* Right Plan View Dashboard */}
      <div className="hidden lg:block w-[45%] border-l border-white/10 bg-[#0c0d16]/40 flex flex-col">
        <BusinessPlan plan={activePlan} isTamil={isTamil} />
      </div>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
}
