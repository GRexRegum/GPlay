/**
 * ქართული ვიზუალური ნოველების პორტალი - Main Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. ინიციალიზაცია
  initSakura();
  initAudioControls();
  renderStats();
  populateGenreFilter();
  renderNovels(typeof NOVELS_DATA !== 'undefined' ? NOVELS_DATA : []);
  setupFiltersAndSearch();
  setupModal();
  setupContactForm();
  setupRippleEffects();
});

// ==========================================================================
// 0. Вспомогательная функция защиты от XSS (Экранирование HTML)
// ==========================================================================
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ==========================================================================
// 1. საკურას ფურცლების ეფექტი
// ==========================================================================
let sakuraInstance = null;

function initSakura() {
  if (typeof SakuraEngine === 'undefined') return;
  sakuraInstance = new SakuraEngine('sakura-canvas');
  
  const toggleBtn = document.getElementById('toggle-sakura-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const active = sakuraInstance.toggle();
      toggleBtn.classList.toggle('active', active);
      const label = toggleBtn.querySelector('.btn-label');
      if (label) {
        label.textContent = active ? 'საკურა: ჩართ.' : 'საკურა: გამორთ.';
      }
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
  if (typeof SITE_STATS === 'undefined') return;

  const totalEl = document.getElementById('stat-total');
  const completedEl = document.getElementById('stat-completed');
  const inProgressEl = document.getElementById('stat-progress');
  const linesEl = document.getElementById('stat-lines');

  if (totalEl) totalEl.textContent = SITE_STATS.totalNovels || 0;
  if (completedEl) completedEl.textContent = SITE_STATS.completedNovels || 0;
  if (inProgressEl) inProgressEl.textContent = SITE_STATS.inProgressNovels || 0;
  if (linesEl) linesEl.textContent = SITE_STATS.translatedLines || 0;
}

// ==========================================================================
// 4. ჟანრების ფილტრის შევსება
// ==========================================================================
function populateGenreFilter() {
  const genreSelect = document.getElementById('genre-filter');
  if (!genreSelect || typeof ALL_GENRES === 'undefined') return;

  genreSelect.innerHTML = '';
  ALL_GENRES.forEach(genre => {
    const opt = document.createElement('option');
    opt.value = genre === 'ყველა ჟანრი' ? 'all' : genre;
    opt.textContent = genre;
    genreSelect.appendChild(opt);
  });
}

// ==========================================================================
// 5. ნოველების ბარათების რენდერი (Защищено от XSS)
// ==========================================================================
let currentFilter = 'all';
let currentGenre = 'all';
let currentSearch = '';

function renderNovels(novels) {
  const grid = document.getElementById('novels-grid');
  if (!grid) return;

  grid.innerHTML = '';

  if (!novels || novels.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
        <div class="empty-icon" style="font-size: 2rem; margin-bottom: 12px;">🌸</div>
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

    const genres = Array.isArray(novel.genres) ? novel.genres : [];
    const genreTagsHtml = genres.slice(0, 3).map(g => `<span class="genre-tag">${escapeHtml(g)}</span>`).join('');
    const progress = Math.min(Math.max(novel.progress || 0, 0), 100);

    card.innerHTML = `
      <div class="card-poster" style="background: ${escapeHtml(novel.coverGradient || '')};">
        <div class="card-poster-pattern"></div>
        <div class="status-badge ${escapeHtml(novel.badgeColor || '')}">
          <span class="status-dot"></span>
          ${escapeHtml(novel.statusGeo || '')}
        </div>
        <h3 class="poster-title">${escapeHtml(novel.titleGeo || '')}</h3>
      </div>
      <div class="card-body">
        <div class="novel-meta-top">
          <div class="novel-rating">⭐ ${escapeHtml(novel.rating || 'N/A')}</div>
          <div class="novel-playtime">⏳ ${escapeHtml(novel.playtime || 'N/A')}</div>
        </div>
        <h4 class="novel-card-title">${escapeHtml(novel.titleGeo || '')}</h4>
        <div class="novel-orig-title">${escapeHtml(novel.titleOrig || '')}</div>
        <div class="novel-genres">
          ${genreTagsHtml}
        </div>
        <p class="novel-desc-snippet">${escapeHtml(novel.shortDesc || '')}</p>
        
        <div class="progress-container">
          <div class="progress-header">
            <span class="progress-label">თარგმანის პროგრესი</span>
            <span class="progress-percentage">${progress}%</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width: ${progress}%;"></div>
          </div>
        </div>

        <div class="card-actions">
          <button class="btn btn-primary btn-card open-detail-btn">
            დეტალურად / ჩამოტვირთვა
          </button>
        </div>
      </div>
    `;

    // Безопасный клик по всей карточке
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

  statusTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      statusTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.getAttribute('data-status') || 'all';
      if (window.soundEngine) window.soundEngine.playClickSound();
      applyFilters();
    });
  });

  if (genreSelect) {
    genreSelect.addEventListener('change', (e) => {
      currentGenre = e.target.value;
      if (window.soundEngine) window.soundEngine.playClickSound();
      applyFilters();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value.toLowerCase().trim();
      applyFilters();
    });
  }
}

function applyFilters() {
  if (typeof NOVELS_DATA === 'undefined') return;

  const filtered = NOVELS_DATA.filter(novel => {
    if (currentFilter !== 'all' && novel.status !== currentFilter) {
      return false;
    }

    const genres = Array.isArray(novel.genres) ? novel.genres : [];
    if (currentGenre !== 'all' && !genres.includes(currentGenre)) {
      return false;
    }

    if (currentSearch) {
      const matchGeo = (novel.titleGeo || '').toLowerCase().includes(currentSearch);
      const matchOrig = (novel.titleOrig || '').toLowerCase().includes(currentSearch);
      const matchDev = (novel.developer || '').toLowerCase().includes(currentSearch);
      const matchGenre = genres.some(g => g.toLowerCase().includes(currentSearch));
      if (!matchGeo && !matchOrig && !matchDev && !matchGenre) {
        return false;
      }
    }

    return true;
  });

  renderNovels(filtered);
}

// ==========================================================================
// 7. დეტალური მოდალური ფანჯარა (Защищено от Inline-XSS)
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
  if (typeof NOVELS_DATA === 'undefined') return;

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

  // Банер и заголовки
  if (banner) banner.style.background = novel.coverGradient || '';
  if (title) title.textContent = novel.titleGeo || '';
  if (origTitle) origTitle.textContent = novel.titleOrig || '';
  
  // Статус
  if (statusBadge) {
    statusBadge.className = `status-badge ${escapeHtml(novel.badgeColor || '')}`;
    statusBadge.innerHTML = `<span class="status-dot"></span> ${escapeHtml(novel.statusGeo || '')}`;
  }

  // Мета
  if (metaGrid) {
    metaGrid.innerHTML = `
      <div class="modal-meta-box">
        <span class="meta-label">შემქმნელი</span>
        <span class="meta-val">${escapeHtml(novel.developer || 'N/A')}</span>
      </div>
      <div class="modal-meta-box">
        <span class="meta-label">გამოშვების წელი</span>
        <span class="meta-val">${escapeHtml(novel.releaseYear || 'N/A')}</span>
      </div>
      <div class="modal-meta-box">
        <span class="meta-label">ხანგრძლივობა</span>
        <span class="meta-val">${escapeHtml(novel.playtime || 'N/A')}</span>
      </div>
      <div class="modal-meta-box">
        <span class="meta-label">მთარგმნელი</span>
        <span class="meta-val">${escapeHtml(novel.translators || 'N/A')}</span>
      </div>
    `;
  }

  // Прогресс
  const p = novel.progressDetails || {};
  if (breakdownGrid) {
    breakdownGrid.innerHTML = `
      <div class="breakdown-item">
        <div class="progress-header">
          <span class="progress-label">სცენარი / დიალოგები</span>
          <span class="progress-percentage">${p.script || 0}%</span>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width: ${p.script || 0}%;"></div></div>
      </div>
      <div class="breakdown-item">
        <div class="progress-header">
          <span class="progress-label">ინტერფეისი / მენიუ</span>
          <span class="progress-percentage">${p.ui || 0}%</span>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width: ${p.ui || 0}%;"></div></div>
      </div>
      <div class="breakdown-item">
        <div class="progress-header">
          <span class="progress-label">გრაფიკა და გამოსახულებები</span>
          <span class="progress-percentage">${p.graphics || 0}%</span>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width: ${p.graphics || 0}%;"></div></div>
      </div>
      <div class="breakdown-item">
        <div class="progress-header">
          <span class="progress-label">ტესტირება და კორექტურა</span>
          <span class="progress-percentage">${p.testing || 0}%</span>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width: ${p.testing || 0}%;"></div></div>
      </div>
    `;
  }

  // Синопсис (Безопасно через textContent)
  if (synopsis) synopsis.textContent = novel.synopsis || '';

  // Скриншоты
  if (screenshotsBox) {
    screenshotsBox.innerHTML = '';
    (novel.screenshots || []).forEach(sc => {
      const item = document.createElement('div');
      item.className = 'screenshot-item';
      item.innerHTML = `
        <div class="screenshot-preview">🖼️</div>
        <div class="screenshot-title">${escapeHtml(sc.title || '')}</div>
        <div class="screenshot-caption">${escapeHtml(sc.caption || '')}</div>
      `;
      screenshotsBox.appendChild(item);
    });
  }

  // Ссылки на скачивание (Чистая обработка через JS-события)
  if (downloadsList) {
    downloadsList.innerHTML = '';
    (novel.downloadLinks || []).forEach(link => {
      const card = document.createElement('div');
      card.className = 'download-card';
      card.innerHTML = `
        <div class="download-info">
          <div class="download-icon">⬇️</div>
          <div>
            <div class="download-name">${escapeHtml(link.name || 'ფაილი')}</div>
            <div class="download-size">ზომა: ${escapeHtml(link.size || 'N/A')}</div>
          </div>
        </div>
        <a href="${escapeHtml(link.url || '#')}" class="btn btn-primary download-action-btn" style="padding: 8px 18px; font-size: 0.85rem;">
          ჩამოტვირთვა
        </a>
      `;

      const downloadBtn = card.querySelector('.download-action-btn');
      if (downloadBtn) {
        downloadBtn.addEventListener('click', (e) => {
          e.preventDefault();
          showToast(`ინფორმაცია: "${novel.titleGeo}"-ის პატჩის გადმოწერა მალე დაიწყება.`);
          if (window.soundEngine) window.soundEngine.playClickSound();
        });
      }

      downloadsList.appendChild(card);
    });
  }

  // Инструкция установки
  if (installGuideList) {
    installGuideList.innerHTML = '';
    (novel.installGuide || []).forEach(step => {
      const li = document.createElement('li');
      li.className = 'guide-step';
      li.textContent = step;
      installGuideList.appendChild(li);
    });
  }

  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal() {
  const modal = document.getElementById('novel-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    if (window.soundEngine) window.soundEngine.playClickSound();
  }
}

// ==========================================================================
// 8. კონტაქტისა და უკუკავშირის ფორმა
// ==========================================================================
function setupContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const nameEl = document.getElementById('contact-name');
    const emailEl = document.getElementById('contact-email');
    const subjectEl = document.getElementById('contact-subject');
    const messageEl = document.getElementById('contact-message');

    const name = nameEl ? nameEl.value.trim() : '';
    const email = emailEl ? emailEl.value.trim() : '';
    const subject = subjectEl ? subjectEl.value : 'other';
    const message = messageEl ? messageEl.value.trim() : '';

    if (!name || !email || !message) {
      showToast('გთხოვთ შეავსოთ ყველა სავალდებულო ველი!', 'error');
      return;
    }

    const newFeedback = {
      name,
      email,
      subject,
      message,
      timestamp: new Date().toISOString()
    };

    try {
      const stored = JSON.parse(localStorage.getItem('geo_vn_messages') || '[]');
      stored.push(newFeedback);
      localStorage.setItem('geo_vn_messages', JSON.stringify(stored));
    } catch (err) {
      console.warn('Storage error:', err);
    }

    if (window.soundEngine) window.soundEngine.playSuccessSound();

    form.classList.add('form-success-animation');
    setTimeout(() => form.classList.remove('form-success-animation'), 800);

    showToast('გმადლობთ! თქვენი შეტყობინება წარმატებით გაიგზავნა.');
    form.reset();
  });
}

// ==========================================================================
// 9. Toast შეტყობინებები (Безопасно через textContent)
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
  
  const iconSpan = document.createElement('span');
  iconSpan.textContent = type === 'success' ? '🌸' : '⚠️';

  const textSpan = document.createElement('span');
  textSpan.textContent = text;

  toast.appendChild(iconSpan);
  toast.appendChild(textSpan);
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = '0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ==========================================================================
// 10. Ripple ეფექტი ღილაკებზე (С автоматической очисткой DOM)
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

    // Автоматическое удаление элемента после завершения анимации
    circle.addEventListener('animationend', () => {
      circle.remove();
    });

    btn.appendChild(circle);
  });
}
