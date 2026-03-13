/**
 * useFrenchSpeechRecognition — A robust, production-grade hook for continuous
 * French speech-to-text using the Web Speech API (desktop) or server-side
 * transcription polling (mobile).
 *
 * KEY DESIGN DECISIONS:
 * 1. Creates a FRESH SpeechRecognition instance on every restart cycle.
 *    Mobile Chrome corrupts reused instances after onend fires, causing
 *    subsequent .start() calls to silently fail or throw.
 * 2. Uses a state-machine approach (IDLE → STARTING → LISTENING → STOPPING)
 *    to prevent double-start / double-stop InvalidStateError crashes.
 * 3. Exponential back-off on rapid restarts prevents CPU-starving restart loops.
 * 4. All transcript accumulation happens via refs, not via React state setters
 *    inside callbacks (which suffer from stale closures and batching).
 * 5. Interim text is flushed before every restart and on explicit stop, so no
 *    words are ever silently dropped between recognition sessions.
 * 6. Tracks confidence scores for pronunciation quality scoring.
 * 7. Calculates fluency (words per minute) from word count and elapsed time.
 * 8. MOBILE: Instead of using the buggy browser Speech API, polls the server
 *    every ~7 seconds with the accumulated audio for near-real-time
 *    transcription via Gemini AI. This avoids the error popups entirely.
 */

import { useState, useRef, useCallback, useEffect } from 'react';

// State machine states
const STATE = {
    IDLE: 'IDLE',
    STARTING: 'STARTING',
    LISTENING: 'LISTENING',
    STOPPING: 'STOPPING',
};

// ─── Mobile detection ────────────────────────────────────────────
function isMobileDevice() {
    if (typeof navigator === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
    ) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
}

// ─── Mobile polling interval (ms) ────────────────────────────────
const MOBILE_POLL_INTERVAL = 3000; // Send audio to server every 3 seconds

