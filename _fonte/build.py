#!/usr/bin/env python3
"""Gerador estático do site CEI/UFMG.
Lê fragmentos em pages/*.html e produz HTML completo em OUT (estrutura GitHub Pages).
"""
import json, os, re, sys, html
from pathlib import Path

SRC = Path(__file__).parent
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else SRC.parent
SITE_URL = 'https://agustinhoxc.github.io/cei-ufmg/'  # troque pelo domínio definitivo
FONTS = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap'

ICONS = {
 'arrow-right': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
 'arrow-left': '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
 'arrow-up': '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
 'arrow-up-right': '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
 'chevron-down': '<path d="m6 9 6 6 6-6"/>',
 'menu': '<path d="M4 7h16M4 12h16M4 17h16"/>',
 'x': '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
 'check': '<path d="M20 6 9 17l-5-5"/>',
 'check-circle': '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
 'x-circle': '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
 'search': '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
 'users': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
 'user': '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
 'graduation': '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
 'flask': '<path d="M9 3h6"/><path d="M10 3v6.5L4.5 19a1.5 1.5 0 0 0 1.3 2h12.4a1.5 1.5 0 0 0 1.3-2L14 9.5V3"/><path d="M7 15h10"/>',
 'building': '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>',
 'landmark': '<path d="M3 22h18"/><path d="M6 18v-7M10 18v-7M14 18v-7M18 18v-7"/><path d="M12 2 20 7H4z"/>',
 'coins': '<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/>',
 'globe': '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
 'heart': '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
 'shield': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
 'lock': '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
 'eye-off': '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><path d="m2 2 20 20"/>',
 'key': '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>',
 'file': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8M16 17H8M10 9H8"/>',
 'database': '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
 'chart': '<path d="M3 3v18h18"/><path d="M8 17V9M13 17V5M18 17v-3"/>',
 'bulb': '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
 'layers': '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>',
 'compass': '<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36z"/>',
 'pin': '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
 'mail': '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
 'calendar': '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
 'clock': '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
 'route': '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
 'target': '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
 'briefcase': '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
 'wrench': '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
 'message': '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
 'thumbs-up': '<path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/>',
 'thumbs-down': '<path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/>',
 'refresh': '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
 'info': '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
 'external': '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
 'book': '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
 'link': '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
 'plane': '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
 'award': '<circle cx="12" cy="8" r="6"/><path d="M15.48 12.89 17 22l-5-3-5 3 1.52-9.11"/>',
 'scale': '<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
 'network': '<circle cx="12" cy="12" r="3"/><circle cx="4.5" cy="5" r="2"/><circle cx="19.5" cy="5" r="2"/><circle cx="12" cy="20.5" r="2"/><path d="m6.2 6.4 3.6 3.6M17.8 6.4l-3.6 3.6M12 15v3.5"/>',
 'path': '<circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M6 9v3a6 6 0 0 0 6 6h3"/>',
 'box': '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
 'wifi': '<path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><path d="M12 20h.01"/>',
 'monitor': '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
 'coffee': '<path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><path d="M6 2v2M10 2v2M14 2v2"/>',
 'mic': '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/>',
 'trending': '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
 'sprout': '<path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/>',
 'play': '<path d="m7 4 12 8-12 8z"/>',
 'plus': '<path d="M12 5v14M5 12h14"/>',
 'bell': '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
 'cpu': '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/>',
}

def icon(name, cls=''):
    if name not in ICONS:
        raise KeyError('icon ' + name)
    c = 'icon' + (' ' + cls if cls else '')
    return f'<svg class="{c}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">{ICONS[name]}</svg>'

