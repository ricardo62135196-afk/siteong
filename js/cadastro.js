/**
 * cadastro.js — abas ONG/voluntário e criação de contas
 */

function mudarAba(nome) {
  const abas = ['voluntario', 'ong'];
  abas.forEach(a => {
    document.getElementById('botao-aba-' + a).classList.toggle('abas__botao--ativa', a === nome);
    document.getElementById('botao-aba-' + a).setAttribute('aria-selected', a === nome);
    document.getElementById('conteudo-aba-' + a).classList.toggle('aba-conteudo--ativa', a === nome);
  });
}

function marcarInvalido(idCampo, mensagem) {
  const campo = document.getElementById(idCampo);
  campo.classList.add('campo--invalido');
  if (mensagem) campo.querySelector('.campo__erro').textContent = mensagem;
}

function limparInvalido(idCampo) {
  document.getElementById(idCampo).classList.remove('campo--invalido');
}

function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function somenteDigitos(texto) {
  return String(texto).replace(/\D/g, '');
}

// ---------------- Cadastro de voluntário ----------------

document.getElementById('form-cadastro-voluntario').addEventListener('submit', function (e) {
  e.preventDefault();

  const nome = document.getElementById('v-nome').value.trim();
  const email = document.getElementById('v-email').value.trim();
  const telefone = document.getElementById('v-telefone').value.trim();
  const senha = document.getElementById('v-senha').value;
  const senha2 = document.getElementById('v-senha2').value;

  ['campo-v-nome', 'campo-v-email', 'campo-v-telefone', 'campo-v-senha', 'campo-v-senha2'].forEach(limparInvalido);
  let valido = true;

  if (nome.length < 3) { marcarInvalido('campo-v-nome'); valido = false; }
  if (!emailValido(email)) { marcarInvalido('campo-v-email'); valido = false; }
  if (somenteDigitos(telefone).length < 8) { marcarInvalido('campo-v-telefone'); valido = false; }
  if (senha.length < 6) { marcarInvalido('campo-v-senha'); valido = false; }
  if (senha !== senha2) { marcarInvalido('campo-v-senha2'); valido = false; }

  if (!valido) return;

  if (DB.emailJaCadastrado(email)) {
    marcarInvalido('campo-v-email', 'Este e-mail já está cadastrado.');
    mostrarToast('Este e-mail já está em uso.', 'erro');
    return;
  }

  const usuarios = DB.getUsuarios();
  const novo = {
    id: gerarId(),
    nome, email, telefone, senha,
    dataCadastro: new Date().toISOString()
  };
  usuarios.push(novo);
  DB.salvarUsuarios(usuarios);
  DB.definirSessao({ tipo: 'usuario', id: novo.id });

  mostrarToast('Conta criada! Bem-vindo(a), ' + nome.split(' ')[0] + '.');
  setTimeout(() => window.location.href = 'usuario.html', 500);
});

// ---------------- Cadastro de ONG ----------------

document.getElementById('form-cadastro-ong').addEventListener('submit', function (e) {
  e.preventDefault();

  const nome = document.getElementById('o-nome').value.trim();
  const email = document.getElementById('o-email').value.trim();
  const cnpj = document.getElementById('o-cnpj').value.trim();
  const area = document.getElementById('o-area').value;
  const descricao = document.getElementById('o-descricao').value.trim();
  const senha = document.getElementById('o-senha').value;
  const senha2 = document.getElementById('o-senha2').value;

  ['campo-o-nome', 'campo-o-email', 'campo-o-cnpj', 'campo-o-area', 'campo-o-descricao', 'campo-o-senha', 'campo-o-senha2'].forEach(limparInvalido);
  let valido = true;

  if (nome.length < 2) { marcarInvalido('campo-o-nome'); valido = false; }
  if (!emailValido(email)) { marcarInvalido('campo-o-email'); valido = false; }
  if (somenteDigitos(cnpj).length !== 14) { marcarInvalido('campo-o-cnpj'); valido = false; }
  if (!area) { marcarInvalido('campo-o-area'); valido = false; }
  if (descricao.length < 10) { marcarInvalido('campo-o-descricao'); valido = false; }
  if (senha.length < 6) { marcarInvalido('campo-o-senha'); valido = false; }
  if (senha !== senha2) { marcarInvalido('campo-o-senha2'); valido = false; }

  if (!valido) return;

  if (DB.emailJaCadastrado(email)) {
    marcarInvalido('campo-o-email', 'Este e-mail já está cadastrado.');
    mostrarToast('Este e-mail já está em uso.', 'erro');
    return;
  }

  const ongs = DB.getOngs();
  const nova = {
    id: gerarId(),
    nome, email, cnpj, area, descricao, senha,
    dataCadastro: new Date().toISOString()
  };
  ongs.push(nova);
  DB.salvarOngs(ongs);
  DB.definirSessao({ tipo: 'ong', id: nova.id });

  mostrarToast('ONG cadastrada! Bem-vindo(a), ' + nome + '.');
  setTimeout(() => window.location.href = 'ong.html', 500);
});
