import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

/**
 * - SWC بدل esbuild: الأخير بيرمي ملف مؤقت ويمسحه، والمسح بيفشل على الجهاز ده.
 * - مراقبة الملفات بـpolling: المراقبة الأصلية بتقع بـEBUSY على ملفات مؤقتة.
 * - fs.allow: بنستورد صور الأكل من مجلد التطبيق (mobile/assets) للهيرو.
 */
export default defineConfig({
  plugins: [react()],
  esbuild: false,
  server: {
    port: 5174,
    host: '127.0.0.1',
    fs: { allow: ['..'] },
    watch: {
      usePolling: true,
      interval: 400,
      ignored: ['**/.*.tmpdir/**', '**/*.tmp', '**/node_modules/**'],
    },
  },
  build: {
    outDir: 'dist',
    minify: false,
    cssMinify: false,
  },
});
