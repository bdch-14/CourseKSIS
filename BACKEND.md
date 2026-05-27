# Документация архитектуры — CourseKSIS

> Игра «Найди пару» (Memory Game) — многопользовательская веб-игра с матчмейкингом в реальном времени.  
> Стек: **NestJS + Prisma + PostgreSQL** (бэкенд) + **React + TypeScript + Vite** (фронтенд)

---

## Общая структура репозитория

```
CourseKSIS/
├── backend/        # NestJS-сервер (REST API + WebSocket)
│   ├── prisma/     # Схема БД и миграции (Prisma ORM)
│   └── src/        # Исходный код сервера
│       ├── auth/       # Модуль аутентификации
│       ├── common/     # Общие утилиты (декораторы)
│       ├── game/       # Модуль игровой логики (WebSocket)
│       ├── prisma/     # Сервис подключения к БД
│       ├── rooms/      # Модуль комнат
│       ├── users/      # Модуль пользователей
│       ├── app.module.ts
│       └── main.ts
└── frontend/       # React-приложение (Vite)
    └── src/
        ├── components/  # Переиспользуемые UI-компоненты
        ├── context/     # React Context (глобальное состояние)
        ├── pages/       # Страницы приложения
        ├── routes/      # Роутинг (React Router)
        ├── services/    # HTTP-клиент и WebSocket-клиент
        ├── styles/      # Глобальные стили
        └── types/       # TypeScript-интерфейсы
```

---

## BACKEND

### `backend/src/main.ts`

Точка входа приложения.

| Функция | Описание |
|---|---|
| `bootstrap()` | Создаёт NestJS-приложение, устанавливает глобальный префикс `/api`, настраивает CORS для `localhost:5173`, подключает `ValidationPipe` и `IoAdapter` для WebSocket, запускает сервер на порту `5000`. |

---

### `backend/src/app.module.ts`

Корневой модуль приложения. Объединяет все модули: `AuthModule`, `UsersModule`, `RoomsModule`, `GameModule`, `PrismaModule`, а также `ConfigModule` для работы с `.env`.

---

### `backend/prisma/schema.prisma`

Схема базы данных (PostgreSQL). Описывает следующие сущности:

| Модель | Описание |
|---|---|
| `User` | Пользователь: логин, email, хэш пароля, displayName, хэш refresh-токена. |
| `Room` | Игровая комната: уникальный код, сложность, статус (`WAITING`, `IN_GAME`, `FINISHED`), создатель. |
| `RoomParticipant` | Связь «пользователь–комната», фиксирует время входа. |
| `Match` | Запись об игровом матче: статус, победитель, длительность, ID отключившегося игрока. |
| `MatchPlayer` | Результат игрока в матче: очки, результат (`WIN`/`LOSE`/`DRAW`), позиция. |

Перечисления: `Difficulty` (EASY / MEDIUM / HARD), `RoomStatus`, `MatchStatus`, `MatchResult`.

---

## Модуль `auth`

Отвечает за регистрацию, вход, обновление токенов и выход.

### `auth/auth.controller.ts`

HTTP-контроллер для маршрутов `/api/auth/*`.

| Метод / Маршрут | Описание |
|---|---|
| `POST /register` | Регистрирует пользователя, устанавливает refresh-токен в httpOnly-cookie. |
| `POST /login` | Аутентифицирует пользователя, возвращает `accessToken` + устанавливает cookie. |
| `POST /refresh` | Обновляет пару токенов по refresh-токену из cookie (guard `RefreshJwtAuthGuard`). |
| `POST /logout` | Очищает refresh-токен в БД и удаляет cookie. |
| `GET /me` | Возвращает данные текущего авторизованного пользователя. |
| `setRefreshTokenCookie(res, token)` | Приватный метод: устанавливает httpOnly-cookie с refresh-токеном (TTL 7 дней). |

### `auth/auth.service.ts`

Бизнес-логика аутентификации.

| Метод | Описание |
|---|---|
| `register(dto)` | Проверяет уникальность логина, хэширует пароль bcrypt'ом, создаёт пользователя, генерирует токены. |
| `login(dto)` | Проверяет логин/пароль, обновляет хэш refresh-токена в БД, возвращает токены. |
| `refreshTokens(userId, refreshToken)` | Валидирует refresh-токен через bcrypt-сравнение с хэшем в БД, выдаёт новую пару. |
| `logout(userId)` | Обнуляет `refreshTokenHash` пользователя в БД. |
| `createRefreshToken(userId, login)` | Генерирует refresh-токен и сохраняет его хэш. |
| `generateTokens(userId, login)` | Приватный: создаёт access- и refresh-JWT с разными секретами и временем жизни из `.env`. |
| `updateRefreshTokenHash(userId, token)` | Приватный: хэширует refresh-токен и сохраняет в `users.refreshTokenHash`. |
| `sanitizeUser(user)` | Приватный: возвращает объект пользователя без чувствительных полей. |

