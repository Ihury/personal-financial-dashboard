# Personal Financial Dashboard

Dashboard pessoal de finanças do Ihury, construído com React + Recharts + Vite.

## Contexto do Projeto

Este é um dashboard interativo para visualizar receitas e despesas pessoais mensais. Os dados vêm de exports do **Organizze** (app financeiro brasileiro) no formato `.xls`, passam por um pipeline de sanitização, e alimentam uma interface React.

## Arquitetura

```
├── src/App.jsx          # Dashboard React (componente principal)
├── src/main.jsx         # Entry point
├── data/
│   ├── transactions.json         # Base de dados sanitizada (fonte do dashboard)
│   └── sanitization-rules.json   # Regras de limpeza (ver abaixo)
├── scripts/
│   └── sanitize.py      # Pipeline de sanitização Python
├── .claude/skills/
│   └── import-movimentacoes/     # Skill para importar novos meses
└── index.html
```

## Como Rodar

```bash
npm install
npm run dev
```

## Pipeline de Dados

O fluxo de importação de novos dados segue estes passos:

1. Ihury exporta as movimentações do Organizze (.xls)
2. A skill `import-movimentacoes` é acionada
3. O script `scripts/sanitize.py` processa o arquivo:
   - Lê todas as abas do .xls (contas e cartões)
   - Remove ruído: transferências internas, transações de teste, pagamentos de fatura duplicados
   - Aplica regras de convivência (Adriano = colega de casa, Ana Júlia = namorada)
   - Limpa descrições para exibição legível
   - Faz merge com `data/transactions.json` deduplicando
4. O dashboard React lê o JSON atualizado

## Regras de Sanitização

As regras estão em `data/sanitization-rules.json`:

- **Transferências internas**: Movimentações entre contas próprias do Ihury são removidas
- **Transações de teste**: Pagamentos de checkout de teste (ex: Pagar.me) são removidos
- **Faturas duplicadas**: Pagamentos de fatura de cartão são removidos porque os gastos individuais já estão listados
- **Adriano (colega de casa)**: Dinheiro que ele manda é para pagar empréstimos ou metade das contas de casa. Sua parte é subtraída da categoria Casa.
- **Ana Júlia (namorada)**: Quando Ihury paga algo pelos dois, ela devolve a parte dela. O valor devolvido é subtraído do gasto original.
- **Estornos**: Pares de cobrança + estorno são cancelados

## Regras de Negócio Importantes

- Moeda: BRL (Real brasileiro)
- Labels: Português brasileiro
- Categorias do Organizze: Casa, Alimentação, Bares e restaurantes, Transporte, Mercado, etc.
- "Casa (sua parte)" = despesas de moradia menos a contribuição do Adriano
- Flash VA = vale alimentação da Zup (entra como receita + sai como despesa de Alimentação)
- Salário vem da Zup I.T.

## Ao Modificar o Dashboard

- Manter estilo clean & minimal (inspiração: Stripe, Linear)
- Usar Recharts para gráficos
- KPIs no topo: Receitas, Despesas, Saldo
- Charts: barra por categoria, donut proporcional, trend semanal
- Tabela de transações com filtro por categoria (clicando nas barras)
- Todas as cores estão no objeto COLORS no App.jsx
