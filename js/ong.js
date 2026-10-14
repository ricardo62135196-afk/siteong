/**
 * ong.js — painel da ONG
 */

const sessaoOng = protegerPagina('ong');
let ongAtual = sessaoOng ? DB.encontrarOngPorId(sessaoOng.id) : null;

if (ongAtual) {
  document.getElementById('nav-nome-ong').textContent = ongAtual.nome;
  document.getElementById('titulo-ong').textContent = ongAtual.nome;
  document.getElementById('area-ong').textContent = ongAtual.area + ' · ' + ongAtual.email;
  document.title = ongAtual.nome + ' — Painel · Mutirão';
}

// ---------------- Navegação entre abas do painel ----------------

function mudarPainel(nome) {
  ['postagens', 'nova', 'perfil'].forEach(n => {
    document.getElementById('painel-' + n).classList.toggle('painel-secao--ativa', n === nome);
    const botaoPainel = document.getElementById('botao-painel-' + n);
    botaoPainel.classList.toggle('painel-abas__botao--ativa', n === nome);
    if (n === nome) botaoPainel.setAttribute('aria-current', 'true'); else botaoPainel.removeAttribute('aria-current');
  });
  if (nome === 'perfil') preencherFormPerfil();
}

// ---------------- Minhas postagens ----------------

function renderMinhasPostagens() {
  const todas = DB.getPostagens().filter(p => p.ongId === ongAtual.id)
    .sort((a, b) => new Date(a.data) - new Date(b.data));
  const grade = document.getElementById('grade-minhas-postagens');

  if (todas.length === 0) {
    grade.innerHTML = `
      <div class="estado-vazio" style="grid-column:1/-1">
        <strong>Nenhuma postagem ainda</strong>
        Publique a primeira oportunidade da sua ONG.
      </div>`;
    return;
  }

  grade.innerHTML = todas.map(p => {
    const ocupadas = DB.vagasOcupadas(p.id);
    const cheias = ocupadas >= p.vagas;
    const percentual = Math.min(100, Math.round((ocupadas / p.vagas) * 100));
    return `
      <article class="cartao-postagem">
        ${imagemPostagemHTML(p)}
        <div class="cartao-postagem__topo">
          <span class="badge">${escapeHTML(p.categoria)}</span>
          ${cheias ? '<span class="badge badge--coral">Lotado</span>' : ''}
        </div>
        <h3>${escapeHTML(p.titulo)}</h3>
        <p class="cartao-postagem__desc">${escapeHTML(p.descricao)}</p>
        <div class="cartao-postagem__meta">
          <span>📍 ${escapeHTML(p.local)}</span>
          <span>📅 ${formatarData(p.data)}</span>
        </div>
        <div class="vagas-barra"><div class="vagas-barra__preenchida ${cheias ? 'vagas-barra__preenchida--cheia' : ''}" style="width:${percentual}%"></div></div>
        <div class="cartao-postagem__meta" style="border-top:none;padding-top:0">
          <span>${ocupadas} de ${p.vagas} vagas preenchidas</span>
        </div>
        <div class="cartao-postagem__acoes">
          <button class="btn btn--fantasma btn--pequeno" onclick="abrirModalInscritos('${p.id}')">Ver inscritos (${ocupadas})</button>
          <button class="btn btn--fantasma btn--pequeno" onclick="editarPostagem('${p.id}')">Editar</button>
          <button class="btn btn--perigo btn--pequeno" onclick="excluirPostagem('${p.id}')">Excluir</button>
        </div>
      </article>
    `;
  }).join('');
}

// ---------------- Criar / editar postagem ----------------

// Imagem da postagem em edição (data URL). Vazio = sem imagem.
let imagemAtual = '';

function definirPrevia(src) {
  const caixa = document.getElementById('previa-imagem');
  document.getElementById('previa-imagem-img').src = src || '';
  caixa.hidden = !src;
}

function removerImagemPostagem() {
  imagemAtual = '';
  document.getElementById('p-imagem').value = '';
  definirPrevia('');
}