### `auth/auth.module.ts`

Регистрирует провайдеры: `AuthService`, `JwtModule`, стратегии, импортирует `UsersModule`.

### `auth/guards/jwt-auth.guard.ts`

Guard на основе Passport `JwtStrategy`. Защищает маршруты, требующие access-токена.

### `auth/guards/refresh-jwt-auth.guard.ts`

Guard на основе `RefreshJwtStrategy`. Используется только на маршруте `/refresh`.

### `auth/strategies/jwt.strategy.ts`

Passport-стратегия для access JWT. Извлекает токен из заголовка `Authorization: Bearer`, верифицирует, достаёт пользователя из БД и помещает в `request.user`.

### `auth/strategies/refresh-jwt.strategy.ts`

Passport-стратегия для refresh JWT. Читает токен из cookie `refreshToken`, верифицирует, добавляет в `request.user`.

### `auth/dto/`

- `login.dto.ts` — валидация тела запроса для входа (`login`, `password`).
- `register.dto.ts` — валидация для регистрации (`login`, `email`, `displayName`, `password`).

### `auth/interfaces/`

- `jwt-payload.interface.ts` — тип `JwtPayload` (`sub`, `login`).
- `token-pair.interface.ts` — тип `TokenPair` (`accessToken`, `refreshToken`).

---

## Модуль `users`

Отвечает за профиль пользователя и статистику.

### `users/users.controller.ts`

| Метод / Маршрут | Описание |
|---|---|
| `GET /profile` | Возвращает профиль, статистику и историю матчей текущего пользователя. |
| `PATCH /profile` | Обновляет `displayName` пользователя. |

### `users/users.service.ts`

| Метод | Описание |
|---|---|
| `findById(id)` | Находит пользователя по UUID. |
| `findByLogin(login)` | Находит пользователя по логину. |
| `create(data)` | Создаёт нового пользователя в БД. |
| `updateRefreshTokenHash(userId, hash)` | Обновляет хэш refresh-токена (или обнуляет при logout). |
| `updateProfile(userId, dto)` | Обновляет `displayName`, возвращает санированный объект. |
| `getProfile(userId)` | Возвращает данные профиля без чувствительных полей. |
| `getStats(userId)` | Считает общее число игр, победы, поражения, ничьи из `MatchPlayer`. |
| `getMatchHistory(userId)` | Возвращает историю завершённых матчей с оппонентом, счётом и результатом. |
| `getProfileBundle(userId)` | Агрегирует профиль + статистику + историю + `winRate` в один запрос. |
| `sanitizeUser(user)` | Приватный: убирает `passwordHash` и `refreshTokenHash` из объекта. |

### `users/users.module.ts`

Регистрирует `UsersService` и `PrismaModule`, экспортирует `UsersService`.

### `users/dto/update-profile.dto.ts`

DTO для обновления профиля (`displayName`).

---

## Модуль `rooms`

Управляет созданием и жизненным циклом игровых комнат.

### `rooms/rooms.controller.ts`

| Метод / Маршрут | Описание |
|---|---|
| `GET /rooms` | Получает список комнат с фильтрацией по сложности и статусу. |
| `GET /rooms/:id` | Получает данные конкретной комнаты с участниками. |
| `POST /rooms` | Создаёт новую комнату и добавляет создателя как участника. |
| `POST /rooms/:id/join` | Вступает в комнату по ID. |
| `POST /rooms/quick-join` | Находит первую подходящую свободную комнату и вступает. |
| `POST /rooms/:id/leave` | Покидает комнату (только до старта матча). |
| `DELETE /rooms/:id` | Удаляет комнату (только создатель, только в статусе WAITING). |

### `rooms/rooms.service.ts`

