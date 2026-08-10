/* ==========================================================================
   JC SOLUCIONES INTEGRALES — SCRIPT
   Módulos: Navbar, Scroll Reveal, Contador, Galería/Lightbox, Testimonios,
   FAQ Accordion, Formulario de contacto, Botón volver arriba.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initYear();
  initNavbar();
  initScrollReveal();
  initCounters();
  initGallery();
  initTestimonials();
  initAccordion();
  initServiceSelect();
  initContactForm();
  initBackToTop();
});

/* ---------- Año dinámico en el footer ---------- */
function initYear() {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

/* ---------- Navbar: scroll + menú móvil ---------- */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('navMenu');

  const onScroll = () => {
    if (window.scrollY > 40) {
      navbar.classList.add('is-scrolled');
    } else {
      navbar.classList.remove('is-scrolled');
    }
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('is-open');
      toggle.classList.toggle('is-active', isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    // Cerrar el menú al elegir un link (mobile)
    menu.querySelectorAll('.navbar__link').forEach((link) => {
      link.addEventListener('click', () => {
        menu.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }
}

/* ---------- Scroll Reveal con Intersection Observer ---------- */
function initScrollReveal() {
  const targets = document.querySelectorAll('[data-reveal]');
  if (!targets.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
  );

  targets.forEach((el) => observer.observe(el));
}

/* ---------- Contador animado (años de trayectoria) ---------- */
function initCounters() {
  const counters = document.querySelectorAll('[data-counter]');
  if (!counters.length) return;

  const animateCounter = (el) => {
    const target = parseInt(el.dataset.counter, 10) || 0;
    const duration = 1400;
    const start = performance.now();

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.6 }
  );

  counters.forEach((el) => observer.observe(el));
}

/* ---------- Galería + Lightbox ---------- */
function initGallery() {
  const items = Array.from(document.querySelectorAll('.gallery__item'));
  const lightbox = document.getElementById('lightbox');
  if (!items.length || !lightbox) return;

  const lightboxImg = document.getElementById('lightboxImg');
  const btnClose = document.getElementById('lightboxClose');
  const btnPrev = document.getElementById('lightboxPrev');
  const btnNext = document.getElementById('lightboxNext');
  let currentIndex = 0;

  const openLightbox = (index) => {
    currentIndex = index;
    const full = items[currentIndex].dataset.full;
    const altText = items[currentIndex].querySelector('img').alt;
    lightboxImg.src = full;
    lightboxImg.alt = altText;
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    btnClose.focus();
  };

  const closeLightbox = () => {
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
  };

  const showRelative = (delta) => {
    currentIndex = (currentIndex + delta + items.length) % items.length;
    lightboxImg.src = items[currentIndex].dataset.full;
    lightboxImg.alt = items[currentIndex].querySelector('img').alt;
  };

  items.forEach((item, index) => {
    item.addEventListener('click', () => openLightbox(index));
  });

  btnClose.addEventListener('click', closeLightbox);
  btnPrev.addEventListener('click', () => showRelative(-1));
  btnNext.addEventListener('click', () => showRelative(1));

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showRelative(-1);
    if (e.key === 'ArrowRight') showRelative(1);
  });
}

/* ---------- Carrusel de testimonios (automático, loop continuo) ---------- */
function initTestimonials() {
  const track = document.getElementById('testimonialsTrack');
  const dotsWrap = document.getElementById('testimonialsDots');
  if (!track || !dotsWrap) return;

  const TRANSITION = 'transform 600ms cubic-bezier(0.4, 0, 0.2, 1)';

  const slides = Array.from(track.children); // tarjetas reales
  const total = slides.length;
  let current = 0;
  let autoplayTimer = null;

  slides.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.setAttribute('aria-label', `Ir al testimonio ${index + 1}`);
    if (index === 0) dot.classList.add('is-active');
    dot.addEventListener('click', () => {
      stopAutoplay();
      goTo(index, true);
      startAutoplay();
    });
    dotsWrap.appendChild(dot);
  });

  const dots = Array.from(dotsWrap.children);

  // Clonamos la primera tarjeta y la agregamos al final: así el slider
  // siempre se desliza hacia adelante y, al llegar a la copia, salta sin
  // transición de vuelta a la tarjeta real #1 (loop continuo, sin saltos
  // hacia atrás visibles).
  const clone = slides[0].cloneNode(true);
  clone.setAttribute('aria-hidden', 'true');
  clone.setAttribute('inert', '');
  track.appendChild(clone);

  function getStep() {
    if (total < 2) return slides[0] ? slides[0].getBoundingClientRect().width : 0;
    return slides[1].getBoundingClientRect().left - slides[0].getBoundingClientRect().left;
  }

  function updateDots(index) {
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === (index % total)));
  }

  function goTo(index, animate) {
    current = index;
    track.style.transition = animate ? TRANSITION : 'none';
    const step = getStep();
    track.style.transform = `translateX(-${index * step}px)`;
    updateDots(index);
  }

  function next() {
    const nextIndex = current + 1;
    goTo(nextIndex, true);

    if (nextIndex === total) {
      const handleEnd = (e) => {
        if (e && e.target !== track) return;
        track.removeEventListener('transitionend', handleEnd);
        if (current !== total) return; // el usuario ya navegó a otro lado
        goTo(0, false);
        track.offsetHeight; // forzar reflow para reactivar la transición
        track.style.transition = TRANSITION;
      };
      track.addEventListener('transitionend', handleEnd);
    }
  }

  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = setInterval(next, 5500);
  }
  function stopAutoplay() {
    if (autoplayTimer) clearInterval(autoplayTimer);
  }

  const wrapper = track.closest('.testimonials__track-wrapper');
  wrapper.addEventListener('mouseenter', stopAutoplay);
  wrapper.addEventListener('mouseleave', startAutoplay);

  window.addEventListener('resize', () => goTo(current, false));

  startAutoplay();
}

