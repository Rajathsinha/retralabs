(function () {
  const DISMISSED_KEY = 'retralabs_cod_banner_v1';
  if (localStorage.getItem(DISMISSED_KEY)) return;

  const CSS = `
    #cod-banner-wrap {
      position: fixed;
      bottom: 28px;
      left: 50%;
      transform: translateX(-50%) translateY(calc(100% + 40px));
      z-index: 99999;
      width: calc(100vw - 48px);
      max-width: 580px;
      transition: transform 0.75s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
      opacity: 0;
      pointer-events: none;
    }
    #cod-banner-wrap.show {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
      pointer-events: auto;
    }
    #cod-banner-wrap.hide {
      transform: translateX(-50%) translateY(calc(100% + 40px));
      opacity: 0;
      pointer-events: none;
    }
    #cod-banner {
      background: #0A0A0A;
      border-radius: 24px;
      padding: 20px 22px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow:
        0 0 0 1px rgba(0,210,211,0.25),
        0 24px 60px rgba(0,0,0,0.5),
        0 0 80px rgba(0,210,211,0.08);
      position: relative;
      overflow: hidden;
    }
    #cod-banner::before {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse at 10% 50%, rgba(0,210,211,0.07) 0%, transparent 60%),
                  radial-gradient(ellipse at 90% 50%, rgba(0,210,211,0.04) 0%, transparent 60%);
      pointer-events: none;
    }
    .cod-banner-shimmer {
      position: absolute;
      inset: 0;
      background: linear-gradient(105deg, transparent 40%, rgba(0,210,211,0.06) 50%, transparent 60%);
      background-size: 200% 100%;
      animation: cod-shimmer 3s ease-in-out infinite 1.2s;
      pointer-events: none;
    }
    @keyframes cod-shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    .cod-banner-icon {
      flex-shrink: 0;
      width: 48px;
      height: 48px;
      background: rgba(0,210,211,0.12);
      border: 1px solid rgba(0,210,211,0.25);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      position: relative;
    }
    .cod-banner-icon::after {
      content: '';
      position: absolute;
      inset: -3px;
      border-radius: 17px;
      border: 1px solid rgba(0,210,211,0.15);
      animation: cod-pulse 2s ease-in-out infinite;
    }
    @keyframes cod-pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50%       { opacity: 0.4; transform: scale(1.08); }
    }
    .cod-banner-body {
      flex: 1;
      min-width: 0;
    }
    .cod-banner-eyebrow {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 3px;
    }
    .cod-banner-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #00D2D3;
      animation: cod-blink 1.4s ease-in-out infinite;
    }
    @keyframes cod-blink {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.3; }
    }
    .cod-banner-label {
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #00D2D3;
    }
    .cod-banner-title {
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 15px;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #F5F5F7;
      line-height: 1.25;
    }
    .cod-banner-sub {
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 12px;
      font-weight: 400;
      color: rgba(245,245,247,0.45);
      margin-top: 2px;
      line-height: 1.4;
    }
    .cod-banner-cta {
      flex-shrink: 0;
      background: #00D2D3;
      color: #0A0A0A;
      border: none;
      border-radius: 50px;
      padding: 9px 18px;
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.04em;
      cursor: pointer;
      white-space: nowrap;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .cod-banner-cta:hover {
      transform: scale(1.05);
      box-shadow: 0 8px 24px rgba(0,210,211,0.35);
    }
    .cod-banner-close {
      flex-shrink: 0;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 1px solid rgba(255,255,255,0.1);
      background: transparent;
      color: rgba(245,245,247,0.4);
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s, color 0.2s;
      line-height: 1;
    }
    .cod-banner-close:hover {
      background: rgba(255,255,255,0.08);
      color: #F5F5F7;
    }
    .cod-particles {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      pointer-events: none;
      overflow: hidden;
      border-radius: 24px;
    }
    .cod-particle {
      position: absolute;
      width: 3px;
      height: 3px;
      border-radius: 50%;
      background: #00D2D3;
      opacity: 0;
      animation: cod-float var(--dur) ease-in-out var(--delay) infinite;
    }
    @keyframes cod-float {
      0%   { transform: translateY(0) scale(0); opacity: 0; }
      20%  { opacity: 0.6; transform: translateY(-12px) scale(1); }
      100% { transform: translateY(-40px) scale(0.5); opacity: 0; }
    }
    @media (max-width: 480px) {
      #cod-banner-wrap {
        width: calc(100vw - 32px);
        bottom: 16px;
      }
      #cod-banner { padding: 16px 16px; gap: 12px; }
      .cod-banner-cta { display: none; }
    }
  `;

  const PARTICLES = Array.from({ length: 8 }, (_, i) => {
    const left = 8 + (i * 12) % 88;
    const dur = (2.2 + (i * 0.4) % 1.8).toFixed(1);
    const delay = (i * 0.35).toFixed(1);
    return `<div class="cod-particle" style="left:${left}%;bottom:4px;--dur:${dur}s;--delay:${delay}s;"></div>`;
  }).join('');

  const HTML = `
    <div id="cod-banner-wrap" role="status" aria-live="polite">
      <div id="cod-banner">
        <div class="cod-banner-shimmer"></div>
        <div class="cod-particles">${PARTICLES}</div>

        <div class="cod-banner-icon">💸</div>

        <div class="cod-banner-body">
          <div class="cod-banner-eyebrow">
            <div class="cod-banner-dot"></div>
            <span class="cod-banner-label">Just launched</span>
          </div>
          <div class="cod-banner-title">We heard you — COD is here.</div>
          <div class="cod-banner-sub">Cash on delivery now available across India.</div>
        </div>

        <a href="/checkout" class="cod-banner-cta">
          Order now
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6h7M6.5 3l3 3-3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </a>

        <button class="cod-banner-close" aria-label="Dismiss" id="cod-banner-close-btn">✕</button>
      </div>
    </div>
  `;

  function dismiss() {
    const wrap = document.getElementById('cod-banner-wrap');
    if (!wrap) return;
    wrap.classList.remove('show');
    wrap.classList.add('hide');
    localStorage.setItem(DISMISSED_KEY, '1');
    setTimeout(() => wrap.remove(), 800);
  }

  function inject() {
    const styleEl = document.createElement('style');
    styleEl.textContent = CSS;
    document.head.appendChild(styleEl);

    const div = document.createElement('div');
    div.innerHTML = HTML;
    document.body.appendChild(div.firstElementChild);

    document.getElementById('cod-banner-close-btn').addEventListener('click', dismiss);

    // Slide in after short delay
    requestAnimationFrame(() => {
      setTimeout(() => {
        const wrap = document.getElementById('cod-banner-wrap');
        if (wrap) wrap.classList.add('show');
      }, 1200);
    });

    // Auto-dismiss after 10s
    setTimeout(dismiss, 10000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
