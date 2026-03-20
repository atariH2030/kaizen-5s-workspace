import os
from supabase import create_client, Client
from dotenv import load_dotenv
from loguru import logger

# Carrega as variáveis de ambiente do arquivo .env
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    logger.error("Credenciais do Supabase ausentes. Verifique o arquivo .env!")
    raise ValueError("Variáveis de ambiente SUPABASE_URL e SUPABASE_KEY não configuradas.")

# Inicializa o cliente do Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ==============================================================================
# CONTEXTO ARQUITETURAL: 4S - Padronização e Segurança (Row Level Security - RLS)
# ==============================================================================
# O Supabase (PostgreSQL) utiliza o RLS para garantir que as requisições 
# oriundas deste cliente (ou do frontend autenticado) só consigam ler, 
# inserir, atualizar ou deletar (CRUD) linhas na tabela que pertençam 
# EXCLUSIVAMENTE ao usuário logado, com base no seu UUID.
#
# Isso impede que o "usuário A" altere os templates de estudos ou as finanças
# do "usuário B", cumprindo nosso Senso de Padronização (4S) com atrito zero 
# no código da API (já que o próprio banco bloqueia acessos indevidos).
# ==============================================================================

def get_supabase_client() -> Client:
    """
    Retorna a instância autenticada do Supabase para uso nos serviços e repositórios.
    """
    return supabase
