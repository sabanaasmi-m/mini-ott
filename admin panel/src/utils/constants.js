// API Endpoints (if not using services)
export const API_ENDPOINTS = {
  FILMS: '/films',
  USERS: '/users',
  CATEGORIES: '/categories',
  COMMENTS: '/comments',
  ANALYTICS: '/analytics',
  AUTH: '/auth',
};

// Film Status
export const FILM_STATUS = {
  DRAFT: 'Draft',
  PROCESSING: 'Processing',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived',
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  USER: 'user',
};

// Film Genres
export const FILM_GENRES = [
  'Action',
  'Comedy',
  'Drama',
  'Horror',
  'Romance',
  'Sci-Fi',
  'Thriller',
  'Documentary',
  'Animation',
  'Fantasy',
  'Mystery',
  'Adventure',
];

// Pagination
export const ITEMS_PER_PAGE = 10;

// File Upload
export const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
export const ALLOWED_VIDEO_FORMATS = ['video/mp4', 'video/webm', 'video/ogg'];
export const ALLOWED_IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

// Date Formats
export const DATE_FORMAT = 'MMM DD, YYYY';
export const DATETIME_FORMAT = 'MMM DD, YYYY HH:mm';

// Chart Colors
export const CHART_COLORS = {
  primary: '#e50914',
  blue: '#0066ff',
  green: '#00cc66',
  purple: '#9966ff',
  orange: '#ff9900',
  red: '#ff3333',
};

// Table Page Sizes
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
};

// Error Messages
export const ERROR_MESSAGES = {
  GENERIC: 'Something went wrong. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  FILM_CREATED: 'Film created successfully!',
  FILM_UPDATED: 'Film updated successfully!',
  FILM_DELETED: 'Film deleted successfully!',
  USER_CREATED: 'User created successfully!',
  USER_UPDATED: 'User updated successfully!',
  USER_DELETED: 'User deleted successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!',
};

// Regex Patterns
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[0-9]{10}$/,
  URL: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
};

// Notification Types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

export default {
  API_ENDPOINTS,
  FILM_STATUS,
  USER_ROLES,
  FILM_GENRES,
  ITEMS_PER_PAGE,
  MAX_FILE_SIZE,
  ALLOWED_VIDEO_FORMATS,
  ALLOWED_IMAGE_FORMATS,
  DATE_FORMAT,
  DATETIME_FORMAT,
  CHART_COLORS,
  PAGE_SIZE_OPTIONS,
  STORAGE_KEYS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  REGEX_PATTERNS,
  NOTIFICATION_TYPES,
};
