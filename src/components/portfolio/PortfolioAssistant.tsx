import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { capturePortfolioEvent } from '../../lib/portfolioEvents';
import { askPublicCorpus, PORTFOLIO_API, sanitizePortfolioCitations, submitPortfolioFeedback, type PortfolioCitation } from './portfolioApi';

type Mode = 'chat' | 'voice';
type Message = { role: 'user' | 'assistant'; content: string; turnId?: string; citations?: PortfolioCitation[] };
type StreamEvent = Record<string, unknown>;
type FeedbackState = { turnId: string; status: 'pending' | 'helpful' | 'needs_work' };
type ActivityPhase = 'preparing' | 'retrieving' | 'synthesizing' | 'writing';
type ActivityItem = {
  phase: ActivityPhase;
  label: string;
  detail?: string;
  state: 'active' | 'complete';
};
const PortfolioVoiceExperience = lazy(() => import('./PortfolioVoiceExperience'));
const suggestions = [
  'What did Kevin build at PayPal?',
  'How does Trackly show product judgment?',
  'What AI product roles fit Kevin best?',
];
const FALLBACK_TIMEOUT_MS = 10_000;

function AssistantTrace({ animated = false }: { animated?: boolean }) {
  return (
    <svg className={`assistant-trace${animated ? ' is-animated' : ''}`} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 4.5h8.5a3 3 0 0 1 3 3v8" />
      <path d="M6 9.5h7M6 14.5h5" />
      <circle cx="4" cy="4.5" r="1.25" />
      <circle cx="17.5" cy="18" r="1.25" />
    </svg>
  );
}

function parseStreamEvent(raw: string): StreamEvent {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('invalid_event_shape');
    return parsed as StreamEvent;
  } catch {
    throw new Error('stream_malformed');
  }
}

function sourceDetail(data: StreamEvent): string | undefined {
  const titles = Array.isArray(data.sourceTitles)
    ? data.sourceTitles.filter((value): value is string => typeof value === 'string').slice(0, 3)
    : [];
  if (titles.length > 0) return titles.join(' · ');
  if (typeof data.sourceCount === 'number') {
    return data.sourceCount === 1 ? '1 relevant public source' : `${data.sourceCount} relevant public sources`;
  }
  return undefined;
}

function AssistantMarkdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      allowedElements={['p', 'strong', 'em', 'ul', 'ol', 'li', 'code', 'br']}
      unwrapDisallowed
    >
      {children}
    </ReactMarkdown>
  );
}

function AssistantActivity({ activities, loading }: { activities: ActivityItem[]; loading: boolean }) {
  if (activities.length === 0) return null;
  return (
    <details className="chat-reasoning" open={loading}>
      <summary><AssistantTrace animated={loading} /><span>{loading ? "Kevin's AI is working" : "How Kevin's AI answered"}</span></summary>
      <ol>{activities.map((activity) => <li className={activity.state === 'complete' ? 'is-complete' : 'is-active'} key={activity.phase}><strong>{activity.label}</strong>{activity.detail && <span>{activity.detail}</span>}</li>)}</ol>
    </details>
  );
}

