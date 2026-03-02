#!/bin/bash

# ========================================================================
# Script de Publicação - Obsidian → Astro Blog
# Data: 2025-12-07
# ========================================================================

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Banner
echo -e "${BOLD}${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║          📝 Obsidian → Astro Blog Publisher                ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

# Verificar se arquivo foi fornecido
if [ -z "$1" ]; then
    echo -e "${RED}❌ Erro: Forneça o nome do arquivo${NC}"
    echo ""
    echo -e "${YELLOW}Uso:${NC}"
    echo "  ./scripts/publish-post.sh <arquivo.md> [idioma]"
    echo ""
    echo -e "${YELLOW}Exemplos:${NC}"
    echo "  ./scripts/publish-post.sh meu-post.md pt"
    echo "  ./scripts/publish-post.sh my-post.md en"
    echo ""
    exit 1
fi

# Configurações
POST_FILE="$1"
LANG="${2:-pt}"  # Default: português
SOURCE_DIR="obsidian-vault/Rascunhos"
DEST_DIR="src/content/blog/$LANG"
ARCHIVE_DIR="obsidian-vault/Publicados"

# Criar diretórios se não existirem
mkdir -p "$SOURCE_DIR"
mkdir -p "$DEST_DIR"
mkdir -p "$ARCHIVE_DIR"

echo -e "${BLUE}📋 Configuração:${NC}"
echo "  Arquivo: $POST_FILE"
echo "  Idioma: $LANG"
echo "  Origem: $SOURCE_DIR/"
echo "  Destino: $DEST_DIR/"
echo ""

# Verificar se arquivo existe
if [ ! -f "$SOURCE_DIR/$POST_FILE" ]; then
    echo -e "${RED}❌ Erro: Arquivo não encontrado${NC}"
    echo "  Procurado em: $SOURCE_DIR/$POST_FILE"
    echo ""
    echo -e "${YELLOW}💡 Dica:${NC} Certifique-se que o arquivo está em:"
    echo "  $SOURCE_DIR/"
    exit 1
fi

echo -e "${GREEN}✓ Arquivo encontrado!${NC}\n"

# Verificar se draft: false
if grep -q "draft: true" "$SOURCE_DIR/$POST_FILE"; then
    echo -e "${YELLOW}⚠️  Aviso: Post marcado como rascunho (draft: true)${NC}"
    echo ""
    read -p "Continuar mesmo assim? (s/N): " confirm
    if [[ ! $confirm =~ ^[Ss]$ ]]; then
        echo -e "\n${RED}❌ Publicação cancelada${NC}"
        exit 0
    fi
    echo ""
fi

# Copiar para destino
echo -e "${BLUE}📋 Copiando post...${NC}"
if cp "$SOURCE_DIR/$POST_FILE" "$DEST_DIR/$POST_FILE"; then
    echo -e "${GREEN}✓ Copiado para: $DEST_DIR/$POST_FILE${NC}"
else
    echo -e "${RED}❌ Erro ao copiar arquivo${NC}"
    exit 1
fi

# Mover original para Publicados
echo -e "\n${BLUE}📦 Arquivando original...${NC}"
if mv "$SOURCE_DIR/$POST_FILE" "$ARCHIVE_DIR/$POST_FILE"; then
    echo -e "${GREEN}✓ Arquivado em: $ARCHIVE_DIR/$POST_FILE${NC}"
else
    echo -e "${RED}❌ Erro ao arquivar original${NC}"
    exit 1
fi

# Verificar imagens no post
echo -e "\n${BLUE}🖼️  Verificando imagens...${NC}"
IMAGES=$(grep -oE '!\[.*?\]\(.*?\)' "$DEST_DIR/$POST_FILE" | grep -oE '\(.*?\)' | tr -d '()' || echo "")

if [ -n "$IMAGES" ]; then
    echo -e "${YELLOW}📌 Imagens encontradas no post:${NC}"
    echo "$IMAGES" | while read img; do
        echo "  - $img"
    done
    echo ""
    echo -e "${YELLOW}⚠️  Lembre-se de mover as imagens para:${NC}"
    echo "  public/blog-images/"
else
    echo -e "${GREEN}✓ Nenhuma imagem encontrada${NC}"
fi

# Sucesso!
echo ""
echo -e "${BOLD}${GREEN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║              ✅ Post publicado com sucesso!                ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

# Próximos passos
echo -e "${YELLOW}📌 Próximos passos:${NC}"
echo ""
echo "  1. Teste localmente:"
echo -e "     ${BLUE}npm run dev${NC}"
echo ""
echo "  2. Acesse no navegador:"
echo -e "     ${BLUE}http://localhost:4321/blog${NC}"
echo ""
echo "  3. Se tudo OK, faça commit:"
echo -e "     ${BLUE}git add src/content/blog/$LANG/$POST_FILE${NC}"
echo -e "     ${BLUE}git commit -m \"feat: add post $POST_FILE\"${NC}"
echo -e "     ${BLUE}git push${NC}"
echo ""

echo -e "${GREEN}🎉 Pronto para o deploy!${NC}\n"
