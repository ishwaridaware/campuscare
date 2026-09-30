/**
 * CAMPUS CARE – Main Application Controller
 * Handles SPA Routing, UI Rendering, Search/Filter, Image Upload, Modals, and Admin Controls.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Auth & UI
  CampusAuth.init();
  App.init();
});

const App = {
  activeView: 'home',
  currentBrowseFilters: {
    search: '',
    type: 'all', // 'all' | 'lost' | 'found'
    category: 'all',
    location: 'all',
    sort: 'newest'
  },
  activeMyReportsFilter: 'all',
  activeAdminFilters: {
    search: '',
    status: 'all',
    type: 'all'
  },
  selectedReportImageBase64: null,
  otpTimerInterval: null,

  init() {
    this.bindRouting();
    this.bindNavEvents();
    this.bindHomeEvents();
    this.bindBrowseEvents();
    this.bindReportEvents();
    this.bindMyReportsEvents();
    this.bindAdminEvents();
    this.bindModalEvents();
    this.bindAuthEvents();

    // Listen to Auth State Changes
    CampusAuth.onAuthChange((user) => {
      this.updateNavbarAuthUI(user);
      this.prefillReportContactInfo(user);
      if (this.activeView === 'my-reports') {
        this.renderMyReports();
      }
      if (this.activeView === 'admin') {
        this.renderAdminView();
      }
    });

    // Initial Route Handling
    this.handleRoute();

    // Set default date in Report Form to today
    const dateInput = document.getElementById('report-date');
    if (dateInput) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }

    this.prefillReportContactInfo(CampusAuth.getCurrentUser());
  },

  /* ========================================================================
     1. ROUTING & VIEW NAVIGATION
     ======================================================================== */
  bindRouting() {
    window.addEventListener('hashchange', () => this.handleRoute());
  },

  handleRoute() {
    let hash = window.location.hash.replace('#', '').trim();
    const pathname = window.location.pathname.replace(/^\/+/, '').trim().toLowerCase();

    // Check if route was specified via path (e.g., /admin)
    if (!hash && (pathname === 'admin' || pathname.startsWith('admin/'))) {
      hash = 'admin';
    }
    if (!hash) hash = 'home';

    // Valid views
    const validViews = ['home', 'browse', 'report', 'my-reports', 'admin'];
    if (!validViews.includes(hash)) {
      hash = 'home';
    }

    this.navigateToView(hash);
  },

  navigateToView(viewName) {
    this.activeView = viewName;

    // Toggle active class on view sections
    document.querySelectorAll('.app-view').forEach(el => {
      el.classList.add('hidden');
      el.classList.remove('active');
    });

    const targetView = document.getElementById(`view-${viewName}`);
    if (targetView) {
      targetView.classList.remove('hidden');
      targetView.classList.add('active');
    }

    // Update Desktop Nav Links
    document.querySelectorAll('.nav-menu .nav-link').forEach(link => {
      if (link.getAttribute('data-view') === viewName) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Update Drawer Links
    document.querySelectorAll('.drawer-body .drawer-link').forEach(link => {
      if (link.getAttribute('data-view') === viewName) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Close mobile drawer if open
    this.closeMobileDrawer();

    // View-specific initializations
    if (viewName === 'home') {
      this.renderHomeView();
    } else if (viewName === 'browse') {
      this.renderBrowseView();
    } else if (viewName === 'my-reports') {
      this.renderMyReports();
    } else if (viewName === 'admin') {
      // STRICT ROUTE PROTECTION: Only the single designated admin email may access the admin dashboard
      const isDesignatedAdmin = CampusAuth.isAdmin();
      const deniedContainer = document.getElementById('admin-access-denied');
      const dashboardContainer = document.getElementById('admin-dashboard-content');
      const deniedCurrentEmail = document.getElementById('denied-current-email');
      const deniedAdminEmail = document.getElementById('denied-admin-email');

      if (deniedAdminEmail) {
        deniedAdminEmail.textContent = CampusAuth.getAdminEmail();
      }
      if (deniedCurrentEmail) {
        const u = CampusAuth.getCurrentUser();
        deniedCurrentEmail.textContent = u ? `${u.name} (${u.email})` : 'Unauthenticated (Guest)';
      }

      if (!isDesignatedAdmin) {
        // ACCESS DENIED: Hide the admin dashboard entirely and show Access Denied view
        if (deniedContainer) deniedContainer.classList.remove('hidden');
        if (dashboardContainer) dashboardContainer.classList.add('hidden');
      } else {
        // AUTHORIZED ADMIN: Reveal admin dashboard and render live statistics and items table
        if (deniedContainer) deniedContainer.classList.add('hidden');
        if (dashboardContainer) dashboardContainer.classList.remove('hidden');
        this.renderAdminView();
      }
    }
  },

  bindNavEvents() {
    // Mobile Drawer Toggles
    const toggleBtn = document.getElementById('mobile-toggle-btn');
    const closeBtn = document.getElementById('drawer-close-btn');
    const backdrop = document.getElementById('mobile-nav-backdrop');
    const drawer = document.getElementById('mobile-nav-drawer');

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        drawer.classList.remove('hidden');
        backdrop.classList.remove('hidden');
      });
    }

    const closeDrawer = () => {
      drawer.classList.add('hidden');
      backdrop.classList.add('hidden');
    };

    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    if (backdrop) backdrop.addEventListener('click', closeDrawer);

    // Profile Dropdown Toggle
    const profileTrigger = document.getElementById('user-profile-menu-trigger');
    const profileDropdown = document.getElementById('user-dropdown-menu');

    if (profileTrigger && profileDropdown) {
      profileTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        profileDropdown.classList.toggle('hidden');
      });

      document.addEventListener('click', () => {
        profileDropdown.classList.add('hidden');
      });
    }

    // Logout
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        CampusAuth.logout();
        this.showToast('You have been signed out successfully.', 'info');
        if (this.activeView === 'admin' || this.activeView === 'my-reports') {
          window.location.hash = '#home';
        }
      });
    }
  },

  closeMobileDrawer() {
    const backdrop = document.getElementById('mobile-nav-backdrop');
    const drawer = document.getElementById('mobile-nav-drawer');
    if (backdrop) backdrop.classList.add('hidden');
    if (drawer) drawer.classList.add('hidden');
  },

  updateNavbarAuthUI(user) {
    const loggedOutBox = document.getElementById('nav-auth-logged-out');
    const loggedInBox = document.getElementById('nav-auth-logged-in');
    const drawerAuthActions = document.getElementById('drawer-auth-actions');

    const isDesignatedAdmin = CampusAuth.isAdmin();

    // 1. Toggle Admin Panel link strictly based on designated administrator authentication
    document.querySelectorAll('.admin-nav-link').forEach(link => {
      if (isDesignatedAdmin) {
        link.classList.remove('hidden');
        link.style.display = '';
      } else {
        link.classList.add('hidden');
        link.style.display = 'none';
      }
    });

    document.querySelectorAll('.admin-dropdown-item').forEach(item => {
      if (isDesignatedAdmin) {
        item.classList.remove('hidden');
        item.style.display = '';
      } else {
        item.classList.add('hidden');
        item.style.display = 'none';
      }
    });

    // If currently viewing admin page and user is not admin, refresh route state to show Access Denied
    if (this.activeView === 'admin') {
      this.navigateToView('admin');
    }

    if (!user) {
      if (loggedOutBox) loggedOutBox.classList.remove('hidden');
      if (loggedInBox) loggedInBox.classList.add('hidden');
      if (drawerAuthActions) {
        drawerAuthActions.innerHTML = `
          <button class="btn btn-primary w-100" id="drawer-btn-login"><i class="fa-solid fa-user"></i> Login / Register</button>
        `;
        document.getElementById('drawer-btn-login')?.addEventListener('click', () => {
          this.closeMobileDrawer();
          this.openAuthModal('login');
        });
      }
    } else {
      if (loggedOutBox) loggedOutBox.classList.add('hidden');
      if (loggedInBox) loggedInBox.classList.remove('hidden');

      // Update name, role, avatar
      const nameEl = document.getElementById('user-nav-name');
      const roleEl = document.getElementById('user-nav-role');
      const emailEl = document.getElementById('user-dropdown-email');
      const avatarEl = document.getElementById('user-avatar-initials');

      if (nameEl) nameEl.textContent = user.name;
      if (roleEl) roleEl.textContent = isDesignatedAdmin ? 'Administrator' : user.role;
      if (emailEl) emailEl.textContent = user.email;
      if (avatarEl) {
        const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        avatarEl.textContent = initials || 'U';
      }

      if (drawerAuthActions) {
        drawerAuthActions.innerHTML = `
          <div class="d-flex align-center gap-2 mb-2">
            <div class="avatar-circle">${avatarEl ? avatarEl.textContent : 'U'}</div>
            <div>
              <div class="font-bold">${user.name}</div>
              <small class="text-muted">${isDesignatedAdmin ? 'Administrator' : user.role} &bull; ${user.email}</small>
            </div>
          </div>
          <button class="btn btn-outline-secondary w-100 btn-sm text-danger" id="drawer-btn-logout">
            <i class="fa-solid fa-arrow-right-from-bracket"></i> Logout
          </button>
        `;
        document.getElementById('drawer-btn-logout')?.addEventListener('click', () => {
          this.closeMobileDrawer();
          CampusAuth.logout();
          this.showToast('You have been signed out.', 'info');
        });
      }
    }
  },

  /* ========================================================================
     2. HOME VIEW LOGIC
     ======================================================================== */
  bindHomeEvents() {
    const heroLostBtn = document.getElementById('hero-btn-lost');
    const heroFoundBtn = document.getElementById('hero-btn-found');

    if (heroLostBtn) {
      heroLostBtn.addEventListener('click', () => {
        this.setReportType('Lost');
        window.location.hash = '#report';
      });
    }

    if (heroFoundBtn) {
      heroFoundBtn.addEventListener('click', () => {
        this.setReportType('Found');
        window.location.hash = '#report';
      });
    }
  },

  renderHomeView() {
    // 1. Update Metrics
    const metrics = CampusData.getMetrics();
    const totalEl = document.getElementById('stat-total-items');
    const lostEl = document.getElementById('stat-lost-items');
    const foundEl = document.getElementById('stat-found-items');
    const returnedEl = document.getElementById('stat-returned-items');

    if (totalEl) totalEl.textContent = metrics.total;
    if (lostEl) lostEl.textContent = metrics.lost;
    if (foundEl) foundEl.textContent = metrics.found;
    if (returnedEl) returnedEl.textContent = metrics.returned;

    // 2. Render 4 Recent Items
    const items = CampusData.getAll();
    const recent = items.slice(0, 4);
    const container = document.getElementById('home-recent-grid');
    if (!container) return;

    if (recent.length === 0) {
      container.innerHTML = `<p class="text-muted text-center w-100">No items reported yet.</p>`;
      return;
    }

    container.innerHTML = recent.map(item => this.createItemCardHTML(item)).join('');
    this.attachCardClickHandlers(container);
  },

  /* ========================================================================
     3. BROWSE & SEARCH LOGIC
     ======================================================================== */
  bindBrowseEvents() {
    // Search input
    const searchInput = document.getElementById('browse-search-input');
    const clearBtn = document.getElementById('browse-search-clear');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.currentBrowseFilters.search = e.target.value.trim().toLowerCase();
        if (clearBtn) {
          clearBtn.classList.toggle('hidden', !e.target.value);
        }
        this.renderBrowseView();
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        this.currentBrowseFilters.search = '';
        clearBtn.classList.add('hidden');
        this.renderBrowseView();
        searchInput.focus();
      });
    }

    // Sort select
    const sortSelect = document.getElementById('browse-sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.currentBrowseFilters.sort = e.target.value;
        this.renderBrowseView();
      });
    }

    // Segmented Status Filter (All / Lost / Found)
    const segmentBtns = document.querySelectorAll('.status-segment-group .segment-btn');
    segmentBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        segmentBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentBrowseFilters.type = btn.getAttribute('data-type');
        this.renderBrowseView();
      });
    });

    // Location dropdown
    const locationSelect = document.getElementById('browse-location-select');
    if (locationSelect) {
      locationSelect.addEventListener('change', (e) => {
        this.currentBrowseFilters.location = e.target.value;
        this.renderBrowseView();
      });
    }

    // Category pills
    const catPills = document.querySelectorAll('.category-pills-list .cat-pill');
    catPills.forEach(pill => {
      pill.addEventListener('click', () => {
        catPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.currentBrowseFilters.category = pill.getAttribute('data-category');
        this.renderBrowseView();
      });
    });

    // Reset filters buttons
    const resetBtn = document.getElementById('btn-reset-filters');
    const emptyResetBtn = document.getElementById('btn-empty-reset');

    const doReset = () => {
      this.currentBrowseFilters = {
        search: '',
        type: 'all',
        category: 'all',
        location: 'all',
        sort: 'newest'
      };
      if (searchInput) searchInput.value = '';
      if (clearBtn) clearBtn.classList.add('hidden');
      if (sortSelect) sortSelect.value = 'newest';
      if (locationSelect) locationSelect.value = 'all';

      segmentBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-type') === 'all'));
      catPills.forEach(p => p.classList.toggle('active', p.getAttribute('data-category') === 'all'));

      this.renderBrowseView();
    };

    if (resetBtn) resetBtn.addEventListener('click', doReset);
    if (emptyResetBtn) emptyResetBtn.addEventListener('click', doReset);
  },

  renderBrowseView() {
    let items = CampusData.getAll();

    // 1. Update Segmented Count Numbers
    const countAllEl = document.getElementById('count-all');
    const countLostEl = document.getElementById('count-lost');
    const countFoundEl = document.getElementById('count-found');

    if (countAllEl) countAllEl.textContent = items.length;
    if (countLostEl) countLostEl.textContent = items.filter(i => i.type === 'Lost').length;
    if (countFoundEl) countFoundEl.textContent = items.filter(i => i.type === 'Found').length;

    // 2. Filter by Type
    if (this.currentBrowseFilters.type !== 'all') {
      const typeTarget = this.currentBrowseFilters.type === 'lost' ? 'Lost' : 'Found';
      items = items.filter(i => i.type === typeTarget);
    }

    // 3. Filter by Category
    if (this.currentBrowseFilters.category !== 'all') {
      items = items.filter(i => i.category === this.currentBrowseFilters.category);
    }

    // 4. Filter by Location
    if (this.currentBrowseFilters.location !== 'all') {
      items = items.filter(i => (i.location || '').toLowerCase().includes(this.currentBrowseFilters.location.toLowerCase()));
    }

    // 5. Filter by Search Query
    if (this.currentBrowseFilters.search) {
      const q = this.currentBrowseFilters.search;
      items = items.filter(i => {
        return (
          (i.name && i.name.toLowerCase().includes(q)) ||
          (i.description && i.description.toLowerCase().includes(q)) ||
          (i.location && i.location.toLowerCase().includes(q)) ||
          (i.category && i.category.toLowerCase().includes(q))
        );
      });
    }

    // 6. Sort
    if (this.currentBrowseFilters.sort === 'newest') {
      items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } else if (this.currentBrowseFilters.sort === 'oldest') {
      items.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    } else if (this.currentBrowseFilters.sort === 'name-asc') {
      items.sort((a, b) => a.name.localeCompare(b.name));
    }

    // 7. Update Filter Summary Row
    const summaryRow = document.getElementById('filter-summary-row');
    const summaryText = document.getElementById('filter-summary-text');
    const hasActiveFilters = (
      this.currentBrowseFilters.search ||
      this.currentBrowseFilters.type !== 'all' ||
      this.currentBrowseFilters.category !== 'all' ||
      this.currentBrowseFilters.location !== 'all'
    );

    if (summaryRow && summaryText) {
      if (hasActiveFilters) {
        summaryRow.classList.remove('hidden');
        summaryText.textContent = `Showing ${items.length} matching item${items.length === 1 ? '' : 's'}`;
      } else {
        summaryRow.classList.add('hidden');
      }
    }

    // 8. Render Cards or Empty State
    const grid = document.getElementById('browse-items-grid');
    const emptyState = document.getElementById('browse-empty-state');

    if (!grid || !emptyState) return;

    if (items.length === 0) {
      grid.innerHTML = '';
      emptyState.classList.remove('hidden');
    } else {
      emptyState.classList.add('hidden');
      grid.innerHTML = items.map(item => this.createItemCardHTML(item)).join('');
      this.attachCardClickHandlers(grid);
    }
  },

  createItemCardHTML(item, isMyReport = false) {
    const isLost = item.type === 'Lost';
    const typeBadgeClass = isLost ? 'badge-lost' : 'badge-found';
    const typeIcon = isLost ? 'fa-circle-exclamation' : 'fa-hand-holding-heart';

    let statusBadgeClass = 'badge-reported';
    if (item.status === 'Verified') statusBadgeClass = 'badge-verified';
    if (item.status === 'Returned') statusBadgeClass = 'badge-returned';

    // Format Date nicely
    const formattedDate = item.date || new Date(item.createdAt || Date.now()).toISOString().split('T')[0];

    // Fallback Image
    const imgSrc = item.image || 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=600&q=80';

    return `
      <div class="item-card" data-item-id="${item.id}">
        <div class="card-media">
          <img src="${imgSrc}" alt="${item.name}" class="card-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=600&q=80'">
          <div class="card-badges-top">
            <span class="badge ${typeBadgeClass}"><i class="fa-solid ${typeIcon}"></i> ${item.type}</span>
          </div>
          <div class="card-badges-status">
            <span class="badge ${statusBadgeClass}">${item.status}</span>
          </div>
        </div>

        <div class="card-content">
          <div class="card-category-tag">
            <i class="fa-solid fa-tag"></i> ${item.category || 'General'}
          </div>
          <h3 class="card-title">${item.name}</h3>
          <p class="card-desc">${item.description || 'No additional description provided.'}</p>

          <div class="card-meta-list">
            <div class="card-meta-item" title="${item.location}">
              <i class="fa-solid fa-location-dot"></i>
              <span>${item.location || 'Campus'}</span>
            </div>
            <div class="card-meta-item">
              <i class="fa-regular fa-calendar"></i>
              <span>${formattedDate}</span>
            </div>
          </div>

          ${isMyReport ? `
            <div class="my-card-actions" onclick="event.stopPropagation()">
              <button class="btn btn-outline-primary btn-sm btn-edit-my-item" data-id="${item.id}">
                <i class="fa-regular fa-pen-to-square"></i> Edit
              </button>
              ${CampusAuth.isAdmin() ? `
                ${item.status !== 'Returned' ? `
                  <button class="btn btn-outline-success btn-sm btn-return-my-item" data-id="${item.id}" title="Mark as returned">
                    <i class="fa-solid fa-check"></i> Returned
                  </button>
                ` : ''}
                <button class="btn btn-outline-secondary btn-sm text-danger btn-delete-my-item" data-id="${item.id}" title="Delete report">
                  <i class="fa-regular fa-trash-can"></i>
                </button>
              ` : `
                <span class="badge badge-subtle" title="Status transitions and deletions are managed by the designated Campus Administrator">
                  <i class="fa-solid fa-shield-halved"></i> Admin Managed
                </span>
              `}
            </div>
          ` : `
            <div class="card-action-bar">
              <div class="card-reporter-info">
                <span class="card-reporter-dot"></span>
                <span>Reported by ${item.reporterRole || 'Student'}</span>
              </div>
              <span class="btn-link-sm">Details &rarr;</span>
            </div>
          `}
        </div>
      </div>
    `;
  },

  attachCardClickHandlers(container) {
    container.querySelectorAll('.item-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // Prevent opening if user clicked edit/delete/return buttons
        if (e.target.closest('.my-card-actions')) return;
        const itemId = card.getAttribute('data-item-id');
        this.openItemDetailsModal(itemId);
      });
    });
  },

  /* ========================================================================
     4. REPORT ITEM LOGIC
     ======================================================================== */
  bindReportEvents() {
    const btnToggleLost = document.getElementById('btn-toggle-lost');
    const btnToggleFound = document.getElementById('btn-toggle-found');
    const reportTypeInput = document.getElementById('report-type-input');

    if (btnToggleLost && btnToggleFound && reportTypeInput) {
      btnToggleLost.addEventListener('click', () => {
        this.setReportType('Lost');
      });
      btnToggleFound.addEventListener('click', () => {
        this.setReportType('Found');
      });
    }

    // Quick location picker tags
    document.querySelectorAll('.quick-location-tags .loc-tag').forEach(tag => {
      tag.addEventListener('click', () => {
        const val = tag.getAttribute('data-val');
        const locInput = document.getElementById('report-location');
        if (locInput) locInput.value = val;
      });
    });

    // Image Upload & Drag-and-drop
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('report-image-input');
    const idleState = document.getElementById('upload-idle-state');
    const previewContainer = document.getElementById('upload-preview-container');
    const previewElement = document.getElementById('image-preview-element');
    const removePreviewBtn = document.getElementById('btn-remove-image');

    if (dropArea && fileInput) {
      ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, (e) => {
          e.preventDefault();
          dropArea.classList.add('dragover');
        });
      });

      ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, (e) => {
          e.preventDefault();
          dropArea.classList.remove('dragover');
        });
      });

      dropArea.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files && files[0]) {
          this.handleImageFile(files[0]);
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleImageFile(e.target.files[0]);
        }
      });
    }

    if (removePreviewBtn) {
      removePreviewBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectedReportImageBase64 = null;
        fileInput.value = '';
        previewContainer.classList.add('hidden');
        idleState.classList.remove('hidden');
      });
    }

    // Sample photo chooser chips
    document.querySelectorAll('.sample-photos-chips .sample-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const imgUrl = chip.getAttribute('data-img');
        this.selectedReportImageBase64 = imgUrl;
        previewElement.src = imgUrl;
        idleState.classList.add('hidden');
        previewContainer.classList.remove('hidden');
      });
    });

    // Form Submission
    const form = document.getElementById('report-item-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleReportSubmit();
      });
    }
  },

  setReportType(type) {
    const btnLost = document.getElementById('btn-toggle-lost');
    const btnFound = document.getElementById('btn-toggle-found');
    const input = document.getElementById('report-type-input');

    if (!btnLost || !btnFound || !input) return;

    input.value = type;
    if (type === 'Lost') {
      btnLost.classList.add('active');
      btnFound.classList.remove('active');
    } else {
      btnFound.classList.add('active');
      btnLost.classList.remove('active');
    }
  },

  handleImageFile(file) {
    if (!file.type.startsWith('image/')) {
      this.showToast('Please select a valid image file (JPG, PNG, WebP).', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      this.selectedReportImageBase64 = e.target.result;
      const previewContainer = document.getElementById('upload-preview-container');
      const previewElement = document.getElementById('image-preview-element');
      const idleState = document.getElementById('upload-idle-state');

      previewElement.src = e.target.result;
      idleState.classList.add('hidden');
      previewContainer.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  },

  prefillReportContactInfo(user) {
    if (!user) return;
    const nameInput = document.getElementById('report-contact-name');
    const emailInput = document.getElementById('report-contact-email');
    const phoneInput = document.getElementById('report-contact-phone');
    const roleSelect = document.getElementById('report-contact-role');

    if (nameInput && !nameInput.value) nameInput.value = user.name || '';
    if (emailInput && !emailInput.value) emailInput.value = user.email || '';
    if (phoneInput && !phoneInput.value) phoneInput.value = user.phone || '';
    if (roleSelect && user.role) roleSelect.value = user.role;
  },

  handleReportSubmit() {
    const type = document.getElementById('report-type-input').value;
    const name = document.getElementById('report-item-name').value.trim();
    const category = document.getElementById('report-category').value;
    const date = document.getElementById('report-date').value;
    const location = document.getElementById('report-location').value.trim();
    const description = document.getElementById('report-description').value.trim();
    const reporterName = document.getElementById('report-contact-name').value.trim();
    const reporterRole = document.getElementById('report-contact-role').value;
    const reporterEmail = document.getElementById('report-contact-email').value.trim();
    const reporterPhone = document.getElementById('report-contact-phone').value.trim();

    // Validation
    if (!name || !category || !date || !location || !description || !reporterName || !reporterEmail || !reporterPhone) {
      this.showToast('Please fill out all required fields marked with an asterisk (*).', 'error');
      return;
    }

    // Default image based on category if none uploaded
    let finalImage = this.selectedReportImageBase64;
    if (!finalImage) {
      const fallbacks = {
        'Electronics': 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
        'ID Cards & Documents': 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
        'Keys': 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=600&q=80',
        'Books & Stationery': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
        'Wallets & Bags': 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=600&q=80',
        'Clothing': 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80',
        'Others': 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80'
      };
      finalImage = fallbacks[category] || fallbacks['Others'];
    }

    const newItem = CampusData.add({
      type,
      name,
      category,
      date,
      location,
      description,
      image: finalImage,
      reporterName,
      reporterRole,
      reporterEmail,
      reporterPhone
    });

    this.showToast(`Your ${type.toLowerCase()} item report has been published successfully!`, 'success');

    // Reset Form
    document.getElementById('report-item-form').reset();
    document.getElementById('report-date').value = new Date().toISOString().split('T')[0];
    this.selectedReportImageBase64 = null;
    document.getElementById('upload-preview-container').classList.add('hidden');
    document.getElementById('upload-idle-state').classList.remove('hidden');

    // Prefill user contact info again
    this.prefillReportContactInfo(CampusAuth.getCurrentUser());

    // Navigate to Browse view
    window.location.hash = '#browse';
  },

  /* ========================================================================
     5. MY REPORTS VIEW LOGIC
     ======================================================================== */
  bindMyReportsEvents() {
    const subnavBtns = document.querySelectorAll('.my-reports-subnav .subnav-btn');
    subnavBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        subnavBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeMyReportsFilter = btn.getAttribute('data-my-filter');
        this.renderMyReports();
      });
    });

    // Form edit submit
    const editForm = document.getElementById('edit-item-form');
    if (editForm) {
      editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleEditSubmit();
      });
    }

    const cancelEditBtn = document.getElementById('btn-cancel-edit');
    if (cancelEditBtn) {
      cancelEditBtn.addEventListener('click', () => {
        document.getElementById('modal-edit-report').classList.add('hidden');
      });
    }
  },

  renderMyReports() {
    const user = CampusAuth.getCurrentUser();
    const grid = document.getElementById('my-reports-grid');
    const emptyState = document.getElementById('my-reports-empty-state');
    if (!grid || !emptyState) return;

    if (!user) {
      grid.innerHTML = `
        <div class="empty-state-card w-100" style="grid-column: 1 / -1;">
          <div class="empty-state-icon"><i class="fa-solid fa-lock"></i></div>
          <h3 class="empty-state-title">Sign In Required</h3>
          <p class="empty-state-desc">Please log in to view and manage items you have reported.</p>
          <button class="btn btn-primary" id="btn-login-from-my-reports">Sign In Now</button>
        </div>
      `;
      emptyState.classList.add('hidden');
      document.getElementById('btn-login-from-my-reports')?.addEventListener('click', () => {
        this.openAuthModal('login');
      });
      return;
    }

    let items = CampusData.getByReporterEmail(user.email);

    // Update subnav counts
    const countAll = items.length;
    const countReported = items.filter(i => i.status === 'Reported').length;
    const countVerified = items.filter(i => i.status === 'Verified').length;
    const countReturned = items.filter(i => i.status === 'Returned').length;

    document.getElementById('my-count-all').textContent = countAll;
    document.getElementById('my-count-reported').textContent = countReported;
    document.getElementById('my-count-verified').textContent = countVerified;
    document.getElementById('my-count-returned').textContent = countReturned;

    // Filter
    if (this.activeMyReportsFilter !== 'all') {
      items = items.filter(i => i.status === this.activeMyReportsFilter);
    }

    if (items.length === 0) {
      grid.innerHTML = '';
      emptyState.classList.remove('hidden');
    } else {
      emptyState.classList.add('hidden');
      grid.innerHTML = items.map(item => this.createItemCardHTML(item, true)).join('');
      this.attachCardClickHandlers(grid);
      this.attachMyReportsActionHandlers(grid);
    }
  },

  attachMyReportsActionHandlers(container) {
    // Edit buttons (allowed for report author)
    container.querySelectorAll('.btn-edit-my-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        this.openEditModal(id);
      });
    });

    // Mark as Returned buttons (Strictly restricted to designated administrator)
    container.querySelectorAll('.btn-return-my-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!CampusAuth.isAdmin()) {
          this.showToast('Access Denied: Only the designated administrator can mark items as returned.', 'error');
          return;
        }
        const id = btn.getAttribute('data-id');
        if (confirm('Mark this item as Returned / Resolved?')) {
          CampusData.update(id, { status: 'Returned' }, CampusAuth.getCurrentUser()?.email);
          this.showToast('Item marked as Returned and resolved.', 'success');
          this.renderMyReports();
        }
      });
    });

    // Delete buttons (Strictly restricted to designated administrator)
    container.querySelectorAll('.btn-delete-my-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!CampusAuth.isAdmin()) {
          this.showToast('Access Denied: Only the designated administrator can delete items.', 'error');
          return;
        }
        const id = btn.getAttribute('data-id');
        if (confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
          CampusData.delete(id, CampusAuth.getCurrentUser()?.email);
          this.showToast('Report deleted successfully.', 'info');
          this.renderMyReports();
        }
      });
    });
  },

  openEditModal(itemId) {
    const item = CampusData.getById(itemId);
    if (!item) return;

    document.getElementById('edit-item-id').value = item.id;
    document.getElementById('edit-item-name').value = item.name;
    document.getElementById('edit-category').value = item.category;

    const statusSelect = document.getElementById('edit-status');
    if (statusSelect) {
      statusSelect.value = item.status || 'Reported';
      // Only the single designated administrator can change status to Returned or Verified
      statusSelect.disabled = !CampusAuth.isAdmin();
      statusSelect.title = CampusAuth.isAdmin() ? '' : 'Lifecycle status can only be modified by the designated Campus Administrator';
    }

    document.getElementById('edit-location').value = item.location;
    document.getElementById('edit-description').value = item.description;

    document.getElementById('modal-edit-report').classList.remove('hidden');
  },

  handleEditSubmit() {
    const id = document.getElementById('edit-item-id').value;
    const name = document.getElementById('edit-item-name').value.trim();
    const category = document.getElementById('edit-category').value;
    const location = document.getElementById('edit-location').value.trim();
    const description = document.getElementById('edit-description').value.trim();

    if (!name || !location || !description) {
      this.showToast('Please fill out all required fields.', 'error');
      return;
    }

    const currentItem = CampusData.getById(id);
    let status = currentItem ? currentItem.status : 'Reported';

    // Only allow status changes if the user is the designated admin
    if (CampusAuth.isAdmin()) {
      status = document.getElementById('edit-status').value;
    }

    CampusData.update(id, { name, category, status, location, description }, CampusAuth.getCurrentUser()?.email);
    document.getElementById('modal-edit-report').classList.add('hidden');
    this.showToast('Report updated successfully!', 'success');
    this.renderMyReports();
  },

  /* ========================================================================
     6. ADMIN PANEL LOGIC
     ======================================================================== */
  bindAdminEvents() {
    // Return to Home button on Access Denied screen
    const returnHomeBtn = document.getElementById('btn-admin-return-home');
    if (returnHomeBtn) {
      returnHomeBtn.addEventListener('click', () => {
        window.location.hash = '#home';
        if (window.location.pathname.endsWith('/admin')) {
          window.location.href = '/#home';
        }
      });
    }

    // Reset sample data (Admin Only)
    const resetDataBtn = document.getElementById('btn-reset-sample-data');
    if (resetDataBtn) {
      resetDataBtn.addEventListener('click', () => {
        if (!CampusAuth.isAdmin()) {
          this.showToast('Access Denied: Only the designated administrator can reset data.', 'error');
          return;
        }
        if (confirm('Reset database back to initial sample items? Custom reports will be refreshed.')) {
          CampusData.resetSampleData();
          this.showToast('Demo data successfully restored.', 'success');
          this.renderAdminView();
        }
      });
    }

    // Admin search
    const adminSearchInput = document.getElementById('admin-search-input');
    if (adminSearchInput) {
      adminSearchInput.addEventListener('input', (e) => {
        this.activeAdminFilters.search = e.target.value.trim().toLowerCase();
        this.renderAdminTable();
      });
    }

    // Admin status filter
    const statusFilter = document.getElementById('admin-status-filter');
    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        this.activeAdminFilters.status = e.target.value;
        this.renderAdminTable();
      });
    }

    // Admin type filter
    const typeFilter = document.getElementById('admin-type-filter');
    if (typeFilter) {
      typeFilter.addEventListener('change', (e) => {
        this.activeAdminFilters.type = e.target.value;
        this.renderAdminTable();
      });
    }
  },

  renderAdminView() {
    // 1. Update Metrics
    const metrics = CampusData.getMetrics();
    document.getElementById('admin-stat-total').textContent = metrics.total;
    document.getElementById('admin-stat-pending').textContent = metrics.reported;
    document.getElementById('admin-stat-verified').textContent = metrics.verified;
    document.getElementById('admin-stat-returned').textContent = metrics.returned;

    this.renderAdminTable();
  },

  renderAdminTable() {
    let items = CampusData.getAll();

    // Filter by type
    if (this.activeAdminFilters.type !== 'all') {
      items = items.filter(i => i.type === this.activeAdminFilters.type);
    }

    // Filter by status
    if (this.activeAdminFilters.status !== 'all') {
      items = items.filter(i => i.status === this.activeAdminFilters.status);
    }

    // Filter by search
    if (this.activeAdminFilters.search) {
      const q = this.activeAdminFilters.search;
      items = items.filter(i => {
        return (
          (i.name && i.name.toLowerCase().includes(q)) ||
          (i.reporterName && i.reporterName.toLowerCase().includes(q)) ||
          (i.location && i.location.toLowerCase().includes(q)) ||
          (i.category && i.category.toLowerCase().includes(q))
        );
      });
    }

    const tbody = document.getElementById('admin-table-body');
    const emptyState = document.getElementById('admin-table-empty');
    if (!tbody || !emptyState) return;

    if (items.length === 0) {
      tbody.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    tbody.innerHTML = items.map(item => {
      const typeClass = item.type === 'Lost' ? 'badge-lost' : 'badge-found';
      let statusClass = 'badge-reported';
      if (item.status === 'Verified') statusClass = 'badge-verified';
      if (item.status === 'Returned') statusClass = 'badge-returned';

      return `
        <tr>
          <td>
            <div class="admin-item-cell">
              <img src="${item.image || 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=120&q=80'}" alt="${item.name}" class="admin-thumb" onerror="this.src='https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=120&q=80'">
              <div>
                <span class="admin-item-title">${item.name}</span>
                <span class="admin-item-sub">ID: ${item.id}</span>
              </div>
            </div>
          </td>
          <td><span class="badge ${typeClass}">${item.type}</span></td>
          <td>${item.category}</td>
          <td>
            <div><i class="fa-solid fa-location-dot text-primary"></i> ${item.location}</div>
            <small class="text-muted"><i class="fa-regular fa-calendar"></i> ${item.date}</small>
          </td>
          <td>
            <div class="font-bold">${item.reporterName}</div>
            <small class="text-muted">${item.reporterRole} &bull; ${item.reporterEmail}</small>
          </td>
          <td>
            <span class="badge ${statusClass}">${item.status}</span>
          </td>
          <td>
            <div class="table-actions">
              ${item.status !== 'Verified' ? `
                <button class="btn-icon-action btn-verify btn-admin-action" data-action="verify" data-id="${item.id}" title="Verify report authenticity">
                  <i class="fa-solid fa-circle-check text-primary"></i>
                </button>
              ` : ''}
              ${item.status !== 'Returned' ? `
                <button class="btn-icon-action btn-return btn-admin-action" data-action="return" data-id="${item.id}" title="Mark as returned to owner">
                  <i class="fa-solid fa-handshake text-success"></i>
                </button>
              ` : ''}
              <button class="btn-icon-action btn-delete btn-admin-action" data-action="delete" data-id="${item.id}" title="Delete inappropriate or fake report">
                <i class="fa-solid fa-trash-can text-danger"></i>
              </button>
              <button class="btn-icon-action btn-admin-action" data-action="view" data-id="${item.id}" title="View full details">
                <i class="fa-solid fa-eye text-primary"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach actions
    tbody.querySelectorAll('.btn-admin-action').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');
        this.handleAdminAction(action, id);
      });
    });
  },

  handleAdminAction(action, itemId) {
    if (!CampusAuth.isAdmin()) {
      this.showToast('Access Denied: Only the designated administrator can perform administrative actions.', 'error');
      return;
    }

    const adminEmail = CampusAuth.getCurrentUser()?.email;

    if (action === 'verify') {
      CampusData.update(itemId, { status: 'Verified' }, adminEmail);
      this.showToast('Item status updated to Verified by Administrator.', 'success');
      this.renderAdminView();
    } else if (action === 'return') {
      CampusData.update(itemId, { status: 'Returned' }, adminEmail);
      this.showToast('Item marked as Returned by Administrator.', 'success');
      this.renderAdminView();
    } else if (action === 'delete') {
      if (confirm('Delete this report from Campus Care database?')) {
        CampusData.delete(itemId, adminEmail);
        this.showToast('Report deleted by Administrator.', 'info');
        this.renderAdminView();
      }
    } else if (action === 'view') {
      this.openItemDetailsModal(itemId);
    }
  },

  /* ========================================================================
     7. MODAL LOGIC (ITEM DETAILS & CONTACT)
     ======================================================================== */
  bindModalEvents() {
    // Close Details Modal
    document.getElementById('modal-close-details')?.addEventListener('click', () => {
      document.getElementById('modal-item-details').classList.add('hidden');
    });

    // Close Contact Modal
    document.getElementById('modal-close-contact')?.addEventListener('click', () => {
      document.getElementById('modal-contact-reporter').classList.add('hidden');
    });

    // Close Edit Modal
    document.getElementById('modal-close-edit')?.addEventListener('click', () => {
      document.getElementById('modal-edit-report').classList.add('hidden');
    });

    // Close Auth Modal
    document.getElementById('modal-close-auth')?.addEventListener('click', () => {
      document.getElementById('modal-auth').classList.add('hidden');
      this.stopOtpCountdown();
    });

    // Global Modal Backdrop clicks & ESC key
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.add('hidden');
          this.stopOtpCountdown();
        }
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.add('hidden'));
        this.stopOtpCountdown();
      }
    });

    // Send Claim Message in Contact Modal
    document.getElementById('btn-send-claim-msg')?.addEventListener('click', () => {
      const msg = document.getElementById('claim-message-text').value.trim();
      if (!msg) {
        this.showToast('Please type a short claim verification message.', 'error');
        return;
      }
      this.showToast('Your claim message has been transmitted to the reporter via campus mail!', 'success');
      document.getElementById('claim-message-text').value = '';
      document.getElementById('modal-contact-reporter').classList.add('hidden');
    });
  },

  openItemDetailsModal(itemId) {
    const item = CampusData.getById(itemId);
    if (!item) return;

    const modal = document.getElementById('modal-item-details');
    const content = document.getElementById('modal-details-content');

    const isLost = item.type === 'Lost';
    const typeClass = isLost ? 'badge-lost' : 'badge-found';
    const typeIcon = isLost ? 'fa-circle-exclamation' : 'fa-hand-holding-heart';

    let statusClass = 'badge-reported';
    if (item.status === 'Verified') statusClass = 'badge-verified';
    if (item.status === 'Returned') statusClass = 'badge-returned';

    const initials = (item.reporterName || 'Student').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    content.innerHTML = `
      <div class="details-layout-grid">
        <div class="details-media-box">
          <img src="${item.image || 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=800&q=80'}" alt="${item.name}" class="details-img">
        </div>

        <div class="details-info-box">
          <div class="details-header-badges">
            <span class="badge ${typeClass}"><i class="fa-solid ${typeIcon}"></i> ${item.type} Item</span>
            <span class="badge ${statusClass}">${item.status}</span>
          </div>

          <h2 class="details-item-title">${item.name}</h2>
          
          <p class="details-description-text">${item.description || 'No detailed description provided.'}</p>

          <div class="details-specs-list">
            <div class="details-spec-item">
              <i class="fa-solid fa-tag"></i>
              <strong>Category:</strong> <span>${item.category}</span>
            </div>
            <div class="details-spec-item">
              <i class="fa-solid fa-location-dot"></i>
              <strong>Campus Location:</strong> <span>${item.location}</span>
            </div>
            <div class="details-spec-item">
              <i class="fa-regular fa-calendar"></i>
              <strong>Date Reported:</strong> <span>${item.date}</span>
            </div>
          </div>

          <div class="details-reporter-box">
            <div class="reporter-mini">
              <div class="reporter-avatar-mini">${initials}</div>
              <div>
                <div class="font-bold">${item.reporterName}</div>
                <small class="text-muted">${item.reporterRole || 'Campus Member'}</small>
              </div>
            </div>
            <button class="btn btn-primary btn-sm" id="btn-open-contact-modal" data-id="${item.id}">
              <i class="fa-solid fa-envelope"></i> Contact Reporter
            </button>
          </div>
        </div>
      </div>
    `;

    // Bind Contact Reporter button inside details modal
    document.getElementById('btn-open-contact-modal')?.addEventListener('click', () => {
      modal.classList.add('hidden');
      this.openContactReporterModal(item);
    });

    modal.classList.remove('hidden');
  },

  openContactReporterModal(item) {
    const modal = document.getElementById('modal-contact-reporter');
    const titleEl = document.getElementById('contact-modal-item-title');
    const nameEl = document.getElementById('contact-reporter-name');
    const roleEl = document.getElementById('contact-reporter-role');
    const emailEl = document.getElementById('contact-email-val');
    const phoneEl = document.getElementById('contact-phone-val');
    const mailLink = document.getElementById('btn-mail-link');
    const waLink = document.getElementById('btn-wa-link');
    const avatar = document.getElementById('contact-avatar');

    titleEl.textContent = `Regarding: "${item.name}" (${item.type})`;
    nameEl.textContent = item.reporterName;
    roleEl.textContent = item.reporterRole;
    emailEl.textContent = item.reporterEmail;
    phoneEl.textContent = item.reporterPhone;

    const initials = (item.reporterName || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    avatar.textContent = initials;

    // Mailto link
    const subject = encodeURIComponent(`Inquiry regarding ${item.type} Item: ${item.name} (Campus Care)`);
    const body = encodeURIComponent(`Hi ${item.reporterName},\n\nI saw your report on Campus Care regarding the "${item.name}" at ${item.location}.\n\n`);
    mailLink.href = `mailto:${item.reporterEmail}?subject=${subject}&body=${body}`;

    // WhatsApp link
    const cleanPhone = (item.reporterPhone || '').replace(/[^0-9]/g, '');
    waLink.href = cleanPhone ? `https://wa.me/${cleanPhone}` : `tel:${item.reporterPhone}`;

    modal.classList.remove('hidden');
  },

  /* ========================================================================
     8. AUTHENTICATION & LOGIN/REGISTER MODAL
     ======================================================================== */
  bindAuthEvents() {
    // Open Login / Register triggers
    document.getElementById('btn-open-login')?.addEventListener('click', () => this.openAuthModal('login'));
    document.getElementById('btn-open-register')?.addEventListener('click', () => this.openAuthModal('register'));

    // Modal Tabs
    const tabLogin = document.getElementById('tab-btn-login');
    const tabRegister = document.getElementById('tab-btn-register');
    const paneLogin = document.getElementById('pane-login');
    const paneRegister = document.getElementById('pane-register');

    if (tabLogin && tabRegister) {
      tabLogin.addEventListener('click', () => {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        paneLogin.classList.remove('hidden');
        paneRegister.classList.add('hidden');
        this.stopOtpCountdown();
      });

      tabRegister.addEventListener('click', () => {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        paneRegister.classList.remove('hidden');
        paneLogin.classList.add('hidden');
        if (!CampusAuth.getPendingSignup()) {
          this.resetRegisterStep(false);
        }
      });
    }

    // Demo Account Buttons
    document.querySelectorAll('.btn-demo-user').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-demo');
        const user = CampusAuth.switchDemo(type);
        if (user) {
          this.showToast(`Logged in as ${user.name} (${user.role})`, 'success');
          document.getElementById('modal-auth').classList.add('hidden');
        }
      });
    });

    // Login Form Submit
    const formLogin = document.getElementById('form-login');
    if (formLogin) {
      formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        if (!email) {
          this.showToast('Please enter your campus email.', 'error');
          return;
        }
        const res = CampusAuth.login(email, password);
        if (res.success) {
          this.showToast(`Welcome back, ${res.user.name}!`, 'success');
          document.getElementById('modal-auth').classList.add('hidden');
        }
      });
    }

    // Register Form Step 1: Request OTP Submit
    const formRegister = document.getElementById('form-register');
    if (formRegister) {
      formRegister.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const role = document.getElementById('reg-role').value;
        const password = document.getElementById('reg-password').value;

        if (!name || !email || !password) {
          this.showToast('Please fill out all registration fields.', 'error');
          return;
        }

        const res = CampusAuth.requestSignupOTP(name, email, password, role);
        if (!res.success) {
          this.showToast(res.message, 'error');
          return;
        }

        // Transition from Step 1 Form to Step 2 OTP Screen
        document.getElementById('register-step-form')?.classList.add('hidden');
        document.getElementById('register-step-otp')?.classList.remove('hidden');
        
        const targetEmailEl = document.getElementById('otp-target-email');
        if (targetEmailEl) targetEmailEl.textContent = res.email;

        const demoOtpEl = document.getElementById('demo-otp-display');
        if (demoOtpEl) demoOtpEl.textContent = res.otp;

        this.resetOtpDigits();
        this.hideOtpError();
        this.startOtpCountdown(30);

        this.showToast(`Verification code sent! Demo OTP: ${res.otp}`, 'info');

        // Auto-focus on first OTP input box
        setTimeout(() => {
          document.querySelector('.otp-digit[data-index="0"]')?.focus();
        }, 150);
      });
    }

    // OTP 6-Digit Inputs (Auto-advance, Backspace, Arrow keys, Paste)
    const otpInputs = document.querySelectorAll('.otp-digit');
    otpInputs.forEach((input, idx) => {
      // Input event (typing digit)
      input.addEventListener('input', (e) => {
        const val = e.target.value.replace(/[^0-9]/g, '');
        e.target.value = val ? val.slice(-1) : '';

        if (e.target.value) {
          e.target.classList.add('has-value');
          this.hideOtpError();
          // Advance to next box
          if (idx < otpInputs.length - 1) {
            otpInputs[idx + 1].focus();
          } else {
            // Check if all 6 boxes are filled
            const fullCode = Array.from(otpInputs).map(i => i.value).join('');
            if (fullCode.length === 6) {
              setTimeout(() => this.submitOtpVerification(), 200);
            }
          }
        } else {
          e.target.classList.remove('has-value');
        }
      });

      // Keydown event (Backspace navigation & Arrows)
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace') {
          if (!input.value && idx > 0) {
            otpInputs[idx - 1].focus();
            otpInputs[idx - 1].value = '';
            otpInputs[idx - 1].classList.remove('has-value');
          }
        } else if (e.key === 'ArrowLeft' && idx > 0) {
          otpInputs[idx - 1].focus();
        } else if (e.key === 'ArrowRight' && idx < otpInputs.length - 1) {
          otpInputs[idx + 1].focus();
        }
      });

      // Paste event (e.g. user pastes full 6 digits)
      input.addEventListener('paste', (e) => {
        e.preventDefault();
        const clipboard = (e.clipboardData || window.clipboardData).getData('text');
        const digits = clipboard.replace(/[^0-9]/g, '').slice(0, 6);
        if (digits.length > 0) {
          digits.split('').forEach((digit, dIdx) => {
            if (otpInputs[dIdx]) {
              otpInputs[dIdx].value = digit;
              otpInputs[dIdx].classList.add('has-value');
            }
          });
          this.hideOtpError();
          const focusIndex = Math.min(digits.length, otpInputs.length - 1);
          otpInputs[focusIndex]?.focus();
          if (digits.length === 6) {
            setTimeout(() => this.submitOtpVerification(), 200);
          }
        }
      });
    });

    // Auto-fill Demo OTP Button
    document.getElementById('btn-autofill-otp')?.addEventListener('click', () => {
      const pending = CampusAuth.getPendingSignup();
      if (pending && pending.otp) {
        pending.otp.split('').forEach((d, dIdx) => {
          if (otpInputs[dIdx]) {
            otpInputs[dIdx].value = d;
            otpInputs[dIdx].classList.add('has-value');
          }
        });
        this.hideOtpError();
        this.showToast('Demo OTP auto-filled!', 'info');
        setTimeout(() => this.submitOtpVerification(), 250);
      }
    });

    // Verify OTP Button Submit
    document.getElementById('btn-verify-otp')?.addEventListener('click', () => {
      this.submitOtpVerification();
    });

    // Resend OTP Button
    document.getElementById('btn-resend-otp')?.addEventListener('click', () => {
      const res = CampusAuth.resendSignupOTP();
      if (res.success) {
        const demoOtpEl = document.getElementById('demo-otp-display');
        if (demoOtpEl) demoOtpEl.textContent = res.otp;
        this.resetOtpDigits();
        this.hideOtpError();
        this.startOtpCountdown(30);
        this.showToast(`New verification code sent! Demo OTP: ${res.otp}`, 'info');
        otpInputs[0]?.focus();
      } else {
        this.showToast(res.message, 'error');
      }
    });

    // Edit Details / Back Button
    document.getElementById('btn-otp-go-back')?.addEventListener('click', () => {
      this.resetRegisterStep(false);
    });
  },

  /* OTP Countdown & Verification Helpers */
  startOtpCountdown(seconds = 30) {
    this.stopOtpCountdown();
    let remaining = seconds;
    const timerText = document.getElementById('otp-timer-text');
    const countdownSpan = document.getElementById('otp-countdown');
    const resendBtn = document.getElementById('btn-resend-otp');
    if (!timerText || !countdownSpan || !resendBtn) return;

    timerText.classList.remove('hidden');
    resendBtn.classList.add('hidden');
    countdownSpan.textContent = remaining;

    this.otpTimerInterval = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        this.stopOtpCountdown();
        timerText.classList.add('hidden');
        resendBtn.classList.remove('hidden');
      } else {
        countdownSpan.textContent = remaining;
      }
    }, 1000);
  },

  stopOtpCountdown() {
    if (this.otpTimerInterval) {
      clearInterval(this.otpTimerInterval);
      this.otpTimerInterval = null;
    }
  },

  resetOtpDigits() {
    document.querySelectorAll('.otp-digit').forEach(input => {
      input.value = '';
      input.classList.remove('has-value');
    });
  },

  showOtpError(message) {
    const errorBox = document.getElementById('otp-error-message');
    const errorText = document.getElementById('otp-error-text');
    const wrapper = document.getElementById('otp-inputs-wrapper');
    if (errorBox && errorText) {
      errorText.textContent = message || 'Invalid OTP code. Please re-enter.';
      errorBox.classList.remove('hidden');
    }
    if (wrapper) {
      wrapper.classList.remove('shake');
      void wrapper.offsetWidth;
      wrapper.classList.add('shake');
      setTimeout(() => wrapper.classList.remove('shake'), 500);
    }
  },

  hideOtpError() {
    const errorBox = document.getElementById('otp-error-message');
    if (errorBox) errorBox.classList.add('hidden');
  },

  resetRegisterStep(clearFields = true) {
    this.stopOtpCountdown();
    const stepForm = document.getElementById('register-step-form');
    const stepOtp = document.getElementById('register-step-otp');
    if (stepForm) stepForm.classList.remove('hidden');
    if (stepOtp) stepOtp.classList.add('hidden');
    this.resetOtpDigits();
    this.hideOtpError();
    if (clearFields) {
      document.getElementById('form-register')?.reset();
      CampusAuth.clearPendingSignup();
    }
  },

  submitOtpVerification() {
    const otpInputs = document.querySelectorAll('.otp-digit');
    const code = Array.from(otpInputs).map(i => i.value).join('');

    if (code.length < 6) {
      this.showOtpError('Please enter the full 6-digit OTP code.');
      this.showToast('Please enter all 6 digits of your OTP.', 'error');
      return;
    }

    const res = CampusAuth.verifySignupOTP(code);
    if (res.success) {
      this.showToast(`Email verified! Welcome to Campus Care, ${res.user.name}!`, 'success');
      document.getElementById('modal-auth')?.classList.add('hidden');
      this.resetRegisterStep(true);
    } else {
      this.showOtpError(res.message);
      this.showToast(res.message, 'error');
    }
  },

  openAuthModal(mode = 'login') {
    const modal = document.getElementById('modal-auth');
    const tabLogin = document.getElementById('tab-btn-login');
    const tabRegister = document.getElementById('tab-btn-register');
    const paneLogin = document.getElementById('pane-login');
    const paneRegister = document.getElementById('pane-register');

    if (mode === 'login') {
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      paneLogin.classList.remove('hidden');
      paneRegister.classList.add('hidden');
      this.stopOtpCountdown();
    } else {
      tabRegister.classList.add('active');
      tabLogin.classList.remove('active');
      paneRegister.classList.remove('hidden');
      paneLogin.classList.add('hidden');
      if (!CampusAuth.getPendingSignup()) {
        this.resetRegisterStep(false);
      }
    }

    modal.classList.remove('hidden');
  },

  /* ========================================================================
     9. TOAST NOTIFICATIONS
     ======================================================================== */
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'fa-circle-info';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'error') icon = 'fa-circle-exclamation';

    toast.innerHTML = `
      <i class="fa-solid ${icon} toast-icon"></i>
      <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-fadeout');
      setTimeout(() => {
        toast.remove();
      }, 250);
    }, 3500);
  }
};