MARK = ('<svg class="brand-mark" viewBox="0 0 34 34" aria-hidden="true">'
        '<rect width="34" height="34" rx="9" fill="#0B1324"/>'
        '<g stroke="#F5F4EF" stroke-width="1.6" fill="none" stroke-linecap="round"><path d="M17 17 8.5 10M17 17l8.5-7M17 17v9"/></g>'
        '<circle cx="8.5" cy="10" r="2.6" fill="#F5F4EF"/><circle cx="25.5" cy="10" r="2.6" fill="#F5F4EF"/><circle cx="17" cy="26" r="2.6" fill="#F5F4EF"/>'
        '<circle cx="17" cy="17" r="4.2" fill="#F2B705"/></svg>')

# ----------------------------------------------------------------------------
NAV = [
    ('inicio', 'Início', ''),
    ('quem-somos', 'Quem somos', 'quem-somos/'),
    ('programas', 'Programas', 'programas/'),
    ('ecossistema', 'Ecossistema', None),
    ('competencias', 'Competências', 'competencias/'),
    ('oportunidades', 'Oportunidades', 'oportunidades/'),
    ('eventos', 'Eventos', 'eventos/'),
    ('governanca', 'Governança', None),
]
ECO_GROUP = {'ecossistema', 'infraestrutura', 'internacionalizacao'}
GOV_GROUP = {'governanca', 'dados', 'transparencia', 'agente'}

