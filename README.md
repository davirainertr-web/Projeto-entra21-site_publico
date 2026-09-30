# TexCiclo — Site Público / Demonstração

Esta versão foi preparada para o deploy no Render com Spring Boot, Java 21 e PostgreSQL.

## Modo de demonstração

Quando o visitante entra em um dos três perfis de demonstração, os lotes e solicitações não são gravados no PostgreSQL. O fluxo da demonstração usa `localStorage` do próprio navegador.

Isso significa que:
- um celular/computador não recebe os lotes cadastrados em outro;
- Indústria, ONG e Microempresa podem trocar de perfil no mesmo navegador e compartilhar a mesma demonstração local;
- outro navegador/dispositivo começa com uma demonstração independente;
- os dados locais podem desaparecer se o usuário limpar os dados do navegador.

## Taxa de monetização

Nas vendas, a indústria informa o valor que deseja receber. O sistema aplica uma taxa de operação de 10% e mostra o valor final para a microempresa.

Exemplo:
- valor informado pela indústria: R$ 100,00
- taxa de 10%: R$ 10,00
- valor final: R$ 110,00

A taxa não é aplicada a doações.

## Render

Environment Variables:
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `PUBLIC_BASE_URL`

O projeto não precisa de um arquivo `.env` no GitHub.
