import os
import json
import tempfile
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
    
    def transcribe_audio(self, audio_data, mime_type='audio/webm'):
        """Transcribe audio using Gemini's multimodal capabilities.
        Works on ALL devices — no browser speech API needed.
        
        Args:
            audio_data: Raw audio bytes
            mime_type: MIME type of the audio (audio/webm, audio/mp4, audio/wav, etc.)
        
        Returns:
            dict: { 'success': bool, 'transcription': str, 'language': str, 'is_french': bool }
        """
        print(f"\n=== AUDIO TRANSCRIPTION ===")
        print(f"Audio size: {len(audio_data)} bytes, MIME: {mime_type}")
        
        if not self.model:
            print("❌ No model available for transcription")
            return {
                'success': False,
                'transcription': '',
                'language': 'unknown',
                'is_french': False,
                'error': 'AI model not available'
            }
        
        if not audio_data or len(audio_data) < 1000:
            return {
                'success': False,
                'transcription': '',
                'language': 'unknown',
                'is_french': False,
                'error': 'Audio too short or empty'
            }
        
        # Determine file extension from MIME type
        ext_map = {
            'audio/webm': '.webm',
            'audio/mp4': '.mp4',
            'audio/m4a': '.m4a',
            'audio/mpeg': '.mp3',
            'audio/mp3': '.mp3',
            'audio/wav': '.wav',
            'audio/wave': '.wav',
            'audio/ogg': '.ogg',
            'audio/x-wav': '.wav',
            'audio/aac': '.aac',
        }
        # Get extension, default to .webm
        ext = ext_map.get(mime_type.split(';')[0].strip().lower(), '.webm')
        
        temp_path = None
        uploaded_file = None
        
        try:
            # Save audio to temporary file
            with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
                tmp.write(audio_data)
                temp_path = tmp.name
            
            print(f"📁 Saved temp audio: {temp_path} ({ext})")
            
            # Upload to Gemini
            uploaded_file = genai.upload_file(temp_path, mime_type=mime_type.split(';')[0].strip())
            print(f"☁️ Uploaded to Gemini: {uploaded_file.name}")
            
            # Wait for file to be processed
            import time
            max_wait = 30  # seconds
            waited = 0
            while uploaded_file.state.name == "PROCESSING" and waited < max_wait:
                time.sleep(1)
                waited += 1
                uploaded_file = genai.get_file(uploaded_file.name)
            
            if uploaded_file.state.name == "FAILED":
                return {
                    'success': False,
                    'transcription': '',
                    'language': 'unknown',
                    'is_french': False,
                    'error': 'Audio processing failed'
                }
            
            # Ask Gemini to transcribe
            transcription_prompt = """Listen to this audio carefully and transcribe EXACTLY what is said.

RULES:
1. Transcribe the spoken words EXACTLY as heard
2. If the speech is in French, write the French text
3. If no speech is detected, respond with empty transcription
4. Do NOT translate — keep the original language
5. Do NOT add any commentary or explanation

Respond with ONLY valid JSON (no markdown code blocks):
{"transcription": "the exact spoken text here", "language": "fr or en or other language code", "is_french": true or false, "confidence": 0-100}"""

            response = self.model.generate_content([uploaded_file, transcription_prompt])
            text = response.text.strip()
            
            # Parse JSON response
            if '```json' in text:
                text = text.split('```json')[1].split('```')[0].strip()
            elif '```' in text:
                text = text.split('```')[1].split('```')[0].strip()
            
            result = json.loads(text)
            
            transcription = result.get('transcription', '').strip()
            is_french = result.get('is_french', False)
            language = result.get('language', 'unknown')
            confidence = result.get('confidence', 0)
            
            print(f"✅ Transcription: '{transcription[:100]}...' (lang={language}, french={is_french}, conf={confidence})")
            
            return {
                'success': True,
                'transcription': transcription,
                'language': language,
                'is_french': is_french,
                'confidence': confidence
            }
            
        except json.JSONDecodeError as e:
            print(f"❌ JSON parse error: {e}")
            # Try to extract text even if JSON parsing fails
            try:
                response_text = response.text.strip()
                # Maybe Gemini just returned the transcription as plain text
                return {
                    'success': True,
                    'transcription': response_text,
                    'language': 'fr',
                    'is_french': True,
                    'confidence': 50
                }
            except:
                return {
                    'success': False,
                    'transcription': '',
                    'language': 'unknown',
                    'is_french': False,
                    'error': 'Failed to parse transcription result'
                }
        except Exception as e:
            print(f"❌ Transcription error: {str(e)}")
            return {
                'success': False,
                'transcription': '',
                'language': 'unknown',
                'is_french': False,
                'error': str(e)
            }
        finally:
            # Cleanup: delete temp file and uploaded file
            if temp_path:
                try:
                    os.unlink(temp_path)
                except:
                    pass
            if uploaded_file:
                try:
                    genai.delete_file(uploaded_file.name)
                except:
                    pass
    
    def transcribe_and_feedback(self, audio_data, mime_type='audio/webm', duration=0):
        """Combined: Transcribe audio + generate feedback in one flow.
        Most efficient approach — handles everything server-side.
        
        Returns:
            dict: Combined transcription + feedback result
        """
        print(f"\n=== TRANSCRIBE + FEEDBACK ===")
        
        # Step 1: Transcribe
        transcription_result = self.transcribe_audio(audio_data, mime_type)
        
        if not transcription_result['success']:
            return {
                'type': 'free-speaking',
                'ai_generated': True,
                'is_valid': False,
                'error': transcription_result.get('error', 'transcription_failed'),
                'message': 'Could not transcribe your audio. Please try again and speak clearly.',
                'overall_score': 0,
                'transcription': ''
            }
        
        transcription = transcription_result['transcription']
        
        if not transcription or len(transcription.strip()) < 5:
            return {
                'type': 'free-speaking',
                'ai_generated': True,
                'is_valid': False,
                'error': 'no_speech',
                'message': 'No speech was detected in the audio. Please speak clearly in French.',
                'overall_score': 0,
                'transcription': ''
            }
        
        if not transcription_result.get('is_french', False):
            return {
                'type': 'free-speaking',
                'ai_generated': True,
                'is_valid': False,
                'error': 'not_french',
                'message': f"Please speak in French. Detected language: {transcription_result.get('language', 'unknown')}",
                'overall_score': 0,
                'transcription': transcription
            }
        
        # Step 2: Generate feedback on the transcription
        feedback = self.generate_free_speaking_feedback(
            transcription=transcription,
            duration=duration
        )
        
        # Add transcription to feedback
        feedback['transcription'] = transcription
        feedback['transcription_confidence'] = transcription_result.get('confidence', 0)
        feedback['server_transcribed'] = True
        
        return feedback
    
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
