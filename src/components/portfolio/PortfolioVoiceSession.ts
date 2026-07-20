import { PORTFOLIO_API, sanitizePortfolioCitations } from './portfolioApi';

export type PortfolioVoiceState = 'connecting' | 'listening' | 'speaking' | 'reconnecting' | 'ended' | 'failed';
export type PortfolioVoiceEndReason = 'user_ended' | 'duration_cap' | 'page_hidden' | 'failed' | 'switched_to_chat';
type PortfolioVoiceFinalState = 'ended' | 'failed';

interface TokenResponse {
  ephemeralKey: string;
  closeToken: string;
  webrtcUrl: string;
  model: string;
  sessionId: string;
  maxDurationSeconds: number;
}

interface Usage {
  inputAudioTokens: number;
  outputAudioTokens: number;
  cachedInputTokens: number;
  textInputTokens: number;
  textOutputTokens: number;
}

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  return typeof value === 'object' && value !== null ? value as JsonRecord : {};
}

function tokenCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.round(value) : 0;
}

interface PortfolioVoiceSessionOptions {
  audioElement: HTMLAudioElement;
  levelRef: { current: number };
  onStateChange: (state: PortfolioVoiceState, endReason?: PortfolioVoiceEndReason) => void;
  onSource: (source: { title: string; url: string }) => void;
  onActivityChange: (activity: 'searching' | 'answering' | null) => void;
  onError: (message: string) => void;
}

const CONNECT_TIMEOUT_MS = 25_000;
const RECONNECT_WINDOW_MS = 4_000;

export class PortfolioVoiceSession {
  private readonly opts: PortfolioVoiceSessionOptions;
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private micStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private token: TokenResponse | null = null;
  private state: PortfolioVoiceState | null = null;
  private disposed = false;
  private muted = false;
  private kickedOff = false;
  private startedAt = 0;
  private startupAbort: AbortController | null = null;
  private connectTimer: number | undefined;
  private durationTimer: number | undefined;
  private reconnectTimer: number | undefined;
  private analyserRaf: number | undefined;
  private audioContext: AudioContext | null = null;
  private micAnalyser: AnalyserNode | null = null;
  private remoteAnalyser: AnalyserNode | null = null;
  private speaking = false;
  private remoteDescriptionReady = false;
  private closeSent = false;
  private failureCategory: string | undefined;
  private usage: Usage = { inputAudioTokens: 0, outputAudioTokens: 0, cachedInputTokens: 0, textInputTokens: 0, textOutputTokens: 0 };

  constructor(options: PortfolioVoiceSessionOptions) { this.opts = options; }

  private setState(next: PortfolioVoiceState, endReason?: PortfolioVoiceEndReason) {
    if (this.state === next) return;
    this.state = next;
    this.opts.onStateChange(next, endReason);
  }

