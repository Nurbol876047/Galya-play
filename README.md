# Ұйымдық мәдениет әлеміне саяхат

Интерактивная командная игра на казахском языке по теме «Ұйымдық мәдениеттің негізгі элементтері» для студентов. Рассчитана на проектор и всю аудиторию: 5 этапов, 20 миссий, 15 блиц-вопросов, 1–6 команд, 70–100 минут.

- **Игра:** `index.html`
- **Ключ ответов для ведущего:** `answers.html` (на Render также `/answers`)

Стек: чистый HTML/CSS/JS + three.js r160 (`vendor/three.global.js`, подключён как `window.THREE`). Сборки нет, npm не нужен.

---

## Правила хостинга на Render

### Вариант 1 — Blueprint (рекомендуется)

В корне лежит `render.yaml`, Render сам всё настроит.

1. Войдите на <https://dashboard.render.com> через GitHub.
2. **New → Blueprint**.
3. Выберите репозиторий **Galya-play** (если его нет в списке — «Configure account» и дайте Render доступ к репозиторию).
4. Render прочитает `render.yaml` и покажет сервис **galya-play** (Static Site). Нажмите **Apply**.
5. Через 1–2 минуты сайт будет доступен по адресу вида `https://galya-play.onrender.com`.

### Вариант 2 — вручную, без Blueprint

**New → Static Site** → репозиторий **Galya-play**, затем поля:

| Поле | Значение |
|---|---|
| Name | `galya-play` |
| Branch | `main` |
| Root Directory | *(пусто)* |
| Build Command | `echo "static site, no build"` |
| Publish Directory | `.` |

Нажмите **Create Static Site**.

### Что настроено в `render.yaml`

| Правило | Зачем |
|---|---|
| `runtime: static`, без сборки | файлы отдаются как есть, бесплатный тариф, не «засыпает» |
| `staticPublishPath: .` | публикуется корень репозитория |
| `Cache-Control: immutable` для `/vendor/*` | three.js (1.2 МБ) грузится один раз и кэшируется |
| `Cache-Control: no-cache` для `*.html`, `/js/*`, `/css/*` | после правки вопросов студенты сразу видят новую версию |
| `X-Content-Type-Options`, `Referrer-Policy` | базовые заголовки безопасности |
| rewrite `/answers`, `/otvety` → `/answers.html` | короткая ссылка на ключ ответов |
| `pullRequestPreviewsEnabled: false` | превью для PR не создаются |

### Обновление сайта

Любой `git push` в ветку `main` запускает автодеплой. Вопросы и ответы правятся в `js/content.js`; ключ ответов (`answers.html`) строится из того же файла и обновляется сам.

```bash
git add -A
git commit -m "Обновил вопросы"
git push
```

### Важно для ведущего

- Ключ ответов публичен по ссылке `/answers`. Не показывайте его на проекторе; если нужно скрыть от студентов — удалите `answers.html` из репозитория и открывайте его локально.
- Прогресс игры хранится в `localStorage` браузера ведущего: после обновления страницы появляется кнопка «Жалғастыру».
- Нужен браузер с WebGL (Chrome, Edge, Firefox, Brave). Без WebGL игра работает на плоском фоне.
- Шрифты грузятся с Google Fonts; без интернета используются системные.

---

## Локальный запуск

```bash
python3 -m http.server 8080
```

Откройте <http://localhost:8080>. Можно и просто открыть `index.html` двойным кликом.

## Управление (ведущий)

`F` — полный экран · `P` — пауза · `1–4` — выбор варианта · `Enter` — главная кнопка · `M` — звук · ⚙ — панель ведущего (очки, очередь, пропуск миссии, ключ ответов).

## Структура

```
index.html          игра
answers.html        ключ ответов для ведущего
render.yaml         правила хостинга Render
css/style.css       стили
js/content.js       все вопросы, ответы, пояснения (редактировать здесь)
js/game.js          логика: команды, таймер, очки, джокеры, блиц, победа
js/scene.js         3D-степь, юрты, шаңырақ, фейерверк (three.js)
js/illustrations.js SVG-иллюстрации к заданиям
js/ornaments.js     казахские орнаменты (қошқар мүйіз, шаңырақ)
js/audio.js         звуки домбры (WebAudio)
vendor/three.global.js  three.js r160
```
