# Real-Time Chat Application

A real-time chat application built with **React**, **Node.js**, **Socket.io**, and **MongoDB**. Features instant messaging, username-based login, typing indicators, online/offline status, and message read/delivered receipts.

## Features

- Real-time messaging via Socket.io
- Persistent chat history with MongoDB
- Username-based login (dummy authentication — no password required)
- Typing indicators
- Online/offline user status
- Message read/delivered status (pending → sent → delivered → seen)
- Group chat support
- Private one-on-one chat
- Paginated chat history with "load older" support
- Duplicate message prevention via client-side ID
- Auto-scroll with "New messages" indicator
- Responsive design (Tailwind CSS)

## Technology Stack

| Layer       | Technology                                    |
| ----------- | --------------------------------------------- |
| Frontend    | React 18, Vite, Tailwind CSS                  |
| Backend     | Node.js, Express                              |
| Real-Time   | Socket.io (server & client)                   |
| Database    | MongoDB with Mongoose ODM                     |
| Testing     | Jest, Supertest, mongodb-memory-server        |
| Security    | Helmet, CORS, express-rate-limit, validator   |

## Project Structure

```
real-time-chat-app/
├── backend/
│   ├── src/
│   │   ├── config/          # Database connection, env config
│   │   ├── controllers/     # Route handlers (health, message, user, group)
│   │   ├── middleware/       # Error handler, input validation
│   │   ├── models/          # Mongoose schemas (Message, User, Group)
│   │   ├── routes/          # Express route definitions
│   │   ├── services/        # Business logic (messageService)
│   │   ├── sockets/         # Socket.io connection handler
│   │   ├── utils/           # Constants, API response helpers
│   │   ├── app.js           # Express app setup
│   │   └── server.js        # Entry point
│   ├── tests/               # Jest test suites
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components (ChatArea, Sidebar, MessageBubble, etc.)
│   │   ├── constants/       # Socket events, API config
│   │   ├── context/         # AuthContext, SocketContext, ChatContext
│   │   ├── hooks/           # Custom hooks (useAuth, useSocket, useMessages, etc.)
│   │   ├── pages/           # LoginPage, ChatPage
│   │   ├── services/        # API client, Socket.io client
│   │   ├── App.jsx          # Root app with auth routing
│   │   ├── main.jsx         # Entry point
│   │   └── index.css        # Tailwind imports
│   ├── .env.example
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
├── .gitignore
├── package.json             # Root scripts (dev, test, build)
└── README.md
```

## Prerequisites

- **Node.js** >= 18
- **npm** >= 9
- **MongoDB** (local or Atlas)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd real-time-chat-app
npm install
npm run install:all
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your settings:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/realtime-chat
CLIENT_URL=http://localhost:5173
SOCKET_CORS_ORIGIN=http://localhost:5173
MESSAGE_MAX_LENGTH=1000
USERNAME_MAX_LENGTH=50
```

**MongoDB Local:** Install MongoDB Community, start the service, and the default URI will work.

**MongoDB Atlas:** Create a free cluster, get your connection string, and replace `MONGODB_URI`.

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env
```

The defaults point to `localhost:5000` and work with the local backend.

### 4. Run the Backend

```bash
cd backend
npm run dev
```

The server starts on `http://localhost:5000` with nodemon for auto-restarts.

### 5. Run the Frontend

Open a **separate terminal**:

```bash
cd frontend
npm run dev
```

The frontend starts on `http://localhost:5173`.

### Run Both Together

```bash
npm run dev
```

This uses `concurrently` to run both backend and frontend.

### Production Build

```bash
npm run build           # Builds frontend to frontend/dist/
cd backend
npm start               # Serves API and static frontend
```

## Environment Variables

### Backend (`backend/.env`)

| Variable              | Default                                      | Description                     |
| --------------------- | -------------------------------------------- | ------------------------------- |
| `PORT`                | `5000`                                       | Server port                     |
| `NODE_ENV`            | `development`                                | Environment mode                |
| `MONGODB_URI`         | `mongodb://127.0.0.1:27017/realtime-chat`    | MongoDB connection string       |
| `CLIENT_URL`          | `http://localhost:5173`                      | CORS allowed origin             |
| `SOCKET_CORS_ORIGIN`  | `http://localhost:5173`                      | Socket.io CORS origin           |
| `MESSAGE_MAX_LENGTH`  | `1000`                                       | Max characters per message      |
| `USERNAME_MAX_LENGTH` | `50`                                         | Max characters per username     |

### Frontend (`frontend/.env`)

| Variable           | Default                      | Description                |
| ------------------ | ---------------------------- | -------------------------- |
| `VITE_API_URL`     | `http://localhost:5000/api`  | Backend REST API URL       |
| `VITE_SOCKET_URL`  | `http://localhost:5000`      | Socket.io server URL       |

## REST API

