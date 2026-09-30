/**
 * CAMPUS CARE – Data Layer & LocalStorage Repository
 * Manages sample data initialization, item queries, and CRUD persistence.
 */

const STORAGE_KEY_ITEMS = 'campus_care_items_v2';

// Rich, realistic initial dataset representing typical campus scenarios
const INITIAL_SAMPLE_ITEMS = [
  {
    id: 'item-101',
    type: 'Lost',
    name: 'MacBook Air M2 (Space Gray)',
    category: 'Electronics',
    location: 'Central Library 2nd Floor',
    date: '2026-09-10',
    description: '13-inch Space Gray MacBook Air in a dark navy Tomtoc sleeve. Has a GitHub octocat sticker and an ACM student chapter sticker on the top corner.',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
    reporterName: 'Alex Johnson',
    reporterEmail: 'alex.j@campus.edu',
    reporterPhone: '+1 (555) 234-5678',
    reporterRole: 'Student',
    status: 'Verified', // 'Reported' | 'Verified' | 'Returned'
    createdAt: Date.now() - 1000 * 60 * 60 * 5 // 5 hours ago
  },
  {
    id: 'item-102',
    type: 'Found',
    name: 'Navy Blue Hydro Flask (32oz)',
    category: 'Others',
    location: 'Football Ground Bleachers',
    date: '2026-09-11',
    description: 'Dark blue wide-mouth Hydro Flask with a flex cap. Has a minor dent on the bottom rim and a sticker reading "Outdoor Adventure Club". Found after the morning football practice.',
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
    reporterName: 'Coach Marcus Bell',
    reporterEmail: 'm.bell@campus.edu',
    reporterPhone: '+1 (555) 345-6789',
    reporterRole: 'Staff',
    status: 'Reported',
    createdAt: Date.now() - 1000 * 60 * 60 * 3
  },
  {
    id: 'item-103',
    type: 'Found',
    name: 'College Student ID Card – Alex Sharma',
    category: 'ID Cards & Documents',
    location: 'Main Cafeteria Counter',
    date: '2026-09-11',
    description: 'Official student ID card for Alex Sharma, Dept. of Computer Science & Engineering (Batch of 2027). Turned in at the primary lunch counter.',
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
    reporterName: 'Robert Vance',
    reporterEmail: 'r.vance@campus.edu',
    reporterPhone: '+1 (555) 456-7890',
    reporterRole: 'Staff',
    status: 'Verified',
    createdAt: Date.now() - 1000 * 60 * 60 * 2
  },
  {
    id: 'item-104',
    type: 'Lost',
    name: 'Honda Civic Car Key on Red Lanyard',
    category: 'Keys',
    location: 'North Parking Lot near Block B',
    date: '2026-09-09',
    description: 'Black Honda electronic smart key fob attached to a red woven college lanyard with a mini metal carabiner and a gym membership barcode tag.',
    image: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=800&q=80',
    reporterName: 'Dr. Sarah Watson',
    reporterEmail: 's.watson@campus.edu',
    reporterPhone: '+1 (555) 567-8901',
    reporterRole: 'Faculty',
    status: 'Reported',
    createdAt: Date.now() - 1000 * 60 * 60 * 28
  },
  {
    id: 'item-105',
    type: 'Found',
    name: 'Advanced Engineering Mathematics (10th Ed)',
    category: 'Books & Stationery',
    location: 'Room 304 Science Block',
    date: '2026-09-08',
    description: 'Hardcover Erwin Kreyszig textbook left behind on desk row 3 after calculus lecture. Contains handwritten sticky notes and study summaries inside chapter 7.',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    reporterName: 'Dr. Sarah Watson',
    reporterEmail: 's.watson@campus.edu',
    reporterPhone: '+1 (555) 567-8901',
    reporterRole: 'Faculty',
    status: 'Reported',
    createdAt: Date.now() - 1000 * 60 * 60 * 48
  },
  {
    id: 'item-106',
    type: 'Lost',
    name: 'Fossil Black Leather Bi-fold Wallet',
    category: 'Wallets & Bags',
    location: 'Auditorium Foyer',
    date: '2026-09-07',
    description: 'Distressed black genuine leather wallet. Contains student metro pass, driver license, and emergency cash. Lost during orientation symposium.',
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80',
    reporterName: 'David Chen',
    reporterEmail: 'd.chen@campus.edu',
    reporterPhone: '+1 (555) 678-9012',
    reporterRole: 'Student',
    status: 'Verified',
    createdAt: Date.now() - 1000 * 60 * 60 * 72
  },
  {
    id: 'item-107',
    type: 'Found',
    name: 'Sony WH-1000XM4 Wireless Headphones',
    category: 'Electronics',
    location: 'Engineering Complex Lab 3',
    date: '2026-09-06',
    description: 'Matte black over-ear noise-cancelling headphones inside original zippered hard case with charging cable. Left at workstation station #14.',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    reporterName: 'Robert Vance',
    reporterEmail: 'r.vance@campus.edu',
    reporterPhone: '+1 (555) 456-7890',
    reporterRole: 'Staff',
    status: 'Returned',
    createdAt: Date.now() - 1000 * 60 * 60 * 96
  },
  {
    id: 'item-108',
    type: 'Lost',
    name: 'Vintage Denim Jacket with Club Badges',
    category: 'Clothing',
    location: 'Student Activity Center',
    date: '2026-09-05',
    description: 'Light-wash oversized denim jacket with university debate society enamel pin on the left lapel and an embroidered solar system patch on the back.',
    image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80',
    reporterName: 'Emily Taylor',
    reporterEmail: 'emily.t@campus.edu',
    reporterPhone: '+1 (555) 789-0123',
    reporterRole: 'Student',
    status: 'Returned',
    createdAt: Date.now() - 1000 * 60 * 60 * 120
  }
];

