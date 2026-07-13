import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { askPublicCorpus, PORTFOLIO_API, type PortfolioCitation } from './portfolioApi';

type Mode = 'chat' | 'voice';
type Message = { role: 'user' | 'assistant'; content: string };
type StreamEvent = Record<string, unknown>;
const PortfolioVoiceExperience = lazy(() => import('./PortfolioVoiceExperience'));
const suggestions = [
  'What did Kevin build at PayPal?',
  'How does Trackly show product judgment?',
  'What AI product roles fit Kevin best?',
];

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
  const chatAbortRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef(false);
  const pendingDeltaRef = useRef('');
  const deltaFrameRef = useRef<number | null>(null);

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
      else next.push({ role: 'assistant', content: text });
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
    const history = messages.slice(-6);
    setMessages((current) => [...current, { role: 'user', content: message }]);
    setQuestion('');
    setCitations([]);
    setLoading(true);
    setStatus('Reading public evidence');
    const controller = new AbortController();
    const responseTimer = window.setTimeout(() => controller.abort('portfolio_chat_timeout'), 20_000);
    chatAbortRef.current = controller;
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    try {
      const response = await fetch(`${PORTFOLIO_API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) throw new Error('stream_unavailable');
      reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let receivedDone = false;
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
          if (event === 'delta' && typeof data.text === 'string') appendAssistantDelta(data.text);
          if (event === 'citations' && Array.isArray(data.citations)) setCitations(data.citations);
          if (event === 'error' && data.reset === true) resetAssistantDraft();
          if (event === 'done') receivedDone = true;
        }
        if (done) break;
      }
      flushAssistantDelta();
      if (!receivedDone) throw new Error('stream_truncated');
      setStatus('Answer grounded in public evidence');
    } catch {
      const unmounted = chatAbortRef.current !== controller;
      if (unmounted) return;
      controller.abort();
      void reader?.cancel().catch(() => {});
      resetAssistantDraft();
      try {
        const fallback = await askPublicCorpus(message);
        appendAssistantDelta(fallback.answer);
        setCitations(fallback.citations);
        setStatus('Showing the deterministic public-corpus answer');
      } catch {
        appendAssistantDelta('The interactive assistant is unavailable. The cited questions below remain available without JavaScript or an AI connection.');
        setStatus('Interactive assistant unavailable');
      }
    } finally {
      window.clearTimeout(responseTimer);
      if (chatAbortRef.current === controller) {
        chatAbortRef.current = null;
        inFlightRef.current = false;
        setLoading(false);
      }
    }
  };

  const onSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => { event.preventDefault(); void ask(question); };

  const changeMode = (next: Mode) => {
    setMode(next);
  };

  return (
    <section className="assistant-shell" aria-label="Portfolio assistant">
      <div className="assistant-tabs" role="tablist" aria-label="Assistant mode">
        <button role="tab" aria-selected={mode === 'chat'} onClick={() => changeMode('chat')}>Chat <small>readable + cited</small></button>
        <button role="tab" aria-selected={mode === 'voice'} onClick={() => changeMode('voice')}>Voice <small>audio-first</small></button>
      </div>

      {mode === 'chat' ? (
        <div className="chat-panel" role="tabpanel">
          <header><p className="eyebrow">Grounded Chat</p><h2>Ask a recruiter question.</h2><p>Answers use Kevin's versioned public portfolio corpus. Conversation history stays in this browser tab and is never saved.</p></header>
          <div className="chat-messages" aria-live="polite">
            {messages.length === 0 ? (
              <div className="chat-empty"><strong>Good starting points</strong>{suggestions.map((item) => <button key={item} onClick={() => void ask(item)}>{item}</button>)}</div>
            ) : messages.map((message, index) => (
              <article className={`chat-message ${message.role}`} key={`${message.role}-${index}`}><span>{message.role === 'user' ? 'You' : 'Portfolio guide'}</span><p>{message.content}</p></article>
            ))}
            {loading && <div className="chat-thinking"><i></i><i></i><i></i><span className="sr-only">Preparing grounded answer</span></div>}
          </div>
          {citations.length > 0 && <div className="chat-citations"><strong>Public sources</strong>{citations.map((citation) => <a href={citation.url} key={citation.url}>{citation.title}</a>)}</div>}
          <form onSubmit={onSubmit} className="chat-form">
            <label htmlFor="portfolio-question">Question</label>
            <div><textarea id="portfolio-question" value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={600} rows={3} placeholder="Ask about PayPal, Trackly, Berkeley, BCP, or product decisions" /><button type="submit" disabled={loading || question.trim().length < 2}>Ask</button></div>
            <p>Do not include private, confidential, or recruiting-sensitive information.</p>
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