def header(P, slug):
    def cur(s):
        return ' aria-current="page"' if s == slug else ''
    items = []
    for s, label, href in NAV:
        if s == 'ecossistema':
            act = ' is-active' if slug in ECO_GROUP else ''
            items.append(f'''<li class="nav-item has-mega"><button type="button" class="nav-link{act}" aria-expanded="false" aria-controls="mega-eco">Ecossistema {icon('chevron-down')}</button>
<div class="mega" id="mega-eco">
  <div class="mega-col"><h4>Pessoas</h4><ul>
    <li><a href="{P}ecossistema/#ator-pesquisador">Pesquisadores<small>Geram conhecimento</small></a></li>
    <li><a href="{P}ecossistema/#ator-estudante">Estudantes<small>Competências e projetos</small></a></li>
    <li><a href="{P}ecossistema/#ator-empreendedor">Empreendedores<small>Oportunidade em negócio</small></a></li></ul></div>
  <div class="mega-col"><h4>Conhecimento</h4><ul>
    <li><a href="{P}competencias/">Competências<small>Busca no conhecimento UFMG</small></a></li>
    <li><a href="{P}competencias/?tipo=tecnologia">Tecnologias<small>Soluções e ativos</small></a></li>
    <li><a href="{P}competencias/?tipo=laboratorio">Laboratórios<small>Infraestrutura de pesquisa</small></a></li></ul></div>
  <div class="mega-col"><h4>Conexões</h4><ul>
    <li><a href="{P}ecossistema/#ator-empresa">Empresas<small>Demandam e absorvem tecnologia</small></a></li>
    <li><a href="{P}ecossistema/#ator-investidor">Investidores<small>Disponibilizam capital</small></a></li>
    <li><a href="{P}ecossistema/#ator-governo">Governo<small>Políticas e instrumentos</small></a></li></ul></div>
  <div class="mega-feature"><div><strong>Mapa do ecossistema</strong><p>Atores · Infraestrutura · Parcerias · Internacionalização</p></div>
    <div class="cluster"><a href="{P}infraestrutura/" style="background:transparent;color:var(--on-dark);border:1px solid rgba(255,255,255,.25)">Infraestrutura</a><a href="{P}ecossistema/">Ver mapa</a></div></div>
</div></li>''')
        elif s == 'governanca':
            act = ' is-active' if slug in GOV_GROUP else ''
            items.append(f'''<li class="nav-item has-mega"><button type="button" class="nav-link{act}" aria-expanded="false" aria-controls="mega-gov">Governança {icon('chevron-down')}</button>
<div class="mega mega-wide mega-right" id="mega-gov">
  <div class="mega-col"><ul>
    <li><a href="{P}governanca/">Governança<small>Como o ecossistema aprende, decide e evolui</small></a></li>
    <li><a href="{P}dados/">Dados &amp; Indicadores<small>Metas, cronograma e painel</small></a></li></ul></div>
  <div class="mega-col"><ul>
    <li><a href="{P}transparencia/">Transparência<small>LGPD, PI e níveis de acesso</small></a></li>
    <li><a href="{P}agente/">Como funciona o Agente<small>O que pode e o que não pode</small></a></li></ul></div>
  <div class="mega-feature"><div><strong>IA recomenda. Pessoas decidem.</strong><p>Instituições governam. Dados aprendem.</p></div><a href="{P}agente/">Conhecer o Agente</a></div>
</div></li>''')
        else:
            items.append(f'<li><a class="nav-link" href="{P}{href}"{cur(s)}>{label}</a></li>')
    nav = '\n'.join(items)

    def mcur(s):
        return ' aria-current="page"' if s == slug else ''
    mobile = f'''<div class="mobile-menu" id="mobile-menu" hidden>
<nav aria-label="Menu móvel"><ul>
<li><a href="{P}"{mcur('inicio')}>Início</a></li>
<li><a href="{P}quem-somos/"{mcur('quem-somos')}>Quem somos</a></li>
<li><a href="{P}programas/"{mcur('programas')}>Programas</a></li>
<li><button type="button" class="m-toggle" aria-expanded="false" aria-controls="m-eco">Ecossistema {icon('chevron-down')}</button>
  <ul class="m-sub" id="m-eco">
  <li><a href="{P}ecossistema/"{mcur('ecossistema')}>Mapa de atores</a></li>
  <li><a href="{P}infraestrutura/"{mcur('infraestrutura')}>Infraestrutura</a></li>
  <li><a href="{P}ecossistema/#parcerias">Parcerias</a></li>
  <li><a href="{P}internacionalizacao/"{mcur('internacionalizacao')}>Internacionalização</a></li></ul></li>
<li><a href="{P}competencias/"{mcur('competencias')}>Competências UFMG</a></li>
<li><a href="{P}oportunidades/"{mcur('oportunidades')}>Oportunidades</a></li>
<li><a href="{P}eventos/"{mcur('eventos')}>Eventos</a></li>
<li><button type="button" class="m-toggle" aria-expanded="false" aria-controls="m-gov">Governança {icon('chevron-down')}</button>
  <ul class="m-sub" id="m-gov">
  <li><a href="{P}governanca/"{mcur('governanca')}>Governança</a></li>
  <li><a href="{P}dados/"{mcur('dados')}>Dados &amp; Indicadores</a></li>
  <li><a href="{P}transparencia/"{mcur('transparencia')}>Transparência</a></li>
  <li><a href="{P}agente/"{mcur('agente')}>Como funciona o Agente</a></li></ul></li>
<li><a href="{P}contato/"{mcur('contato')}>Contato</a></li>
</ul></nav>
<button type="button" class="btn btn-primary" data-agent-open>Fale com o CEI {icon('arrow-right','icon-arrow')}</button>
</div>'''

    return f'''<a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
<header class="site-header" id="topo">
  <div class="container header-inner">
    <a class="brand" href="{P}" aria-label="CEI/UFMG — página inicial">{MARK}<span class="brand-text"><span class="brand-name">CEI<span>/UFMG</span></span><span class="brand-sub">Empreendedorismo e Inovação</span></span></a>
    <nav class="main-nav" aria-label="Principal"><ul class="nav-list">
{nav}
    </ul></nav>
    <button type="button" class="btn btn-primary btn-sm header-cta" data-agent-open>Fale com o CEI {icon('arrow-right','icon-arrow icon-sm')}</button>
    <button type="button" class="menu-toggle" aria-expanded="false" aria-controls="mobile-menu" aria-label="Abrir menu">{icon('menu','icon-open')}{icon('x','icon-close')}</button>
  </div>
</header>
{mobile}'''