| Метод | Описание |
|---|---|
| `getRooms(query)` | Выбирает комнаты из БД с фильтрами по `difficulty` и `status`. |
| `getRoomById(roomId)` | Получает комнату с участниками и создателем; бросает `NotFoundException` если не найдена. |
| `createRoom(userId, dto)` | Генерирует уникальный код, создаёт комнату, добавляет создателя как участника. |
| `joinRoom(userId, roomId)` | В транзакции: добавляет участника, при достижении 2 участников переводит комнату в `IN_GAME`. |
| `quickJoin(userId, difficulty?)` | Находит первую комнату в статусе WAITING, не созданную текущим пользователем, и вступает. |
| `leaveRoom(userId, roomId)` | Удаляет участника; если участников не осталось — удаляет саму комнату. |
| `deleteRoom(userId, roomId)` | Удаляет комнату; проверяет права (только создатель) и статус (только WAITING). |
| `generateUniqueRoomCode()` | Приватный: генерирует случайный 6-символьный код (base36), гарантирует уникальность через запрос к БД. |

### `rooms/rooms.module.ts`

Регистрирует `RoomsService` и `RoomsController`, импортирует `PrismaModule`.

### `rooms/dto/`

- `create-room.dto.ts` — DTO создания комнаты (`difficulty`).
- `rooms-query.dto.ts` — DTO запроса списка комнат (`difficulty?`, `status?`).

---

## Модуль `game`

Игровая логика в реальном времени через WebSocket (Socket.IO).

### `game/game.gateway.ts`

WebSocket Gateway. Принимает подключения, аутентифицирует клиентов по access JWT из `handshake.auth.token`.

| Обработчик события | Описание |
|---|---|
| `handleConnection(client)` | При подключении верифицирует JWT, находит пользователя в БД, сохраняет в `client.user`. При отключении вызывает `handlePlayerDisconnect` и рассылает `game:finished`. |
| `game:join-room` | Добавляет клиента в Socket.IO-комнату, получает данные комнаты. Если 2 участника и статус `IN_GAME` — создаёт игру и рассылает `game:started`. |
| `game:get-state` | Возвращает текущее публичное состояние игры для клиента. |
| `game:flip-card` | Обрабатывает переворот карточки, рассылает `game:update`. При совпадении 2 карт — проверяет завершение игры. При несовпадении — через 1 сек закрывает карты и рассылает `CARDS_HIDDEN`. При окончании игры — рассылает `game:finished`. |

### `game/game.service.ts`

Хранит активные игры в памяти (`Map<roomId, GameState>`).

| Метод | Описание |
|---|---|
| `createGameForRoom(roomId)` | Создаёт состояние игры: получает участников из комнаты, генерирует перетасованную доску emoji по сложности, создаёт запись `Match` в БД. |
| `getGameState(roomId)` | Возвращает публичное состояние игры (без скрытых значений карточек). |
| `flipCard(roomId, userId, cardIndex)` | Основная логика хода: валидирует ход, открывает карту, проверяет совпадение, обновляет счёт, меняет ход. Возвращает тип результата (`FIRST_CARD_OPENED`, `MATCH_SUCCESS`, `MATCH_FAIL`, `GAME_FINISHED`). |
| `hideMismatchedCards(roomId)` | Закрывает 2 несовпавшие карты и очищает `openedCardIndexes`. |
| `handlePlayerDisconnect(roomId, disconnectedUserId)` | В транзакции: завершает матч в БД, проставляет результаты игрокам (`WIN`/`LOSE`), переводит комнату в `FINISHED`, удаляет игру из памяти. |
| `finishGame(roomId)` | Приватный: завершает игру при открытии всех пар. Определяет победителя по счёту, сохраняет результаты в БД. |
| `toPublicState(game)` | Приватный: формирует публичное представление доски (скрывает значения закрытых карт). |

### `game/game.module.ts`

Регистрирует `GameGateway`, `GameService`, `RoomsModule`, `JwtModule`, `PrismaModule`.

### `game/constants/emoji-sets.ts`

Словарь наборов эмодзи по сложности: `EASY` (8 пар), `MEDIUM` (10 пар), `HARD` (15 пар).

### `game/interfaces/game-state.interface.ts`

TypeScript-интерфейсы: `GameCard` (id, value, isMatched, isFaceUp), `GamePlayerState` (userId, login, displayName, score), `GameState` (полное состояние игры в памяти).

### `game/utils/shuffle.util.ts`

Утилита `shuffleArray<T>(array: T[]): T[]` — перемешивает массив алгоритмом Фишера–Йейтса.

---

## Модуль `prisma`

### `prisma/prisma.service.ts`

Синглтон-сервис `PrismaService extends PrismaClient`. Подключается к PostgreSQL при старте приложения, отключается при завершении. Используется во всех модулях через DI.

---

## Модуль `common`

### `common/decorators/current-user.decorator.ts`

