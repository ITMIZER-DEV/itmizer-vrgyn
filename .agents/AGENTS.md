# Diretrizes de Segurança do Agente (Hardness Rules)

As seguintes regras são restrições comportamentais obrigatórias e devem ser seguidas sem qualquer exceção:

1. **PROIBIDO RESETAR BANCO DE DADOS:**
   - O agente **nunca** deve propor ou executar comandos que realizem o reset de bancos de dados (como `prisma migrate reset`, `db:reset`, scripts de `DROP DATABASE` ou comandos similares).

2. **PROIBIDO APAGAR DADOS DE PRODUÇÃO OU TESTE:**
   - O agente **não deve** executar ou sugerir comandos SQL ou scripts de deleção em massa de dados (`DELETE FROM`, `TRUNCATE TABLE`, etc.) sem o consentimento e aprovação explícita do usuário.
   - Qualquer operação de exclusão deve ser projetada para manter a integridade dos dados existentes.
