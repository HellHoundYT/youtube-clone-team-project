# AMTLIS API Contract v1

## Призначення

Цей документ описує фактичний HTTP та realtime контракт поточної версії AMTLIS. Основний HTTP префікс:

```text
/api/v1
```

JSON використовується для звичайних запитів і відповідей. Завантаження відео та зображень використовує `multipart/form-data`. Ідентифікатори сутностей передаються як UUID. Дати повертаються у форматі ISO 8601.

## Авторизація

Захищені HTTP маршрути очікують JWT access token:

```text
Authorization: Bearer <accessToken>
```

Refresh token не повертається frontend коду і не зберігається у `localStorage` або `sessionStorage`. Backend встановлює його у HttpOnly cookie `amtlis.refresh_token` з `SameSite=Lax` і шляхом `/api/v1/auth`.

### Реєстрація

```text
POST /api/v1/auth/register
```

Приклад request:

```json
{
  "email": "user@example.com",
  "password": "password123",
  "displayName": "User",
  "userName": "user"
}
```

Успішна response:

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "displayName": "User",
    "handle": "@user",
    "bio": "",
    "avatarUrl": null,
    "themeId": null
  },
  "accessToken": "jwt"
}
```

### Вхід

```text
POST /api/v1/auth/login
```

Request:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response має ту саму форму, що й реєстрація. Refresh cookie встановлюється сервером.

### Оновлення access token

```text
POST /api/v1/auth/refresh
```

Тіло не потрібне. Сервер читає HttpOnly refresh cookie, виконує rotation і повертає новий access token разом з актуальним користувачем.

### Вихід

```text
POST /api/v1/auth/logout
```

Сервер відкликає refresh token, якщо він присутній, і видаляє refresh cookie.

## Users

Усі маршрути цього розділу, крім отримання аватара, захищені.

```text
GET /api/v1/users/me
PUT /api/v1/users/me
POST /api/v1/users/me/avatar
GET /api/v1/users/{userId}/avatar
```

`PUT /users/me` приймає:

```json
{
  "email": "user@example.com",
  "displayName": "New name",
  "handle": "@newhandle",
  "bio": "Profile text",
  "themeId": "midnight"
}
```

Аватар завантажується окремо як поле `file`. Підтримуються PNG, JPEG та WebP, максимальний розмір 5 MB.

## Channels та subscriptions

Публічні маршрути:

```text
GET /api/v1/channels
GET /api/v1/channels/{channelId}
GET /api/v1/channels/{channelId}/avatar
GET /api/v1/channels/{channelId}/banner
```

Захищені маршрути:

```text
GET /api/v1/channels/me
POST /api/v1/channels
PUT /api/v1/channels/{channelId}
POST /api/v1/channels/{channelId}/avatar
POST /api/v1/channels/{channelId}/banner
GET /api/v1/channels/subscriptions
POST /api/v1/channels/{channelId}/subscribe
DELETE /api/v1/channels/{channelId}/subscribe
```

Один користувач володіє одним каналом. `GET /channels/me` готує канал поточного користувача, якщо його ще немає. Підписка на власний канал заборонена.

Аватар каналу підтримує PNG, JPEG та WebP до 5 MB. Banner підтримує ті самі формати до 10 MB.

Відео конкретного каналу отримуються через:

```text
GET /api/v1/videos?channelId={channelId}
```

## Videos

Публічні маршрути:

```text
GET /api/v1/videos
GET /api/v1/videos/{videoId}
GET /api/v1/videos/{videoId}/stream
POST /api/v1/videos/{videoId}/view
```

`GET /videos` підтримує query параметри:

```text
page
pageSize
category
channelId
```

`GET /videos/{videoId}/stream` повертає MP4 та підтримує HTTP Range Requests.

Завантаження відео:

```text
POST /api/v1/videos/upload
```

Маршрут захищений і приймає `multipart/form-data` з полями `file`, `title`, `description`, `category`. Підтримується MP4 до 500 MB. Файл перевіряється через `ffprobe`, після чого метадані зберігаються через video service та EF Core repository.

У поточному v1 немає окремих HTTP маршрутів для редагування, видалення відео або реакцій Like/Dislike на саме відео. Їх не слід вважати частиною реалізованого контракту.

## Categories

```text
GET /api/v1/categories
GET /api/v1/categories/{slug}/videos
```

Для другого маршруту підтримуються `page` та `pageSize`. Максимальний `pageSize` дорівнює 50.

## Comments та comment reactions

Читання коментарів доступне без авторизації:

```text
GET /api/v1/videos/{videoId}/comments?page=1&pageSize=20&sort=newest
```

`sort` приймає `newest`, `oldest` або `top`.

Захищені маршрути:

```text
POST /api/v1/videos/{videoId}/comments
PUT /api/v1/comments/{commentId}
DELETE /api/v1/comments/{commentId}
POST /api/v1/comments/{commentId}/reaction
```

Створення коментаря:

```json
{
  "text": "Comment",
  "parentCommentId": null
}
```

Реакція:

```json
{
  "reaction": "like"
}
```

Допустимі значення реакції: `like` та `dislike`. Повторна така сама реакція працює як toggle відповідно до логіки comment service.

## Watch History

Увесь розділ захищений і працює тільки з даними поточного користувача.

```text
GET /api/v1/history
PUT /api/v1/history/{videoId}
DELETE /api/v1/history/{videoId}
DELETE /api/v1/history
GET /api/v1/history/status
PUT /api/v1/history/status
```

Оновлення прогресу:

```json
{
  "progressSeconds": 125,
  "completed": false
}
```

Стан паузи історії:

```json
{
  "isPaused": true
}
```

Якщо історію поставлено на паузу, оновлення прогресу не створює і не змінює запис історії.

## Favorites

Усі маршрути захищені та ізольовані за користувачем.

```text
GET /api/v1/favorites
POST /api/v1/favorites/{videoId}
DELETE /api/v1/favorites/{videoId}
```

## Playlists

Усі маршрути захищені та працюють тільки з плейлистами поточного користувача.

```text
GET /api/v1/playlists
POST /api/v1/playlists
PUT /api/v1/playlists/{playlistId}
DELETE /api/v1/playlists/{playlistId}
POST /api/v1/playlists/{playlistId}/videos/{videoId}
DELETE /api/v1/playlists/{playlistId}/videos/{videoId}
```

Створення та оновлення використовують:

```json
{
  "title": "My playlist",
  "description": "Description"
}
```

Поточний v1 не має окремого HTTP маршруту для ручного reorder елементів плейлиста.

## Search

```text
GET /api/v1/search?query={text}
```

`query` є обов'язковим, обрізається по краях і не може перевищувати 100 символів.

## Live Streams

Публічний демонстраційний live каталог:

```text
GET /api/v1/streams
GET /api/v1/streams/{streamId}
GET /api/v1/streams/categories
```

`GET /streams` підтримує необов'язковий параметр `category`.

Поточна реалізація live каталогу використовує runtime demo repository. Це свідоме обмеження навчальної версії, а не SQL persistent live management.

## SignalR

Realtime модулі використовують два hubs:

```text
/hubs/live-chat
/hubs/watch-party
```

Live chat підтримує realtime повідомлення, replies, edit, delete та reactions. Його runtime repository тримає до 200 повідомлень на одну трансляцію і очищається після перезапуску процесу.

Watch Party синхронізує кімнату, учасників, чат і playback state. Стан кімнат зберігається у локальному JSON файлі сервера та може відновлюватися після перезапуску того самого екземпляра застосунку.

## Health

```text
GET /api/health
```

Приклад response:

```json
{
  "status": "ok",
  "service": "YouTubeClone.Api"
}
```

## Межі v1

Основні соціальні та персональні модулі вже інтегровані через один backend і спільну frontend architecture. SQL Server використовується для користувачів, refresh tokens, каналів, підписок, коментарів, comment reactions, плейлистів, відеометаданих, історії та обраного.

Media files зберігаються окремо у файловому сховищі. Live catalog і Live Chat залишаються runtime модулями, а Watch Party використовує локальне file persistence. Це потрібно враховувати при переході від навчального single server deployment до production інфраструктури.
