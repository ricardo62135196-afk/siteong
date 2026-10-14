/**
 * login.js — abas ONG/voluntário e autenticação
 */

function mudarAbaLogin(nome) {
  const abas = ['voluntario', 'ong'];
  abas.forEach(a => {
    document.getElementById('botao-aba-' + a).classList.toggle('abas__botao--ativa', a === nome);
    document.getElementById('botao-aba-' + a).setAttribute('aria-selected', a === nome);
    document.getElementById('conteudo-aba-' + a).classList.toggle('aba-conteudo--ativa', a === nome);
  });
}

document.getElementById('form-login-voluntario').addEventListener('submit', function (e) {
  e.preventDefault();
  const email = document.getElementById('lv-email').value.trim();
  const senha = document.getElementById('lv-senha').value;

  document.getElementById('campo-lv-email').classList.remove('campo--invalido');
  document.getElementById('campo-lv-senha').classList.remove('campo--invalido');

  const usuario = DB.encontrarUsuarioPorEmail(email);

  if (!usuario || usuario.senha !== senha) {
    document.getElementById('campo-lv-senha').classList.add('campo--invalido');
    document.getElementById('campo-lv-senha').querySelector('.campo__erro').textContent = 'E-mail ou senha incorretos.';
    mostrarToast('E-mail ou senha incorretos.', 'erro');
    return;
  }

  DB.definirSessao({ tipo: 'usuario', id: usuario.id });
  mostrarToast('Bem-vindo(a) de volta, ' + usuario.nome.split(' ')[0] + '!');
  setTimeout(() => window.location.href = 'usuario.html', 400);
});

document.getElementById('form-login-ong').addEventListener('submit', function (e) {
  e.preventDefault();
  const email = document.getElementById('lo-email').value.trim();
  const senha = document.getElementById('lo-senha').value;

  document.getElementById('campo-lo-email').classList.remove('campo--invalido');
  document.getElementById('campo-lo-senha').classList.remove('campo--invalido');

  const ong = DB.encontrarOngPorEmail(email);

  if (!ong || ong.senha !== senha) {
    document.getElementById('campo-lo-senha').classList.add('campo--invalido');
    document.getElementById('campo-lo-senha').querySelector('.campo__erro').textContent = 'E-mail ou senha incorretos.';
    mostrarToast('E-mail ou senha incorretos.', 'erro');
    return;
  }

  DB.definirSessao({ tipo: 'ong', id: ong.id });
  mostrarToast('Bem-vindo(a) de volta, ' + ong.nome + '!');
  setTimeout(() => window.location.href = 'ong.html', 400);
});
