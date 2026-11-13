import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    // Toutes les interfaces, comme --host : par défaut, Vite n'écoute que sur
    // localhost, et le port n'est pas joignable hors du conteneur
    host: true,
    proxy: {
      // Les appels /api partent vers l'API, dans le même conteneur
      '/api': 'http://localhost:3000',
      // Mode « ia » (test local) : le service de prospection d'Equipe-01
      '/ia': {
        target: 'http://localhost:8000',
        rewrite: (path) => path.replace(/^\/ia/, ''),
      },
    },
  },
});
