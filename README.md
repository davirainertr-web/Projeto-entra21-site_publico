# TexCiclo — Site Público / Demonstração

Versão independente do TexCiclo preparada para o ambiente público do evento.

## Stack

- Java 21
- Spring Boot
- Thymeleaf
- Spring Data JPA / Hibernate
- PostgreSQL
- Docker
- Render

## Diferenças em relação ao projeto local

- Banco público: PostgreSQL.
- Banco local: continua sendo MySQL no outro repositório.
- Acesso público sem cadastro/login.
- `Acessar plataforma` leva diretamente para `/teste-perfis`.
- Os três perfis são fictícios e entram diretamente na demonstração.
- A indústria pode cadastrar vários lotes.
- Venda e doação continuam separadas pelos perfis.
- Pagamento continua sendo somente uma simulação acadêmica.
- Os dados da demonstração ficam persistidos no PostgreSQL.
- O repositório público não contém credenciais do projeto local.

Veja `DEPLOY_RENDER.md` para o passo a passo de publicação.
