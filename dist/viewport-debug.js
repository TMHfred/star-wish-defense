/* Opt-in, memory-only viewport evidence. Never sends or persists diagnostics. */
(function () {
  'use strict';
  if (!['localhost', '127.0.0.1', '[::1]'].includes(location.hostname) ||
      !new URLSearchParams(location.search).has('viewportDebug')) return;
  const samples = [];
  function safeArea() {
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
    document.body.appendChild(probe);
    const style = getComputedStyle(probe);
    const insets = { top: style.paddingTop, right: style.paddingRight,
      bottom: style.paddingBottom, left: style.paddingLeft };
    probe.remove();
    return insets;
  }
  const rect = element => {
    if (!element) return null;
    const { x, y, width, height } = element.getBoundingClientRect();
    return { x, y, width, height };
  };
  function capture(reason = 'manual') {
    const scene = window.battle, viewport = window.visualViewport;
    const sample = {
      reason, elapsed: Math.round(performance.now()), safeArea: safeArea(),
      inner: { width: innerWidth, height: innerHeight },
      visual: viewport ? { width: viewport.width, height: viewport.height,
        offsetLeft: viewport.offsetLeft, offsetTop: viewport.offsetTop, scale: viewport.scale } : null,
      standalone: matchMedia('(display-mode: standalone)').matches || navigator.standalone === true,
      portrait: matchMedia('(orientation: portrait)').matches,
      canvas: rect(document.querySelector('#game canvas')),
      buffer: scene ? { width: scene.game.canvas.width, height: scene.game.canvas.height, density: scene.game.renderDensity } : null,
      scale: scene ? { width: scene.scale.width, height: scene.scale.height } : null,
      world: scene ? { x: scene.world.x, y: scene.world.y, scale: scene.worldScale } : null,
      hud: rect(document.getElementById('hud')),
      controls: rect(document.getElementById('battleFoot'))
    };
    samples.push(sample);
    if (samples.length > 120) samples.shift();
    return sample;
  }
  window.viewportDebug = { capture, samples };
  const schedule = event => requestAnimationFrame(() => capture(event.type));
  window.addEventListener('resize', schedule);
  window.addEventListener('orientationchange', schedule);
  window.addEventListener('forest-ready', schedule);
  window.addEventListener('pageshow', schedule);
  window.visualViewport?.addEventListener('resize', schedule);
  window.visualViewport?.addEventListener('scroll', schedule);
  capture('initial');
})();
