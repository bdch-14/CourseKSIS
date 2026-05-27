# Документация фронтенда — CourseKSIS

> React + TypeScript + Vite. SPA-приложение для игры «Найди пару» с аутентификацией, лобби, игровыми комнатами и WebSocket-игрой в реальном времени.

---

## Структура `frontend/src`

```
src/
├── main.tsx              # Точка входа React-приложения
├── App.tsx               # Корневой компонент
├── App.css               # Глобальные стили
│
├── context/
│   └── AuthContext.tsx   # Глобальное состояние авторизации
│
├── routes/
│   └── AppRouter.tsx     # Маршрутная карта приложения
│
├── pages/
│   ├── LoginPage/        # Страница входа
│   ├── RegisterPage/     # Страница регистрации
│   ├── LobbyPage/        # Лобби (список комнат)
│   ├── RoomPage/         # Ожидание соперника в комнате
│   ├── GamePage/         # Игровой экран
│   ├── ProfilePage/      # Профиль и статистика
│   └── NotFoundPage/     # 404
│
├── components/
│   ├── Button/           # Кнопка
│   ├── Input/            # Поле ввода
│   ├── Select/           # Выпадающий список
│   ├── Header/           # Шапка приложения
│   ├── GameCard/         # Карточка игровой доски
│   ├── RoomCard/         # Карточка комнаты в лобби
│   └── ProtectedRoute/   # HOC-защита маршрутов
│
├── services/
│   ├── api.ts            # Базовый HTTP-клиент (fetch + авто-рефреш)
│   ├── auth.service.ts   # Запросы к /api/auth/*
│   ├── rooms.service.ts  # Запросы к /api/rooms/*
│   ├── profile.service.ts# Запросы к /api/users/*
│   └── socket.service.ts # WebSocket-клиент (Socket.IO)
│
└── types/
    ├── auth.types.ts     # Типы аутентификации
    ├── room.types.ts     # Типы комнат
    ├── game.types.ts     # Типы игры
    ├── profile.types.ts  # Типы профиля и статистики
    └── shared.types.ts   # Общие перечисления (Difficulty, RoomStatus)
```

---

## Точки входа

### `main.tsx`

Монтирует React-приложение в `#root`. Оборачивает дерево в `<AuthProvider>` (глобальный контекст авторизации) и `<BrowserRouter>` (React Router).

### `App.tsx`

Корневой компонент. Рендерит `<AppRouter />` и подключает глобальные стили `App.css`.

### `App.css`

CSS-переменные, сброс стилей браузера и базовые layout-классы, используемые по всему приложению.

---

## `context/AuthContext.tsx`

Глобальное управление сессией пользователя через React Context.

### Интерфейс контекста `AuthContextValue`

| Поле / Метод | Тип | Описание |
|---|---|---|
| `user` | `User \| null` | Текущий авторизованный пользователь. |
| `accessToken` | `string \| null` | Актуальный access JWT. |
| `isAuthenticated` | `boolean` | `true` если есть и `user`, и `accessToken`. |
| `isLoading` | `boolean` | `true` пока идёт инициализация сессии при старте. |
| `login(payload)` | `Promise<void>` | Вызывает `AuthService.login`, сохраняет сессию. |
| `register(payload)` | `Promise<void>` | Вызывает `AuthService.register`, сохраняет сессию. |
| `logout()` | `Promise<void>` | Вызывает `AuthService.logout`, очищает состояние. |

### Провайдер `AuthProvider`

При монтировании (`useEffect`) восстанавливает сессию:
1. Если в `localStorage` есть `find_pair_access_token` → вызывает `GET /api/auth/me`.
2. Иначе → пробует `POST /api/auth/refresh` по httpOnly-cookie.
3. При неудаче → сессия очищается, `isLoading = false`.

Все методы (`login`, `register`, `logout`) мемоизированы через `useCallback`. Объект контекста мемоизирован через `useMemo`.

### Хук `useAuthContext()`

Возвращает объект контекста. Бросает ошибку, если вызван вне `<AuthProvider>`.

### Вспомогательная функция `applySession(user, token)`

Приватная (`useCallback`): одновременно обновляет `user`, `accessTokenState` и вызывает `setAccessToken()` из `api.ts` для синхронизации HTTP-клиента.

---

## `routes/AppRouter.tsx`

Описывает маршрутную карту приложения. Рендерит `<Header />` над всеми страницами.

### Маршруты

