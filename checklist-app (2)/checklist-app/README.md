# Lista de Compras — Checklist Compartilhado

App PWA de checklist de compras com sync em tempo real. Funciona no Android como app instalado.

## Stack
- **Next.js 14** — frontend
- **Supabase** — banco de dados + realtime
- **Vercel** — hospedagem (grátis)

---

## Passo a passo para subir

### 1. Supabase (banco de dados)

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Crie um novo projeto (guarde a senha)
3. Vá em **SQL Editor** → cole o conteúdo do arquivo `supabase-schema.sql` → clique em **Run**
4. Vá em **Settings → API** e copie:
   - `Project URL` → será o `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → será o `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

### 2. Vercel (hospedagem)

1. Acesse [vercel.com](https://vercel.com) e crie uma conta (use o GitHub)
2. Suba o projeto para um repositório GitHub (pode ser privado)
3. Na Vercel, clique em **Add New Project** → importe o repositório
4. Em **Environment Variables**, adicione:
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = sua_chave_aqui
   ```
5. Clique em **Deploy**

Pronto. A Vercel gera uma URL tipo `lista-compras-xyz.vercel.app`.

---

### 3. Instalar no Android como app

1. Abra a URL no **Chrome**
2. Toque nos 3 pontinhos → **"Adicionar à tela inicial"**
3. Confirme — aparece como app na tela inicial

---

### 4. Compartilhar com outras pessoas

Mande a URL para quem precisar. Todos acessam a mesma lista em tempo real — qualquer mudança aparece na hora para todo mundo.

---

## Rodar localmente

```bash
npm install
cp .env.local.example .env.local
# preencha o .env.local com suas chaves
npm run dev
```

Acesse `http://localhost:3000`

---

## Funcionalidades

- ✅ Duas categorias: Secos e Proteínas
- ✅ Adicionar e remover itens
- ✅ Marcar como comprado (riscado)
- ✅ Barra de progresso por categoria
- ✅ Limpar itens marcados
- ✅ Sync em tempo real entre dispositivos
- ✅ Funciona offline (itens carregados ficam visíveis)
- ✅ Instalável como PWA no Android
