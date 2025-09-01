// TMM-OS: VITE BUILD CONFIGURATION (DEFINITIVE & FOOLPROOF)
import { defineConfig } from 'vite';

export default defineConfig({
  // We are NOT using the 'root' property.
  // We are NOT using path.resolve or __dirname.
  // We will let Vite use its default behavior and explicitly tell it where everything is.

  build: {
    outDir: 'dist',
    emptyOutDir: true,

    rollupOptions: {
      // CRITICAL: This is the simplest possible way to define your pages.
      // These paths are relative to your project's root directory.
      input: {
        main: 'index.html',
        admin: 'admin.html'
      }
    }
  },
});