| Путь | Компонент | Обёртка | Описание |
|---|---|---|---|
| `/` | — | — | Редирект на `/lobby`. |
| `/login` | `LoginPage` | `PublicOnlyRoute` | Доступна только неавторизованным. |
| `/register` | `RegisterPage` | `PublicOnlyRoute` | Доступна только неавторизованным. |
| `/lobby` | `LobbyPage` | `ProtectedRoute` | Требует авторизации. |
| `/rooms/:id` | `RoomPage` | `ProtectedRoute` | Требует авторизации. |
| `/game/:id` | `GamePage` | `ProtectedRoute` | Требует авторизации. |
| `/profile` | `ProfilePage` | `ProtectedRoute` | Требует авторизации. |
| `*` | `NotFoundPage` | — | Любой несуществующий маршрут. |

### Компонент `PublicOnlyRoute`

Проверяет `isAuthenticated` из контекста. Если пользователь уже авторизован — редиректит на `/lobby`. Пока идёт `isLoading` — показывает «Загрузка...».

---

## Страницы (`pages/`)

### `LoginPage/LoginPage.tsx`

Форма входа.

| Элемент | Описание |
|---|---|
| Состояние | `login`, `password` (строки), `error`, `isLoading`. |
| Отправка формы | Вызывает `useAuthContext().login()`. При успехе — `navigate('/lobby')`. |
| Навигация | Ссылка на `/register`. |

---

### `RegisterPage/RegisterPage.tsx`

Форма регистрации.

| Элемент | Описание |
|---|---|
| Состояние | `login`, `email`, `displayName`, `password`, `error`, `isLoading`. |
| Отправка формы | Вызывает `useAuthContext().register()`. При успехе — `navigate('/lobby')`. |
| Навигация | Ссылка на `/login`. |

---

### `LobbyPage/LobbyPage.tsx`

Главная страница лобби со списком комнат.

| Функция | Описание |
|---|---|
| `loadRooms()` | Загружает комнаты в статусе `WAITING` через `RoomsService.getRooms()`. |
| `handleCreateRoom()` | Создаёт комнату с выбранной сложностью, навигирует на `/rooms/:id`. |
| `handleQuickJoin()` | Вызывает `RoomsService.quickJoin(difficulty)`, навигирует на `/rooms/:id`. |
| `handleJoinRoom(roomId)` | Вступает в конкретную комнату, навигирует на `/rooms/:id`. |

**Состояние:** `rooms[]`, `difficulty` (выбранная сложность), `isLoading`, `isCreating`, `isQuickJoining`, `joiningRoomId`, `error`.

**UI:** селект сложности, кнопки «Создать комнату» / «Быстрая игра» / «Обновить список», сетка `<RoomCard />`.

---

### `RoomPage/RoomPage.tsx`

Страница ожидания второго игрока в комнате.

| Функция | Описание |
|---|---|
| `loadRoom()` | Загружает данные комнаты по `id` из параметров URL через `RoomsService.getRoom(id)`. |
| `handleJoin()` | Вступает в комнату (если не участник). |
| `handleLeave()` | Покидает комнату (для не-создателей), навигирует в `/lobby`. |
| `handleDelete()` | Удаляет комнату (только создатель), навигирует в `/lobby`. |
| `handleRefresh()` | Перезагружает данные комнаты. |

**WebSocket:** подключается к сокету, отправляет `game:join-room`. Слушает `room:updated` → обновляет состояние комнаты. Слушает `game:started` → навигирует на `/game/:id`. Если `room.status === 'IN_GAME'` — немедленный редирект через `useEffect`.

**Вычисляемые флаги (useMemo):**
- `isCreator` — пользователь является создателем комнаты.
- `isParticipant` — пользователь уже в комнате.
- `canJoin` — комната доступна для входа (WAITING, < 2 участников, не участник).

---

### `GamePage/GamePage.tsx`

Основной игровой экран.

| Функция | Описание |
|---|---|
| `handleCardClick(cardIndex)` | Валидирует клик (мой ход, карта доступна, < 2 открытых) → `socketService.flipCard(id, cardIndex)`. |
| `handleGameFinished(payload)` | Определяет результат (`WIN` / `LOSE` / `DRAW` / отключение) и открывает модальное окно с итогом. |
| `handleBackToLobby()` | Закрывает модал, навигирует на `/lobby`. |

**WebSocket** (`useEffect` при монтировании):
- Подключается к сокету, вступает в комнату `game:join-room`.
- `game:started` → устанавливает `gameState`.
- `game:update` → обновляет `gameState` + информационное сообщение по типу: `FIRST_CARD_OPENED`, `MATCH_SUCCESS`, `MATCH_FAIL`, `CARDS_HIDDEN`, `GAME_FINISHED`.
- `game:finished` → вызывает `handleGameFinished`.
- При размонтировании: отписывается от всех событий, вызывает `socketService.disconnect()`.

