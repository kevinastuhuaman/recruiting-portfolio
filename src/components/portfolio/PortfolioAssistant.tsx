import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { capturePortfolioEvent } from '../../lib/portfolioAnalytics';
import { askPublicCorpus, PORTFOLIO_API, submitPortfolioFeedback, type PortfolioCitation } from './portfolioApi';

type Mode = 'chat' | 'voice';
type Message = { role: 'user' | 'assistant'; content: string; turnId?: string };
type StreamEvent = Record<string, unknown>;
type FeedbackState = { turnId: string; status: 'pending' | 'helpful' | 'needs_work' };
const PortfolioVoiceExperience = lazy(() => import('./PortfolioVoiceExperience'));
const suggestions = [
  'What did Kevin build at PayPal?',
  'How does Trackly show product judgment?',
  'What AI product roles fit Kevin best?',
];
const FALLBACK_TIMEOUT_MS = 10_000;

function parseStreamEvent(raw: string): StreamEvent {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('invalid_event_shape');
    return parsed as StreamEvent;
  } catch {
    throw new Error('stream_malformed');
  }
}

export default function PortfolioAssistant() {
  const [mode, setMode] = useState<Mode>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState('');
  const [citations, setCitations] = useState<PortfolioCitation[]>([]);
  const [status, setStatus] = useState('Ready');
  const [loading, setLoading] = useState(false);
  const [latestTurnId, setLatestTurnId] = useState<string>();
  const [feedback, setFeedback] = useState<FeedbackState>();
  const chatAbortRef = useRef<AbortController | null>(null);
  const sessionIdRef = useRef<string | undefined>(undefined);
  const activeTurnIdRef = useRef<string | undefined>(undefined);
  const inFlightRef = useRef(false);
  const pendingDeltaRef = useRef('');
  const deltaFrameRef = useRef<number | null>(null);
  const analyticsStartedRef = useRef(false);

  useEffect(() => {
    return () => {
      chatAbortRef.current?.abort();
      if (deltaFrameRef.current !== null) cancelAnimationFrame(deltaFrameRef.current);
      chatAbortRef.current = null;
    };
  }, []);

  const commitAssistantDelta = (text: string) => {
    setMessages((current) => {
      const next = [...current];
      const last = next[next.length - 1];
      if (last?.role === 'assistant') next[next.length - 1] = { ...last, content: last.content + text };
      else next.push({ role: 'assistant', content: text, turnId: activeTurnIdRef.current });
      return next;
    });
  };

  const flushAssistantDelta = () => {
    deltaFrameRef.current = null;
    const text = pendingDeltaRef.current;
    pendingDeltaRef.current = '';
    if (text) commitAssistantDelta(text);
  };

  const appendAssistantDelta = (text: string) => {
    pendingDeltaRef.current += text;
    if (deltaFrameRef.current === null) deltaFrameRef.current = requestAnimationFrame(flushAssistantDelta);
  };

  const resetAssistantDraft = () => {
    pendingDeltaRef.current = '';
    if (deltaFrameRef.current !== null) cancelAnimationFrame(deltaFrameRef.current);
    deltaFrameRef.current = null;
    setMessages((current) => {
      const next = [...current];
      if (next.at(-1)?.role === 'assistant') next.pop();
      return next;
    });
  };

  const ask = async (value: string) => {
    const message = value.trim();
    if (message.length < 2 || inFlightRef.current) return;
    inFlightRef.current = true;
    const history = messages.slice(-6).map(({ role, content }) => ({ role, content }));
    setMessages((current) => [...current, { role: 'user', content: message }]);
    setQuestion('');
    setCitations([]);
    setLatestTurnId(undefined);
    setFeedback(undefined);
    activeTurnIdRef.current = undefined;
    analyticsStartedRef.current = false;
    setLoading(true);
    setStatus("Searching Kevin's portfolio");
    const controller = new AbortController();
    const responseTimer = window.setTimeout(() => controller.abort('portfolio_chat_timeout'), 20_000);
    chatAbortRef.current = controller;
    let activeController = controller;
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    try {
      const response = await fetch(`${PORTFOLIO_API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history, ...(sessionIdRef.current ? { sessionId: sessionIdRef.current } : {}) }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) throw new Error('stream_unavailable');
      reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let receivedDone = false;
      let receivedFirstDelta = false;
      while (true) {
        const { done, value: bytes } = await reader.read();
        buffer += decoder.decode(bytes ?? new Uint8Array(), { stream: !done });
        const blocks = buffer.split('\n\n');
        buffer = blocks.pop() ?? '';
        for (const block of blocks) {
          const event = block.split('\n').find((line) => line.startsWith('event: '))?.slice(7);
          const raw = block.split('\n').find((line) => line.startsWith('data: '))?.slice(6);
          if (!event || !raw) continue;
          const data = parseStreamEvent(raw);
          if (event === 'meta') {
            if (typeof data.sessionId === 'string') sessionIdRef.current = data.sessionId;
            if (typeof data.turnId === 'string') {
              activeTurnIdRef.current = data.turnId;
              setLatestTurnId(data.turnId);
            }
            if (!analyticsStartedRef.current && typeof data.turnId === 'string') {
              analyticsStartedRef.current = true;
              capturePortfolioEvent('portfolio_chat_started', {
                turn_id: data.turnId,
                ...(typeof data.sessionId === 'string' ? { session_id: data.sessionId } : {}),
              });
            }
          }
          if (event === 'status' && data.phase === 'retrieving') {
            setStatus("Looking through Kevin's portfolio");
          }
          if (event === 'status' && data.phase === 'synthesizing') {
            setStatus('Summarizing what matters');
          }
          if (event === 'delta' && typeof data.text === 'string') {
            if (!receivedFirstDelta) {
              receivedFirstDelta = true;
              setStatus('Writing answer');
            }
            appendAssistantDelta(data.text);
          }
          if (event === 'citations' && Array.isArray(data.citations)) setCitations(data.citations);
          if (event === 'error') {
            if (data.reset === true) resetAssistantDraft();
            if (data.recoverable === true) setStatus('Using portfolio evidence');
            else throw new Error('stream_error');
          }
          if (event === 'done') receivedDone = true;
        }
        if (done) break;
      }
      flushAssistantDelta();
      if (!receivedDone) throw new Error('stream_truncated');
      capturePortfolioEvent('portfolio_chat_completed', {
        outcome: 'streamed',
        ...(activeTurnIdRef.current ? { turn_id: activeTurnIdRef.current } : {}),
        ...(sessionIdRef.current ? { session_id: sessionIdRef.current } : {}),
      });
      setStatus('Ready');
    } catch {
      const unmounted = chatAbortRef.current !== controller;
      if (unmounted) return;
      controller.abort();
      void reader?.cancel().catch(() => {});
      resetAssistantDraft();
      activeTurnIdRef.current = undefined;
      setLatestTurnId(undefined);
      const fallbackController = new AbortController();
      const fallbackTimer = window.setTimeout(() => fallbackController.abort('portfolio_fallback_timeout'), FALLBACK_TIMEOUT_MS);
      activeController = fallbackController;
      chatAbortRef.current = fallbackController;
      try {
        capturePortfolioEvent('portfolio_chat_failed', { failure_stage: 'stream', recovered: true });
        const fallback = await askPublicCorpus(message, fallbackController.signal);
        appendAssistantDelta(fallback.answer);
        setCitations(fallback.citations);
        capturePortfolioEvent('portfolio_chat_completed', { outcome: 'deterministic_fallback' });
        setStatus('Ready');
      } catch {
        if (chatAbortRef.current !== fallbackController) return;
        appendAssistantDelta('The interactive assistant is unavailable. The cited questions below remain available without JavaScript or an AI connection.');
        capturePortfolioEvent('portfolio_chat_failed', { failure_stage: 'fallback', recovered: false });
        setStatus('Assistant unavailable');
      } finally {
        window.clearTimeout(fallbackTimer);
      }
    } finally {
      window.clearTimeout(responseTimer);
      if (chatAbortRef.current === activeController) {
        chatAbortRef.current = null;
        inFlightRef.current = false;
        setLoading(false);
      }
    }
  };

  const onSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => { event.preventDefault(); void ask(question); };

  const onComposerKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    void ask(question);
  };

  const changeMode = (next: Mode) => {
    setMode(next);
    capturePortfolioEvent('portfolio_assistant_mode_selected', { mode: next });
  };

  const rateAnswer = async (rating: 'helpful' | 'needs_work') => {
    const turnId = latestTurnId;
    if (!turnId || feedback?.turnId === turnId) return;
    setFeedback({ turnId, status: 'pending' });
    try {
      await submitPortfolioFeedback(turnId, rating);
      if (activeTurnIdRef.current === turnId) {
        setFeedback({ turnId, status: rating });
        capturePortfolioEvent('portfolio_chat_feedback', { rating, turn_id: turnId });
        setStatus('Thanks for the feedback');
      }
    } catch {
      if (activeTurnIdRef.current === turnId) {
        setFeedback(undefined);
        setStatus('Feedback unavailable');
      }
    }
  };

  const currentFeedback = feedback && feedback.turnId === latestTurnId ? feedback.status : undefined;

  return (
    <section className="assistant-shell" aria-label="Portfolio assistant">
      <div className="assistant-tabs" role="tablist" aria-label="Assistant mode">
        <button role="tab" aria-selected={mode === 'chat'} onClick={() => changeMode('chat')}>Chat</button>
        <button role="tab" aria-selected={mode === 'voice'} onClick={() => changeMode('voice')}>Voice</button>
      </div>

      {mode === 'chat' ? (
        <div className="chat-panel" role="tabpanel">
          <header><p className="eyebrow">Kevin's assistant</p><h2>Ask anything about Kevin.</h2><p>Explore his work, product decisions, experience, or the kind of role he is looking for.</p></header>
          <div className="chat-messages" aria-live="polite">
            {messages.length === 0 ? (
              <div className="chat-empty"><strong>Good starting points</strong>{suggestions.map((item) => <button key={item} onClick={() => void ask(item)}>{item}</button>)}</div>
            ) : messages.map((message, index) => (
              <article className={`chat-message ${message.role}`} key={`${message.role}-${index}`}><span>{message.role === 'user' ? 'You' : "Kevin's assistant"}</span><p>{message.content}</p></article>
            ))}
            {loading && <div className="chat-thinking"><i></i><i></i><i></i><span className="sr-only">Preparing grounded answer</span></div>}
          </div>
          {citations.length > 0 && <div className="chat-citations"><strong>Public sources</strong>{citations.map((citation) => <a href={citation.url} key={citation.url}>{citation.title}</a>)}</div>}
          {latestTurnId && !loading && <div className="chat-feedback" aria-label="Rate this answer"><span>{currentFeedback === 'pending' ? 'Sending feedback…' : currentFeedback ? 'Thanks for the feedback.' : 'Was this helpful?'}</span><button type="button" disabled={Boolean(currentFeedback)} onClick={() => void rateAnswer('helpful')}>Helpful</button><button type="button" disabled={Boolean(currentFeedback)} onClick={() => void rateAnswer('needs_work')}>Needs work</button></div>}
          <form onSubmit={onSubmit} className="chat-form">
            <label htmlFor="portfolio-question">Question</label>
            <div><textarea id="portfolio-question" value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={onComposerKeyDown} maxLength={600} rows={2} placeholder="Ask anything about Kevin" /><button type="submit" disabled={loading || question.trim().length < 2}>Ask</button></div>
            <p>Press Enter to send. Shift+Enter adds a new line. Please keep confidential information out of the chat.</p>
          </form>
          <div className="assistant-status" role="status">{status}</div>
        </div>
      ) : (
        <Suspense fallback={<div className="voice-panel voice-loading" role="tabpanel">Preparing Voice…</div>}>
          <PortfolioVoiceExperience onSwitchToChat={() => changeMode('chat')} />
        </Suspense>
      )}
    </section>
  );
}
