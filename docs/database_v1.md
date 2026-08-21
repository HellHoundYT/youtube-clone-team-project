# YouTube Clone Database v1

## Загальна мета

Цей документ фіксує першу версію структури бази даних для командного проєкту FrameSync.

База даних використовується для зберігання метаданих застосунку.

Відеофайли, зображення, аватари, банери та інші медіафайли не зберігаються у SQL Server.

У базі даних зберігаються лише шляхи до відповідних файлів.

Основна СУБД: SQL Server.

ORM: Entity Framework Core.

Основні ідентифікатори сутностей використовують тип uniqueidentifier.

Для дат використовується datetimeoffset.

## Users

| Поле | Тип | Обмеження |
| --- | --- | --- |
| Id | uniqueidentifier | Primary Key |
| Email | nvarchar(320) | Required, Unique |
| PasswordHash | nvarchar(500) | Required |
| DisplayName | nvarchar(100) | Required |
| AvatarPath | nvarchar(500) | Nullable |
| IsActive | bit | Required |
| CreatedAt | datetimeoffset | Required |
| UpdatedAt | datetimeoffset | Nullable |

Email користувача повинен бути унікальним.

Пароль у відкритому вигляді не зберігається.

## Channels

| Поле | Тип | Обмеження |
| --- | --- | --- |
| Id | uniqueidentifier | Primary Key |
| OwnerUserId | uniqueidentifier | Foreign Key, Unique |
| Name | nvarchar(120) | Required |
| Handle | nvarchar(50) | Required, Unique |
| Description | nvarchar(2000) | Nullable |
| AvatarPath | nvarchar(500) | Nullable |
| BannerPath | nvarchar(500) | Nullable |
| CreatedAt | datetimeoffset | Required |
| UpdatedAt | datetimeoffset | Nullable |

У першій версії один користувач має один основний канал.

## Categories

| Поле | Тип | Обмеження |
| --- | --- | --- |
| Id | int | Primary Key, Identity |
| Name | nvarchar(100) | Required |
| Slug | nvarchar(100) | Required, Unique |

Категорії використовуються для групування відео та формування тематичних сторінок.

## Videos

| Поле | Тип | Обмеження |
| --- | --- | --- |
| Id | uniqueidentifier | Primary Key |
| ChannelId | uniqueidentifier | Foreign Key |
| CategoryId | int | Foreign Key, Nullable |
| Title | nvarchar(200) | Required |
| Description | nvarchar(5000) | Nullable |
| VideoPath | nvarchar(1000) | Required |
| ThumbnailPath | nvarchar(1000) | Nullable |
| DurationSeconds | int | Required |
| Visibility | int | Required |
| ProcessingStatus | int | Required |
| ViewCount | bigint | Required |
| CreatedAt | datetimeoffset | Required |
| PublishedAt | datetimeoffset | Nullable |

Visibility визначає доступність відео.

Значення:

Public

Unlisted

Private

ProcessingStatus визначає стан обробки відео.

Значення:

Draft

Processing

Published

Failed

## Subscriptions

| Поле | Тип | Обмеження |
| --- | --- | --- |
| SubscriberUserId | uniqueidentifier | Primary Key, Foreign Key |
| ChannelId | uniqueidentifier | Primary Key, Foreign Key |
| CreatedAt | datetimeoffset | Required |

Комбінація SubscriberUserId та ChannelId повинна бути унікальною.

## Comments

| Поле | Тип | Обмеження |
| --- | --- | --- |
| Id | uniqueidentifier | Primary Key |
| VideoId | uniqueidentifier | Foreign Key |
| UserId | uniqueidentifier | Foreign Key |
| ParentCommentId | uniqueidentifier | Foreign Key, Nullable |
| Text | nvarchar(2000) | Required |
| CreatedAt | datetimeoffset | Required |
| UpdatedAt | datetimeoffset | Nullable |
| IsDeleted | bit | Required |

ParentCommentId дозволяє створювати відповіді на коментарі.

Видалення коментаря може бути логічним через IsDeleted без фізичного видалення запису.

## VideoReactions

