# Scripts de Publicacao

Este diretorio concentra o fluxo oficial de publicacao editorial do `agro2code-blog`.

Hoje o projeto assume um vault externo do Obsidian como origem de escrita e o repositorio Astro como destino de publicacao.

## Script principal

O ponto de entrada do fluxo e:

```bash
./scripts/publish-post.sh
```

Esse shell script apenas encaminha os argumentos para `publish-post.mjs`.

## Pre-requisito

O script depende da variavel `OBSIDIAN_VAULT_PATH`.

Ela pode vir:

- do ambiente do shell
- ou do arquivo `.env` local na raiz do repositorio

Exemplo:

```env
OBSIDIAN_VAULT_PATH=/home/mrc/dev/obsidianVaults/astro2code-blog
```

Sem esse valor, o script nao sabe onde encontrar:

- `Templates/`
- `Rascunhos/`
- `Publicados/`

## Estrutura esperada no vault

Dentro do vault configurado, o fluxo usa estas pastas:

```text
<vault>/
  Templates/
  Rascunhos/
  Publicados/
```

Se `Rascunhos/` e `Publicados/` nao existirem, o script cria essas pastas.

## Inicializar templates

Antes de escrever um novo artigo, gere os templates oficiais:

```bash
./scripts/publish-post.sh --init-template pt
./scripts/publish-post.sh --init-template en
```

Isso cria ou atualiza:

- `Templates/Blog-Post-Template-pt.md`
- `Templates/Blog-Post-Template-en.md`

O fluxo correto e:

1. gerar o template oficial
2. duplicar o template
3. salvar a copia em `Rascunhos/`
4. editar frontmatter e conteudo
5. manter `draft: true` enquanto o texto estiver em revisao
6. mudar para `draft: false` apenas quando estiver pronto

## Publicar um rascunho

Para publicar um arquivo em portugues:

```bash
./scripts/publish-post.sh meu-post.md pt
```

Para publicar um arquivo em ingles:

```bash
./scripts/publish-post.sh my-post.md en
```

Observacoes importantes:

- use o nome completo com extensao `.md` ou `.mdx`
- o arquivo precisa existir em `Rascunhos/`
- o `lang` do frontmatter precisa bater com o idioma do comando

## O que o script valida

Antes de copiar qualquer arquivo para `src/content/blog/{lang}/`, o script valida:

- existencia do vault configurado
- existencia do arquivo em `Rascunhos/`
- extensao `.md` ou `.mdx`
- frontmatter YAML
- campos obrigatorios
- campos editoriais nao vazios
- placeholders do template que ainda nao foram trocados
- `draft: false`
- `lang` coerente com o comando
- `pubDate` valido
- `updatedDate` valido quando estiver preenchido
- pelo menos uma tag real em `tags`
- `canonicalSlug` em `kebab-case`
- duplicidade de `canonicalSlug` no idioma de destino
- `portfolioSummary` quando `portfolioFeatured: true`

## O que acontece ao publicar

Quando a validacao passa:

1. o arquivo e lido a partir de `Rascunhos/`
2. ele e copiado para `src/content/blog/{lang}/`
3. o original e movido para `Publicados/`

Depois disso, o post ja passa a fazer parte do site.

## Validacao local apos publicar

Depois da publicacao, valide o site no repositorio:

```bash
npm run dev
```

ou:

```bash
npm run build
```

## Erros comuns

### Arquivo nao encontrado

Revise:

- se o arquivo esta mesmo em `Rascunhos/`
- se voce usou o nome completo com extensao

### Idioma divergente

Revise:

- o argumento do comando (`pt` ou `en`)
- o campo `lang` no frontmatter

### Post ainda em rascunho

Revise:

- se o frontmatter ainda esta com `draft: true`

### Campo editorial invalido

Revise:

- `title`
- `description`
- `category`
- `tags`
- `canonicalSlug`

### updatedDate invalido

Revise:

- se o campo realmente precisa existir
- se existir, use uma data valida

Se o post ainda nao teve atualizacao, prefira remover `updatedDate` em vez de usar string vazia.
