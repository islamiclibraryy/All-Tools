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
   WEBP CONVERTER TOOL (BULK + MODAL + QUALITY RE-CONVERT)
   ============================================= */
(function initConverter() {
  const dropZone   = $('#dropZone');
  const fileInput  = $('#fileInput');
  const browseLink = $('#browseLink');
  const convertBtn = $('#convertBtn');
  const downloadZipBtn = $('#downloadZipBtn');
  const progressWrap = $('#progressWrap');
  const progressFill = $('#progressFill');
  const progressText = $('#progressText');
  const bulkQueueContainer = $('#bulkQueueContainer');
  const qualitySlider = $('#qualitySlider');

  // Modal Elements
  const previewModal = $('#previewModal');
  const closeModalBtn = $('#closeModalBtn');
  const modalOrigImg = $('#modalOrigImg');
  const modalOrigSize = $('#modalOrigSize');
  const modalConvImg = $('#modalConvImg');
  const modalConvPlaceholder = $('#modalConvPlaceholder');
  const modalConvSize = $('#modalConvSize');
  const modalSavings = $('#modalSavings');

  if (!dropZone) return;

  let filesQueue = [];
  let isConverting = false;
  let hasConvertedOnce = false; // Auto-clear flag
  let lastConvertedQuality = null; // Track quality for re-converting

  /* Format bytes */
  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  /* Generate Smart File Name Random Code */
  function generateRandomCode() {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
  }

  /* Render Queue UI */
  function renderQueue() {
    if (!bulkQueueContainer) return;
    bulkQueueContainer.innerHTML = '';

    // Counter Update Logic
    const counterWrap = $('#queueCounterWrap');
    const counterBadge = $('#queueCountBadge');
    if (filesQueue.length > 0) {
      counterWrap.style.display = 'flex';
      counterBadge.textContent = `${filesQueue.length} / 50`;
    } else {
      counterWrap.style.display = 'none';
    }


    filesQueue.forEach((item) => {
      const queueItem = document.createElement('div');
      queueItem.className = 'queue-item';
      queueItem.setAttribute('data-id', item.id);

      let statusHTML = '';
      let actionBtnsHTML = ''; 

      const delBtnHTML = `<button class="queue-del-btn" title="Remove Image">&times;</button>`;

      if (item.status === 'pending') {
        statusHTML = `<span class="queue-status status-pending">Pending</span>`;
        actionBtnsHTML = delBtnHTML; 
      } else if (item.status === 'converting') {
        statusHTML = `<span class="queue-status status-converting">Converting...</span>`;
        actionBtnsHTML = ``; // Convert hote time delete na ho
      } else if (item.status === 'done') {
        const savings = ((item.originalSize - item.webpSize) / item.originalSize * 100).toFixed(1);
        statusHTML = `<span class="queue-status status-done">Done (-${savings > 0 ? savings : 0}%)</span>`;
        const svgIcon = `<svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>`;
        actionBtnsHTML = `<div class="queue-dl-btn" title="Download Image">${svgIcon}</div> ${delBtnHTML}`;
      } else if (item.status === 'error') {
        statusHTML = `<span class="queue-status" style="color:var(--red-glow)">Failed</span>`;
        actionBtnsHTML = delBtnHTML;
      }

      queueItem.innerHTML = `
        <img src="${item.thumbUrl}" class="queue-thumb" alt="thumb">
        <div class="queue-info">
            <span class="queue-name">${item.originalName}</span>
            <div class="queue-meta">
                <span>${formatBytes(item.originalSize)}</span>
                ${statusHTML}
            </div>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            ${actionBtnsHTML}
        </div>
      `;
      bulkQueueContainer.appendChild(queueItem);
    });
  }

  /* Validate Image */
  function isValidImage(file) {
    return /^image\/(jpeg|jpg|png)$/i.test(file.type);
  }

  /* Handle Uploaded Files (Limit + Toast Fix) */
  function handleFiles(files) {
    if (isConverting) {
      showToast('⚠️ Please wait until current conversion is finished.', 'error');
      return;
    }

    if (hasConvertedOnce) {
      filesQueue = [];
      hasConvertedOnce = false;
      lastConvertedQuality = null;
      if(downloadZipBtn) downloadZipBtn.style.display = 'none';
      if(progressWrap) progressWrap.style.display = 'none';
    }

    const MAX_FILES = 50;
    if (filesQueue.length + files.length > MAX_FILES) {
      showToast(`⚠️ You can only upload up to ${MAX_FILES} images at a time!`, 'error');
      return; 
    }

    let added = false;
    let invalidFound = false;

    Array.from(files).forEach(file => {
      if (isValidImage(file)) {
        filesQueue.push({
          id: Date.now() + Math.random().toString().substr(2, 5),
          originalFile: file,
          originalSize: file.size,
          originalName: file.name,
          thumbUrl: URL.createObjectURL(file),
          status: 'pending',
          webpBlob: null,
          webpName: '',
          webpSize: 0
        });
        added = true;
      } else {
        invalidFound = true;
      }
    });

    if (added) {
      renderQueue();
      convertBtn.disabled = false;
      showToast(`✅ ${files.length} Images added!`, 'success');
    }
    
    if (invalidFound) {
      showToast('❌ Some files were not valid JPG, PNG or JPEG.', 'error');
    }
  }



  /* Drag & Drop Handlers */
  ['dragenter','dragover'].forEach(ev => dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.add('dragover'); }));
  ['dragleave','drop'].forEach(ev => dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.remove('dragover'); }));
  dropZone.addEventListener('drop', e => handleFiles(e.dataTransfer.files));
  dropZone.addEventListener('click', () => fileInput.click());
  if (browseLink) browseLink.addEventListener('click', e => { e.stopPropagation(); fileInput.click(); });
  fileInput.addEventListener('change', e => handleFiles(e.target.files));

  /* Core Conversion Processor */
  function processImage(item, qualityFloat) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            item.webpBlob = blob;
            item.webpSize = blob.size;
            const nameWithoutExt = item.originalName.replace(/\.[^/.]+$/, "");
            item.webpName = `${nameWithoutExt}-WebpModer-${generateRandomCode()}.webp`;
            item.status = 'done';
          } else {
            item.status = 'error';
          }
          resolve();
        }, 'image/webp', qualityFloat);
      };
      img.onerror = () => { item.status = 'error'; resolve(); };
      img.src = item.thumbUrl;
    });
  }

  /* Convert All Images (With Re-convert Logic) */
  convertBtn.addEventListener('click', async () => {
    if (filesQueue.length === 0) { showToast('⚠️ Please upload an image first.', 'error'); return; }
    
    const currentQuality = qualitySlider ? parseInt(qualitySlider.value) : 80;

    // SCENARIO 1: Same Quality par wapas click kiya
    if (hasConvertedOnce && lastConvertedQuality === currentQuality) {
      showToast(`ℹ️ Images already converted at ${currentQuality}% quality!`, 'success');
      return;
    }

    // SCENARIO 2: Quality Slider change karke click kiya -> RESET Queue
    if (hasConvertedOnce && lastConvertedQuality !== currentQuality) {
      filesQueue.forEach(item => { item.status = 'pending'; });
      if(downloadZipBtn) downloadZipBtn.style.display = 'none';
      hasConvertedOnce = false; // Queue wapas zinda ho gayi
    }

    isConverting = true;
    convertBtn.disabled = true;
    dropZone.style.pointerEvents = 'none';
    
    progressWrap.style.display = 'block';
    progressFill.style.width = '0%';
    
    let completed = 0;
    const totalToConvert = filesQueue.filter(f => f.status !== 'done').length;

    if (totalToConvert === 0) {
      isConverting = false; convertBtn.disabled = false; dropZone.style.pointerEvents = 'auto'; return;
    }

    const qualityFloat = currentQuality / 100;

    for (let i = 0; i < filesQueue.length; i++) {
      if (filesQueue[i].status === 'done') continue;

      filesQueue[i].status = 'converting';
      renderQueue(); 

      await processImage(filesQueue[i], qualityFloat);
      completed++;
      
      const percent = (completed / totalToConvert) * 100;
      progressFill.style.width = `${percent}%`;
      progressText.textContent = `Converting: ${completed} / ${totalToConvert} Images`;
    }

    isConverting = false;
    dropZone.style.pointerEvents = 'auto';
    convertBtn.disabled = false;
    
    if (filesQueue.some(f => f.status === 'done')) {
      progressText.textContent = `All images converted at ${currentQuality}% ✨`;
      showToast(`🎉 Converted to WebP at ${currentQuality}%! Ready to download.`, 'success');
      hasConvertedOnce = true;
      lastConvertedQuality = currentQuality; // Nayi quality save kar li
      if (typeof JSZip !== 'undefined' && downloadZipBtn) { downloadZipBtn.style.display = 'block'; }
    }
    renderQueue();
  });

  /* Open Preview Modal */
  function openPreview(id) {
    const item = filesQueue.find(f => f.id == id);
    if (!item || !previewModal) return;

    modalOrigImg.src = item.thumbUrl;
    modalOrigSize.textContent = 'Size: ' + formatBytes(item.originalSize);

    if (item.status === 'done' && item.webpBlob) {
      modalConvImg.src = URL.createObjectURL(item.webpBlob);
      modalConvImg.style.display = 'block';
      modalConvPlaceholder.style.display = 'none';
      modalConvSize.textContent = 'Size: ' + formatBytes(item.webpSize);
      
      const saved = item.originalSize - item.webpSize;
      const pct = ((saved / item.originalSize) * 100).toFixed(1);
      if (saved > 0) {
        modalSavings.textContent = '▼ ' + pct + '% smaller';
        modalSavings.style.color = '#22c55e';
      } else {
        modalSavings.textContent = 'WebP converted';
        modalSavings.style.color = 'var(--red-glow)';
      }
    } else {
      modalConvImg.style.display = 'none';
      modalConvPlaceholder.style.display = 'flex';
      modalConvPlaceholder.textContent = (item.status === 'converting') ? '✨ Converting...' : '✨ Pending...';
      modalConvSize.textContent = '';
      modalSavings.textContent = '';
    }
    previewModal.style.display = 'flex';
  }

  /* Close Modal */
  if (closeModalBtn) closeModalBtn.addEventListener('click', () => previewModal.style.display = 'none');
  if (previewModal) previewModal.addEventListener('click', (e) => { if (e.target === previewModal) previewModal.style.display = 'none'; });

  /* List Item Clicks (Download, Delete or Preview) */
  if (bulkQueueContainer) {
    bulkQueueContainer.addEventListener('click', (e) => {
      const itemEl = e.target.closest('.queue-item');
      if (!itemEl) return;
      
      const id = itemEl.getAttribute('data-id');
      const dlBtn = e.target.closest('.queue-dl-btn');
      const delBtn = e.target.closest('.queue-del-btn'); // Naya Delete Button Target

      if (delBtn) {
        // Delete Image Logic
        filesQueue = filesQueue.filter(f => f.id != id);
        renderQueue();
        
        // Agar list khali ho gayi toh convert button disable kardo
        if (filesQueue.length === 0) {
           if(downloadZipBtn) downloadZipBtn.style.display = 'none';
           convertBtn.disabled = true;
           hasConvertedOnce = false;
        }
        return; // Taaki click karne par modal open na ho
      }

      if (dlBtn) {
        // Download Image Logic
        const item = filesQueue.find(f => f.id == id);
        if (item && item.webpBlob) {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(item.webpBlob);
          link.download = item.webpName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          showToast(`⬇️ Download started!`, 'success');
        }
      } else {
        // Delete aur Download ke alawa kahin click ho toh Modal khule
        openPreview(id);
      }
    });
  }

  /* Download All as ZIP */
  if (downloadZipBtn) {
    downloadZipBtn.addEventListener('click', () => {
      if (typeof JSZip === 'undefined') { showToast('❌ ZIP library not loaded.', 'error'); return; }

      const zip = new JSZip();
      let hasFiles = false;
      
      filesQueue.forEach(item => {
        if (item.status === 'done' && item.webpBlob) {
          zip.file(item.webpName, item.webpBlob);
          hasFiles = true;
        }
      });

      if (!hasFiles) { showToast('⚠️ No converted images to ZIP.', 'error'); return; }

      const zipBtnOriginalText = downloadZipBtn.innerHTML;
      downloadZipBtn.innerHTML = "📦 PACKAGING ZIP... WAIT";
      downloadZipBtn.disabled = true;

      zip.generateAsync({ type: "blob" }).then(function(content) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = "Webp-Moder-Images.zip";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        downloadZipBtn.innerHTML = zipBtnOriginalText;
        downloadZipBtn.disabled = false;
        showToast('📦 ZIP Download started!', 'success');
      });
    });
  }

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