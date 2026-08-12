// PROTOTYPE (throwaway) — three home-page directions, switchable via ?variant=.
// A "The Receipt" · B "The Scale" · C "The Sign". See issue #6. Not for production.
"use client";

import { useEffect } from "react";
import { Archivo, Space_Mono, Zilla_Slab } from "next/font/google";

export type LinkRow = {
  code: string;
  url: string;
  shortUrl: string;
  createdAt: string;
};

export type ShortyProps = {
  url: string;
  onUrl: (v: string) => void;
  submitting: boolean;
  validation: string | null;
  shortUrl: string;
  copied: boolean;
  onCopy: () => void;
  onShorten: (e: React.FormEvent) => void;
  links: LinkRow[] | null;
  linksLoading: boolean;
  linksError: string;
};

const spaceMono = Space_Mono({ weight: ["400", "700"], subsets: ["latin"] });
const archivo = Archivo({ weight: ["400", "700", "900"], subsets: ["latin"] });
const zillaSlab = Zilla_Slab({ weight: ["400", "700"], subsets: ["latin"] });

function codeOf(shortUrl: string): string {
  const trimmed = shortUrl.replace(/\/+$/, "");
  const last = trimmed.slice(trimmed.lastIndexOf("/") + 1);
  return last || shortUrl;
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function VariantA(p: ShortyProps) {
  return (
    <main className={spaceMono.className}>
      <div className="va-board">
        <header className="va-mast">
          <span className="va-brand">SHORTY</span>
          <span className="va-tag">receipt printer for the web</span>
        </header>

        <form className="va-form" onSubmit={p.onShorten}>
          <input
            type="text"
            value={p.url}
            onChange={(e) => p.onUrl(e.target.value)}
            placeholder="paste a long URL…"
            aria-label="URL to shorten"
            spellCheck={false}
            autoComplete="off"
          />
          <button type="submit" className="va-btn" disabled={p.submitting}>
            {p.submitting ? "PRINTING…" : "SHORTEN"}
          </button>
        </form>

        {p.validation && (
          <p className="va-err" role="alert">
            {p.validation}
          </p>
        )}

        {p.shortUrl && (
          <section className="va-ticket" aria-live="polite">
            <div className="va-ticketCode">{codeOf(p.shortUrl)}</div>
            <div className="va-ticketRow">
              <span className="va-tickerUrl">{p.url}</span>
              <button className="va-copy" onClick={p.onCopy}>
                {p.copied ? "COPIED ✓" : "COPY"}
              </button>
            </div>
            <a className="va-ticketOpen" href={p.shortUrl} target="_blank" rel="noreferrer">
              OPEN ↗
            </a>
          </section>
        )}

        <section className="va-tape" aria-label="Recent short links">
          <h2 className="va-tapeHead">{"// RECENTLY PRINTED"}</h2>
          {p.linksLoading &&
            [0, 1, 2].map((i) => <div key={i} className="va-skel" aria-hidden="true" />)}
          {!p.linksLoading && p.linksError && <p className="va-err">{p.linksError}</p>}
          {!p.linksLoading &&
            !p.linksError &&
            p.links &&
            p.links.length === 0 && (
              <p className="va-empty">{"// no receipts yet — your first link prints here."}</p>
            )}
          {!p.linksLoading && p.links && p.links.length > 0 && (
            <ul className="va-rows">
              {p.links.map((l) => (
                <li key={l.code} className="va-row">
                  <a className="va-code" href={l.shortUrl} target="_blank" rel="noreferrer">
                    {l.code}
                  </a>
                  <a className="va-trunc" href={l.url} target="_blank" rel="noreferrer" title={l.url}>
                    {l.url}
                  </a>
                  <time className="va-time" dateTime={l.createdAt}>
                    {fmtTime(l.createdAt)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <style>
        {`
.va-board{max-width:680px;margin:0 auto;padding:28px 20px 100px;color:#1b1b18}
.va-mast{display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap;border-bottom:3px solid #1b1b18;padding-bottom:10px;margin-bottom:22px;font-size:13px}
.va-brand{font-weight:700;font-size:20px;letter-spacing:.12em}
.va-tag{color:#76766e;letter-spacing:.04em}
.va-form{display:flex;gap:8px}
.va-form input{flex:1;min-width:0;font:inherit;font-size:15px;padding:12px 14px;background:#fdfdfb;border:2px solid #1b1b18;border-radius:0;box-shadow:3px 3px 0 #1b1b18;color:#1b1b18}
.va-form input:focus{outline:3px solid #d8382e;outline-offset:1px}
.va-form input::placeholder{color:#88887e}
.va-btn{font:inherit;font-weight:700;letter-spacing:.06em;padding:12px 18px;background:#1b1b18;color:#fafaf7;border:2px solid #1b1b18;box-shadow:3px 3px 0 #1b1b18;cursor:pointer}
.va-btn:active{transform:translate(2px,2px);box-shadow:1px 1px 0 #1b1b18}
.va-btn:disabled{opacity:.6;cursor:progress}
.va-err{font-size:13px;font-weight:700;color:#c42b22;margin:10px 2px 0}
.va-ticket{margin-top:18px;border:2px dashed #1b1b18;background:#fdfdfb;padding:14px 16px;animation:vaIn .25s ease}
@keyframes vaIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
.va-ticketCode{font-size:34px;font-weight:700;letter-spacing:.1em;line-height:1}
.va-ticketRow{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-top:8px}
.va-tickerUrl{color:#76766e;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.va-copy{font-size:12px;font-weight:700;letter-spacing:.08em;border:2px solid #1b1b18;background:#fff;color:#1b1b18;padding:6px 10px;cursor:pointer;box-shadow:2px 2px 0 #1b1b18}
.va-copy:active{transform:translate(1px,1px);box-shadow:0 0 0 #1b1b18}
.va-ticketOpen{display:inline-block;margin-top:10px;font-size:12px;font-weight:700;letter-spacing:.1em;color:#d8382e;text-decoration:underline;text-underline-offset:3px}
.va-tape{margin-top:28px}
.va-tapeHead{font-size:12px;font-weight:400;letter-spacing:.12em;color:#76766e;border-bottom:1px dashed #b9b9ae;padding-bottom:8px}
.va-empty{color:#76766e;font-size:13px;padding:14px 0}
.va-rows{list-style:none;margin:0;padding:0}
.va-row{display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px dashed #d5d5c9;font-size:14px}
.va-row:last-child{border-bottom:none}
.va-code{width:74px;font-weight:700;letter-spacing:.06em;text-decoration:none;color:#d8382e}
.va-trunc{flex:1;color:#1b1b18;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-decoration:none}
.va-trunc:hover{text-decoration:underline}
.va-time{font-size:12px;color:#9b9b90;white-space:nowrap}
.va-skel{height:18px;margin:10px 0;background:repeating-linear-gradient(90deg,#e3e3d8 0 40px,#f4f4ec 40px 80px)}
@media (max-width:560px){.va-form{flex-direction:column}.va-btn{width:100%}}
@media (prefers-reduced-motion: reduce){.va-ticket{animation:none}}
`}
      </style>
    </main>
  );
}

export function VariantB(p: ShortyProps) {
  const len = p.url.length;
  return (
    <main className={archivo.className}>
      <div className="vb-wrap">
        <header className="vb-mast">
          <span className="vb-brand">Shorty</span>
          <span className="vb-tag">makes long links small</span>
        </header>

        <h1 className="vb-h1">
          Hide a whole address
          <br />in <em>six</em> characters.
        </h1>

        <form className="vb-form" onSubmit={p.onShorten}>
          <div className="vb-ruler" aria-hidden="true">
            <span>0</span>
            <span>{Math.max(8, len)}</span>
          </div>
          <input
            type="text"
            className="vb-input"
            value={p.url}
            onChange={(e) => p.onUrl(e.target.value)}
            placeholder="https://www.example.com/a/very/long/path/that/goes/on…"
            aria-label="URL to shorten"
            spellCheck={false}
            autoComplete="off"
          />
          <div className="vb-meta">
            <span className="vb-count">
              {p.url
                ? `${len} characters → shortens to 6`
                : "paste a URL to see the math"}
            </span>
            <button type="submit" className="vb-btn" disabled={p.submitting}>
              {p.submitting ? "Shortening…" : "Shorten it"}
            </button>
          </div>
        </form>

        {p.validation && (
          <p className="vb-err" role="alert">
            {p.validation}
          </p>
        )}

        {p.shortUrl && (
          <section className="vb-result" aria-live="polite">
            <div className="vb-codeWrap">
              <span className="vb-bigcode">{codeOf(p.shortUrl)}</span>
              <button className="vb-copy" onClick={p.onCopy}>
                {p.copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="vb-collapsed">
              <s>{p.url}</s>
            </p>
            <a className="vb-open" href={p.shortUrl} target="_blank" rel="noreferrer">
              Open the short way →
            </a>
          </section>
        )}

        <section className="vb-recent" aria-label="Recent short links">
          <h2 className="vb-h2">Recent links</h2>
          {p.linksLoading && [0, 1, 2].map((i) => <div key={i} className="vb-skel" aria-hidden="true" />)}
          {!p.linksLoading && p.linksError && <p className="vb-err">{p.linksError}</p>}
          {!p.linksLoading &&
            !p.linksError &&
            p.links &&
            p.links.length === 0 && <p className="vb-empty">Nothing shortened yet. Your first link lands here.</p>}
          {!p.linksLoading && p.links && p.links.length > 0 && (
            <ul className="vb-rows">
              {p.links.map((l) => (
                <li key={l.code} className="vb-row">
                  <a className="vb-code" href={l.shortUrl} target="_blank" rel="noreferrer">
                    {l.code}
                  </a>
                  <a className="vb-trunc" href={l.url} target="_blank" rel="noreferrer" title={l.url}>
                    {l.url}
                  </a>
                  <time className="vb-time" dateTime={l.createdAt}>
                    {fmtTime(l.createdAt)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <style>
        {`
.vb-wrap{max-width:720px;margin:0 auto;padding:56px 20px 120px;color:#24211c}
.vb-mast{display:flex;justify-content:space-between;align-items:baseline;font-size:15px;margin-bottom:56px;gap:12px;flex-wrap:wrap}
.vb-brand{font-weight:900;letter-spacing:-.02em;font-size:22px}
.vb-tag{color:#8a8378}
.vb-h1{font-size:52px;line-height:1.03;letter-spacing:-.03em;font-weight:900;margin:0 0 34px}
.vb-h1 em{font-style:normal;color:#b4531d}
.vb-ruler{display:flex;justify-content:space-between;font-size:12px;font-weight:700;color:#b9b1a4;border-top:2px solid #d9d2c4;padding-top:6px;margin-bottom:6px}
.vb-input{width:100%;font:inherit;font-weight:700;font-size:22px;padding:16px 18px;border:2px solid #3a352d;border-radius:14px;background:#fff;color:#24211c}
.vb-input:focus{outline:3px solid #b4531d;outline-offset:2px}
.vb-input::placeholder{color:#cfc6b6;font-weight:400}
.vb-meta{display:flex;justify-content:space-between;align-items:center;margin-top:12px;gap:12px}
.vb-count{font-size:13px;font-weight:700;color:#8a8378}
.vb-btn{font:inherit;font-weight:900;font-size:16px;letter-spacing:.01em;background:#b4531d;color:#fff;border:none;border-radius:12px;padding:12px 26px;cursor:pointer;box-shadow:0 3px 0 #7e3a12}
.vb-btn:active{transform:translateY(2px);box-shadow:0 1px 0 #7e3a12}
.vb-btn:disabled{opacity:.55;cursor:progress}
.vb-err{color:#b3261e;font-size:14px;font-weight:700;margin:10px 2px 0}
.vb-result{margin-top:36px}
.vb-codeWrap{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.vb-bigcode{font-size:64px;font-weight:900;letter-spacing:-.02em;line-height:1;color:#b4531d;animation:vbpop .35s cubic-bezier(.2,1.4,.4,1)}
@keyframes vbpop{from{transform:scale(.82);opacity:0}to{transform:scale(1);opacity:1}}
.vb-copy{font:inherit;font-weight:900;font-size:13px;padding:8px 16px;border:2px solid #24211c;border-radius:999px;background:#fff;color:#24211c;cursor:pointer}
.vb-copy:active{transform:translateY(1px)}
.vb-collapsed{color:#8a8378;font-weight:700;font-size:13px;margin-top:8px}
.vb-open{font-weight:900;font-size:13px;color:#b4531d;text-decoration:underline;text-underline-offset:3px;margin-top:14px;display:inline-block}
.vb-recent{margin-top:56px}
.vb-h2{font-size:12px;letter-spacing:.18em;color:#8a8378;font-weight:700;text-transform:uppercase}
.vb-rows{list-style:none;padding:0;margin:12px 0 0}
.vb-row{display:grid;grid-template-columns:80px 1fr 130px;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid #e3dccb;font-size:14px;font-weight:700}
.vb-code{color:#b4531d;text-decoration:none;letter-spacing:.04em}
.vb-trunc{color:#24211c;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-decoration:none}
.vb-time{font-weight:700;color:#8a8378;font-size:12px;text-align:right}
.vb-empty{color:#8a8378;font-size:14px;font-weight:700;margin-top:14px}
.vb-skel{height:14px;border-radius:7px;background:#e9e2d2;margin:10px 0}
@media (max-width:640px){.vb-wrap{padding:34px 18px 110px}.vb-h1{font-size:38px}.vb-meta{flex-direction:column;align-items:stretch}.vb-btn{width:100%}.vb-row{grid-template-columns:1fr;gap:3px;padding:14px 0}.vb-time{text-align:left}}
@media (prefers-reduced-motion: reduce){.vb-bigcode{animation:none}}
`}
      </style>
    </main>
  );
}

export function VariantC(p: ShortyProps) {
  return (
    <main className={zillaSlab.className}>
      <div className="vc-wrap">
        <header className="vc-signTop">
          <span className="vc-wordmark">URL SHORTENER</span>
          <span className="vc-sub">— THE SHORT WAY</span>
        </header>

        <section className="vc-card">
          <p className="vc-label">POINT ME AT A LONG LINK</p>
          <form className="vc-form" onSubmit={p.onShorten}>
            <input
              type="text"
              className="vc-input"
              value={p.url}
              onChange={(e) => p.onUrl(e.target.value)}
              placeholder="https://…"
              aria-label="URL to shorten"
              spellCheck={false}
              autoComplete="off"
            />
            <button type="submit" className={`vc-press${p.submitting ? " vc-pressDown" : ""}`} disabled={p.submitting}>
              SHORTEN
            </button>
          </form>
          <p className="vc-hint">Works with http:// or https:// links</p>
          {p.validation && (
            <p className="vc-err" role="alert">
              {p.validation}
            </p>
          )}

          {p.shortUrl && (
            <div className="vc-plate" aria-live="polite">
              <span className="vc-plateCode">{codeOf(p.shortUrl)}</span>
              <span className="vc-plateTarget">{p.url}</span>
              <button className="vc-plateCopy" onClick={p.onCopy}>
                {p.copied ? "COPIED ✓" : "COPY"}
              </button>
            </div>
          )}
        </section>

        <section className="vc-recent" aria-label="Recent short links">
          <h2 className="vc-recentHead">ON THIS SIGN</h2>
          {p.linksLoading && [0, 1, 2].map((i) => <div key={i} className="vc-skel" aria-hidden="true" />)}
          {!p.linksLoading && p.linksError && <p className="vc-err">{p.linksError}</p>}
          {!p.linksLoading &&
            !p.linksError &&
            p.links &&
            p.links.length === 0 && <p className="vc-empty">This sign is blank — point it at your first URL above.</p>}
          {!p.linksLoading && p.links && p.links.length > 0 && (
            <ul className="vc-chips">
              {p.links.map((l) => (
                <li key={l.code} className="vc-chip">
                  <span className="vc-chipArrow">→</span>
                  <a className="vc-chipCode" href={l.shortUrl} target="_blank" rel="noreferrer">
                    {l.code}
                  </a>
                  <a className="vc-chipUrl" href={l.url} target="_blank" rel="noreferrer" title={l.url}>
                    {l.url}
                  </a>
                  <time className="vc-chipTime" dateTime={l.createdAt}>
                    {fmtTime(l.createdAt)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <style>
        {`
.vc-wrap{max-width:820px;margin:0 auto;padding:32px 20px 120px;color:#23201c}
.vc-signTop{display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;background:#23201c;color:#f1eee8;padding:14px 20px;border-radius:6px;box-shadow:0 4px 0 #4a4640;margin-bottom:34px}
.vc-wordmark{font-weight:700;letter-spacing:.14em;font-size:17px}
.vc-sub{font-weight:400;font-size:12px;letter-spacing:.2em;color:#f1a24a}
.vc-card{background:#f1eee8;border:3px solid #23201c;border-radius:10px;box-shadow:8px 8px 0 rgba(35,32,28,.9);padding:26px 26px 30px}
.vc-label{font-weight:700;letter-spacing:.14em;font-size:12px;color:#6b6560;margin:0 0 12px}
.vc-form{display:flex;gap:12px}
.vc-input{flex:1;min-width:0;font:inherit;font-size:18px;padding:14px 16px;border:3px solid #23201c;border-radius:8px;background:#fff;color:#23201c}
.vc-input:focus{outline:4px solid #e85d2f;outline-offset:2px}
.vc-input::placeholder{color:#a09a93}
.vc-press{font:inherit;font-weight:700;letter-spacing:.06em;background:#e85d2f;color:#fff;border:3px solid #23201c;border-radius:8px;padding:14px 22px;cursor:pointer;box-shadow:0 5px 0 #23201c;text-shadow:0 2px 0 rgba(0,0,0,.25);transition:transform .06s ease,box-shadow .06s ease}
.vc-press:hover{transform:translateY(-1px);box-shadow:0 6px 0 #23201c}
.vc-pressDown,.vc-press:active{transform:translateY(4px);box-shadow:0 1px 0 #23201c}
.vc-press:disabled{opacity:.7;cursor:progress}
.vc-hint{font-size:12px;color:#8a837c;margin:10px 2px 0}
.vc-err{font-weight:700;color:#a82f0e;font-size:14px;margin:10px 2px 0}
.vc-plate{margin-top:20px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;background:#ffd029;color:#23201c;border:3px solid #23201c;border-radius:6px;padding:12px 16px;box-shadow:4px 4px 0 #23201c;animation:vcIn .25s ease}
@keyframes vcIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
.vc-plateCode{font-weight:700;font-size:34px;letter-spacing:.04em}
.vc-plateTarget{flex:1;min-width:100%;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;opacity:.75}
.vc-plateCopy{font:inherit;font-weight:700;border:2px solid #23201c;background:#23201c;color:#ffd029;border-radius:6px;padding:8px 14px;cursor:pointer}
.vc-plateCopy:active{transform:translateY(2px)}
.vc-recent{margin-top:38px}
.vc-recentHead{font-weight:700;letter-spacing:.18em;font-size:12px;color:#6b6560}
.vc-chips{list-style:none;padding:0;margin:14px 0 0;display:flex;flex-direction:column;gap:10px}
.vc-chip{display:flex;align-items:center;gap:10px;background:#fff;border:2px solid #23201c;border-radius:8px;padding:10px 14px;box-shadow:3px 3px 0 rgba(35,32,28,.85);font-size:14px}
.vc-chipCode{font-weight:700;color:#e85d2f;text-decoration:none;letter-spacing:.04em}
.vc-chipUrl{flex:1;min-width:0;color:#23201c;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-decoration:none}
.vc-chipUrl:hover{text-decoration:underline}
.vc-chipArrow{color:#6b6560;font-size:12px}
.vc-chipTime{font-size:12px;color:#8a837c;white-space:nowrap}
.vc-empty{font-size:14px;font-weight:700;color:#6b6560;margin-top:14px}
.vc-skel{height:34px;border:2px dashed #b9b1a8;border-radius:8px;margin-bottom:10px}
@media (max-width:600px){.vc-signTop{flex-direction:column;align-items:flex-start}.vc-form{flex-direction:column}.vc-press{width:100%}.vc-chipUrl{order:3;flex-basis:100%}}
@media (prefers-reduced-motion: reduce){.vc-plate{animation:none}}
`}
      </style>
    </main>
  );
}

const VARIANTS = [
  { key: "A", name: "The Receipt · Shorty" },
  { key: "B", name: "The Scale · Shorty" },
  { key: "C", name: "The Sign · URL Shortener" },
] as const;

export function PrototypeSwitcher({
  current,
  onChange,
}: {
  current: string;
  onChange: (v: string) => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      const i = VARIANTS.findIndex((v) => v.key === current);
      if (i === -1) return;
      if (e.key === "ArrowLeft") onChange(VARIANTS[(i + VARIANTS.length - 1) % VARIANTS.length].key);
      else if (e.key === "ArrowRight") onChange(VARIANTS[(i + 1) % VARIANTS.length].key);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, onChange]);

  if (process.env.NODE_ENV === "production") return null;

  const i = Math.max(0, VARIANTS.findIndex((v) => v.key === current));
  const cur = VARIANTS[i];
  const prev = VARIANTS[(i + VARIANTS.length - 1) % VARIANTS.length];
  const next = VARIANTS[(i + 1) % VARIANTS.length];

  return (
    <div className="pswitch">
      <button aria-label="Previous variant" onClick={() => onChange(prev.key)}>
        ←
      </button>
      <span className="pswitch-label">
        <strong>{cur.key}</strong> — {cur.name}
      </span>
      <button aria-label="Next variant" onClick={() => onChange(next.key)}>
        →
      </button>
      <style>
        {`
.pswitch{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);display:flex;align-items:center;gap:10px;background:#111;color:#fff;border:1px solid #fff;border-radius:999px;padding:8px 14px;z-index:99;font-family:system-ui,ui-sans-serif,sans-serif;font-size:13px;box-shadow:0 6px 24px rgba(0,0,0,.4)}
.pswitch button{background:#fff;color:#111;border:none;border-radius:999px;width:30px;height:30px;font-size:15px;cursor:pointer;font-weight:700}
.pswitch-label{white-space:nowrap}
`}
      </style>
    </div>
  );
}
