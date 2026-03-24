# Termos de Uso e Política de Privacidade - Kaizen 5S

## Versão e vigência
- Versão: 1.0
- Última atualização: 23/03/2026
- Este documento explica, de forma objetiva, como a plataforma Kaizen 5S funciona, quais dados são tratados e quais são os seus direitos.

## 1. Recolha e Uso de Dados Mínimos (Minimização de Dados)
No Kaizen 5S, aplicamos o princípio de minimização: recolhemos apenas o necessário para o serviço funcionar.

Dados essenciais tratados:
- Nome: para identificação básica da conta.
- E-mail: para autenticação, recuperação de acesso e comunicações essenciais da conta.
- Dados de progresso: nível, XP e outros indicadores de gamificação para acompanhar evolução de uso.

Como usamos esses dados:
- Criar e manter a sua conta.
- Personalizar a experiência de estudo e produtividade.
- Exibir progresso e métricas da gamificação dentro da plataforma.

Senhas e segurança de autenticação:
- O Kaizen 5S utiliza autenticação via Supabase.
- As senhas não são armazenadas em texto simples.
- A gestão das credenciais segue mecanismos de segurança criptográfica da infraestrutura de autenticação.

## 2. Isolamento e Privacidade por Design (Row Level Security)
Os seus dados são isolados por padrão.

O que isso significa na prática:
- Registos de finanças e tarefas de estudo ficam associados à sua conta.
- Um utilizador não consegue consultar, editar ou apagar dados de outro utilizador.
- Este isolamento é aplicado na base de dados através de políticas de Row Level Security (RLS).

Resultado para o utilizador:
- Privacidade reforçada por arquitetura, e não apenas por interface.
- Blindagem de dados pessoais e operacionais entre contas.

## 3. Geolocalização e APIs de Terceiros
A funcionalidade de clima é opcional e transparente.

Como funciona:
- O navegador pode pedir permissão de localização para mostrar o clima local.
- A consulta meteorológica é feita no lado do cliente (no seu dispositivo) para a API Open-Meteo.
- O Kaizen 5S não grava latitude/longitude nos seus servidores.

Se a localização for negada ou indisponível:
- A plataforma usa um fallback de clima com local padrão (São Paulo) para manter o widget funcional.
- Esta condição pode ser informada no próprio widget.

Sobre terceiros (Open-Meteo):
- Ao usar o widget de clima, pode existir troca técnica de dados com o serviço de meteorologia.
- Recomendamos também a leitura da política do fornecedor da API para detalhes adicionais.

## 4. Integração com Google Drive
A integração com Google Drive é baseada em links fornecidos por si.

Compromissos da plataforma:
- Armazenamos apenas o URL que o utilizador informa para organização de materiais.
- Não há leitura automática do conteúdo interno de ficheiros/pastas do Google Drive.
- Não há sincronização de documentos nem varredura de conteúdo do seu Drive pela plataforma.

## 5. Direitos do Titular (LGPD/RGPD)
Respeitamos os direitos previstos na LGPD (Brasil) e no RGPD (União Europeia), incluindo:

- Acesso: solicitar informação sobre os dados que tratamos.
- Correção: atualizar dados incompletos, inexatos ou desatualizados.
- Portabilidade: exportar os seus dados em formato utilizável.
- Eliminação: pedir apagamento da conta e dos dados associados, observadas obrigações legais aplicáveis.
- Revogação de consentimento: retirar consentimentos opcionais a qualquer momento, quando o tratamento depender deles.

Como exercer os direitos:
- O pedido pode ser feito pelos canais oficiais de suporte da plataforma.
- Podemos solicitar confirmação de identidade para proteger a sua conta.
- Responderemos dentro dos prazos legais aplicáveis.

## 6. Aceite dos Termos
Ao criar conta, iniciar sessão ou continuar a utilizar o Kaizen 5S, declara que:

- Leu e compreendeu estes Termos de Uso e Política de Privacidade.
- Concorda com o tratamento de dados aqui descrito, nos limites da lei.
- Está ciente de que o uso continuado da plataforma após atualizações deste documento representa novo aceite.

## Notas finais de transparência
- Este texto privilegia clareza e objetividade, sem linguagem jurídica excessiva.
- Se alguma cláusula ficar pouco clara, recomendamos contactar o suporte para esclarecimento antes de continuar a usar o serviço.
