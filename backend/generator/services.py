import os
import json
import re
from pathlib import Path
import google.generativeai as genai

# Load local dataset
BASE_DIR = Path(__file__).resolve().parent.parent
DATASET_PATH = BASE_DIR.parent / 'Dataset' / 'startup_knowledge.json'

def load_startup_knowledge():
    try:
        with open(DATASET_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading startup knowledge dataset: {e}")
        return {"industries": [], "skills": [], "ideas": [], "faq_en": [], "faq_ta": []}

def detect_language(text):
    # Detect Tamil characters in the prompt
    # Tamil Unicode block is U+0B80 to U+0BFF
    tamil_char_pattern = re.compile(r'[\u0b80-\u0bff]')
    if tamil_char_pattern.search(text):
        return 'ta'
    # Fallback to check for words like 'tamil', 'தமிழ்'
    text_lower = text.lower()
    if 'tamil' in text_lower or 'தமிழ்' in text_lower or 'தமிழ்ல்' in text_lower:
        return 'ta'
    return 'en'

def search_local_knowledge(prompt, lang='en'):
    data = load_startup_knowledge()
    prompt_lower = prompt.lower()
    
    # 1. Check FAQs
    faqs = data.get('faq_ta' if lang == 'ta' else 'faq_en', [])
    for faq in faqs:
        question = faq['question'].lower()
        # If user is asking a question similar to the FAQ
        # e.g. "what is mvp" / "mvp என்றால் என்ன"
        if any(word in prompt_lower for word in question.split() if len(word) > 3):
            return {
                "content": f"### {faq['question']}\n\n{faq['answer']}",
                "metadata": None
            }
            
    # 2. Check for skills and industries matching
    matched_industry = None
    matched_skills = []
    
    # Check industries
    for ind in data.get('industries', []):
        name_en = ind['name_en'].lower()
        name_ta = ind['name_ta'].lower()
        id_val = ind['id'].lower()
        if id_val in prompt_lower or name_en in prompt_lower or name_ta in prompt_lower or (id_val == 'agri' and 'farm' in prompt_lower):
            matched_industry = ind['id']
            break
            
    # Check skills
    for sk in data.get('skills', []):
        name_en = sk['name_en'].lower()
        name_ta = sk['name_ta'].lower()
        id_val = sk['id'].lower()
        if id_val in prompt_lower or name_en in prompt_lower or name_ta in prompt_lower or (id_val == 'coding' and ('program' in prompt_lower or 'develop' in prompt_lower or 'code' in prompt_lower)):
            matched_skills.append(sk['id'])
            
    # 3. Match ideas from dataset
    ideas = data.get('ideas', [])
    matched_idea = None
    
    if matched_industry:
        # Filter ideas by industry
        ind_ideas = [i for i in ideas if i['industry'] == matched_industry]
        if ind_ideas:
            # Try to match by skills
            if matched_skills:
                for idea in ind_ideas:
                    if any(s in idea['skills_required'] for s in matched_skills):
                        matched_idea = idea
                        break
            # Fallback to first idea in that industry
            if not matched_idea:
                matched_idea = ind_ideas[0]
                
    # If no industry is matched, search by skills
    if not matched_idea and matched_skills:
        for idea in ideas:
            if any(s in idea['skills_required'] for s in matched_skills):
                matched_idea = idea
                break
                
    # 4. Format the response
    if matched_idea:
        # Found a match, structure the output beautifully
        title = matched_idea['title_ta'] if lang == 'ta' else matched_idea['title_en']
        desc = matched_idea['description_ta'] if lang == 'ta' else matched_idea['description_en']
        
        canvas = matched_idea['canvas_ta'] if lang == 'ta' else matched_idea['canvas_en']
        marketing = matched_idea['marketing_ta'] if lang == 'ta' else matched_idea['marketing_en']
        financials = matched_idea['financials_ta'] if lang == 'ta' else matched_idea['financials_en']
        checklist = matched_idea['checklist_ta'] if lang == 'ta' else matched_idea['checklist_en']
        
        # Format markdown content
        intro_text = (
            f"வணக்கம்! உங்கள் ஆர்வங்கள் மற்றும் திறன்களுக்கு ஏற்ப நான் கண்டறிந்த தொழில் யோசனை இதோ:\n\n"
            if lang == 'ta' else
            f"Hello! Based on your interests and skills, here is a custom startup idea for you:\n\n"
        )
        
        content = (
            f"{intro_text}"
            f"## 🚀 {title}\n\n"
            f"**{desc}**\n\n"
            f"### 📊 Business Model Summary:\n"
            f"- **Value Proposition:** {canvas['value_proposition']}\n"
            f"- **Customer Segment:** {canvas['customer_segments']}\n"
            f"- **Revenue Stream:** {canvas['revenue_streams']}\n\n"
            f"I have loaded the complete **Business Model Canvas, Marketing Strategy, Financial Projections, and Launch Checklist** in the right-side details panel. Click the tabs to explore your plan!"
            if lang == 'en' else
            f"{intro_text}"
            f"## 🚀 {title}\n\n"
            f"**{desc}**\n\n"
            f"### 📊 வணிக மாதிரி சுருக்கம்:\n"
            f"- **மதிப்பு முன்மொழிவு:** {canvas['value_proposition']}\n"
            f"- **வாடிக்கையாளர் பிரிவு:** {canvas['customer_segments']}\n"
            f"- **வருவாய் ஆதாரம்:** {canvas['revenue_streams']}\n\n"
            f"முழுமையான **வணிக மாதிரி கேன்வாஸ், சந்தைப்படுத்தல் உத்தி, நிதி கணிப்புகள் மற்றும் தொடக்க சரிபார்ப்பு பட்டியல்** வலது பக்க விவரங்கள் பேனலில் ஏற்றப்பட்டுள்ளன. உங்கள் திட்டத்தை ஆராய தாவல்களைக் கிளிக் செய்க!"
        )
        
        # Prepare structured metadata for the frontend
        metadata = {
            "title": title,
            "description": desc,
            "canvas": canvas,
            "marketing": marketing,
            "financials": financials,
            "checklist": checklist
        }
        
        return {
            "content": content,
            "metadata": json.dumps(metadata, ensure_ascii=False)
        }
        
    # 5. Default General Response (If no direct matches found)
    if lang == 'ta':
        content = (
            "வணக்கம்! நான் **IgniteStart** AI தொழில் ஆலோசகர். உங்களுக்கு ஏற்ற தொழில் யோசனைகளை உருவாக்க நான் உதவ முடியும்.\n\n"
            "வழிகாட்டல் பெற பின்வருவனவற்றை உள்ளிடவும்:\n"
            "1. **உங்கள் ஆர்வங்கள்** (உதாரணமாக: விவசாயம், தொழில்நுட்பம், கல்வி, சில்லறை வர்த்தகம்)\n"
            "2. **உங்கள் திறன்கள்** (உதாரணமாக: குறியீட்டு முறை, வடிவமைப்பு, விற்பனை, எழுதுதல்)\n"
            "3. **தோராயமான பட்ஜெட்**\n\n"
            "என்னிடம் சில பொதுவான கேள்விகளையும் நீங்கள் கேட்கலாம், உதாரணமாக:\n"
            "- *குறைந்தபட்ச சாத்தியமான தயாரிப்பு (MVP) என்றால் என்ன?*\n"
            "- *நிறுவனத்திற்கு நிதி திரட்டுவது எப்படி?*"
        )
    else:
        content = (
            "Hello! I am **IgniteStart**, your AI Startup Advisor. I help you generate customized business ideas and structure your business plan.\n\n"
            "To get started, tell me about:\n"
            "1. **Your Interests** (e.g. Agriculture, Tech, Education, E-Commerce)\n"
            "2. **Your Skills** (e.g. Programming, UI/UX Design, Sales, Writing)\n"
            "3. **Your Budget / Resources**\n\n"
            "Or ask me general planning questions, like:\n"
            "- *What is an MVP?*\n"
            "- *How can I raise startup capital?*\n"
            "- *How do I choose the right business model?*"
        )
        
    return {
        "content": content,
        "metadata": None
    }

def generate_startup_guidance(prompt, api_key=None, history=[]):
    lang = detect_language(prompt)
    
    # If API key is provided, try calling Gemini
    if api_key:
        try:
            genai.configure(api_key=api_key)
            
            # Format chat history for Gemini
            gemini_history = []
            for msg in history:
                role = 'user' if msg['sender'] == 'user' else 'model'
                gemini_history.append({'role': role, 'parts': [msg['content']]})
                
            model = genai.GenerativeModel(
                model_name='gemini-1.5-flash',
                generation_config={"response_mime_type": "text/plain"},
                system_instruction="""You are IgniteStart, a professional Startup Advisor AI.
You help users suggest startup/business ideas based on their interests, budget, and skills.
You also provide basic business planning guidance: Business Model Canvas, Marketing Strategy, Financial Projections, and a Launch Checklist.

CRITICAL INSTRUCTIONS:
1. If the user asks in Tamil, asks for Tamil, or has a Tamil prompt, respond in fluent, natural, and professional Tamil.
2. If the user is asking for ideas, suggest a tailored business idea based on their input.
3. If you generate a startup idea, you must supply a structured JSON representation of the plan AT THE VERY END of your response inside a block tagged with ```json ... ```. The JSON MUST look like this:
```json
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
```
If you are answering general startup questions (like funding, legal issues, general definitions) and NOT proposing a specific idea, just answer in a clean, professional markdown layout without the JSON block.
"""
            )
            
            # Use start_chat to manage history
            chat = model.start_chat(history=gemini_history)
            response = chat.send_message(prompt)
            response_text = response.text
            
            # Parse the JSON metadata if it exists in the response
            metadata_str = None
            json_block_match = re.search(r'```json\s*(.*?)\s*```', response_text, re.DOTALL)
            if json_block_match:
                try:
                    metadata_str = json_block_match.group(1).strip()
                    # Verify it's valid JSON
                    json.loads(metadata_str)
                    
                    # Clean up the output content that will be displayed in chat so the JSON block is hidden or less obtrusive
                    # We can remove the json block from the displayed text because the details panel will show it beautifully!
                    clean_text = response_text.replace(json_block_match.group(0), "").strip()
                    if lang == 'ta':
                        clean_text += "\n\n(குறிப்பு: இதற்கான விரிவான வணிகத் திட்டம் மற்றும் கேன்வாஸ் வலது பக்க விவரங்கள் பேனலில் ஏற்றப்பட்டுள்ளன!)"
                    else:
                        clean_text += "\n\n(Note: The structured business plan and canvas have been loaded in the right-side details panel!)"
                    response_text = clean_text
                except Exception as json_err:
                    print(f"Failed to parse AI-generated JSON block: {json_err}")
                    metadata_str = None
                    
            return response_text, metadata_str
            
        except Exception as e:
            print(f"Gemini API execution failed: {e}. Falling back to local engine.")
            # Fallback to local on exception
            
    # Fallback to Local Knowledge Engine
    local_result = search_local_knowledge(prompt, lang=lang)
    return local_result['content'], local_result['metadata']
