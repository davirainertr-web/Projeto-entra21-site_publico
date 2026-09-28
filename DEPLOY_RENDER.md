# Como publicar o TexCiclo no Render

## 1. GitHub

Substitua o conteúdo do novo repositório público pelo conteúdo desta pasta.

Não envie o `.git` do projeto antigo, backups SQL ou arquivos `uploads` gerados localmente.

## 2. Render

1. Entre no Render.
2. Escolha **New → Blueprint**.
3. Conecte o novo repositório do GitHub.
4. Selecione a branch `main`.
5. O Render lerá o `render.yaml`.
6. Confira se serão criados:
   - `texciclo-publico` — Web Service
   - `texciclo-demo-db` — PostgreSQL
7. Confirme o deploy.

O `render.yaml` já conecta automaticamente o Web Service ao PostgreSQL usando as variáveis `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` e `DB_PASSWORD`.

## 3. Depois do deploy

O Render fornecerá uma URL parecida com:

`https://texciclo-publico.onrender.com`

Essa será a URL para o QR Code dos slides.

## 4. Primeiro teste

Abra a URL e confira:

1. Landing page.
2. Botão **Acessar plataforma**.
3. Tela de escolha dos três perfis.
4. Indústria entrando sem login.
5. Cadastro de mais de um lote.
6. ONG vendo somente doações.
7. Microempresa vendo somente vendas.
8. Solicitação.
9. Aceite.
10. Pagamento simulado.
11. PIN/retirada.
12. Atualização dos kg na landing page.

## 5. Atenção ao plano Free

A documentação atual do Render informa que o Web Service Free pode dormir depois de 15 minutos sem tráfego e demora cerca de um minuto para acordar. O PostgreSQL Free atualmente expira depois de 30 dias, não 90 dias. Há uma carência adicional de 14 dias para upgrade antes da exclusão do banco. Portanto, para uma apresentação em outubro, o banco precisa ser criado em uma data que cubra o evento ou ser atualizado para um plano pago antes da expiração.

Além disso, o filesystem do Web Service Free é efêmero. O PostgreSQL mantém os dados dos lotes e solicitações, mas imagens enviadas e PDFs gerados em `uploads/` podem ser perdidos quando o serviço reinicia, dorme ou é redeployado. Se esses arquivos precisarem sobreviver a reinícios, será necessário usar armazenamento persistente/externo ou um serviço pago com Persistent Disk.
