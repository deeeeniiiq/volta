(() => {
  if (customElements.get('volta-experience')) return;
  class VoltaExperience extends HTMLElement {
    connectedCallback() {
      if (this.controller) return;
      this.controller = new AbortController();
      const { signal } = this.controller;
      this.motion = matchMedia('(prefers-reduced-motion: reduce)');
      const tabs = [...this.querySelectorAll('[data-volta-tab]')];
      const panels = [...this.querySelectorAll('[data-volta-panel]')];
      const select = (index, focus = false) => {
        tabs.forEach((tab, i) => { tab.setAttribute('aria-selected', String(i === index)); tab.tabIndex = i === index ? 0 : -1; });
        panels.forEach((panel, i) => {
          panel.hidden = i !== index;
          if (i === index && !this.motion.matches) panel.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 480, easing: 'cubic-bezier(.2,.7,.2,1)' });
        });
        if (focus) tabs[index].focus();
      };
      tabs.forEach((tab, i) => {
        tab.addEventListener('click', () => select(i), { signal });
        tab.addEventListener('keydown', (event) => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
          event.preventDefault();
          select(event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (i + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length, true);
        }, { signal });
      });
      const reveals = this.querySelectorAll('[data-volta-reveal]');
      if (!this.motion.matches && 'IntersectionObserver' in window) {
        this.classList.add('volta-motion');
        this.observer = new IntersectionObserver(entries => entries.forEach(({ target, isIntersecting }) => {
          if (isIntersecting) { target.classList.add('is-visible'); this.observer.unobserve(target); }
        }), { threshold: .08 });
        reveals.forEach(element => this.observer.observe(element));
      }
      const progress = this.querySelector('.volta-progress');
      const hero = this.querySelector('.volta-stage');
      const photos = this.querySelectorAll('[data-volta-parallax]');
      const update = () => {
        this.frame = 0;
        const ratio = Math.min(1, Math.max(0, scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight)));
        if (progress) progress.style.transform = `scaleX(${ratio})`;
        if (hero && !this.motion.matches) {
          const offset = Math.max(-16, Math.min(16, -hero.getBoundingClientRect().top * .035));
          photos.forEach(photo => { photo.style.translate = `0 ${offset}px`; });
        }
      };
      window.addEventListener('scroll', () => { if (!this.frame) this.frame = requestAnimationFrame(update); }, { passive: true, signal });
      this.motion.addEventListener('change', () => {
        if (this.motion.matches) { this.classList.remove('volta-motion'); photos.forEach(photo => { photo.style.translate = ''; }); }
      }, { signal });
      update();
    }
    disconnectedCallback() {
      this.controller?.abort();
      this.controller = null;
      this.observer?.disconnect();
      cancelAnimationFrame(this.frame);
    }
  }
  customElements.define('volta-experience', VoltaExperience);
})();