**Вычисляемые значения (useMemo):**
- `currentPlayer` — объект текущего пользователя в массиве игроков.
- `isMyTurn` — `gameState.currentTurnUserId === user.id`.

**UI:** панель статуса соединения, блок игроков с очками и индикатором хода, игровая доска (сетка `<GameCard />`). Ширина сетки: 4 столбца (EASY) / 5 (MEDIUM) / 6 (HARD). Модальное окно результата с цветовым акцентом (зелёный — победа, красный — поражение, серый — ничья).

---

### `ProfilePage/ProfilePage.tsx`

Страница профиля игрока.

| Функция | Описание |
|---|---|
| `loadProfile()` (`useEffect`) | Загружает данные через `ProfileService.getMyProfile()`, инициализирует `displayName`. |
| `handleStartEditName()` | Включает режим редактирования имени. |
| `handleCancelEditName()` | Отменяет редактирование, восстанавливает исходное имя. |
| `handleSaveName(e)` | Валидирует имя (не пустое, ≥ 2 символов), вызывает `ProfileService.updateMyProfile()`, обновляет локальное состояние. |

**Вспомогательный компонент `StatCard`:** карточка с числовым показателем (label + value). Используется для: «Всего игр», «Побед», «Поражений», «Ничьих», «Winrate».

**UI:** форма редактирования displayName (inline: поле ввода + кнопки Подтвердить/Отмена), блок статистики (5 StatCard), таблица истории матчей (дата, соперник, сложность, счёт, результат, длительность).

---

### `NotFoundPage/NotFoundPage.tsx`

Страница-заглушка для несуществующих маршрутов (404). Выводит сообщение и ссылку на `/lobby`.

---

## Компоненты (`components/`)

### `Button/Button.tsx`

Базовая кнопка.

| Props | Тип | Описание |
|---|---|---|
| `children` | `ReactNode` | Содержимое кнопки. |
| `disabled` | `boolean` | При `true` фон становится серым (`#9ca3af`), иначе синим (`#2563eb`). |
| `...props` | `ButtonHTMLAttributes` | Все стандартные атрибуты `<button>` (onClick, type и т.д.). |

---

### `Input/Input.tsx`

Поле ввода с label, поддержкой сообщения об ошибке и всеми стандартными атрибутами `<input>`.

---

### `Select/Select.tsx`

Обёртка над `<select>` с label. Принимает `children` (элементы `<option>`) и стандартные атрибуты `<select>`.

---

### `Header/Header.tsx`

Шапка приложения. Отображается на всех страницах через `AppRouter`.

| Элемент | Описание |
|---|---|
| Логотип / название | Ссылка на `/lobby`. |
| Ссылка «Профиль» | Видна только авторизованным (`isAuthenticated`). |
| Кнопка «Выйти» | Вызывает `useAuthContext().logout()`. Видна только авторизованным. |
| Ссылки «Войти» / «Зарегистрироваться» | Видны только неавторизованным. |

---

### `GameCard/GameCard.tsx`

Карточка на игровой доске.

| Props | Тип | Описание |
|---|---|---|
| `card` | `GameCard` | Объект карточки (id, value, isMatched, isFaceUp). |
| `index` | `number` | Индекс карточки в массиве `board`. |
| `disabled` | `boolean` | Блокирует клик (не мой ход / уже открыта / уже совпала). |
| `onClick(index)` | `function` | Коллбек при клике, передаёт индекс. |

**Визуальные состояния:**

| Состояние | Фон | Рамка | Контент |
|---|---|---|---|
| Закрыта | `#3b82f6` (синий) | `#2563eb` | `?` |
| Открыта (перевёрнута) | `#ffffff` | `#e5e7eb` | emoji |
| Совпала | `#ecfdf5` (зелёный) | `#86efac` | emoji |

Анимация переворота: CSS `transform: rotateY(180deg)` при `isFaceUp || isMatched`.

---

### `RoomCard/RoomCard.tsx`

Карточка комнаты в лобби.

| Props | Описание |
|---|---|
| `room` | Объект комнаты (id, code, difficulty, status, createdBy, participants). |
| `onJoin(roomId)` | Коллбек при нажатии «Войти». |
| `isJoining` | Флаг состояния загрузки кнопки. |

Отображает: код комнаты, сложность, создателя, количество участников (X/2), кнопку «Войти».

---

### `ProtectedRoute/ProtectedRoute.tsx`

HOC-обёртка для защищённых маршрутов.