def footer(P):
    ext = icon('arrow-up-right')
    return f'''<footer class="site-footer" aria-labelledby="footer-title">
  <h2 id="footer-title" class="visually-hidden">Rodapé</h2>
  <div class="container">
    <div class="footer-top">
      <div class="footer-brand">
        <a class="brand" href="{P}" aria-label="CEI/UFMG — página inicial">{MARK}<span class="brand-text"><span class="brand-name">CEI<span>/UFMG</span></span><span class="brand-sub">Centro de Empreendedorismo e Inovação</span></span></a>
        <p>A porta de entrada digital para o ecossistema de inovação da Universidade Federal de Minas Gerais.</p>
        <p class="footer-principle">IA recomenda. Pessoas decidem.<br>Instituições governam. Dados aprendem.</p>
      </div>
      <div class="footer-cols">
        <div class="footer-col"><h3>CEI</h3><ul>
          <li><a href="{P}quem-somos/">Quem somos</a></li><li><a href="{P}governanca/">Governança</a></li><li><a href="{P}internacionalizacao/">Internacionalização</a></li><li><a href="{P}eventos/">Eventos</a></li><li><a href="{P}contato/">Contato</a></li></ul></div>
        <div class="footer-col"><h3>Inovação</h3><ul>
          <li><a href="{P}programas/">Programas</a></li><li><a href="{P}oportunidades/">Oportunidades</a></li><li><a href="{P}competencias/">Competências</a></li><li><a href="{P}infraestrutura/">Infraestrutura</a></li><li><a href="{P}agente/">Agente CEI</a></li></ul></div>
        <div class="footer-col"><h3>Ecossistema</h3><ul>
          <li><a href="{P}ecossistema/#ator-empresa">Empresas</a></li><li><a href="{P}ecossistema/#ator-pesquisador">Pesquisadores</a></li><li><a href="{P}ecossistema/#ator-estudante">Estudantes</a></li><li><a href="{P}ecossistema/#ator-investidor">Investidores</a></li><li><a href="{P}ecossistema/#parcerias">Parceiros</a></li></ul></div>
        <div class="footer-col"><h3>Transparência</h3><ul>
          <li><a href="{P}dados/">Dados</a></li><li><a href="{P}dados/#indicadores">Indicadores</a></li><li><a href="{P}transparencia/#lgpd">LGPD</a></li><li><a href="{P}governanca/">Governança</a></li></ul></div>
        <div class="footer-col"><h3>UFMG</h3><ul>
          <li><a href="https://ufmg.br" target="_blank" rel="noopener">Portal UFMG {ext}</a></li><li><a href="https://ctit.ufmg.br" target="_blank" rel="noopener">CTIT/INOVA {ext}</a></li><li><a href="https://www.eng.ufmg.br" target="_blank" rel="noopener">Escola de Engenharia {ext}</a></li><li><a href="{P}ecossistema/#ambientes">Outros ambientes</a></li></ul></div>
      </div>
    </div>
    <div class="footer-bottom">
      <p>© <span data-year>2026</span> CEI/UFMG — Centro de Empreendedorismo e Inovação da Universidade Federal de Minas Gerais.</p>
      <p>Campus Pampulha · Belo Horizonte, MG</p>
    </div>
  </div>
  <div class="footer-credit"><div class="container">Feito por <a href="https://iblt.com.br" target="_blank" rel="noopener">iblt.com.br</a><span class="sep">—</span>Instituto Brasileiro de Liderança Tecnológica</div></div>
</footer>'''

