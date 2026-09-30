/**
 * ==========================================================================
 * CAMPUS CARE – Global Application Configuration
 * ==========================================================================
 * 
 * DESIGNATED ADMINISTRATOR CONFIGURATION:
 * Configure the single designated administrator email using VITE_ADMIN_EMAIL below.
 * The system strictly restricts the Campus Care Administration Panel and all
 * administrative actions (Delete Item, Mark as Returned, Verify Item) to ONLY
 * this single designated email address.
 * 
 * Replace 'admin@college.edu' with your real authorized administrator's college email.
 */

window.APP_CONFIG = {
  // Single designated administrator account (Configurable)
  VITE_ADMIN_EMAIL: (typeof window !== 'undefined' && window.VITE_ADMIN_EMAIL) || 'admin@college.edu'
};

// Freeze configuration object to prevent client-side runtime tampering
if (Object.freeze) {
  Object.freeze(window.APP_CONFIG);
}
