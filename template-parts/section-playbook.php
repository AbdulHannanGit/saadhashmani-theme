<?php
/** The Playbook wheel (topics are built by app.js; a visually hidden list keeps them crawlable). */
defined('ABSPATH') || exit;
$v = $args;
?>
<section id="playbook" data-sec4="true" aria-labelledby="playbook-title" style="position: fixed; inset: 0; z-index: 3; opacity: 0; pointer-events: none; will-change: opacity,transform;">
<div data-pb-cluster="true" style="position: absolute; inset: 0; pointer-events: none; cursor: grab; touch-action: none;"></div>
<div data-pb-heading="true" style="position: absolute; z-index: 1; left: 50%; top: 50%; transform: translate(-50%,-50%); text-align: center; pointer-events: none; opacity: 1; transition: opacity 420ms var(--ease-brand,cubic-bezier(.22,.61,.36,1)),transform 420ms var(--ease-brand,cubic-bezier(.22,.61,.36,1));">

<div data-eyebrow="true" style="font-family: var(--font-mono,monospace); font-weight: 400; font-size: 12px; letter-spacing: .16em; text-transform: uppercase; color: var(--tx-faint,#6b6b73);"><?php echo esc_html($v['playbook']['eyebrow']); ?></div><h2 id="playbook-title" style="margin: 14px 0 0; font-family: var(--font-grotesk,sans-serif); font-weight: 500; font-size: clamp(38px,5vw,76px); line-height: .96; letter-spacing: -.01em; color: var(--tx,#f4f4f5);"><?php echo esc_html($v['playbook']['heading']); ?></h2>
<div data-pb-hover-preview="true" style="position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%) scale(.94); width: 220px; aspect-ratio: 9/16; border-radius: 14px; overflow: hidden; border: 1px solid var(--line-strong,rgba(255,255,255,.14)); box-shadow: 0 30px 70px rgba(0,0,0,.6); opacity: 0; pointer-events: none; z-index: 3; transition: opacity 220ms var(--ease-brand,cubic-bezier(.22,.61,.36,1)),transform 220ms var(--ease-brand,cubic-bezier(.22,.61,.36,1));">
<img data-pb-hover-img="true" alt="" loading="lazy" decoding="async" fetchpriority="low" style="width: 100%; height: 100%; object-fit: cover; display: block; filter: none; transition: filter 200ms;">
<div data-pb-hover-lock="true" style="position: absolute; inset: 0; display: none; align-items: center; justify-content: center; background: rgba(3,4,5,.32);"><span style="display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 999px; border: 1px solid rgba(255,255,255,.5); background: rgba(3,4,5,.5);"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></span></div>
</div>
</div>
<button data-pb-expand="true" type="button" aria-label="<?php echo esc_attr(__('Expand playbook', 'saadhashmani')); ?>" style="position: absolute; z-index: 2; left: clamp(18px,3vw,34px); top: 50%; transform: translateY(-50%) scale(.82); opacity: 0; pointer-events: none; width: 46px; height: 46px; display: flex; align-items: center; justify-content: center; padding: 0; border: 1px solid var(--line-strong,rgba(255,255,255,.14)); border-radius: 999px; background: rgba(3,4,5,.5); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); cursor: pointer; transition: opacity 400ms var(--ease-brand,cubic-bezier(.22,.61,.36,1)),transform 400ms var(--ease-brand,cubic-bezier(.22,.61,.36,1)),box-shadow 260ms var(--ease-brand,cubic-bezier(.22,.61,.36,1));">
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--glow,#f6f5f2)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"></path></svg>
</button>
<div data-pb-card="true" style="position: absolute; z-index: 2; right: clamp(48px,8vw,120px); top: 50%; transform: translateY(-50%) translateX(24px); width: min(270px,24vw); opacity: 0; pointer-events: none; transition: opacity 420ms var(--ease-brand,cubic-bezier(.22,.61,.36,1)),transform 420ms var(--ease-brand,cubic-bezier(.22,.61,.36,1)); display: flex; flex-direction: column; align-items: center; gap: 14px;">
<div data-pb-heading-tr="true" style="text-align: center; pointer-events: none; opacity: 0; transform: translateY(-10px); transition: opacity 420ms var(--ease-brand,cubic-bezier(.22,.61,.36,1)),transform 420ms var(--ease-brand,cubic-bezier(.22,.61,.36,1));">
<h3 style="margin: 0; font-family: var(--font-grotesk,sans-serif); font-weight: 500; font-size: clamp(24px,2.4vw,34px); line-height: 1.02; letter-spacing: -.01em; color: var(--tx,#f4f4f5);"><?php echo esc_html($v['playbook']['heading']); ?></h3>
</div>
<div data-pb-media="true" style="position: relative; width: 100%; aspect-ratio: 9/16; max-height: calc(62*var(--vh,1vh)); border-radius: 18px; overflow: hidden; background: #000; border: 1px solid var(--line,rgba(255,255,255,.08)); box-shadow: 0 30px 70px rgba(0,0,0,.55);">
<img data-pb-media-img="true" alt="" loading="lazy" decoding="async" fetchpriority="low" style="width: 100%; height: 100%; object-fit: cover; display: block; filter: none; transition: filter 200ms;">
<button data-pb-media-play="true" type="button" aria-label="<?php echo esc_attr(__('Play', 'saadhashmani')); ?>" style="position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); width: 62px; height: 62px; border-radius: 999px; border: 1px solid var(--glow,#f6f5f2); background: rgba(3,4,5,.45); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; cursor: pointer; pointer-events: auto;">
<svg data-pb-media-icon="true" width="22" height="22" viewBox="0 0 24 24" fill="var(--glow,#f6f5f2)" stroke="none"><path d="M8 5v14l11-7z"></path></svg>
</button>
<iframe data-pb-media-frame="true" referrerpolicy="strict-origin-when-cross-origin" title="Playbook video" allow="autoplay; encrypted-media; picture-in-picture" style="position: absolute; top: 0; left: 0; width: calc(100% + 20px); height: 100%; border: 0; display: none;"></iframe>
</div>
<a data-pb-cta="true" href="#" style="display: none; align-items: center; gap: 8px; font-family: var(--font-mono,monospace); font-weight: 500; font-size: 11px; letter-spacing: .14em; text-transform: uppercase; white-space: nowrap; color: var(--glow,#f6f5f2); text-decoration: none; padding: 11px 20px; border: 1px solid var(--line-strong,rgba(255,255,255,.14)); border-radius: 999px; width: max-content; pointer-events: auto;"><?php echo esc_html($v['cta']); ?></a>
</div>
<?php if (!empty($v['playbook']['topics'])) : ?>
<ul class="sh-sr"><?php foreach ($v['playbook']['topics'] as $topic) : ?><li><?php echo esc_html($topic); ?></li><?php endforeach; ?></ul>
<?php endif; ?>
</section>