const CampusData = {
  /**
   * Initializes local storage with sample dataset if empty
   */
  init() {
    const raw = localStorage.getItem(STORAGE_KEY_ITEMS);
    if (!raw) {
      this.resetSampleData();
    }
  },

  /**
   * Resets local storage to default initial items
   */
  resetSampleData() {
    localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(INITIAL_SAMPLE_ITEMS));
    return INITIAL_SAMPLE_ITEMS;
  },

  /**
   * Retrieve all items
   * @returns {Array} List of all items
   */
  getAll() {
    const raw = localStorage.getItem(STORAGE_KEY_ITEMS);
    if (!raw) {
      return this.resetSampleData();
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to parse items from localStorage', e);
      return this.resetSampleData();
    }
  },

  /**
   * Find item by ID
   * @param {string} id
   */
  getById(id) {
    const items = this.getAll();
    return items.find(item => item.id === id) || null;
  },

  /**
   * Add a new item report
   * @param {Object} itemData
   */
  add(itemData) {
    const items = this.getAll();
    const newItem = {
      id: 'item-' + Date.now(),
      status: 'Reported',
      createdAt: Date.now(),
      ...itemData
    };
    items.unshift(newItem);
    localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
    return newItem;
  },

  /**
   * Update an existing item report
   * Administrative status updates ('Returned' or 'Verified') require designated admin authorization.
   * @param {string} id
   * @param {Object} updates
   * @param {string} [actorEmail]
   */
  update(id, updates, actorEmail) {
    const adminEmail = (window.APP_CONFIG?.VITE_ADMIN_EMAIL || 'admin@college.edu').trim().toLowerCase();
    const currentEmail = (actorEmail || (window.CampusAuth && window.CampusAuth.getCurrentUser()?.email) || '').trim().toLowerCase();

    // Security check: Only the designated admin can change status to Verified or Returned
    if (updates && updates.status && (updates.status === 'Returned' || updates.status === 'Verified')) {
      if (currentEmail !== adminEmail) {
        console.warn(`[Security Alert] Status update to '${updates.status}' blocked: '${currentEmail}' is not the designated admin.`);
        delete updates.status;
      }
    }

    const items = this.getAll();
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;

    items[index] = { ...items[index], ...updates };
    localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
    return items[index];
  },

  /**
   * Delete an item by ID
   * Strictly restricted to the single designated administrator.
   * @param {string} id
   * @param {string} [actorEmail]
   */
  delete(id, actorEmail) {
    const adminEmail = (window.APP_CONFIG?.VITE_ADMIN_EMAIL || 'admin@college.edu').trim().toLowerCase();
    const currentEmail = (actorEmail || (window.CampusAuth && window.CampusAuth.getCurrentUser()?.email) || '').trim().toLowerCase();

    if (currentEmail !== adminEmail) {
      console.warn(`[Security Alert] Deletion of item '${id}' blocked: '${currentEmail}' is not the designated admin.`);
      return false;
    }

    let items = this.getAll();
    const beforeCount = items.length;
    items = items.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
    return items.length < beforeCount;
  },

  /**
   * Get items filtered by reporter email
   * @param {string} email
   */
  getByReporterEmail(email) {
    if (!email) return [];
    const items = this.getAll();
    return items.filter(item => item.reporterEmail && item.reporterEmail.toLowerCase() === email.toLowerCase());
  },

  /**
   * Compute aggregate counts for metrics
   */
  getMetrics() {
    const items = this.getAll();
    return {
      total: items.length,
      lost: items.filter(i => i.type === 'Lost' && i.status !== 'Returned').length,
      found: items.filter(i => i.type === 'Found' && i.status !== 'Returned').length,
      returned: items.filter(i => i.status === 'Returned').length,
      verified: items.filter(i => i.status === 'Verified').length,
      reported: items.filter(i => i.status === 'Reported').length
    };
  }
};

// Auto-run init on load
CampusData.init();
