/* =============================================
   WEBP MODER BY SHEKH — script.js
   ============================================= */

'use strict';

/* ── Utility ── */
function $(sel, ctx) { return (ctx || document).querySelector(sel); }
function $$(sel, ctx) { return [...(ctx || document).querySelectorAll(sel)]; }

/* =============================================
   HEADER: Scroll Glassmorphism
   ============================================= */
(function initHeader() {
  const header = $('.header');
  if (!header) return;
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 30);
  }, { passive: true });
})();

/* =============================================
   HAMBURGER MENU
   ============================================= */
(function initMobileMenu() {
  const ham = $('.hamburger');
  const mobileNav = $('.mobile-nav');
  if (!ham || !mobileNav) return;

  ham.addEventListener('click', () => {
    ham.classList.toggle('open');
    mobileNav.classList.toggle('open');
    document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
  });

  // Close on link click
  $$('.mobile-nav a').forEach(a => {
    a.addEventListener('click', () => {
      ham.classList.remove('open');
      mobileNav.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
})();

/* =============================================
   ACTIVE NAV LINK
   ============================================= */
(function setActiveNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  $$('.nav a, .mobile-nav a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href === path || (path === '' && href === 'index.html') ||
        (path === 'index.html' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
})();

/* =============================================
   SCROLL REVEAL
   ============================================= */
(function initReveal() {
  const elements = $$('.reveal');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  elements.forEach(el => observer.observe(el));
})();

/* =============================================
   QUALITY SLIDER
   ============================================= */
(function initSlider() {
  const slider = $('#qualitySlider');
  const label  = $('#qualityVal');
  if (!slider || !label) return;

  function update() {
    const v = slider.value;
    label.textContent = v + '%';
    slider.style.setProperty('--val', v + '%');
  }
  slider.addEventListener('input', update);
  update();
})();

/* =============================================
   WEBP CONVERTER TOOL
   ============================================= */
(function initConverter() {
  const dropZone   = $('#dropZone');
  const fileInput  = $('#fileInput');
  const browseLink = $('#browseLink');
  const convertBtn = $('#convertBtn');
  const downloadBtn = $('#downloadBtn');
  const progressWrap = $('#progressWrap');
  const progressFill = $('#progressFill');
  const progressText = $('#progressText');
  const origImg    = $('#origImg');
  const convImg    = $('#convImg');
  const origPlaceholder = $('#origPlaceholder');
  const convPlaceholder = $('#convPlaceholder');
  const origSize   = $('#origSize');
  const convSize   = $('#convSize');
  const sizeSaved  = $('#sizeSaved');
  const qualitySlider = $('#qualitySlider');

  if (!dropZone) return;

  let currentFile = null;
  let convertedBlob = null;

  /* Format bytes */
  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  /* Show original preview */
  function showOriginal(file) {
    const url = URL.createObjectURL(file);
    origImg.src = url;
    origImg.style.display = 'block';
    origPlaceholder.style.display = 'none';
    origSize.textContent = 'Size: ' + formatBytes(file.size);
    // Reset converted side
    convImg.style.display = 'none';
    convPlaceholder.style.display = 'flex';
    convSize.textContent = '';
    sizeSaved.textContent = '';
    downloadBtn.style.display = 'none';
    convertedBlob = null;
  }

  /* Drag & Drop */
  ['dragenter','dragover'].forEach(ev => {
    dropZone.addEventListener(ev, e => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });
  });
  ['dragleave','drop'].forEach(ev => {
    dropZone.addEventListener(ev, e => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
    });
  });
  dropZone.addEventListener('drop', e => {
    const file = e.dataTransfer.files[0];
    if (file && isValidImage(file)) handleFile(file);
    else showToast('❌ Please upload JPG, PNG or JPEG file.', 'error');
  });

  /* Browse click */
  dropZone.addEventListener('click', () => fileInput.click());
  if (browseLink) browseLink.addEventListener('click', e => { e.stopPropagation(); fileInput.click(); });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file && isValidImage(file)) handleFile(file);
  });

  function isValidImage(file) {
    return /^image\/(jpeg|jpg|png)$/i.test(file.type);
  }

  function handleFile(file) {
    currentFile = file;
    showOriginal(file);
    convertBtn.disabled = false;
    showToast('✅ Image loaded! Adjust quality and click Convert.', 'success');
  }

  /* Convert */
  convertBtn.addEventListener('click', () => {
    if (!currentFile) { showToast('⚠️ Please upload an image first.', 'error'); return; }
    runConversion();
  });

  function runConversion() {
    const quality = (qualitySlider ? parseInt(qualitySlider.value) : 80) / 100;
    convertBtn.disabled = true;

    // Show progress
    progressWrap.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent = 'Converting...';

    // Animate progress bar
    let progress = 0;
    const interval = setInterval(() => {
      progress = Math.min(progress + Math.random() * 15, 85);
      progressFill.style.width = progress + '%';
    }, 80);

    const img = new Image();
    const url = URL.createObjectURL(currentFile);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      canvas.toBlob(blob => {
        clearInterval(interval);
        progressFill.style.width = '100%';
        progressText.textContent = 'Done!';

        setTimeout(() => {
          progressWrap.style.display = 'none';
          progressFill.style.width = '0%';
          convertBtn.disabled = false;

          if (!blob) { showToast('❌ Conversion failed. Try another file.', 'error'); return; }

          convertedBlob = blob;
          const convUrl = URL.createObjectURL(blob);
          convImg.src = convUrl;
          convImg.style.display = 'block';
          convPlaceholder.style.display = 'none';

          const saved = currentFile.size - blob.size;
          const pct   = ((saved / currentFile.size) * 100).toFixed(1);
          convSize.textContent = 'Size: ' + formatBytes(blob.size);
          if (saved > 0) {
            sizeSaved.textContent = '▼ ' + pct + '% smaller';
            sizeSaved.style.color = '#22c55e';
          } else {
            sizeSaved.textContent = 'WebP converted';
            sizeSaved.style.color = 'var(--red-glow)';
          }

          downloadBtn.style.display = 'block';
          showToast('🎉 Converted to WebP! Ready to download.', 'success');
        }, 400);
      }, 'image/webp', quality);
    };
    img.onerror = () => {
      clearInterval(interval);
      progressWrap.style.display = 'none';
      convertBtn.disabled = false;
      showToast('❌ Could not read image.', 'error');
    };
    img.src = url;
  }

  /* Download */
  downloadBtn.addEventListener('click', () => {
    if (!convertedBlob) return;
    const baseName = currentFile.name.replace(/\.[^.]+$/, '');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(convertedBlob);
    a.download = baseName + '.webp';
    a.click();
    showToast('⬇️ Download started!', 'success');
  });

})();