def overlays(P):
    return f'''<button type="button" class="fab" data-agent-open aria-label="Fale com o CEI — abrir o Agente CEI"><span class="fab-orb">{icon('network')}</span><span class="fab-label">Fale com o CEI</span></button>

<dialog class="drawer" id="agent-drawer" aria-labelledby="drawer-title">
  <div class="drawer-panel">
    <div class="drawer-head"><div><strong id="drawer-title" class="brand-name">Fale com o CEI</strong><div class="brand-sub">Agente CEI · diagnóstico e encaminhamento</div></div>
      <button type="button" class="modal-close" data-close-dialog aria-label="Fechar">{icon('x')}</button></div>
    <div class="drawer-body"><div data-agent data-variant="drawer"></div></div>
  </div>
</dialog>

<dialog class="modal" id="detail-modal" aria-labelledby="detail-title">
  <div class="modal-panel">
    <div class="modal-head"><h2 id="detail-title">Detalhes</h2><button type="button" class="modal-close" data-close-dialog aria-label="Fechar">{icon('x')}</button></div>
    <div class="modal-body"></div>
  </div>
</dialog>

<dialog class="modal" id="interest-modal" aria-labelledby="interest-title">
  <div class="modal-panel">
    <div class="modal-head"><div><h2 id="interest-title">Tenho interesse</h2><p class="small muted" style="margin:6px 0 0">Sobre: <strong data-interest-subject></strong></p></div><button type="button" class="modal-close" data-close-dialog aria-label="Fechar">{icon('x')}</button></div>
    <div class="modal-body">
      <form data-form class="form-grid">
        <input type="hidden" name="assunto" value="">
        <div class="field"><label for="int-nome">Nome</label><input class="input" id="int-nome" name="nome" autocomplete="name" required><span class="field-error" role="alert"></span></div>
        <div class="field"><label for="int-email">E-mail</label><input class="input" id="int-email" name="email" type="email" inputmode="email" autocomplete="email" required><span class="field-error" role="alert"></span></div>
        <div class="field"><label for="int-vinc">Vínculo</label><select class="select" id="int-vinc" name="vinculo" required><option value="">Selecione</option><option>Estudante</option><option>Pesquisador(a) / Docente</option><option>Servidor(a)</option><option>Empresa</option><option>Startup / Spin-off</option><option>Investidor(a)</option><option>Governo / Setor público</option><option>Sociedade / Outro</option></select><span class="field-error" role="alert"></span></div>
        <div class="field"><label for="int-msg">Comentário <span class="muted">(opcional)</span></label><textarea class="textarea" id="int-msg" name="mensagem" rows="3"></textarea></div>
        <div class="field"><label class="check"><input type="checkbox" required data-msg-required="É necessário consentir para registrar o interesse."> <span>Concordo com o uso destas informações para contato sobre este tema, nos termos da LGPD.</span></label><span class="field-error" role="alert"></span></div>
        <button type="submit" class="btn btn-dark">Registrar interesse {icon('arrow-right','icon-arrow icon-sm')}</button>
      </form>
      <div class="form-status" role="status">{icon('check')}<div><h4>Interesse registrado</h4><p>Versão demonstrativa: nenhum dado foi enviado. Com a integração ativa, a equipe responsável retornará pelo e-mail informado.</p><button type="button" class="btn btn-sm" style="margin-top:12px" data-close-dialog>Fechar</button></div></div>
    </div>
  </div>
</dialog>

<div class="toast-region" aria-live="polite"></div>
''' + ''.join(f'<template id="icon-{n}">{icon(n)}</template>' for n in ['check','arrow-up','arrow-right','arrow-left','refresh','users','thumbs-up','thumbs-down','info'])

