# Guia de ambientes - NightOut Mobile

Este app usa Expo + React Native e le variaveis publicas com o prefixo
`EXPO_PUBLIC_`. A camada de API esta em `services/` e consome:

- `EXPO_PUBLIC_USERS_API_URL`: microservico de usuarios/auth/clientes/artistas/casas.
- `EXPO_PUBLIC_EVENTS_API_URL`: microservico de eventos/propostas.

## 1. Arquivos de ambiente

Crie os arquivos abaixo na raiz do projeto. Eles nao devem conter aspas.

### `.env.local`

Use este arquivo quando estiver rodando os dois microsservicos localmente.

```env
EXPO_PUBLIC_USERS_API_URL=http://localhost:3000
EXPO_PUBLIC_EVENTS_API_URL=http://localhost:3002
```

No Android Emulator, `localhost` aponta para o proprio emulador. Use:

```env
EXPO_PUBLIC_USERS_API_URL=http://10.0.2.2:3000
EXPO_PUBLIC_EVENTS_API_URL=http://10.0.2.2:3002
```

Em um celular fisico, use o IP da maquina na rede local:

```env
EXPO_PUBLIC_USERS_API_URL=http://192.168.0.10:3000
EXPO_PUBLIC_EVENTS_API_URL=http://192.168.0.10:3002
```

### `.env.production`

Use este arquivo para apontar o app para o deploy.

```env
EXPO_PUBLIC_USERS_API_URL=https://night-out-api.onrender.com
EXPO_PUBLIC_EVENTS_API_URL=https://night-out-api-2.onrender.com
```

As URLs podem ter ou nao barra final. O app normaliza internamente.

## 2. Alternando local e deploy

Para rodar localmente:

1. Garanta que os back-ends estejam ativos em `3000` e `3002`.
2. Preencha `.env.local`.
3. Reinicie o Expo limpando cache:

```powershell
npx.cmd expo start -c
```

Para rodar contra o deploy:

1. Copie os valores de `.env.production` para `.env`, ou exporte as variaveis no shell.
2. Reinicie o Expo com cache limpo:

```powershell
npx.cmd expo start -c
```

Alternativa sem arquivo `.env`, direto no PowerShell:

```powershell
$env:EXPO_PUBLIC_USERS_API_URL="https://night-out-api.onrender.com"
$env:EXPO_PUBLIC_EVENTS_API_URL="https://night-out-api-2.onrender.com"
npx.cmd expo start -c
```

## 3. Onde as URLs sao usadas

- `services/env.ts` resolve as variaveis e aplica fallback para deploy.
- `services/apiClient.ts` cria os clientes HTTP `usersApi` e `eventsApi`.
- `services/api.ts` concentra os services de auth, usuarios, eventos e propostas.

## 4. Sessao e token

A sessao permanece em `AsyncStorage` com a chave `user_session` e exatamente este
formato:

```json
{
  "email": "bulls@email.com",
  "id": "4757fd8c-5229-4598-9f86-31799e9e7ad4",
  "id_usuario": "4757fd8c-5229-4598-9f86-31799e9e7ad4",
  "nome": "bulls",
  "tipo": "CASASHOW",
  "token": "jwt_string"
}
```

O interceptor de request injeta automaticamente:

```http
Authorization: Bearer {token}
```

Quando a API retorna `401 Unauthorized`, o interceptor notifica o
`AuthContext`, limpa a sessao local e o roteamento protegido envia o usuario
para o login.

## 5. Estrutura sugerida

Estrutura atual preservada e extensoes adicionadas:

```text
app/
  _layout.jsx
  index.jsx
  register/
  dashboards/
components/
constants/
contexts/
  AuthContext.tsx
hooks/
  useProtectedRoute.ts
services/
  env.ts
  apiClient.ts
  api.ts
  sessionStorage.ts
types/
  api.ts
utils/
```

Para novas integracoes, prefira:

- Tipos de contrato em `types/api.ts`.
- Chamadas HTTP em `services/api.ts`.
- Estado global de usuario/sessao em `contexts/AuthContext.tsx`.
- Regras de rota por tipo em `hooks/useProtectedRoute.ts`.
- Telas apenas orquestrando UI, loading, erro e chamada de service.
