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
            prompt = f"""You are an expert French tutor. Analyze this student's French writing.

Prompt: {prompt_title}
Description: {prompt_description}
Level: {difficulty_level}

Student wrote: "{user_response}"

Provide specific, personalized feedback. Return ONLY JSON (no markdown):
{{
    "overall_score": 1-10,
    "summary": "2-3 sentences about their specific writing",
    "strengths": ["specific strength with quote", "another strength"],
    "areas_for_improvement": ["specific issue with quote", "another issue"],
    "grammar_corrections": [{{"original": "error from text", "corrected": "fixed version", "explanation": "why"}}],
    "vocabulary_suggestions": [{{"used": "word they used", "alternative": "better word", "explanation": "why better"}}],
    "tips": ["tip 1", "tip 2"],
    "encouragement": "personalized message"
}}"""

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
            prompt = f"""You are an expert French tutor analyzing a student's spoken French (transcription provided).

Prompt: {prompt_title}
Description: {prompt_description}
Level: {difficulty_level}
Duration: {duration} seconds

Student said: "{transcription}"

Provide specific feedback. Return ONLY JSON:
{{
    "overall_score": 1-10,
    "summary": "2-3 sentences about their speech",
    "strengths": ["strength 1", "strength 2"],
    "areas_for_improvement": ["area 1", "area 2"],
    "pronunciation_notes": [{{"word": "difficult word", "suggestion": "how to say it"}}],
    "fluency_assessment": "assessment of flow",
    "grammar_notes": ["grammar point from their speech"],
    "tips": ["tip 1", "tip 2"],
    "encouragement": "personalized message"
}}"""

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
            prompt = f"""You are an expert French language tutor. A student has spoken freely in French (no specific topic/prompt was given). Analyze their speech thoroughly.

Duration: {duration} seconds

Student said: "{transcription}"

Analyze their speech comprehensively and provide detailed, specific feedback. Return ONLY valid JSON (no markdown code blocks):
{{
    "overall_score": 1-10,
    "summary": "2-3 sentences overall assessment of their French speaking ability based on this sample",
    "strengths": ["specific positive point with quote from their speech", "another strength"],
    "areas_for_improvement": ["specific area needing work with example from speech", "another area"],
    "vocabulary_suggestions": [
        {{"used": "word they used", "alternative": "better/more natural word", "explanation": "why the alternative is better"}},
        {{"used": "another word", "alternative": "better option", "explanation": "context"}}
    ],
    "fluency_assessment": "detailed assessment of their speaking flow, naturalness, and fluency level",
    "grammar_corrections": [
        {{"original": "exact error from their speech", "corrected": "correct version", "explanation": "grammar rule explanation"}},
        {{"original": "another error", "corrected": "fixed version", "explanation": "why"}}
    ],
    "pronunciation_notes": [
        {{"word": "word that may be mispronounced", "suggestion": "correct pronunciation guide"}}
    ],
    "tips": ["specific actionable tip to improve", "another tip"],
    "encouragement": "personalized encouraging message based on their level"
}}"""

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
            "summary": "AI feedback temporarily unavailable.",
            "strengths": ["You completed the exercise"],
            "areas_for_improvement": ["Try again later for AI feedback"],
            "tips": ["Keep practicing"],
            "encouragement": "Thank you for practicing!"
        }

ai_feedback_service = AIFeedbackService()