def head(P, meta, slug):
    path = '' if slug == 'inicio' else f'{slug}/'
    url = SITE_URL + path
    title = meta['title']
    full = title if slug == 'inicio' else f'{title} · CEI/UFMG'
    desc = meta['description']
    og = SITE_URL + 'assets/img/og/og-cei.png'
    jsonld = ''
    if slug == 'inicio':
        jsonld = '<script type="application/ld+json">' + json.dumps({
            "@context": "https://schema.org", "@type": "Organization",
            "name": "CEI/UFMG — Centro de Empreendedorismo e Inovação",
            "url": SITE_URL, "logo": SITE_URL + "assets/img/logo/cei-ufmg.svg",
            "parentOrganization": {"@type": "CollegeOrUniversity", "name": "Universidade Federal de Minas Gerais", "url": "https://ufmg.br"},
            "address": {"@type": "PostalAddress", "addressLocality": "Belo Horizonte", "addressRegion": "MG", "postalCode": "31270-901", "addressCountry": "BR"}
        }, ensure_ascii=False) + '</script>'
    return f'''<!doctype html>
<html lang="pt-BR" data-base="{P}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{html.escape(full)}</title>
<meta name="description" content="{html.escape(desc)}">
<link rel="canonical" href="{url}">
<meta name="theme-color" content="#FAFAF7">
<meta name="robots" content="index, follow">
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="CEI/UFMG">
<meta property="og:title" content="{html.escape(full)}">
<meta property="og:description" content="{html.escape(desc)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{html.escape(full)}">
<meta name="twitter:description" content="{html.escape(desc)}">
<meta name="twitter:image" content="{og}">
<link rel="icon" href="{P}favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{FONTS}">
<link rel="stylesheet" href="{P}assets/css/style.css">
<link rel="stylesheet" href="{P}assets/css/components.css">
<link rel="stylesheet" href="{P}assets/css/responsive.css">
<script>document.documentElement.classList.add('js')</script>
{jsonld}
</head>'''


E = html.escape
CAT_LABEL = {'empreendedorismo':'Empreendedorismo','inovacao':'Inovação','pesquisa':'Pesquisa','desenvolvimento':'Desenvolvimento tecnológico','capacitacao':'Capacitação','conexao':'Universidade–empresa','internacionalizacao':'Internacionalização',
             'editais':'Editais','financiamento':'Financiamento','parcerias':'Parcerias','mentorias':'Mentorias','eventos':'Eventos','desafios':'Desafios'}
TIPO_LABEL = {'area':'Área','tecnologia':'Tecnologia','competencia':'Competência','laboratorio':'Laboratório','pesquisador':'Pesquisadores','infraestrutura':'Infraestrutura'}
TIPO_ICON = {'area':'layers','tecnologia':'cpu','competencia':'bulb','laboratorio':'flask','pesquisador':'users','infraestrutura':'building'}
EV_ICON = {'feira':'users','seminario':'mic','capacitacao':'graduation','institucional':'landmark','desafio':'target'}

def load(name):
    return json.loads((SRC / 'data' / f'{name}.json').read_text(encoding='utf-8'))

def r_programas(P):
    out = []
    for i, d in enumerate(load('programas')):
        tags = ' '.join([f'cat:{c}' for c in d['cats']] + [f'publico:{x}' for x in d['publico']])
        cats = ''.join(f'<span class="badge{" badge-gold" if j==0 else ""}">{E(CAT_LABEL[c])}</span>' for j, c in enumerate(d['cats'][:2]))
        badges = ''.join(f'<span class="badge">{E(b)}</span>' for b in d['badges'])
        pts = ''.join(f'<li>{E(x)}</li>' for x in d['points'])
        prompt = E(f'Quero saber mais sobre {d["name"]} e se faz sentido para o meu caso.')
        out.append(f"""<article class="card card-interactive reveal" id="programa-{d['id']}" data-filter-item data-detail-card data-tags="{tags}">
  <div class="card-meta">{cats}</div>
  <h3>{E(d['name'])}</h3>
  <p>{E(d['desc'])}</p>
  <dl class="card-dl"><dt>Público</dt><dd>{E(d['publicoLabel'])}</dd><dt>Estágio</dt><dd>{E(d['estagio'])}</dd></dl>
  <div class="card-foot"><span>{E(d['vertical'])}</span><button type="button" class="link-arrow" data-detail-open><span>Ver detalhes</span>{icon('arrow-right')}</button></div>
  <button type="button" class="card-cover" data-detail-open aria-label="Ver detalhes de {E(d['name'])}" tabindex="-1"></button>
  <template class="detail-tpl"><div class="card-meta" style="margin-bottom:16px">{cats}{badges}</div><p>{E(d['long'])}</p>
    <dl class="card-dl" style="margin:16px 0 20px;font-size:.9rem"><dt>Público</dt><dd>{E(d['publicoLabel'])}</dd><dt>Estágio</dt><dd>{E(d['estagio'])}</dd><dt>Vertical</dt><dd>{E(d['vertical'])}</dd></dl>
    <ul class="dot-list">{pts}</ul>
    <div class="cluster" style="margin-top:24px"><button type="button" class="btn btn-primary" data-agent-open data-agent-prompt="{prompt}">Falar com o CEI sobre isso {icon('arrow-right','icon-arrow icon-sm')}</button><button type="button" class="btn" data-interest="{E(d['name'])}">Tenho interesse</button></div></template>
</article>""")
    return '\n'.join(out)

