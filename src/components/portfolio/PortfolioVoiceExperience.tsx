import { useEffect, useRef, useState } from 'react';
import PortfolioVoiceOrb from './PortfolioVoiceOrb';
import { PortfolioVoiceSession, type PortfolioVoiceState } from './PortfolioVoiceSession';
import type { PortfolioCitation } from './portfolioApi';

interface Props {
  onSwitchToChat: () => void;
}

export default function PortfolioVoiceExperience({ onSwitchToChat }: Props) {
  const [voiceState, setVoiceState] = useState<'intro' | PortfolioVoiceState>('intro');
  const [voiceError, setVoiceError] = useState('');
  const [muted, setMuted] = useState(false);
  const [voiceSources, setVoiceSources] = useState<PortfolioCitation[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const voiceSessionRef = useRef<PortfolioVoiceSession | null>(null);
  const voiceGenerationRef = useRef(0);
  const levelRef = useRef(0);

  useEffect(() => {
    const pageHide = () => { void voiceSessionRef.current?.end('page_hidden'); };
    window.addEventListener('pagehide', pageHide);
    return () => {
      window.removeEventListener('pagehide', pageHide);
      voiceGenerationRef.current += 1;
      const session = voiceSessionRef.current;
      voiceSessionRef.current = null;
      void session?.end('switched_to_chat');
    };
  }, []);

  const startVoice = async () => {
    if (!audioRef.current || voiceSessionRef.current) return;
    setVoiceError('');
    setVoiceSources([]);
    setMuted(false);
    const generation = voiceGenerationRef.current + 1;
    voiceGenerationRef.current = generation;
    const session = new PortfolioVoiceSession({
      audioElement: audioRef.current,
      levelRef,
      onStateChange: (state) => {
        if (voiceGenerationRef.current === generation) setVoiceState(state);
      },
      onSource: (source) => {
        if (voiceGenerationRef.current !== generation) return;
        setVoiceSources((current) => (
          current.some((item) => item.url === source.url) ? current : [...current, source]
        ));
      },
      onError: (message) => {
        if (voiceGenerationRef.current === generation) setVoiceError(message);
      },
    });
    voiceSessionRef.current = session;
    await session.start();
  };

  const endVoice = async (reason: 'user_ended' | 'switched_to_chat' = 'user_ended') => {
    const session = voiceSessionRef.current;
    voiceSessionRef.current = null;
    await session?.end(reason);
  };

  const switchToChat = () => {
    voiceGenerationRef.current += 1;
    if (voiceSessionRef.current) void endVoice('switched_to_chat');
    onSwitchToChat();
  };

  const retryVoice = () => {
    voiceGenerationRef.current += 1;
    voiceSessionRef.current?.teardown();
    voiceSessionRef.current = null;
    setVoiceState('intro');
    setVoiceError('');
  };

  const voiceLabel: Record<PortfolioVoiceState, string> = {
    connecting: 'Connecting',
    listening: muted ? 'Microphone muted' : 'Listening',
    speaking: 'Speaking',
    reconnecting: 'Reconnecting',
    ended: 'Call ended',
    failed: 'Assistant unavailable',
  };

  return (
    <div className="voice-panel" role="tabpanel">
      <audio ref={audioRef} autoPlay hidden />
      <div className="voice-orb-wrap"><PortfolioVoiceOrb levelRef={levelRef} size={voiceState === 'intro' ? 260 : 300} variant={voiceState === 'intro' ? 'intro' : 'active'} /></div>
      {voiceState === 'intro' ? (
        <div className="voice-copy">
          <p className="eyebrow">Kevin's AI assistant</p>
          <h2>Talk through Kevin's work.</h2>
          <p>This is an AI voice assistant. It answers from Kevin's public portfolio, and no transcript is retained. Microphone access begins only after you start.</p>
          <button className="voice-primary" onClick={() => void startVoice()}>Start voice call</button>
          <button className="voice-secondary" onClick={switchToChat}>Back to Chat</button>
        </div>
      ) : (
        <div className="voice-copy active">
          <p className="voice-state" aria-live="polite">{voiceLabel[voiceState]}</p>
          {voiceError && <p className="voice-error">{voiceError}</p>}
          {['connecting', 'listening', 'speaking', 'reconnecting'].includes(voiceState) && (
            <div className="voice-controls">
              <button onClick={() => setMuted(voiceSessionRef.current?.toggleMute() ?? false)}>{muted ? 'Unmute' : 'Mute'}</button>
              <button className="voice-end-call" onClick={() => void endVoice()}>End call</button>
              <button onClick={switchToChat}>Switch to Chat</button>
            </div>
          )}
          {voiceState === 'failed' && <div className="voice-controls"><button onClick={retryVoice}>Try again</button><button onClick={switchToChat}>Switch to Chat</button></div>}
          {voiceState === 'ended' && <div className="voice-controls"><button onClick={retryVoice}>Start another call</button><button onClick={switchToChat}>Switch to Chat</button></div>}
          {(voiceState === 'ended' || voiceState === 'failed') && voiceSources.length > 0 && (
            <div className="voice-sources"><strong>Sources used during the call</strong>{voiceSources.map((source) => <a key={source.url} href={source.url}>{source.title}</a>)}</div>
          )}
        </div>
      )}
    </div>
  );
}
