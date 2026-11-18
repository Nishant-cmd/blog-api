import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'

export default defineConfig({
  server: { port: 5174, strictPort: true },
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
})
