/**
 * ქართული ვიზუალური ნოველების პორტალი - Main Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. ინიციალიზაცია
  initSakura();
  initAudioControls();
  renderStats();
  populateGenreFilter();
  renderNovels(NOVELS_DATA);
  setupFiltersAndSearch();
  setupModal();
  setupContactForm();
  setupRippleEffects();
});

// ==========================================================================
// 1. საკურას ფურცლების ეფექტი
// ==========================================================================
let sakuraInstance = null;

function initSakura() {
  sakuraInstance = new SakuraEngine('sakura-canvas');
  
  const toggleBtn = document.getElementById('toggle-sakura-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const active = sakuraInstance.toggle();
      toggleBtn.classList.toggle('active', active);
      toggleBtn.querySelector('.btn-label').textContent = active ? 'საკურა: ჩართ.' : 'საკურა: გამორთ.';
      if (window.soundEngine) window.soundEngine.playClickSound();
    });
  }
}

// ==========================================================================
// 2. აუდიო კონტროლი
// ==========================================================================
function initAudioControls() {
  const musicBtn = document.getElementById('toggle-music-btn');
  if (!musicBtn || !window.soundEngine) return;

  musicBtn.addEventListener('click', () => {
    const isPlaying = window.soundEngine.toggleMusic();
    musicBtn.classList.toggle('active', isPlaying);
    const label = musicBtn.querySelector('.btn-label');
    if (label) {
      label.textContent = isPlaying ? 'მუსიკა: ჩართ.' : 'მუსიკა: გამორთ.';
    }
  });
}

// ==========================================================================
// 3. სტატისტიკის ასახვა
// ==========================================================================
function renderStats() {
  const totalEl = document.getElementById('stat-total');
  const completedEl = document.getElementById('stat-completed');
  const inProgressEl = document.getElementById('stat-progress');
  const linesEl = document.getElementById('stat-lines');

  if (totalEl) totalEl.textContent = SITE_STATS.totalNovels;
  if (completedEl) completedEl.textContent = SITE_STATS.completedNovels;
  if (inProgressEl) inProgressEl.textContent = SITE_STATS.inProgressNovels;
  if (linesEl) linesEl.textContent = SITE_STATS.translatedLines;
}

// ==========================================================================
// 4. ჟანრების ფილტრის შევსება
// ==========================================================================
function populateGenreFilter() {
  const genreSelect = document.getElementById('genre-filter');
  if (!genreSelect) return;

  genreSelect.innerHTML = '';
  ALL_GENRES.forEach(genre => {
    const opt = document.createElement('option');
    opt.value = genre === 'ყველა ჟანრი' ? 'all' : genre;
    opt.textContent = genre;
    genreSelect.appendChild(opt);
  });
}

// ==========================================================================
// 5. ნოველების ბარათების რენდერი
// ==========================================================================
let currentFilter = 'all';
let currentGenre = 'all';
let currentSearch = '';

function renderNovels(novels) {
  const grid = document.getElementById('novels-grid');
  if (!grid) return;

  grid.innerHTML = '';

  if (novels.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🌸</div>
        <h3 style="font-size: 1.3rem; margin-bottom: 8px;">ნოველა ვერ მოიძებნა</h3>
        <p style="color: var(--text-muted);">სცადეთ სხვა საკვანძო სიტყვა ან გაასუფთავეთ ფილტრი.</p>
      </div>
    `;
    return;
  }

  novels.forEach(novel => {
    const card = document.createElement('div');
    card.className = 'novel-card';
    card.setAttribute('data-id', novel.id);

    // ჟანრების თეგები
    const genreTagsHtml = novel.genres.slice(0, 3).map(g => `<span class="genre-tag">${g}</span>`).join('');

    card.innerHTML = `
      <div class="card-poster" style="background: ${novel.coverGradient};">
        <div class="card-poster-pattern"></div>
        <div class="status-badge ${novel.badgeColor}">
          <span class="status-dot"></span>
          ${novel.statusGeo}
        </div>
        <h3 class="poster-title">${novel.titleGeo}</h3>
      </div>
      <div class="card-body">
        <div class="novel-meta-top">
          <div class="novel-rating">⭐ ${novel.rating}</div>
          <div class="novel-playtime">⏳ ${novel.playtime}</div>
        </div>
        <h4 class="novel-card-title">${novel.titleGeo}</h4>
        <div class="novel-orig-title">${novel.titleOrig}</div>
        <div class="novel-genres">
          ${genreTagsHtml}
        </div>
        <p class="novel-desc-snippet">${novel.shortDesc}</p>
        
        <div class="progress-container">
          <div class="progress-header">
            <span class="progress-label">თარგმანის პროგრესი</span>
            <span class="progress-percentage">${novel.progress}%</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width: ${novel.progress}%;"></div>
          </div>
        </div>

        <div class="card-actions">
          <button class="btn btn-primary btn-card open-detail-btn" data-id="${novel.id}">
            დეტალურად / ჩამოტვირთვა
          </button>
        </div>
      </div>
    `;

    // ბარათის კლიკი
    card.querySelector('.open-detail-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      openNovelModal(novel.id);
    });

    card.addEventListener('click', () => {
      openNovelModal(novel.id);
    });

    grid.appendChild(card);
  });
}

// ==========================================================================
// 6. ფილტრაცია და ძიება
// ==========================================================================
function setupFiltersAndSearch() {
  const statusTabs = document.querySelectorAll('.status-tab');
  const searchInput = document.getElementById('search-input');
  const genreSelect = document.getElementById('genre-filter');

  // სტატუსის ტაბები
  statusTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      statusTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.getAttribute('data-status');
      if (window.soundEngine) window.soundEngine.playClickSound();
      applyFilters();
    });
  });

  // ჟანრის არჩევა
  if (genreSelect) {
    genreSelect.addEventListener('change', (e) => {
      currentGenre = e.target.value;
      if (window.soundEngine) window.soundEngine.playClickSound();
      applyFilters();
    });
  }

  // ძებნა
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value.toLowerCase().trim();
      applyFilters();
    });
  }
}

function applyFilters() {
  const filtered = NOVELS_DATA.filter(novel => {
    // სტატუსის ფილტრი
    if (currentFilter !== 'all' && novel.status !== currentFilter) {
      return false;
    }

    // ჟანრის ფილტრი
    if (currentGenre !== 'all' && !novel.genres.includes(currentGenre)) {
      return false;
    }

    // ძებნის ტექსტი (სათაური, ორიგინალი სახელი, ჟანრი, ავტორი)
    if (currentSearch) {
      const matchGeo = novel.titleGeo.toLowerCase().includes(currentSearch);
      const matchOrig = novel.titleOrig.toLowerCase().includes(currentSearch);
      const matchDev = novel.developer.toLowerCase().includes(currentSearch);
      const matchGenre = novel.genres.some(g => g.toLowerCase().includes(currentSearch));
      if (!matchGeo && !matchOrig && !matchDev && !matchGenre) {
        return false;
      }
    }

    return true;
  });

  renderNovels(filtered);
}

// ==========================================================================
// 7. დეტალური მოდალური ფანჯარა
// ==========================================================================
function setupModal() {
  const modalOverlay = document.getElementById('novel-modal');
  const closeBtn = document.getElementById('modal-close-btn');

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closeModal();
      }
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  });
}

function openNovelModal(novelId) {
  const novel = NOVELS_DATA.find(n => n.id === novelId);
  if (!novel) return;

  if (window.soundEngine) window.soundEngine.playChimeSound();

  const modal = document.getElementById('novel-modal');
  const banner = document.getElementById('modal-banner');
  const title = document.getElementById('modal-title');
  const origTitle = document.getElementById('modal-orig-title');
  const statusBadge = document.getElementById('modal-status-badge');
  const metaGrid = document.getElementById('modal-meta-grid');
  const breakdownGrid = document.getElementById('modal-breakdown-grid');
  const synopsis = document.getElementById('modal-synopsis');
  const screenshotsBox = document.getElementById('modal-screenshots');
  const downloadsList = document.getElementById('modal-downloads-list');
  const installGuideList = document.getElementById('modal-install-guide');

  // ბანერი და სათაურები
  banner.style.background = novel.coverGradient;
  title.textContent = novel.titleGeo;
  origTitle.textContent = novel.titleOrig;
  
  // სტატუსი
  statusBadge.className = `status-badge ${novel.badgeColor}`;
  statusBadge.innerHTML = `<span class="status-dot"></span> ${novel.statusGeo}`;

  // მეტა ინფორმაცია
  metaGrid.innerHTML = `
    <div class="modal-meta-box">
      <span class="meta-label">შემქმნელი</span>
      <span class="meta-val">${novel.developer}</span>
    </div>
    <div class="modal-meta-box">
      <span class="meta-label">გამოშვების წელი</span>
      <span class="meta-val">${novel.releaseYear}</span>
    </div>
    <div class="modal-meta-box">
      <span class="meta-label">ხანგრძლივობა</span>
      <span class="meta-val">${novel.playtime}</span>
    </div>
    <div class="modal-meta-box">
      <span class="meta-label">მთარგმნელი</span>
      <span class="meta-val">${novel.translators}</span>
    </div>
  `;

  // პროგრესის დეტალები
  breakdownGrid.innerHTML = `
    <div class="breakdown-item">
      <div class="progress-header">
        <span class="progress-label">სცენარი / დიალოგები</span>
        <span class="progress-percentage">${novel.progressDetails.script}%</span>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width: ${novel.progressDetails.script}%;"></div></div>
    </div>
    <div class="breakdown-item">
      <div class="progress-header">
        <span class="progress-label">ინტერფეისი / მენიუ</span>
        <span class="progress-percentage">${novel.progressDetails.ui}%</span>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width: ${novel.progressDetails.ui}%;"></div></div>
    </div>
    <div class="breakdown-item">
      <div class="progress-header">
        <span class="progress-label">გრაფიკა და გამოსახულებები</span>
        <span class="progress-percentage">${novel.progressDetails.graphics}%</span>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width: ${novel.progressDetails.graphics}%;"></div></div>
    </div>
    <div class="breakdown-item">
      <div class="progress-header">
        <span class="progress-label">ტესტირება და კორექტურა</span>
        <span class="progress-percentage">${novel.progressDetails.testing}%</span>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width: ${novel.progressDetails.testing}%;"></div></div>
    </div>
  `;

  // სინოფსისი
  synopsis.textContent = novel.synopsis;

  // სქრინშოთების გალერეა
  screenshotsBox.innerHTML = '';
  novel.screenshots.forEach(sc => {
    const item = document.createElement('div');
    item.className = 'screenshot-item';
    item.innerHTML = `
      <div class="screenshot-preview">🖼️</div>
      <div class="screenshot-title">${sc.title}</div>
      <div class="screenshot-caption">${sc.caption}</div>
    `;
    screenshotsBox.appendChild(item);
  });

  // გადმოწერის ბმულები
  downloadsList.innerHTML = '';
  novel.downloadLinks.forEach(link => {
    const card = document.createElement('div');
    card.className = 'download-card';
    card.innerHTML = `
      <div class="download-info">
        <div class="download-icon">⬇️</div>
        <div>
          <div class="download-name">${link.name}</div>
          <div class="download-size">ზომა: ${link.size}</div>
        </div>
      </div>
      <a href="${link.url}" class="btn btn-primary" style="padding: 8px 18px; font-size: 0.85rem;" onclick="handleDownloadClick(event, '${novel.titleGeo}')">
        ჩამოტვირთვა
      </a>
    `;
    downloadsList.appendChild(card);
  });

  // ინსტალაციის გზამკვლევი
  installGuideList.innerHTML = '';
  novel.installGuide.forEach(step => {
    const li = document.createElement('li');
    li.className = 'guide-step';
    li.textContent = step;
    installGuideList.appendChild(li);
  });

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const modal = document.getElementById('novel-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    if (window.soundEngine) window.soundEngine.playClickSound();
  }
}

window.handleDownloadClick = function(e, title) {
  e.preventDefault();
  showToast(`ინფორმაცია: "${title}"-ის პატჩის გადმოწერა მალე დაიწყება.`);
  if (window.soundEngine) window.soundEngine.playClickSound();
};

// ==========================================================================
// 8. კონტაქტისა და უკუკავშირის ფორმა
// ==========================================================================
function setupContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('contact-name').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const subject = document.getElementById('contact-subject').value;
    const message = document.getElementById('contact-message').value.trim();

    if (!name || !email || !message) {
      showToast('გთხოვთ შეავსოთ ყველა სავალდებულო ველი!', 'error');
      return;
    }

    // შეტყობინების ობიექტი
    const newFeedback = {
      name,
      email,
      subject,
      message,
      timestamp: new Date().toISOString()
    };

    // შენახვა localStorage-ში მომავალი სანახავად
    try {
      const stored = JSON.parse(localStorage.getItem('geo_vn_messages') || '[]');
      stored.push(newFeedback);
      localStorage.setItem('geo_vn_messages', JSON.stringify(stored));
    } catch (err) {
      console.warn('Storage error:', err);
    }

    // ხმოვანი და ვიზუალური ეფექტი
    if (window.soundEngine) window.soundEngine.playSuccessSound();

    form.classList.add('form-success-animation');
    setTimeout(() => form.classList.remove('form-success-animation'), 800);

    showToast('გმადლობთ! თქვენი შეტყობინება წარმატებით გაიგზავნა.');
    form.reset();
  });
}

// ==========================================================================
// 9. Toast შეტყობინებები
// ==========================================================================
function showToast(text, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  const icon = type === 'success' ? '🌸' : '⚠️';
  toast.innerHTML = `<span>${icon}</span> <span>${text}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = '0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ==========================================================================
// 10. Ripple ეფექტი ღილაკებზე
// ==========================================================================
function setupRippleEffects() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn) return;

    const circle = document.createElement('span');
    const diameter = Math.max(btn.clientWidth, btn.clientHeight);
    const radius = diameter / 2;

    const rect = btn.getBoundingClientRect();
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${e.clientX - rect.left - radius}px`;
    circle.style.top = `${e.clientY - rect.top - radius}px`;
    circle.classList.add('ripple');

    const ripple = btn.getElementsByClassName('ripple')[0];
    if (ripple) {
      ripple.remove();
    }

    btn.appendChild(circle);
  });
}
