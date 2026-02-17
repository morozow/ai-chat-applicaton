# Chat Application

Real-time chat interface built with React and TypeScript.

## Features

- Send and receive messages
- Responsive design (desktop & mobile)
- Keyboard navigation support
- Editable display name
- Auto-scroll to new messages
- Load older messages

## Tech Stack

- React 18
- TypeScript (strict mode)
- Vite
- CSS Modules
- Vitest

## Getting Started

### Prerequisites

- Node.js 18+
- Chat API running at `http://localhost:3000`

### Installation

```bash
npm install
```

### Configuration

Create `.env.local` file:

```
VITE_API_BASE_URL=http://localhost:3000
VITE_API_TOKEN=your-bearer-token
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Testing

```bash
npm run test
```

### Linting

```bash
npm run lint
```

## API

The app communicates with a REST API:

- `GET /api/v1/messages` - Fetch messages
- `POST /api/v1/messages` - Send message

All endpoints require `Authorization: Bearer <token>` header.

## Project Structure

```
src/
├── api/          # API client
├── components/   # React components
├── hooks/        # Custom hooks
├── styles/       # Global styles
└── types/        # TypeScript types
```
