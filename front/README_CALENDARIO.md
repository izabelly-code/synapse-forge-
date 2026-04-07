# 📅 Sistema de Calendário com Eventos

## 🚀 Arquitetura

O sistema foi construído usando boas práticas de separação de responsabilidades:

```
src/
├── models/
│   └── Event.js              # Modelo de dados (JS puro)
├── services/
│   └── EventService.js       # Serviço de gerenciamento (JS puro)
├── mocks/
│   └── mockServer.js         # Mock server para testes locais
├── hooks/
│   └── useEventos.js         # Hook React customizado
├── components/
│   ├── EventoModal.jsx       # Componente Modal
│   └── EventoModal.css       # Estilos do Modal
└── Calendar.jsx              # Componente principal do calendário
```

## 📋 Componentes

### 1. **Event (Model)**
- Representa um evento com: `id`, `user_id`, `nome`, `data`, `descricao`, `startTime`, `endTime`, `participantes`
- Métodos: `validar()`, `toJSON()`, `fromJSON()`, `toString()`

### 2. **EventService (Service)**
- CRUD completo de eventos
- Persiste em localStorage
- Métodos: `criarEvento()`, `obterTodos()`, `obterPorData()`, `atualizarEvento()`, `deletarEvento()`

### 3. **MockServer (API Testing)**
- Simula requisições HTTP com latência realista (300ms)
- Métodos: `getEventos()`, `criarEvento()`, `atualizarEvento()`, `deletarEvento()`
- Inclui 4 eventos de teste por padrão
- Persiste dados em localStorage

### 4. **useEventos (Hook React)**
- Gerencia estado de eventos
- Comunica com MockServer
- Retorna: `eventos`, `carregando`, `erro`, `eventoSelecionado`
- Funções: `criarEvento()`, `atualizarEvento()`, `deletarEvento()`, `selecionarEvento()`, `deselecionar()`

### 5. **EventoModal (Componente)**
- Modal para exibir/editar eventos
- Modo visualização com todos os detalhes
- Modo edição com formulário
- Botões: Editar, Deletar, Salvar, Cancelar

### 6. **Calendar (Componente Principal)**
- Exibe calendário mensal
- Integra todo o sistema
- Clique em um dia para ver eventos
- Navegação entre meses

## 🔧 Como Funciona

### Fluxo de Dados:

```
1. Calendar.jsx carrega com useEventos('user_123')
2. useEventos chama mockServer.getEventosPorUsuario()
3. MockServer carrega dados do localStorage ou cria mocks
4. Eventos aparecem no calendário com resumo diário
5. Clique em um dia para selecionar um evento
6. EventoModal exibe ou edita o evento selecionado
7. Alterações são sincronizadas com mockServer e localStorage
```

## 💾 Dados Persistidos

### LocalStorage:
- `mock_eventos` - Lista de eventos do mock server
- `eventos` - Armazenado pelo EventService (se usado)

### Estrutura de um Evento:
```json
{
  "id": "evt_1711270000000_a1b2c3d4e",
  "user_id": "user_123",
  "nome": "Reunião de Planejamento",
  "data": "2026-03-23",
  "descricao": "Discussão sobre objetivos",
  "startTime": "09:00",
  "endTime": "10:00",
  "participantes": ["Maria", "João"],
  "criado_em": "2026-03-23T10:30:00.000Z",
  "atualizado_em": "2026-03-23T10:30:00.000Z"
}
```

## 🧪 Testando Localmente

1. **Iniciar a aplicação:**
   ```bash
   npm run dev
   ```

2. **Abrir no navegador:**
   ```
   http://localhost:5173
   ```

3. **Ver eventos de teste:**
   - O MockServer carrega automaticamente 4 eventos
   - Clique em um dia para selecionar um evento
   - Ver detalhes no modal que abre

4. **Teste as funcionalidades:**
   - **Editar:** Clique em "Editar" para modificar nome, descrição, horário e participantes
   - **Deletar:** Clique em "Deletar" para remover o evento
   - **Criar:** Adicione novos eventos com formulário completo
   - **Navegar:** Use setas para ir a outros meses

## 🔍 Inspecionando a Console

Abra o DevTools (F12) e veja as requisições do MockServer:

```
✅ Mock Server inicializado com dados de teste
🚀 Mock Server iniciado
📨 Mock GET /api/eventos?user_id=user_123
... (4 eventos carregados)
```

## 📊 Estrutura de Estado

### Calendar.jsx:
- `currentMonth` - Mês atual
- `currentYear` - Ano atual
- `selectedDate` - Data selecionada
- `eventoSelecionado` - Evento aberto no modal

### useEventos:
- `eventos` - Array de eventos do usuário
- `carregando` - Boolean de carregamento
- `erro` - String do erro (se houver)
- `eventoSelecionado` - Evento aberto atualmente

## 🔐 Segurança & Produção

**NÃO use MockServer em produção!**

Para migrar para um backend real:

1. Substitua as chamadas em `useEventos.js`:
   ```javascript
   // De:
   const resposta = await mockServer.getEventosPorUsuario(userId);
   
   // Para:
   const resposta = await fetch(`/api/eventos?user_id=${userId}`)
     .then(r => r.json());
   ```

2. Configure endpoints da API

3. Remova arquivo `mockServer.js`

## 📝 Próximos Passos

- [ ] Integrar com backend real
- [ ] Adicionar autenticação
- [ ] Criar formulário para adicionar novos eventos
- [ ] Filtros e busca de eventos
- [ ] Notificações e lembretes
- [ ] Sincronização com Google Calendar/Outlook
- [ ] Temas escuros/claros

## 🎨 Visuais e Campos

O layout agora exibe eventos por data, sem associar cores individuais aos eventos.
Os eventos incluem `startTime`, `endTime` e `participantes`.

## 💡 Dicas

1. **Inspecione localStorage:**
   ```javascript
   // No DevTools console:
   JSON.parse(localStorage.getItem('mock_eventos'))
   ```

2. **Limpe dados de teste:**
   ```javascript
   // No DevTools console:
   localStorage.removeItem('mock_eventos')
   window.location.reload()
   ```

3. **Adicione mais eventos de teste** em `mockServer.js` na função `inicializarDadosMock()`

---

**Desenvolvido com React + Vite + CSS puro**
