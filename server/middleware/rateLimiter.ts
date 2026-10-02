import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 auth requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Terlalu banyak percobaan autentikasi. Silakan tunggu 15 menit sebelum mencoba kembali demi keamanan.',
  },
});

export const publicSearchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 searches per window to prevent scraping
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Batas pencarian tercapai. Untuk mencegah penyalahgunaan data, silakan coba lagi beberapa saat lagi.',
  },
});

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120, // 120 req/min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Permintaan terlalu sering. Silakan perlambat navigasi Anda.',
  },
});
