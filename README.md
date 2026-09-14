# AMTLIS Video Platform

Командний навчальний проєкт команди FrameSync. Це повноцінний веб застосунок для перегляду, публікації та організації відеоконтенту з власним інтерфейсом і функціями, натхненними сучасними відеоплатформами.

## Команда

Илья: Team Lead та Full Stack Developer.

Таня: Full Stack Developer.

Trello: https://trello.com/b/1p02WMWk/clonyoutube

## Технології

Frontend: React, TypeScript, Vite, Zustand, SignalR client.

Backend: ASP.NET Core 10, Clean Architecture, Entity Framework Core 10, SQL Server, SignalR.

Media: локальне файлове сховище та ffprobe для перевірки завантажених MP4 файлів.

## Архітектура

Backend поділено на чотири основні шари:

1. `YouTubeClone.Domain` містить доменні сутності.
2. `YouTubeClone.Application` містить сценарії, сервіси, контракти та інтерфейси репозиторіїв.
3. `YouTubeClone.Infrastructure` містить EF Core, SQL Server, файлове сховище та реалізації репозиторіїв.
4. `YouTubeClone.Api` містить HTTP контролери, JWT авторизацію та SignalR hubs.

Frontend використовує аналогічний поділ на `domain`, `application`, `infrastructure`, `presentation`, `shared` та `app`.

## Що вже працює

Авторизація і профіль користувача, access token та refresh session, захищені маршрути, канали і підписки, коментарі та реакції, плейлисти, завантаження MP4, перегляд відео з Range requests, історія переглядів, пауза історії, обране, пошук, категорії, live розділ, realtime чат, Watch Party, теми оформлення та українська й англійська локалізація.

Відео, історія переглядів, обране, користувачі, канали, підписки, коментарі та плейлисти зберігаються через EF Core. Персональна історія та обране ізольовані за користувачем.

## Вимоги для локального запуску

Потрібні:

1. Windows 11 або інша підтримувана .NET платформа.
2. .NET SDK 10.
3. Node.js 22 і npm.
4. SQL Server.
5. `ffprobe` у `PATH`, якщо потрібно завантажувати власні відео.

Перевірка інструментів у PowerShell:

```powershell
dotnet --version
node --version
npm --version
ffprobe -version
```

## Підготовка бази даних

Стандартне підключення знаходиться у `backend/src/YouTubeClone.Api/appsettings.json` і використовує базу `YouTubeCloneDb` на локальному SQL Server.

За потреби рядок підключення можна перевизначити через змінну середовища `ConnectionStrings__DefaultConnection`.

Встановити EF Core CLI:

```powershell
dotnet tool install --global dotnet-ef --version 10.0.11
```

Застосувати всі міграції:

```powershell
dotnet ef database update `
  --project backend/src/YouTubeClone.Infrastructure/YouTubeClone.Infrastructure.csproj `
  --startup-project backend/src/YouTubeClone.Api/YouTubeClone.Api.csproj
```

Перевірити, що модель і migration snapshot синхронізовані:

```powershell
dotnet ef migrations has-pending-model-changes `
  --project backend/src/YouTubeClone.Infrastructure/YouTubeClone.Infrastructure.csproj `
  --startup-project backend/src/YouTubeClone.Api/YouTubeClone.Api.csproj
```

## Запуск backend

З кореня репозиторію:

```powershell
dotnet restore backend/YouTubeClone.Api.slnx
dotnet run --project backend/src/YouTubeClone.Api/YouTubeClone.Api.csproj
```

За замовчуванням frontend очікує API на `http://localhost:5276`.

Перевірка health endpoint:

```text
http://localhost:5276/api/health
```

## Запуск frontend

У другому терміналі:

```powershell
cd frontend
npm ci
npm run dev
```

Vite проксіює `/api` та `/hubs` на backend.

## Demo media

Репозиторій містить невеликий власний MP4 demo preview для початкових відеокарток. Це дозволяє перевірити сторінку перегляду та HTTP Range streaming одразу після чистого клонування без ручного копіювання відеофайлів.

Завантажені користувачами файли зберігаються у `backend/Storage/media/videos` і не повинні випадково потрапляти до Git. Demo MP4 файли у цій папці вже відстежуються Git навмисно.

## Особливості realtime модулів

Live каталог зараз є демонстраційним runtime каталогом. Live chat зберігає до 200 повідомлень на трансляцію в пам'яті процесу, тому після перезапуску сервера його історія очищується. Watch Party зберігає кімнати у локальному JSON файлі на машині сервера і відновлює їх після перезапуску того самого екземпляра застосунку.

Ці модулі працюють для навчального single server сценарію. Для production deployment їх сховище потрібно замінити на спільну постійну інфраструктуру.

## Тести і перевірка перед merge

Backend:

```powershell
dotnet test backend/YouTubeClone.Api.slnx --configuration Release
```

Frontend:

```powershell
cd frontend
npm test
npm run lint
npm run build
```

GitHub Actions додатково виконує build, backend tests, frontend tests, lint, production preview smoke test, health smoke test, перевірку bundled demo video streaming, генерацію SQL Server migration script та перевірку відсутності незбережених змін EF Core моделі.

## JWT конфігурація

Значення `Jwt:SigningKey` у репозиторії призначене тільки для локальної розробки. Для реального розгортання ключ потрібно передавати через безпечну конфігурацію або змінну середовища `Jwt__SigningKey` і не зберігати production secret у Git.
