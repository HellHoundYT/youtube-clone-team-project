# YouTube Clone API Contract v1

## Загальна мета

Цей документ визначає першу версію HTTP API для командного проєкту FrameSync.

Backend реалізується на ASP.NET Core Web API.

Основний префікс API:

/api/v1

Формат обміну даними:

JSON

Авторизація:

JWT Access Token

Refresh Token

## Загальні правила

Усі ідентифікатори сутностей, крім Category, передаються як UUID.

Дата та час повертаються у форматі ISO 8601.

Захищені маршрути вимагають JWT Access Token.

Медіафайли не передаються через звичайні JSON DTO.

API повертає URL або шлях до медіафайлу.

## Auth

Відповідальна за реалізацію:

Таня

### Реєстрація

POST /api/v1/auth/register

Request:

{
  "email": "user@example.com",
  "password": "password",
  "displayName": "User"
}

Response:

{
  "userId": "uuid",
  "displayName": "User",
  "accessToken": "token",
  "refreshToken": "token"
}

### Вхід

POST /api/v1/auth/login

Request:

{
  "email": "user@example.com",
  "password": "password"
}

Response:

{
  "userId": "uuid",
  "displayName": "User",
  "accessToken": "token",
  "refreshToken": "token"
}

### Оновлення Access Token

POST /api/v1/auth/refresh

Request:

{
  "refreshToken": "token"
}

### Вихід

POST /api/v1/auth/logout

Маршрут відкликає поточний Refresh Token.

## Users

Відповідальна за реалізацію:

Таня

### Поточний користувач

GET /api/v1/users/me

Response:

{
  "id": "uuid",
  "email": "user@example.com",
  "displayName": "User",
  "avatarPath": null
}

### Оновлення профілю

PUT /api/v1/users/me

Request:

{
  "displayName": "New name"
}

Завантаження аватара реалізується окремим маршрутом роботи з файлами.

## Channels

Відповідальна за реалізацію:

Таня

### Отримання каналу

GET /api/v1/channels/{channelId}

### Отримання каналу за handle

GET /api/v1/channels/handle/{handle}

### Оновлення власного каналу

PUT /api/v1/channels/me

### Відео каналу

GET /api/v1/channels/{channelId}/videos

### Плейлисти каналу

GET /api/v1/channels/{channelId}/playlists

## Subscriptions

Відповідальна за реалізацію:

Таня

### Підписатися

POST /api/v1/channels/{channelId}/subscribe

### Відписатися

DELETE /api/v1/channels/{channelId}/subscribe

### Перевірка підписки

GET /api/v1/channels/{channelId}/subscription

### Мої підписки

GET /api/v1/subscriptions

## Videos

Відповідальний за реалізацію:

Илья

### Головна стрічка

GET /api/v1/videos

Параметри:

page

pageSize

category

### Отримання відео

GET /api/v1/videos/{videoId}

Response містить:

id

channel

category

title

description

videoPath

thumbnailPath

durationSeconds

viewCount

visibility

publishedAt

### Створення метаданих відео

POST /api/v1/videos

Маршрут захищений.

### Оновлення відео

PUT /api/v1/videos/{videoId}

### Видалення відео

DELETE /api/v1/videos/{videoId}

### Потік відео

GET /api/v1/videos/{videoId}/stream

Маршрут повинен підтримувати HTTP Range Requests.

### Реєстрація перегляду

POST /api/v1/videos/{videoId}/view

## Categories

Відповідальний за реалізацію:

Илья

### Список категорій

GET /api/v1/categories

### Відео категорії

GET /api/v1/categories/{slug}/videos

## Video Reactions

Відповідальний за реалізацію:

Илья

### Додати або змінити реакцію

PUT /api/v1/videos/{videoId}/reaction

Request:

{
  "type": "Like"
}

### Видалити реакцію

DELETE /api/v1/videos/{videoId}/reaction

## Comments

Відповідальна за реалізацію:

Таня

### Коментарі відео

GET /api/v1/videos/{videoId}/comments

### Створення коментаря

POST /api/v1/videos/{videoId}/comments

Request:

{
  "text": "Comment",
  "parentCommentId": null
}

### Редагування коментаря

PUT /api/v1/comments/{commentId}

### Видалення коментаря

DELETE /api/v1/comments/{commentId}

### Реакція на коментар

PUT /api/v1/comments/{commentId}/reaction

### Видалення реакції

DELETE /api/v1/comments/{commentId}/reaction

## Watch History

Відповідальний за реалізацію:

Илья

### Історія переглядів

GET /api/v1/history

### Оновлення прогресу

PUT /api/v1/history/{videoId}

Request:

{
  "progressSeconds": 125,
  "completed": false
}

### Видалення одного запису

DELETE /api/v1/history/{videoId}

### Очистити історію

DELETE /api/v1/history

## Favorites

Відповідальний за реалізацію:

Илья

### Улюблені відео

GET /api/v1/favorites

### Додати в улюблене

POST /api/v1/favorites/{videoId}

### Видалити з улюбленого

DELETE /api/v1/favorites/{videoId}

## Playlists

Відповідальна за реалізацію:

Таня

### Мої плейлисти

GET /api/v1/playlists

### Отримання плейлиста

GET /api/v1/playlists/{playlistId}

### Створення плейлиста

POST /api/v1/playlists

### Оновлення плейлиста

PUT /api/v1/playlists/{playlistId}

### Видалення плейлиста

DELETE /api/v1/playlists/{playlistId}

### Додати відео

POST /api/v1/playlists/{playlistId}/videos/{videoId}

### Видалити відео

DELETE /api/v1/playlists/{playlistId}/videos/{videoId}

### Змінити порядок відео

PUT /api/v1/playlists/{playlistId}/videos/order

## Search

Відповідальний за реалізацію:

Илья

### Пошук

GET /api/v1/search

Параметр:

query

Пошук першої версії може повертати:

Videos

Channels

Playlists

## Health

Спільна серверна інфраструктура.

### Перевірка Backend

GET /api/health

Response:

{
  "status": "ok",
  "service": "YouTubeClone.Api"
}

## Майбутні модулі

Наступні системи не входять до першого API контракту:

Playme

Live Streams

Live Chat

Themes

Achievements

Profile decorations

Amtlis Pro

Вони будуть додані наступними версіями API після завершення основного вертикального зрізу.

## Межі реалізації

Илья відповідає за загальну архітектуру API, інтеграцію модулів, Videos, Categories, Video Reactions, Watch History, Favorites та Search.

Таня відповідає за Auth, Users, Channels, Subscriptions, Comments, Comment Reactions та Playlists.

Архітектурний контракт може змінюватися лише після узгодження змін між учасниками команди.

Frontend повинен працювати з контрактами API, а не залежати від внутрішньої реалізації контролерів та сервісів Backend.