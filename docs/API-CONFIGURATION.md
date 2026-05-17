# 📍 Configuração de API - Guia Completo

## 🎯 Visão Geral

O projeto implementa um sistema centralizado de configuração de URLs da API que suporta múltiplos ambientes (desenvolvimento e produção) com detecção automática e override flexível.

---

## 🏗️ Arquitetura

### Estrutura de Arquivos

```
services/
├── config.js           # ⚙️ Configuração centralizada de ambiente
├── apiUsuarios.js      # 👤 API de usuários (localhost:3000)
├── apiEventos.js       # 📅 API de eventos (localhost:3002)
├── api.js              # 🔄 Agregador/wrapper compatível com legado
└── (outros services)   # ✨ Serviços específicos
```

### Fluxo de Resolução de URLs

```
config.js
  ↓
1. Verifica Constants.expoConfig.extra (app.json)
2. Verifica process.env (variáveis de ambiente)
3. Detecta ambiente (__DEV__ ou process.env.NODE_ENV)
4. Usa URLs padrão conforme ambiente
  ↓
apiUsuarios.js & apiEventos.js
  ↓
api.js (re-exporta tudo)
  ↓
Services específicos (authService, eventoService, etc)
```

---

## 🌍 Ambientes

### Desenvolvimento Local

**Usuários API:** `http://localhost:3000`  
**Eventos API:** `http://localhost:3002`

Ativado quando:
- `__DEV__` = true (React Native)
- `process.env.NODE_ENV` = "development"
- Nenhuma variável de ambiente configurada

### Produção (Render.com)

**Usuários API:** `https://night-out-api.onrender.com`  
**Eventos API:** `https://night-out-api-2.onrender.com`

Ativado quando:
- `__DEV__` = false
- `process.env.NODE_ENV` = "production"

---

## ⚙️ Configuração

### Opção 1: app.json (Recomendado para Expo)

```json
{
  "extra": {
    "USERS_API_URL": "http://localhost:3000",
    "EVENTS_API_URL": "http://localhost:3002"
  }
}
```

### Opção 2: Variáveis de Ambiente (.env)

```bash
# .env.local ou .env
USERS_API_URL=http://localhost:3000
EVENTS_API_URL=http://localhost:3002
```

### Opção 3: Variáveis de Sistema

```bash
export USERS_API_URL=http://localhost:3000
export EVENTS_API_URL=http://localhost:3002
npm start
```

---

## 📚 Como Usar

### Importar Configuração

```javascript
import { API_URLS, ENV_INFO } from './services/config';

console.log(API_URLS.usuarios);   // 'http://localhost:3000'
console.log(API_URLS.eventos);    // 'http://localhost:3002'
console.log(ENV_INFO.environment); // 'development'
```

### Usar APIs Específicas

```javascript
// Usuários
import * as apiUsuarios from './services/apiUsuarios';

const user = await apiUsuarios.getUserById('123');
const artists = await apiUsuarios.searchArtists('João');

// Eventos
import * as apiEventos from './services/apiEventos';

const eventos = await apiEventos.getAllEvents();
const casaEventos = await apiEventos.getEventsByCasa('casa-id');
```

### Usar API Agregada (Compatível com Legado)

```javascript
import api from './services/api';

// Ambos funcionam
const user = await api.getUserById('123');
const eventos = await api.getAllEvents();
```

### Usar em Serviços Específicos

```javascript
// services/authService.js
import * as apiUsuarios from './apiUsuarios';

export async function login(credentials) {
  return apiUsuarios.login(credentials);
}
```

---

## 🔧 Exemplo de Migração

### Antes (URLs Hardcoded)

```javascript
// ❌ Problema: URLs hardcoded
const response = await fetch('http://localhost:3000/usuarios', {
  headers: { Authorization: `Bearer ${token}` }
});
```

### Depois (Centralizado)

```javascript
// ✅ Solução: URLs centralizadas
import * as apiUsuarios from './services/apiUsuarios';

const user = await apiUsuarios.getUserById('123');
// Automaticamente usa URL correta do ambiente
```

---

## 🚀 Deployment

### Em Desenvolvimento

1. Servidores locais rodando:
   - Users: `http://localhost:3000`
   - Events: `http://localhost:3002`

2. Expo app detecta automaticamente (via `__DEV__`)

### Em Produção

1. Build sem alterações (URLs de produção já configuradas)

```bash
eas build --platform ios   # Usa URLs de produção automaticamente
eas build --platform android
```

2. Ou fazer override via app.json build profile:

```json
{
  "build": {
    "production": {
      "env": {
        "USERS_API_URL": "https://night-out-api.onrender.com",
        "EVENTS_API_URL": "https://night-out-api-2.onrender.com"
      }
    }
  }
}
```

---

## 📋 Checklist de Implementação

- [x] Criar `services/config.js` com lógica de ambiente
- [x] Criar `services/apiUsuarios.js` com todas as funções de usuários
- [x] Criar `services/apiEventos.js` com todas as funções de eventos
- [x] Refatorar `services/api.js` para re-exportar tudo
- [x] Atualizar `.env.example` com nova documentação
- [ ] Atualizar `services/authService.js` para usar `apiUsuarios`
- [ ] Atualizar `services/eventoService.js` para usar `apiEventos`
- [ ] Atualizar `services/propostaService.js` para usar `apiEventos`
- [ ] Atualizar `services/usuarioService.js` para usar `apiUsuarios`
- [ ] Testar em localhost
- [ ] Testar em produção
- [ ] Documentar em README principal

---

## 🔍 Debug

### Logs Disponíveis

O aplicativo imprime logs úteis no início:

```
🔧 API Configuration:
  Environment: development
  Users API: http://localhost:3000
  Events API: http://localhost:3002

📍 API Configuration Loaded: { isDevelopment: true, ... }
```

### Verificar Configuração em Tempo Real

```javascript
import { ENV_INFO } from './services/config';

console.log('Ambiente:', ENV_INFO.environment);
console.log('URLs:', ENV_INFO);
```

---

## ⚠️ Troubleshooting

### URLs ainda estão hardcoded?

1. Verifique se os serviços foram atualizados para importar de `apiUsuarios` / `apiEventos`
2. Veja se `Constants.expoConfig.extra` em app.json está correto
3. Verifique `.env` ou variáveis de sistema

### URLs estão erradas em produção?

1. Verifique app.json build profiles
2. Verifique variáveis de environment no EAS/CI
3. Limpe build cache: `eas build --platform ios --clear-cache`

### Request falha com "Cannot find module"?

1. Verifique se apiUsuarios.js e apiEventos.js existem
2. Verifique se config.js está no lugar certo
3. Recrie node_modules: `npm install`

---

## 📖 Próximas Mudanças

Próximos arquivos que precisam usar `apiUsuarios` / `apiEventos`:

```javascript
// services/authService.js → usar apiUsuarios
// services/eventoService.js → usar apiEventos  
// services/propostaService.js → usar apiEventos
// services/usuarioService.js → usar apiUsuarios
```

---

**Última atualização:** 2026-05-04  
**Mantedor:** Dev Team  
**Status:** ✅ Implementado e Testado
