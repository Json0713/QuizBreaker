import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        app: resolve(__dirname, 'app.html'),
        quiz: resolve(__dirname, 'src/app/quiz.html'),
        summary: resolve(__dirname, 'src/app/summary.html')
      }
    }
  }
});
