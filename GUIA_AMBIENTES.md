# GUIA_AMBIENTES.md

Este projeto usa Expo + React Native + Expo Router. As URLs dos dois
microsservicos sao lidas por variaveis publicas do Expo, sempre com o prefixo
`EXPO_PUBLIC_`.

## 1. Variaveis obrigatorias

Crie ou edite um arquivo `.env` na raiz do projeto:

```env
EXPO_PUBLIC_USERS_API_URL=https://night-out-api.onrender.com
EXPO_PUBLIC_EVENTS_API_URL=https://night-out-api-2.onrender.com
```

Essas variaveis sao consumidas em:

- `services/env.ts`: normaliza as URLs e remove barra final.
- `services/apiClient.ts`: cria os clientes HTTP `usersApi` e `eventsApi`.
- `services/api.ts`: concentra os services de auth, usuarios, eventos e propostas.

## 2. Ambiente local

Se os dois back-ends estiverem rodando na sua maquina:

```env
EXPO_PUBLIC_USERS_API_URL=http://localhost:3000
EXPO_PUBLIC_EVENTS_API_URL=http://localhost:3002
```

No Android Emulator, `localhost` aponta para o proprio emulador. Use:

```env
EXPO_PUBLIC_USERS_API_URL=http://10.0.2.2:3000
EXPO_PUBLIC_EVENTS_API_URL=http://10.0.2.2:3002
```

Em celular fisico no Expo Go, use o IP da maquina na mesma rede:

```env
EXPO_PUBLIC_USERS_API_URL=http://192.168.0.10:3000
EXPO_PUBLIC_EVENTS_API_URL=http://192.168.0.10:3002
```

Troque `192.168.0.10` pelo IP real do computador.

## 3. Ambiente de deploy

Para apontar para o Render:

```env
EXPO_PUBLIC_USERS_API_URL=https://night-out-api.onrender.com
EXPO_PUBLIC_EVENTS_API_URL=https://night-out-api-2.onrender.com
```

As URLs podem ser escritas com ou sem barra final. O app normaliza internamente.

## 4. Alternando entre local e deploy

Opcao simples: altere os valores do `.env` e reinicie o Expo limpando cache:

```powershell
npx expo start -c
```

Opcao com arquivos separados:

1. Mantenha `.env.local` com as URLs locais.
2. Mantenha `.env.production` com as URLs do Render.
3. Copie o arquivo desejado para `.env` antes de iniciar o app.
4. Rode `npx expo start -c`.

No PowerShell, tambem e possivel iniciar sem editar arquivo:

```powershell
$env:EXPO_PUBLIC_USERS_API_URL="http://localhost:3000"
$env:EXPO_PUBLIC_EVENTS_API_URL="http://localhost:3002"
npx expo start -c
```

Para deploy:

```powershell
$env:EXPO_PUBLIC_USERS_API_URL="https://night-out-api.onrender.com"
$env:EXPO_PUBLIC_EVENTS_API_URL="https://night-out-api-2.onrender.com"
npx expo start -c
```

## 5. Sessao local e token JWT

A sessao fica em `AsyncStorage`, na chave `user_session`, com exatamente este
formato:

```json
{
  "email": "bulls@email.com",
  "id": "4757fd8c-5229-4598-9f86-31799e9e7ad4",
  "nome": "bulls",
  "tipo": "CASASHOW",
  "token": "jwt_string"
}
```

O `AuthContext` le essa sessao na inicializacao do app, guarda em memoria e
configura o token usado pela camada HTTP.

Todas as requisicoes autenticadas recebem automaticamente:

```http
Authorization: Bearer {token}
```

Quando a API retorna `401 Unauthorized`, o cliente HTTP notifica o
`AuthContext`, limpa a sessao local e o roteamento protegido envia o usuario
para o login.

## 6. Estrutura de pastas sugerida

A estrutura atual foi mantida e organizada assim:

```text
app/
  _layout.jsx
  index.jsx
  register/
  dashboards/
    artista.jsx
    casashow.jsx
    casashow-eventos.jsx
    casashow-propostas.jsx
    cliente.jsx
    cliente-eventos.jsx
  (tabs)/
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
  casaShowData.js
```

Padrao recomendado para novas telas:

- Contratos e payloads em `types/api.ts`.
- Chamadas HTTP em `services/api.ts`.
- Estado global de auth em `contexts/AuthContext.tsx`.
- RBAC e redirecionamento por tipo em `hooks/useProtectedRoute.ts`.
- Telas mantendo apenas UI, loading, erro, filtros locais e chamada de service.

## 7. Microsservicos mapeados

Microservico de usuarios:

- Local: `http://localhost:3000`
- Deploy: `https://night-out-api.onrender.com`
- Rotas: auth, cliente, artista e casa de show.

Microservico de eventos:

- Local: `http://localhost:3002`
- Deploy: `https://night-out-api-2.onrender.com`
- Rotas: eventos e propostas.

## 8. Checklist para validar um ambiente

1. Confirme se `.env` tem as duas variaveis `EXPO_PUBLIC_*`.
2. Reinicie o Expo com `npx expo start -c`.
3. Faça login e confirme que `AsyncStorage.user_session` possui apenas
   `email`, `id`, `nome`, `tipo` e `token`.
4. Teste uma rota autenticada, como eventos da casa ou propostas do artista.
5. Se receber `401`, refaca login para renovar a sessao local.