export default function PortfolioAssistant() {
  const [mode, setMode] = useState<Mode>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState('');
  const [status, setStatus] = useState('Ready');
  const [loading, setLoading] = useState(false);
  const [latestTurnId, setLatestTurnId] = useState<string>();
  const [feedback, setFeedback] = useState<FeedbackState>();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const chatAbortRef = useRef<AbortController | null>(null);
  const sessionIdRef = useRef<string | undefined>(undefined);
  const activeTurnIdRef = useRef<string | undefined>(undefined);
  const inFlightRef = useRef(false);
  const pendingDeltaRef = useRef('');
  const pendingCitationsRef = useRef<PortfolioCitation[]>([]);
  const deltaFrameRef = useRef<number | null>(null);
  const analyticsStartedRef = useRef(false);
  const chatMessagesRef = useRef<HTMLDivElement | null>(null);
  const stickToBottomRef = useRef(true);
  const anchorCompletedAnswerRef = useRef(false);
  const chatTabRef = useRef<HTMLButtonElement | null>(null);
  const voiceTabRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    return () => {
      chatAbortRef.current?.abort();
      if (deltaFrameRef.current !== null) cancelAnimationFrame(deltaFrameRef.current);
      chatAbortRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!stickToBottomRef.current) return;
    const frame = requestAnimationFrame(() => {
      const element = chatMessagesRef.current;
      if (element) element.scrollTop = element.scrollHeight;
    });
    return () => cancelAnimationFrame(frame);
  }, [messages, loading, status]);

  useEffect(() => {
    if (loading || !anchorCompletedAnswerRef.current) return;
    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        const container = chatMessagesRef.current;
        const answers = container?.querySelectorAll<HTMLElement>('.chat-message.assistant');
        const answer = answers?.length ? answers[answers.length - 1] : null;
        if (!container || !answer) return;
        anchorCompletedAnswerRef.current = false;
        if (!stickToBottomRef.current) return;
        if (answer.getBoundingClientRect().height < container.clientHeight * 0.72) {
          container.scrollTo({ top: container.scrollHeight, behavior: 'auto' });
          stickToBottomRef.current = true;
          return;
        }
        const activity = answer.previousElementSibling;
        const anchor = activity instanceof HTMLElement && activity.classList.contains('chat-reasoning') ? activity : answer;
        const top = container.scrollTop + anchor.getBoundingClientRect().top - container.getBoundingClientRect().top - 8;
        container.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
        stickToBottomRef.current = false;
      });
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      if (secondFrame) cancelAnimationFrame(secondFrame);
    };
  }, [loading, messages]);

  const commitAssistantDelta = (text: string, citations = pendingCitationsRef.current) => {
    setMessages((current) => {
      const next = [...current];
      const last = next[next.length - 1];
      if (last?.role === 'assistant') next[next.length - 1] = { ...last, content: last.content + text, citations };
      else next.push({ role: 'assistant', content: text, turnId: activeTurnIdRef.current, citations });
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

  const finalizeAssistantAnswer = () => {
    if (deltaFrameRef.current !== null) cancelAnimationFrame(deltaFrameRef.current);
    deltaFrameRef.current = null;
    const text = pendingDeltaRef.current;
    pendingDeltaRef.current = '';
    const citations = pendingCitationsRef.current;
    setMessages((current) => {
      const next = [...current];
      const last = next.at(-1);
      if (last?.role === 'assistant') next[next.length - 1] = { ...last, content: last.content + text, citations };
      else if (text) next.push({ role: 'assistant', content: text, turnId: activeTurnIdRef.current, citations });
      return next;
    });
  };

  const resetAssistantDraft = () => {
    pendingDeltaRef.current = '';
    pendingCitationsRef.current = [];
    if (deltaFrameRef.current !== null) cancelAnimationFrame(deltaFrameRef.current);
    deltaFrameRef.current = null;
    setMessages((current) => {
      const next = [...current];
      if (next.at(-1)?.role === 'assistant') next.pop();
      return next;
    });
  };

  const updateActivity = (
    phase: ActivityPhase,
    label: string,
    state: ActivityItem['state'] = 'active',
    detail?: string,
  ) => {
    setActivities((current) => {
      const next = current.map((item) => (
        item.state === 'active' && item.phase !== phase ? { ...item, state: 'complete' as const } : item
      ));
      const index = next.findIndex((item) => item.phase === phase);
      const activity = { phase, label, state, ...(detail ? { detail } : {}) };
      if (index >= 0) next[index] = { ...next[index], ...activity };
      else next.push(activity);
      return next;
    });
  };

  const completeActivities = () => {
    setActivities((current) => current.map((item) => ({ ...item, state: 'complete' })));
  };

  const ask = async (value: string) => {
    const message = value.trim();
    if (message.length < 2 || inFlightRef.current) return;
    anchorCompletedAnswerRef.current = false;
    stickToBottomRef.current = true;
    inFlightRef.current = true;
    const history = messages.slice(-6).map(({ role, content }) => ({ role, content }));
    setMessages((current) => [...current, { role: 'user', content: message }]);
    setQuestion('');
    pendingCitationsRef.current = [];
    setLatestTurnId(undefined);
    setFeedback(undefined);
    setActivities([{ phase: 'preparing', label: 'Understanding your question', state: 'active' }]);
    activeTurnIdRef.current = undefined;
    analyticsStartedRef.current = false;
    setLoading(true);
    setStatus('Considering your question');
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
      let recoveredFallback = false;
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
            const activityState = data.state === 'complete' ? 'complete' : 'active';
            const label = activityState === 'complete' ? 'Searched Kevin’s public portfolio' : 'Searching Kevin’s public portfolio';
            updateActivity('retrieving', label, activityState, sourceDetail(data));
            setStatus(activityState === 'complete' ? 'Portfolio search complete' : "Looking through Kevin's portfolio");
          }
          if (event === 'status' && data.phase === 'synthesizing') {
            updateActivity('synthesizing', 'Grounding the answer in public evidence', 'active', sourceDetail(data));
            setStatus('Summarizing what matters');
          }
          if (event === 'delta' && typeof data.text === 'string') {
            if (!receivedFirstDelta) {
              receivedFirstDelta = true;
              updateActivity('writing', 'Writing the answer', 'active');
              setStatus('Writing answer');
            }
            appendAssistantDelta(data.text);
          }
          if (event === 'citations') {
            const citations = sanitizePortfolioCitations(data.citations);
            pendingCitationsRef.current = citations;
            setMessages((current) => {
              const next = [...current];
              const last = next.at(-1);
              if (last?.role === 'assistant') next[next.length - 1] = { ...last, citations };
              return next;
            });
          }
          if (event === 'error') {
            if (data.reset === true) {
              resetAssistantDraft();
              pendingCitationsRef.current = [];
            }
            if (data.recoverable === true) {
              recoveredFallback = true;
              setStatus('Using portfolio evidence');
            }
            else throw new Error('stream_error');
          }
          if (event === 'done') {
            receivedDone = true;
            if (data.fallback === true) recoveredFallback = true;
            completeActivities();
            anchorCompletedAnswerRef.current = stickToBottomRef.current;
          }
        }
        if (done) break;
      }
      finalizeAssistantAnswer();
      if (!receivedDone) throw new Error('stream_truncated');
      capturePortfolioEvent('portfolio_chat_completed', {
        outcome: recoveredFallback ? 'streamed_fallback' : 'streamed',
        recovered: recoveredFallback,
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
      setActivities((current) => current.map((item) => ({ ...item, state: 'complete' })));
      activeTurnIdRef.current = undefined;
      setLatestTurnId(undefined);
      const fallbackController = new AbortController();
      const fallbackTimer = window.setTimeout(() => fallbackController.abort('portfolio_fallback_timeout'), FALLBACK_TIMEOUT_MS);
      activeController = fallbackController;
      chatAbortRef.current = fallbackController;
      try {
        const fallback = await askPublicCorpus(message, fallbackController.signal);
        pendingCitationsRef.current = fallback.citations;
        commitAssistantDelta(fallback.answer, fallback.citations);
        anchorCompletedAnswerRef.current = stickToBottomRef.current;
        updateActivity('writing', 'Used the verified portfolio fallback', 'complete');
        capturePortfolioEvent('portfolio_chat_failed', { failure_stage: 'stream', recovered: true });
        capturePortfolioEvent('portfolio_chat_completed', { outcome: 'deterministic_fallback', recovered: true });
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

  const onModeKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, current: Mode) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next: Mode = event.key === 'Home' ? 'chat' : event.key === 'End' ? 'voice' : current === 'chat' ? 'voice' : 'chat';
    changeMode(next);
    (next === 'chat' ? chatTabRef : voiceTabRef).current?.focus();
  };

  const onChatScroll = () => {
    const element = chatMessagesRef.current;
    if (!element) return;
    stickToBottomRef.current = element.scrollHeight - element.scrollTop - element.clientHeight < 80;
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
        <button ref={chatTabRef} id="assistant-chat-tab" role="tab" aria-selected={mode === 'chat'} aria-controls="assistant-chat-panel" tabIndex={mode === 'chat' ? 0 : -1} onKeyDown={(event) => onModeKeyDown(event, 'chat')} onClick={() => changeMode('chat')}>Chat</button>
        <button ref={voiceTabRef} id="assistant-voice-tab" role="tab" aria-selected={mode === 'voice'} aria-controls="assistant-voice-panel" tabIndex={mode === 'voice' ? 0 : -1} onKeyDown={(event) => onModeKeyDown(event, 'voice')} onClick={() => changeMode('voice')}>Voice</button>
      </div>

      {mode === 'chat' ? (
        <div className="chat-panel" id="assistant-chat-panel" role="tabpanel" aria-labelledby="assistant-chat-tab" tabIndex={0}>
          <header><p className="eyebrow">Kevin's AI</p><h2>What are you curious about?</h2><p>Explore his work, product decisions, experience, or the kind of role he is looking for.</p></header>
          <div className="chat-messages" ref={chatMessagesRef} role="log" aria-busy={loading} onScroll={onChatScroll}>
            {messages.length === 0 ? (
              <div className="chat-empty"><strong>Good starting points</strong>{suggestions.map((item) => <button key={item} onClick={() => void ask(item)}>{item}</button>)}</div>
            ) : messages.map((message, index) => (
              <React.Fragment key={`${message.role}-${index}`}>
                {message.role === 'assistant' && index === messages.length - 1 && <AssistantActivity activities={activities} loading={loading} />}
                <article className={`chat-message ${message.role}`}>
                  <span className="chat-message-label">{message.role === 'assistant' && <AssistantTrace />}{message.role === 'user' ? 'You' : "Kevin's AI"}</span>
                  <div className="chat-message-content"><AssistantMarkdown>{message.content}</AssistantMarkdown></div>
                  {message.role === 'assistant' && message.citations && message.citations.length > 0 && <div className="chat-message-citations"><strong>Sources</strong>{message.citations.map((citation) => <a href={citation.url} key={citation.url}>{citation.title}</a>)}</div>}
                </article>
              </React.Fragment>
            ))}
            {messages.at(-1)?.role !== 'assistant' && <AssistantActivity activities={activities} loading={loading} />}
          </div>
          {latestTurnId && !loading && <div className="chat-feedback" aria-label="Rate this answer"><span>{currentFeedback === 'pending' ? 'Sending feedback…' : currentFeedback ? 'Thanks for the feedback.' : 'Was this helpful?'}</span><button type="button" disabled={Boolean(currentFeedback)} onClick={() => void rateAnswer('helpful')}>Helpful</button><button type="button" disabled={Boolean(currentFeedback)} onClick={() => void rateAnswer('needs_work')}>Needs work</button></div>}
          <form onSubmit={onSubmit} className="chat-form">
            <label htmlFor="portfolio-question">Question</label>
            <div><textarea id="portfolio-question" value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={onComposerKeyDown} maxLength={600} rows={2} placeholder="Ask anything about Kevin" /><button type="submit" disabled={loading || question.trim().length < 2}>Ask</button></div>
            <p>Press Enter to send. Shift+Enter adds a new line. Please keep confidential information out of the chat.</p>
          </form>
          <div className={`assistant-status${loading || status === 'Ready' ? ' sr-only' : ''}`} role="status">{status}</div>
        </div>
      ) : (
        <Suspense fallback={<div className="voice-panel voice-loading" id="assistant-voice-panel" role="tabpanel" aria-labelledby="assistant-voice-tab" aria-busy="true"><div className="voice-loading-visual"><div className="voice-loading-orb" /></div><div className="voice-loading-copy" role="status"><AssistantTrace animated /><span>Preparing voice</span></div></div>}>
          <PortfolioVoiceExperience onSwitchToChat={() => changeMode('chat')} />
        </Suspense>
      )}
    </section>
  );
}
