const API_BASE = 'http://localhost:8000/api';
let isOfflineMode = null;
let cachedKnowledge = null;

// Determine base URL for static assets (like startup_knowledge.json)
const BASE_URL = import.meta.env.BASE_URL || '/';

async function checkConnection() {
  if (isOfflineMode !== null) return !isOfflineMode;
  try {
    // Attempt a quick connection check with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);
    
    const res = await fetch(`${API_BASE}/sessions/`, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (res.ok) {
      isOfflineMode = false;
      return true;
    }
  } catch (err) {
    console.warn("Django backend unreachable. Running in client-side serverless mode.", err);
  }
  isOfflineMode = true;
  return false;
}

// Load knowledge JSON
async function getKnowledge() {
  if (cachedKnowledge) return cachedKnowledge;
  try {
    const res = await fetch(`${BASE_URL}startup_knowledge.json`);
    if (res.ok) {
      cachedKnowledge = await res.json();
      return cachedKnowledge;
    }
  } catch (err) {
    console.error("Failed to load startup knowledge base:", err);
  }
  return { industries: [], skills: [], ideas: [], faq_en: [], faq_ta: [] };
}

function detectLanguage(text) {
  const tamilCharPattern = /[\u0b80-\u0bff]/;
  if (tamilCharPattern.test(text)) {
    return 'ta';
  }
  const lower = text.toLowerCase();
  if (lower.includes('tamil') || lower.includes('தமிழ்') || lower.includes('தமிழ்ல்')) {
    return 'ta';
  }
  return 'en';
}

function searchLocalKnowledge(knowledge, prompt, lang = 'en') {
  const promptLower = prompt.toLowerCase();
  
  // 1. Check FAQs
  const faqs = lang === 'ta' ? (knowledge.faq_ta || []) : (knowledge.faq_en || []);
  for (let faq of faqs) {
    const question = faq.question.toLowerCase();
    const words = question.split(/\s+/).filter(w => w.length > 3);
    if (words.some(word => promptLower.includes(word))) {
      return {
        content: `### ${faq.question}\n\n${faq.answer}`,
        metadata: null
      };
    }
  }
  
  // 2. Check for skills and industries matching
  let matchedIndustry = null;
  const matchedSkills = [];
  
  // Check industries
  for (let ind of (knowledge.industries || [])) {
    const nameEn = ind.name_en.toLowerCase();
    const nameTa = ind.name_ta.toLowerCase();
    const idVal = ind.id.toLowerCase();
    if (promptLower.includes(idVal) || promptLower.includes(nameEn) || promptLower.includes(nameTa) || (idVal === 'agri' && promptLower.includes('farm'))) {
      matchedIndustry = ind.id;
      break;
    }
  }
  
  // Check skills
  for (let sk of (knowledge.skills || [])) {
    const nameEn = sk.name_en.toLowerCase();
    const nameTa = sk.name_ta.toLowerCase();
    const idVal = sk.id.toLowerCase();
    if (promptLower.includes(idVal) || promptLower.includes(nameEn) || promptLower.includes(nameTa) || (idVal === 'coding' && (promptLower.includes('program') || promptLower.includes('develop') || promptLower.includes('code')))) {
      matchedSkills.push(sk.id);
    }
  }
  
  // 3. Match ideas from dataset
  const ideas = knowledge.ideas || [];
  let matchedIdea = null;
  
  if (matchedIndustry) {
    const indIdeas = ideas.filter(i => i.industry === matchedIndustry);
    if (indIdeas.length > 0) {
      if (matchedSkills.length > 0) {
        for (let idea of indIdeas) {
          if (matchedSkills.some(s => (idea.skills_required || []).includes(s))) {
            matchedIdea = idea;
            break;
          }
        }
      }
      if (!matchedIdea) {
        matchedIdea = indIdeas[0];
      }
    }
  }
  
  if (!matchedIdea && matchedSkills.length > 0) {
    for (let idea of ideas) {
      if (matchedSkills.some(s => (idea.skills_required || []).includes(s))) {
        matchedIdea = idea;
        break;
      }
    }
  }
  
  // 4. Format the response
  if (matchedIdea) {
    const title = lang === 'ta' ? matchedIdea.title_ta : matchedIdea.title_en;
    const desc = lang === 'ta' ? matchedIdea.description_ta : matchedIdea.description_en;
    
    const canvas = lang === 'ta' ? matchedIdea.canvas_ta : matchedIdea.canvas_en;
    const marketing = lang === 'ta' ? matchedIdea.marketing_ta : matchedIdea.marketing_en;
    const financials = lang === 'ta' ? matchedIdea.financials_ta : matchedIdea.financials_en;
    const checklist = lang === 'ta' ? matchedIdea.checklist_ta : matchedIdea.checklist_en;
    
    const introText = lang === 'ta' 
      ? "வணக்கம்! உங்கள் ஆர்வங்கள் மற்றும் திறன்களுக்கு ஏற்ப நான் கண்டறிந்த தொழில் யோசனை இதோ:\n\n"
      : "Hello! Based on your interests and skills, here is a custom startup idea for you:\n\n";
      
    let content = "";
    if (lang === 'en') {
      content = `${introText}## 🚀 ${title}\n\n**${desc}**\n\n### 📊 Business Model Summary:\n- **Value Proposition:** ${canvas.value_proposition}\n- **Customer Segment:** ${canvas.customer_segments}\n- **Revenue Stream:** ${canvas.revenue_streams}\n\nI have loaded the complete **Business Model Canvas, Marketing Strategy, Financial Projections, and Launch Checklist** in the right-side details panel. Click the tabs to explore your plan!`;
    } else {
      content = `${introText}## 🚀 ${title}\n\n**${desc}**\n\n### 📊 வணிக மாதிரி சுருக்கம்:\n- **மதிப்பு முன்மொழிவு:** ${canvas.value_proposition}\n- **வாடிக்கையாளர் பிரிவு:** ${canvas.customer_segments}\n- **வருவாய் ஆதாரம்:** ${canvas.revenue_streams}\n\nமுழுமையான **வணிக மாதிரி கேன்வாஸ், சந்தைப்படுத்தல் உத்தி, நிதி கணிப்புகள் மற்றும் தொடக்க சரிபார்ப்பு பட்டியல்** வலது பக்க விவரங்கள் பேனலில் ஏற்றப்பட்டுள்ளன. உங்கள் திட்டத்தை ஆராய தாவல்களைக் கிளிக் செய்க!`;
    }
    
    const metadata = {
      title,
      description: desc,
      canvas,
      marketing,
      financials,
      checklist
    };
    
    return {
      content,
      metadata
    };
  }
  
  // 5. Default General Response
  let content = "";
  if (lang === 'ta') {
    content = "வணக்கம்! நான் **IgniteStart** AI தொழில் ஆலோசகர். உங்களுக்கு ஏற்ற தொழில் யோசனைகளை உருவாக்க நான் உதவ முடியும்.\n\nவழிகாட்டல் பெற பின்வருவனவற்றை உள்ளிடவும்:\n1. **உங்கள் ஆர்வங்கள்** (உதாரணமாக: விவசாயம், தொழில்நுட்பம், கல்வி, சில்லறை வர்த்தகம்)\n2. **உங்கள் திறன்கள்** (உதாரணமாக: குறியீட்டு முறை, வடிவமைப்பு, விற்பனை, எழுதுதல்)\n3. **தோராயமான பட்ஜெட்**\n\nஎன்னிடம் சில பொதுவான கேள்விகளையும் நீங்கள் கேட்கலாம், உதாரணமாக:\n- *குறைந்தபட்ச சாத்தியமான தயாரிப்பு (MVP) என்றால் என்ன?*\n- *நிறுவனத்திற்கு நிதி திரட்டுவது எப்படி?*";
  } else {
    content = "Hello! I am **IgniteStart**, your AI Startup Advisor. I help you generate customized business ideas and structure your business plan.\n\nTo get started, tell me about:\n1. **Your Interests** (e.g. Agriculture, Tech, Education, E-Commerce)\n2. **Your Skills** (e.g. Programming, UI/UX Design, Sales, Writing)\n3. **Your Budget / Resources**\n\nOr ask me general planning questions, like:\n- *What is an MVP?*\n- *How can I raise startup capital?*\n- *How do I choose the right business model?*";
  }
  
  return {
    content,
    metadata: null
  };
}

async function callGeminiAPI(prompt, apiKey, history, lang) {
  const systemInstruction = `You are IgniteStart, a professional Startup Advisor AI.
You help users suggest startup/business ideas based on their interests, budget, and skills.
You also provide basic business planning guidance: Business Model Canvas, Marketing Strategy, Financial Projections, and a Launch Checklist.

CRITICAL INSTRUCTIONS:
1. If the user asks in Tamil, asks for Tamil, or has a Tamil prompt, respond in fluent, natural, and professional Tamil.
2. If the user is asking for ideas, suggest a tailored business idea based on their input.
3. If you generate a startup idea, you must supply a structured JSON representation of the plan AT THE VERY END of your response inside a block tagged with \`\`\`json ... \`\`\`. The JSON MUST look like this:
\`\`\`json
{
  "title": "Startup Title",
  "description": "Short description",
  "canvas": {
    "key_partners": "Partners description",
    "key_activities": "Activities description",
    "value_proposition": "Value prop details",
    "customer_relationships": "Relationship strategy",
    "customer_segments": "Target segments",
    "key_resources": "Resource details",
    "channels": "Marketing channels",
    "cost_structure": "Primary costs",
    "revenue_streams": "Pricing & sales streams"
  },
  "marketing": {
    "channels": "Channels details",
    "strategy": "Marketing strategy",
    "messaging": "Key brand messaging"
  },
  "financials": {
    "setup_costs": "Initial budget list",
    "monthly_expenses": "Recurring expense estimate",
    "pricing": "Product pricing details",
    "projections": "1-year revenue projection"
  },
  "checklist": [
    "Milestone 1",
    "Milestone 2",
    "Milestone 3"
  ]
}
\`\`\`
If you are answering general startup questions (like funding, legal issues, general definitions) and NOT proposing a specific idea, just answer in a clean, professional markdown layout without the JSON block.`;

  const contents = [];
  
  // Format chat history
  for (let msg of history) {
    contents.push({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    });
  }
  
  // Add user prompt
  contents.push({
    role: 'user',
    parts: [{ text: prompt }]
  });

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents,
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      generationConfig: {
        responseMimeType: "text/plain"
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const responseData = await response.json();
  
  if (!responseData.candidates || responseData.candidates.length === 0) {
    throw new Error("Empty response from Gemini API");
  }

  const text = responseData.candidates[0].content.parts[0].text;
  let metadata = null;
  let content = text;
  
  const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonBlockMatch) {
    try {
      const jsonStr = jsonBlockMatch[1].trim();
      metadata = JSON.parse(jsonStr);
      
      content = text.replace(jsonBlockMatch[0], "").trim();
      if (lang === 'ta') {
        content += "\n\n(குறிப்பு: இதற்கான விரிவான வணிகத் திட்டம் மற்றும் கேன்வாஸ் வலது பக்க விவரங்கள் பேனலில் ஏற்றப்பட்டுள்ளன!)";
      } else {
        content += "\n\n(Note: The structured business plan and canvas have been loaded in the right-side details panel!)";
      }
    } catch (err) {
      console.error("Failed to parse AI-generated JSON block:", err);
    }
  }

  return {
    content,
    metadata
  };
}

async function handleOfflineChat(sessionId, prompt, apiKey) {
  let curSessionId = sessionId;
  let sessions = JSON.parse(localStorage.getItem('ignite_sessions') || '[]');
  let session = sessions.find(s => s.id === curSessionId);
  
  if (!session) {
    curSessionId = 'local_' + Date.now();
    session = {
      id: curSessionId,
      title: "New Startup Discussion",
      created_at: new Date().toISOString()
    };
    sessions.unshift(session); // Add to beginning
    localStorage.setItem('ignite_sessions', JSON.stringify(sessions));
  }
  
  // Save user message
  const userMsgId = 'msg_' + Date.now() + '_user';
  const userMsg = {
    id: userMsgId,
    sender: 'user',
    content: prompt,
    timestamp: new Date().toISOString()
  };
  
  const messagesKey = `ignite_messages_${curSessionId}`;
  let messages = JSON.parse(localStorage.getItem(messagesKey) || '[]');
  messages.push(userMsg);
  localStorage.setItem(messagesKey, JSON.stringify(messages));
  
  // Detect language
  const lang = detectLanguage(prompt);
  
  let botContent = "";
  let botMetadata = null;
  
  if (apiKey && apiKey.trim() !== '') {
    try {
      // Build history for Gemini
      // Get the last 10 messages for context
      const historyMessages = messages.slice(0, -1).slice(-10);
      const historyList = historyMessages.map(m => ({
        sender: m.sender,
        content: m.content
      }));
      
      const res = await callGeminiAPI(prompt, apiKey, historyList, lang);
      botContent = res.content;
      botMetadata = res.metadata;
    } catch (err) {
      console.error("Gemini API call failed, falling back to local database:", err);
      const localRes = await getLocalResponse(prompt, lang);
      botContent = localRes.content;
      botMetadata = localRes.metadata;
    }
  } else {
    const localRes = await getLocalResponse(prompt, lang);
    botContent = localRes.content;
    botMetadata = localRes.metadata;
  }
  
  // Save Bot message
  const botMsgId = 'msg_' + (Date.now() + 1) + '_bot';
  const botMsg = {
    id: botMsgId,
    sender: 'bot',
    content: botContent,
    metadata: botMetadata,
    timestamp: new Date().toISOString()
  };
  
  messages.push(botMsg);
  localStorage.setItem(messagesKey, JSON.stringify(messages));
  
  // Update Session Title if it was default
  if (session.title === "New Startup Discussion") {
    let titleToSet = prompt.slice(0, 30);
    if (botMetadata && botMetadata.title) {
      titleToSet = botMetadata.title;
    }
    
    session.title = titleToSet;
    // update in sessions list
    sessions = sessions.map(s => s.id === curSessionId ? session : s);
    localStorage.setItem('ignite_sessions', JSON.stringify(sessions));
  }
  
  return {
    session_id: curSessionId,
    session_title: session.title,
    message: botMsg
  };
}

async function getLocalResponse(prompt, lang) {
  const knowledge = await getKnowledge();
  return searchLocalKnowledge(knowledge, prompt, lang);
}

export async function getSessions() {
  const isOnline = await checkConnection();
  if (isOnline) {
    try {
      const res = await fetch(`${API_BASE}/sessions/`);
      if (res.ok) return await res.json();
    } catch (err) {
      console.warn("Connection lost, reverting to offline for sessions", err);
    }
  }
  
  const sessions = JSON.parse(localStorage.getItem('ignite_sessions') || '[]');
  return sessions;
}

export async function getSessionMessages(sessionId) {
  const isOnline = await checkConnection();
  if (isOnline && !String(sessionId).startsWith('local_')) {
    try {
      const res = await fetch(`${API_BASE}/sessions/${sessionId}/messages/`);
      if (res.ok) return await res.json();
    } catch (err) {
      console.warn("Connection lost, reverting to offline for messages", err);
    }
  }
  
  const messages = JSON.parse(localStorage.getItem(`ignite_messages_${sessionId}`) || '[]');
  return messages;
}

export async function deleteSession(sessionId) {
  const isOnline = await checkConnection();
  if (isOnline && !String(sessionId).startsWith('local_')) {
    try {
      const res = await fetch(`${API_BASE}/sessions/${sessionId}/`, { method: 'DELETE' });
      if (res.ok) return true;
    } catch (err) {
      console.error("Failed to delete session online:", err);
    }
  }
  
  let sessions = JSON.parse(localStorage.getItem('ignite_sessions') || '[]');
  sessions = sessions.filter(s => s.id !== sessionId);
  localStorage.setItem('ignite_sessions', JSON.stringify(sessions));
  localStorage.removeItem(`ignite_messages_${sessionId}`);
  return true;
}

export async function sendChatMessage(sessionId, prompt, apiKey) {
  const isOnline = await checkConnection();
  if (isOnline && (!sessionId || !String(sessionId).startsWith('local_'))) {
    try {
      const res = await fetch(`${API_BASE}/chat/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Gemini-Key': apiKey || ''
        },
        body: JSON.stringify({ session_id: sessionId, prompt })
      });
      if (res.ok) return await res.json();
    } catch (err) {
      console.warn("Connection failed during message sending, falling back to local chat handler", err);
    }
  }
  
  return await handleOfflineChat(sessionId, prompt, apiKey);
}

export function getIsOffline() {
  return isOfflineMode === null ? true : isOfflineMode;
}
