-- ==============================================================================
-- KAIZEN 5S - SUPABASE SCHEMA E RLS 
-- Executar este script no SQL Editor do painel do Supabase.
-- ==============================================================================

-- Extensão exigida para gerar IDs UUID automaticamente
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. TABELA DE USUÁRIO (users)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, -- Link direto com Módulo Auth do Supabase!
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    nivel INT NOT NULL DEFAULT 1,
    experiencia_xp INT NOT NULL DEFAULT 0,
    moedas_kaizen INT NOT NULL DEFAULT 0,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 2. TABELA DE FINANÇAS (finance_transactions)
-- Inclusão da Regra 1S (Senso de Utilização): is_archived
-- ==========================================
CREATE TABLE IF NOT EXISTS public.finance_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('Entrada', 'Saída')),
    valor DECIMAL(12, 2) NOT NULL,
    categoria TEXT NOT NULL,
    descricao TEXT,
    data_transacao TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_archived BOOLEAN NOT NULL DEFAULT false
);

-- ==========================================
-- 3. TABELA DE MATÉRIAS (study_subjects)
-- Inclusão da Regra 1S: is_archived
-- ==========================================
CREATE TABLE IF NOT EXISTS public.study_subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    nome_materia TEXT NOT NULL,
    link_google_drive TEXT,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 4. TABELA DE TAREFAS (study_tasks)
-- Inclusão da Regra 1S: is_archived
-- ==========================================
CREATE TABLE IF NOT EXISTS public.study_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID NOT NULL REFERENCES public.study_subjects(id) ON DELETE CASCADE,
    -- (Otimização Eng de Dados) O user_id foi incluído aqui para melhoria expressiva de performance nas políticas de RLS e evitar Sub-Query logic
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, 
    descricao_tarefa TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Pendente', 'Concluída')) DEFAULT 'Pendente',
    is_archived BOOLEAN NOT NULL DEFAULT false,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ==============================================================================
-- 4S - SENSO DE PADRONIZAÇÃO: ROW LEVEL SECURITY (RLS)
-- As políticas de RLS blindam o banco e garantem que usuários não possam acessar 
-- ou alterar as tabelas, templates ou registros uns dos outros.
-- ==============================================================================

-- 1º Passo: Habilitar o RLS em todas as tabelas!
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_tasks ENABLE ROW LEVEL SECURITY;

-- Políticas para: users
CREATE POLICY "Users_Select" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users_Update" ON public.users FOR UPDATE USING (auth.uid() = id);
-- Observação: Normalmernte o Trigger de Auth do proprio Supabase é quem faz o INSERT nesta tabela (não o client).

-- Políticas para: finance_transactions
CREATE POLICY "Finance_Select" ON public.finance_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Finance_Insert" ON public.finance_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Finance_Update" ON public.finance_transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Finance_Delete" ON public.finance_transactions FOR DELETE USING (auth.uid() = user_id);

-- Políticas para: study_subjects
CREATE POLICY "Subjects_Select" ON public.study_subjects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Subjects_Insert" ON public.study_subjects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Subjects_Update" ON public.study_subjects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Subjects_Delete" ON public.study_subjects FOR DELETE USING (auth.uid() = user_id);

-- Políticas para: study_tasks
CREATE POLICY "Tasks_Select" ON public.study_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Tasks_Insert" ON public.study_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Tasks_Update" ON public.study_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Tasks_Delete" ON public.study_tasks FOR DELETE USING (auth.uid() = user_id);