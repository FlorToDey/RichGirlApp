# GoldDigg

Дейтинг для тех, кто ищет богатую. Анкеты девушек с графами «Состояние», «Основная машина», «Владелица компаний», свайпы, мэтчи, чат, уведомления. Проект-шутка, все анкеты вымышленные, фото сгенерированы нейросетью.

- `server/` — Node.js, Express, SQLite, Socket.IO. При первом старте создаёт 20 девушек и 8 парней.
- `web/` — React + Vite, тот же код идёт в APK через Capacitor.
- `releases/GoldDigg.apk` — готовый APK, ходит на `http://194.87.148.14`.

## Локально

```bash
cd server && npm i && npm run dev        # API на :8080
cd web && npm i && npm run dev           # фронт на :5173
```

## Сервер

На сервере нужен только Docker (скрипт поставит сам):

```bash
./scripts/deploy.sh root@194.87.148.14
```

Или через GitHub Actions: добавить секреты `SERVER_HOST`, `SERVER_PASSWORD` (и `SERVER_USER`, если не root), затем Actions → Deploy server → Run workflow.

Сайт поднимается на 80 порту, данные лежат в docker volume `golddigg-data`.

## APK

Actions → Build APK собирает APK автоматически. Вручную:

```bash
cd web && npm run build:native && npx cap sync android && cd android && ./gradlew assembleDebug
```

Адрес сервера для APK задаётся в `web/.env.native`.
