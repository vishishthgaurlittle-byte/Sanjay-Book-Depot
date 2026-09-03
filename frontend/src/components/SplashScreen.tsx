'use client';

import { useEffect, useState } from 'react';

import { LogoSeal } from '@/components/Logo';

/**
 * Full-screen launch splash: the SBD seal draws in with a rotating ring,
 * shimmer sweep and progress bar, holds, then fades. Shows once per session
 * (so it behaves like an app launch screen, not on every navigation).
 */
export function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (sessionStorage.getItem('sbd.splash.shown')) return;
    } catch {
      /* ignore */
    }
    setVisible(true);
    const startFade = setTimeout(() => setFading(true), 4300);
    const done = setTimeout(() => {
      setVisible(false);
      try {
        sessionStorage.setItem('sbd.splash.shown', '1');
      } catch {
        /* ignore */
      }
    }, 5000);
    return () => {
      clearTimeout(startFade);
      clearTimeout(done);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden={fading}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.7s ease',
        background: 'radial-gradient(120% 120% at 50% 30%, #1b160d 0%, #0d0b08 60%, #080705 100%)',
      }}
    >
      <style>{`
        @keyframes sbd-pop { 0% { transform: scale(.72); opacity: 0 } 55% { transform: scale(1.04); opacity: 1 } 100% { transform: scale(1); opacity: 1 } }
        @keyframes sbd-spin { to { transform: rotate(360deg) } }
        @keyframes sbd-shimmer { 0% { transform: translateX(-120%) } 100% { transform: translateX(120%) } }
        @keyframes sbd-rise { 0% { transform: translateY(14px); opacity: 0 } 100% { transform: translateY(0); opacity: 1 } }
        @keyframes sbd-bar { 0% { width: 0% } 100% { width: 100% } }
        @keyframes sbd-glow { 0%,100% { opacity:.35 } 50% { opacity:.7 } }
        @keyframes sbd-dot { 0%,80%,100% { opacity:.25; transform: translateY(0) } 40% { opacity:1; transform: translateY(-4px) } }
        .sbd-logo-wrap { animation: sbd-pop 1s cubic-bezier(.2,.8,.25,1) both; position: relative; }
        .sbd-ring { position:absolute; inset:-22px; border-radius:9999px; border:1.5px solid transparent; border-top-color:#C9973F; border-right-color:rgba(201,151,63,.4); animation: sbd-spin 1.6s linear infinite; }
        .sbd-shimmer { position:absolute; inset:0; overflow:hidden; border-radius:9999px; }
        .sbd-shimmer::after { content:''; position:absolute; top:0; bottom:0; width:60%; background:linear-gradient(100deg, transparent, rgba(255,244,214,.5), transparent); animation: sbd-shimmer 1.8s ease-in-out infinite; }
        .sbd-glow { position:absolute; width:280px; height:280px; border-radius:9999px; background:radial-gradient(circle, rgba(201,151,63,.4), transparent 70%); filter:blur(20px); animation: sbd-glow 2.6s ease-in-out infinite; }
        .sbd-title { animation: sbd-rise .8s .5s ease both; }
        .sbd-sub { animation: sbd-rise .8s .8s ease both; }
        .sbd-bar-track { animation: sbd-rise .6s 1s ease both; }
        .sbd-bar-fill { height:100%; border-radius:9999px; background:linear-gradient(90deg,#A87C2A,#E3BE76,#A87C2A); background-size:200% 100%; animation: sbd-bar 4.3s .3s cubic-bezier(.4,0,.2,1) both, sbd-shimmer 1.4s linear infinite; }
        .sbd-dots span { display:inline-block; width:5px; height:5px; margin:0 3px; border-radius:9999px; background:#C9973F; animation: sbd-dot 1.2s infinite ease-in-out; }
        .sbd-dots span:nth-child(2){ animation-delay:.15s } .sbd-dots span:nth-child(3){ animation-delay:.3s }
      `}</style>

      <div className="sbd-glow" />
      <div className="sbd-logo-wrap">
        <div className="sbd-ring" />
        <LogoSeal size={148} />
        <div className="sbd-shimmer" />
      </div>

      <h1 className="sbd-title display mt-10 text-center text-[clamp(1.5rem,6vw,2.4rem)] tracking-[0.04em]" style={{ color: '#F3EBDC' }}>
        Sanjay Book Depot
      </h1>
      <p className="sbd-sub mt-3 text-center text-[10px] uppercase tracking-[0.42em]" style={{ color: '#C9973F' }}>
        Premium Stationery
      </p>

      <div className="sbd-bar-track mt-10 h-[3px] w-[180px] overflow-hidden rounded-full" style={{ background: 'rgba(201,151,63,.18)' }}>
        <div className="sbd-bar-fill" />
      </div>
      <div className="sbd-dots mt-5">
        <span /><span /><span />
      </div>
    </div>
  );
}