| Поле | Тип | Обмеження |
| --- | --- | --- |
| UserId | uniqueidentifier | Primary Key, Foreign Key |
| VideoId | uniqueidentifier | Primary Key, Foreign Key |
| Type | int | Required |
| CreatedAt | datetimeoffset | Required |

Один користувач може мати лише одну реакцію на конкретне відео.

## CommentReactions

| Поле | Тип | Обмеження |
| --- | --- | --- |
| UserId | uniqueidentifier | Primary Key, Foreign Key |
| CommentId | uniqueidentifier | Primary Key, Foreign Key |
| Type | int | Required |
| CreatedAt | datetimeoffset | Required |

Один користувач може мати лише одну реакцію на конкретний коментар.

## WatchHistory

| Поле | Тип | Обмеження |
| --- | --- | --- |
| UserId | uniqueidentifier | Primary Key, Foreign Key |
| VideoId | uniqueidentifier | Primary Key, Foreign Key |
| ProgressSeconds | int | Required |
| Completed | bit | Required |
| LastWatchedAt | datetimeoffset | Required |

Один запис відповідає одному відео в історії конкретного користувача.

При повторному перегляді запис оновлюється.

## Favorites

| Поле | Тип | Обмеження |
| --- | --- | --- |
| UserId | uniqueidentifier | Primary Key, Foreign Key |
| VideoId | uniqueidentifier | Primary Key, Foreign Key |
| CreatedAt | datetimeoffset | Required |

Favorites реалізує окремий список улюбленого контенту користувача.

## Playlists

| Поле | Тип | Обмеження |
| --- | --- | --- |
| Id | uniqueidentifier | Primary Key |
| OwnerUserId | uniqueidentifier | Foreign Key |
| Name | nvarchar(150) | Required |
| Description | nvarchar(1000) | Nullable |
| Visibility | int | Required |
| CreatedAt | datetimeoffset | Required |
| UpdatedAt | datetimeoffset | Nullable |

## PlaylistVideos

| Поле | Тип | Обмеження |
| --- | --- | --- |
| PlaylistId | uniqueidentifier | Primary Key, Foreign Key |
| VideoId | uniqueidentifier | Primary Key, Foreign Key |
| Position | int | Required |
| AddedAt | datetimeoffset | Required |

PlaylistVideos реалізує зв'язок багато до багатьох між Playlists та Videos.

Position визначає порядок відео у плейлисті.

## RefreshTokens

| Поле | Тип | Обмеження |
| --- | --- | --- |
| Id | uniqueidentifier | Primary Key |
| UserId | uniqueidentifier | Foreign Key |
| TokenHash | nvarchar(500) | Required, Unique |
| CreatedAt | datetimeoffset | Required |
| ExpiresAt | datetimeoffset | Required |
| RevokedAt | datetimeoffset | Nullable |

Refresh token у відкритому вигляді у базі даних не зберігається.

## Основні зв'язки

User має один Channel.

User може мати багато RefreshTokens.

Channel має багато Videos.

Category може містити багато Videos.

User підписується на Channels через Subscriptions.

Video має багато Comments.

Comment може мати дочірні Comments.

User взаємодіє з Videos через VideoReactions.

User взаємодіє з Comments через CommentReactions.

User має історію переглядів через WatchHistory.

User має улюблені відео через Favorites.

User має багато Playlists.

Playlist містить Videos через PlaylistVideos.

## Видалення даних

Для ключових сутностей не планується агресивне каскадне видалення.

Для зв'язувальних таблиць може використовуватися каскадне видалення.

Для Comments передбачене логічне видалення.

Для User, Channel та Video можливість повного soft delete буде розглянута окремо у наступних версіях.

## Межі відповідальності

Ця схема є спільним архітектурним контрактом Backend.

Ілля відповідає за структуру бази даних, AppDbContext, загальні зв'язки та інтеграцію модулів.

Реалізація Auth, User Profile, Channels, Subscriptions, Comments та Playlists виконується Тетяною відповідно до окремих задач Trello.

Ілля реалізує Video, History, Favorites, Search та іншу серверну логіку зі своєї зони відповідальності.

Спільні сутності не змінюються одним учасником без узгодження контракту.