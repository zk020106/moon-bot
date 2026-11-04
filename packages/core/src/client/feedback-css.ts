import { SPRING_SHAPE } from './motion.tsx'

export const FEEDBACK_CSS = `
.bt-fb-what{cursor:default}
.bt-fb-what:hover,.bt-fb-entry:hover,.bt-fb-preview:hover{background:none}
.bt-fb-what .bt-input-area{min-height:80px}
.bt-fb-preview{cursor:default;padding:0}
.bt-fb-preview pre{margin:0;width:100%;max-height:240px;overflow:auto;padding:10px 12px;box-sizing:border-box;font:11px/16px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:var(--bt-ink-2);white-space:pre-wrap;word-break:break-word;outline:none}
.bt-fb-diag{margin:0;width:100%;max-height:240px;overflow:auto;padding:10px 12px;box-sizing:border-box;outline:none}
.bt-fb-diag-table{width:100%;border-collapse:collapse;font-size:12px;line-height:18px;color:var(--bt-ink-2)}
.bt-fb-diag-table th,.bt-fb-diag-table td{padding:4px 8px 4px 0;vertical-align:top;text-align:left;border-bottom:1px solid var(--bt-line,rgba(0,0,0,.08))}
.bt-fb-diag-table th{width:28%;font-weight:600;color:var(--bt-ink);white-space:nowrap;padding-right:12px}
.bt-fb-diag-table td{word-break:break-word}
.bt-fb-diag-rest{margin:10px 0 0;padding:0;font:11px/16px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:var(--bt-ink-2);white-space:pre-wrap;word-break:break-word;background:none;border:0}

.bt-fb-primary{height:28px;border-radius:999px;border:0;background:var(--bt-accent);color:var(--bt-accent-ink,#fff);padding:0 14px;font-size:12px;cursor:pointer;transition:filter .12s ease;flex:none;white-space:nowrap}
.bt-fb-primary:hover{filter:brightness(1.08)}
.bt-fb-primary:active{filter:brightness(.94)}
.bt-fb-note{margin:-8px 4px 0}
.bt-fb-entry{cursor:default;align-items:flex-start}
.bt-fb-dot{flex:none;width:6px;height:6px;border-radius:50%;margin-top:6px;background:var(--bt-danger,#e02135)}
.bt-fb-dot[data-level=warn]{background:#e3a008}
.bt-fb-text{overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;word-break:break-word}
.bt-fb-code{flex:none;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px}
.bt-event-error{color:var(--bt-danger,#e02135)}
.bt-toast{position:fixed;left:50%;bottom:var(--bt-toast-bottom,28px);z-index:1000;display:flex;align-items:center;gap:8px;max-width:min(560px,calc(100vw - 32px));padding:8px 8px 8px 14px;border-radius:12px;background:var(--bt-card,#fff);color:var(--bt-ink,#141414);border:1px solid var(--bt-line-2,rgba(0,0,0,.15));box-shadow:0 8px 28px rgba(0,0,0,.14);font-size:13px;line-height:18px;transform:translateX(-50%);animation:bt-toast-in ${SPRING_SHAPE.duration}ms ${SPRING_SHAPE.easing},bt-veil-in .2s ease-out}
.bt-toast[data-leaving]{opacity:0;transform:translate(-50%,6px) scale(.98);filter:blur(3px);transition:opacity .18s ease-in,transform .18s ease-in,filter .18s ease-in}
.bt-toast-text{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical}
.bt-toast-text::before{content:'';display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--bt-danger,#e02135);margin:0 8px 1px 0}
.bt-toast-link{flex:none;border:0;background:none;color:var(--bt-ink-2);font:inherit;font-size:12px;cursor:pointer;padding:4px 6px;border-radius:6px}
.bt-toast-link:hover{background:var(--bt-hover);color:var(--bt-ink)}
.bt-toast-close{flex:none}
@keyframes bt-toast-in{from{transform:translate(-50%,16px) scale(.94)}}
@media (prefers-reduced-motion:reduce){.bt-toast{animation:none}.bt-toast[data-leaving]{transition:none}}
`
