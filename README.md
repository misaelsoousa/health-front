# Health Front

Frontend Angular para gerenciamento de pacientes e exames de uma aplicacao de saude.

O projeto possui uma area administrativa com dashboard, listagem paginada, filtros, cadastro,
edicao, exclusao e exportacao de dados em CSV/XLSX.

## Tecnologias

- Angular 21
- Angular SSR
- TypeScript
- Tailwind CSS 4
- RxJS
- ExcelJS
- Maskito
- Vitest / Angular unit test builder

## Funcionalidades

- Dashboard com indicadores e graficos resumidos.
- Cadastro, edicao, exclusao, busca e paginacao de pacientes.
- Cadastro, edicao, exclusao, filtros e paginacao de exames.
- Mascaras e validacao de CPF/telefone.
- Exportacao de pacientes e exames em CSV e XLSX.
- Layout compartilhado com sidebar e componentes reutilizaveis.

## Estrutura principal

```text
src/
  app/
    core/
      api/                # Base URL e endpoints da API
      services/           # Servico HTTP compartilhado
    pages/
      dashboard/          # Tela inicial com indicadores
      patients/           # CRUD e filtros de pacientes
      exams/              # CRUD e filtros de exames
    shared/
      components/         # Componentes reutilizaveis
      layouts/            # Layout principal da aplicacao
      masks/              # Mascaras de campos
      services/           # Servicos compartilhados, como exportacao
      validators/         # Validadores e diretivas
```

## Pre-requisitos

- Node.js 20 ou superior
- npm 10 ou superior

O projeto usa `npm` como gerenciador de pacotes.

## Instalacao

Instale as dependencias:

```bash
npm install
```

## Configuracao da API

A aplicacao consome a API a partir da base `/api`, definida em:

```text
src/app/core/api/api-base-url.ts
```

Os endpoints usados pelo frontend estao em:

```text
src/app/core/api/api-endpoints.ts
```

Rotas esperadas:

- `GET /api/pacientes`
- `GET /api/pacientes/:cpf`
- `POST /api/pacientes`
- `PUT /api/pacientes/:id`
- `DELETE /api/pacientes/:id`
- `GET /api/exames`
- `GET /api/exames/:id`
- `POST /api/exames`
- `PUT /api/exames/:id`
- `DELETE /api/exames/:id`

Para rodar localmente, a API deve estar acessivel no mesmo host usando o prefixo `/api`, ou o
ambiente deve ter um proxy/reverse proxy apontando `/api` para o backend.

## Rodando em desenvolvimento

Inicie o servidor local:

```bash
npm start
```

Depois acesse:

```text
http://localhost:4200
```

O Angular recarrega a aplicacao automaticamente quando arquivos do projeto sao alterados.

## Build de producao

Gere os arquivos de producao:

```bash
npm run build
```

Os artefatos serao criados em:

```text
dist/health-front/
```

## Rodando o build SSR

Depois de executar o build, inicie o servidor SSR:

```bash
npm run serve:ssr:health-front
```

## Testes

Execute os testes unitarios:

```bash
npm test
```

## Scripts disponiveis

| Script | Descricao |
| --- | --- |
| `npm start` | Inicia o servidor de desenvolvimento Angular. |
| `npm run build` | Gera o build de producao com SSR. |
| `npm run watch` | Gera build em modo watch usando configuracao de desenvolvimento. |
| `npm test` | Executa os testes unitarios. |
| `npm run serve:ssr:health-front` | Sobe o servidor Node gerado pelo build SSR. |

## Observacoes

- O dashboard atual usa dados estaticos no frontend.
- As telas de pacientes e exames dependem da API para listar, criar, atualizar e excluir registros.
- A exportacao em XLSX carrega `exceljs` sob demanda no navegador.