- Если `isLoading === true` → показывает «Загрузка...».
- Если `isAuthenticated === false` → `<Navigate to="/login" replace />`.
- Иначе → рендерит `children`.

---

## Сервисы (`services/`)

### `api.ts`

Базовый HTTP-клиент для всех REST-запросов.

| Функция | Описание |
|---|---|
| `setAccessToken(token)` | Сохраняет токен в модульную переменную и `localStorage` под ключом `find_pair_access_token`. При `null` — удаляет. |
| `apiFetch<T>(endpoint, options)` | Универсальная функция запроса. Добавляет `Authorization: Bearer <token>` если `auth: true`. При HTTP 401 автоматически вызывает `refreshAccessToken()` и повторяет запрос с флагом `_retry: true`. При повторной ошибке бросает исключение «Сессия истекла». |
| `refreshAccessToken()` | `POST /api/auth/refresh` с `credentials: include`. Дедуплицирует параллельные вызовы через `refreshPromise` (одиночная переменная, обнуляется через `.finally()`). При успехе вызывает `setAccessToken()`. |
| `buildHeaders(auth, headers)` | Приватная: собирает заголовки запроса, добавляет `Content-Type: application/json` и опциональный `Authorization`. |

---

### `auth.service.ts`

HTTP-обёртки для `/api/auth/*`.

| Метод | HTTP | Описание |
|---|---|---|
| `AuthService.register(payload)` | `POST /auth/register` | Регистрация. Возвращает `AuthResponse` (`user` + `accessToken`). |
| `AuthService.login(payload)` | `POST /auth/login` | Вход. Возвращает `AuthResponse`. |
| `AuthService.refresh()` | `POST /auth/refresh` | Обновление токена по cookie. Возвращает `AuthResponse`. |
| `AuthService.getMe()` | `GET /auth/me` | Данные текущего пользователя. Требует `auth: true`. |
| `AuthService.logout()` | `POST /auth/logout` | Выход. Возвращает `{ message: string }`. |

---

### `rooms.service.ts`

HTTP-обёртки для `/api/rooms/*`. Все методы требуют `auth: true`.

| Метод | HTTP | Описание |
|---|---|---|
| `RoomsService.getRooms(query?)` | `GET /rooms?...` | Список комнат с фильтрами `difficulty` и `status`. |
| `RoomsService.getRoom(id)` | `GET /rooms/:id` | Данные одной комнаты. |
| `RoomsService.createRoom(difficulty)` | `POST /rooms` | Создать комнату с указанной сложностью. |
| `RoomsService.quickJoin(difficulty?)` | `POST /rooms/quick-join` | Быстрое вступление. |
| `RoomsService.joinRoom(id)` | `POST /rooms/:id/join` | Вступить в комнату. |
| `RoomsService.leaveRoom(id)` | `DELETE /rooms/:id/leave` | Покинуть комнату. |
| `RoomsService.deleteRoom(id)` | `DELETE /rooms/:id` | Удалить комнату (только создатель). |

---

### `profile.service.ts`

HTTP-обёртки для `/api/users/*`. Все методы требуют `auth: true`.

| Метод | Описание |
|---|---|
| `ProfileService.getMyProfile()` | Параллельно (`Promise.all`) запрашивает `GET /users/me`, `GET /users/me/stats`, `GET /users/me/matches`, считает `winRate`, собирает `UserProfileResponse`. |
| `ProfileService.updateMyProfile(payload)` | `PATCH /users/me` — обновляет `displayName`. |

---

### `socket.service.ts`

Singleton-класс `SocketService` для управления WebSocket-соединением (Socket.IO).

| Метод | Описание |
|---|---|
| `connect(token)` | Создаёт Socket.IO-соединение с `auth: { token }`. Если сокет уже существует — обновляет токен и переподключает при необходимости. |
| `disconnect()` | Удаляет все слушатели, отключает сокет, обнуляет `this.socket`. |
| `getSocket()` | Возвращает текущий инстанс `Socket`. |
| `joinGameRoom(roomId)` | Emit `game:join-room` → `{ roomId }`. |
| `getGameState(roomId)` | Emit `game:get-state` → `{ roomId }`. |
| `flipCard(roomId, cardIndex)` | Emit `game:flip-card` → `{ roomId, cardIndex }`. |
| `onGameStarted(cb)` | Подписка на `game:started` (получение `GameState`). |
| `onGameUpdate(cb)` | Подписка на `game:update` (получение `GameUpdatePayload`). |
| `onGameFinished(cb)` | Подписка на `game:finished` (получение `GameFinishedPayload`). |
| `onRoomUpdated(cb)` | Подписка на `room:updated` (получение `Room`). |
| `onConnect(cb)` | Подписка на событие установки соединения. |
| `onDisconnect(cb)` | Подписка на событие разрыва соединения. |
| `onConnectError(cb)` | Подписка на ошибку подключения. |
| `off*(cb)` | Методы отписки для каждого события (`offGameStarted`, `offGameUpdate`, `offGameFinished`, `offRoomUpdated`, `offConnect`, `offDisconnect`, `offConnectError`). |

