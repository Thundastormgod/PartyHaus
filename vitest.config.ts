import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'c8',
      reporter: ['text', 'lcov'],
      all: true,
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/__tests__/**', 'src/test/**']
    }
  }
});
