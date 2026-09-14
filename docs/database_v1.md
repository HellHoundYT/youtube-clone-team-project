# AMTLIS Database v1

## Призначення

Цей документ описує фактичну persistent модель поточної версії AMTLIS.

Основна СУБД: SQL Server.

ORM: Entity Framework Core 10.

Основні ідентифікатори мають тип `uniqueidentifier`. Дати та час зберігаються як `datetimeoffset`. Відеофайли, аватари та банери не зберігаються у SQL Server. У таблицях зберігаються метадані та відносні шляхи до файлового сховища.

Актуальним джерелом істини для схеми є `AppDbContext`, EF migrations та `AppDbContextModelSnapshot`.

## Users

| Поле | Обмеження |
| --- | --- |
| Id | Primary Key |
| Email | Required, max 256, Unique |
| UserName | Required, max 64, Unique |
| DisplayName | Required, max 100 |
| Bio | Required, max 240 |
| AvatarPath | Nullable, max 512 |
| ThemeId | Nullable, max 64 |
| PasswordHash | Required, max 512 |
| CreatedAt | Required |

Пароль у відкритому вигляді не зберігається. `AvatarPath` містить шлях до локального media storage. `ThemeId` зберігає вибрану користувачем тему оформлення.

## RefreshTokens

| Поле | Обмеження |
| --- | --- |
| Id | Primary Key |
| UserId | Foreign Key до Users |
| TokenHash | Required, max 128, Unique |
| ExpiresAt | Required |
| RevokedAt | Nullable |

Є індекс за `UserId`. Видалення User каскадно видаляє його refresh tokens. У базі зберігається hash, а не відкритий refresh token.

## Channels

| Поле | Обмеження |
| --- | --- |
| Id | Primary Key |
| OwnerId | Foreign Key до Users, Unique |
| Name | Required, max 100 |
| Handle | Required, max 64, Unique |
| Description | Required, max 1000 |
| AvatarPath | Nullable, max 512 |
| BannerPath | Nullable, max 512 |
| CreatedAt | Required |

`OwnerId` є унікальним, тому один користувач має один канал.

## Subscriptions

| Поле | Обмеження |
| --- | --- |
| SubscriberId | Composite Primary Key, Foreign Key до Users |
| ChannelId | Composite Primary Key, Foreign Key до Channels |
| CreatedAt | Required |

Є окремий індекс за `ChannelId`. Для зв'язку з користувачем використовується `DeleteBehavior.NoAction`, а при видаленні каналу його subscriptions видаляються каскадно.

## Videos

| Поле | Обмеження |
| --- | --- |
| Id | Primary Key |
| ChannelId | Indexed UUID |
| ChannelName | Required, max 100 |
| ChannelAvatarPath | Nullable, max 512 |
| Category | Nullable, max 100 |
| CategorySlug | Nullable, max 100, Indexed |
| Title | Required, max 200 |
| Description | Nullable, max 5000 |
| VideoPath | Required, max 512 |
| ThumbnailPath | Nullable, max 512 |
| DurationSeconds | Required |
| ViewCount | Required |
| Visibility | Required, max 32 |
| PublishedAt | Indexed |

У поточній версії `ChannelId` зберігається як UUID та індексується, але SQL foreign key до `Channels` не створюється. Це дозволяє працювати як із реальними каналами користувачів, так і з початковим demo catalog.

`VideoPath` для API відео вказує на streaming endpoint. Фізичний MP4 зберігається у файловому storage за ідентифікатором відео.

Категорії у v1 не мають окремої SQL таблиці. Вони визначаються application service і дублюються у відеометаданих як `Category` та `CategorySlug`.

## Comments

| Поле | Обмеження |
| --- | --- |
| Id | Primary Key |
| VideoId | Indexed UUID |
| AuthorId | Indexed UUID |
| ParentCommentId | Nullable, Indexed UUID |
| Text | Required, max 500 |
| CreatedAt | Required |

`ParentCommentId` використовується для replies. Поточна модель фізично видаляє коментар згідно з service/repository логікою і не містить поля `IsDeleted`.

