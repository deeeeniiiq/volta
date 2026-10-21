# volta. — catálogo de MacBooks seminovos

Primeira versão funcional de um site de revenda com landing page, catálogo pesquisável, páginas individuais e administração privada para **até dois administradores ativos**. A marca **volta.** é provisória.

## Stack

- **Next.js 16**, React 19, TypeScript e Tailwind CSS 4, com CSS próprio e ícones Lucide.
- **Supabase**: PostgreSQL (RLS), Auth com segundo fator TOTP e Storage de fotos.
- Um único projeto, com rotas públicas `/`, `/catalogo`, `/macbooks/[slug]` e área privada `/admin`.

## Rodar agora (modo demonstração)

No terminal, abra a pasta do projeto e execute:

```powershell
npm install
npm run dev
```

Visite `http://localhost:3000` para ver a landing page e o catálogo de demonstração. **Todos os dados de aparelhos, preços, estado, bateria, garantia e imagens nesse modo são exemplos fictícios.** Não há login de demonstração. A área administrativa exige um Supabase configurado.

## Ativar banco, fotos e o primeiro administrador

1. Crie um projeto no [Supabase](https://supabase.com/dashboard). Aguarde o banco estar pronto.
2. Abra **SQL Editor** e execute, nesta ordem, [`202610190001_initial.sql`](supabase/migrations/202610190001_initial.sql), [`202610190002_atomic_product_save.sql`](supabase/migrations/202610190002_atomic_product_save.sql) e [`202610210001_finance.sql`](supabase/migrations/202610210001_finance.sql). A terceira instala o caixa, a carteira CSSBuy, as compras e o histórico financeiro. **Se você já executou as duas primeiras, execute somente a terceira.**
3. Em **Authentication → Providers/Email** ou nas configurações de Auth correspondentes à versão do painel, **desative o cadastro público de novos usuários**. Em **Authentication → Users → Add user → Create new user**, crie a conta do dono com seu e-mail e uma senha exclusiva. Não existe cadastro de visitantes nem de administradores no site.
4. Na listagem de usuários autenticados, copie o UUID da conta criada. Execute este comando no **SQL Editor**, substituindo pelo UUID real:

   ```sql
   insert into public.admin_users (user_id)
   values ('UUID-DO-ADMIN');
   ```

   **Nunca** crie contas de administrador por um formulário público. Para incluir um segundo dono mais tarde, crie outra conta no Supabase e repita o `insert` com o novo UUID. A tabela restringe a dois administradores ativos.
5. Copie `.env.example` para `.env.local` e preencha com a URL e a **chave publishable** do Supabase (Project Connect ou Settings → API Keys). A chave anon antiga continua aceita como alternativa. Opcionalmente, configure o número comercial do WhatsApp no formato `55DDDNÚMERO`, apenas dígitos. **Não coloque a service role/secret key no navegador.**
6. Reinicie `npm run dev`, entre em `http://localhost:3000/admin/login`, autentique-se e configure o **segundo fator TOTP** com um aplicativo autenticador. Cada administrador precisará concluir essa etapa.
7. Acesse **Compras** para registrar um Mac assim que for adquirido. Em **Financeiro**, informe os saldos iniciais e registre pagamentos. Quando a unidade chegar, use **Modelos** e **Nova unidade** para cadastrar fotos e ficha técnica, depois vincule a unidade à compra. O custo privado passa a refletir os pagamentos vinculados.

Assim que as variáveis do Supabase estão configuradas, o site deixa de usar os produtos demonstrativos e passa a consultar **exclusivamente os produtos publicados** no banco. O catálogo pode ficar vazio até que a primeira unidade real seja cadastrada.

## Fluxos implementados

A vitrine utiliza branco, cinza, grafite e azul, com tipografia do sistema e fotografias editoriais identificadas. Os seis cards de demonstração usam prévias renderizadas do visualizador 3D; produtos reais continuam usando a primeira fotografia cadastrada. Os filtros são sincronizados com a URL, inclusive ao usar Voltar e Avançar no navegador.

### Visualização 3D

Cada ficha oferece um modelo procedural em Three.js com acabamentos metálicos, teclado, trackpad, dobradiça e conexões ilustrativas. Há cinco perspectivas, rotação por arraste/toque ou setas, zoom e restauração da câmera. As transições respeitam a preferência por movimento reduzido. O visualizador ajusta o enquadramento à largura disponível, pausa fora da tela e oferece alternativa pelas fotografias quando WebGL está indisponível.

**O modelo é ilustrativo: não é um escaneamento, laudo técnico ou reprodução das marcas de uso da unidade.** Fotografias reais e observações cadastradas continuam sendo a referência de conservação. Produtos reais com fotos abrem pela galeria; os demonstrativos abrem pelo 3D. O código do visualizador é carregado apenas quando necessário.

### Privacidade e páginas institucionais

As rotas `/privacidade`, `/termos`, `/trocas-e-devolucoes` e `/cookies` incluem textos preliminares identificados como documentos em preparação. Complete a identificação do responsável, atendimento e condições comerciais antes do lançamento. `NEXT_PUBLIC_PRIVACY_EMAIL` configura o contato para pedidos sobre dados pessoais; `NEXT_PUBLIC_WHATSAPP_NUMBER` configura o contato comercial.

O aviso de cookies é informativo, pois não há rastreamento publicitário configurado. “Entendi” grava apenas uma preferência local. O catálogo pode ser navegado sem cadastro; o login administrativo usa cookies técnicos do Supabase quando configurado.

| Área | Funcionalidade |
| --- | --- |
| Landing | Seção principal, diferenciais, destaques, perguntas frequentes e chamadas para o catálogo. |
| Catálogo | Pesquisa; filtros por Air/Pro, chip, RAM, preço máximo, bateria mínima e disponibilidade; ordenação e URL compartilhável. |
| Produto | Galeria de fotos, preço, SKU, ficha técnica, bateria, ciclos, data de inspeção, estado, carregador, garantia e contato. |
| Dashboard | Indicadores de estoque e caixa; lista de unidades; criação e edição; publicação/rascunho/arquivo; status disponível/reservado/vendido. |
| Cadastro | Campos individuais por aparelho; modelos reutilizáveis; fotos reais em Storage; custo privado calculado pelo financeiro quando vinculado. |
| Compras | Registro antes do anúncio, etapa de transporte, referência CSSBuy, custo acumulado e vínculo posterior à unidade. |
| Financeiro | Caixa em reais, carteira CSSBuy em yuan, lançamentos pagos/recebidos, histórico com estornos e custos por Mac. |
| Segurança | Lista de dois administradores, autenticação por senha + TOTP, checagem no servidor, RLS e registro de mudanças. |

### Financeiro da operação

No primeiro acesso a `/admin/financeiro`, informe o **caixa disponível em reais**, o **saldo atual em yuan na CSSBuy** e quanto foi pago em reais para formar esse saldo. Esse é o ponto de partida; não é preciso reconstruir compras antigas. Se errar o saldo inicial, use **Corrigir saldo** no histórico antes de registrar qualquer outro movimento.

Use `/admin/compras` para criar uma compra assim que adquirir o Mac, mesmo sem fotos ou ficha técnica. Cada recarga da CSSBuy registra os reais debitados e os yuan creditados: ela transfere capital entre os dois saldos e **não é custo do aparelho**. Depois registre a compra e o frete pagos em yuan, selecionando a compra correspondente. O sistema converte esses pagamentos para reais pelo custo médio efetivo das recargas e os soma ao custo daquele Mac. Taxas, reparos e outros gastos em reais podem ser associados à compra.

Registre uma venda **somente quando o valor real cair na conta**; marcar a unidade como vendida no estoque não cria entrada automática. O histórico guarda entradas e saídas com data, descrição e compra relacionada. Para corrigir um movimento, faça um estorno com motivo e lance o valor correto; o registro original permanece auditável. O sistema bloqueia saldos negativos. Os dados são privados e exigem o mesmo login administrativo com segundo fator.

Esta primeira versão depende de lançamento manual: não importa extratos bancários nem sincroniza a CSSBuy. O custo de uma unidade vinculada é calculado pelos pagamentos registrados no financeiro; unidades antigas sem vínculo conservam o custo manual.
O salvamento da unidade usa a função `save_product_with_details`: produto, bateria, custo e vínculos das fotos são confirmados na mesma transação PostgreSQL. Os arquivos de imagem são enviados antes da transação; se houver erro confirmado, o servidor tenta limpá-los. A exclusão de imagens remove primeiro o vínculo no banco, e depois o arquivo, para evitar links públicos quebrados. Uma falha na limpeza do Storage pode deixar um arquivo órfão; o erro é registrado no servidor para correção administrativa.

Cada MacBook físico é um registro próprio, mesmo quando compartilha o mesmo modelo com outro aparelho. A página pública nunca consulta `product_financials`.

## Importante antes de lançar

- **Não publique comercialmente com dados de demonstração**. Substitua a marca e as fotos ilustrativas; confirme os dados de estoque, garantias, preço e observações de cada unidade.
- O site possui `robots: noindex` por ser um protótipo. Remova isso do `src/app/layout.tsx` somente quando a loja real estiver pronta, com domínio, título e informações comerciais definidos.
- O WhatsApp é opcional; sem número configurado, o botão de consulta **copia uma mensagem** para o cliente usar. Configure `NEXT_PUBLIC_WHATSAPP_NUMBER` para abrir diretamente a conversa.
- O controle administrativo está em `/admin` dentro da mesma aplicação. Um subdomínio `admin.seudominio.com.br` pode ser configurado na etapa de publicação com regras de roteamento e DNS.
- O cadastro de fotos aceita no máximo 8 arquivos por unidade, 5 MB cada. A primeira imagem enviada é a principal. É possível acrescentar e excluir imagens pelo painel; arrastar para reordenar ficará para a próxima etapa.
- Ainda não existem carrinho, pagamentos, cálculo de frete, automação de emissão fiscal, textos jurídicos específicos nem recuperação administrativa de contas. Esses itens exigem configurações comerciais próprias.
- A autenticação, o banco e o Storage foram implementados, mas **as três migrações, o segundo fator e os fluxos de gravação precisam ser validados no seu projeto Supabase** após a configuração de credenciais e administradores. Não há credenciais embutidas no repositório.

## Comandos de verificação

```powershell
npm run lint
npm run build
npm run test:db
npm audit --omit=dev --audit-level=high
```

`npm run test:db` inicializa um PostgreSQL isolado (PGlite) e aplica as três migrações para testar autorização, TOTP/AAL2, limite de administradores, catálogo público, proteção de custos, auditoria, transações, rollback, fotografias, caixa, recargas, custos por compra, estornos e privacidade do histórico. O teste substitui apenas a declaração de `pgcrypto`, pois PGlite não inclui a extensão e o PostgreSQL de teste já fornece `gen_random_uuid()`. Os esquemas `auth` e `storage` usados pelo Supabase são representados por estruturas mínimas. **Isso valida a lógica PostgreSQL, mas não substitui uma integração com Auth, Storage e RLS no projeto Supabase real.**

## Estrutura principal

```text
src/app/page.tsx                  landing page
src/app/catalogo/page.tsx         catálogo
src/app/macbooks/[slug]/page.tsx  página individual
src/app/admin/page.tsx            estoque privado
src/app/admin/novo/               cadastro
src/app/admin/[id]/               edição
src/app/admin/modelos/            modelos de referência
src/app/admin/compras/            compras antes do anúncio
src/app/admin/financeiro/         caixa e histórico financeiro
src/app/admin/seguranca/          segundo fator
src/app/admin/actions.ts          mutações autenticadas
src/lib/products.ts               consulta pública
src/lib/auth.ts                   autorização
supabase/migrations/              schema, políticas e auditoria
scripts/verify-db.mjs             testes locais de integração PostgreSQL
```

## Identidade visual e imagens

O nome **volta.** e os textos editoriais são propostas iniciais. As quatro fotografias locais são imagens de referência do Unsplash (apenas para apresentação do protótipo) e **não representam o estoque**. As seis imagens `demo-001-3d.png` a `demo-006-3d.png` são renderizações do próprio visualizador, utilizadas exclusivamente nos cards demonstrativos. Antes de comercializar, cadastre fotografias reais pelo dashboard e confirme direitos de uso de quaisquer imagens editoriais mantidas na página.
