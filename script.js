/* DARTMOOR interactions — vanilla JavaScript, no dependencies */
(() => {
  'use strict';

  const header = document.querySelector('.site-header');
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.primary-nav');
  const navLinks = nav ? nav.querySelectorAll('a') : [];

  // Header contrast and compact sticky state.
  const updateHeader = () => {
    if (header) header.classList.toggle('scrolled', window.scrollY > 36);
  };
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  // Accessible mobile navigation.
  if (menuToggle && nav) {
    const closeMenu = () => {
      nav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open navigation');
    };
    menuToggle.addEventListener('click', () => {
      const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', String(!isOpen));
      menuToggle.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
      nav.classList.toggle('open', !isOpen);
    });
    navLinks.forEach(link => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        closeMenu();
        menuToggle.focus();
      }
    });
    document.addEventListener('click', event => {
      if (!nav.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 760) closeMenu();
    });
  }

  // Reveal content only when motion is welcome and IntersectionObserver is available.
  const revealItems = document.querySelectorAll('.reveal');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !reducedMotion) {
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          currentObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
    revealItems.forEach(item => observer.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add('is-visible'));
  }

  // Trail finder: each control changes a filter; results update immediately.
  const routeCards = Array.from(document.querySelectorAll('[data-route]'));
  const searchInput = document.getElementById('route-search');
  const filterGroups = Array.from(document.querySelectorAll('[data-filter-group]'));
  const resultCount = document.getElementById('results-count');
  const emptyState = document.getElementById('empty-state');
  const clearButton = document.getElementById('clear-filters');
  const emptyClearButton = document.getElementById('empty-clear');
  const filters = { difficulty: 'all', distance: 'all', landscape: 'all', experience: 'all' };

  const filterRoutes = () => {
    const query = (searchInput?.value || '').trim().toLocaleLowerCase('en-GB');
    let visible = 0;
    routeCards.forEach(card => {
      const text = `${card.dataset.name || ''} ${card.dataset.search || ''} ${card.textContent || ''}`.toLocaleLowerCase('en-GB');
      const matchesQuery = !query || text.includes(query);
      const matchesFilters = Object.entries(filters).every(([key, value]) =>
        value === 'all' || card.dataset[key] === value
      );
      const show = matchesQuery && matchesFilters;
      card.hidden = !show;
      if (show) visible += 1;
    });
    if (resultCount) resultCount.textContent = `Showing ${visible} ${visible === 1 ? 'route idea' : 'route ideas'}`;
    if (emptyState) emptyState.hidden = visible !== 0;
  };

  filterGroups.forEach(group => {
    const key = group.dataset.filterGroup;
    group.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        filters[key] = chip.dataset.value || 'all';
        group.querySelectorAll('.chip').forEach(option => {
          const active = option === chip;
          option.classList.toggle('active', active);
          option.setAttribute('aria-pressed', String(active));
        });
        filterRoutes();
      });
    });
  });
  searchInput?.addEventListener('input', filterRoutes);

  const clearFilters = () => {
    Object.keys(filters).forEach(key => { filters[key] = 'all'; });
    filterGroups.forEach(group => {
      group.querySelectorAll('.chip').forEach(chip => {
        const active = chip.dataset.value === 'all';
        chip.classList.toggle('active', active);
        chip.setAttribute('aria-pressed', String(active));
      });
    });
    if (searchInput) searchInput.value = '';
    filterRoutes();
  };
  clearButton?.addEventListener('click', clearFilters);
  emptyClearButton?.addEventListener('click', clearFilters);
  filterRoutes();

  // An original, illustrative map with linked markers and destination list.
  const places = {
    haytor: { number: '01', name: 'Haytor', description: 'Iconic granite country' },
    princetown: { number: '02', name: 'Princetown', description: 'Wide-open moorland' },
    bellever: { number: '03', name: 'Bellever Forest', description: 'Forest trails & fresh air' },
    wistmans: { number: '04', name: 'Wistman’s Wood', description: 'Ancient oak woodland' }
  };
  const mapCard = document.getElementById('map-card');
  const placeControls = document.querySelectorAll('[data-place]');
  const setPlace = key => {
    const place = places[key];
    if (!place) return;
    placeControls.forEach(control => {
      const selected = control.dataset.place === key;
      control.classList.toggle('selected', selected);
      if (control.classList.contains('map-marker')) {
        if (selected) control.setAttribute('aria-current', 'true');
        else control.removeAttribute('aria-current');
      }
    });
    if (mapCard) {
      mapCard.innerHTML = `<span class="map-card-kicker">DESTINATION ${place.number}</span><h3></h3><p></p><a href="#walks">Find nearby walk ↗</a>`;
      mapCard.querySelector('h3').textContent = place.name;
      mapCard.querySelector('p').textContent = place.description;
    }
  };
  placeControls.forEach(control => control.addEventListener('click', () => setPlace(control.dataset.place)));
  setPlace('haytor');

  // The season photograph has restrained parallax on larger screens only.
  const seasonImage = document.querySelector('.season-image');
  let ticking = false;
  const updateSeason = () => {
    if (!seasonImage || reducedMotion || window.innerWidth < 761) {
      if (seasonImage) seasonImage.style.transform = '';
      ticking = false;
      return;
    }
    const rect = seasonImage.parentElement.getBoundingClientRect();
    if (rect.bottom > 0 && rect.top < window.innerHeight) {
      const offset = Math.max(-22, Math.min(22, (window.innerHeight / 2 - (rect.top + rect.height / 2)) * 0.035));
      seasonImage.style.transform = `scale(1.06) translateY(${offset}px)`;
    }
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(updateSeason);
    }
  }, { passive: true });
  window.addEventListener('resize', updateSeason);
  updateSeason();

  // Demo-only newsletter validation. No email is sent or stored.
  const newsletterForm = document.getElementById('newsletter-form');
  const emailInput = document.getElementById('newsletter-email');
  const formMessage = document.getElementById('form-message');
  newsletterForm?.addEventListener('submit', event => {
    event.preventDefault();
    if (!emailInput || !formMessage) return;
    const email = emailInput.value.trim();
    formMessage.classList.remove('error', 'success');
    if (!email) {
      formMessage.textContent = 'Enter your email address to continue.';
      formMessage.classList.add('error');
      emailInput.focus();
      return;
    }
    if (!emailInput.checkValidity()) {
      formMessage.textContent = 'That email address doesn’t look quite right. Please check it.';
      formMessage.classList.add('error');
      emailInput.focus();
      return;
    }
    formMessage.textContent = 'Thanks — the demo signup worked locally. Connect a newsletter service to collect subscriptions.';
    formMessage.classList.add('success');
    newsletterForm.reset();
  });

  // Keep copyright current.
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  // Avoid broken images leaving empty cards: keep a natural-colour fallback.
  document.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', () => {
      img.classList.add('image-unavailable');
      img.alt = img.alt || 'Image currently unavailable';
      img.style.visibility = 'hidden';
      const parent = img.closest('.route-image, .journal-image, .wild-photo');
      if (parent) parent.style.background = 'linear-gradient(135deg, #dce4d0, #aebfa4)';
    }, { once: true });
  });
})();
