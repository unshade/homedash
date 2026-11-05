import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// App icons for the installed app (PWA), generated from public/app-icon.svg at build
// time by vite-plugin-pwa. Maskable and Apple icons sit on the pale ground,
// because phones crop them into their own shape.
const ground = '#f1f0f2'

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { sizes: [512], padding: 0.3, resizeOptions: { background: ground } },
    apple: { sizes: [180], padding: 0.2, resizeOptions: { background: ground } },
  },
  images: ['public/app-icon.svg'],
})
