import traceback
from fastapi import Request
from fastapi.responses import JSONResponse
from loguru import logger
from enum import Enum

class ErrorSeverity(Enum):
    CRITICAL = 1  # Falha no sistema, banco de dados fora, queda geral.
    HIGH = 2      # Funcionalidade central quebrada (ex: login, pagamento).
    MEDIUM = 3    # Erros localizados, rotas não encontradas ou links quebrados.
    LOW = 4       # Alertas de validação de dados, entradas ruins do usuário.

class ErrorCategory(Enum):
    PATH_REFERENCE = "Erro de Caminho/Referência"
    DUPLICATION = "Erro de Duplicidade/Conflito"
    MISSING_RETURN_PARAM = "Ausência de Retorno/Parâmetro"
    TIMEOUT = "Atraso na Resposta (> 3s)"
    UNKNOWN_LOGIC = "Erro Lógico Desconhecido"

def _generate_solutions(category: ErrorCategory, exc_str: str) -> list:
    """Gera 5 caminhos/soluções viáveis para evitar loops de correção."""
    solutions = []
    
    if category == ErrorCategory.PATH_REFERENCE:
        solutions = [
            "1. Verifique se o arquivo ou pasta foi renomeado ou movido recentemente.",
            "2. Analise os caminhos relativos e absolutos nos imports do módulo atual.",
            "3. Cheque se a variável de ambiente (PATH) ou o roteador do frontend redireciona para o lugar certo.",
            "4. Limpe o cache do servidor/navegador para garantir que não está servindo uma versão antiga do caminho.",
            "5. Busque por referências fantasma (hardcoded) no código inteiro que não foram atualizadas na refatoração."
        ]
    elif category == ErrorCategory.MISSING_RETURN_PARAM:
        solutions = [
            "1. Valide se a função chamada requer parâmetros obrigatórios (ex: schemas Pydantic) que não foram passados.",
            "2. Verifique se a função está processando um erro silencioso (""swallowing"") e retornando 'None' acidentalmente.",
            "3. Cheque os interceptadores (middlewares) - eles podem estar barrando o objeto antes dele chegar ao destino.",
            "4. Analise a tipagem dos dados: um número sendo passado como string pode invalidar silenciosamente o processamento.",
            "5. Confirme se há blocos try/except que não disparam exceção ou não formatam o retorno corretamente."
        ]
    elif category == ErrorCategory.DUPLICATION:
        solutions = [
            "1. Verifique se você declarou a mesma rota (endpoint) ou função em arquivos diferentes.",
            "2. Analise se há registros duplicados na configuração do banco ocorrendo por falta de chaves únicas (Unique Constraint).",
            "3. Cheque se um evento acionador (Listener/Webhook) está sendo disparado duas ou mais vezes seguidas.",
            "4. Revise injeção de dependências para garantir que classes isoladas não estão sendo recriadas em loop.",
            "5. Faça uma auditoria por nomes de variáveis globais que podem estar sendo sobrescritas por processos paralelos."
        ]
    else:
        solutions = [
            "1. Isole o escopo: desative partes recentes do código para ver se o erro desaparece.",
            "2. Verifique as credenciais e conexões com serviços de terceiros (Firebase, Banco de Dados).",
            "3. Revise as permissões de leitura/escrita do sistema de arquivos.",
            "4. Verifique vazamentos de memória (Memory Leak) ou concorrência assíncrona destrutiva (Race Conditions).",
            "5. Recarregue os pacotes (ex: apague e recrie o ambiente virtual UV) para descartar corrupção de biblioteca."
        ]
    return solutions

def classify_error(exc: Exception):
    """Classifica dinamicamente o erro baseado em regras heurísticas."""
    exc_type = type(exc).__name__
    exc_msg = str(exc).lower()

    if exc_type in ["FileNotFoundError", "ImportError", "ModuleNotFoundError"] or "path" in exc_msg or "not found" in exc_msg:
        return ErrorCategory.PATH_REFERENCE, ErrorSeverity.MEDIUM
    elif exc_type in ["KeyError", "TypeError", "ValueError", "MissingField"] or "required" in exc_msg or "missing" in exc_msg:
        return ErrorCategory.MISSING_RETURN_PARAM, ErrorSeverity.HIGH
    elif exc_type in ["IntegrityError"] or "duplicate" in exc_msg or "already exists" in exc_msg:
        return ErrorCategory.DUPLICATION, ErrorSeverity.HIGH
    
    return ErrorCategory.UNKNOWN_LOGIC, ErrorSeverity.CRITICAL

def setup_error_handling(app):
    """Acopla o monitor automatizado de erros na API base."""
    # Configuração do Logger para salvar num arquivo físico na pasta logs
    logger.add("logs/system_errors.log", rotation="10 MB", retention="30 dias", level="WARNING")

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        category, severity = classify_error(exc)
        solutions = _generate_solutions(category, str(exc))
        
        # Loga de forma estruturada para rápida auditoria
        log_message = (
            f"\n--- NOVO INCIDENTE AUTOMATIZADO ---\n"
            f" Rota Apontada: {request.url.path}\n"
            f" Categoria: {category.value} | Gravidade: {severity.name}\n"
            f" Exceção Bruta: {type(exc).__name__} - {str(exc)}\n"
            f" Traceback Curto: {traceback.format_exc().splitlines()[-2:]}\n"
            f" 5 CAMINHOS DE INVESTIGAÇÃO RECOMENDADOS (Evite Loops!):\n" + "\n".join(solutions)
        )
        
        logger.error(log_message)
        
        # Em produção, as 5 soluções e o traceback NÃO devem ser retornados ao usuário final por segurança.
        # Estamos retornando no JSON para facilitar sua fase de desenvolvimento.
        return JSONResponse(
            status_code=500,
            content={
                "error": "Erro interno do servidor acionado. Nossa equipe (e logs) já receberam o alerta.",
                "automated_diagnostics": {
                    "category": category.value,
                    "severity": severity.name,
                    "investigation_paths": solutions
                }
            }
        )