def r_oportunidades(P):
    out = []
    for d in load('oportunidades'):
        tags = ' '.join(f'cat:{c}' for c in d['cats'])
        cats = ''.join(f'<span class="badge">{E(CAT_LABEL[c])}</span>' for c in d['cats'])
        st = d['status']
        stcls = 'badge-teal' if st in ('Fluxo contínuo','Periódico','Anual','Ciclos') else ('badge-gold' if st in ('Previsto','Em estruturação','Em construção') else '')
        pts = ''.join(f'<li>{E(x)}</li>' for x in d['points'])
        long = E(d['long']).replace('[CONTEÚDO INSTITUCIONAL A INSERIR]', '<span class="placeholder-note">[CONTEÚDO INSTITUCIONAL A INSERIR]</span>')
        out.append(f"""<article class="card card-interactive reveal" id="oportunidade-{d['id']}" data-filter-item data-detail-card data-tags="{tags}">
  <div class="card-meta"><span class="badge badge-dot {stcls}">{E(st)}</span>{cats}</div>
  <h3>{E(d['name'])}</h3>
  <p>{E(d['desc'])}</p>
  <dl class="card-dl"><dt>Quando</dt><dd>{E(d['quando'])}</dd><dt>Para</dt><dd>{E(d['publico'])}</dd></dl>
  <div class="card-foot"><button type="button" class="link-arrow" data-detail-open><span>Detalhes</span>{icon('arrow-right')}</button><button type="button" class="btn btn-sm btn-dark" data-interest="{E(d['name'])}">Tenho interesse</button></div>
  <template class="detail-tpl"><div class="card-meta" style="margin-bottom:16px"><span class="badge badge-dot {stcls}">{E(st)}</span>{cats}</div><p>{long}</p>
    <dl class="card-dl" style="margin:16px 0 20px;font-size:.9rem"><dt>Quando</dt><dd>{E(d['quando'])}</dd><dt>Para</dt><dd>{E(d['publico'])}</dd></dl>
    <ul class="dot-list">{pts}</ul>
    <div class="cluster" style="margin-top:24px"><button type="button" class="btn btn-primary" data-interest="{E(d['name'])}">Tenho interesse {icon('arrow-right','icon-arrow icon-sm')}</button><button type="button" class="btn" data-agent-open data-agent-prompt="{E('Tenho interesse em: ' + d['name'] + '. Como posso participar?')}">Perguntar ao Agente CEI</button></div></template>
</article>""")
    return '\n'.join(out)

def r_eventos(P):
    out = []
    for d in load('eventos'):
        out.append(f"""<article class="card card-interactive reveal event-card" id="evento-{d['id']}" data-filter-item data-tags="cat:{d['cat']}">
  <div class="event-when">
    <div class="mono" style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--text-3)">Quando</div>
    <div style="font-weight:600;color:var(--ink);line-height:1.25;margin-top:6px">{E(d['quando'])}</div>
    <div class="small muted" style="font-size:12px;margin-top:4px;line-height:1.35">{E(d['quandoSub'])}</div>
  </div>
  <div style="display:grid;gap:10px;min-width:0;flex:1">
    <div class="card-meta"><span class="badge">{icon(EV_ICON[d['cat']],'icon-sm')}{E(d['catLabel'])}</span></div>
    <h3>{E(d['name'])}</h3>
    <p>{E(d['desc'])}</p>
    <p class="small" style="display:flex;gap:6px;align-items:center;color:var(--text-3)">{icon('pin','icon-sm')}{E(d['local'])}</p>
    <div class="cluster" style="margin-top:4px"><button type="button" class="btn btn-sm btn-dark" data-interest="{E(d['name'])}" data-interest-kind="Quero ser avisado">{icon('bell','icon-sm')}Quero ser avisado</button></div>
  </div>
</article>""")
    return '\n'.join(out)

