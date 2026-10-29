# FinControl

Aplicação web para controlar a vida financeira pessoal: receitas, despesas,
salários, orçamento por categoria, metas, carteira de investimentos, patrimônio
e relatórios, com cotações em tempo real da B3 e dos EUA. Há também um
assistente de conversa para tirar dúvidas de finanças e investimentos. Ele tem
a integração com a API do Claude pronta, mas **ela não está ativada**, para não
gerar custo (veja [Assistente](#assistente)).

O projeto tem duas partes independentes que conversam por HTTP:

- **`docs/`**: interface em HTML, CSS e JavaScript puro, sem framework e sem
  etapa de compilação. É uma SPA com roteamento por hash (`#/despesas`).
- **`backend/`**: API REST em Java 21 com Spring Boot 3.3, Spring Security (JWT)
  e MongoDB.

---

## Sumário

- [Funcionalidades](#funcionalidades)
- [Assistente](#assistente)
- [Arquitetura](#arquitetura)
- [Stack](#stack)
- [Rodando localmente](#rodando-localmente)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Deploy](#deploy)
- [API](#api)
- [Segurança](#segurança)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Testes e CI](#testes-e-ci)

---

## Funcionalidades

| Área | O que faz |
|------|-----------|
| **Dashboard** | Resumo do mês: quanto entrou, quanto saiu, quanto foi investido, gastos por categoria e evolução ao longo do tempo. |
| **Meu Dinheiro** | Registro de receitas e rendimentos, com recorrência. |
| **Despesas** | Lançamento de gastos por categoria (moradia, alimentação, transporte, saúde, educação, lazer, compras, contas, outros), com tipo fixo ou variável e status de pagamento. |
| **Salários** | Cadastro dos salários recebidos, para o histórico de renda. |
| **Orçamento** | Limite mensal por categoria. Quando a despesa passa do limite, a categoria aparece como alerta. |
| **Metas** | Objetivos com valor-alvo, valor atual e prazo. Mostra o progresso e avisa quando o prazo está perto. |
| **Investimentos** | Carteira por tipo (renda fixa, FIIs, ações, ETFs, exterior, outros). Cada ativo guarda os aportes feitos ao longo do tempo, o que permite calcular custo, resultado e rentabilidade. |
| **Patrimônio** | Visão consolidada do que você tem e da evolução ao longo do tempo. |
| **Relatórios** | Séries por período para acompanhar receitas, despesas e investimentos. |
| **Insights** | Observações calculadas a partir dos seus dados: taxa de investimento sobre a renda, alimentação em alta, orçamento estourado, metas com prazo próximo. |
| **Cotações** | Preço, variação e histórico de ativos da B3 (brapi.dev) e dos EUA (Massive), além das taxas CDI e Selic (BrasilAPI). Há cache de 5 minutos para respeitar os limites dos planos gratuitos. |
| **Assistente** | Chat de dúvidas sobre finanças, investimentos e uso do app. Integração com a API do Claude pronta, porém desativada. Veja a seção abaixo. |
| **Configurações** | Dados da conta e alteração de perfil. |

Todos os números exibidos vêm do banco de dados do usuário autenticado. Não há
dados de exemplo no código.

---

## Assistente

A página **Assistente** é um chat para tirar dúvidas. Ele explica conceitos de
finanças pessoais e de investimentos (reserva de emergência, CDI, Selic,
Tesouro Direto, CDB, FIIs, ETFs, diversificação, juros compostos) e orienta o
usuário sobre como usar cada tela do app.

> ### A API do Claude está conectada, mas eu não a utilizo
>
> O backend já tem a integração completa com a **API do Claude (Anthropic)**,
> feita com o SDK oficial Java. Ela só **não está ativada**: este é um projeto
> de estudo e eu não configurei `ANTHROPIC_API_KEY`, para não pagar pelo uso
> dos tokens. Sem a chave, nenhuma chamada à Anthropic é feita e o custo é zero.
>
> Para ativar, basta definir a variável de ambiente `ANTHROPIC_API_KEY` e
> reiniciar o backend. Não é preciso mudar código.

### Os dois modos

O `AssistantService` escolhe o modo a cada pergunta:

| | Modo local (o que roda hoje) | Modo Claude (chave configurada) |
|---|---|---|
| **Quando** | `ANTHROPIC_API_KEY` vazia, ou a API falhou | `ANTHROPIC_API_KEY` definida |
| **Custo** | Nenhum | Cobrado por token pela Anthropic |
| **Como responde** | Regras de palavra-chave sobre os **seus dados** (`InsightsService.analyze`) | O modelo redige uma resposta livre sobre finanças e sobre o app |
| **O que responde** | Perguntas com "despesa", "invest", "patrim", "meta" e "projeção": devolve valores reais do mês, da carteira e das metas | Dúvidas gerais e de uso do app, em linguagem natural |
| **Campo `source`** | `local` | `claude` |

No modo local, o chat consulta o MongoDB e responde com os números do usuário
(receita e despesas do mês, maiores categorias, valor e rentabilidade da
carteira, quantidade de metas). Qualquer outra pergunta recebe um resumo do mês.

### Como a integração com o Claude funciona

Quando a chave existe, para cada pergunta o backend:

1. monta a requisição com instruções de sistema, que definem o papel (só tira
   dúvidas de finanças e do app), o tom (português do Brasil, resposta curta) e
   os limites (não promete retorno, não indica "compre este ativo", é
   orientação educacional, recusa assuntos fora do tema);
2. anexa as **4 últimas mensagens** da conversa, que o frontend envia a cada
   pergunta, para o modelo entender o contexto;
3. chama o modelo e devolve o texto ao chat.

Decisões de projeto, todas voltadas a gastar poucos tokens:

- **Modelo pequeno:** o padrão é `claude-haiku-5-5`, o mais barato da família,
  com esforço baixo. Pode ser trocado em `ANTHROPIC_MODEL`.
- **Respostas curtas:** limite de 600 tokens por resposta
  (`ANTHROPIC_MAX_TOKENS`) e instrução para responder em poucas linhas.
- **Sem dados do usuário no prompt:** o modelo não recebe receitas, despesas
  nem carteira. Ele só tira dúvidas gerais. Isso reduz o custo por pergunta e
  evita enviar dados financeiros a um serviço externo.
- **Somente leitura:** o assistente não cria nem altera registros.
- **Chave só no backend:** ela vem de variável de ambiente e nunca chega ao
  navegador.
- **Degradação segura:** se a API falhar, estourar o tempo (30 s) ou recusar a
  pergunta, o chat cai no modo local em vez de mostrar erro.

### Contrato da rota

`POST /api/ai/analyze`, autenticada.

```json
// requisição
{
  "message": "O que é CDI?",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}

// resposta
{ "reply": "O CDI é ...", "source": "local" }
```

`message` é obrigatória (até 2000 caracteres). `history` é opcional (até 20
itens, dos quais só os 4 mais recentes são usados).

---

## Arquitetura

```
┌──────────────────────────┐        HTTPS + JWT         ┌────────────────────────────┐
│ Frontend (docs/)         │ ─────────────────────────▶ │ Backend (backend/)         │
│ HTML + CSS + JS puro     │  Authorization: Bearer     │ Spring Boot 3.3 / Java 21  │
│ Hospedado na Vercel      │ ◀───────────────────────── │ Hospedado no Render        │
└──────────────────────────┘          JSON              └──────┬──────────┬──────────┘
                                                              │          │
                                                  ┌───────────▼──┐  ┌────▼───────────────┐
                                                  │ MongoDB      │  │ APIs externas      │
                                                  │ (Atlas ou    │  │ brapi.dev (B3)     │
                                                  │  local)      │  │ Massive (EUA)      │
                                                  └──────────────┘  │ BrasilAPI (CDI/Selic)│
                                                                    └────────────────────┘
```

No backend, a organização segue as camadas usuais do Spring:

- `controller/`: recebe a requisição, valida e delega. Não contém regra de negócio.
- `service/`: regras de negócio (cálculo de orçamento, rentabilidade, insights, patrimônio).
- `repository/`: consultas ao MongoDB via Spring Data.
- `entity/`: documentos persistidos.
- `dto/`: formatos de entrada e saída da API. As entidades não saem diretamente
  para o cliente.
- `integration/`: clientes HTTP das APIs de mercado (`BrapiClient`,
  `MassiveClient`, `BrasilApiClient`).
- `security/`: filtro JWT, configuração do Spring Security e o usuário autenticado.
- `exception/`: tratamento global de erros com respostas em JSON.

O `MarketDataService` roteia cada ticker para o provedor certo (B3 ou EUA) e
mantém um cache em memória de 5 minutos.

---

## Stack

| Camada     | Tecnologia |
|------------|------------|
| Interface  | HTML5, CSS3 (tema claro e escuro), JavaScript ES Modules |
| Gráficos   | SVG desenhado pelo próprio código, sem biblioteca |
| API        | Java 21, Spring Boot 3.3, Spring Web, Validation |
| Segurança  | Spring Security, JWT (jjwt), BCrypt |
| Banco      | MongoDB com Spring Data MongoDB |
| Build      | Maven (wrapper incluso) para o backend; script Node para gerar a configuração da API no frontend |
| Deploy     | Vercel (frontend), Render com Docker (backend), MongoDB Atlas |
| CI         | GitHub Actions |

---

## Rodando localmente

Você precisa de Java 21, Maven (ou use o `mvnw` incluso) e um MongoDB. A forma
mais simples é o Docker, que sobe os três serviços de uma vez.

### Opção A: Docker (recomendada)

```bash
docker compose -f docker-compose.dev.yml up --build
```

| Serviço   | Endereço                           |
|-----------|------------------------------------|
| Interface | http://localhost:5500              |
| API       | http://localhost:8080              |
| Saúde     | http://localhost:8080/api/health   |
| MongoDB   | mongodb://localhost:27017          |

Para parar: `docker compose -f docker-compose.dev.yml down`. Os dados ficam no
volume `mongo_data`. Use `down -v` para apagá-los.

### Opção B: sem Docker

1. **MongoDB** rodando em `mongodb://localhost:27017`, ou ajuste `MONGODB_URI`.
   No perfil de desenvolvimento, o banco padrão é `fincontrol_dev`; altere-o
   com `MONGODB_DATABASE` se necessário.

2. **Backend**, a partir da raiz do projeto:

   ```powershell
   # Windows (PowerShell): carrega backend/.env se existir e sobe o perfil development
   .\scripts\dev-backend.ps1
   ```

   ```bash
   # Qualquer sistema, com as variáveis já exportadas
   cd backend
   ./mvnw spring-boot:run -Dspring-boot.run.profiles=development
   ```

3. **Interface**, em outro terminal:

   ```bash
   node scripts/dev-server.mjs     # abre em http://localhost:5500
   # ou
   npm run dev:frontend
   ```

   Quando a página é aberta em `localhost`, `docs/js/env-api.js` aponta
   automaticamente para `http://localhost:8080`.
   Se a porta 5500 estiver ocupada, inicie o stack com `npm run dev -- 5501`;
   o backend libera a origem local escolhida no CORS.

Copie `backend/.env.example` para `backend/.env` e ajuste os valores. O arquivo
`.env` está no `.gitignore` e nunca deve ser versionado.

---

## Variáveis de ambiente

As variáveis são lidas pelo backend (`application.yml` e os perfis).

| Variável | Obrigatória | Padrão | Para que serve |
|----------|-------------|--------|----------------|
| `SPRING_PROFILES_ACTIVE` | Não | `development` | `development` (local) ou `production` (Render). |
| `MONGODB_URI` | Sim | — | String de conexão do MongoDB. |
| `JWT_SECRET` | Sim | — | Segredo de assinatura do JWT. Mínimo de 32 caracteres. Em produção, use um valor aleatório longo. |
| `JWT_EXPIRATION` | Não | `PT1H` | Validade do token. Aceita ISO-8601 (`PT8H`) ou milissegundos (`3600000`). |
| `FRONTEND_URL` | Sim em produção | vazio | Origens permitidas no CORS, separadas por vírgula. Se vazio, nenhuma origem é liberada. |
| `PORT` | Não | `8080` | Porta HTTP. O Render define esta variável sozinho. |
| `ANTHROPIC_API_KEY` | Não | vazio | Chave da API da Anthropic. **Deixada vazia neste projeto**: sem ela, o chat usa o modo local e não há custo. |
| `ANTHROPIC_MODEL` | Não | `claude-haiku-5-5` | Modelo usado pelo assistente quando a chave existe. |
| `ANTHROPIC_MAX_TOKENS` | Não | `600` | Tamanho máximo da resposta. |
| `BRAPI_TOKEN` | Para cotações B3 | — | Token da brapi.dev. |
| `MASSIVE_API_TOKEN` | Para cotações EUA | — | Token da Massive (antiga Polygon). |

No frontend, a URL da API é definida assim, nesta ordem:

1. `window.FINCONTROL_API_URL`, se existir.
2. Em `localhost`, `http://localhost:8080`.
3. Em qualquer outro host, o caminho relativo (mesma origem).

O `build.mjs` gera `docs/js/env-api.js` com essa configuração.

---

## Deploy

### Backend no Render

O arquivo `render.yaml` é um Blueprint. No Render, use **New → Blueprint** e
aponte para o repositório. A imagem é construída pelo `backend/Dockerfile`
(build em duas etapas: Maven compila, e uma JRE 21 enxuta roda o `.jar`).

Preencha no painel do Render:

- `MONGODB_URI`: a string `mongodb+srv://...` do MongoDB Atlas.
- `FRONTEND_URL`: a URL do frontend, por exemplo `https://seu-app.vercel.app`.
- `JWT_SECRET`: o Blueprint gera um valor aleatório automaticamente.

O health check é `GET /api/health`.

### Frontend na Vercel

O `vercel.json` define o comando de build (`node build.mjs`) e a pasta de saída
(`docs`). Não há dependências para instalar.

O `build.mjs` gera `window.API_BASE` apenas pelo host: `localhost` aponta para
`http://localhost:8080`, e qualquer outro host usa a mesma origem. Ou seja, em
produção o frontend espera que `/api` seja servido no mesmo domínio. Para
apontar a Vercel para o Render, use um rewrite em `vercel.json` que encaminhe
`/api/*` para a URL do backend (por exemplo,
`https://fincontrol-api.onrender.com`).

---

## API

Todas as rotas, exceto as marcadas como públicas, exigem o cabeçalho
`Authorization: Bearer <token>`. Os erros voltam como JSON com a mensagem.

**Públicas**

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET`  | `/api/health` | Status do serviço. |
| `POST` | `/api/auth/register` | Cria a conta. |
| `POST` | `/api/auth/login` | Retorna o JWT. |

**Autenticadas** (recursos principais)

| Recurso | Rotas |
|---------|-------|
| Conta | `GET /api/auth/me`, `PUT /api/auth/profile` |
| Receitas | `/api/incomes` (listar, criar, `GET/PUT/DELETE /{id}`) |
| Despesas | `/api/expenses` |
| Salários | `/api/salaries` |
| Orçamento | `/api/budgets` |
| Metas | `/api/goals`, com `PUT /{id}` |
| Investimentos | `/api/investments`, com `POST /{id}/aportes` |
| Patrimônio | `/api/patrimony`, `/api/patrimony/evolution` |
| Dashboard | `/api/dashboard/summary`, `/expenses-by-category`, `/evolution` |
| Relatórios | `/api/reports` |
| Insights | `GET /api/insights`, `GET /api/notifications` |
| Mercado | `GET /api/market/quotes`, `/search`, `/history` |
| Assistente | `POST /api/ai/analyze` (corpo: `message` e `history`; resposta: `reply` e `source`) |

A lista completa está nos arquivos `controller/`.

---

## Segurança

- **Senhas** são guardadas com BCrypt. Nunca em texto puro.
- **Autenticação** é feita por JWT no cabeçalho `Authorization`. A API não
  guarda sessão, então o CSRF fica desabilitado, o que é seguro nesse modelo.
- **Acesso por padrão fechado**: `anyRequest().authenticated()`. Só as rotas da
  tabela pública são abertas.
- **Dados por usuário**: todas as consultas filtram pelo `userId` do token. Um
  usuário não consegue ler ou alterar registros de outro.
- **CORS por allowlist**, definida em `FRONTEND_URL`. Nunca `*`.
- **Segredos** (`JWT_SECRET`, `MONGODB_URI`, tokens de APIs) só vêm de variáveis
  de ambiente. Não estão no código.
- **Erros** não expõem stack trace (`include-stacktrace: never`).

Limitação conhecida: o token JWT fica no `localStorage` do navegador. Um script
injetado na página conseguiria lê-lo. Por isso a interface escapa o conteúdo
digitado pelo usuário antes de exibi-lo, e o chat do assistente segue a mesma
regra.

---

## Estrutura do repositório

```
financeiro/
├── docs/                      Interface (HTML, CSS, JS puro)
│   ├── index.html             Casca da SPA e menu lateral
│   ├── login.html             Tela de entrada
│   ├── styles.css             Estilos, com tema claro e escuro
│   ├── js/
│   │   ├── app.js             Roteador por hash, layout e estado global
│   │   ├── api.js             Cliente HTTP com JWT e tratamento de erro
│   │   ├── auth.js / auth-ui.js
│   │   ├── components.js      Cards, modais, estados vazios
│   │   ├── utils.js           Formatação de moeda e data, escape de HTML
│   │   ├── icons.js           Ícones SVG
│   │   └── env-api.js        Gerado pelo build.mjs
│   └── pages/                 Uma página por rota (dashboard, despesas, assistente...)
├── backend/                   API Spring Boot
│   ├── src/main/java/com/fincontrol/
│   │   ├── controller/ service/ repository/ entity/ dto/
│   │   ├── integration/       Clientes das APIs de cotações
│   │   ├── security/          JWT, filtros e configuração do Spring Security
│   │   └── config/            CORS e MongoDB
│   ├── src/main/resources/    application*.yml por perfil
│   ├── Dockerfile
│   └── .env.example
├── scripts/                   Servidores e scripts de desenvolvimento
├── .github/workflows/ci.yml   Pipeline de CI
├── build.mjs                  Gera docs/js/env-api.js
├── docker-compose.dev.yml     Mongo, backend e frontend em localhost
├── render.yaml                Blueprint do Render
└── vercel.json                Configuração da Vercel
```

---

## Testes e CI

O workflow `.github/workflows/ci.yml` roda em push e pull request para `main`
e tem dois jobs:

- **Frontend**: executa `node build.mjs` e confere se os arquivos essenciais existem.
- **Backend**: executa `./mvnw verify` com Java 21.

O repositório não tem testes automatizados (`backend/src/test` não existe),
então o job do backend compila o projeto sem verificar comportamento. O
MongoDB embarcado (Flapdoodle) já está declarado no `pom.xml` para uso em testes.

## Funciona Somente Em LOCALHOST


