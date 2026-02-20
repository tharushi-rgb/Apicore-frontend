// Centralized configuration for the ApiCore system
// Change the user name here and it will be used everywhere in the app

export const APP_CONFIG = {
  // Demo/Default user information - CHANGE THIS TO UPDATE THE USER NAME EVERYWHERE
  DEMO_USER: {
    name: 'Amal', // Change this name to update it everywhere in the system
    email: 'amal@example.com',
    phone: '+94 77 456 7890',
    district: 'Colombo',
    role: 'Beekeeper (Admin)',
  },
  
  // App information
  APP_NAME: 'ApiCore',
  APP_VERSION: '1.0.0',
  TAGLINE: 'Smart Beekeeping Management System',
  
  // API endpoints
  API: {
    BASE_URL: 'http://localhost:5001/api',
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      ME: '/auth/me',
    },
    DASHBOARD: '/dashboard',
    APIARIES: '/apiaries',
    HIVES: '/hives',
    INSPECTIONS: '/inspections',
    HARVESTS: '/harvests',
    EXPENSES: '/expenses',
    INCOME: '/income',
    FEEDINGS: '/feedings',
    COMPONENTS: '/components',
    QUEENS: '/queens',
    TREATMENTS: '/treatments',
    PROFILE: '/profile',
    HELPERS: '/helpers',
    CLIENTS: '/clients',
    NOTIFICATIONS: '/notifications',
    TRANSFERS: '/transfers',
  },
  
  // Default values
  DEFAULTS: {
    HIVE_TYPE: 'box',
    LOCATION_TYPE: 'apiary-linked',
    HIVE_STATUS: 'active',
    APIARY_STATUS: 'active',
    QUEEN_PRESENT: true,
    EXPERIENCE_YEARS: 0,
  },
};
