# React + TypeScript + Vite

## Доступ стажёров

- На `/login` кнопка «Я стажёр» с анимированным енотом открывает `/trainee/login`.
- Вход по общему коду ведёт в `/trainee`: только разрешённые карточки, без
  аккаунта, выхода, комментариев, истории и запросов данных участников.
- Карточки читаются на `/trainee/card/:cardId`. Встроенные Markdown-списки
  участников скрыты, включая вложенные списки/цитаты/спойлеры/таблицы.
- `/trainee-access` — просмотр, копирование и генерация кода. Ссылка в шапке
  доступна админу, председателю и замам; backend независимо проверяет права.
- «Доступна стажёрам» в создании/редактировании карточки управляет видимостью.
  Отсутствие ограничений для сотрудников само по себе не открывает карточку стажёрам.
- Гостевой токен хранится отдельно в `localStorage.trainee_token`. Он действует
  30 дней; смена кода отзывает старые токены. Проверка сессии при переходе,
  возвращении на вкладку и раз в минуту; API проверяет каждый запрос.

Проверки: `npm test`, `npm run lint`, `npm run build`.
Браузерная проверка с настоящим API (Chrome и Node 20+):

1. Из backend запустить `python tests/serve_trainee_smoke.py` (изолированная БД).
2. Из frontend выполнить `npm run build`, затем
   `node --experimental-websocket tests/browser-trainee-smoke.mjs`.
3. Если Chrome установлен иначе, задать `CHROME_BIN`. Порты 4173, 8000 и 9225
   должны быть свободны. Скриншоты сохраняются в `../.tools/browser` или
   `SMOKE_ARTIFACT_DIR`. Завершить тестовый backend после проверки.

Изображение `src/assets/images/trainee-raccoon.png` создано встроенным imagegen,
без внешних изображений. Исходный промпт находится рядом в
`trainee-raccoon.prompt.txt`; CSS-анимации учитывают `prefers-reduced-motion`.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```


## Markdown in cards

Card content supports headings, paragraphs, nested ordered and unordered lists,
task checkboxes, blockquotes, tables, links, images, inline and fenced code,
horizontal rules, bold, italic, strikethrough, and underlined text.

Underline is a project extension and uses `++text++`. Raw HTML is intentionally
rendered as text; links and images accept only safe web, mail, telephone, or
relative URLs.
