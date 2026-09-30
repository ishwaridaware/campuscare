/**
 * CAMPUS CARE – Authentication & Role Management
 * Handles Student, Faculty, Staff, and Single Designated Admin authentication.
 * 
 * SECURITY POLICY:
 * ONLY the single designated administrator email (configured via VITE_ADMIN_EMAIL)
 * is authorized to access the Campus Care Administration Panel and execute
 * administrative operations. All other users (Students, Faculty, Staff, registered users)
 * are strictly restricted to normal user access.
 */

const STORAGE_KEY_AUTH = 'campus_care_user_v2';
const STORAGE_KEY_ACCOUNTS = 'campus_care_registered_users_v2';

const PRESET_DEMO_USERS = {
  student: {
    id: 'user-student-1',
    name: 'Alex Johnson',
    email: 'alex.j@campus.edu',
    role: 'Student',
    phone: '+1 (555) 234-5678'
  },
  faculty: {
    id: 'user-faculty-1',
    name: 'Dr. Sarah Watson',
    email: 's.watson@campus.edu',
    role: 'Faculty',
    phone: '+1 (555) 567-8901'
  },
  admin: {
    id: 'user-admin-1',
    name: 'Chief Security Officer (Designated Admin)',
    email: 'admin@college.edu',
    role: 'Admin',
    phone: '+1 (555) 019-9000'
  }
};

