/**
 * storage.js
 * Camada de dados do Mutirão — tudo é salvo no localStorage do navegador.
 * Nenhum servidor ou banco de dados externo é utilizado.
 */

const DB_KEYS = {
  ongs: 'mutirao_ongs',
  usuarios: 'mutirao_usuarios',
  postagens: 'mutirao_postagens',
  inscricoes: 'mutirao_inscricoes',
  sessao: 'mutirao_sessao',
  seed: 'mutirao_seed_v1'
};

function gerarId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

function lerLista(chave) {
  try {
    const dados = localStorage.getItem(chave);
    return dados ? JSON.parse(dados) : [];
  } catch (erro) {
    console.error('Não foi possível ler', chave, erro);
    return [];
  }
}

function salvarLista(chave, lista) {
  localStorage.setItem(chave, JSON.stringify(lista));
}

const DB = {
  // ---- ONGs ----
  getOngs: () => lerLista(DB_KEYS.ongs),
  salvarOngs: (lista) => salvarLista(DB_KEYS.ongs, lista),
  encontrarOngPorId: (id) => DB.getOngs().find(o => o.id === id) || null,
  encontrarOngPorEmail: (email) => DB.getOngs().find(o => o.email.toLowerCase() === String(email).trim().toLowerCase()) || null,

  // ---- Usuários (voluntários) ----
  getUsuarios: () => lerLista(DB_KEYS.usuarios),
  salvarUsuarios: (lista) => salvarLista(DB_KEYS.usuarios, lista),
  encontrarUsuarioPorId: (id) => DB.getUsuarios().find(u => u.id === id) || null,
  encontrarUsuarioPorEmail: (email) => DB.getUsuarios().find(u => u.email.toLowerCase() === String(email).trim().toLowerCase()) || null,

  // ---- Postagens (oportunidades de voluntariado) ----
  getPostagens: () => lerLista(DB_KEYS.postagens),
  salvarPostagens: (lista) => salvarLista(DB_KEYS.postagens, lista),
  encontrarPostagemPorId: (id) => DB.getPostagens().find(p => p.id === id) || null,

  // ---- Inscrições (usuário inscrito em uma postagem) ----
  getInscricoes: () => lerLista(DB_KEYS.inscricoes),
  salvarInscricoes: (lista) => salvarLista(DB_KEYS.inscricoes, lista),

  // ---- Sessão (quem está logado agora) ----
  getSessao: () => {
    try {
      const dados = localStorage.getItem(DB_KEYS.sessao);
      return dados ? JSON.parse(dados) : null;
    } catch (erro) {
      return null;
    }
  },
  definirSessao: (objeto) => localStorage.setItem(DB_KEYS.sessao, JSON.stringify(objeto)),
  limparSessao: () => localStorage.removeItem(DB_KEYS.sessao),

  // ---- Utilitários ----
  emailJaCadastrado: (email) => {
    const alvo = String(email).trim().toLowerCase();
    return DB.getOngs().some(o => o.email.toLowerCase() === alvo) ||
           DB.getUsuarios().some(u => u.email.toLowerCase() === alvo);
  },

  vagasOcupadas: (postagemId) => DB.getInscricoes().filter(i => i.postagemId === postagemId).length,

  usuarioInscrito: (postagemId, usuarioId) =>
    DB.getInscricoes().some(i => i.postagemId === postagemId && i.usuarioId === usuarioId),
};

/**
 * Popula o navegador com algumas ONGs e postagens de exemplo na primeira
 * visita, só para o site não parecer vazio. Roda uma única vez.
 */
function popularDadosDemo() {
  if (localStorage.getItem(DB_KEYS.seed)) return;

  const ongs = [
    {
      id: gerarId(), nome: 'Mãos que Plantam', email: 'contato@maosqueplantam.org.br',
      senha: '123456', cnpj: '12.345.678/0001-90', area: 'Meio Ambiente',
      descricao: 'Recuperação de áreas verdes e mutirões de plantio de árvores nativas.',
      dataCadastro: new Date().toISOString()
    },
    {
      id: gerarId(), nome: 'Instituto Ler é Viver', email: 'contato@lereviver.org.br',
      senha: '123456', cnpj: '23.456.789/0001-01', area: 'Educação',
      descricao: 'Bibliotecas comunitárias e incentivo à leitura em bairros periféricos.',
      dataCadastro: new Date().toISOString()
    },
    {
      id: gerarId(), nome: 'Patas da Rua', email: 'contato@patasdarua.org.br',
      senha: '123456', cnpj: '34.567.890/0001-12', area: 'Bem-estar Animal',
      descricao: 'Resgate, castração e adoção responsável de animais em situação de rua.',
      dataCadastro: new Date().toISOString()
    }
  ];

  const hoje = new Date();
  const emDias = (n) => {
    const d = new Date(hoje);
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };

  const postagens = [
    {
      id: gerarId(), ongId: ongs[0].id, titulo: 'Mutirão de plantio no Parque das Águas',
      categoria: 'Meio Ambiente', descricao: 'Vamos plantar 200 mudas nativas na margem do rio. Traga roupas que possam sujar e protetor solar.',
      local: 'Parque das Águas, Canoinhas/SC', data: emDias(12), vagas: 25, dataCriacao: new Date().toISOString()
    },
    {
      id: gerarId(), ongId: ongs[1].id, titulo: 'Contação de histórias na biblioteca comunitária',
      categoria: 'Educação', descricao: 'Precisamos de voluntários para contar histórias para crianças de 4 a 10 anos, todo sábado de manhã.',
      local: 'Biblioteca Comunitária Vila Nova', data: emDias(5), vagas: 8, dataCriacao: new Date().toISOString()
    },
    {
      id: gerarId(), ongId: ongs[2].id, titulo: 'Feira de adoção de cães e gatos',
      categoria: 'Bem-estar Animal', descricao: 'Ajude a organizar a feira: montagem de espaço, apresentação dos animais e cadastro de adotantes.',
      local: 'Praça Central', data: emDias(20), vagas: 15, dataCriacao: new Date().toISOString()
    },
    {
      id: gerarId(), ongId: ongs[0].id, titulo: 'Oficina de compostagem doméstica',
      categoria: 'Meio Ambiente', descricao: 'Ensinaremos moradores a montar composteiras caseiras. Precisamos de monitores para as bancadas.',
      local: 'Centro Comunitário Bela Vista', data: emDias(30), vagas: 10, dataCriacao: new Date().toISOString()
    }
  ];

  salvarLista(DB_KEYS.ongs, ongs);
  salvarLista(DB_KEYS.postagens, postagens);
  localStorage.setItem(DB_KEYS.seed, '1');
}

popularDadosDemo();
