# CEI/UFMG — Centro de Empreendedorismo e Inovação

Website institucional estático do CEI/UFMG, pronto para **GitHub Pages**.
HTML5 + CSS3 + JavaScript puro. Sem backend, sem build obrigatório, sem dependências.

> Feito por [iblt.com.br](https://iblt.com.br) — Instituto Brasileiro de Liderança Tecnológica

---

## Publicar no GitHub Pages

1. Crie um repositório (ex.: `cei-ufmg`) e envie **todo o conteúdo desta pasta** para a raiz do repositório.
2. No GitHub: **Settings → Pages → Source: Deploy from a branch → Branch: `main` / `(root)`** → Save.
3. Em ~1 minuto o site estará em `https://SEU-USUARIO.github.io/cei-ufmg/`.

### Ajustar o endereço (SEO)
As tags `canonical`, Open Graph, `sitemap.xml` e `robots.txt` usam:

```
https://agustinhoxc.github.io/cei-ufmg/
```

Se o repositório, usuário ou domínio forem outros, faça um **buscar e substituir** desse texto em todos os arquivos
(ou altere `SITE_URL` em `_fonte/build.py` e rode `python3 _fonte/build.py`).

### Domínio próprio
Crie um arquivo `CNAME` na raiz com o domínio (ex.: `cei.exemplo.br`) e configure o DNS conforme a documentação do GitHub Pages.
Depois, atualize o endereço conforme a seção acima.

---

## Estrutura

```
index.html                 Início (hero + Agente CEI)
quem-somos/                Propósito, missão, princípios, equipe, apoio institucional
programas/                 Catálogo filtrável (categoria × público) com modais de detalhe
ecossistema/               Mapa interativo de atores, domínios, estrutura, parcerias
competencias/              Busca de competências (base inicial do projeto)
infraestrutura/            Planta interativa dos 2 andares, FabLab, cronograma da obra
oportunidades/             Oportunidades filtráveis + alertas
eventos/                   Agenda por periodicidade + "Quero ser avisado"
governanca/                Ciclo interativo, gestão, Decision Log, evidências, riscos
dados/                     Metas, painel de indicadores (aguardando integração), Gantt
transparencia/             Níveis de acesso, LGPD/PI/segurança, fomento
internacionalizacao/       UFMG ↔ Brasil ↔ Mundo
contato/                   Canais e formulário
agente/                    Como funciona o Agente CEI (pode / não pode, arquitetura)
assets/css/                style.css (tokens/base) · components.css · responsive.css
assets/js/                 main.js · navigation.js · agent.js · interactions.js
assets/img/                logo e imagem de compartilhamento (Open Graph)
_fonte/                    Gerador opcional (não é publicado pelo GitHub Pages)
```

## Agente CEI — conectar uma API real

Em `assets/js/agent.js`:

```js
var CEI_AGENT_ENDPOINT = null; // hoje: respostas simuladas no navegador
```

Defina a URL do serviço. O endpoint recebe `POST { message, history }` e deve responder:

```json
{
  "understanding": "Entendi. ...",
  "diagnosis": "Estruturação tecnológica + conexão com competências UFMG",
  "problem": "Necessidade de ...",
  "dimensions": ["Tecnologia", "Pesquisa", "Propriedade intelectual"],
  "connections": [{ "name": "CTIT/UFMG", "desc": "...", "href": "ecossistema/#ator-ctit" }],
  "next": "Conectar com a equipe ...",
  "owner": "Equipe CTIT/INOVA no CEI"
}
```

A interface não muda. Se a API falhar, o site volta automaticamente para as respostas locais.

## Formulários

Todos os formulários validam campos e exibem confirmação, mas **não enviam dados** (versão demonstrativa).
Para ativar envio, conecte um serviço (ex.: Formspree, Google Forms, API própria) no `submit` em `assets/js/main.js` → `CEI.bindForm`.

## Conteúdo a completar

Itens não presentes nos documentos de origem aparecem no site marcados em amarelo:

- E-mail institucional e redes sociais (Contato)
- Visão institucional (Quem somos — será definida no Plano Diretor)
- Fotos e contatos da equipe (Quem somos)
- Datas das edições dos eventos (Eventos)
- Linhas de atuação do LEAT (Infraestrutura)
- Política de privacidade e contato do encarregado de dados (Transparência)
- Parceiros internacionais (Internacionalização)
- Curadoria de editais externos (Oportunidades)
- Indicadores de operação (Dados — o painel não exibe números sem dados oficiais)

## Editar com o gerador (opcional)

Cabeçalho, rodapé e cartões são gerados a partir de `_fonte/`. Para mudar algo em todas as páginas:

```bash
python3 _fonte/build.py      # regera todos os index.html na raiz
```

- `_fonte/pages/*.html` — conteúdo de cada página
- `_fonte/data/*.json` — programas, oportunidades, eventos e competências

Também é possível editar os `index.html` diretamente, sem usar o gerador.

## Design system

Base gerada com **UI UX Pro Max** (Next Level Builder) — estilo *Minimalism & Swiss* — e ajustada ao briefing:

- Tipografia: IBM Plex Sans + IBM Plex Mono (rótulos e dados)
- Cores: grafite `#0B1324`, papel `#FAFAF7`, ouro `#F2B705` (CTAs), teal `#0F766E` (dados/agente)
- Acessibilidade: contraste AA, foco visível, navegação por teclado, `prefers-reduced-motion`, landmarks e ARIA
- Responsivo: testado de 320 px a 1920 px

---

Fontes de conteúdo: Plano de Trabalho do CEI/UFMG (Edital FAPEMIG nº 018/2024 — VUEI, processo APQ-00521-25) e documento de arquitetura do Agente CEI.
