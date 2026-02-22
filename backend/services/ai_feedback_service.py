import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

class AIFeedbackService:
    def __init__(self):
        self.api_key = os.getenv('GEMINI_API_KEY')
        self.model = None
        
        if self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                
                # Find an available model that supports generateContent
                available_models = []
                for m in genai.list_models():
                    if 'generateContent' in m.supported_generation_methods:
                        available_models.append(m.name.replace('models/', ''))
                
                # Prefer flash models (faster), then pro
                preferred = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-pro']
                model_name = None
                
                for pref in preferred:
                    for available in available_models:
                        if pref in available:
                            model_name = available
                            break
                    if model_name:
                        break
                
                if not model_name and available_models:
                    model_name = available_models[0]
                
                if model_name:
                    self.model = genai.GenerativeModel(model_name)
                    print(f"✅ Gemini AI configured with model: {model_name}")
                else:
                    print("❌ No suitable Gemini model found")
                    
            except Exception as e:
                print(f"❌ Error configuring Gemini AI: {str(e)}")
        else:
            print("⚠️ Warning: GEMINI_API_KEY not found.")
    
    def validate_french_content(self, text):
        """Check if the text contains French language content"""
        if not self.model or not text:
            return False, "No content to analyze"
        
        try:
            validation_prompt = f"""Analyze this text and determine if it is written in French.
Text: "{text}"

Respond with ONLY JSON (no markdown):
{{"is_french": true or false, "confidence": 0-100, "detected_language": "language name", "message": "brief explanation"}}"""
            
            response = self.model.generate_content(validation_prompt)
            result_text = response.text.strip()
            
            if '```' in result_text:
                result_text = result_text.split('```')[1].replace('json', '').strip()
            
            result = json.loads(result_text)
            return result.get('is_french', False), result.get('message', 'Unknown')
        except:
            return True, "Could not validate"
    
    def generate_writing_feedback(self, prompt_title, prompt_description, user_response, difficulty_level='intermediate'):
        """Generate AI feedback for writing practice"""
        print(f"\n=== WRITING FEEDBACK ===")
        print(f"Prompt: {prompt_title}, Response length: {len(user_response)}")
        
        if not self.model:
            print("No model available")
            return self._get_fallback_feedback('writing')
        
        if not user_response or len(user_response.strip()) < 20:
            return {
                "type": "writing", "ai_generated": True, "is_valid": False,
                "error": "insufficient_content",
                "message": "Please write at least 2-3 sentences in French.",
                "overall_score": 0
            }
        
        is_french, msg = self.validate_french_content(user_response)
        if not is_french:
            return {
                "type": "writing", "ai_generated": True, "is_valid": False,
                "error": "not_french",
                "message": f"Please write in French. {msg}",
                "overall_score": 0
            }
        
        try:
            prompt = f"""You are a neutral, professional French language tutor. Analyze this student's French writing and provide structured feedback.

IMPORTANT RULES:
- Do NOT use any names (no "Sanjay", "Sophie", etc.)
- Do NOT add praise, encouragement, or motivational phrases
- All explanations MUST be in English only (no French in explanations)
- Be neutral, professional, and focused on learning
- Keep all explanations SHORT — single sentences, not paragraphs
- Prioritize errors: meaning/tense errors first, then grammar, then vocabulary, then punctuation
- ALWAYS provide a fully corrected version of the entire text
- Categorize each error by type: "grammar", "tense", "vocabulary", "punctuation", "structure", "agreement", "preposition", "pronoun"
- For each correction, provide TWO explanation fields:
  1. "brief": a SHORT one-line explanation shown by default (e.g. "pouvoir is irregular — use 'pouvez' with vous")
  2. "rule": a longer grammar rule with example (e.g. "Pouvoir conjugation: je peux, tu peux, il peut, nous pouvons, vous pouvez, ils peuvent. Example: Vous pouvez parler français.")

Prompt: {prompt_title}
Description: {prompt_description}
Level: {difficulty_level}

Student wrote: "{user_response}"

Return ONLY valid JSON (no markdown code blocks):
{{
    "overall_score": 1-10,
    "corrected_text": "The fully corrected version of the student's entire text",
    "summary": "1-2 SHORT sentences — neutral assessment only, no praise, no names",
    "strengths": ["max 2 brief strengths"],
    "areas_for_improvement": ["specific issue (brief, 1 line max)"],
    "corrections": [
        {{
            "type": "grammar|tense|vocabulary|punctuation|structure|agreement|preposition|pronoun",
            "original": "exact error from their text",
            "corrected": "fixed version",
            "brief": "Short 1-line explanation in English (always visible)",
            "rule": "Longer grammar rule with conjugation/pattern and one example sentence. In English.",
            "severity": "high|medium|low"
        }}
    ],
    "vocabulary_suggestions": [
        {{
            "used": "word they used",
            "alternative": "better word",
            "explanation": "Brief reason in English (1 line)"
        }}
    ],
    "tips": ["actionable tip in English (1 line)"]
}}

Sort corrections by severity: high (meaning/tense) first, then medium (grammar/agreement), then low (punctuation)."""

            response = self.model.generate_content(prompt)
            text = response.text.strip()
            
            if '```json' in text:
                text = text.split('```json')[1].split('```')[0].strip()
            elif '```' in text:
                text = text.split('```')[1].split('```')[0].strip()
            
            data = json.loads(text)
            data['type'] = 'writing'
            data['ai_generated'] = True
            data['is_valid'] = True
            data['original_text'] = user_response
            print("✅ Generated writing feedback")
            return data
            
        except Exception as e:
            print(f"❌ Error: {e}")
            return self._get_fallback_feedback('writing')
    
    def generate_speaking_feedback(self, prompt_title, prompt_description, transcription=None, duration=0, difficulty_level='intermediate'):
        """Generate feedback for speaking practice"""
        print(f"\n=== SPEAKING FEEDBACK ===")
        print(f"Prompt: {prompt_title}, Duration: {duration}s, Has transcription: {bool(transcription)}")
        
        if not self.model:
            return self._get_fallback_feedback('speaking')
        
        if not transcription or len(transcription.strip()) < 10:
            return {
                "type": "speaking", "ai_generated": True, "is_valid": False,
                "error": "no_transcription",
                "message": "Please write what you said in French to receive AI feedback.",
                "overall_score": 0
            }
        
        is_french, msg = self.validate_french_content(transcription)
        if not is_french:
            return {
                "type": "speaking", "ai_generated": True, "is_valid": False,
                "error": "not_french",
                "message": f"Please speak and write in French. {msg}",
                "overall_score": 0
            }
        
        try:
            prompt = f"""You are a neutral, professional French language tutor analyzing a student's spoken French (transcription provided).

IMPORTANT RULES:
- Do NOT use any names
- Do NOT add praise, encouragement, or motivational phrases
- All explanations MUST be in English only
- Be neutral, professional, and focused on learning
- Keep all explanations SHORT — single sentences, not paragraphs
- Prioritize: meaning/tense errors > grammar > vocabulary > punctuation
- ALWAYS provide a corrected version of what they said
- Categorize each error by type
- For each correction, provide TWO explanation fields:
  1. "brief": a SHORT one-line explanation shown by default
  2. "rule": a longer grammar rule with example

Prompt: {prompt_title}
Description: {prompt_description}
Level: {difficulty_level}
Duration: {duration} seconds

Student said: "{transcription}"

Return ONLY valid JSON (no markdown code blocks):
{{
    "overall_score": 1-10,
    "corrected_text": "The fully corrected version of what they said",
    "summary": "1-2 SHORT sentences — neutral assessment only, no praise, no names",
    "strengths": ["max 2 brief strengths"],
    "areas_for_improvement": ["specific area (brief)"],
    "corrections": [
        {{
            "type": "grammar|tense|vocabulary|punctuation|structure|agreement|preposition|pronoun",
            "original": "exact error from speech",
            "corrected": "fixed version",
            "brief": "Short 1-line explanation in English (always visible)",
            "rule": "Longer grammar rule with example. In English.",
            "severity": "high|medium|low"
        }}
    ],
    "pronunciation_notes": [{{"word": "word", "suggestion": "how to say it"}}],
    "fluency_assessment": "1-2 sentences about flow and naturalness",
    "tips": ["tip in English (1 line)"]
}}

Sort corrections by severity: high first."""

            response = self.model.generate_content(prompt)
            text = response.text.strip()
            
            if '```json' in text:
                text = text.split('```json')[1].split('```')[0].strip()
            elif '```' in text:
                text = text.split('```')[1].split('```')[0].strip()
            
            data = json.loads(text)
            data['type'] = 'speaking'
            data['ai_generated'] = True
            data['is_valid'] = True
            data['original_text'] = transcription
            print("✅ Generated speaking feedback")
            return data
            
        except Exception as e:
            print(f"❌ Error: {e}")
            return self._get_fallback_feedback('speaking')
    
    def generate_free_speaking_feedback(self, transcription=None, duration=0):
        """Generate comprehensive feedback for free-form speaking practice (no prompt)"""
        print(f"\n=== FREE SPEAKING FEEDBACK ===")
        print(f"Duration: {duration}s, Transcription length: {len(transcription or '')}")
        
        if not self.model:
            return self._get_fallback_feedback('free-speaking')
        
        if not transcription or len(transcription.strip()) < 10:
            return {
                "type": "free-speaking", "ai_generated": True, "is_valid": False,
                "error": "no_transcription",
                "message": "Please speak in French to receive AI feedback.",
                "overall_score": 0
            }
        
        is_french, msg = self.validate_french_content(transcription)
        if not is_french:
            return {
                "type": "free-speaking", "ai_generated": True, "is_valid": False,
                "error": "not_french",
                "message": f"Only French language is accepted. {msg}",
                "overall_score": 0
            }
        
        try:
            prompt = f"""You are a neutral, professional French language tutor. A student spoke freely in French (no specific topic). Analyze their speech.

IMPORTANT RULES:
- Do NOT use any names
- Do NOT add praise, encouragement, or motivational phrases
- All explanations MUST be in English only
- Be neutral, professional, and focused on learning
- Keep all explanations SHORT — single sentences, not paragraphs
- Prioritize: meaning/tense errors > grammar > vocabulary > punctuation
- ALWAYS provide a corrected version of what they said
- Categorize each error by type
- For each correction, provide TWO explanation fields:
  1. "brief": a SHORT one-line explanation shown by default
  2. "rule": a longer grammar rule with example

Duration: {duration} seconds

Student said: "{transcription}"

Return ONLY valid JSON (no markdown code blocks):
{{
    "overall_score": 1-10,
    "corrected_text": "The fully corrected version of what they said",
    "summary": "1-2 SHORT sentences — neutral assessment only, no praise, no names",
    "strengths": ["max 2 brief strengths"],
    "areas_for_improvement": ["specific area with example (brief)"],
    "corrections": [
        {{
            "type": "grammar|tense|vocabulary|punctuation|structure|agreement|preposition|pronoun",
            "original": "exact error from speech",
            "corrected": "fixed version",
            "brief": "Short 1-line explanation in English (always visible)",
            "rule": "Longer grammar rule with example. In English.",
            "severity": "high|medium|low"
        }}
    ],
    "vocabulary_suggestions": [
        {{
            "used": "word used",
            "alternative": "better word",
            "explanation": "brief reason in English"
        }}
    ],
    "fluency_assessment": "1-2 sentences about flow and naturalness",
    "pronunciation_notes": [{{"word": "word", "suggestion": "how to say it"}}],
    "tips": ["actionable tip in English (1 line)"]
}}

Sort corrections by severity: high first."""

            response = self.model.generate_content(prompt)
            text = response.text.strip()
            
            if '```json' in text:
                text = text.split('```json')[1].split('```')[0].strip()
            elif '```' in text:
                text = text.split('```')[1].split('```')[0].strip()
            
            data = json.loads(text)
            data['type'] = 'free-speaking'
            data['ai_generated'] = True
            data['is_valid'] = True
            data['original_text'] = transcription
            print("✅ Generated free speaking feedback")
            return data
            
        except Exception as e:
            print(f"❌ Error: {e}")
            return self._get_fallback_feedback('free-speaking')
    
    def _get_fallback_feedback(self, practice_type):
        return {
            "type": practice_type,
            "ai_generated": False,
            "is_valid": True,
            "overall_score": None,
            "corrected_text": "",
            "summary": "AI feedback temporarily unavailable.",
            "strengths": ["Exercise completed"],
            "areas_for_improvement": ["Try again later for AI feedback"],
            "corrections": [],
            "tips": ["Keep practicing"],
        }

ai_feedback_service = AIFeedbackService()
