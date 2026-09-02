/**
 * POLYLANCE BRAND LOGO CONFIGURATION
 * 
 * To change or update the logo image in the future:
 * 1. Drop your new logo image into `frontend/public/polylanceLogo.png` (or any web relative path like '/logo.png').
 * 2. Set `useCustomImage` to `true` (or `false` for default high-resolution 3D cyan vector SVG).
 */
export const LOGO_CONFIG = {
  // Relative web path to the logo image in the `public` directory
  customImagePath: `${import.meta.env.BASE_URL}polylanceLogo.png`,

  // Set to `true` to use image file, or `false` to use vector SVG
  useCustomImage: true,
};
