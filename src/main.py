from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import time
from loguru import logger
from core.error_handler import setup_error_handling

# Configuração Base da API Kaizen 5S
# FASE INICIAL: Utilizando a versão de lançamento alfa 0.1.0 
app = FastAPI(title="Kaizen 5S API", version="0.1.0")

# Inicia o Sistema Automático de Classificação e Recomendação de Erros (Os 5 Caminhos)
setup_error_handling(app)

# Middleware essencial: Monitorar tempos de resposta para garantir o < 3s,
# Se passar disso, faremos logs automaticamente!
@app.middleware("http")
async def monitor_response_time(request: Request, call_next):
    start_time = time.time()
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    
    # Se a resposta demorar mais de 3 segundos, registrar alerta de risco!
    if process_time > 3.0:
        logger.warning(f"TEMPO LIMITE EXCEDIDO: A rota {request.url.path} demorou {process_time:.2f} segundos!")
        # Aqui, futuramente podemos enviar um e-mail ou disparar um webhook para equipe DevOps.
        
    return response

@app.get("/health")
def api_health_check():
    """Rota para o Load Balancer e Testes verificarem a integridade do sistema."""
    return {"status": "ok", "message": "Estabilidade do Servidor Garantida."}