Экспортируется как глобальный singleton: `export const socketService = new SocketService()`.

---

## Типы (`types/`)

### `auth.types.ts`

| Интерфейс | Поля | Описание |
|---|---|---|
| `User` | id, login, email, displayName, createdAt, updatedAt | Объект пользователя. |
| `AuthResponse` | user: User, accessToken: string | Ответ на login/register/refresh. |
| `LoginPayload` | login, password | Тело запроса входа. |
| `RegisterPayload` | login, email, displayName, password | Тело запроса регистрации. |

### `room.types.ts`

| Интерфейс | Поля | Описание |
|---|---|---|
| `RoomParticipantUser` | id, login, displayName | Краткий профиль участника. |
| `RoomParticipant` | user: RoomParticipantUser | Обёртка участника в комнате. |
| `Room` | id, code, difficulty, status, createdAt, createdBy, participants[] | Объект комнаты. |

### `game.types.ts`

| Интерфейс | Поля | Описание |
|---|---|---|
| `GameCard` | id, value (null если закрыта), isMatched, isFaceUp | Одна карточка на доске. |
| `GamePlayer` | userId, login, displayName, score | Игрок в текущей игре. |
| `GameState` | roomId, difficulty, startedAt, currentTurnUserId, status, players[], openedCardIndexes[], board[] | Полное состояние игры. |
| `GameUpdatePayload` | type, state: GameState, openedIndexes? | Обновление игры по событию. Тип: `FIRST_CARD_OPENED` / `MATCH_SUCCESS` / `MATCH_FAIL` / `CARDS_HIDDEN` / `GAME_FINISHED`. |
| `GameFinishedPayload` | roomId, winnerUserId (null = ничья), disconnectedUserId, reason | Финальное событие игры. |

### `profile.types.ts`

| Интерфейс | Поля | Описание |
|---|---|---|
| `ProfileUser` | id, login, email, displayName, createdAt, updatedAt | Профиль пользователя. |
| `ProfileStats` | totalGames, wins, losses, draws | Игровая статистика. |
| `MatchHistoryItem` | matchId, date, difficulty, score, opponentScore, opponent, winner, durationSeconds, result | Запись из истории матчей. |
| `UserProfileResponse` | user, stats (+ winRate), history[] | Агрегированный ответ профиля. |

### `shared.types.ts`

```ts
type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
type RoomStatus = 'WAITING' | 'IN_GAME' | 'FINISHED';
```

---

## Конфигурация

### `vite.config.ts`

Vite-конфигурация с плагином `@vitejs/plugin-react`. Настраивает dev-proxy: все запросы `/api/*` проксируются на `http://localhost:5000` — это позволяет избежать CORS при разработке.

### `tsconfig.app.json`

TypeScript-конфигурация для исходного кода: `target: ES2020`, `strict: true`, поддержка JSX (`react-jsx`).

### `tsconfig.node.json`

TypeScript-конфигурация для Vite-конфига (`vite.config.ts`).

### `.env`

Переменные окружения Vite (`VITE_*`). Пример: `VITE_API_URL` для базового URL API.

---

## Поток данных (упрощённая схема)

```
Пользователь
    │
    ▼
AuthProvider (AuthContext)
    │ isAuthenticated, user, login(), logout()
    ▼
AppRouter
    ├── ProtectedRoute / PublicOnlyRoute
    │
    ├── LoginPage / RegisterPage
    │       └── AuthService → apiFetch → POST /api/auth/*
    │
    ├── LobbyPage
    │       └── RoomsService → apiFetch → GET/POST /api/rooms/*
    │
    ├── RoomPage
    │       ├── RoomsService → apiFetch → GET /api/rooms/:id
    │       └── socketService.connect() → WebSocket
    │               room:updated → setRoom()
    │               game:started → navigate('/game/:id')
    │
    ├── GamePage
    │       └── socketService.connect() → WebSocket
    │               game:started  → setGameState()
    │               game:update   → setGameState() + setMessage()
    │               game:finished → handleGameFinished() → modal
    │               [клик] → socketService.flipCard()
    │
    └── ProfilePage
            └── ProfileService → apiFetch × 3 → Promise.all
```
