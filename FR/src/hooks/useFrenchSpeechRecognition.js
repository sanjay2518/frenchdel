/**
 * useFrenchSpeechRecognition — A robust, production-grade hook for continuous
 * French speech-to-text using the Web Speech API.
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
 */

import { useState, useRef, useCallback, useEffect } from 'react';

// State machine states
const STATE = {
    IDLE: 'IDLE',
    STARTING: 'STARTING',
    LISTENING: 'LISTENING',
    STOPPING: 'STOPPING',
};

export default function useFrenchSpeechRecognition() {
    // ─── Public state ───────────────────────────────────────────────
    const [transcription, setTranscription] = useState('');
    const [interimText, setInterimText] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(false);

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

    // ─── Detect support on mount ────────────────────────────────────
    useEffect(() => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        setSpeechSupported(!!SR);
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

    /** Destroy the current recognition instance cleanly */
    const destroyRecognition = useCallback(() => {
        const r = recognitionRef.current;
        if (r) {
            // Remove all listeners so old instances don't fire ghost events
            r.onresult = null;
            r.onerror = null;
            r.onend = null;
            r.onstart = null;
            r.onaudiostart = null;
            r.onaudioend = null;
            try { r.abort(); } catch (_) { /* ignore */ }
            recognitionRef.current = null;
        }
    }, []);

    /** Create a fresh SpeechRecognition instance with all handlers wired up */
    const createRecognition = useCallback(() => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return null;

        const recognition = new SR();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 3;
        recognition.lang = langRef.current;

        // ── onstart ──────────────────────────────────────────────
        recognition.onstart = () => {
            stateRef.current = STATE.LISTENING;
            setIsListening(true);
            console.log('🟢 Recognition started (lang:', langRef.current, ')');
        };

        // ── onaudiostart ─────────────────────────────────────────
        recognition.onaudiostart = () => {
            // Reset back-off once we successfully start receiving audio
            backoffRef.current = 50;
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
                console.log('✅ Final:', finalChunk.trim());
            }
        };

        // ── onerror ──────────────────────────────────────────────
        recognition.onerror = (event) => {
            console.warn('⚠️ SpeechRecognition error:', event.error);

            if (event.error === 'not-allowed') {
                activeRef.current = false;
                stateRef.current = STATE.IDLE;
                setIsListening(false);
                alert('Microphone access was denied. Please allow microphone access in your browser settings and try again.');
                return;
            }

            if (event.error === 'language-not-supported') {
                // Fallback: fr-FR → fr
                if (langRef.current === 'fr-FR') {
                    langRef.current = 'fr';
                    console.log('🔃 Language fallback → fr');
                }
            }

            // 'aborted' fires when we programmatically call .abort() — ignore it
            if (event.error === 'aborted') return;

            // For no-speech, network, audio-capture, service-not-allowed, etc.
            // The onend handler will fire next and handle the restart.
        };

        // ── onend ────────────────────────────────────────────────
        recognition.onend = () => {
            console.log('🔴 Recognition ended. active:', activeRef.current, 'state:', stateRef.current);
            stateRef.current = STATE.IDLE;

            if (activeRef.current) {
                // Flush any leftover interim text before restarting
                flushInterim();
                scheduleRestart();
            } else {
                setIsListening(false);
            }
        };

        return recognition;
    }, [flushInterim]);

    /** Schedule a restart with adaptive back-off */
    const scheduleRestart = useCallback(() => {
        if (restartTimerRef.current) {
            clearTimeout(restartTimerRef.current);
        }

        const delay = backoffRef.current;
        // Increase back-off for next time (cap at 2s)
        backoffRef.current = Math.min(backoffRef.current * 1.5, 2000);

        console.log(`⏱️ Scheduling restart in ${delay}ms`);

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
            try {
                newRec.start();
                console.log('🔄 Recognition restarted');
            } catch (e) {
                console.error('❌ Restart failed:', e.message);
                stateRef.current = STATE.IDLE;
                // Try again with longer delay
                if (activeRef.current) scheduleRestart();
            }
        }, delay);
    }, [createRecognition, destroyRecognition]);

    // ─── Public API ─────────────────────────────────────────────────

    /** Start speech recognition — call this when user presses record */
    const startListening = useCallback(() => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return;

        // Reset state
        transcriptionRef.current = '';
        interimRef.current = '';
        setTranscription('');
        setInterimText('');
        backoffRef.current = 50;
        lastResultTimeRef.current = 0;
        langRef.current = 'fr-FR';
        activeRef.current = true;

        // Destroy any leftover instance
        destroyRecognition();

        // Create fresh instance
        const rec = createRecognition();
        if (!rec) return;
        recognitionRef.current = rec;

        stateRef.current = STATE.STARTING;
        try {
            rec.start();
        } catch (e) {
            console.error('Start failed:', e.message);
            stateRef.current = STATE.IDLE;
            // Will retry via scheduleRestart
            scheduleRestart();
        }
    }, [createRecognition, destroyRecognition, scheduleRestart]);

    /** Stop speech recognition — call this when user presses stop */
    const stopListening = useCallback(() => {
        activeRef.current = false;

        // Cancel any pending restart
        if (restartTimerRef.current) {
            clearTimeout(restartTimerRef.current);
            restartTimerRef.current = null;
        }

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
    }, [flushInterim]);

    /** Reset everything — call this when user deletes recording or starts fresh */
    const resetTranscription = useCallback(() => {
        transcriptionRef.current = '';
        interimRef.current = '';
        setTranscription('');
        setInterimText('');
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
            destroyRecognition();
        };
    }, [destroyRecognition]);

    return {
        // State
        transcription,
        interimText,
        isListening,
        speechSupported,
        // Actions
        startListening,
        stopListening,
        resetTranscription,
        getTranscription,
    };
}