| Method | Endpoint                         | Description                          |
| ------ | -------------------------------- | ------------------------------------ |
| GET    | `/api/health`                    | Health check (server + DB status)    |
| POST   | `/api/users/register`            | Register/login a username            |
| GET    | `/api/users/search?q=`           | Search users by prefix               |
| GET    | `/api/messages?page=&limit=&recipient=&groupId=` | Fetch messages with pagination |
| POST   | `/api/messages`                  | Send a message (also broadcasts via Socket.io) |
| GET    | `/api/messages/conversations?username=` | Get private conversations      |
| POST   | `/api/groups`                    | Create a group                       |
| GET    | `/api/groups?username=`          | List user's groups                   |
| GET    | `/api/groups/:id`                | Get group details                    |
| POST   | `/api/groups/:id/members`        | Add member to group                  |
| DELETE | `/api/groups/:id/members/:username` | Remove member from group          |

## Socket.io Events

### Client → Server

| Event               | Payload                                           | Description                  |
| ------------------- | ------------------------------------------------- | ---------------------------- |
| `message:send`      | `{ content, recipient?, groupId?, clientId }`     | Send a message               |
| `messages:delivered`| `{ messageId }`                                   | Mark message as delivered    |
| `messages:seen`     | `{ conversationId, groupId?, recipient? }`         | Mark conversation as seen    |
| `typing_start`      | `{ recipient?, groupId? }`                        | User started typing          |
| `typing_stop`       | `{ recipient?, groupId? }`                        | User stopped typing          |

### Server → Client

| Event               | Payload                                  | Description                     |
| ------------------- | ---------------------------------------- | ------------------------------- |
| `message:new`       | `message` object                         | New message broadcast           |
| `message:status`    | `message` object                         | Message status updated          |
| `online_users`      | `string[]`                               | List of online usernames        |
| `user_offline`      | `string` (username)                      | User went offline               |
| `typing_start`      | `{ username, recipient?, groupId? }`     | User started typing             |
| `typing_stop`       | `{ username, recipient?, groupId? }`     | User stopped typing             |
| `unread_counts`     | `{ [conversationId]: number }`           | Initial unread counts           |
| `unread_updated`    | `{ [conversationId]: number }`           | Unread counts updated           |
| `group_created`     | `group` object                           | New group created               |
| `group_member_added`| `{ groupId, groupName, username, members }` | Member added to group       |

## Design Decisions

- **Socket.io for messaging, REST for history:** New messages flow through Socket.io for instant delivery. Chat history loads via REST with pagination for efficient scrolling through large datasets.

- **Username-based authentication:** No passwords, no JWT. The username is sent as Socket.io handshake auth and validated server-side. Simplicity over security — this is a chat demo, not a banking app.

- **Message status lifecycle:** Messages start as `sent`, transition to `delivered` when the recipient's client acknowledges receipt, and `seen` when the recipient views the conversation. The frontend tracks status and renders appropriate indicators.

- **Client-side ID for deduplication:** Each message carries a `clientId` generated on the frontend. MongoDB's unique sparse index on `clientId` prevents duplicate saves when the network is flaky and users retry.

- **In-memory presence tracking:** Online users are tracked in a `Map<string, Set<string>>` (username → socket IDs). No database writes for presence — avoids unnecessary load and keeps online/offline transitions instant.

- **Modular backend architecture:** Controllers handle HTTP, services contain business logic, models define schemas. Sockets have their own handler layer. This keeps concerns separated and testable.

- **React Context for state:** Auth, socket, and chat state are managed via React Context (no Redux needed for this scale). Custom hooks encapsulate context consumption and provide clean APIs to components.

## Assumptions Made

- **Single-instance deployment:** The in-memory `userSockets` map and `unreadCounts` object assume a single server process. Horizontal scaling would need Redis or a shared store.

- **Usernames are unique and lowercase:** Usernames are stored as lowercase in MongoDB with a unique index. The fronten converts to lowercase before sending. No two users can share the same username.

- **Messages are text-only:** No file uploads, images, or rich media. All content is plain text, sanitized, and truncated to `MESSAGE_MAX_LENGTH`.

- **At-least-once delivery:** Socket.io provides at-least-once delivery guarantees. The `clientId` deduplication ensures messages aren't duplicated even if retried.

- **Browser localStorage for persistence:** The username is stored in `localStorage`. Clearing browser storage or using incognito mode will require re-entering the username.

- **Users exist on first message:** Sending a message auto-registers the username. There's no sign-up flow.

## Development Commands

| Command               | Description                         |
| --------------------- | ----------------------------------- |
| `npm run dev`         | Start both backend and frontend     |
| `npm run dev:backend` | Start backend with nodemon          |
| `npm run dev:frontend`| Start frontend with Vite            |
| `npm run build`       | Build frontend for production       |
| `npm test`            | Run all tests                       |
| `npm run test:backend`| Run backend tests                   |

## Testing

Tests use `mongodb-memory-server` — no external MongoDB needed.

```bash
cd backend
npm test
```

Covers: health check, message CRUD, validation, pagination, duplicate detection.

## Security

- **Helmet** for HTTP headers
- **CORS** restricted to `CLIENT_URL`
- **Rate limiting** — 200 requests/15min general, 30 messages/min
- **Input sanitization** — control characters stripped, lengths enforced
- **No HTML rendering** — messages rendered as text to prevent XSS
- **Body size limit** — 1mb max


