# ТЗ для замірника — ESCORE

Веб-форма: менеджер вставляє транскрипцію дзвінка та/або свій опис (і КП, якщо є), AI розкладає інформацію по чек-листу ТЗ для виїзного заміру СЕС. Результат можна правити вручну й завантажити в PDF.

**Сайт:** https://escoreodessa.github.io/TechTask-for-Surveyor-/

## Як працює

1. Менеджер заповнює шапку (дата/час виїзду, підстава, мета) — вручну або AI візьме з тексту.
2. Вставляє транскрипцію (можна файл `.vtt`/`.txt`, таймкоди прибираються автоматично) та/або опис. Якщо є КП — вмикає «Є КП на руках» і вставляє дані.
3. «Заповнити ТЗ» → чек-лист заповнюється. Зелені поля — заповнені AI, їх треба перевірити.
4. Правки вручну, «+ Додати поле» для інформації поза шаблоном → «Завантажити PDF».

Чернетка зберігається в браузері менеджера (на випадок закриття вкладки).

## Два режими

- **Тестовий** (`CONFIG.API_URL` порожній в `index.html`): ключ API не потрібен. Кнопка «Підготувати запит» копіює запит → менеджер вставляє його в чат claude.ai → копіює відповідь назад → «Застосувати відповідь».
- **Робочий** (`CONFIG.API_URL` заповнений): вхід через Google (той самий OAuth-клієнт, що в smeta), розбір в одне натискання через Claude API. Ключ API лежить в Apps Script, на сайті його немає.

## Підключення робочого режиму

1. **Ключ.** console.anthropic.com → поповнити баланс → API Keys → Create key. Скопіювати ключ (показується один раз). Рекомендовано встановити місячний ліміт витрат.
2. **Apps Script.** script.google.com → New project → назва «ТЗ замірника API» → вставити вміст `apps-script/Code.gs`.
3. **Властивості скрипта.** Project Settings (шестерня) → Script properties → Add:
   - `ANTHROPIC_API_KEY` = ключ з кроку 1
   - `CLIENT_ID` = `758495999284-fnsq0qf281d7vcd84hu7ri6eu2189psg.apps.googleusercontent.com`
   - `ALLOWED_EMAILS` = gmail менеджерів через кому
4. **Публікація.** Deploy → New deployment → тип Web app → Execute as: **Me**, Who has access: **Anyone** → Deploy → дозволити доступ → скопіювати Web app URL.
   (Доступ «Anyone» потрібен, щоб сайт міг звертатися до скрипта; захист — перевірка входу Google і список `ALLOWED_EMAILS`.)
5. **Сайт.** В `index.html` вписати URL у `CONFIG.API_URL` → Commit. GitHub Pages оновиться за ~1 хвилину.

Після змін у `Code.gs`: Deploy → Manage deployments → Edit → Version: New version (URL лишається той самий).

## Доступ менеджерів

Вхід через OAuth-клієнт «ESCORE Economics Form» (проєкт ESCORE-Maps), він у режимі Testing — заходити можуть лише тест-користувачі. Менеджери, які вже працюють у smeta, там уже є. Новий — додати як у README smeta (Google Auth Platform → Audience → Test users) і в `ALLOWED_EMAILS`.

## Вартість

Платний лише Claude API, оплата за обсяг. Орієнтовно ~$0.05 за одне ТЗ на моделі Sonnet (≈10 тис. токенів на вході, ≈3 тис. на виході). Apps Script і GitHub Pages — безкоштовні. Модель змінюється властивістю `MODEL` (напр. `claude-haiku-4-5-20251001` — дешевше, але гірше розбирає розмовні транскрипції). Актуальні ціни: https://platform.claude.com/docs/en/about-claude/pricing

## Деплой сайту

GitHub Pages: Settings → Pages → Source: Deploy from a branch → `main` / root. Оновлення — змінити `index.html` у репозиторії (Commit), Pages перезбереться за ~1 хвилину.

## Файли

- `index.html` — весь сайт (без збірки; бібліотеки з CDN: html2pdf.js, Google Identity Services).
- `apps-script/Code.gs` — серверна частина для Apps Script.
