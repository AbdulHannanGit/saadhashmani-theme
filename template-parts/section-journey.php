<?php
/** The Record / Journey: stats and timeline (timeline items are built by app.js). */
defined('ABSPATH') || exit;
$v = $args;
?>
<section id="journey" data-sec2="true" aria-labelledby="journey-title" style="position: fixed; inset: 0; z-index: 3; pointer-events: none; opacity: 0; will-change: opacity,transform;">

<div style="position: absolute; top: clamp(64px,10vh,112px); left: 0; right: 0; display: flex; flex-direction: column; align-items: center; gap: clamp(30px,4.4vh,52px); padding: 0 clamp(20px,6vw,110px);">

<div style="text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px;"><div data-eyebrow="true" style="font-family: var(--font-mono,monospace); font-weight: 400; font-size: 12px; letter-spacing: .16em; text-transform: uppercase; color: var(--tx-faint,#6b6b73);"><?php echo esc_html($v['record']['eyebrow']); ?></div><h2 id="journey-title" style="margin: 0; font-family: var(--font-grotesk,sans-serif); font-weight: 500; text-transform: none; font-size: clamp(34px,4.6vw,68px); line-height: .96; letter-spacing: -.01em; color: var(--tx,#f4f4f5); text-shadow: 0 0 48px var(--glow-soft,rgba(246,245,242,.14));"><?php echo esc_html($v['record']['heading']); ?></h2></div><div style="display: flex; justify-content: center; align-items: stretch; flex-wrap: wrap; gap: clamp(8px,1vw,16px); width: 100%; max-width: 1120px;">
<?php foreach ($v['record']['stats'] as $si => $stat) : ?>
<div style="position: relative; flex: 1 1 0; min-width: 130px; text-align: center; padding: 0 clamp(14px,2vw,30px);<?php if ($si > 0) echo ' border-left: 1px solid var(--line,rgba(255,255,255,.08));'; ?>">
<div style="font-family: var(--font-grotesk,sans-serif); font-weight: 500; font-variant-numeric: tabular-nums; font-size: clamp(38px,3.8vw,60px); line-height: 1; letter-spacing: -.01em; color: var(--glow,#f6f5f2); text-shadow: 0 0 40px var(--glow-soft,rgba(246,245,242,.14));"><?php echo esc_html($stat['value']); ?></div>
<div style="margin-top: 12px; font-family: var(--font-mono,monospace); font-weight: 400; font-size: 11px; letter-spacing: .16em; text-transform: uppercase; color: var(--tx-muted,#a1a1aa);"><?php echo esc_html($stat['label']); ?></div>
</div>
<?php endforeach; ?>
</div>
</div>

<div data-tl="true" aria-label="<?php echo esc_attr(__('Timeline', 'saadhashmani')); ?>" style="position: absolute; left: 0; right: 0; bottom: clamp(28px,5vh,52px); pointer-events: none;">
<div style="position: relative;">
<div data-tl-viewport="true" style="position: relative; width: 100%; overflow: hidden; pointer-events: auto; cursor: grab; touch-action: pan-y;">
<div data-tl-track="true" style="position: relative; width: 2280px; height: 270px; will-change: transform;"></div>
</div>
<div style="position: absolute; left: 0; top: 0; bottom: 0; width: clamp(48px,9vw,150px); pointer-events: none; z-index: 6; background: linear-gradient(90deg,var(--bg,#0b0b0c),rgba(11,11,12,0));"></div>
<div style="position: absolute; right: 0; top: 0; bottom: 0; width: clamp(48px,9vw,150px); pointer-events: none; z-index: 6; background: linear-gradient(270deg,var(--bg,#0b0b0c),rgba(11,11,12,0));"></div>
</div>
</div>

</section>

<div data-tl-modal="true" style="position: fixed; inset: 0; z-index: 60; display: none; opacity: 0; transition: opacity .32s cubic-bezier(.16,1,.3,1); align-items: center; justify-content: center; padding: clamp(18px,5vw,70px); pointer-events: auto;">
<div data-tl-modal-scrim="true" style="position: absolute; inset: 0; background: rgba(6,6,8,.58); -webkit-backdrop-filter: blur(16px) saturate(1.05); backdrop-filter: blur(16px) saturate(1.05);"></div>
<div data-tl-modal-card="true" style="position: relative; display: grid; grid-template-columns: 1.02fr 1fr; width: min(940px,100%); height: min(520px,82vh); border: 1px solid var(--line-strong,rgba(255,255,255,.14)); border-radius: 16px; overflow: hidden; background: rgba(16,16,19,.5); -webkit-backdrop-filter: blur(22px) saturate(1.1); backdrop-filter: blur(22px) saturate(1.1); box-shadow: 0 50px 130px rgba(0,0,0,.62); transform: scale(.985); transition: transform .32s cubic-bezier(.16,1,.3,1);">
<div style="position: relative; overflow: hidden; background: var(--bg-inset,#08080a);">
<img data-tl-modal-img="true" alt="" loading="lazy" decoding="async" fetchpriority="low" style="width: 100%; height: 100%; object-fit: cover; display: block;">
<div style="position: absolute; inset: 0; pointer-events: none; background: linear-gradient(90deg,transparent 58%,rgba(16,16,19,.55));"></div>
</div>
<div style="position: relative; display: flex; flex-direction: column; gap: clamp(12px,1.8vh,20px); padding: clamp(26px,3.2vw,46px); overflow: auto;">
<div data-tl-modal-ey="true" style="font-family: var(--font-mono,monospace); font-size: 11px; letter-spacing: .18em; text-transform: uppercase; color: var(--tx-faint,#6b6b73);"></div>
<h3 data-tl-modal-title="true" style="margin: 0; font-family: var(--font-grotesk,sans-serif); font-weight: 500; font-size: clamp(28px,3vw,44px); line-height: 1.02; letter-spacing: -.01em; color: var(--glow,#f6f5f2); text-shadow: 0 0 44px var(--glow-soft,rgba(246,245,242,.14));"></h3>
<p data-tl-modal-body="true" style="margin: 0; font-family: var(--font-body,sans-serif); font-size: 15px; line-height: 1.6; color: var(--tx-muted,#a1a1aa); text-wrap: pretty;"></p>
<a data-tl-modal-cta="true" href="#" style="display: none; align-items: center; gap: 8px; width: max-content; font-family: var(--font-mono,monospace); font-weight: 500; font-size: 11px; letter-spacing: .14em; text-transform: uppercase; white-space: nowrap; color: var(--glow,#f6f5f2); text-decoration: none; padding: 11px 20px; border: 1px solid var(--line-strong,rgba(255,255,255,.14)); border-radius: 999px;"><?php echo esc_html($v['cta']); ?></a>
<div style="margin-top: auto; padding-top: 18px; border-top: 1px solid var(--line,rgba(255,255,255,.08)); display: flex; justify-content: space-between; gap: 12px; font-family: var(--font-mono,monospace); font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: var(--tx-faint,#6b6b73);"><span data-tl-modal-idx="true"></span><span data-tl-modal-tag="true"></span></div>
</div>
<button data-tl-modal-close="true" type="button" aria-label="<?php echo esc_attr(__('Close', 'saadhashmani')); ?>" style="position: absolute; top: 14px; right: 14px; z-index: 2; width: 34px; height: 34px; border-radius: 999px; border: 1px solid var(--line-strong,rgba(255,255,255,.14)); background: rgba(11,11,12,.55); -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); color: var(--tx,#f4f4f5); font-size: 15px; line-height: 1; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background .3s,transform .3s;">✕</button>
</div>
</div>
