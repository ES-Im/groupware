/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // 소스/테스트 공용 경로 별칭. tsconfig의 paths와 반드시 동일하게 유지한다.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // CORS 정책상 백엔드는 http://localhost:5173 오리진만 허용하므로 포트를 고정한다.
    port: 5173,
    strictPort: true,
  },
  test: {
    // 컴포넌트 테스트를 위해 DOM 환경을 사용한다(jsdom).
    environment: 'jsdom',
    // describe/it/expect 등을 import 없이 전역으로 사용한다(테스트 파일 보일러플레이트 감소).
    globals: true,
    // jest-dom 확장 + MSW 서버 lifecycle 등록.
    setupFiles: ['./src/test/setup.ts'],
    // node_modules 하위 등 불필요 경로는 제외하고 src 내부 테스트만 수집한다.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    css: false,
  },
})
