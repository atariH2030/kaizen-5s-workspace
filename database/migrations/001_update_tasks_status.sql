-- Migração 001: atualização da constraint de status da tabela study_tasks
-- Objetivo: padronizar e permitir os estados do fluxo Kanban
-- Estados válidos: 'Pendente', 'Em Andamento', 'Concluído'

BEGIN;

-- 1) Corrige dados legados (Concluída -> Concluído)
UPDATE public.study_tasks
SET status = 'Concluído'
WHERE status = 'Concluída';

-- 2) Remove constraint antiga (se existir)
ALTER TABLE public.study_tasks
DROP CONSTRAINT IF EXISTS study_tasks_status_check;

-- 3) Recria constraint com os novos estados válidos
ALTER TABLE public.study_tasks
ADD CONSTRAINT study_tasks_status_check
CHECK (status IN ('Pendente', 'Em Andamento', 'Concluído'));

COMMIT;