/* =============================================
   FAQ ACCORDION
   ============================================= */
(function initFAQ() {
  $$('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    if (!q) return;
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      // Close all
      $$('.faq-item.open').forEach(o => o.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });
})();

/* =============================================
   TOAST NOTIFICATION
   ============================================= */
function showToast(msg, type = 'info') {
  let toast = $('#globalToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'globalToast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = 'toast ' + type;
  // Trigger show
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('show'));
  });
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3500);
}

/* =============================================
   CONTACT FORM
   ============================================= */
(function initContactForm() {
  const form = $('#contactForm');
  if (!form) return;
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Validate required fields
    if (!data.fname || !data.fname.trim()) {
      showToast('⚠️ First name is required.', 'error');
      return;
    }
    if (!data.email || !data.email.trim()) {
      showToast('⚠️ Email address is required.', 'error');
      return;
    }
    if (!data.message || !data.message.trim()) {
      showToast('⚠️ Message is required.', 'error');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      showToast('⚠️ Please enter a valid email address.', 'error');
      return;
    }
    
    // Submit to backend
    try {
      const response = await fetch('https://formspree.io/f/xojrprrd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          _subject: `New Contact Form: ${data.subject || 'No Subject'}`,
          _from_name: `${data.fname} ${data.lname || ''}`,
        })
      });
      
      if (response.ok) {
        showToast('✅ Message sent successfully! We\'ll get back to you soon.', 'success');
        form.reset();
      } else {
        showToast('❌ Something went wrong. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Form error:', error);
      showToast('❌ Network error. Please check your connection.', 'error');
    }
  });
})();

/* =============================================
   NEWSLETTER
   ============================================= */
(function initNewsletter() {
  $$('.newsletter-input-wrap').forEach(wrap => {
    const btn   = wrap.querySelector('button');
    const input = wrap.querySelector('input');
    if (!btn || !input) return;
    
    btn.addEventListener('click', async () => {
      const email = input.value.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (!email) {
        showToast('⚠️ Please enter your email address.', 'error');
        return;
      }
      if (!emailRegex.test(email)) {
        showToast('⚠️ Please enter a valid email address.', 'error');
        return;
      }
      
      try {
        const response = await fetch('https://formspree.io/f/xeenpnba', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email,
            _subject: 'New Newsletter Subscription',
            _template: 'table'
          })
        });
        
        if (response.ok) {
          showToast('🎉 Subscribed! Check your email for confirmation.', 'success');
          input.value = '';
        } else {
          showToast('❌ Something went wrong. Please try again.', 'error');
        }
      } catch (error) {
        console.error('Newsletter error:', error);
        showToast('❌ Network error. Please try again later.', 'error');
      }
    });
    
    // Also allow Enter key to submit
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') btn.click();
    });
  });
})();

/* =============================================
   SMOOTH SCROLL for anchor links
   ============================================= */
(function initSmoothScroll() {
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
})();