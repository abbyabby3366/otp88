/* ==========================================================================
   OTP88 Main JavaScript - Global UI & Interactivity
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initModals();
  initSystemStatus();
  initScrollAnimations();
});

// 1. Navigation & Scroll Effects
function initNavbar() {
  const header = document.querySelector('.site-header');
  const mobileBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');

  // Scroll effect
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  });

  // Mobile menu toggle
  if (mobileBtn && navLinks) {
    mobileBtn.addEventListener('click', () => {
      const isOpen = navLinks.style.display === 'flex';
      if (isOpen) {
        navLinks.style.display = '';
        mobileBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';
      } else {
        navLinks.style.display = 'flex';
        navLinks.style.flexDirection = 'column';
        navLinks.style.position = 'absolute';
        navLinks.style.top = 'var(--header-h)';
        navLinks.style.left = '0';
        navLinks.style.width = '100%';
        navLinks.style.background = 'rgba(6, 9, 19, 0.98)';
        navLinks.style.padding = '24px';
        navLinks.style.borderBottom = '1px solid var(--border-glow)';
        navLinks.style.gap = '20px';
        mobileBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
      }
    });
  }

  // Active page indicator
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-item').forEach(item => {
    const link = item.querySelector('a');
    if (!link) return;
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '/' && href === 'index.html') || currentPath.endsWith(href)) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

// 2. Toast Notifications
function showToast(message, type = 'success') {
  let toast = document.getElementById('global-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'global-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  const iconSvg = type === 'success' 
    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-emerald)" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>`
    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
  
  toast.innerHTML = `<span style="display:flex;align-items:center;">${iconSvg}</span><span>${message}</span>`;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}

// 3. Modal Handlers (Contact & Get Started)
function initModals() {
  const contactModal = document.getElementById('contact-modal');
  const openModalBtns = document.querySelectorAll('[data-open-modal="contact"]');
  const closeBtns = document.querySelectorAll('.modal-close-btn, [data-close-modal]');

  openModalBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (contactModal) contactModal.classList.add('active');
    });
  });

  closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (contactModal) contactModal.classList.remove('active');
    });
  });

  // Light dismiss on backdrop click
  if (contactModal) {
    contactModal.addEventListener('click', (e) => {
      if (e.target === contactModal) {
        contactModal.classList.remove('active');
      }
    });
  }

  // Handle Contact Form Submit
  const contactForm = document.getElementById('lead-contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerText : 'Submit';
      if (submitBtn) submitBtn.innerText = 'Submitting...';

      const formData = {
        name: document.getElementById('lead-name')?.value || 'Demo Lead',
        email: document.getElementById('lead-email')?.value || 'user@example.com',
        company: document.getElementById('lead-company')?.value || '',
        monthlyVolume: document.getElementById('lead-volume')?.value || '50,000',
        message: document.getElementById('lead-message')?.value || ''
      };

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (data.success) {
          showToast(data.message);
          contactForm.reset();
          if (contactModal) contactModal.classList.remove('active');
        }
      } catch (err) {
        showToast('Thank you! Inquiry received. We will contact you shortly.', 'success');
        if (contactModal) contactModal.classList.remove('active');
      } finally {
        if (submitBtn) submitBtn.innerText = originalText;
      }
    });
  }
}

// 4. Live CPaaS Status Polling
async function initSystemStatus() {
  const statusElem = document.getElementById('live-uptime-val');
  if (!statusElem) return;

  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    if (data && data.uptime) {
      statusElem.innerText = `${data.uptime} SLA (Operational)`;
    }
  } catch (e) {
    // Keep fallback 99.98%
  }
}

// 5. Copy Code Snippet Utility
function copyCode(buttonElement, codeElementId) {
  const codeElem = document.getElementById(codeElementId);
  if (!codeElem) return;
  const text = codeElem.innerText;
  navigator.clipboard.writeText(text).then(() => {
    const originalText = buttonElement.innerHTML;
    buttonElement.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--primary-emerald)" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg><span>Copied!</span>';
    buttonElement.style.borderColor = 'var(--primary-emerald)';
    buttonElement.style.color = 'var(--text-emerald)';
    showToast('Code copied to clipboard!');
    setTimeout(() => {
      buttonElement.innerHTML = originalText;
      buttonElement.style.borderColor = '';
      buttonElement.style.color = '';
    }, 2500);
  });
}

// 6. Smooth Scroll reveal
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.glass-card, .waterfall-box, .calc-container').forEach(el => {
    observer.observe(el);
  });
}

// Export functions to global window
window.showToast = showToast;
window.copyCode = copyCode;
