/**
 * usuario.js — painel do voluntário
 */

const sessaoUsuario = protegerPagina('usuario');
let usuarioAtual = sessaoUsuario ? DB.encontrarUsuarioPorId(sessaoUsuario.id) : null;

if (usuarioAtual) {
  document.getElementById('nav-nome-usuario').textContent = usuarioAtual.nome.split(' ')[0];
  document.getElementById('titulo-usuario').textContent = 'Olá, ' + usuarioAtual.nome.split(' ')[0];
  document.title = usuarioAtual.nome + ' — Painel · Mutirão';
}

// ---------------- Navegação entre abas do painel ----------------

function mudarPainelUsuario(nome) {
  ['disponiveis', 'inscricoes', 'perfil'].forEach(n => {
    document.getElementById('painel-' + n).classList.toggle('painel-secao--ativa', n === nome);
    document.getElementById('botao-painel-' + n).classList.toggle('painel-abas__botao--ativa', n === nome);
  });
  if (nome === 'inscricoes') renderInscricoes();
  if (nome === 'perfil') preencherFormPerfilUsuario();
}

// ---------------- Oportunidades disponíveis ----------------

function cartaoPostagemHTML(p, comAcaoInscricao) {
  const ong = DB.encontrarOngPorId(p.ongId);
  const ocupadas = DB.vagasOcupadas(p.id);
  const cheias = ocupadas >= p.vagas;
  const inscrito = usuarioAtual && DB.usuarioInscrito(p.id, usuarioAtual.id);
  const percentual = Math.min(100, Math.round((ocupadas / p.vagas) * 100));

  let botaoAcao = '';
  if (comAcaoInscricao) {
    if (inscrito) {
      botaoAcao = `<button class="btn btn--perigo btn--pequeno btn--bloco" onclick="cancelarInscricao('${p.id}')">Cancelar inscrição</button>`;
    } else if (cheias) {
      botaoAcao = `<button class="btn btn--fantasma btn--pequeno btn--bloco" disabled>Vagas esgotadas</button>`;
    } else {
      botaoAcao = `<button class="btn btn--verde btn--pequeno btn--bloco" onclick="inscrever('${p.id}')">Inscrever-se</button>`;
    }
  } else {
    botaoAcao = `<button class="btn btn--perigo btn--pequeno btn--bloco" onclick="cancelarInscricao('${p.id}')">Cancelar inscrição</button>`;
  }

  return `
    <article class="cartao-postagem">
      ${imagemPostagemHTML(p)}
      <div class="cartao-postagem__topo">
        <span class="badge">${escapeHTML(p.categoria)}</span>
        ${inscrito ? '<span class="badge badge--sol">Inscrito</span>' : (cheias ? '<span class="badge badge--coral">Lotado</span>' : '')}
      </div>
      <h3>${escapeHTML(p.titulo)}</h3>
      <p class="cartao-postagem__ong">${ong ? escapeHTML(ong.nome) : 'ONG'}</p>
      <p class="cartao-postagem__desc">${escapeHTML(p.descricao)}</p>
      <div class="cartao-postagem__meta">
        <span>📍 ${escapeHTML(p.local)}</span>
        <span>📅 ${formatarData(p.data)}</span>
      </div>
      <div class="vagas-barra"><div class="vagas-barra__preenchida ${cheias ? 'vagas-barra__preenchida--cheia' : ''}" style="width:${percentual}%"></div></div>
      <div class="cartao-postagem__meta" style="border-top:none;padding-top:0">
        <span>${ocupadas} de ${p.vagas} vagas preenchidas</span>
      </div>
      <div class="cartao-postagem__acoes">${botaoAcao}</div>
    </article>
  `;
}

function renderDisponiveis() {
  const busca = document.getElementById('filtro-busca').value.trim().toLowerCase();
  const categoria = document.getElementById('filtro-categoria').value;

  let postagens = DB.getPostagens().sort((a, b) => new Date(a.data) - new Date(b.data));

  if (busca) {
    postagens = postagens.filter(p =>
      p.titulo.toLowerCase().includes(busca) || p.local.toLowerCase().includes(busca));
  }
  if (categoria) {
    postagens = postagens.filter(p => p.categoria === categoria);
  }

  const grade = document.getElementById('grade-disponiveis');

  if (postagens.length === 0) {
    grade.innerHTML = `
      <div class="estado-vazio" style="grid-column:1/-1">
        <strong>Nenhuma oportunidade encontrada</strong>
        Tente mudar os filtros de busca.
      </div>`;
    return;
  }

  grade.innerHTML = postagens.map(p => cartaoPostagemHTML(p, true)).join('');
}

