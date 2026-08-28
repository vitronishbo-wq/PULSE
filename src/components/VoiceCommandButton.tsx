import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles, Loader2 } from 'lucide-react';
import { InputNormalizer } from '../engines/InputNormalizer';

interface VoiceCommandButtonProps {
  onTranscriptReady?: (transcript: string) => void;
  className?: string;
}

export const VoiceCommandButton: React.FC<VoiceCommandButtonProps> = ({
  onTranscriptReady,
  className = '',
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const normalizer = InputNormalizer.getInstance();

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'pt-PT'; // Default to Portuguese for Angola/Mozambique/Portugal/Cape Verde

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
      };

      recognition.onresult = (event: any) => {
        let current = '';
        for (let i = 0; i < event.results.length; i++) {
          current += event.results[i][0].transcript;
        }
        setTranscript(current);

        if (event.results[0].isFinal) {
          handleFinalVoiceInput(current);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const handleFinalVoiceInput = (text: string) => {
    if (!text.trim()) return;

    // Direct dispatch into the Universal Input Normalizer
    normalizer.ingestRawInput(text, 'VOICE_RECOGNITION', 'COMMAND', {
      confidence: 0.92,
    });

    if (onTranscriptReady) {
      onTranscriptReady(text);
    }
  };

  const toggleListening = () => {
    if (!isSupported) {
      // Fallback: prompt user
      const promptText = window.prompt(
        'Voz direta PULSE.OS (Simulação de Microfone): Digite seu comando falado:',
        'Vender 2 caixas de Coca-Cola para Silva com TPA'
      );
      if (promptText) {
        handleFinalVoiceInput(promptText);
      }
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.warn('Failed to start speech recognition:', err);
      }
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={toggleListening}
        className={`p-1.5 rounded transition-all flex items-center gap-1 text-xs font-mono ${
          isListening
            ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-900/50'
            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:text-emerald-400'
        } ${className}`}
        title={isListening ? 'A escutar... Fale agora' : 'Comando por Voz (Voz → Input Normalizer)'}
      >
        {isListening ? (
          <>
            <Mic className="w-3.5 h-3.5 text-white animate-bounce" />
            <span className="text-[10px] font-bold text-white hidden sm:inline">Escutando...</span>
          </>
        ) : (
          <>
            <Mic className="w-3.5 h-3.5" />
            <span className="text-[10px] hidden md:inline text-slate-400">Voz</span>
          </>
        )}
      </button>

      {/* Voice wave indicator floating bubble when listening */}
      {isListening && (
        <div className="absolute left-0 bottom-full mb-2 bg-slate-900 border border-rose-500 rounded-lg p-2 shadow-2xl text-[11px] font-mono text-slate-200 z-50 min-w-[200px] animate-in fade-in">
          <div className="flex items-center gap-2 text-rose-400 font-bold mb-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span>Microfone Ativo (Voz → Core)</span>
          </div>
          <div className="text-slate-300 text-[10px] italic truncate">
            {transcript || 'Diga: "Fatura 5 cocas para cliente Manuel"...'}
          </div>
        </div>
      )}
    </div>
  );
};
