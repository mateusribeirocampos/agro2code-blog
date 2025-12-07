# 📝 Scripts de Publicação

Scripts para automatizar o workflow Obsidian → Astro Blog.

---

## 🚀 publish-post.sh

Script para publicar posts do Obsidian para o blog Astro.

### Uso

```bash
./scripts/publish-post.sh <arquivo.md> [idioma]
```

### Exemplos

```bash
# Publicar post em português (default)
./scripts/publish-post.sh meu-novo-post.md

# Publicar post em português (explícito)
./scripts/publish-post.sh meu-novo-post.md pt

# Publicar post em inglês
./scripts/publish-post.sh my-new-post.md en
```

---

## ⚙️ O que o Script Faz

1. ✅ Verifica se o arquivo existe em `obsidian-vault/Rascunhos/`
2. ⚠️ Avisa se o post está marcado como rascunho (`draft: true`)
3. 📋 Copia o post para `src/content/blog/[idioma]/`
4. 📦 Arquiva o original em `obsidian-vault/Publicados/`
5. 🖼️ Lista imagens encontradas no post
6. 📌 Mostra próximos passos (testar, commit, deploy)

---

## 📁 Estrutura Esperada

```tree
project-astro-blog/
├── obsidian-vault/
│   ├── Rascunhos/          ← Posts em desenvolvimento
│   └── Publicados/         ← Posts já publicados (arquivo)
│
├── src/
│   └── content/
│       └── blog/
│           ├── pt/         ← Posts em português (destino)
│           └── en/         ← Posts em inglês (destino)
│
└── scripts/
    └── publish-post.sh     ← Este script
```

---

## 🔧 Setup Inicial

### 1. Criar Estrutura de Pastas

```bash
mkdir -p obsidian-vault/Rascunhos
mkdir -p obsidian-vault/Publicados
mkdir -p obsidian-vault/Templates
mkdir -p obsidian-vault/Assets
```

### 2. Tornar Script Executável (já feito)

```bash
chmod +x scripts/publish-post.sh
```

### 3. Criar Template de Post

Arquivo: `obsidian-vault/Templates/Blog-Post-Template.md`

```markdown
---
title: 'Título do Post'
description: 'Descrição curta (140 caracteres)'
author: 'Campos'
pubDate: '2025-12-07'
heroImage: '/blog-images/post-image.jpg'
draft: true
---

## Introdução

Conteúdo do post...
```

---

## 📝 Workflow Completo

### 1. Escrever no Obsidian

```bash
# Criar novo post em Rascunhos/
obsidian-vault/Rascunhos/meu-novo-post.md
```

### 2. Publicar com Script

```bash
./scripts/publish-post.sh meu-novo-post.md pt
```

### 3. Testar Localmente

```bash
npm run dev
# Acesse: http://localhost:4321/blog
```

### 4. Commit e Deploy

```bash
git add src/content/blog/pt/meu-novo-post.md
git commit -m "feat: add post meu-novo-post"
git push
```

---

## 🎨 Tratamento de Imagens

O script **não copia imagens automaticamente**. Você precisa:

1. Mover imagens manualmente de `obsidian-vault/Assets/` para `public/blog-images/`
2. Ou configurar CDN e fazer upload

### Exemplo Manual

```bash
# Copiar imagens
cp obsidian-vault/Assets/minha-imagem.jpg public/blog-images/

# Atualizar referência no post
# De: ![alt](../Assets/minha-imagem.jpg)
# Para: ![alt](/blog-images/minha-imagem.jpg)
```

---

## ⚠️ Troubleshooting

### "Arquivo não encontrado"

- ✅ Certifique-se que o arquivo está em `obsidian-vault/Rascunhos/`
- ✅ Use o nome completo com extensão: `post.md`

### "Post marcado como rascunho"

- ✅ Mude `draft: true` para `draft: false` no frontmatter
- ✅ Ou confirme que quer publicar mesmo assim

### Script não executa

- ✅ Rode: `chmod +x scripts/publish-post.sh`
- ✅ Execute do diretório raiz do projeto

---

## 🚀 Futuras Melhorias

- [ ] Copiar imagens automaticamente
- [ ] Converter links `[[wiki]]` para `[markdown]()`
- [ ] Validar frontmatter antes de publicar
- [ ] Upload automático para CDN
- [ ] Gerar commit message automaticamente
- [ ] Notificar quando deploy estiver pronto

---

**Criado em:** 2025-12-07
**Versão:** 1.0
