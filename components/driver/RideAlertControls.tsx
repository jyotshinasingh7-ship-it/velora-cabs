"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { BellRing, Volume2, VolumeX } from "lucide-react";

export interface RideAlertHandle { stop: () => void; }
interface Props { rideId: string; shouldAlert: boolean; }
const ENABLED_KEY = "veloraRideAlertsEnabled";
const SOUND_KEY = "veloraRideAlertSound";

const RideAlertControls = forwardRef<RideAlertHandle, Props>(function RideAlertControls({ rideId, shouldAlert }, ref) {
  const [enabled, setEnabled] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [status, setStatus] = useState("");
  const encodedAudioRef = useRef("");
  const contextRef = useRef<AudioContext | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const alertRideRef = useRef("");
  const startingRef = useRef(false);
  const generationRef = useRef(0);

  const stop = useCallback(() => {
    generationRef.current += 1;
    startingRef.current = false;
    const source = sourceRef.current;
    sourceRef.current = null;
    alertRideRef.current = "";
    if (source) { try { source.stop(); } catch { /* already stopped */ } source.disconnect(); }
  }, []);

  useImperativeHandle(ref, () => ({ stop }), [stop]);

  useEffect(() => {
    setEnabled(window.localStorage.getItem(ENABLED_KEY) === "true");
    setSoundOn(window.localStorage.getItem(SOUND_KEY) !== "false");
    void fetch("/audio/ride-alert.wav.base64", { cache: "force-cache" }).then(response => {
      if (!response.ok) throw new Error("Ride alert sound file is unavailable.");
      return response.text();
    }).then(value => { encodedAudioRef.current = value.trim(); }).catch(() => setStatus("Ride alert sound could not be loaded."));
    return () => {
      stop();
      const context = contextRef.current;
      contextRef.current = null;
      if (context) void context.close();
    };
  }, [stop]);

  const prepareAudio = useCallback(async () => {
    let context = contextRef.current;
    if (!context) { context = new AudioContext(); contextRef.current = context; }
    if (context.state === "suspended") await context.resume();
    if (!bufferRef.current) {
      if (!encodedAudioRef.current) {
        const response = await fetch("/audio/ride-alert.wav.base64", { cache: "force-cache" });
        if (!response.ok) throw new Error("Ride alert sound file is unavailable.");
        encodedAudioRef.current = (await response.text()).trim();
      }
      const binary = window.atob(encodedAudioRef.current);
      const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
      bufferRef.current = await context.decodeAudioData(bytes.buffer.slice(0));
    }
    return context;
  }, []);

  const play = useCallback(async (key: string, testOnly = false) => {
    if (startingRef.current || sourceRef.current || (!testOnly && alertRideRef.current === key)) return;
    startingRef.current = true;
    const generation = generationRef.current;
    try {
      const context = await prepareAudio();
      if (generation !== generationRef.current) return;
      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = bufferRef.current;
      source.loop = true;
      gain.gain.setValueAtTime(0, context.currentTime);
      const cycles = testOnly ? 1 : 60;
      for (let index = 0; index < cycles; index += 1) {
        const start = context.currentTime + index * 0.65;
        gain.gain.setValueAtTime(0.08, start);
        gain.gain.setValueAtTime(0, start + 0.28);
      }
      source.connect(gain); gain.connect(context.destination);
      sourceRef.current = source;
      alertRideRef.current = key;
      source.onended = () => { if (sourceRef.current === source) sourceRef.current = null; source.disconnect(); gain.disconnect(); };
      source.start();
      if (testOnly) window.setTimeout(() => { if (sourceRef.current === source) stop(); }, 650);
      setStatus("");
    } catch {
      stop();
      setStatus("Tap Enable Ride Alerts to allow sound in this browser.");
    } finally {
      startingRef.current = false;
    }
  }, [prepareAudio, stop]);

  useEffect(() => {
    if (!enabled || !soundOn || !shouldAlert || !rideId) { stop(); return; }
    void play(rideId);
    return stop;
  }, [enabled, play, rideId, shouldAlert, soundOn, stop]);

  async function toggleEnabled() {
    const next = !enabled;
    setEnabled(next); window.localStorage.setItem(ENABLED_KEY, String(next));
    if (!next) { stop(); setStatus("Ride alert sounds are disabled."); return; }
    try { await prepareAudio(); setStatus("Ride alerts enabled."); if (soundOn && shouldAlert && rideId) void play(rideId); } catch { setStatus("This browser blocked audio. Try Test Sound again."); }
  }
  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next); window.localStorage.setItem(SOUND_KEY, String(next));
    if (!next) { stop(); setStatus("Ride alert sound is off."); }
    else { setStatus("Ride alert sound is on."); if (enabled && shouldAlert && rideId) void play(rideId); }
  }
  async function testSound() {
    try { stop(); await prepareAudio(); await play("test", true); setStatus("Playing test alert."); window.setTimeout(() => { if (enabled && soundOn && shouldAlert && rideId) void play(rideId); }, 750); } catch { setStatus("This browser blocked audio. Tap Enable Ride Alerts first."); }
  }

  return <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => void toggleEnabled()} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${enabled ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-400 text-black"}`}><BellRing size={17} />{enabled ? "Ride Alerts Enabled" : "Enable Ride Alerts"}</button>
      <button type="button" onClick={toggleSound} aria-pressed={soundOn} className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/65 hover:border-amber-400/30">{soundOn ? <Volume2 size={17} /> : <VolumeX size={17} />}{soundOn ? "Sound On" : "Sound Off"}</button>
      <button type="button" onClick={() => void testSound()} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/65 hover:border-amber-400/30">Test Sound</button>
    </div>
    {status && <p role="status" className="mt-2 text-xs text-white/45">{status}</p>}
  </div>;
});

export default RideAlertControls;