document.getElementById('p-imagem').addEventListener('change', function () {
  const arquivo = this.files[0];
  if (!arquivo) return;
  processarImagem(arquivo)
    .then(dataUrl => { imagemAtual = dataUrl; definirPrevia(dataUrl); })
    .catch(erro => { mostrarToast(erro.message, 'erro'); removerImagemPostagem(); });
});

function abrirNovaPostagem() {
  document.getElementById('form-postagem').reset();
  removerImagemPostagem();
  document.getElementById('p-id').value = '';
  document.getElementById('titulo-form-postagem').textContent = 'Nova postagem';
  document.getElementById('botao-salvar-postagem').textContent = 'Publicar postagem';
  ['campo-p-titulo', 'campo-p-categoria', 'campo-p-vagas', 'campo-p-descricao', 'campo-p-local', 'campo-p-data']
    .forEach(id => document.getElementById(id).classList.remove('campo--invalido'));
  mudarPainel('nova');
}

function editarPostagem(id) {
  const p = DB.encontrarPostagemPorId(id);
  if (!p) return;
  document.getElementById('p-id').value = p.id;
  document.getElementById('p-titulo').value = p.titulo;
  document.getElementById('p-categoria').value = p.categoria;
  document.getElementById('p-vagas').value = p.vagas;
  document.getElementById('p-descricao').value = p.descricao;
  document.getElementById('p-local').value = p.local;
  document.getElementById('p-data').value = p.data;
  document.getElementById('p-imagem').value = '';
  imagemAtual = p.imagem || '';
  definirPrevia(imagemAtual);
  document.getElementById('titulo-form-postagem').textContent = 'Editar postagem';
  document.getElementById('botao-salvar-postagem').textContent = 'Salvar alterações';
  mudarPainel('nova');
}

function cancelarEdicaoPostagem() {
  document.getElementById('form-postagem').reset();
  removerImagemPostagem();
  mudarPainel('postagens');
}

function excluirPostagem(id) {
  const p = DB.encontrarPostagemPorId(id);
  if (!p) return;
  if (!confirm('Excluir a postagem "' + p.titulo + '"? As inscrições relacionadas também serão removidas.')) return;

  DB.salvarPostagens(DB.getPostagens().filter(x => x.id !== id));
  DB.salvarInscricoes(DB.getInscricoes().filter(i => i.postagemId !== id));
  renderMinhasPostagens();
  mostrarToast('Postagem excluída.');
}

document.getElementById('form-postagem').addEventListener('submit', function (e) {
  e.preventDefault();

  const id = document.getElementById('p-id').value;
  const titulo = document.getElementById('p-titulo').value.trim();
  const categoria = document.getElementById('p-categoria').value;
  const vagas = parseInt(document.getElementById('p-vagas').value, 10);
  const descricao = document.getElementById('p-descricao').value.trim();
  const local = document.getElementById('p-local').value.trim();
  const data = document.getElementById('p-data').value;

  const campos = ['campo-p-titulo', 'campo-p-categoria', 'campo-p-vagas', 'campo-p-descricao', 'campo-p-local', 'campo-p-data'];
  campos.forEach(c => document.getElementById(c).classList.remove('campo--invalido'));
  let valido = true;

  if (titulo.length < 4) { document.getElementById('campo-p-titulo').classList.add('campo--invalido'); valido = false; }
  if (!categoria) { document.getElementById('campo-p-categoria').classList.add('campo--invalido'); valido = false; }
  if (!vagas || vagas < 1) { document.getElementById('campo-p-vagas').classList.add('campo--invalido'); valido = false; }
  if (descricao.length < 8) { document.getElementById('campo-p-descricao').classList.add('campo--invalido'); valido = false; }
  if (local.length < 3) { document.getElementById('campo-p-local').classList.add('campo--invalido'); valido = false; }
  if (!data) { document.getElementById('campo-p-data').classList.add('campo--invalido'); valido = false; }

  if (!valido) return;

  const postagens = DB.getPostagens();

  if (id) {
    const indice = postagens.findIndex(p => p.id === id);
    if (indice !== -1) {
      postagens[indice] = { ...postagens[indice], titulo, categoria, vagas, descricao, local, data, imagem: imagemAtual };
    }
  } else {
    postagens.push({
      id: gerarId(), ongId: ongAtual.id, titulo, categoria, vagas, descricao, local, data,
      imagem: imagemAtual, dataCriacao: new Date().toISOString()
    });
  }

  try {
    DB.salvarPostagens(postagens);
  } catch (erro) {
    mostrarToast('Armazenamento do navegador cheio. Remova a imagem ou apague postagens antigas.', 'erro');
    return;
  }

  mostrarToast(id ? 'Postagem atualizada.' : 'Postagem publicada no mural!');
  document.getElementById('form-postagem').reset();
  removerImagemPostagem();
  renderMinhasPostagens();
  mudarPainel('postagens');
});

