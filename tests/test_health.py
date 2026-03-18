import pytest
from fastapi.testclient import TestClient
import time
import sys
import os

# Adiciona o dretório src na variável de ambiente (PATH) para acessar os módulos
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))
from main import app

client = TestClient(app)

def test_api_health():
    """Garante que a API não caiu via código HTTP 200"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "message": "Estabilidade do Servidor Garantida."}

def test_response_time_under_3_seconds():
    """Garante de que a promessa ao usuário final de 3 segundos ocorra"""
    start_time = time.time()
    
    response = client.get("/health")
    
    end_time = time.time() - start_time
    assert end_time < 3.0, f"Falha de arquitetura: A API demorou {end_time:.2f} segundos, excedendo o limite de 3 segundos!"