document.getElementById('filtro-busca').addEventListener('input', renderDisponiveis);
document.getElementById('filtro-categoria').addEventListener('change', renderDisponiveis);

// Enter abre a lista de categorias (por padrão só Espaço ou Alt+↓ abrem o select)
document.getElementById('filtro-categoria').addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && typeof this.showPicker === 'function') {
    e.preventDefault();
    try { this.showPicker(); } catch (erro) { /* navegador sem suporte: mantém o padrão */ }
  }
});

// ---------------- Minhas inscrições ----------------

function renderInscricoes() {
  const minhasInscricoes = DB.getInscricoes().filter(i => i.usuarioId === usuarioAtual.id);
  const postagens = minhasInscricoes
    .map(i => DB.encontrarPostagemPorId(i.postagemId))
    .filter(Boolean)
    .sort((a, b) => new Date(a.data) - new Date(b.data));

  const grade = document.getElementById('grade-inscricoes');

  if (postagens.length === 0) {
    grade.innerHTML = `
      <div class="estado-vazio" style="grid-column:1/-1">
        <strong>Você ainda não se inscreveu em nada</strong>
        Veja as oportunidades disponíveis e encontre uma causa.
      </div>`;
    return;
  }

  grade.innerHTML = postagens.map(p => cartaoPostagemHTML(p, false)).join('');
}

// ---------------- Ações de inscrição ----------------

function inscrever(postagemId) {
  const p = DB.encontrarPostagemPorId(postagemId);
  if (!p) return;

  if (DB.usuarioInscrito(postagemId, usuarioAtual.id)) {
    mostrarToast('Você já está inscrito nesta postagem.', 'erro');
    return;
  }
  if (DB.vagasOcupadas(postagemId) >= p.vagas) {
    mostrarToast('As vagas para esta postagem se esgotaram.', 'erro');
    renderDisponiveis();
    return;
  }

  const inscricoes = DB.getInscricoes();
  inscricoes.push({
    id: gerarId(), postagemId, usuarioId: usuarioAtual.id,
    dataInscricao: new Date().toISOString()
  });
  DB.salvarInscricoes(inscricoes);

  mostrarToast('Inscrição confirmada em "' + p.titulo + '"!');
  renderDisponiveis();
}

function cancelarInscricao(postagemId) {
  const p = DB.encontrarPostagemPorId(postagemId);
  DB.salvarInscricoes(DB.getInscricoes().filter(i => !(i.postagemId === postagemId && i.usuarioId === usuarioAtual.id)));
  mostrarToast('Inscrição cancelada' + (p ? ' em "' + p.titulo + '".' : '.'));
  renderDisponiveis();
  renderInscricoes();
}

// ---------------- Perfil ----------------

function preencherFormPerfilUsuario() {
  document.getElementById('pu-nome').value = usuarioAtual.nome;
  document.getElementById('pu-email').value = usuarioAtual.email;
  document.getElementById('pu-telefone').value = usuarioAtual.telefone;
}

document.getElementById('form-perfil-usuario').addEventListener('submit', function (e) {
  e.preventDefault();

  const nome = document.getElementById('pu-nome').value.trim();
  const telefone = document.getElementById('pu-telefone').value.trim();

  document.getElementById('campo-pu-nome').classList.remove('campo--invalido');
  document.getElementById('campo-pu-telefone').classList.remove('campo--invalido');
  let valido = true;
  if (nome.length < 3) { document.getElementById('campo-pu-nome').classList.add('campo--invalido'); valido = false; }
  if (telefone.replace(/\D/g, '').length < 8) { document.getElementById('campo-pu-telefone').classList.add('campo--invalido'); valido = false; }
  if (!valido) return;

  const usuarios = DB.getUsuarios();
  const indice = usuarios.findIndex(u => u.id === usuarioAtual.id);
  usuarios[indice] = { ...usuarios[indice], nome, telefone };
  DB.salvarUsuarios(usuarios);
  usuarioAtual = usuarios[indice];

  document.getElementById('nav-nome-usuario').textContent = usuarioAtual.nome.split(' ')[0];
  document.getElementById('titulo-usuario').textContent = 'Olá, ' + usuarioAtual.nome.split(' ')[0];

  mostrarToast('Perfil atualizado.');
});

// ---------------- Início ----------------

if (usuarioAtual) renderDisponiveis();
