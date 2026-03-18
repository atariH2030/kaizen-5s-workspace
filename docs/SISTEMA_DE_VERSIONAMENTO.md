# Sistema de Versionamento KAIZEN 5S

Para usar várias IAs (GPT, Claude, Gemini, Copilot) de maneira eficaz sem se perder no que foi construído, precisamos de um sistema de versionamento claro, técnico e de fácil compreensão humana. 

Seguimos a estrutura clássica de 3 dígitos **V[Maior].[Menor].[Correção]**. Nossa plataforma está atualmente na sua primeira etapa de vida (Fase Alpha - 0.1.0).

## Estrutura das Versões

`0.X.X` -> **Fase Inicial (Desenvolvimento / Alpha / Beta):** Período onde estamos criando as fundações. O número 0 na frente indica que a obra ainda não está inaugurada (ainda não 100% pronta para o público). Qualquer erro ou mudança de rotação não afeta os clientes que pagam, porque o produto não foi lançado.

### Mudanças em cada número da versão:

1. **Maior (Major - `X.0.0`) -> Redesenho Total / Mudança Grande:**
   Trata-se de uma reconstrução (Ex: Lançamento do site principal para clientes, mudamos toda a tecnologia).

2. **Menor (Minor - `0.X.0`) -> Novidade Funcional (Feature):**
   Sempre que você criar uma nova tela, um módulo completo, ou conectar ao Firebase, esse número sobe. Exemplo: Saímos de 0.1.0 para 0.2.0 quando integrar o Login Firebase!

3. **Correção (Patch - `0.1.X`) -> Resolução de Bugs e Otimizações:**
   Usado ao corrigir botões quebrados, texto errado ou links fantasmas que uma IA fez. Exemplo: Corrigiu o timeout de banco? Vai para 0.1.1.

## Boas Práticas ao lidar com múltiplas IAs

Sempre que concluir um trabalho isolado com uma IA:
- Insira no topo do prompt (contexto) da próxima IA: *"O projeto atual está na versão 0.X.Y e os últimos recursos incluídos na CHANGELOG foram Z."*
- Atualize seu CHANGELOG para garantir que a IA subsequente não sobrescreva regras recém-acordadas pela IA anterior.