/* ---------- FAQ Accordion ---------- */
function initAccordion() {
  const triggers = document.querySelectorAll('.accordion__trigger');
  if (!triggers.length) return;

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const panel = trigger.closest('.accordion__item').querySelector('.accordion__panel');
      const isOpen = trigger.getAttribute('aria-expanded') === 'true';

      // Cerrar todos
      triggers.forEach((t) => {
        t.setAttribute('aria-expanded', 'false');
        t.closest('.accordion__item').querySelector('.accordion__panel').style.maxHeight = null;
      });

      // Abrir el actual si estaba cerrado
      if (!isOpen) {
        trigger.setAttribute('aria-expanded', 'true');
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    });
  });
}

/* ---------- Selector de servicio personalizado (con buscador) ---------- */
function initServiceSelect() {
  const wrap = document.getElementById('ctaSelect');
  const trigger = document.getElementById('ctaServiceTrigger');
  const label = document.getElementById('ctaServiceLabel');
  const panel = document.getElementById('ctaServicePanel');
  const search = document.getElementById('ctaServiceSearch');
  const optionsList = document.getElementById('ctaServiceOptions');
  const empty = document.getElementById('ctaServiceEmpty');
  const nativeSelect = document.getElementById('ctaService');
  if (!wrap || !trigger || !panel || !nativeSelect) return;

  const items = Array.from(optionsList.querySelectorAll('li'));

  function open() {
    panel.hidden = false;
    wrap.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
    search.value = '';
    filterOptions('');
  }

  function close() {
    panel.hidden = true;
    wrap.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
  }

  function toggle() {
    if (panel.hidden) open(); else close();
  }

  function selectValue(value, text) {
    nativeSelect.value = value;
    label.textContent = text;
    trigger.classList.add('has-value');
    items.forEach((li) => li.setAttribute('aria-selected', li.dataset.value === value ? 'true' : 'false'));
    close();
    trigger.focus();
  }

  function filterOptions(query) {
    const normalized = query.trim().toLowerCase();
    let visibleCount = 0;
    items.forEach((li) => {
      const matches = li.textContent.toLowerCase().includes(normalized);
      li.classList.toggle('is-hidden', !matches);
      if (matches) visibleCount++;
    });
    empty.classList.toggle('is-visible', visibleCount === 0);
  }

  trigger.addEventListener('click', toggle);

  items.forEach((li) => {
    li.addEventListener('click', () => selectValue(li.dataset.value, li.textContent));
  });

  search.addEventListener('input', () => filterOptions(search.value));

  document.addEventListener('click', (e) => {
    if (!wrap.contains(e.target)) close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) {
      close();
      trigger.focus();
    }
  });
}

/* ---------- Formulario de contacto (CTA) → WhatsApp ---------- */
function initContactForm() {
  const form = document.getElementById('ctaForm');
  const note = document.getElementById('ctaFormNote');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      note.textContent = 'Por favor completá tu nombre y elegí un servicio.';
      note.style.color = '#c0392b';
      return;
    }

    const data = new FormData(form);
    const name = data.get('name').trim();
    const service = data.get('service');
    const message = data.get('message').trim();

    let text = `Hola, soy ${name}. Quisiera consultar por el servicio de ${service}.`;
    if (message) text += ` ${message}`;

    const whatsappUrl = `https://wa.me/541168822012?text=${encodeURIComponent(text)}`;

    note.textContent = 'Redirigiendo a WhatsApp para enviar tu consulta...';
    note.style.color = '';

    window.open(whatsappUrl, '_blank', 'noopener');
    form.reset();
  });
}

/* ---------- Botón volver arriba ---------- */
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
