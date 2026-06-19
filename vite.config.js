import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        advance: resolve(__dirname, 'src/app/advance.html'),
        dashboard: resolve(__dirname, 'src/app/dashboard.html'),
        game: resolve(__dirname, 'src/app/game.html'),
        quiz: resolve(__dirname, 'src/app/quiz.html'),
        summary: resolve(__dirname, 'src/app/summary.html')
      }
    }
  }
});