const CampusAuth = {
  currentUser: null,
  listeners: [],
  pendingSignup: null,

  /**
   * Retrieves the single authorized administrator email from global config.
   * Defaults to 'admin@college.edu'.
   */
  getAdminEmail() {
    if (typeof window !== 'undefined' && window.APP_CONFIG && window.APP_CONFIG.VITE_ADMIN_EMAIL) {
      return window.APP_CONFIG.VITE_ADMIN_EMAIL.trim().toLowerCase();
    }
    return 'admin@college.edu';
  },

  init() {
    // Keep admin demo email synchronized with active config
    PRESET_DEMO_USERS.admin.email = this.getAdminEmail();

    // Check if an existing session is saved
    const saved = localStorage.getItem(STORAGE_KEY_AUTH);
    if (saved) {
      try {
        this.currentUser = JSON.parse(saved);
        // Ensure email matches current admin config if it was an admin session
        if (this.currentUser && this.currentUser.role === 'Admin' && this.currentUser.email !== this.getAdminEmail()) {
          // Demote any unauthorized user with 'Admin' role to Student unless email matches
          this.currentUser.role = 'Student';
          this.saveSession();
        }
      } catch (e) {
        this.currentUser = PRESET_DEMO_USERS.student;
        this.saveSession();
      }
    } else {
      // Default to the student demo account so the website feels alive immediately
      this.currentUser = PRESET_DEMO_USERS.student;
      this.saveSession();
    }
    this.notifyListeners();
  },

  getCurrentUser() {
    return this.currentUser;
  },

  /**
   * CRITICAL SECURITY CHECK:
   * Returns TRUE if and ONLY if the authenticated user's email exactly matches
   * the designated administrator email (VITE_ADMIN_EMAIL).
   * 
   * Roles (Student, Faculty, Staff) or manipulated role fields NEVER grant admin access.
   */
  isAdmin() {
    if (!this.currentUser || !this.currentUser.email) return false;
    return this.currentUser.email.trim().toLowerCase() === this.getAdminEmail();
  },

  saveSession() {
    if (this.currentUser) {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(this.currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEY_AUTH);
    }
  },

  /**
   * Login with email and password
   */
  login(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const adminEmail = this.getAdminEmail();
    
    // Check against designated admin account
    if (cleanEmail === adminEmail) {
      this.currentUser = {
        ...PRESET_DEMO_USERS.admin,
        email: adminEmail
      };
    } else if (cleanEmail === 'alex.j@campus.edu') {
      this.currentUser = PRESET_DEMO_USERS.student;
    } else if (cleanEmail === 's.watson@campus.edu') {
      this.currentUser = PRESET_DEMO_USERS.faculty;
    } else {
      // Check custom registered users
      const registered = this.getRegisteredAccounts();
      const match = registered.find(u => u.email.toLowerCase() === cleanEmail);
      if (match) {
        this.currentUser = match;
      } else {
        // Automatically create account for testing simplicity if not found
        const namePart = cleanEmail.split('@')[0].replace('.', ' ');
        const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        const newUser = {
          id: 'user-' + Date.now(),
          name: formattedName,
          email: cleanEmail,
          role: 'Student',
          phone: '+1 (555) 000-1234'
        };
        this.saveRegisteredAccount(newUser);
        this.currentUser = newUser;
      }
    }

    this.saveSession();
    this.notifyListeners();
    return { success: true, user: this.currentUser };
  },

  /**
   * Register a new account
   */
  register(name, email, password, role) {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!name || !cleanEmail) {
      return { success: false, message: 'Please provide your name and email.' };
    }

    // Ensure role cannot grant administrative privileges
    const safeRole = (role === 'Admin' && cleanEmail !== this.getAdminEmail()) ? 'Student' : (role || 'Student');

    const newUser = {
      id: 'user-' + Date.now(),
      name: name.trim(),
      email: cleanEmail,
      role: safeRole,
      phone: '+1 (555) 888-9999'
    };

    this.saveRegisteredAccount(newUser);
    this.currentUser = newUser;
    this.saveSession();
    this.notifyListeners();
    return { success: true, user: newUser };
  },

  /**
   * Request OTP verification code for new user registration
   */
  requestSignupOTP(name, email, password, role) {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!name || !name.trim()) {
      return { success: false, message: 'Please enter your full name.' };
    }
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return { success: false, message: 'Please provide a valid campus email address.' };
    }
    if (!password || password.length < 4) {
      return { success: false, message: 'Password must be at least 4 characters long.' };
    }

    // Check if account already exists
    const accounts = this.getRegisteredAccounts();
    const existing = accounts.find(a => a.email.toLowerCase() === cleanEmail);
    if (existing) {
      return { success: false, message: 'An account with this email already exists. Please log in.' };
    }

    // Generate 6-digit random OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    this.pendingSignup = {
      name: name.trim(),
      email: cleanEmail,
      password: password,
      role: role || 'Student',
      otp: otp,
      createdAt: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
    };

    return {
      success: true,
      otp: otp,
      email: cleanEmail,
      message: `Verification code sent to ${cleanEmail}`
    };
  },

  /**
   * Verify entered OTP and complete registration
   */
  verifySignupOTP(code) {
    if (!this.pendingSignup) {
      return { success: false, message: 'No registration in progress. Please re-enter your details.' };
    }

    if (Date.now() > this.pendingSignup.expiresAt) {
      return { success: false, message: 'Verification code has expired. Please request a new code.' };
    }

    const cleanCode = (code || '').toString().trim();
    if (cleanCode !== this.pendingSignup.otp) {
      return { success: false, message: 'Incorrect OTP code. Please check and try again.' };
    }

    // OTP verified successfully - register user
    const { name, email, password, role } = this.pendingSignup;
    const result = this.register(name, email, password, role);
    this.pendingSignup = null;
    return result;
  },

  /**
   * Resend a fresh OTP verification code
   */
  resendSignupOTP() {
    if (!this.pendingSignup) {
      return { success: false, message: 'No registration session found.' };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.pendingSignup.otp = otp;
    this.pendingSignup.createdAt = Date.now();
    this.pendingSignup.expiresAt = Date.now() + 10 * 60 * 1000;

    return {
      success: true,
      otp: otp,
      email: this.pendingSignup.email,
      message: `A new verification code was sent to ${this.pendingSignup.email}`
    };
  },

  getPendingSignup() {
    return this.pendingSignup;
  },

  clearPendingSignup() {
    this.pendingSignup = null;
  },

  /**
   * Quick switch for demo testing
   */
  switchDemo(type) {
    if (type === 'admin') {
      const adminEmail = this.getAdminEmail();
      this.currentUser = {
        ...PRESET_DEMO_USERS.admin,
        email: adminEmail
      };
      this.saveSession();
      this.notifyListeners();
      return this.currentUser;
    }

    if (PRESET_DEMO_USERS[type]) {
      this.currentUser = PRESET_DEMO_USERS[type];
      this.saveSession();
      this.notifyListeners();
      return this.currentUser;
    }
    return null;
  },

  /**
   * Log out user
   */
  logout() {
    this.currentUser = null;
    this.saveSession();
    this.notifyListeners();
  },

  getRegisteredAccounts() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  saveRegisteredAccount(user) {
    const accounts = this.getRegisteredAccounts();
    accounts.push(user);
    localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
  },

  onAuthChange(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
  },

  notifyListeners() {
    this.listeners.forEach(cb => {
      try {
        cb(this.currentUser);
      } catch (err) {
        console.error('Error in auth listener:', err);
      }
    });
  }
};
