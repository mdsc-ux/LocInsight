# 🛠️ Loc Insight

### Sistema de Gestão e Locação de Equipamentos

**Projeto desenvolvido no contexto do Startup Way — IFPE / Sebrae.**

O **Loc Insight** é uma aplicação web criada para facilitar o gerenciamento de equipamentos e ferramentas disponíveis para locação.

O sistema reúne em um único ambiente informações sobre equipamentos, clientes, aluguéis e manutenções, contribuindo para uma gestão mais organizada e eficiente.

🌐 **[Acessar o sistema](https://loc-insight-rose.vercel.app/)**

---

## 📌 Sobre o projeto

O Loc Insight surgiu da necessidade de melhorar o controle de ferramentas e equipamentos utilizados em atividades como construção civil, jardinagem, limpeza e manutenção.

O projeto busca substituir controles manuais e informações descentralizadas por uma plataforma digital que permita consultar equipamentos, acompanhar sua disponibilidade e registrar movimentações.

A aplicação foi desenvolvida como um **Produto Mínimo Viável (MVP)**, com foco na validação da proposta e na implementação das funcionalidades essenciais.

## 🎯 Objetivos

- Centralizar o cadastro de equipamentos e ferramentas.
- Facilitar a consulta de equipamentos disponíveis.
- Organizar o processo de locação e devolução.
- Manter o histórico de utilização dos equipamentos.
- Registrar manutenções preventivas e corretivas.
- Gerenciar clientes e usuários do sistema.
- Disponibilizar imagens e manuais técnicos dos equipamentos.
- Incentivar boas práticas de utilização e devolução por meio de um sistema de pontos.

## ⚙️ Funcionalidades

### Gestão de equipamentos

Permite cadastrar, consultar, editar e excluir equipamentos, registrando informações como:

- Nome e descrição.
- Categoria.
- Número de série.
- Quantidade.
- Status de disponibilidade.
- Imagem do equipamento.
- Manual técnico em PDF.

Os equipamentos podem apresentar os seguintes estados:

| Status     | Descrição                                |
| ---------- | ---------------------------------------- |
| Disponível | Equipamento disponível para locação      |
| Alugado    | Equipamento vinculado a uma locação      |
| Manutenção | Equipamento temporariamente indisponível |

### Gestão de locações

O sistema permite registrar a locação de equipamentos, associando cada operação a um cliente e a uma previsão de devolução.

Na devolução, é possível registrar a condição do equipamento e atualizar sua disponibilidade.

### Controle de manutenções

Permite registrar serviços realizados nos equipamentos, incluindo tipo de manutenção, descrição, custo, data de início e peças substituídas.

O controle ajuda a acompanhar o histórico de intervenções e identificar equipamentos indisponíveis.

### Gestão de clientes e usuários

O sistema possui funcionalidades de cadastro e consulta de usuários, com identificação de perfis administrativos e clientes.

Também permite consultar informações dos clientes e seus históricos de locação.

### Sistema de pontos

O Loc Insight inclui uma mecânica de pontuação associada à devolução de equipamentos em boas condições.

Os pontos podem ser utilizados em operações de resgate previstas no sistema.

### Imagens e manuais técnicos

Cada equipamento pode possuir uma imagem e um manual de utilização em PDF, permitindo que suas informações sejam consultadas de maneira mais completa.

> O armazenamento definitivo desses arquivos ainda depende de uma solução persistente adequada ao ambiente de hospedagem.

---

## 💻 Tecnologias utilizadas

O projeto foi desenvolvido com as seguintes tecnologias:

| Camada                 | Tecnologias                         |
| ---------------------- | ----------------------------------- |
| Frontend               | React, TypeScript, Vite, HTML e CSS |
| Backend                | Node.js, Express e TypeScript       |
| Banco de dados         | PostgreSQL                          |
| ORM                    | Prisma                              |
| Upload de arquivos     | Multer                              |
| Hospedagem do frontend | Vercel                              |
| Hospedagem do backend  | Render                              |
| Versionamento          | Git e GitHub                        |

## 🏗️ Arquitetura

O Loc Insight utiliza uma arquitetura cliente-servidor, com separação entre interface, API e banco de dados.

```text
             USUÁRIO
                |
                v
       FRONTEND (VERCEL)
        React + Vite
                |
                | Requisições HTTP
                v
        BACKEND (RENDER)
      Node.js + Express
                |
                v
             PRISMA
                |
                v
           POSTGRESQL
```

O frontend é responsável pela interação com o usuário, enquanto o backend processa as requisições e executa as regras de negócio.

O Prisma realiza a comunicação com o PostgreSQL, responsável pelo armazenamento dos dados da aplicação.

## 📂 Estrutura do projeto

```text
LocInsight/
│
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── lib/
│   │   │   └── prisma.ts
│   │   ├── routes.ts
│   │   └── server.ts
│   ├── package.json
│   └── prisma.config.ts
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── uploads/
├── LICENSE
└── README.md
```

## 🚀 Como executar o projeto

### Pré-requisitos

Para executar o projeto localmente, é necessário ter instalado:

- Node.js e npm.
- PostgreSQL.
- Git.
- Um editor de código, como o Visual Studio Code.

### 1. Clonar o repositório

```bash
git clone https://github.com/mdsc-ux/LocInsight.git
cd LocInsight
```

### 2. Configurar o backend

Acesse a pasta do backend:

```bash
cd backend
npm install
```

Crie um arquivo `.env` dentro da pasta `backend`:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/locinsight"

PORT=3000

PUBLIC_API_URL="http://localhost:3000"

ADMIN_EMAIL="admin@locinsight.com"
ADMIN_PASSWORD="defina-uma-senha-segura"

ENABLE_DEMO_SEED=false
```

Substitua os valores de exemplo pelos dados do seu ambiente.

**Nunca publique senhas ou credenciais reais no GitHub.**

### 3. Configurar o banco de dados

Com o PostgreSQL configurado, execute:

```bash
npx prisma generate
npm run db:push
```

Esses comandos geram o cliente Prisma e sincronizam o esquema com o banco de dados.

### 4. Iniciar o backend

```bash
npm run dev
```

Por padrão, o servidor estará disponível em:

```text
http://localhost:3000
```

Para verificar o funcionamento:

```text
http://localhost:3000/health
```

### 5. Configurar o frontend

Abra outro terminal e acesse a pasta do frontend:

```bash
cd frontend
npm install
```

Crie um arquivo `.env` dentro da pasta `frontend`:

```env
VITE_API_URL=http://localhost:3000
```

Inicie a aplicação:

```bash
npm run dev
```

Acesse o endereço local informado pelo Vite.

---

## 🔌 API

A API utiliza respostas JSON e disponibiliza rotas para as principais operações do sistema.

| Método | Endpoint                       | Funcionalidade        |
| ------ | ------------------------------ | --------------------- |
| POST   | `/api/auth/login`              | Login                 |
| GET    | `/api/categories`              | Listar categorias     |
| POST   | `/api/categories`              | Cadastrar categoria   |
| GET    | `/api/equipments`              | Listar equipamentos   |
| GET    | `/api/equipments/:id`          | Consultar equipamento |
| POST   | `/api/equipments`              | Cadastrar equipamento |
| PUT    | `/api/equipments/:id`          | Atualizar equipamento |
| DELETE | `/api/equipments/:id`          | Excluir equipamento   |
| GET    | `/api/users`                   | Listar usuários       |
| POST   | `/api/users`                   | Cadastrar usuário     |
| GET    | `/api/clients`                 | Listar clientes       |
| GET    | `/api/rentals`                 | Listar locações       |
| POST   | `/api/rentals`                 | Registrar locação     |
| POST   | `/api/rentals/:id/return`      | Registrar devolução   |
| GET    | `/api/maintenances`            | Listar manutenções    |
| POST   | `/api/maintenances`            | Registrar manutenção  |
| POST   | `/api/maintenances/:id/finish` | Finalizar manutenção  |

**Endereço do backend:**

[https://locinsight-backend.onrender.com](https://locinsight-backend.onrender.com)

**Verificação da API:**

[https://locinsight-backend.onrender.com/health](https://locinsight-backend.onrender.com/health)

## 🗃️ Banco de dados

O banco PostgreSQL armazena as principais entidades:

- **User:** usuários e clientes.
- **Equipment:** equipamentos cadastrados.
- **Category:** categorias dos equipamentos.
- **Rental:** registros de locações.
- **Maintenance:** registros de manutenção.

Os relacionamentos são gerenciados pelo Prisma ORM.

## ☁️ Hospedagem

O projeto utiliza dois serviços de hospedagem:

**Vercel:** responsável pela disponibilização da interface web.

**Render:** responsável pela execução da API.

O PostgreSQL é utilizado para armazenar os dados estruturados da aplicação.

### Limitações atuais

Por se tratar de um MVP, algumas funcionalidades ainda precisam de melhorias antes de um uso em produção:

- Implementação de autenticação com sessões ou tokens.
- Proteção das rotas administrativas.
- Armazenamento persistente de imagens e PDFs.
- Melhoria das validações e mensagens de erro.
- Testes automatizados.
- Revisão das permissões de acesso.

A configuração atual deve ser considerada um ambiente de demonstração e desenvolvimento.

## 🔮 Melhorias futuras

Entre as possibilidades de evolução do Loc Insight estão:

- Autenticação e autorização por perfil.
- Armazenamento de arquivos em nuvem.
- Relatórios gerenciais.
- Dashboard com indicadores de locação.
- Notificações de devolução.
- Histórico detalhado dos equipamentos.
- Reservas antecipadas.
- Melhorias na experiência do usuário.
- Expansão do sistema de fidelidade e pontos.

## 🎓 Contexto acadêmico

O Loc Insight é um projeto desenvolvido no contexto do **Instituto Federal de Pernambuco (IFPE)**, relacionado às atividades do **Startup Way, em parceria com o Sebrae**.

A proposta integra conhecimentos de desenvolvimento web, banco de dados, programação e empreendedorismo, buscando aplicar soluções tecnológicas a uma necessidade real de gestão.

## 👨‍💻 Desenvolvimento

**Victor Maciel**

**Gabriel Henrique**

**Jorge Lucas**

**Michael Douglas&#x20;**

GitHub: [@mdsc-ux](https://github.com/mdsc-ux)

## 📄 Licença

Este projeto está disponibilizado sob a licença MIT.

Consulte o arquivo [LICENSE](LICENSE) para mais informações.

---

**Loc Insight — Tecnologia para uma gestão de equipamentos mais organizada, acessível e eficiente.**
