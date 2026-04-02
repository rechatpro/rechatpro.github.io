/* ═══════════════════════════════════════════════════════
   ReChat Pro — Landing Page JavaScript
   Form, Supabase, Pixel Tracking, Download, Redirect
   ═══════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // ─── Configuration ───
  const CONFIG = {
    SUPABASE_URL: 'https://anpepmggdidfagwlbzwe.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFucGVwbWdnZGlkZmFnd2xiendlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NDQwMjQsImV4cCI6MjA5MDUyMDAyNH0.nzBzx-no5XDMMe27r0zkw80teev6U2i0dfKxRj-PDXc',
    ZALO_LINK: 'https://zalo.me/0344468240',
    DOWNLOAD_FILE: 'ReChat-Pro-Extension.zip',
    FB_PIXEL_ID: '1360027492809384',
    REDIRECT_DELAY: 3000, // 3 seconds
    TABLE_NAME: 'landing_leads'
  };

  // ─── Supabase Client ───
  let supabase = null;

  function initSupabase() {
    try {
      if (window.supabase && window.supabase.createClient) {
        supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
        console.log('[ReChat] Supabase initialized');
      } else {
        console.warn('[ReChat] Supabase library not loaded');
      }
    } catch (err) {
      console.error('[ReChat] Supabase init error:', err);
    }
  }

  // ─── UTM & Tracking Params ───
  function getTrackingParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get('utm_source') || null,
      utm_medium: params.get('utm_medium') || null,
      utm_campaign: params.get('utm_campaign') || null,
      utm_content: params.get('utm_content') || null,
      utm_term: params.get('utm_term') || null,
      fbclid: params.get('fbclid') || null,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent || null
    };
  }

  // ─── Facebook Pixel Helper ───
  function trackPixelEvent(eventName, data) {
    try {
      if (typeof fbq === 'function') {
        if (['PageView', 'ViewContent', 'Lead', 'Contact'].includes(eventName)) {
          fbq('track', eventName, data || {});
        } else {
          // Custom event (e.g., 'tai-zalo')
          fbq('trackCustom', eventName, data || {});
        }
        console.log('[ReChat] Pixel event:', eventName, data);
      }
    } catch (err) {
      console.error('[ReChat] Pixel error:', err);
    }
  }

  // ═══════════════════════════════════════════════════════
  // MODAL — Lead Form
  // ═══════════════════════════════════════════════════════
  const modal = document.getElementById('lead-modal');
  const form = document.getElementById('lead-form');
  const successView = document.getElementById('lead-success');

  window.openLeadModal = function() {
    if (!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Reset form state
    if (form) {
      form.style.display = '';
      form.reset();
      clearFormErrors();
    }
    if (successView) {
      successView.style.display = 'none';
    }

    // Track Pixel: Lead event when form opens
    trackPixelEvent('Lead', { content_name: 'Download Form' });
  };

  window.closeLeadModal = function() {
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
  };

  // Close modal with Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
      closeLeadModal();
    }
  });

  // ═══════════════════════════════════════════════════════
  // FORM VALIDATION
  // ═══════════════════════════════════════════════════════
  function clearFormErrors() {
    document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
    document.querySelectorAll('.form-control.error').forEach(el => el.classList.remove('error'));
  }

  function setFieldError(fieldId, errorId, message) {
    const field = document.getElementById(fieldId);
    const error = document.getElementById(errorId);
    if (field) field.classList.add('error');
    if (error) error.textContent = message;
  }

  function validateForm() {
    clearFormErrors();
    let isValid = true;

    const name = document.getElementById('lead-name');
    const email = document.getElementById('lead-email');
    const phone = document.getElementById('lead-phone');

    // Name validation
    if (!name || !name.value.trim()) {
      setFieldError('lead-name', 'error-name', 'Vui lòng nhập họ và tên');
      isValid = false;
    } else if (name.value.trim().length < 2) {
      setFieldError('lead-name', 'error-name', 'Họ và tên phải có ít nhất 2 ký tự');
      isValid = false;
    }

    // Email validation (optional — only validate format if provided)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && email.value.trim() && !emailRegex.test(email.value.trim())) {
      setFieldError('lead-email', 'error-email', 'Email không hợp lệ');
      isValid = false;
    }

    // Phone validation (Vietnam phone)
    const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
    const phoneValue = phone ? phone.value.trim().replace(/\s|-/g, '') : '';
    if (!phoneValue) {
      setFieldError('lead-phone', 'error-phone', 'Vui lòng nhập số điện thoại');
      isValid = false;
    } else if (!phoneRegex.test(phoneValue)) {
      setFieldError('lead-phone', 'error-phone', 'Số điện thoại không hợp lệ (VD: 0901234567)');
      isValid = false;
    }

    return isValid;
  }

  // ═══════════════════════════════════════════════════════
  // FORM SUBMISSION
  // ═══════════════════════════════════════════════════════
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();

      if (!validateForm()) return;

      const submitBtn = document.getElementById('btn-submit-lead');
      const btnText = submitBtn ? submitBtn.querySelector('.btn-text') : null;
      const btnLoading = submitBtn ? submitBtn.querySelector('.btn-loading') : null;

      // Show loading state
      if (submitBtn) submitBtn.disabled = true;
      if (btnText) btnText.style.display = 'none';
      if (btnLoading) btnLoading.style.display = 'flex';

      const trackingParams = getTrackingParams();
      const phone = document.getElementById('lead-phone').value.trim().replace(/\s|-/g, '');

      const leadData = {
        full_name: document.getElementById('lead-name').value.trim(),
        email: document.getElementById('lead-email').value.trim(),
        phone: phone,
        need: document.getElementById('lead-need').value || null,
        source: 'landing_page',
        downloaded: true,
        redirected_zalo: true,
        ...trackingParams
      };

      try {
        // Save to Supabase
        if (supabase) {
          const { data, error } = await supabase
            .from(CONFIG.TABLE_NAME)
            .insert([leadData]);

          if (error) {
            console.error('[ReChat] Supabase insert error:', error);
            // Continue with download even if DB fails
          } else {
            console.log('[ReChat] Lead saved successfully');
          }
        } else {
          console.warn('[ReChat] Supabase not available, skipping save');
        }

        // ✅ Fire Facebook Pixel custom event: tai-zalo
        trackPixelEvent('tai-zalo', {
          content_name: 'ReChat Pro',
          content_category: 'Software Download',
          value: 0,
          currency: 'VND'
        });

        // ✅ Trigger download
        triggerDownload();

        // ✅ Show success state
        showSuccessState();

        // ✅ Start countdown and redirect to Zalo
        startZaloRedirect();

      } catch (err) {
        console.error('[ReChat] Submit error:', err);
        // Still trigger download on error
        triggerDownload();
        showSuccessState();
        startZaloRedirect();
      }
    });
  }

  // ─── Download File ───
  function triggerDownload() {
    try {
      const a = document.createElement('a');
      a.href = CONFIG.DOWNLOAD_FILE;
      a.download = CONFIG.DOWNLOAD_FILE;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      console.log('[ReChat] Download triggered:', CONFIG.DOWNLOAD_FILE);
    } catch (err) {
      console.error('[ReChat] Download error:', err);
    }
  }

  // ─── Show Success State ───
  function showSuccessState() {
    if (form) form.style.display = 'none';
    if (successView) successView.style.display = 'block';

    // Animate success icon
    const successIcon = successView ? successView.querySelector('.success-icon') : null;
    if (successIcon) {
      successIcon.style.animation = 'none';
      requestAnimationFrame(() => {
        successIcon.style.animation = 'successBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
      });
    }
  }

  // ─── Countdown & Redirect to Zalo ───
  function startZaloRedirect() {
    const timerEl = document.getElementById('countdown-timer');
    let seconds = Math.floor(CONFIG.REDIRECT_DELAY / 1000);

    if (timerEl) timerEl.textContent = seconds;

    const interval = setInterval(() => {
      seconds--;
      if (timerEl) timerEl.textContent = seconds;

      if (seconds <= 0) {
        clearInterval(interval);
        window.open(CONFIG.ZALO_LINK, '_blank');
      }
    }, 1000);
  }

  // ═══════════════════════════════════════════════════════
  // STICKY HEADER
  // ═══════════════════════════════════════════════════════
  const header = document.getElementById('header');

  function handleScroll() {
    if (!header) return;
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true });

  // ═══════════════════════════════════════════════════════
  // MOBILE MENU
  // ═══════════════════════════════════════════════════════
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const headerNav = document.getElementById('header-nav');

  if (mobileMenuBtn && headerNav) {
    mobileMenuBtn.addEventListener('click', function() {
      this.classList.toggle('active');
      headerNav.classList.toggle('open');
      document.body.style.overflow = headerNav.classList.contains('open') ? 'hidden' : '';
    });

    // Close menu when clicking a nav link
    headerNav.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenuBtn.classList.remove('active');
        headerNav.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // ═══════════════════════════════════════════════════════
  // FAQ ACCORDION
  // ═══════════════════════════════════════════════════════
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', function() {
      const item = this.closest('.faq-item');
      const isActive = item.classList.contains('active');

      // Close all FAQ items
      document.querySelectorAll('.faq-item.active').forEach(activeItem => {
        activeItem.classList.remove('active');
        activeItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      });

      // Toggle current
      if (!isActive) {
        item.classList.add('active');
        this.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // ═══════════════════════════════════════════════════════
  // SCROLL ANIMATIONS — IntersectionObserver
  // ═══════════════════════════════════════════════════════
  function setupScrollAnimations() {
    const animatedElements = document.querySelectorAll('[data-animate]');

    if (!animatedElements.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const delay = entry.target.dataset.delay || 0;
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, parseInt(delay));
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    animatedElements.forEach(el => observer.observe(el));
  }

  // ═══════════════════════════════════════════════════════
  // PIXEL: ViewContent on scroll to pricing
  // ═══════════════════════════════════════════════════════
  function setupPricingPixel() {
    const pricingSection = document.getElementById('pricing');
    if (!pricingSection) return;

    let pricingTracked = false;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !pricingTracked) {
          pricingTracked = true;
          trackPixelEvent('ViewContent', {
            content_name: 'ReChat Pro',
            content_category: 'Software',
            content_type: 'product'
          });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    observer.observe(pricingSection);
  }

  // ═══════════════════════════════════════════════════════
  // PIXEL: Contact event on Zalo link clicks
  // ═══════════════════════════════════════════════════════
  function setupZaloTracking() {
    document.querySelectorAll('a[href*="zalo.me"]').forEach(link => {
      link.addEventListener('click', function() {
        trackPixelEvent('Contact', {
          content_name: 'Zalo Direct',
          content_category: 'Contact'
        });
      });
    });
  }

  // ═══════════════════════════════════════════════════════
  // SMOOTH SCROLL for anchor links
  // ═══════════════════════════════════════════════════════
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ═══════════════════════════════════════════════════════
  // COUNTER ANIMATION — Trusted Bar
  // ═══════════════════════════════════════════════════════
  function setupCounterAnimation() {
    const counters = document.querySelectorAll('.trusted-stat-number[data-count]');
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.count, 10);
          const duration = 2000;
          const start = performance.now();

          function formatNumber(n) {
            if (n >= 1000) return n.toLocaleString('vi-VN');
            return n.toString();
          }

          function animate(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            const current = Math.floor(eased * target);
            el.textContent = formatNumber(current);
            if (progress < 1) requestAnimationFrame(animate);
          }

          requestAnimationFrame(animate);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(c => observer.observe(c));
  }

  // ═══════════════════════════════════════════════════════
  // COUNTDOWN TIMER — Daily Reset
  // ═══════════════════════════════════════════════════════
  function setupCountdown() {
    const hoursEl = document.getElementById('cd-hours');
    const minutesEl = document.getElementById('cd-minutes');
    const secondsEl = document.getElementById('cd-seconds');
    if (!hoursEl || !minutesEl || !secondsEl) return;

    function update() {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      const diff = endOfDay - now;

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      hoursEl.textContent = String(hours).padStart(2, '0');
      minutesEl.textContent = String(minutes).padStart(2, '0');
      secondsEl.textContent = String(seconds).padStart(2, '0');
    }

    update();
    setInterval(update, 1000);
  }

  // ═══════════════════════════════════════════════════════
  // INITIALIZE
  // ═══════════════════════════════════════════════════════
  function init() {
    initSupabase();
    setupScrollAnimations();
    setupCounterAnimation();
    setupCountdown();
    setupPricingPixel();
    setupZaloTracking();
    handleScroll(); // Check initial scroll position

    console.log('[ReChat] Landing page initialized');
    console.log('[ReChat] UTM params:', getTrackingParams());
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
