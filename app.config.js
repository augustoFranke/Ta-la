/**
 * Expo dynamic config
 * Converts app.json to app.config.js for build-time env var support.
 *
 * EXPO_PUBLIC_IS_DEV_BYPASS is only set in .env.development.
 * Production builds never have this var, so isDevBypass compiles to false.
 */

module.exports = ({ config }) => {
  return {
    ...config,
    extra: {
      ...config.extra,
      isDevBypass: process.env.EXPO_PUBLIC_IS_DEV_BYPASS === 'true',
    },
  };
};
