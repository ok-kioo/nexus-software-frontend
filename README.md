# `@nexus/frontend` — SPA React

Aplicação web para o sistema Nexus. Stack: **React 18 + Vite + TypeScript + Tailwind + shadcn/ui + TanStack Query**.

## Características

- **SPA totalmente desacoplada do backend** — toda comunicação passa por `lib/api/*` (chamadas HTTP) e nunca por SQL/CRUD direto.
- **Autenticação encapsulada em `lib/auth/`** (Supabase Auth apenas para login/sessão/refresh). O cliente Supabase fica isolado — o resto do código consome `getAccessToken()`, `onAuthChange()`, `signInWithPassword()`, etc.
- **Interceptor HTTP** em `lib/api/client.ts`:
  - Injeta `Authorization: Bearer <token>` em toda request.
  - Faz **retry com refresh** em respostas 401.
  - Trata erros de rede com `ApiError { status, isNetworkError }`.
- **Proteção de rotas** com `ProtectedRoute`: redireciona para `/login` se não autenticado e aplica RBAC por papel.
- **Layout com sidebar** (`AppLayout`) só é renderizado dentro de rotas autenticadas.

## Rodando

```bash
cp .env.example .env             # preencha VITE_API_URL e VITE_SUPABASE_*
bun install
bun run dev                      # http://localhost:8080
```

### Variáveis de ambiente

| Nome                            | Descrição                                            |
| ------------------------------- | ---------------------------------------------------- |
| `VITE_API_URL`                  | URL base do backend Hono (default `http://localhost:3000`). |
| `VITE_SUPABASE_URL`             | URL do projeto Supabase (usada apenas pelo Auth).    |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon key do Supabase (apenas Auth).                  |
| `VITE_SUPABASE_PROJECT_ID`      | ID do projeto (usado em redirects de auth).          |

## Estrutura

```text
src/
├── main.tsx                 # entrypoint (React + router + providers)
├── App.tsx                  # rotas; ProtectedRoute envolve as privadas
├── pages/                   # uma página por rota
├── components/
│   ├── AppLayout.tsx        # sidebar + topbar (só rotas autenticadas)
│   ├── ProtectedRoute.tsx   # auth + RBAC + redirect
│   ├── crud/                # forms reutilizáveis
│   ├── reusable/            # KPI, tabelas, filtros, gráficos…
│   └── ui/                  # primitivos shadcn/ui
├── contexts/
│   ├── AuthContext.tsx      # provider único de auth (state + actions)
│   └── ThemeContext.tsx
├── hooks/                   # useEntities, useAlertas, useAnalytics, useDebounce…
├── lib/
│   ├── api/                 # client + um arquivo por área (auth, cadastros, …)
│   ├── auth/                # supabase encapsulado: auth-api, session, realtime
│   ├── importacao/          # parser de planilhas + validação
│   └── exportacao/          # PDF/Excel
└── test/                    # setup vitest + MSW
```

## Auth flow

1. `lib/auth/supabase.ts` cria o client Supabase (singleton, encapsulado).
2. `AuthContext` ouve `onAuthChange` e popula `{ user, role, session }`.
3. Em toda chamada HTTP, `lib/api/client.ts` chama `getAccessToken()` (interceptor) e adiciona `Authorization: Bearer …`.
4. Em 401, faz **uma** retry com refresh forçado (`getAccessToken(forceRefresh=true)`).
5. `ProtectedRoute` bloqueia rotas privadas e respeita `allowedRoles`.

## Testes

```bash
bun run test           # vitest run
bun run test:watch     # modo watch
```

Os testes ficam ao lado dos componentes (`*.test.tsx`) ou em `src/test/`. Usamos **MSW** (`src/test/msw-server.ts`) para interceptar chamadas ao backend Hono nos testes de integração — sem precisar do servidor real.

## Docker

```bash
docker build -t nexus-frontend \
  --build-arg VITE_API_URL=https://api.exemplo.com \
  --build-arg VITE_SUPABASE_URL=... \
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY=... \
  apps/frontend
docker run -p 8080:80 nexus-frontend
```

Imagem multi-stage: builder com Bun roda `vite build`; runtime nginx serve `/dist` com SPA fallback (`try_files $uri /index.html`) e cache imutável para `/assets/`.

## Convenções

- **Cores**: usar tokens semânticos do Tailwind (`bg-primary`, `text-muted-foreground`, etc.) — definidos em `tailwind.config.ts` e `index.css`. Nunca cores diretas (`bg-white`, `#000`).
- **Validação de formulários**: Zod via `react-hook-form` + `@hookform/resolvers`.
- **Data fetching**: TanStack Query encapsulado nos hooks `useEntities`, `useAlertas`, `useAnalytics`, etc.
- **Acessibilidade**: shadcn/ui já entrega ARIA correto; manter labels associados a inputs e mensagens de erro acessíveis.
