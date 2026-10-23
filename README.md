# volta. — catálogo de MacBooks seminovos

Protótipo de loja de MacBooks seminovos com catálogo por unidade física, comparação compartilhável, visualização 3D ilustrativa, reservas temporárias e administração privada para **até dois administradores ativos**. A marca **volta.** é provisória.

## Stack

- **Next.js 16**, React 19, TypeScript e Tailwind CSS 4, com CSS próprio e ícones Lucide.
- **Supabase**: PostgreSQL (RLS), Auth com segundo fator TOTP e Storage de fotos.
- Um único projeto, com rotas públicas `/`, `/encontre-seu-mac`, `/catalogo`, `/comparar`, `/macbooks/[slug]`, `/reserva/[token]` e área privada `/admin`.

## Rodar agora (modo demonstração)

No terminal, abra a pasta `macbook-store` e execute:

```powershell
npm install
npm run dev
```

Visite `http://localhost:3000` para ver a landing page e o catálogo de demonstração. **Todos os dados de aparelhos, preços, estado, bateria, garantia e imagens nesse modo são exemplos fictícios.** Não há login de demonstração. A área administrativa exige um Supabase configurado.

Para conhecer a aparência do dashboard sem autenticação, abra `/admin/previa`. Essa prévia é pública, somente leitura e usa apenas dados fictícios locais. Ela não consulta o banco nem permite cadastrar ou editar unidades. O painel real em `/admin` continua exigindo conta autorizada e segundo fator.

## Ativar banco, fotos e os dois administradores