Кастомный параметр-декоратор `@CurrentUser()`. Извлекает объект `request.user` (заполняется Passport-стратегиями) и передаёт в аргумент метода контроллера.

---

## FRONTEND

### `frontend/src/main.tsx`

Точка входа React-приложения. Рендерит `<App />` в `#root`, оборачивает в `AuthProvider` и `BrowserRouter`.

### `frontend/src/App.tsx`

Корневой компонент. Подключает `AppRouter` и глобальные стили.

### `frontend/src/App.css`

Глобальные CSS-переменные, сброс стилей, базовая типографика и layout-классы.

---

## `frontend/src/routes/`

### `AppRouter.tsx`

Описывает маршрутную карту приложения через React Router v6.

| Маршрут | Компонент | Доступ |
|---|---|---|
| `/login` | `LoginPage` | Публичный |
| `/register` | `RegisterPage` | Публичный |
| `/lobby` | `LobbyPage` | Только авторизованным |
| `/room/:roomId` | `RoomPage` | Только авторизованным |
| `/game/:roomId` | `GamePage` | Только авторизованным |
| `/profile` | `ProfilePage` | Только авторизованным |
| `*` | `NotFoundPage` | Любой |

---

## `frontend/src/context/`

### `AuthContext.tsx`

React Context для глобального управления сессией пользователя.

| Элемент | Описание |
|---|---|
| `AuthContext` | Контекст, хранящий `user`, `accessToken`, флаги `isLoading`/`isAuthenticated`. |
| `AuthProvider` | Провайдер: при монтировании вызывает `/api/auth/me` для восстановления сессии. |
| `useAuth()` | Хук для доступа к контексту из любого компонента. |
| `login(data)` | Сохраняет пользователя и accessToken в состоянии и `localStorage`. |
| `logout()` | Вызывает `/api/auth/logout`, очищает состояние и перенаправляет на `/login`. |

---

## `frontend/src/services/`

### `api.ts`

Базовый HTTP-клиент поверх `fetch`.

| Функция | Описание |
|---|---|
| `setAccessToken(token)` | Сохраняет access-токен в модульной переменной и `localStorage`. |
| `apiFetch<T>(endpoint, options)` | Универсальная функция запроса: добавляет заголовок `Authorization`, при 401 автоматически обновляет токен через `refreshAccessToken()` и повторяет запрос. |
| `refreshAccessToken()` | Вызывает `POST /api/auth/refresh` с cookie; при успехе обновляет `accessToken`. Де-дуплицирует параллельные вызовы через `refreshPromise`. |

### `auth.service.ts`

Обёртки для запросов к `/api/auth/*`.

| Функция | Описание |
|---|---|
| `login(dto)` | `POST /api/auth/login` |
| `register(dto)` | `POST /api/auth/register` |
| `logout()` | `POST /api/auth/logout` |
| `getMe()` | `GET /api/auth/me` |

### `rooms.service.ts`

Обёртки для запросов к `/api/rooms/*`.

| Функция | Описание |
|---|---|
| `getRooms(query?)` | Получает список комнат с опциональными фильтрами. |
| `createRoom(dto)` | Создаёт новую комнату. |
| `joinRoom(roomId)` | Вступает в комнату по ID. |
| `quickJoin(difficulty?)` | Быстрое вступление в случайную комнату. |
| `leaveRoom(roomId)` | Покидает комнату. |

### `profile.service.ts`

Обёртки для запросов к `/api/users/*`.

| Функция | Описание |
|---|---|
| `getProfileBundle()` | Получает профиль + статистику + историю матчей. |
| `updateProfile(dto)` | Обновляет `displayName`. |

### `socket.service.ts`

Singleton-сервис для работы с Socket.IO (WebSocket).

| Метод | Описание |
|---|---|
| `connect(token)` | Создаёт или переиспользует Socket.IO-соединение с access-токеном в auth. |
| `disconnect()` | Отключает сокет и удаляет все обработчики. |
| `getSocket()` | Возвращает текущий экземпляр сокета. |
| `joinGameRoom(roomId)` | Отправляет событие `game:join-room`. |
| `getGameState(roomId)` | Отправляет событие `game:get-state`. |
| `flipCard(roomId, cardIndex)` | Отправляет событие `game:flip-card`. |
| `onGameStarted(cb)` | Подписывается на событие `game:started`. |
| `onGameUpdate(cb)` | Подписывается на событие `game:update`. |
| `onGameFinished(cb)` | Подписывается на событие `game:finished`. |
| `onRoomUpdated(cb)` | Подписывается на событие `room:updated`. |
| `off*(cb)` | Методы-антиподы для отписки от каждого события. |

