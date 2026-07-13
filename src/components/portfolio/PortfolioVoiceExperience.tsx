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
  const levelRef = useRef(0);

  useEffect(() => {
    const pageHide = () => { void voiceSessionRef.current?.end('page_hidden'); };
    window.addEventListener('pagehide', pageHide);
    return () => {
      window.removeEventListener('pagehide', pageHide);
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
    const session = new PortfolioVoiceSession({
      audioElement: audioRef.current,
      levelRef,
      onStateChange: setVoiceState,
      onSource: (source) => setVoiceSources((current) => (
        current.some((item) => item.url === source.url) ? current : [...current, source]
      )),
      onError: setVoiceError,
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
    if (voiceSessionRef.current) void endVoice('switched_to_chat');
    onSwitchToChat();
  };

  const retryVoice = () => {
    voiceSessionRef.current?.teardown();
    voiceSessionRef.current = null;
    setVoiceState('intro');
    setVoiceError('');
  };

  const voiceLabel: Record<PortfolioVoiceState, string> = {
    connecting: 'Connecting securely',
    listening: muted ? 'Microphone muted' : 'Listening',
    speaking: 'Portfolio guide is speaking',
    reconnecting: 'Reconnecting',
    ended: 'Call ended',
    failed: 'Voice unavailable',
  };

  return (
    <div className="voice-panel" role="tabpanel">
      <audio ref={audioRef} autoPlay hidden />
      <div className="voice-orb-wrap"><PortfolioVoiceOrb levelRef={levelRef} size={voiceState === 'intro' ? 190 : 280} /></div>
      {voiceState === 'intro' ? (
        <div className="voice-copy">
          <p className="eyebrow">Synthetic AI portfolio guide</p>
          <h2>Talk through Kevin's public work.</h2>
          <p>This is an AI guide, not Kevin. It speaks about him in third person, checks the public corpus before factual answers, and never shows or stores a transcript. Microphone access begins only after you start.</p>
          <button className="voice-primary" onClick={() => void startVoice()}>Start voice call</button>
          <button className="voice-secondary" onClick={switchToChat}>Use Chat instead</button>
        </div>
      ) : (
        <div className="voice-copy active">
          <p className="voice-state" aria-live="polite">{voiceLabel[voiceState]}</p>
          {voiceError && <p className="voice-error">{voiceError}</p>}
          {['connecting', 'listening', 'speaking', 'reconnecting'].includes(voiceState) && (
            <div className="voice-controls">
              <button onClick={() => setMuted(voiceSessionRef.current?.toggleMute() ?? false)}>{muted ? 'Unmute' : 'Mute'}</button>
              <button onClick={() => void endVoice()}>End call</button>
              <button onClick={switchToChat}>Switch to Chat</button>
            </div>
          )}
          {voiceState === 'failed' && <div className="voice-controls"><button onClick={retryVoice}>Try again</button><button onClick={switchToChat}>Continue in Chat</button></div>}
          {voiceState === 'ended' && <button className="voice-secondary" onClick={switchToChat}>Ask in Chat with citations</button>}
          {(voiceState === 'ended' || voiceState === 'failed') && voiceSources.length > 0 && (
            <div className="voice-sources"><strong>Sources used during the call</strong>{voiceSources.map((source) => <a key={source.url} href={source.url}>{source.title}</a>)}</div>
          )}
        </div>
      )}
    </div>
  );
}
