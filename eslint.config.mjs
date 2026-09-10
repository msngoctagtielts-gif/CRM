import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) })

const config = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      // `netlify build` sinh ra thư mục này (~119 MB mã đã đóng gói). Không lint
      // và không commit — xem .gitignore.
      '.netlify/**',
      // Sinh tự động — không sửa tay nên không lint.
      'next-env.d.ts',
      'src/types/database.types.ts',
    ],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
]

export default config