---

## `frontend/src/pages/`

### `LoginPage/LoginPage.tsx`

Страница входа. Форма с полями `login` и `password`. При успехе вызывает `authService.login()`, сохраняет токен через `useAuth().login()` и перенаправляет на `/lobby`.

### `RegisterPage/RegisterPage.tsx`

Страница регистрации. Форма с полями `login`, `email`, `displayName`, `password`. Аналогичная логика после успешной регистрации.

### `LobbyPage/LobbyPage.tsx`

Лобби (список комнат). Загружает комнаты через `roomsService.getRooms()`, отображает карточки комнат, позволяет создать комнату (модальная форма с выбором сложности), вступить в существующую или использовать быстрый поиск. Навигирует на `/room/:roomId` после входа.

### `RoomPage/RoomPage.tsx`

Страница ожидания. Показывает участников комнаты, подключается к WebSocket, слушает событие `room:updated`. При обновлении статуса комнаты на `IN_GAME` перенаправляет на `/game/:roomId`.

### `GamePage/GamePage.tsx`

Основная игровая страница. Подключается к WebSocket, слушает события `game:started`, `game:update`, `game:finished`. Рендерит игровую доску (сетку карточек), панель счёта обоих игроков, индикатор текущего хода. По клику на карточку вызывает `socketService.flipCard()`. При завершении игры показывает модальное окно с итогами.

### `ProfilePage/ProfilePage.tsx`

Страница профиля. Загружает `profileBundle` (профиль + статистика + история). Отображает winRate, количество побед/поражений/ничьих, таблицу истории матчей. Позволяет редактировать `displayName`.

### `NotFoundPage/NotFoundPage.tsx`

Страница 404. Отображается для несуществующих маршрутов.

---

## `frontend/src/components/`

Переиспользуемые UI-компоненты:

| Компонент | Описание |
|---|---|
| `Button/` | Универсальная кнопка с вариантами стилей (primary, secondary и т.д.) и состоянием загрузки. |
| `Input/` | Поле ввода с поддержкой label, сообщения об ошибке, иконок. |
| `Select/` | Выпадающий список. |
| `Header/` | Шапка приложения: логотип, навигация, кнопка выхода. |
| `GameCard/` | Карточка игровой доски: анимация переворота, состояния (скрыта / открыта / совпала). |
| `RoomCard/` | Карточка комнаты в лобби: сложность, статус, участники, кнопка входа. |
| `ProtectedRoute/` | HOC-обёртка для маршрутов: проверяет `isAuthenticated` из `useAuth()`; перенаправляет на `/login` если не авторизован. |

---

## `frontend/src/types/`

TypeScript-интерфейсы для данных, получаемых с бэкенда:

- `user.types.ts` — `User` (id, login, email, displayName)
- `room.types.ts` — `Room`, `RoomParticipant`
- `game.types.ts` — `GameState`, `GameCard`, `GameUpdatePayload`, `GameFinishedPayload`

---

## `frontend/src/styles/`

Глобальные SCSS/CSS-файлы: общие переменные, анимации, вспомогательные классы.

---

## Конфигурационные файлы

| Файл | Описание |
|---|---|
| `backend/.env` | Переменные окружения: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `BCRYPT_SALT_ROUNDS`. |
| `backend/nest-cli.json` | Конфигурация NestJS CLI (sourceRoot, compiler options). |
| `backend/tsconfig.json` | TypeScript-конфигурация бэкенда. |
| `frontend/.env` | Переменные фронтенда (например, `VITE_API_URL`). |
| `frontend/vite.config.ts` | Конфигурация Vite: плагин React, настройка proxy `/api → localhost:5000`. |
| `frontend/tsconfig.app.json` | TypeScript-конфигурация фронтенда. |

---

## Схема взаимодействия компонентов

```
Browser (React)
    │
    ├── HTTP REST (/api/*)
    │       └── AuthController  → AuthService → UsersService → Prisma → PostgreSQL
    │       └── UsersController → UsersService → Prisma
    │       └── RoomsController → RoomsService → Prisma
    │
    └── WebSocket (Socket.IO)
            └── GameGateway
                    ├── handleConnection  → JWT verify → UsersService
                    ├── game:join-room    → RoomsService + GameService
                    ├── game:flip-card    → GameService → Prisma (на завершении)
                    └── game:finished     → broadcast to room
```