1. Crie um projeto no [Supabase](https://supabase.com/dashboard). Aguarde o banco estar pronto.
2. Abra **SQL Editor** e execute, nesta ordem, [`202610190001_initial.sql`](supabase/migrations/202610190001_initial.sql), [`202610190002_atomic_product_save.sql`](supabase/migrations/202610190002_atomic_product_save.sql), [`202610200001_reservations.sql`](supabase/migrations/202610200001_reservations.sql) e [`202610210001_finance.sql`](supabase/migrations/202610210001_finance.sql). A primeira cria as tabelas, modelos, armazenamento, RLS e auditoria; a segunda instala o salvamento transacional; a terceira instala reservas e proteção do estoque; a quarta instala o caixa, a carteira CSSBuy, as compras e o histórico financeiro. Em um projeto já migrado, aplique apenas os arquivos ainda não executados. **Não execute migrações no banco de produção sem revisão e autorização.**
3. Em **Authentication → Providers/Email** ou nas configurações de Auth correspondentes à versão do painel, **desative o cadastro público de novos usuários**. Convide apenas você e seu sócio em **Authentication → Users**. Configure os e-mails e as senhas pelos fluxos do Supabase.
4. Na listagem de usuários autenticados, copie os dois UUIDs. Execute este comando no **SQL Editor**, substituindo os UUIDs pelos reais:

   ```sql
   insert into public.admin_users (user_id)
   values ('UUID-DO-ADMIN-1'), ('UUID-DO-ADMIN-2');
   ```

   **Nunca** crie contas de administrador por um formulário público. A tabela restringe a dois administradores ativos.
5. Copie `.env.example` para `.env.local` e preencha com a URL e a **chave pública/anon** do Supabase. A chave privada `SUPABASE_SERVICE_ROLE_KEY` é necessária apenas para reservas e deve permanecer exclusivamente no ambiente do servidor. Opcionalmente, configure o WhatsApp no formato `55DDDNÚMERO`, apenas dígitos. **Nunca exponha chaves privadas com prefixo `NEXT_PUBLIC_` ou as registre no Git.**
6. Reinicie `npm run dev`, entre em `http://localhost:3000/admin/login`, autentique-se e configure o **segundo fator TOTP** com um aplicativo autenticador. Cada administrador precisará concluir essa etapa.
7. Acesse **Compras** para registrar um Mac assim que for adquirido, inclusive antes de receber fotos ou ficha técnica. Em **Financeiro**, configure os saldos iniciais e registre os pagamentos. Depois, use **Modelos** e **Nova unidade** para cadastrar as fotografias e especificações, vinculando a unidade à compra correspondente. Selecione **Publicado no catálogo** e salve.

Assim que as variáveis do Supabase estão configuradas, o site deixa de usar os produtos demonstrativos e passa a consultar **exclusivamente os produtos publicados** no banco. O catálogo pode ficar vazio até que a primeira unidade real seja cadastrada.

## Fluxos implementados

A vitrine utiliza branco, cinza, grafite e azul, tipografia do sistema e fotografias editoriais identificadas. Há temas **claro, escuro e automático**, com preferência local persistida e acompanhamento do tema do sistema no modo automático. Os seis cards demonstrativos usam imagens ilustrativas; produtos reais usam a primeira fotografia cadastrada. Filtros e comparação são representados na URL para permitir compartilhamento e navegação Voltar/Avançar.

### Visualização 3D

Cada ficha e a abertura da home oferecem um modelo **GLB preexistente**, carregado com `GLTFLoader` e exibido por Three.js. A referência usada é [`macbook-16.glb`](public/models/macbook-16.glb), distribuída via [wistant/landing-macbook](https://github.com/wistant/landing-macbook). Os metadados originais dos dois GLBs identificam o modelo de MacBook Pro de 16 polegadas de **jackbaeten, sob CC BY 4.0**; o nome `macbook-14.glb` não comprova uma representação distinta de 14 polegadas. Os créditos e a origem estão em [`ATTRIBUTION.md`](public/models/ATTRIBUTION.md). A licença MIT do projeto intermediário permanece em [`LICENSE-wistant.txt`](public/models/LICENSE-wistant.txt), sem substituir os créditos do modelo. **Nenhum modelo 3D é gerado proceduralmente por este projeto.**

O estúdio 3D usa reflexos de ambiente e duas opções de iluminação, quatro perspectivas com transições suaves, rotação automática opcional, controles de zoom e modo ampliado com fechamento por Escape. As setas do teclado giram ou aproximam o modelo. O enquadramento se adapta ao espaço disponível; a renderização ocorre sob demanda e pausa fora da tela ou com a aba oculta. A preferência por movimento reduzido desativa transições e rotação automática. Falhas de WebGL ou de carregamento apresentam uma opção de tentar novamente.

Os GLBs utilizam compressão Draco. O `DRACOLoader` usa os decodificadores locais em `public/draco/`, copiados da distribuição instalada do Three.js e acompanhados da licença Apache 2.0. O carregamento do modelo não depende de um CDN externo.

**O modelo é ilustrativo: não é um escaneamento, laudo técnico ou reprodução das marcas de uso da unidade.** A referência atual é um MacBook Pro; nas fichas de Air, essa diferença aparece explicitamente. Fotografias reais e observações cadastradas continuam sendo a referência de conservação. Produtos reais com fotos abrem pela galeria; os demonstrativos abrem pelo 3D. O código do visualizador é carregado apenas quando necessário.

### Comparação e compartilhamento

A home inclui uma sequência de perspectivas acionada pela rolagem, com painel fixo, seleção manual de capítulos e retomada após interação livre. O 3D carrega ao se aproximar da tela; conexões com economia de dados exigem ativação manual. A renderização pausa fora da tela. Movimento reduzido desativa mudanças automáticas de câmera e entradas animadas. Há uma fotografia editorial de fallback para falhas de WebGL.

O seletor por atividade e orçamento filtra apenas unidades disponíveis, usando mínimos explícitos de RAM e SSD; mostra a de menor preço e permite comparar até três resultados. São filtros de configuração, não benchmarks ou garantias de desempenho. Os cards usam fotografias cadastradas e uma segunda imagem no hover/foco, quando disponível. Fotografias demonstrativas continuam identificadas como editoriais.

O Mac Finder, disponível em `/encontre-seu-mac`, oferece uma seleção interativa por uso, configuração e orçamento. As informações de seleção são orientativas e não substituem a ficha de cada unidade.

Em `/comparar`, o visitante seleciona até três unidades e confronta preço, disponibilidade, chip, RAM, SSD, tela, ano, bateria, ciclos, conservação, cor, carregador, garantia informada e SKU. A seleção é codificada em `/comparar?ids=ID1,ID2,ID3`; IDs inexistentes são ignorados. A ação de compartilhar usa a API nativa do dispositivo quando disponível, com cópia do link como alternativa. A URL só contém identificadores públicos de produtos.

### Reserva temporária e continuidade comercial

Quando banco e Turnstile estão configurados e a unidade está publicada e disponível, a ficha apresenta um formulário com nome e e-mail e um desafio Cloudflare Turnstile. A rota `POST /api/reservas` valida a origem, o payload e o desafio no servidor; a função transacional `create_reservation` coloca a unidade em `reserved` por **20 minutos**, com idempotência e limites de solicitações. O prazo atual é uma política de produto provisória.

O cliente recebe `/reserva/[token]`, um **link privado de gerenciamento** com contador, status, botão de cancelamento, retorno à ficha e contato contextual pelo WhatsApp. `GET /api/reservas/[token]` atualiza o estado; `DELETE /api/reservas/[token]` cancela a reserva. O token permite consultar e cancelar, portanto deve ser tratado como credencial: não é mostrado em catálogos públicos e a página não deve ser indexada. Nenhum pagamento é capturado; preço, forma de pagamento e entrega são tratados com a equipe.

O PostgreSQL mantém a unidade bloqueada enquanto a reserva está ativa. A função `expire_reservations()` pode ser chamada por uma tarefa **confiável no servidor** para liberar reservas expiradas, e a leitura/criação de reservas também regulariza estados expirados quando necessário. Não existe cron de produção configurado neste protótipo. A administração não pode vender, liberar ou excluir unidades com reserva ativa sem antes cancelá-la. A tabela de clientes permanece privada via RLS e permissões de banco.

Para habilitar o fluxo, configure no `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
TURNSTILE_SECRET_KEY=...
RESERVATION_HASH_SECRET=...
```

No painel Cloudflare, crie um widget Turnstile para os domínios exatos usados pela loja, incluindo o domínio de desenvolvimento caso necessário. Use um segredo aleatório de alta entropia para `RESERVATION_HASH_SECRET` (por exemplo, 32 bytes aleatórios convertidos em hexadecimal) e mantenha-o estável entre instâncias. A verificação de hostname é feita no backend. Se faltar alguma dessas configurações, o site desativa a reserva online e mantém a consulta comercial. A disponibilização das chaves, domínio e migração no Supabase real exige validação antes do lançamento.

### Privacidade e páginas institucionais

As rotas `/privacidade`, `/termos`, `/trocas-e-devolucoes` e `/cookies` incluem textos preliminares identificados como documentos em preparação. Complete a identificação do responsável, atendimento e condições comerciais antes do lançamento. `NEXT_PUBLIC_PRIVACY_EMAIL` configura o contato para pedidos sobre dados pessoais; `NEXT_PUBLIC_WHATSAPP_NUMBER` configura o contato comercial.

O aviso de cookies é informativo, pois não há rastreamento publicitário configurado. “Entendi” grava apenas uma preferência local. O catálogo pode ser navegado sem cadastro; o login administrativo usa cookies técnicos do Supabase quando configurado.

| Área | Funcionalidade |
| --- | --- |
| Landing | Seção principal, diferenciais, destaques, perguntas frequentes e chamadas para o catálogo. |
| Catálogo | Pesquisa; filtros por Air/Pro, chip, RAM, preço máximo, bateria mínima e disponibilidade; ordenação e URL compartilhável. |
| Produto | Galeria de fotos, preço, SKU, ficha técnica, bateria, ciclos, data de inspeção, estado, carregador, garantia e contato. |
| Comparador | Seleção de até três unidades, tabela comparativa e link compartilhável. |
| Reserva | Formulário protegido, bloqueio temporário do estoque, acompanhamento, cancelamento e WhatsApp contextual. |
| Aparência | Tema claro, escuro e automático, salvo localmente. |
| Mac Finder | Sugestões de unidades a partir do uso e orçamento, integradas ao catálogo. |
| Dashboard | Indicadores de estoque e financeiros; lista de unidades; criação e edição; publicação/rascunho/arquivo; status disponível/reservado/vendido. |
| Cadastro | Campos individuais por aparelho; modelos reutilizáveis; fotos reais em Storage; custo privado calculado a partir dos lançamentos quando vinculado. |
| Compras | Registro da aquisição antes do anúncio, status de transporte, referência CSSBuy, custos acumulados e vínculo posterior à unidade. |
| Financeiro | Caixa em reais, carteira CSSBuy em yuan, entradas e saídas, custos por Mac, histórico e estornos. |
| Segurança | Lista de dois administradores, autenticação por senha + TOTP, checagem no servidor, RLS e registro de mudanças. |

O salvamento da unidade usa a função `save_product_with_details`: produto, bateria, custo e vínculos das fotos são confirmados na mesma transação PostgreSQL. Os arquivos de imagem são enviados antes da transação; se houver erro confirmado, o servidor tenta limpá-los. A exclusão de imagens remove primeiro o vínculo no banco, e depois o arquivo, para evitar links públicos quebrados. Uma falha na limpeza do Storage pode deixar um arquivo órfão; o erro é registrado no servidor para correção administrativa.

Cada MacBook físico é um registro próprio, mesmo quando compartilha o mesmo modelo com outro aparelho. A página pública nunca consulta `product_financials`.

### Financeiro da operação

No primeiro acesso a `/admin/financeiro`, informe o **caixa disponível em reais**, o **saldo atual em yuan na CSSBuy** e quanto foi pago em reais para formar esse saldo. Esse é o ponto de partida; não é necessário reconstruir compras antigas. Caso precise ajustar os valores de abertura antes de lançar movimentos, utilize **Corrigir saldo** no histórico.

Use `/admin/compras` para registrar cada Mac assim que for adquirido. Cada recarga da CSSBuy registra os reais debitados e os yuan creditados: essa recarga transfere capital entre os saldos e **não constitui custo de aparelho**. As compras e fretes pagos em yuan podem ser vinculados à aquisição; o sistema converte esses pagamentos para reais pelo custo médio efetivo das recargas. Taxas, reparos e outros gastos em reais também podem ser vinculados à compra.

Registre uma venda **somente quando o valor real for recebido**. Marcar a unidade como vendida no estoque não cria entrada financeira automática. O histórico mantém data, descrição e compra relacionada de cada lançamento. Para corrigir um movimento, faça um estorno com justificativa e lance o valor correto, preservando a auditoria. O sistema impede saldos negativos. Todas essas informações exigem autenticação administrativa e segundo fator TOTP e são mantidas fora das páginas públicas.

O módulo financeiro é manual: não importa extratos bancários e não sincroniza a CSSBuy. O custo privado de uma unidade vinculada deriva dos pagamentos associados; unidades antigas sem vínculo mantêm seu custo manual.

## Importante antes de lançar

- **Não publique comercialmente com dados de demonstração**. Substitua a marca e as fotos ilustrativas; confirme os dados de estoque, garantias, preço e observações de cada unidade. Valide as licenças e direitos de uso dos GLBs e fotografias na distribuição final.
- O site possui `robots: noindex` por ser um protótipo. Remova isso do `src/app/layout.tsx` somente quando a loja real estiver pronta, com domínio, título e informações comerciais definidos.
- O WhatsApp é opcional; sem número configurado, o botão de consulta **copia uma mensagem** para o cliente usar. Configure `NEXT_PUBLIC_WHATSAPP_NUMBER` para abrir diretamente a conversa.
- O controle administrativo está em `/admin` dentro da mesma aplicação. Um subdomínio `admin.seudominio.com.br` pode ser configurado na etapa de publicação com regras de roteamento e DNS.
- O cadastro de fotos aceita no máximo 8 arquivos por unidade, 5 MB cada. A primeira imagem enviada é a principal. É possível acrescentar e excluir imagens pelo painel; arrastar para reordenar ficará para a próxima etapa.
- Ainda não existem checkout com pagamento, cálculo automático de frete, emissão fiscal, textos jurídicos definitivos nem recuperação administrativa de contas. Esses itens exigem integrações e decisões comerciais próprias. **Reservar não equivale a comprar ou pagar.**
- A autenticação, o banco e o Storage foram implementados, mas **as quatro migrações, o segundo fator, a gravação, as reservas e as operações financeiras precisam ser validados no projeto Supabase real** após a configuração de credenciais e administradores. Não há credenciais embutidas no repositório.

## Comandos de verificação

```powershell
npm run lint
npx tsc --noEmit
npm run build
npm run test:db
npm audit --omit=dev --audit-level=high
```

`npm run test:db` inicializa um PostgreSQL isolado (PGlite) e aplica as quatro migrações para testar autorização, TOTP/AAL2, limite de administradores, catálogo público, custos privados, auditoria, transações, rollback, fotografias, idempotência de reservas, cancelamento, expiração, proteção do estoque, caixa, recargas, compras, custos e estornos. O teste substitui apenas a declaração de `pgcrypto`, pois PGlite não inclui a extensão e o PostgreSQL de teste já fornece `gen_random_uuid()`. Os esquemas `auth` e `storage` usados pelo Supabase são representados por estruturas mínimas. **Isso valida regras locais do PostgreSQL, mas não substitui testes de concorrência em conexões independentes nem uma integração com Auth, Storage, Turnstile e RLS no Supabase real.**

## Estrutura principal

```text
src/app/page.tsx                  landing page
src/app/encontre-seu-mac/         Mac Finder
src/app/catalogo/page.tsx         catálogo
src/app/macbooks/[slug]/page.tsx  página individual
src/app/comparar/page.tsx          comparação compartilhável
src/app/reserva/[token]/page.tsx   status e cancelamento de reserva
src/app/api/reservas/             endpoints de reserva
src/app/admin/page.tsx            estoque privado
src/app/admin/compras/            registro de compras
src/app/admin/financeiro/         caixa, CSSBuy e histórico
src/app/admin/novo/               cadastro
src/app/admin/[id]/               edição
src/app/admin/modelos/            modelos de referência
src/app/admin/seguranca/          segundo fator
src/app/admin/actions.ts          mutações autenticadas
src/lib/products.ts               consulta pública
src/lib/reservations.ts           Turnstile e acesso privado às reservas
src/lib/finance.ts                cálculos e operações financeiras
src/components/macbook-3d.tsx     visualizador de GLBs preexistentes
src/lib/auth.ts                   autorização
supabase/migrations/              schema, políticas e auditoria
scripts/verify-db.mjs             testes locais de integração PostgreSQL
```

## Identidade visual e imagens

O nome **volta.** e os textos editoriais são propostas iniciais. As quatro fotografias locais são imagens de referência do Unsplash (apenas para apresentação do protótipo) e **não representam o estoque**. As antigas ilustrações `demo-001-3d.png` a `demo-006-3d.png` foram preservadas em disco, mas os cards agora usam as fotografias cadastradas. O modelo GLB é de jackbaeten (CC BY 4.0), distribuído via Wistant; os avisos de ambas as origens estão preservados. Antes de comercializar, cadastre fotografias reais pelo dashboard e confirme os direitos de uso de todas as imagens editoriais e dos arquivos 3D específicos.