// ---------------- Modal de inscritos ----------------

function abrirModalInscritos(postagemId) {
  const p = DB.encontrarPostagemPorId(postagemId);
  if (!p) return;
  document.getElementById('modal-inscritos-titulo').textContent = p.titulo;

  const inscricoes = DB.getInscricoes().filter(i => i.postagemId === postagemId)
    .sort((a, b) => new Date(a.dataInscricao) - new Date(b.dataInscricao));

  const lista = document.getElementById('modal-inscritos-lista');
  if (inscricoes.length === 0) {
    lista.innerHTML = '<div class="estado-vazio">Ninguém se inscreveu nesta postagem ainda.</div>';
  } else {
    lista.innerHTML = inscricoes.map(i => {
      const u = DB.encontrarUsuarioPorId(i.usuarioId);
      if (!u) return '';
      return `
        <li>
          <div>
            <div class="nome">${escapeHTML(u.nome)}</div>
            <div class="contato">${escapeHTML(u.email)} · ${escapeHTML(u.telefone)}</div>
          </div>
        </li>`;
    }).join('');
  }

  document.getElementById('modal-inscritos').classList.add('modal-fundo--visivel');
}

function fecharModalInscritos() {
  document.getElementById('modal-inscritos').classList.remove('modal-fundo--visivel');
}

document.getElementById('modal-inscritos').addEventListener('click', function (e) {
  if (e.target === this) fecharModalInscritos();
});

// ---------------- Perfil ----------------

function preencherFormPerfil() {
  document.getElementById('pf-nome').value = ongAtual.nome;
  document.getElementById('pf-email').value = ongAtual.email;
  document.getElementById('pf-cnpj').value = ongAtual.cnpj;
  document.getElementById('pf-area').value = ongAtual.area;
  document.getElementById('pf-descricao').value = ongAtual.descricao;
}

document.getElementById('form-perfil-ong').addEventListener('submit', function (e) {
  e.preventDefault();

  const nome = document.getElementById('pf-nome').value.trim();
  const area = document.getElementById('pf-area').value;
  const descricao = document.getElementById('pf-descricao').value.trim();

  document.getElementById('campo-pf-nome').classList.remove('campo--invalido');
  document.getElementById('campo-pf-descricao').classList.remove('campo--invalido');
  let valido = true;
  if (nome.length < 2) { document.getElementById('campo-pf-nome').classList.add('campo--invalido'); valido = false; }
  if (descricao.length < 10) { document.getElementById('campo-pf-descricao').classList.add('campo--invalido'); valido = false; }
  if (!valido) return;

  const ongs = DB.getOngs();
  const indice = ongs.findIndex(o => o.id === ongAtual.id);
  ongs[indice] = { ...ongs[indice], nome, area, descricao };
  DB.salvarOngs(ongs);
  ongAtual = ongs[indice];

  document.getElementById('nav-nome-ong').textContent = ongAtual.nome;
  document.getElementById('titulo-ong').textContent = ongAtual.nome;
  document.getElementById('area-ong').textContent = ongAtual.area + ' · ' + ongAtual.email;

  mostrarToast('Perfil atualizado.');
});

// ---------------- Início ----------------

if (ongAtual) renderMinhasPostagens();
