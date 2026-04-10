---
name: import-movimentacoes
description: >
  Importa e sanitiza movimentações financeiras do Organizze para o dashboard pessoal.
  Use SEMPRE que o Ihury enviar um arquivo .xls de movimentações, mencionar "importar
  movimentações", "atualizar dados", "novo mês", "planilha do Organizze", "adicionar
  transações", "atualizar dashboard", "importar extrato", ou qualquer variação que
  envolva processar dados financeiros novos para o dashboard. Também acione quando ele
  disser coisas como "aqui estão as movimentações de abril", "exportei do Organizze",
  "dados novos", ou simplesmente enviar um arquivo .xls sem contexto (provavelmente
  são movimentações).
---

# Import Movimentações

Skill para importar movimentações do Organizze (.xls) no dashboard financeiro pessoal do Ihury.

## Fluxo de Trabalho

### 1. Receber e Validar o Arquivo

O Ihury vai enviar um arquivo `.xls` exportado do Organizze. Validar que:
- É um arquivo .xls com as colunas esperadas: Data, Descrição, Categoria, Valor, Situação
- Identificar o período (mês/ano) pelo range de datas

### 2. Parsear o Arquivo

Usar o script `scripts/sanitize.py` para parsear:

```bash
python3 scripts/sanitize.py <caminho-do-arquivo.xls> --output data/transactions.json --rules data/sanitization-rules.json --merge
```

Mas ANTES de rodar automaticamente, há um passo de triagem manual que é essencial.

### 3. Triagem de Transações Novas

Isso é o mais importante. Cada mês pode ter novas situações que precisam de regras.
Rodar o parse SEM merge primeiro para inspecionar:

```bash
python3 scripts/sanitize.py <arquivo.xls> --output /tmp/preview.json --rules data/sanitization-rules.json
```

Depois, analisar o resultado e perguntar ao Ihury sobre transações ambíguas. Coisas que precisam de atenção:

#### Transferências entre pessoas
- **Adriano** mora com o Ihury. Dinheiro dele geralmente é metade das contas de casa ou empréstimo devolvido.
- **Ana Júlia** é a namorada. Às vezes paga a parte dela em gastos que o Ihury pagou pelos dois.
- Qualquer outra transferência PIX de valor alto (>R$100) para pessoa física: perguntar.

#### Perguntas que devem ser feitas:
- Para receitas do Adriano: "Quanto é de contas de casa e quanto é empréstimo?"
- Para receitas da Ana Júlia: "Isso é reembolso de algum gasto? Qual?"
- Para pagamentos de fatura grandes: "Essa fatura é dos gastos já listados no cartão, ou é de período anterior?"
- Para transações desconhecidas de valor alto (>R$200): "O que é [descrição]?"
- Para pares que parecem estorno (entrada + saída mesmo valor, mesma data): "Isso se cancela?"

### 4. Atualizar Regras de Sanitização

Com base nas respostas do Ihury, atualizar `data/sanitization-rules.json`:

- Adicionar novos `cancel_pairs` para estornos do mês
- Atualizar `roommate.income_splits` com os novos valores do Adriano
- Atualizar `roommate.loan_entries` se houver novos empréstimos
- Atualizar `partner.reimbursements` com os novos reembolsos da Ana Júlia
- Adicionar novas entradas em `remove_test_transactions` se necessário

### 5. Executar Sanitização Final

Depois de confirmar tudo com o Ihury:

```bash
python3 scripts/sanitize.py <arquivo.xls> --output data/transactions.json --rules data/sanitization-rules.json --merge
```

### 6. Atualizar o Dashboard

O `src/App.jsx` tem os dados hardcoded (MARCH_DATA). Ao importar novos meses:

1. O ideal futuro é que o App.jsx leia de `data/transactions.json` via fetch
2. Por enquanto, o array MARCH_DATA precisa ser atualizado manualmente no App.jsx
3. Ao adicionar meses novos, renomear a const para ALL_DATA e ajustar os labels

### 7. Reportar ao Ihury

Depois de tudo processado, mostrar um resumo:

```
Importação concluída — Abril 2026

Transações: 130 (98 despesas, 32 receitas)
Receitas:   R$10.500,00
Despesas:   R$8.200,00
Saldo:      +R$2.300,00

Top categorias:
  1. Alimentação: R$1.800
  2. Casa (sua parte): R$700
  3. Transporte: R$1.100

Removidas: 15 transações (duplicatas, transferências internas, estornos)
```

## Regras de Ouro

1. **Nunca assuma** — se não tiver certeza sobre uma transação, pergunte.
2. **Dupla contagem é o erro mais comum** — pagamentos de fatura de cartão sempre duplicam os gastos individuais.
3. **Transferências entre contas próprias** (Itaú ↔ Nubank ↔ BTG) devem ser eliminadas.
4. **Rendimentos automáticos** (REND PAGO APLIC AUT MAIS) são receita real, mesmo sendo centavos.
5. **Flash VA** (vale alimentação): entra como receita E sai como despesa — manter ambos.
6. **Salário Zup**: receita principal, sempre manter.
