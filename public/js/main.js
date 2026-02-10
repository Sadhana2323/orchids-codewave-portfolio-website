/* ═══════════════════════════════════════════
   CodeWave Technologies - Main JavaScript
   ═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  // ── Navbar scroll effect ──
  const navbar = document.querySelector('.navbar');
  const onScroll = () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ── Scroll reveal (Intersection Observer) ──
  const revealEls = document.querySelectorAll('.scroll-reveal');
  if (revealEls.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(el => observer.observe(el));
  }

  // ── Counter animation for stats ──
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.getAttribute('data-count'), 10);
          const duration = 2000;
          const start = performance.now();

          const animate = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(target * eased);
            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              el.textContent = target;
            }
          };
          requestAnimationFrame(animate);
          counterObserver.unobserve(el);
        }
      });
    }, { threshold: 0.3 });

    counters.forEach(el => counterObserver.observe(el));
  }

  // ── Password strength meter (Signup page) ──
  const passwordInput = document.getElementById('signupPassword');
  const strengthBar = document.querySelector('#strengthBar .bar');
  if (passwordInput && strengthBar) {
    passwordInput.addEventListener('input', () => {
      const val = passwordInput.value;
      let score = 0;
      if (val.length >= 6) score++;
      if (val.length >= 10) score++;
      if (/[A-Z]/.test(val)) score++;
      if (/[0-9]/.test(val)) score++;
      if (/[^A-Za-z0-9]/.test(val)) score++;

      const widths = ['0%', '20%', '40%', '60%', '80%', '100%'];
      const colors = ['#ef4444', '#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a'];
      strengthBar.style.width = widths[score];
      strengthBar.style.background = colors[score];
    });
  }

  // ── Password match check (Signup page) ──
  const confirmInput = document.getElementById('confirmPassword');
  const mismatchMsg = document.getElementById('passwordMismatch');
  if (confirmInput && passwordInput && mismatchMsg) {
    const checkMatch = () => {
      if (confirmInput.value && confirmInput.value !== passwordInput.value) {
        mismatchMsg.classList.remove('d-none');
      } else {
        mismatchMsg.classList.add('d-none');
      }
    };
    confirmInput.addEventListener('input', checkMatch);
    passwordInput.addEventListener('input', checkMatch);
  }

  // ── Signup form validation ──
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      const pw = document.getElementById('signupPassword');
      const cpw = document.getElementById('confirmPassword');
      if (pw && cpw && pw.value !== cpw.value) {
        e.preventDefault();
        if (mismatchMsg) mismatchMsg.classList.remove('d-none');
        cpw.focus();
      }
    });
  }

  // ── Close navbar on mobile link click ──
  const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
  const navCollapse = document.getElementById('navbarNav');
  if (navCollapse) {
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        const bsCollapse = bootstrap.Collapse.getInstance(navCollapse);
        if (bsCollapse) bsCollapse.hide();
      });
    });
  }

  // ── Smooth scroll for anchor links ──
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

});