`VideoId` та `AuthorId` індексуються, але у поточному snapshot не є SQL foreign keys. Валідація власника і зв'язків виконується application та repository шарами.

## CommentReactions

| Поле | Обмеження |
| --- | --- |
| CommentId | Composite Primary Key, Foreign Key до Comments |
| UserId | Composite Primary Key, Indexed UUID |
| Kind | Required |
| UpdatedAt | Required |

На один коментар один користувач може мати не більше однієї reaction. Видалення comment каскадно видаляє його reactions.

Окремої таблиці `VideoReactions` у поточному v1 немає.

## Playlists

| Поле | Обмеження |
| --- | --- |
| Id | Primary Key |
| OwnerId | Foreign Key до Users, Indexed |
| Title | Required, max 80 |
| Description | Required, max 300 |
| CreatedAt | Required |
| UpdatedAt | Required |

Видалення користувача каскадно видаляє його playlists.

## PlaylistVideos

| Поле | Обмеження |
| --- | --- |
| PlaylistId | Composite Primary Key, Foreign Key до Playlists |
| VideoId | Composite Primary Key, Indexed UUID |
| AddedAt | Required |

Пара `PlaylistId + VideoId` унікальна. У поточному v1 немає поля `Position`, тому ручний порядок елементів плейлиста не зберігається окремо.

## WatchHistoryEntries

| Поле | Обмеження |
| --- | --- |
| UserId | Composite Primary Key, Foreign Key до Users |
| VideoId | Composite Primary Key |
| ProgressSeconds | Required |
| Completed | Required |
| LastWatchedAt | Required, входить до індексу з UserId |

Історія фізично ізольована за `UserId`. Повторний перегляд того самого відео оновлює існуючий запис.

## WatchHistoryPreferences

| Поле | Обмеження |
| --- | --- |
| UserId | Primary Key, Foreign Key до Users |
| IsPaused | Required |

Таблиця зберігає персональний стан паузи історії. На одного користувача існує не більше одного preference record.

## FavoriteEntries

| Поле | Обмеження |
| --- | --- |
| UserId | Composite Primary Key, Foreign Key до Users |
| VideoId | Composite Primary Key |
| CreatedAt | Required, входить до індексу з UserId |

Обране фізично ізольоване за користувачем. Пара `UserId + VideoId` не може дублюватися.

## Дані поза SQL Server

### Media storage

MP4, user avatars, channel avatars та channel banners зберігаються у локальному файловому storage. SQL Server містить тільки метадані або шлях до файлу.

### Live Streams

Поточний live catalog використовує `InMemoryLiveStreamRepository`. Це demo runtime data і воно не створює SQL таблицю.

### Live Chat

`InMemoryLiveChatRepository` тримає до 200 повідомлень на одну трансляцію у пам'яті процесу. Після перезапуску сервера ця історія очищається.

### Watch Party

Watch Party не використовує SQL Server. `FileWatchPartyRepository` зберігає кімнати, учасників, playback state та повідомлення у локальному JSON файлі сервера.

## Каскадне видалення

Поточна схема використовує каскадне видалення там, де дочірні записи не мають сенсу без власника: refresh tokens користувача, channel користувача, playlists, history, favorites, history preferences, comment reactions та playlist membership.

Для subscription зв'язку користувача застосовано `DeleteBehavior.NoAction`, щоб уникати проблем множинних cascade paths у SQL Server.

## Migration discipline

Кожна зміна persistent моделі повинна супроводжуватися EF migration і оновленим `AppDbContextModelSnapshot`.

CI виконує:

```text
dotnet ef migrations has-pending-model-changes
```

Тому pull request не повинен проходити backend CI, якщо модель `AppDbContext` змінилася без відповідної migration/snapshot синхронізації.

## Межі v1

Ця схема описує саме реалізовану версію, а не майбутній задум. Потенційні production розширення, такі як SQL persistence для live streams, durable live chat, окремі video reactions, playlist ordering, distributed media storage та multi instance Watch Party, повинні додаватися окремими migrations і контрактними змінами.
