/* ==========================================================================
   CEI/UFMG — agent.js
   Agente CEI: camada desacoplada (mock local hoje → API real amanhã)

   Para conectar uma API real, defina CEI_AGENT_ENDPOINT com a URL do serviço.
   O endpoint deve receber POST JSON { message, history } e responder com o
   mesmo formato do objeto retornado por mockRespond() (ver "Contrato" abaixo).
   ========================================================================== */
(function () {
  'use strict';

  /** URL da API do Agente CEI. null = respostas simuladas no navegador. */
  var CEI_AGENT_ENDPOINT = null;

  var CEI = window.CEI;
  var doc = document;
  var B = CEI.base;

  /* ---------------------------------------------------------------------
     Contrato de resposta
     {
       intent: string,
       understanding: string,          // frase de compreensão
       diagnosis: string,              // diagnóstico inicial
       problem: string,                // problema identificado
       dimensions: string[],           // dimensões ativas (ver DIMENSIONS)
       connections: [{ name, desc, href }],
       next: string,                   // próximo passo sugerido
       owner: string                   // equipe que avaliará (decisão humana)
     }
     --------------------------------------------------------------------- */

  var DIMENSIONS = ['Tecnologia', 'Pesquisa', 'Propriedade intelectual', 'Infraestrutura', 'Empreendedorismo', 'Mercado', 'Financiamento', 'Parcerias', 'Formação', 'Impacto socioambiental', 'Internacionalização'];

  var STAGES = ['Contexto', 'Problema', 'Diagnóstico', 'Competências', 'Conexões', 'Próximo passo'];

  var SUGGESTIONS = [
    'Tenho uma tecnologia e quero saber como avançar.',
    'Quero transformar minha pesquisa em negócio.',
    'Preciso encontrar uma competência dentro da UFMG.',
    'Quero desenvolver uma parceria com uma empresa.',
    'Tenho uma startup e preciso de apoio.',
    'Quero empreender, mas ainda não sei por onde começar.',
    'Quero conhecer os programas do CEI.',
    'Quero propor uma parceria institucional.'
  ];

  /* Base de conhecimento — construída a partir do projeto do CEI/UFMG */
  var INTENTS = [
    {
      id: 'tecnologia-mercado',
      keys: ['tecnolog', 'mercado', 'levar', 'licenc', 'patente', 'trl', 'prototip', 'produto', 'desenvolvida', 'avancar', 'maturidade', 'transferencia'],
      understanding: 'Entendi. Sua trajetória parece envolver estruturação tecnológica, propriedade intelectual, validação e conexão com mercado.',
      diagnosis: 'Estruturação tecnológica + conexão com competências UFMG',
      problem: 'Necessidade de avaliar a maturidade tecnológica e identificar competências complementares para avançar o desenvolvimento.',
      dimensions: ['Tecnologia', 'Pesquisa', 'Propriedade intelectual', 'Infraestrutura', 'Empreendedorismo', 'Mercado', 'Financiamento', 'Parcerias'],
      connections: [
        { name: 'CTIT/UFMG', desc: 'Proteção da propriedade intelectual, licenciamento e transferência de tecnologia', href: 'ecossistema/#ator-ctit' },
        { name: 'InovaLab', desc: 'Pré-incubação e incubação de negócios de base tecnológica', href: 'programas/#programa-inovalab' },
        { name: 'Espaço Maker · FabLab/CEI', desc: 'Prototipagem rápida: impressão 3D, CNC, corte a laser, CAD/CAM', href: 'infraestrutura/' }
      ],
      next: 'Conectar com a equipe responsável pelo encaminhamento tecnológico.',
      owner: 'Equipe CTIT/INOVA no CEI'
    },
    {
      id: 'pesquisa-negocio',
      keys: ['pesquisa', 'negocio', 'spin', 'spin-off', 'empresa a partir', 'doutorado', 'mestrado', 'laboratorio', 'academic', 'tese'],
      understanding: 'Entendi. Você quer converter conhecimento científico em um empreendimento — o caminho típico de uma spin-off acadêmica.',
      diagnosis: 'Potencial spin-off acadêmica: da pesquisa ao modelo de negócio',
      problem: 'Transformar resultados de pesquisa em proposta de valor validada, com proteção do conhecimento e estrutura empresarial.',
      dimensions: ['Pesquisa', 'Tecnologia', 'Propriedade intelectual', 'Empreendedorismo', 'Mercado', 'Formação'],
      connections: [
        { name: 'InovaLab · pré-incubação', desc: 'Sensibilização e formação inicial de empreendedores', href: 'programas/#programa-inovalab' },
        { name: 'CTIT/UFMG', desc: 'Avaliação de proteção e estratégia de propriedade intelectual', href: 'ecossistema/#ator-ctit' },
        { name: 'PPGIT', desc: 'Pós-Graduação em Inovação Tecnológica e ações para discentes', href: 'programas/#programa-ppgit' }
      ],
      next: 'Agendar uma conversa de diagnóstico com a equipe de Novos Negócios do CEI.',
      owner: 'Vertical de Novos Negócios'
    },
    {
      id: 'competencia',
      keys: ['competencia', 'encontrar', 'especialista', 'pesquisador', 'grupo de pesquisa', 'quem', 'laboratorio', 'equipamento', 'conhecimento'],
      understanding: 'Entendi. Você precisa localizar conhecimento, pessoas ou capacidades dentro da UFMG para resolver um problema específico.',
      diagnosis: 'Busca de competência: mapeamento problema × capacidades UFMG',
      problem: 'Identificar grupos, laboratórios e infraestrutura aderentes ao desafio, e o instrumento adequado para a colaboração.',
      dimensions: ['Pesquisa', 'Tecnologia', 'Infraestrutura', 'Parcerias'],
      connections: [
        { name: 'Competências UFMG', desc: 'Busca por área, tecnologia, laboratório e infraestrutura', href: 'competencias/' },
        { name: 'UFMG Hub', desc: 'Recebe e encaminha demandas para os grupos de pesquisa', href: 'programas/#programa-ufmg-hub' },
        { name: 'ELO — Escritório de Ligação', desc: 'Relacionamento com empresas e entidades externas', href: 'programas/#programa-elo' }
      ],
      next: 'Detalhar o problema para que a equipe do UFMG Hub identifique os grupos aderentes.',
      owner: 'UFMG Hub · ELO'
    },
    {
      id: 'parceria-empresa',
      keys: ['parceria', 'empresa', 'industria', 'pd&i', 'p&d', 'pdi', 'convenio', 'acordo', 'contratar', 'demanda tecnologica', 'inovacao aberta'],
      understanding: 'Entendi. Você busca estruturar uma colaboração entre a universidade e o setor produtivo.',
      diagnosis: 'Arranjo de inovação universidade–empresa',
      problem: 'Conectar a demanda da empresa às competências da UFMG e escolher o instrumento jurídico adequado (ex.: acordo de parceria para PD&I).',
      dimensions: ['Parcerias', 'Pesquisa', 'Tecnologia', 'Mercado', 'Propriedade intelectual', 'Financiamento'],
      connections: [
        { name: 'UFMG Hub', desc: 'Ponte entre universidade e setor produtivo', href: 'programas/#programa-ufmg-hub' },
        { name: 'CTIT/UFMG', desc: 'Acordos de parceria para PD&I e licenciamento', href: 'ecossistema/#ator-ctit' },
        { name: 'Mercado em Conexão', desc: 'Maior feira de oportunidades universitárias de Minas Gerais', href: 'eventos/#evento-mercado-em-conexao' }
      ],
      next: 'Registrar a demanda para triagem conjunta UFMG Hub + CTIT.',
      owner: 'UFMG Hub · CTIT'
    },
    {
      id: 'startup',
      keys: ['startup', 'incub', 'acelera', 'apoio', 'mentoria', 'consultoria', 'escalar', 'investimento', 'investidor', 'captar'],
      understanding: 'Entendi. Você já tem um negócio em andamento e procura apoio para estruturar e crescer.',
      diagnosis: 'Apoio a startup: maturação do modelo de negócio e conexões',
      problem: 'Identificar o estágio da startup e combinar incubação, mentoria, consultoria e acesso a capital.',
      dimensions: ['Empreendedorismo', 'Mercado', 'Financiamento', 'Parcerias', 'Tecnologia'],
      connections: [
        { name: 'INOVA-UFMG Incubadora', desc: 'Incubadora de empresas da UFMG, em operação desde 2003', href: 'programas/#programa-inova-ufmg' },
        { name: 'INDERIOS Consultoria', desc: 'Consultoria gratuita em finanças, mercado, estratégia, marketing e vendas', href: 'programas/#programa-inderios' },
        { name: 'Oportunidades', desc: 'Editais, mentorias e conexões com investidores', href: 'oportunidades/' }
      ],
      next: 'Conversa de diagnóstico com a equipe INOVA/InovaLab para indicar a trilha adequada.',
      owner: 'INOVA-UFMG · InovaLab'
    },
    {
      id: 'comecar',
      keys: ['comecar', 'começar', 'por onde', 'empreender', 'ideia', 'aprender', 'curso', 'disciplina', 'estudante', 'aluno', 'iniciante', 'nao sei'],
      understanding: 'Entendi. Você quer empreender e ainda está definindo o caminho — um ótimo momento para aprender pela prática.',
      diagnosis: 'Formação empreendedora vivencial',
      problem: 'Desenvolver competências empreendedoras e transformar interesse em uma primeira ideia testável.',
      dimensions: ['Formação', 'Empreendedorismo', 'Mercado'],
      connections: [
        { name: 'OPEI', desc: 'Oficina de Projetos, Empreendedorismo e Inovação — disciplina da Formação Transversal', href: 'programas/#programa-opei' },
        { name: 'Seminários em Empreendedorismo e Inovação', desc: 'Encontros com empreendedores, investidores e gestores', href: 'eventos/' },
        { name: 'Empresas juniores e extensão', desc: 'Coworking do CEI para projetos estudantis', href: 'infraestrutura/' }
      ],
      next: 'Escolher uma porta de entrada: disciplina, evento ou projeto de extensão.',
      owner: 'Vertical de Cultura e Formação Empreendedora'
    },
    {
      id: 'programas',
      keys: ['programa', 'programas', 'conhecer', 'o que o cei', 'oferece', 'iniciativas', 'servicos'],
      understanding: 'Claro. O CEI integra iniciativas que antes atuavam de forma dispersa na UFMG, organizadas em quatro verticais.',
      diagnosis: 'Visão geral das verticais e programas do CEI',
      problem: 'Encontrar o programa mais aderente ao seu perfil e estágio.',
      dimensions: ['Formação', 'Empreendedorismo', 'Infraestrutura', 'Internacionalização'],
      connections: [
        { name: 'Programas', desc: 'Catálogo filtrável por categoria, público e estágio', href: 'programas/' },
        { name: 'Infraestrutura', desc: 'FabLab, coworkings, sala multimeios e convivência', href: 'infraestrutura/' },
        { name: 'Eventos', desc: 'Mercado em Conexão, Terça da Inovação, seminários', href: 'eventos/' }
      ],
      next: 'Contar ao Agente seu perfil (estudante, pesquisador, empresa…) para um recorte personalizado.',
      owner: 'Coordenação do CEI'
    },
    {
      id: 'institucional',
      keys: ['institucional', 'governo', 'prefeitura', 'municipio', 'orgao', 'publico', 'convenio institucional', 'cooperacao', 'fundacao'],
      understanding: 'Entendi. Você representa uma instituição e quer propor uma cooperação com o ecossistema da UFMG.',
      diagnosis: 'Parceria institucional e arranjos de inovação',
      problem: 'Alinhar objetivos institucionais às verticais do CEI e definir o instrumento de cooperação.',
      dimensions: ['Parcerias', 'Impacto socioambiental', 'Financiamento', 'Formação'],
      connections: [
        { name: 'Governança do CEI', desc: 'Modelo de gestão compartilhada Escola de Engenharia + CTIT', href: 'governanca/' },
        { name: 'LAPLANGE', desc: 'Inovação em gestão pública em saúde — núcleo do CEI no Campus Saúde', href: 'programas/#programa-laplange' },
        { name: 'Contato institucional', desc: 'Canal da coordenação do CEI', href: 'contato/' }
      ],
      next: 'Encaminhar a proposta à coordenação do CEI para avaliação.',
      owner: 'Coordenação do CEI'
    },
    {
      id: 'impacto',
      keys: ['impacto', 'social', 'ambiental', 'sustentab', 'comunidade', 'negocio de impacto', 'ods'],
      understanding: 'Entendi. Seu foco é gerar impacto social ou ambiental por meio de um empreendimento.',
      diagnosis: 'Negócio de impacto social e ambiental',
      problem: 'Estruturar a solução com modelo sustentável e métricas de impacto.',
      dimensions: ['Impacto socioambiental', 'Empreendedorismo', 'Mercado', 'Financiamento'],
      connections: [
        { name: 'Motirõ', desc: 'Programa de desenvolvimento de negócios de impacto social e ambiental', href: 'programas/#programa-motiro' },
        { name: 'FUNDEPAR', desc: 'Fomento a startups oriundas da UFMG, com atenção ao impacto', href: 'ecossistema/#parcerias' },
        { name: 'LAPLANGE', desc: 'Tecnologias sociais e gestão pública em saúde', href: 'programas/#programa-laplange' }
      ],
      next: 'Conversa com a equipe do Motirõ para avaliar o encaixe no ciclo de aceleração.',
      owner: 'Motirõ · Novos Negócios'
    },
    {
      id: 'internacional',
      keys: ['internacional', 'exterior', 'mobilidade', 'missao', 'global', 'intercambio', 'outro pais', 'exportar'],
      understanding: 'Entendi. Você busca levar uma iniciativa ou tecnologia da UFMG para o contexto internacional.',
      diagnosis: 'Internacionalização de iniciativas e spin-offs',
      problem: 'Identificar parceiros, missões e programas de mobilidade adequados ao estágio da iniciativa.',
      dimensions: ['Internacionalização', 'Parcerias', 'Mercado', 'Tecnologia'],
      connections: [
        { name: 'Internacionalização', desc: 'Missões, encontros bilaterais e mobilidade', href: 'internacionalizacao/' },
        { name: 'CTIT/UFMG', desc: 'Estratégia de PI para mercados externos', href: 'ecossistema/#ator-ctit' },
        { name: 'Oportunidades internacionais', desc: 'Chamadas e programas em curadoria', href: 'oportunidades/?cat=internacionalizacao' }
      ],
      next: 'Encaminhar à vertical de Internacionalização para mapear parceiros.',
      owner: 'Vertical de Internacionalização'
    },
    {
      id: 'prototipo',
      keys: ['prototipo', 'fablab', 'maker', 'impressora', '3d', 'cnc', 'laser', 'fabricar', 'construir'],
      understanding: 'Entendi. Você precisa materializar uma ideia — prototipar, testar e iterar.',
      diagnosis: 'Prototipagem e validação física',
      problem: 'Acessar equipamentos e orientação técnica para produzir um protótipo funcional.',
      dimensions: ['Infraestrutura', 'Tecnologia', 'Empreendedorismo'],
      connections: [
        { name: 'Espaço Maker · FabLab/CEI', desc: 'Mais de R$ 1 milhão em equipamentos, via convênio com o Governo de MG', href: 'infraestrutura/' },
        { name: 'LEAT', desc: 'Laboratório de Pesquisa e Inovação no prédio do CEI', href: 'infraestrutura/' },
        { name: 'InovaLab', desc: 'Se o protótipo for a base de um negócio', href: 'programas/#programa-inovalab' }
      ],
      next: 'Solicitar uso do Espaço Maker com a descrição do protótipo.',
      owner: 'Vertical FabLab'
    }
  ];

  var GENERAL = {
    id: 'geral',
    understanding: 'Obrigado pelo contexto. Vou organizar sua demanda para que a equipe certa do CEI possa avaliá-la.',
    diagnosis: 'Demanda em triagem: contexto inicial registrado',
    problem: 'Ainda não há elementos suficientes para classificar a demanda com segurança. Mais contexto melhora o encaminhamento.',
    dimensions: ['Empreendedorismo', 'Parcerias'],
    connections: [
      { name: 'Programas', desc: 'Conheça as verticais e iniciativas do CEI', href: 'programas/' },
      { name: 'Competências UFMG', desc: 'Encontre conhecimento e capacidades', href: 'competencias/' },
      { name: 'Fale com a equipe', desc: 'Canal direto com a coordenação', href: 'contato/' }
    ],
    next: 'Conte um pouco mais: quem você é, o que já tem pronto e o que gostaria de alcançar.',
    owner: 'Triagem do CEI'
  };

  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  function mockRespond(message) {
    var t = norm(message);
    var best = null, bestScore = 0;
    INTENTS.forEach(function (it) {
      var score = 0;
      it.keys.forEach(function (k) { if (t.indexOf(norm(k)) !== -1) score += k.length > 6 ? 2 : 1; });
      if (score > bestScore) { bestScore = score; best = it; }
    });
    return Promise.resolve(bestScore > 0 ? best : GENERAL);
  }

  function respond(message, history) {
    if (!CEI_AGENT_ENDPOINT) return mockRespond(message);
    return fetch(CEI_AGENT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: message, history: history })
    }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .catch(function () { return mockRespond(message); });
  }

  /* ---------------------------------------------------------------------
     Interface
     --------------------------------------------------------------------- */
  var esc = CEI.escape;
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, CEI.reducedMotion ? 0 : ms); }); };
  var uid = 0;

  function mount(el) {
    var variant = el.getAttribute('data-variant') || 'hero';
    var id = 'agent-' + (++uid);
    var history = [];
    var busy = false;

    el.classList.add('agent', 'agent-' + variant);
    el.innerHTML =
      '<div class="agent-top">' +
        '<div class="agent-id"><span class="glyph" aria-hidden="true">' + markSVG() + '</span>' +
          '<span><strong>Agente CEI</strong><small>versão demonstrativa · decisão humana</small></span></div>' +
        '<button type="button" class="agent-reset" hidden>' + CEI.icon('refresh', 'icon-sm') + 'Nova conversa</button>' +
      '</div>' +
      '<div class="agent-thread" role="log" aria-live="polite" aria-label="Conversa com o Agente CEI">' +
        '<div class="agent-intro"><h3>Conte ao CEI o que você está tentando realizar.</h3>' +
        '<p>O Agente organiza seu contexto, identifica dimensões e sugere conexões no ecossistema da UFMG. Quem decide é a equipe do CEI.</p></div>' +
      '</div>' +
      '<div class="agent-compose">' +
        '<form class="composer" novalidate>' +
          '<label for="' + id + '-input" class="visually-hidden">Mensagem para o Agente CEI</label>' +
          '<textarea id="' + id + '-input" rows="1" placeholder="Conte ao Agente CEI o que você está buscando..." maxlength="1200"></textarea>' +
          '<button type="submit" class="send-btn" aria-label="Enviar mensagem" disabled>' + CEI.icon('arrow-up') + '</button>' +
        '</form>' +
        '<div class="agent-chips" role="group" aria-label="Sugestões de mensagem">' +
          SUGGESTIONS.map(function (s) { return '<button type="button" class="chip">' + esc(s) + '</button>'; }).join('') +
        '</div>' +
        '<div class="agent-foot"><span>Respostas simuladas · sem envio de dados</span><span>IA recomenda · pessoas decidem</span></div>' +
      '</div>';

    var thread = el.querySelector('.agent-thread');
    var form = el.querySelector('.composer');
    var input = el.querySelector('textarea');
    var send = el.querySelector('.send-btn');
    var reset = el.querySelector('.agent-reset');
    var introHTML = thread.innerHTML;

    function autosize() { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 160) + 'px'; }
    function syncSend() { send.disabled = busy || !input.value.trim(); }
    input.addEventListener('input', function () { autosize(); syncSend(); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!send.disabled) form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit', { cancelable: true })); }
    });
    el.querySelectorAll('.agent-chips .chip').forEach(function (c) {
      c.addEventListener('click', function () { setPrompt(c.textContent); });
    });
    reset.addEventListener('click', function () {
      thread.innerHTML = introHTML; history = []; reset.hidden = true; el.classList.remove('has-thread'); input.value = ''; autosize(); syncSend(); input.focus();
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var text = input.value.trim();
      if (!text || busy) return;
      input.value = ''; autosize();
      run(text);
    });

    function setPrompt(text) {
      input.value = text; autosize(); syncSend();
      input.focus();
      try { input.setSelectionRange(text.length, text.length); } catch (e) {}
    }

    function scrollDown() { thread.scrollTop = thread.scrollHeight; }

    function run(text) {
      busy = true; syncSend();
      reset.hidden = false;
      el.classList.add('has-thread');
      var intro = thread.querySelector('.agent-intro');
      if (intro) intro.remove();
      var u = doc.createElement('div');
      u.className = 'msg msg-user';
      u.textContent = text;
      thread.appendChild(u);
      history.push({ role: 'user', content: text });

      var a = doc.createElement('div');
      a.className = 'msg msg-agent';
      a.innerHTML = '<div class="pipeline" aria-label="Etapas de análise">' +
        STAGES.map(function (s, i) { return (i ? '<span class="pipe-arrow" aria-hidden="true">→</span>' : '') + '<span class="pipe-step">' + s + '</span>'; }).join('') + '</div>';
      thread.appendChild(a);
      scrollDown();

      var steps = a.querySelectorAll('.pipe-step');
      var responseP = respond(text, history);
      var chain = Promise.resolve();
      steps.forEach(function (st, i) {
        chain = chain.then(function () {
          st.classList.add('is-active');
          return wait(330).then(function () { st.classList.remove('is-active'); st.classList.add('is-done'); });
        });
      });
      chain.then(function () { return responseP; }).then(function (res) {
        history.push({ role: 'agent', content: res.understanding, intent: res.id || res.intent });
        var say = doc.createElement('p');
        say.className = 'say';
        a.appendChild(say);
        return typewrite(say, res.understanding).then(function () { return res; });
      }).then(function (res) {
        var card = buildDiagnosis(res);
        a.appendChild(card);
        var blocks = card.querySelectorAll('.diag-block');
        var c2 = Promise.resolve();
        blocks.forEach(function (b) { c2 = c2.then(function () { b.classList.add('is-in'); scrollDown(); return wait(240); }); });
        return c2.then(function () {
          var note = doc.createElement('div');
          note.className = 'human-note';
          note.innerHTML = CEI.icon('users') + '<span><strong>O Agente CEI apoia o diagnóstico e encaminhamento. A decisão permanece humana.</strong> Esta demanda seria avaliada por: ' + esc(res.owner || 'equipe do CEI') + '.</span>';
          a.appendChild(note);
          var fb = doc.createElement('div');
          fb.className = 'feedback';
          fb.innerHTML = '<span>Este diagnóstico ajudou?</span>' +
            '<button type="button" aria-pressed="false" aria-label="Sim, ajudou">' + CEI.icon('thumbs-up', 'icon-sm') + '</button>' +
            '<button type="button" aria-pressed="false" aria-label="Não ajudou">' + CEI.icon('thumbs-down', 'icon-sm') + '</button>';
          fb.querySelectorAll('button').forEach(function (b) {
            b.addEventListener('click', function () {
              fb.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
              b.setAttribute('aria-pressed', 'true');
              CEI.toast('Obrigado. Seu retorno ajuda o sistema a aprender.');
            });
          });
          a.appendChild(fb);
          scrollDown();
          busy = false; syncSend();
        });
      });
    }

    function typewrite(target, text) {
      if (CEI.reducedMotion) { target.textContent = text; return Promise.resolve(); }
      return new Promise(function (resolve) {
        var i = 0;
        var caret = doc.createElement('span');
        caret.className = 'caret';
        target.appendChild(caret);
        (function tick() {
          i += 2;
          target.firstChild && target.firstChild.nodeType === 3 ? target.firstChild.nodeValue = text.slice(0, i) : target.insertBefore(doc.createTextNode(text.slice(0, i)), caret);
          scrollDown();
          if (i < text.length) setTimeout(tick, 16);
          else { caret.remove(); resolve(); }
        })();
      });
    }

    function buildDiagnosis(res) {
      var wrap = doc.createElement('div');
      wrap.className = 'diag';
      var dims = DIMENSIONS.map(function (d) {
        var on = res.dimensions.indexOf(d) !== -1;
        return '<span class="dim' + (on ? ' is-on' : '') + '">' + esc(d) + (on ? '<span class="visually-hidden"> (identificada)</span>' : '') + '</span>';
      }).join('');
      var links = (res.connections || []).map(function (c) {
        return '<a class="diag-link" href="' + B + esc(c.href) + '"><span>' + esc(c.name) + '<small>' + esc(c.desc) + '</small></span>' + CEI.icon('arrow-right', 'icon-sm') + '</a>';
      }).join('');
      wrap.innerHTML =
        '<div class="diag-block"><div class="diag-label"><span class="n">01</span>Diagnóstico inicial</div><div class="diag-title">' + esc(res.diagnosis) + '</div></div>' +
        '<div class="diag-block"><div class="diag-label"><span class="n">02</span>Problema identificado</div><p class="diag-text">' + esc(res.problem) + '</p></div>' +
        '<div class="diag-block"><div class="diag-label"><span class="n">03</span>Dimensões identificadas</div><div class="diag-dims">' + dims + '</div></div>' +
        '<div class="diag-block"><div class="diag-label"><span class="n">04</span>Conexões sugeridas</div><div class="diag-links">' + links + '</div></div>' +
        '<div class="diag-block diag-next"><div class="diag-label"><span class="n">05</span>Próximo passo</div><div class="diag-title">' + esc(res.next) + '</div>' +
          '<div class="cluster"><button type="button" class="btn btn-primary btn-sm" data-handoff>Solicitar encaminhamento ' + CEI.icon('arrow-right', 'icon-arrow icon-sm') + '</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" data-refine style="--btn-fg: var(--on-dark); --btn-bd: rgba(255,255,255,.3)">Refinar contexto</button></div></div>';
      wrap.querySelector('[data-handoff]').addEventListener('click', function (e) {
        var btn = e.currentTarget;
        btn.disabled = true;
        var h = buildHandoff(res);
        wrap.parentNode.insertBefore(h, wrap.nextSibling);
        var first = h.querySelector('input');
        if (first) first.focus();
        scrollDown();
      });
      wrap.querySelector('[data-refine]').addEventListener('click', function () {
        setPrompt('Complementando: ');
      });
      return wrap;
    }

    function buildHandoff(res) {
      var hid = id + '-h' + Date.now();
      var protocol = 'CEI-' + new Date().getFullYear() + '-' + String(Math.floor(1000 + Math.random() * 9000));
      var box = doc.createElement('div');
      box.className = 'handoff';
      box.innerHTML =
        '<h4>Solicitar encaminhamento à equipe do CEI</h4>' +
        '<form data-form class="form-grid">' +
          field(hid + '-n', 'Nome', '<input class="input" id="' + hid + '-n" name="nome" autocomplete="name" required>') +
          field(hid + '-e', 'E-mail', '<input class="input" id="' + hid + '-e" name="email" type="email" autocomplete="email" inputmode="email" required>') +
          field(hid + '-v', 'Seu vínculo', '<select class="select" id="' + hid + '-v" name="vinculo" required><option value="">Selecione</option><option>Estudante</option><option>Pesquisador(a) / Docente</option><option>Servidor(a) técnico-administrativo</option><option>Empresa</option><option>Startup / Spin-off</option><option>Investidor(a)</option><option>Governo / Setor público</option><option>Sociedade / Outro</option></select>') +
          '<div class="field"><label class="check"><input type="checkbox" required data-msg-required="É necessário consentir para registrar a demanda."> <span>Autorizo o uso destas informações para o encaminhamento da minha demanda, nos termos da LGPD.</span></label><span class="field-error" role="alert"></span></div>' +
          '<button type="submit" class="btn btn-dark">Enviar para avaliação humana ' + CEI.icon('arrow-right', 'icon-arrow icon-sm') + '</button>' +
        '</form>' +
        '<div class="form-status" role="status">' + CEI.icon('check') + '<div><h4>Demanda registrada · protocolo ' + protocol + '</h4>' +
          '<p>Versão demonstrativa: nenhum dado foi enviado. Na versão integrada, sua demanda seguirá para avaliação de <strong>' + esc(res.owner || 'equipe do CEI') + '</strong>, com registro no Decision Log.</p></div></div>';
      CEI.bindForm(box.querySelector('form'));
      return box;
    }
    function field(fid, label, control) {
      return '<div class="field"><label for="' + fid + '">' + label + '</label>' + control + '<span class="field-error" role="alert"></span></div>';
    }

    el.__agent = { setPrompt: setPrompt, run: run, input: input };
    return el.__agent;
  }

  function markSVG() {
    return '<svg viewBox="0 0 32 32" width="18" height="18" aria-hidden="true"><g stroke="#F5F4EF" stroke-width="1.6" fill="none"><path d="M16 16 6 8M16 16l10-8M16 16v10"/></g><circle cx="6" cy="8" r="3" fill="#F5F4EF"/><circle cx="26" cy="8" r="3" fill="#F5F4EF"/><circle cx="16" cy="26" r="3" fill="#F5F4EF"/><circle cx="16" cy="16" r="4.5" fill="#F2B705"/></svg>';
  }

  /* Monta todos os agentes da página */
  var agents = [];
  CEI.$$('[data-agent]').forEach(function (el) { agents.push(mount(el)); });

  /* Drawer global */
  var drawer = doc.getElementById('agent-drawer');
  var drawerAgent = drawer ? drawer.querySelector('[data-agent]') : null;
  CEI.openAgent = function (prompt, opener) {
    if (!drawer || !drawerAgent) return;
    CEI.openDialog(drawer, opener);
    setTimeout(function () {
      if (prompt) drawerAgent.__agent.setPrompt(prompt);
      else drawerAgent.__agent.input.focus();
    }, 60);
  };
  doc.addEventListener('click', function (e) {
    var t = e.target.closest('[data-agent-open]');
    if (!t) return;
    e.preventDefault();
    var p = t.getAttribute('data-agent-prompt');
    // Se a página tem um agente principal visível (home/agente), usa-o; senão, abre o drawer
    var inline = CEI.$('[data-agent][data-variant="hero"], [data-agent][data-variant="page"]');
    if (inline && t.hasAttribute('data-agent-inline')) {
      inline.scrollIntoView({ behavior: CEI.reducedMotion ? 'auto' : 'smooth', block: 'center' });
      setTimeout(function () { p ? inline.__agent.setPrompt(p) : inline.__agent.input.focus(); }, 400);
      return;
    }
    CEI.openAgent(p, t);
  });

  /* Oculta o botão flutuante enquanto o agente principal da página está visível */
  var mainAgent = CEI.$('[data-agent][data-variant="hero"], [data-agent][data-variant="page"]');
  var fabBtn = CEI.$('.fab');
  if (mainAgent && fabBtn && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (ent) {
      ent.forEach(function (e) { if (!doc.body.classList.contains('dialog-open')) fabBtn.classList.toggle('is-hidden', e.isIntersecting); });
    }, { threshold: 0.15 }).observe(mainAgent);
  }

  CEI.agent = { endpoint: CEI_AGENT_ENDPOINT, respond: respond, intents: INTENTS };
})();
