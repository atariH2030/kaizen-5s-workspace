# Migrações de Banco (Supabase)

Este diretório padroniza a evolução do banco via código, reduzindo risco de alterações manuais no painel.

## Estrutura

- `schema.sql`: estado base/documentação do schema.
- `migrations/`: arquivos SQL incrementais versionados.
- `apply-migrations.ps1`: aplica migrações em ordem alfabética.

## Convenção de nomes

Use prefixo numérico crescente:

- `001_update_tasks_status.sql`
- `002_add_profiles_table.sql`
- `003_add_index_study_tasks_user_id.sql`

## Pré-requisitos

1. Supabase CLI instalado (`supabase --version`).
2. Projeto linkado (quando usar remoto):
   - `supabase login`
   - `supabase link --project-ref <SEU_PROJECT_REF>`

## Como aplicar migrações

### Opção recomendada (remoto linkado)

No PowerShell, na raiz do projeto:

- `./database/apply-migrations.ps1 -Linked`

### Opção local (sem --linked)

- `./database/apply-migrations.ps1`

## Fluxo padrão para novas mudanças

1. Escreva o SQL em `database/migrations/` com próximo número.
2. Rode o script de migração.
3. Verifique no Supabase (tabela, constraint, dados e RLS).
4. Atualize o `schema.sql` quando a mudança for definitiva no modelo base.

## Exemplo (migração atual)

Arquivo: `database/migrations/001_update_tasks_status.sql`

Objetivo:

- Corrigir status legado `Concluída` -> `Concluído`
- Recriar constraint para aceitar:
  - `Pendente`
  - `Em Andamento`
  - `Concluído`

## Segurança

- Não use `service_role_key` no front-end.
- Para execução administrativa, prefira Supabase CLI em ambiente local seguro/CI.
