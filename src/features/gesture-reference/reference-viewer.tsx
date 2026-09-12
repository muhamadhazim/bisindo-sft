"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { Component, useEffect, useState, type ReactNode } from "react";
import type { GestureReference } from "./types";

const Scene = dynamic(() => import("./reference-scene"), { ssr: false, loading: () => <p role="status">Menyiapkan karakter 3D…</p> });

class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export function ReferenceViewer({ pose }: { pose: GestureReference }) {
  const [enabled, setEnabled] = useState(false);
  const [failed, setFailed] = useState(false);
  const [angle, setAngle] = useState(0);
  const [revision, setRevision] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => {
    const visibility = () => { if (document.hidden) setEnabled(false); };
    document.addEventListener("visibilitychange", visibility);
    return () => document.removeEventListener("visibilitychange", visibility);
  }, []);
  const poster = imageFailed ? <p role="status">Contoh belum dapat dimuat. Muat ulang halaman untuk mencoba lagi.</p> : <Image src={pose.posterUrl} alt={`Karakter tangan Sinyal, contoh bentuk ${pose.symbol}`} width={480} height={390} unoptimized onError={() => setImageFailed(true)} />;
  function start() {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2");
    if (!context) { setFailed(true); return; }
    context.getExtension("WEBGL_lose_context")?.loseContext();
    setFailed(false);
    setEnabled(true);
  }
  return <section className="gesture-reference" aria-label={`Contoh karakter huruf ${pose.symbol}`}>
    <div className="gesture-stage">
      {enabled && !failed ? <SceneBoundary key={revision} fallback={poster} onFailure={() => { setFailed(true); setEnabled(false); }}><Scene pose={pose} angle={angle} fail={() => { setFailed(true); setEnabled(false); }} /></SceneBoundary> : poster}
    </div>
    <div className="actions">
      {!enabled ? <button className="button secondary" onClick={start}>Lihat karakter 3D</button> : <>
        <button className="button secondary" onClick={() => { setAngle(0); setRevision(v => v + 1); }}>Reset sudut</button>
        <button className="button secondary" onClick={() => setAngle(-.3)}>Sudut kiri</button>
        <button className="button secondary" onClick={() => setAngle(.3)}>Sudut kanan</button>
        <button className="button secondary" onClick={() => setEnabled(false)}>Gunakan gambar 2D</button>
      </>}
    </div>
    {failed && <p role="status">3D belum tersedia di perangkat ini. Contoh 2D tetap dapat dipelajari.</p>}
    <p className="camera-note">{pose.requiredHands === "TWO" ? "Dua tangan" : "Satu tangan"} · Contoh karakter orisinal. Sudut depan mengikuti foto sumber; kedalaman hanya perkiraan visual.</p>
    <p className="notice">{pose.limitation}</p>
  </section>;
}