def r_competencias(P):
    out = []
    for d in load('competencias'):
        tags = ' '.join(f'<span class="tag">{E(t)}</span>' for t in d['tags'])
        prompt = E(f'Preciso me conectar com: {d["name"]} ({d["unidade"]}).')
        out.append(f"""<article class="card reveal" data-filter-item data-tags="tipo:{d['tipo']}" data-search="{E(' '.join(d['tags']))}">
  <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start"><span class="card-icon">{icon(TIPO_ICON[d['tipo']])}</span><span class="badge">{E(TIPO_LABEL[d['tipo']])}</span></div>
  <h3>{E(d['name'])}</h3>
  <p class="small" style="color:var(--text-3);margin:0">{E(d['unidade'])}</p>
  <p>{E(d['desc'])}</p>
  <div class="cluster">{tags}</div>
  <div class="card-foot"><span>Fonte: projeto CEI</span><button type="button" class="link-arrow" data-agent-open data-agent-prompt="{prompt}"><span>Solicitar conexão</span>{icon('arrow-right')}</button></div>
</article>""")
    return '\n'.join(out)

RENDER = {'programas': r_programas, 'oportunidades': r_oportunidades, 'eventos': r_eventos, 'competencias': r_competencias}

def render(text, P):
    text = re.sub(r'\{\{cards:([a-z]+)\}\}', lambda m: RENDER[m.group(1)](P), text)
    text = text.replace('{{P}}', P)
    def ic(m):
        parts = m.group(1).split(':')
        return icon(parts[0], parts[1] if len(parts) > 1 else '')
    text = re.sub(r'\{\{icon:([a-z0-9\-:\s]+)\}\}', ic, text)
    return text

def build():
    pages = sorted((SRC / 'pages').glob('*.html'))
    built = []
    for f in pages:
        raw = f.read_text(encoding='utf-8')
        m = re.match(r'<!--META\s+(\{.*?\})\s*-->\s*', raw, re.S)
        meta = json.loads(m.group(1))
        body = raw[m.end():]
        slug = f.stem
        P = '' if slug == 'inicio' else '../'
        out_dir = OUT if slug == 'inicio' else OUT / slug
        out_dir.mkdir(parents=True, exist_ok=True)
        doc = (head(P, meta, slug) + '\n<body>\n' + header(P, slug) +
               '\n<main id="conteudo" tabindex="-1">\n' + render(body, P) + '\n</main>\n' +
               footer(P) + '\n' + overlays(P) +
               f'\n<script src="{P}assets/js/main.js" defer></script>\n<script src="{P}assets/js/navigation.js" defer></script>\n<script src="{P}assets/js/agent.js" defer></script>\n<script src="{P}assets/js/interactions.js" defer></script>\n</body>\n</html>\n')
        (out_dir / 'index.html').write_text(doc, encoding='utf-8')
        built.append(slug)
    # sitemap
    urls = ''.join(f'  <url><loc>{SITE_URL}{"" if s=="inicio" else s+"/"}</loc><changefreq>monthly</changefreq><priority>{"1.0" if s=="inicio" else "0.7"}</priority></url>\n' for s in built)
    (OUT / 'sitemap.xml').write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>\n', encoding='utf-8')
    (OUT / 'robots.txt').write_text(f'User-agent: *\nAllow: /\n\nSitemap: {SITE_URL}sitemap.xml\n', encoding='utf-8')
    print('built:', ', '.join(built))

if __name__ == '__main__':
    build()