export default function useFrenchSpeechRecognition() {
    // ─── Public state ───────────────────────────────────────────────
    const [transcription, setTranscription] = useState('');
    const [interimText, setInterimText] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [pronunciationScore, setPronunciationScore] = useState(0);
    const [fluencyScore, setFluencyScore] = useState(0);
    const [wordCount, setWordCount] = useState(0);

    // ─── Internal refs ──────────────────────────────────────────────
    const recognitionRef = useRef(null);
    const stateRef = useRef(STATE.IDLE);
    const transcriptionRef = useRef('');
    const interimRef = useRef('');
    const activeRef = useRef(false);          // true while user wants recording
    const restartTimerRef = useRef(null);
    const backoffRef = useRef(50);            // current restart delay (ms)
    const lastResultTimeRef = useRef(0);      // for adaptive back-off
    const langRef = useRef('fr-FR');          // active language code
    const isMobileRef = useRef(false);        // mobile device flag
    const watchdogRef = useRef(null);         // mobile watchdog timer
    const startAttemptTimeRef = useRef(0);    // to detect instant-end on mobile
    const langTriedRef = useRef(new Set());   // track which lang codes were tried

    // ─── Pronunciation & Fluency tracking refs ──────────────────────
    const confidenceScoresRef = useRef([]);   // array of confidence values
    const startTimeRef = useRef(null);        // when recording started
    const wordCountRef = useRef(0);           // total words recognized

    // ─── Mobile server transcription refs ───────────────────────────
    const mobilePollingRef = useRef(null);       // polling interval ID
    const mobileMediaRecorderRef = useRef(null); // separate MediaRecorder for chunking
    const mobileStreamRef = useRef(null);        // the audio stream for mobile
    const mobileChunksRef = useRef([]);          // accumulated audio chunks
    const mobileTranscribingRef = useRef(false); // prevent concurrent requests
    const mobileApiUrlRef = useRef('');           // API base URL

    // ─── Detect support on mount ────────────────────────────────────
    useEffect(() => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        const mobile = isMobileDevice();
        isMobileRef.current = mobile;
        setIsMobile(mobile);

        // On mobile, speech IS supported via server-side transcription
        // On desktop, requires browser Speech API
        if (mobile) {
            setSpeechSupported(true); // Mobile uses server-side transcription
            console.log('📱 Mobile device detected — will use server-side live transcription');
        } else {
            setSpeechSupported(!!SR);
        }

        // Detect API URL from meta tag or environment
        // Components should call setApiUrl() to configure this
    }, []);

    // ─── Helpers ────────────────────────────────────────────────────

    /** Push interimRef contents into the final transcription ref + state */
    const flushInterim = useCallback(() => {
        const pending = interimRef.current?.trim();
        if (pending) {
            transcriptionRef.current += pending + ' ';
            setTranscription(transcriptionRef.current);
            console.log('📝 Flushed interim →', pending);
        }
        interimRef.current = '';
        setInterimText('');
    }, []);

    /** Stop the mobile watchdog timer */
    const clearWatchdog = useCallback(() => {
        if (watchdogRef.current) {
            clearInterval(watchdogRef.current);
            watchdogRef.current = null;
        }
    }, []);

    /** Destroy the current recognition instance cleanly */
    const destroyRecognition = useCallback(() => {
        clearWatchdog();
        const r = recognitionRef.current;
        if (r) {
            // Remove all listeners so old instances don't fire ghost events
            r.onresult = null;
            r.onerror = null;
            r.onend = null;
            r.onstart = null;
            r.onaudiostart = null;
            r.onaudioend = null;
            r.onspeechstart = null;
            r.onspeechend = null;
            try { r.abort(); } catch (_) { /* ignore */ }
            recognitionRef.current = null;
        }
    }, [clearWatchdog]);

    // ─── Mobile Server-Side Transcription ───────────────────────────

    /** Send accumulated audio chunks to server for transcription */
    const sendAudioToServer = useCallback(async () => {
        if (mobileTranscribingRef.current) return; // Don't overlap requests
        if (mobileChunksRef.current.length === 0) return;

        const apiUrl = mobileApiUrlRef.current;
        if (!apiUrl) {
            console.warn('📱 No API URL configured for mobile transcription');
            return;
        }

        mobileTranscribingRef.current = true;

        try {
            // Create a blob from ALL accumulated chunks (full audio so far)
            const audioBlob = new Blob(mobileChunksRef.current, { type: 'audio/webm' });

            // Skip if too small (just noise/silence)
            if (audioBlob.size < 2000) {
                mobileTranscribingRef.current = false;
                return;
            }

            console.log(`📱 Sending ${audioBlob.size} bytes to server for live transcription...`);

            const formData = new FormData();
            formData.append('audio', audioBlob, 'live-chunk.webm');

            const response = await fetch(`${apiUrl}/api/feedback/transcribe-live`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success && result.transcription && result.transcription.trim()) {
                const serverText = result.transcription.trim();
                console.log('📱 ✅ Server transcription:', serverText);

                // Replace entire transcription with the server's version
                // (server always transcribes the FULL audio, so it's the latest)
                transcriptionRef.current = serverText + ' ';
                setTranscription(transcriptionRef.current);
                interimRef.current = '';
                setInterimText('');

                // Update word count
                const words = serverText.split(/\s+/).filter(Boolean);
                wordCountRef.current = words.length;
                setWordCount(words.length);

                // Calculate fluency score
                if (startTimeRef.current) {
                    const elapsedMinutes = (Date.now() - startTimeRef.current) / 60000;
                    if (elapsedMinutes > 0.05) {
                        const wpm = Math.round(words.length / elapsedMinutes);
                        const normalized = Math.min(100, Math.round((wpm / 130) * 100));
                        setFluencyScore(normalized);
                    }
                }
            } else if (result.success && !result.transcription) {
                // Server returned empty — might be silence, show interim indicator
                if (activeRef.current) {
                    setInterimText('(listening...)');
                }
            }
        } catch (err) {
            console.warn('📱 Live transcription request failed:', err.message);
            // Don't show error to user — just skip this polling cycle
        } finally {
            mobileTranscribingRef.current = false;
        }
    }, []);

    /** Start mobile server-side polling */
    const startMobilePolling = useCallback((stream) => {
        console.log('📱 Starting mobile server-side transcription polling');

        // CRITICAL: Clone the stream tracks so the hook's MediaRecorder
        // doesn't conflict with the component's MediaRecorder on the same stream.
        // On mobile, sharing a stream between two MediaRecorders can cause
        // one or both to fail silently.
        const clonedStream = new MediaStream(
            stream.getAudioTracks().map(track => track.clone())
        );
        mobileStreamRef.current = clonedStream;
        mobileChunksRef.current = [];
        mobileTranscribingRef.current = false;

        // Create a MediaRecorder on the CLONED stream
        try {
            const recorder = new MediaRecorder(clonedStream, {
                mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                    ? 'audio/webm;codecs=opus'
                    : 'audio/webm'
            });
            mobileMediaRecorderRef.current = recorder;

            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    mobileChunksRef.current.push(e.data);
                }
            };

            // Start recording with timeslice to get data periodically
            recorder.start(1000); // Get data every 1 second

            // Show "listening" indicator immediately
            setInterimText('(listening...)');

            // Poll server every MOBILE_POLL_INTERVAL ms
            mobilePollingRef.current = setInterval(() => {
                if (activeRef.current) {
                    sendAudioToServer();
                }
            }, MOBILE_POLL_INTERVAL);

        } catch (err) {
            console.error('📱 Failed to create MediaRecorder for polling:', err);
        }
    }, [sendAudioToServer]);

    /** Stop mobile polling and cleanup */
    const stopMobilePolling = useCallback(async () => {
        console.log('📱 Stopping mobile polling');

        // Stop polling interval
        if (mobilePollingRef.current) {
            clearInterval(mobilePollingRef.current);
            mobilePollingRef.current = null;
        }

        // Stop the MediaRecorder
        if (mobileMediaRecorderRef.current && mobileMediaRecorderRef.current.state !== 'inactive') {
            try {
                mobileMediaRecorderRef.current.stop();
            } catch (_) { /* ignore */ }
        }
        mobileMediaRecorderRef.current = null;

        // Stop the cloned stream tracks (cleanup)
        if (mobileStreamRef.current) {
            mobileStreamRef.current.getTracks().forEach(track => {
                try { track.stop(); } catch (_) { /* ignore */ }
            });
            mobileStreamRef.current = null;
        }

        // Do one final transcription with all accumulated audio
        if (mobileChunksRef.current.length > 0 && !mobileTranscribingRef.current) {
            setInterimText('(finalizing...)');
            await sendAudioToServer();
            setInterimText('');
        }

        mobileChunksRef.current = [];
        mobileTranscribingRef.current = false;
    }, [sendAudioToServer]);

    /** Start mobile watchdog — detects if recognition silently dies */
    const startWatchdog = useCallback(() => {
        clearWatchdog();
        if (!isMobileRef.current) return;

        // On mobile, check every 8 seconds if recognition is alive
        // If no results received for 10+ seconds while active, force restart
        watchdogRef.current = setInterval(() => {
            if (!activeRef.current) {
                clearWatchdog();
                return;
            }

            const timeSinceLastResult = Date.now() - lastResultTimeRef.current;
            const timeSinceStart = Date.now() - startAttemptTimeRef.current;

            // If more than 10s since last result AND we've been running for >5s
            // This means mobile recognition silently died
            if (timeSinceStart > 5000 && timeSinceLastResult > 10000 && lastResultTimeRef.current > 0) {
                console.log('📱🔄 Watchdog: No results for 10s, forcing restart');
                destroyRecognition();
                stateRef.current = STATE.IDLE;
                scheduleRestart();
            }
        }, 8000);
    }, [clearWatchdog, destroyRecognition]);

    /** Create a fresh SpeechRecognition instance with all handlers wired up */
    const createRecognition = useCallback(() => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return null;

        const recognition = new SR();
        const mobile = isMobileRef.current;

        // ── CRITICAL MOBILE FIX ──
        // Mobile Chrome does NOT reliably support continuous mode.
        // On mobile, we use continuous=false and restart after each result.
        // On desktop, continuous=true works fine.
        recognition.continuous = !mobile;
        recognition.interimResults = true;
        recognition.maxAlternatives = mobile ? 1 : 3;
        recognition.lang = langRef.current;

        if (mobile) {
            console.log('📱 Creating mobile recognition (continuous=false, lang=' + langRef.current + ')');
        }

        // ── onstart ──────────────────────────────────────────────
        recognition.onstart = () => {
            stateRef.current = STATE.LISTENING;
            setIsListening(true);
            startAttemptTimeRef.current = Date.now();
            console.log('🟢 Recognition started (lang:', langRef.current, ', mobile:', mobile, ')');
        };

        // ── onaudiostart ─────────────────────────────────────────
        recognition.onaudiostart = () => {
            // Reset back-off once we successfully start receiving audio
            backoffRef.current = mobile ? 100 : 50;
        };

        // ── onspeechstart (mobile debug) ─────────────────────────
        recognition.onspeechstart = () => {
            console.log('🗣️ Speech detected by browser');
        };

        // ── onresult ─────────────────────────────────────────────
        recognition.onresult = (event) => {
            lastResultTimeRef.current = Date.now();
            let finalChunk = '';
            let interimChunk = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                // Pick the highest-confidence alternative
                let best = event.results[i][0].transcript;
                let bestConf = event.results[i][0].confidence || 0;
                for (let j = 1; j < event.results[i].length; j++) {
                    const alt = event.results[i][j];
                    if ((alt.confidence || 0) > bestConf) {
                        best = alt.transcript;
                        bestConf = alt.confidence;
                    }
                }

                if (event.results[i].isFinal) {
                    finalChunk += best + ' ';
                    // Track confidence for pronunciation scoring
                    if (bestConf > 0) {
                        confidenceScoresRef.current.push(bestConf);
                    }
                } else {
                    interimChunk += best;
                }
            }

            // Update interim ref (always overwrite — it's the latest partial)
            interimRef.current = interimChunk;
            setInterimText(interimChunk);

            if (finalChunk) {
                // We got final text — clear interim since it became final
                interimRef.current = '';
                setInterimText('');
                transcriptionRef.current += finalChunk;
                setTranscription(transcriptionRef.current);

                // Update word count
                const words = transcriptionRef.current.trim().split(/\s+/).filter(Boolean);
                wordCountRef.current = words.length;
                setWordCount(words.length);

                // Calculate pronunciation score (average confidence × 100)
                const scores = confidenceScoresRef.current;
                if (scores.length > 0) {
                    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
                    setPronunciationScore(Math.round(avg * 100));
                }

                // Calculate fluency score (words per minute)
                if (startTimeRef.current) {
                    const elapsedMinutes = (Date.now() - startTimeRef.current) / 60000;
                    if (elapsedMinutes > 0.05) { // At least 3 seconds
                        const wpm = Math.round(words.length / elapsedMinutes);
                        const normalized = Math.min(100, Math.round((wpm / 130) * 100));
                        setFluencyScore(normalized);
                    }
                }

                console.log('✅ Final:', finalChunk.trim());

                // ── MOBILE FIX: If on mobile and recognition ended after final result,
                // we need to restart quickly since continuous=false
                if (mobile && activeRef.current) {
                    // Reset backoff since we got a good result
                    backoffRef.current = 100;
                }
            }
        };

        // ── onerror ──────────────────────────────────────────────
        recognition.onerror = (event) => {
            console.warn('⚠️ SpeechRecognition error:', event.error, '(mobile:', mobile, ')');

            if (event.error === 'not-allowed') {
                activeRef.current = false;
                stateRef.current = STATE.IDLE;
                setIsListening(false);
                clearWatchdog();
                alert('Microphone access was denied. Please allow microphone access in your browser settings and try again.');
                return;
            }

            if (event.error === 'language-not-supported') {
                // Fallback chain: fr-FR → fr → en-US (last resort for testing)
                if (langRef.current === 'fr-FR') {
                    langRef.current = 'fr';
                    langTriedRef.current.add('fr-FR');
                    console.log('🔃 Language fallback → fr');
                } else if (langRef.current === 'fr' && !langTriedRef.current.has('fr-FR')) {
                    langRef.current = 'fr-FR';
                    langTriedRef.current.add('fr');
                    console.log('🔃 Language fallback → fr-FR');
                }
            }

            // 'no-speech' error — very common on mobile, just restart
            if (event.error === 'no-speech') {
                console.log('📱 No speech error — will restart via onend');
                // Don't increase backoff for no-speech on mobile
                if (mobile) {
                    backoffRef.current = 150;
                }
                return;
            }

            // 'aborted' fires when we programmatically call .abort() — ignore it
            if (event.error === 'aborted') return;

            // 'network' error — common on mobile when Google's speech server is unreachable
            if (event.error === 'network') {
                console.warn('📱 Network error — speech recognition requires internet');
                if (mobile) {
                    backoffRef.current = 500; // Wait longer before retry
                }
            }

            // For audio-capture, service-not-allowed, etc.
            // The onend handler will fire next and handle the restart.
        };

        // ── onend ────────────────────────────────────────────────
        recognition.onend = () => {
            const timeSinceStart = Date.now() - startAttemptTimeRef.current;
            console.log('🔴 Recognition ended. active:', activeRef.current,
                'state:', stateRef.current, 'duration:', timeSinceStart + 'ms',
                'mobile:', mobile);
            stateRef.current = STATE.IDLE;

            if (activeRef.current) {
                // ── MOBILE FIX: If recognition ended almost immediately (<500ms),
                // it means the browser killed the session before we could speak.
                // Use a longer delay before restart to avoid rapid loops.
                if (mobile && timeSinceStart < 500) {
                    console.log('📱 Instant-end detected — using longer restart delay');
                    backoffRef.current = Math.max(backoffRef.current, 300);
                }

                // Flush any leftover interim text before restarting
                flushInterim();
                scheduleRestart();
            } else {
                setIsListening(false);
            }
        };

        return recognition;
    }, [flushInterim, clearWatchdog]);

    /** Schedule a restart with adaptive back-off */
    const scheduleRestart = useCallback(() => {
        if (restartTimerRef.current) {
            clearTimeout(restartTimerRef.current);
        }

        const mobile = isMobileRef.current;
        const delay = backoffRef.current;

        // Increase back-off for next time
        // Mobile: cap at 3s (more network issues), Desktop: cap at 2s
        const maxBackoff = mobile ? 3000 : 2000;
        backoffRef.current = Math.min(backoffRef.current * 1.5, maxBackoff);

        console.log(`⏱️ Scheduling restart in ${delay}ms (mobile: ${mobile})`);

        restartTimerRef.current = setTimeout(() => {
            if (!activeRef.current) return;
            if (stateRef.current !== STATE.IDLE) {
                console.log('⏭️ Skipping restart — state is', stateRef.current);
                return;
            }

            // Destroy old instance and create fresh one
            destroyRecognition();
            const newRec = createRecognition();
            if (!newRec) return;
            recognitionRef.current = newRec;

            stateRef.current = STATE.STARTING;
            startAttemptTimeRef.current = Date.now();
            try {
                newRec.start();
                console.log('🔄 Recognition restarted');
                // Start watchdog on mobile
                if (mobile) startWatchdog();
            } catch (e) {
                console.error('❌ Restart failed:', e.message);
                stateRef.current = STATE.IDLE;
                // Try again with longer delay
                if (activeRef.current) scheduleRestart();
            }
        }, delay);
    }, [createRecognition, destroyRecognition, startWatchdog]);

    // ─── Public API ─────────────────────────────────────────────────

    /** Set the API URL for mobile server-side transcription */
    const setApiUrl = useCallback((url) => {
        mobileApiUrlRef.current = url;
    }, []);

    /** Start speech recognition — call this when user presses record */
    const startListening = useCallback((audioStream) => {
        // ── MOBILE: Use server-side transcription polling ──
        if (isMobileRef.current) {
            console.log('📱 Mobile detected — starting server-side live transcription polling');
            // Reset state
            transcriptionRef.current = '';
            interimRef.current = '';
            setTranscription('');
            setInterimText('');
            confidenceScoresRef.current = [];
            startTimeRef.current = Date.now();
            wordCountRef.current = 0;
            setPronunciationScore(0);
            setFluencyScore(0);
            setWordCount(0);
            activeRef.current = true;
            setIsListening(true);

            // Start polling with the provided audio stream
            if (audioStream) {
                startMobilePolling(audioStream);
            }
            return;
        }

        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return;

        // Reset state
        transcriptionRef.current = '';
        interimRef.current = '';
        setTranscription('');
        setInterimText('');
        backoffRef.current = 50;
        lastResultTimeRef.current = 0;
        activeRef.current = true;
        langTriedRef.current.clear();
        langRef.current = 'fr-FR';

        // Reset pronunciation & fluency tracking
        confidenceScoresRef.current = [];
        startTimeRef.current = Date.now();
        wordCountRef.current = 0;
        setPronunciationScore(0);
        setFluencyScore(0);
        setWordCount(0);

        // Destroy any leftover instance
        destroyRecognition();

        // Create fresh instance
        const rec = createRecognition();
        if (!rec) return;
        recognitionRef.current = rec;

        stateRef.current = STATE.STARTING;
        startAttemptTimeRef.current = Date.now();
        try {
            rec.start();
        } catch (e) {
            console.error('Start failed:', e.message);
            stateRef.current = STATE.IDLE;
            scheduleRestart();
        }
    }, [createRecognition, destroyRecognition, scheduleRestart, startMobilePolling]);

    /** Stop speech recognition — call this when user presses stop */
    const stopListening = useCallback(async () => {
        activeRef.current = false;

        // ── MOBILE: Stop server polling ──
        if (isMobileRef.current) {
            await stopMobilePolling();
            setIsListening(false);
            return;
        }

        // Cancel any pending restart
        if (restartTimerRef.current) {
            clearTimeout(restartTimerRef.current);
            restartTimerRef.current = null;
        }

        // Stop watchdog
        clearWatchdog();

        // Flush interim text into final transcription
        flushInterim();

        // Stop the recognition
        const r = recognitionRef.current;
        if (r) {
            stateRef.current = STATE.STOPPING;
            try { r.stop(); } catch (_) { /* ignore */ }
        } else {
            stateRef.current = STATE.IDLE;
        }

        setIsListening(false);
    }, [flushInterim, clearWatchdog, stopMobilePolling]);

    /** Reset everything — call this when user deletes recording or starts fresh */
    const resetTranscription = useCallback(() => {
        transcriptionRef.current = '';
        interimRef.current = '';
        setTranscription('');
        setInterimText('');
        confidenceScoresRef.current = [];
        startTimeRef.current = null;
        wordCountRef.current = 0;
        setPronunciationScore(0);
        setFluencyScore(0);
        setWordCount(0);
    }, []);

    /** Get the current final transcription (from ref, bypass stale state) */
    const getTranscription = useCallback(() => {
        return transcriptionRef.current;
    }, []);

    // ─── Cleanup on unmount ─────────────────────────────────────────
    useEffect(() => {
        return () => {
            activeRef.current = false;
            if (restartTimerRef.current) {
                clearTimeout(restartTimerRef.current);
            }
            if (mobilePollingRef.current) {
                clearInterval(mobilePollingRef.current);
            }
            clearWatchdog();
            destroyRecognition();
        };
    }, [destroyRecognition, clearWatchdog]);

    return {
        // State
        transcription,
        interimText,
        isListening,
        speechSupported,
        isMobile,
        // Scores
        pronunciationScore,
        fluencyScore,
        wordCount,
        // Actions
        startListening,
        stopListening,
        resetTranscription,
        getTranscription,
        setApiUrl,
    };
}
