# Recém VR — Periodicidade de acompanhamento por criticidade

## Objetivo

Exibir, junto de cada nível de criticidade do Recém VR, a periodicidade de acompanhamento esperada: Alta → 7 dias (semanal), Média → 15 dias (quinzenal), Baixa → 30 dias (mensal).

## Escopo

Somente exibição de texto — nenhuma mudança de dado, de regra de negócio, ou de agendamento automático de acompanhamentos. `RecemVrCriticidade` (`frontend/src/types/recemVr.ts:1`) e o schema do backend não mudam.

## Decisão central

Novo mapa `CRITICIDADE_PERIODICIDADE: Record<RecemVrCriticidade, string>` em `frontend/src/types/recemVr.ts`, ao lado de `CRITICIDADE_LABELS`:

```ts
export const CRITICIDADE_PERIODICIDADE: Record<RecemVrCriticidade, string> = {
  BAIXA: '30 dias · mensal',
  MEDIA: '15 dias · quinzenal',
  ALTA: '7 dias · semanal',
};
```

Reaproveitado em todos os pontos que hoje usam `CRITICIDADE_LABELS`/`CRITICIDADE_COLORS` — não um componente novo, só uma nova fonte de texto consumida pelos componentes existentes.

## Onde aparece

1. **`CriticidadeSelector`** (`frontend/src/components/CriticidadeSelector.tsx`) — cada balão (Baixa/Média/Alta) ganha uma linha extra abaixo do texto descritivo já existente (`opt.desc`, ex: "Cliente em risco"), mostrando a periodicidade correspondente (ex: "7 dias · semanal"), no mesmo estilo `text-xs text-muted-foreground`. O texto atual (`desc`) permanece — é adição, não substituição. Usado tanto na criação (`RecemVrForm.tsx`) quanto na edição inline de criticidade (`RecemVrDetail.tsx`).
2. **Badge de leitura no cabeçalho do Recém VR** (`RecemVrDetail.tsx:177-179`) — texto passa de `{CRITICIDADE_LABELS[rv.criticidade]}` para `{CRITICIDADE_LABELS[rv.criticidade]} · {CRITICIDADE_PERIODICIDADE[rv.criticidade]}`.
3. **Badge estático na aba Solicitação** (`RecemVrDetail.tsx:341-346`, mostrado quando não está editando a criticidade) — mesmo padrão de concatenação.
4. **Badge na listagem de Recém VR** (`RecemVr/index.tsx:204-206`) — mesmo padrão de concatenação.

Formato final do badge: `Alta · 7 dias · semanal` (label existente + periodicidade, separados por " · ").

## Fora de escopo

- Nenhuma lógica de lembrete/agendamento automático de acompanhamento baseada na periodicidade — é só informação textual para orientar a equipe.
- O badge de alerta "Criticidade Alta" com ícone (`RecemVrDetail.tsx:166-170`, mostrado só quando `isAlta`) não muda — é um alerta visual diferente do badge de criticidade em si.

## Verificação

`npm run build` do frontend sem erros; conferência visual (balões mostrando a nova linha, badges com o texto concatenado) por navegador.
