/**
 * ui.js — helpers compartilhados por todas as páginas
 */

/** Redireciona para o login se ninguém (ou o tipo errado) estiver logado. */
function protegerPagina(tipoEsperado) {
  const sessao = DB.getSessao();
  if (!sessao || sessao.tipo !== tipoEsperado) {
    window.location.href = 'login.html';
    return null;
  }
  return sessao;
}

function sair() {
  DB.limparSessao();
  window.location.href = 'index.html';
}

/** Mostra uma mensagem temporária no canto da tela. tipo: 'sucesso' | 'erro' */
function mostrarToast(mensagem, tipo = 'sucesso') {
  let area = document.getElementById('toast-area');
  if (!area) {
    area = document.createElement('div');
    area.id = 'toast-area';
    document.body.appendChild(area);
  }
  const toast = document.createElement('div');
  toast.className = 'toast toast--' + tipo;
  toast.textContent = mensagem;
  area.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast--visivel'));
  setTimeout(() => {
    toast.classList.remove('toast--visivel');
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

function formatarData(dataISO) {
  if (!dataISO) return '';
  const d = new Date(dataISO + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function escapeHTML(texto) {
  const div = document.createElement('div');
  div.textContent = texto ?? '';
  return div.innerHTML;
}

/** Marca o link de navegação da página atual como ativo. */
function marcarNavAtiva() {
  const atual = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('[data-nav]').forEach(link => {
    if (link.getAttribute('data-nav') === atual) link.classList.add('nav__link--ativo');
  });
}
document.addEventListener('DOMContentLoaded', marcarNavAtiva);

/**
 * Lê uma imagem escolhida pelo usuário, reduz para no máximo 800px de largura
 * e devolve um data URL JPEG. Assim ela fica leve o bastante para o localStorage.
 */
function processarImagem(arquivo, larguraMax = 800, qualidade = 0.8) {
  return new Promise((resolve, reject) => {
    if (!arquivo || !arquivo.type.startsWith('image/')) {
      reject(new Error('Escolha um arquivo de imagem.'));
      return;
    }
    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
    leitor.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Essa imagem não pôde ser aberta.'));
      img.onload = () => {
        const escala = Math.min(1, larguraMax / img.width);
        const largura = Math.round(img.width * escala);
        const altura = Math.round(img.height * escala);
        const canvas = document.createElement('canvas');
        canvas.width = largura;
        canvas.height = altura;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff'; // PNG transparente vira fundo branco no JPEG
        ctx.fillRect(0, 0, largura, altura);
        ctx.drawImage(img, 0, 0, largura, altura);
        resolve(canvas.toDataURL('image/jpeg', qualidade));
      };
      img.src = leitor.result;
    };
    leitor.readAsDataURL(arquivo);
  });
}

/** HTML da imagem de uma postagem (vazio se a postagem não tiver imagem). */
function imagemPostagemHTML(p) {
  if (!p.imagem || !String(p.imagem).startsWith('data:image/')) return '';
  return `<img class="cartao-postagem__imagem" src="${p.imagem}" alt="${escapeHTML(p.titulo)}" loading="lazy" />`;
}

