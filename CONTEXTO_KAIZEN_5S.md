# Contexto do Projeto: Kaizen 5S - Plataforma de Produtividade e Finanças

## 1. Visão Geral
Atue como um Desenvolvedor Sênior. Estamos construindo o MVP do "Kaizen 5S", uma plataforma Web de produtividade focada em **Estudos** e **Finanças Pessoais**, com forte aplicação de Gamificação.
O objetivo é resolver a "síndrome da página em branco" de ferramentas como o Notion. O sistema não permite que o usuário crie bagunça. A interface oferece templates fixos, gamificação (pontos/moedas por tarefas concluídas) e integração com o Google Drive do usuário.

## 2. Arquitetura e Stack Tecnológico
* **Padrão:** Cliente-Servidor (API REST separada do Front-end).
* **Regra de Ouro:** Utilizar estritamente tecnologias estáveis e versões LTS (Long Term Support). Zero adoção de ferramentas "bleeding edge" sem análise de breaking changes.
* **Back-end sugerido:** Python (frameworks como FastAPI ou Django, devido à sintaxe limpa e estabilidade) com banco de dados relacional.
* **Front-end Web:** Foco em responsividade, acessibilidade e carregamento rápido.

## 3. Regras de Negócio: Os 5S Aplicados ao Código
Ao gerar código, modelos de banco de dados ou componentes visuais, respeite as seguintes regras do 5S:

* **1S - Seiri (Senso de Utilização):** Implementar rotinas de arquivamento. Dados e notas não acessados há mais de 6 meses devem ser movidos para "Arquivo Morto" no banco de dados, aliviando o front-end.
* **2S - Seiton (Senso de Organização):** A interface deve ter "atrito zero". Ações principais (como adicionar um gasto ou marcar um estudo como concluído) devem exigir no máximo 2 cliques.
* **3S - Seiso (Senso de Limpeza):** Componentes UI minimalistas (Dark/Light mode). O usuário não pode poluir a tela. Elementos visuais extras são desbloqueados via "moedas" na loja do sistema.
* **4S - Seiketsu (Senso de Padronização):** Templates blindados. O usuário não pode alterar a estrutura de tabelas ou colunas de finanças/estudos, apenas preencher dados.
* **5S - Shitsuke (Senso de Disciplina):** Motor de gamificação. Cada endpoint de conclusão de tarefa (ex: `POST /api/tarefas/concluir`) deve disparar um evento que calcula e adiciona "moedas" e "pontos de experiência" ao perfil do usuário.

## 4. Escopo do MVP (Versão 1.0)
1.  **Módulo de Autenticação:** Login, preferencialmente com integração Google.
2.  **Módulo de Finanças:** Dashboard fixo para controle de entrada/saída simplificado.
3.  **Módulo de Estudos:** Dashboard com cronograma, matérias e link direto (href) para pastas do Google Drive do usuário.
4.  **Gamificação Core:** Sistema de saldo de moedas, pontuação por tarefas e sistema de "amizades" simples via ID de usuário para ranking. (Customização de Avatar 3D e APIs de câmbio/clima estão fora do MVP).

## 5. Diretriz de Interação (Copilot)
Sempre que eu pedir para criar uma nova feature ou componente, leia este arquivo primeiro. Certifique-se de que o código proposto respeita o isolamento de templates (4S), a performance de cliques (2S) e prioriza estabilidade (LTS).