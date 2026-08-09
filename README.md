# MNGChat

A modern AI chat web application built with React 19 and Vite, featuring multi-session conversations, model switching, image uploads, and an admin usage dashboard.

## Backend

The backend is built with Spring Boot and provides RESTful APIs.

**Backend Repository:** https://github.com/MNGChen/MNGChat_Backend.git

## Features

- **User Authentication** — Login and registration with email/password, token-based auth stored in localStorage
- **AI Chat Interface** — Real-time conversation with AI models
  - Multi-session support with chat history
  - Switch between available models (e.g., GPT-5.4, GPT-5.4-mini)
  - Image upload and preview within conversations
  - Rename and delete chat sessions
  - Responsive sidebar with recent history
- **Admin Dashboard** — Account usage monitoring for administrators
  - Overview of total accounts, requests, and token consumption
  - Per-account breakdown with session count and last active time
  - Detailed model usage statistics per user
- **SPA Routing** — Client-side routing with React Router

## Tech Stack

| Category       | Technology                  | Version  |
|----------------|-----------------------------|----------|
| Framework      | React                       | 19.2     |
| Build Tool     | Vite                        | 7.2      |
| Routing        | React Router DOM            | 7.13     |
| UI Framework   | Bootstrap + React Bootstrap | 5.3 / 2.10 |
| Icons          | React Icons                 | 5.5      |
| PDF Support    | react-pdf                   | 10.3     |
| Linting        | ESLint                      | 9.39     |

## Project Structure

```
MNGChat/
├── public/                  # Static assets
├── src/
│   ├── component/
│   │   ├── ChatTool.jsx     # Main chat interface
│   │   ├── ChatTool.css
│   │   ├── ChatAdmin.jsx    # Admin usage dashboard
│   │   ├── ChatAdmin.css
│   │   ├── Login.jsx        # Login / registration page
│   │   └── Login.css
│   ├── App.jsx              # Root component with route definitions
│   ├── App.css
│   ├── main.jsx             # Application entry point
│   └── index.css
├── .env.development         # Dev environment variables
├── .env.production          # Prod environment variables
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── vercel.json              # Vercel deployment config (SPA rewrites)
└── vite.config.js
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A running MNGChat backend server (or compatible API)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd MNGChat
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:

   Create a `.env` file or modify the existing `.env.development` / `.env.production` files:

   ```env
   VITE_API_BASE_URL=http://localhost:8080
   ```

   | Variable            | Description                      |
   |---------------------|----------------------------------|
   | `VITE_API_BASE_URL` | Base URL of the backend API server |

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173` by default.

### Build

Build for production:

```bash
npm run build
```

The optimized production build will be output to the `dist/` directory.

### Preview

Preview the production build locally:

```bash
npm run preview
```

### Lint

Run ESLint to check code quality:

```bash
npm run lint
```

## API Endpoints

The frontend expects the following backend API endpoints:

### Authentication

| Method | Endpoint      | Description          |
|--------|---------------|----------------------|
| POST   | `/login`      | User login           |
| POST   | `/register`   | User registration    |

### Chat

| Method | Endpoint                          | Description                    |
|--------|-----------------------------------|--------------------------------|
| POST   | `/chat`                          | Send a chat message            |
| GET    | `/chat/models`                   | List available models          |
| POST   | `/chat/session`                  | Create a new chat session      |
| GET    | `/chat/sessions`                 | List all user sessions         |
| GET    | `/chat/history?sessionId=`       | Get session message history    |
| PATCH  | `/chat/session/:id/title`        | Rename a session               |
| DELETE | `/chat/session/:id`              | Delete a session               |
| POST   | `/chat/session/:id/image`        | Upload an image to a session   |

### Admin

| Method | Endpoint               | Description                    |
|--------|------------------------|--------------------------------|
| GET    | `/chat/admin/usage`    | Get account usage statistics   |

All authenticated endpoints require a `Bearer` token in the `Authorization` header.

## Deployment

### Vercel

This project is pre-configured for Vercel deployment with `vercel.json` handling SPA routing rewrites.

1. Push the repository to GitHub/GitLab/Bitbucket
2. Import the project in Vercel
3. Set the `VITE_API_BASE_URL` environment variable in Vercel project settings
4. Deploy

### Static Hosting

Build the project and serve the `dist/` folder with any static web server (Nginx, Apache, etc.). Make sure to configure fallback routing to `index.html` for SPA support.

## Pages & Routes

| Path           | Component      | Description              |
|----------------|----------------|--------------------------|
| `/`            | `MNGLogin`     | Login page (default)     |
| `/login`       | `MNGLogin`     | Login / registration     |
| `/chat`        | `MNGChatTool`  | Main chat interface      |
| `/chat_admin`  | `MNGChatAdmin` | Admin usage dashboard    |

## License

Private