  async start(): Promise<void> {
    this.setState('connecting');
    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (this.disposed) return this.stopTracks(this.micStream);
      this.setupAudioAnalysis();
      this.startupAbort = new AbortController();
      this.connectTimer = window.setTimeout(() => this.fail('Voice setup timed out. Switch to Chat or try again.', 'connection_timeout'), CONNECT_TIMEOUT_MS);

      const tokenResponse = await fetch(`${PORTFOLIO_API}/voice/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientVersion: 'portfolio-web-1' }),
        signal: this.startupAbort.signal,
      });
      if (!tokenResponse.ok) throw new Error('Voice is unavailable right now.');
      this.token = await tokenResponse.json() as TokenResponse;
      if (this.disposed) return;

      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      this.pc = pc;
      this.micStream.getAudioTracks().forEach((track) => { track.enabled = !this.muted; });
      this.micStream.getAudioTracks().forEach((track) => pc.addTrack(track, this.micStream!));
      pc.ontrack = (event) => {
        const stream = event.streams[0] ?? new MediaStream([event.track]);
        this.remoteStream = stream;
        this.opts.audioElement.srcObject = stream;
        void this.opts.audioElement.play().catch(() => {});
        this.connectRemoteAnalyser(stream);
      };
      pc.onconnectionstatechange = () => this.handleConnectionState(pc.connectionState);

      const dc = pc.createDataChannel('oai-events');
      this.dc = dc;
      dc.onopen = () => this.markConnected();
      dc.onmessage = (event) => void this.handleEvent(event.data);
      dc.onerror = () => this.fail('The voice connection encountered an error.', 'data_channel_error');
      dc.onclose = () => this.fail('The voice connection ended unexpectedly.', 'data_channel_closed');

      const offer = await pc.createOffer({ offerToReceiveAudio: true });
      await pc.setLocalDescription(offer);
      if (this.disposed) return;
      const webrtcUrl = new URL(this.token.webrtcUrl);
      webrtcUrl.searchParams.append('model', this.token.model);
      const sdpResponse = await fetch(webrtcUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.token.ephemeralKey}`, 'Content-Type': 'application/sdp' },
        body: offer.sdp ?? '',
        signal: this.startupAbort.signal,
      });
      if (!sdpResponse.ok) throw new Error('The realtime voice connection could not be opened.');
      await pc.setRemoteDescription({ type: 'answer', sdp: await sdpResponse.text() });
      if (this.disposed) return;
      this.remoteDescriptionReady = true;
      this.markConnected();
    } catch (error) {
      if (!this.disposed) {
        const permissionDenied = error instanceof DOMException && ['NotAllowedError', 'SecurityError'].includes(error.name);
        this.fail(
          permissionDenied ? 'Microphone permission was denied. You can continue in Chat.' : error instanceof Error ? error.message : 'Voice could not start.',
          permissionDenied ? 'microphone_denied' : 'setup_failed',
        );
      }
    }
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    this.micStream?.getAudioTracks().forEach((track) => { track.enabled = !this.muted; });
    return this.muted;
  }

  async end(reason: PortfolioVoiceEndReason = 'user_ended'): Promise<void> {
    if (this.disposed) return;
    const finalState: PortfolioVoiceFinalState = reason === 'failed' ? 'failed' : 'ended';
    this.setState(finalState, reason);
    const closeRequest = this.sendClose(reason, finalState);
    this.teardown();
    await closeRequest;
  }

  private kickOff() {
    if (this.kickedOff || this.dc?.readyState !== 'open') return;
    this.kickedOff = true;
    this.send({ type: 'response.create' });
  }

  private markConnected() {
    if (this.disposed || this.startedAt || this.dc?.readyState !== 'open' || !this.remoteDescriptionReady || !this.token) return;
    this.startedAt = performance.now();
    this.setState('listening');
    if (this.connectTimer) window.clearTimeout(this.connectTimer);
    this.durationTimer = window.setTimeout(() => void this.end('duration_cap'), (this.token.maxDurationSeconds || 300) * 1000);
    this.kickOff();
  }

  private send(value: unknown) {
    if (this.dc?.readyState === 'open') this.dc.send(JSON.stringify(value));
  }

  private async handleEvent(raw: unknown) {
    if (typeof raw !== 'string') return;
    let event: JsonRecord;
    try { event = asRecord(JSON.parse(raw)); } catch { return; }
    const type = String(event.type ?? '');
    if (type === 'error') {
      const realtimeError = asRecord(event.error);
      const category = typeof realtimeError.code === 'string' && realtimeError.code
        ? `realtime_${realtimeError.code}`
        : 'realtime_error';
      this.fail('The voice assistant encountered a realtime error.', category);
      return;
    }
    if (type === 'response.function_call_arguments.done' && event.name === 'lookup_portfolio') {
      this.opts.onActivityChange('searching');
      return;
    }
    if (['response.audio.delta', 'response.output_audio.delta', 'output_audio_buffer.started'].includes(type)) {
      this.speaking = true;
      this.opts.onActivityChange('answering');
      this.setState('speaking');
      return;
    }
    if (['response.audio.done', 'response.output_audio.done', 'output_audio_buffer.stopped'].includes(type)) {
      this.speaking = false;
      this.opts.onActivityChange(null);
      this.setState('listening');
      return;
    }
    if (type === 'input_audio_buffer.speech_started') {
      if (!this.speaking) this.setState('listening');
      return;
    }
    if (type === 'response.done') {
      this.opts.onActivityChange(null);
      const response = asRecord(event.response);
      const usage = asRecord(response.usage);
      const inputDetails = asRecord(usage.input_token_details);
      const outputDetails = asRecord(usage.output_token_details);
      this.usage.inputAudioTokens += tokenCount(inputDetails.audio_tokens);
      this.usage.outputAudioTokens += tokenCount(outputDetails.audio_tokens);
      this.usage.cachedInputTokens += tokenCount(inputDetails.cached_tokens);
      this.usage.textInputTokens += tokenCount(inputDetails.text_tokens);
      this.usage.textOutputTokens += tokenCount(outputDetails.text_tokens);
    }
  }

  private handleConnectionState(state: RTCPeerConnectionState) {
    if (this.disposed) return;
    if (state === 'disconnected') {
      this.setState('reconnecting');
      if (this.reconnectTimer) window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = window.setTimeout(() => this.fail('The voice connection dropped.', 'reconnect_timeout'), RECONNECT_WINDOW_MS);
      return;
    }
    if (state === 'connected' && this.state === 'reconnecting') {
      if (this.reconnectTimer) window.clearTimeout(this.reconnectTimer);
      this.setState(this.speaking ? 'speaking' : 'listening');
      return;
    }
    if (state === 'failed' || state === 'closed') this.fail('The voice connection ended unexpectedly.', 'transport_closed');
  }

  private setupAudioAnalysis() {
    if (!this.micStream) return;
    const AudioContextCtor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    this.audioContext = new AudioContextCtor();
    void this.audioContext.resume().catch(() => {});
    this.micAnalyser = this.audioContext.createAnalyser();
    this.micAnalyser.fftSize = 256;
    this.audioContext.createMediaStreamSource(this.micStream).connect(this.micAnalyser);
    const micData = new Uint8Array(this.micAnalyser.frequencyBinCount);
    const remoteData = new Uint8Array(this.micAnalyser.frequencyBinCount);
    const rms = (analyser: AnalyserNode | null, data: Uint8Array) => {
      if (!analyser) return 0;
      analyser.getByteFrequencyData(data as Uint8Array<ArrayBuffer>);
      let sum = 0;
      for (const value of data) sum += (value / 255) ** 2;
      return Math.min(Math.sqrt(sum / data.length) * 4.5, 1);
    };
    const loop = () => {
      this.opts.levelRef.current = this.speaking ? rms(this.remoteAnalyser, remoteData) : rms(this.micAnalyser, micData);
      this.analyserRaf = requestAnimationFrame(loop);
    };
    this.analyserRaf = requestAnimationFrame(loop);
  }

  private connectRemoteAnalyser(stream: MediaStream) {
    if (!this.audioContext) return;
    this.remoteAnalyser = this.audioContext.createAnalyser();
    this.remoteAnalyser.fftSize = 256;
    this.audioContext.createMediaStreamSource(stream).connect(this.remoteAnalyser);
  }

  private async sendClose(reason: PortfolioVoiceEndReason, finalState: PortfolioVoiceFinalState) {
    if (this.closeSent || !this.token) return;
    this.closeSent = true;
    const durationSeconds = this.startedAt ? Math.min(300, Math.max(0, Math.round((performance.now() - this.startedAt) / 1000))) : 0;
    try {
      const pageTeardown = reason === 'page_hidden';
      const response = await fetch(`${PORTFOLIO_API}/voice/close`, {
        method: 'POST',
        headers: { 'Content-Type': pageTeardown ? 'text/plain;charset=UTF-8' : 'application/json' },
        keepalive: pageTeardown,
        body: JSON.stringify({
          sessionId: this.token.sessionId,
          closeToken: this.token.closeToken,
          durationSeconds,
          endReason: reason,
          finalState,
          ...(this.failureCategory ? { failureCategory: this.failureCategory } : {}),
          usage: this.usage,
        }),
      });
      if (response.ok && reason !== 'page_hidden') {
        const body = asRecord(await response.json().catch(() => ({})));
        for (const citation of sanitizePortfolioCitations(body.sources)) this.opts.onSource(citation);
      }
    } catch { /* best effort metadata only */ }
  }

  private fail(message: string, category: string) {
    if (this.disposed) return;
    this.failureCategory = category;
    this.setState('failed', 'failed');
    this.opts.onError(message);
    void this.sendClose('failed', 'failed');
    this.teardown();
  }

  private stopTracks(stream: MediaStream | null) { stream?.getTracks().forEach((track) => track.stop()); }

  teardown() {
    if (this.disposed) return;
    this.disposed = true;
    this.startupAbort?.abort();
    if (this.connectTimer) window.clearTimeout(this.connectTimer);
    if (this.durationTimer) window.clearTimeout(this.durationTimer);
    if (this.reconnectTimer) window.clearTimeout(this.reconnectTimer);
    if (this.analyserRaf) cancelAnimationFrame(this.analyserRaf);
    this.stopTracks(this.micStream);
    this.stopTracks(this.remoteStream);
    this.dc?.close();
    this.pc?.getSenders().forEach((sender) => sender.track?.stop());
    this.pc?.close();
    this.opts.audioElement.pause();
    this.opts.audioElement.srcObject = null;
    void this.audioContext?.close().catch(() => {});
    this.opts.levelRef.current = 0;
    this.opts.onActivityChange(null);
    this.micStream = null;
    this.remoteStream = null;
    this.micAnalyser = null;
    this.remoteAnalyser = null;
    this.audioContext = null;
    this.dc = null;
    this.pc = null;
  }
}
