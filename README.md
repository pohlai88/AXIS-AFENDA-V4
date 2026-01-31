AFENDA — Next.js App Router project (App Shell).

## Quick Links

- **[Performance Optimization Guide](./lib/PERFORMANCE-OPTIMIZATION-GUIDE.md)** — Recent performance improvements and optimizations.
- **[Consistency Audit Report](./lib/CONSISTENCY-AUDIT.md)** — Code consistency improvements and standards.
- **[Week 1 Summary](./WEEK1-SUMMARY.md)** — Complete MVP checklist & what was built.
- **[MagicToDo Setup Guide](./MAGICTODO.md)** — Individual-first task management MVP.
- **[Scheduler Documentation](./SCHEDULER.md)** — Background job for recurring tasks.
- **[AGENT.md](./AGENT.md)** — Development conventions & architecture guide.

## Getting Started

### Quick start

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Quality gates (should always stay green)

```bash
pnpm lint
pnpm typecheck
pnpm build
```

### Database (Neon + Drizzle)

- **Provider**: Neon Postgres
- **ORM**: Drizzle + drizzle-kit
- **Env**: `DATABASE_URL` (use the Neon `-pooler` hostname when available)

Handy commands:

```bash
pnpm db:push
pnpm db:generate
pnpm db:migrate
pnpm db:studio
```

Neon CLI (dev dependency):

```bash
pnpm neon:auth
pnpm neon:projects
pnpm neon:branches
```

## Recent Optimizations (2024)

The codebase has been significantly optimized for performance and maintainability:

### Key Improvements

- **Enhanced API Client**: Built-in caching, retry logic, and timeout handling
- **Functional Error Handling**: Result type for type-safe error management
- **Optimized Database Client**: Connection pooling and transaction support
- **Standardized Constants**: Centralized constant library to eliminate magic strings
- **Performance Utilities**: Debounce, throttle, deepClone, and more
- **Advanced Pagination**: Cursor-based pagination with sorting support

### Performance Benefits

- Reduced API calls through intelligent caching
- Better error handling with functional programming patterns
- Improved database performance with connection pooling
- Consistent codebase with standardized patterns

See [Performance Optimization Guide](./lib/PERFORMANCE-OPTIMIZATION-GUIDE.md) for detailed information.

## Docs (entry point)

- **Agent guidance**: [`AGENT.md`](./AGENT.md) - Comprehensive guide for AI agents
- **Performance guide**: [`lib/PERFORMANCE-OPTIMIZATION-GUIDE.md`](./lib/PERFORMANCE-OPTIMIZATION-GUIDE.md)
- **Consistency report**: [`lib/CONSISTENCY-AUDIT.md`](./lib/CONSISTENCY-AUDIT.md)

### Repository map

- **App Router**: [`app/`](./app/README.md)
- **Components**: [`components/`](./components/README.md)
- **Hooks**: [`hooks/`](./hooks/README.md)
- **Shared library**: [`lib/`](./lib/README.md)

### `lib/` map

- `lib/server/`: [`lib/server/README.md`](./lib/server/README.md)
- `lib/client/`: [`lib/client/README.md`](./lib/client/README.md)
- `lib/shared/`: [`lib/shared/README.md`](./lib/shared/README.md)
- `lib/env/`: [`lib/env/README.md`](./lib/env/README.md)
- `lib/api/`: [`lib/api/README.md`](./lib/api/README.md)
- `lib/constants/`: [`lib/constants/README.md`](./lib/constants/README.md)
- `lib/config/`: [`lib/config/README.md`](./lib/config/README.md)
- `lib/contracts/`: [`lib/contracts/README.md`](./lib/contracts/README.md)
- `lib/utils/`: [`lib/utils/README.md`](./lib/utils/README.md) - Performance utilities

## Architecture Highlights

### Performance Features

- **API Caching**: 5-minute TTL for GET requests with cache management
- **Database Pooling**: Up to 20 concurrent connections
- **Retry Logic**: Exponential backoff for failed requests
- **Timeout Handling**: 30-second default timeout for API calls

### Code Quality

- **Type Safety**: Full TypeScript coverage with Zod schemas
- **Error Handling**: Functional Result type for recoverable errors
- **Consistency**: Standardized naming conventions and patterns
- **Documentation**: Comprehensive JSDoc documentation throughout

### Development Experience

- **Hot Reload**: Optimized for development with HMR support
- **Lint Rules**: Strict ESLint configuration for code quality
- **Type Checking**: TypeScript strict mode enabled
- **Testing**: Jest configuration for unit testing

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
