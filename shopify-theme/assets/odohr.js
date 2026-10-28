(() => {
  const root = document.querySelector('[data-odohr-home]');
  if (!root) return;
  root.classList.add('odohr-motion');

  const tabs = [...root.querySelectorAll('[data-odohr-tab]')];
  const panels = [...root.querySelectorAll('[data-odohr-panel]')];
  const show = (name, focus = false) => {
    tabs.forEach((tab) => {
      const active = tab.dataset.odohrTab === name;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && focus) tab.focus();
    });
    panels.forEach((panel) => {
      const active = panel.dataset.odohrPanel === name;
      panel.hidden = !active;
      panel.classList.toggle('is-active', active);
    });
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => show(tab.dataset.odohrTab));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 :
        (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      show(tabs[next].dataset.odohrTab, true);
    });
  });

  const progress = root.querySelector('.odohr-progress');
  let ticking = false;
  const updateProgress = () => {
    const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    progress.style.width = `${Math.min(100, Math.max(0, window.scrollY / scrollable * 100))}%`;
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateProgress);
  }, { passive: true });
  updateProgress();

  const reveal = root.querySelectorAll('[data-odohr-reveal]');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    reveal.forEach((item) => item.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return;
        target.classList.add('is-visible');
        observer.unobserve(target);
      });
    }, { threshold: .12 });
    reveal.forEach((item) => observer.observe(item));
  }
})();
