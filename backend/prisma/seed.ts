import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Conteúdo público de exemplo (estudos + giras/oficinas). Seguro para prod: só upsert, não apaga financeiro. */
async function seedPortalContent() {
  const materiais = [
    {
      slug: 'ervas-sagradas-intro',
      categoria: 'ERVAS' as const,
      titulo: 'Ervas sagradas — introdução respeitosa',
      resumo:
        'Noções iniciais sobre o uso de ervas na Umbanda: respeito à tradição, intenção e orientação dos mais velhos.',
      corpo: `As ervas acompanham o trabalho espiritual da Casa com humildade e cuidado.

Este material é introdutório e não substitui a orientação dos dirigentes, médiuns mais experientes ou a tradição viva da casa.

## Princípios
- Intenção alinhada ao bem e à caridade
- Conhecer a planta antes de usar (nome, preparo, contraindicações)
- Preferir orientação presencial nas giras e oficinas da Casa da Paz

## Na prática
Arruda, alecrim, guiné e manjericão aparecem com frequência em limpezas e proteção — sempre com moderação e contexto litúrgico.

Traga dúvidas para a gira ou para as oficinas de ervas. O estudo se aprofunda no diálogo com os mais velhos.`,
      imagemUrl: '/ervas.jpg',
      ordem: 10,
      publicado: true,
    },
    {
      slug: 'banhos-de-descarrego-cuidados',
      categoria: 'BANHOS' as const,
      titulo: 'Banhos de descarrego — cuidados básicos',
      resumo:
        'Orientação geral sobre banhos de descarrego: preparo, horário, intenção e o que evitar.',
      corpo: `Banhos de descarrego fazem parte do cuidado espiritual e do corpo. Use com respeito e, sempre que possível, sob orientação da casa.

## Antes do banho
- Defina a intenção com clareza (limpeza, tranquilidade, proteção)
- Prepare as ervas com água limpa; não improvise com substâncias agressivas
- Prefira o final do dia, quando indicado pelos mais velhos

## Durante e depois
- Banhe-se com calma, da cabeça aos pés ou conforme orientação recebida
- Evite excessos (água muito quente, misturas desconhecidas)
- Após o banho, vista roupa limpa e mantenha o pensamento sereno

Em caso de dúvida sobre saúde (pele, gestação, alergias), consulte um profissional de saúde além da orientação espiritual.`,
      imagemUrl: '/nature.jpg',
      ordem: 20,
      publicado: true,
    },
    {
      slug: 'defumacao-casa-e-terreiro',
      categoria: 'DEFUMACAO' as const,
      titulo: 'Defumação — casa e terreiro',
      resumo:
        'Como a defumação limpa ambientes e prepara o espaço antes das giras, com segurança e respeito.',
      corpo: `A defumação é um ato de limpeza e abertura. Na Casa da Paz, ela prepara o ambiente para o trabalho espiritual.

## Elementos comuns
- Ervas secas adequadas (conforme tradição da casa)
- Carvão ou brasa em recipiente seguro
- Ventilação: nunca deixe fumaça acumulada sem circulação de ar

## Boas práticas
- Peça bênção e mantenha foco na caridade
- Afaste crianças e animais do contato direto com a brasa
- Apague completamente o material ao terminar

A defumação não substitui higiene, organização nem o cuidado mútuo entre os irmãos da corrente.`,
      imagemUrl: '/velas.jpg',
      ordem: 30,
      publicado: true,
    },
  ];

  for (const m of materiais) {
    await prisma.materialEstudo.upsert({
      where: { slug: m.slug },
      update: {
        categoria: m.categoria,
        titulo: m.titulo,
        resumo: m.resumo,
        corpo: m.corpo,
        imagemUrl: m.imagemUrl,
        ordem: m.ordem,
        publicado: m.publicado,
      },
      create: m,
    });
  }

  const hoje = new Date();
  const emDuasSemanas = new Date(hoje);
  emDuasSemanas.setDate(emDuasSemanas.getDate() + 14);
  const emUmMes = new Date(hoje);
  emUmMes.setMonth(emUmMes.getMonth() + 1);

  const eventos = [
    {
      nomeEvento: 'Gira de Caboclos',
      dataEvento: hoje,
      tipo: 'GIRA' as const,
      status: 'ABERTO' as const,
      capacidadeMax: 50,
    },
    {
      nomeEvento: 'Gira de Pretos-Velhos',
      dataEvento: emDuasSemanas,
      tipo: 'GIRA' as const,
      status: 'ABERTO' as const,
      capacidadeMax: 50,
    },
    {
      nomeEvento: 'Oficina de Ervas Sagradas',
      dataEvento: emUmMes,
      tipo: 'OFICINA' as const,
      status: 'ABERTO' as const,
      capacidadeMax: 15,
    },
    {
      nomeEvento: 'Oficina de Banhos de Descarrego',
      dataEvento: emUmMes,
      tipo: 'OFICINA' as const,
      status: 'ABERTO' as const,
      capacidadeMax: 12,
    },
  ];

  for (const e of eventos) {
    const existing =
      (await prisma.evento.findFirst({ where: { nomeEvento: e.nomeEvento } })) ??
      (e.nomeEvento === 'Oficina de Ervas Sagradas'
        ? await prisma.evento.findFirst({ where: { nomeEvento: 'Oficina de Ervas' } })
        : null);
    if (existing) {
      await prisma.evento.update({
        where: { id: existing.id },
        data: {
          nomeEvento: e.nomeEvento,
          dataEvento: e.dataEvento,
          tipo: e.tipo,
          status: e.status,
          capacidadeMax: e.capacidadeMax,
        },
      });
    } else {
      await prisma.evento.create({ data: e });
    }
  }

  // Corrige oficinas antigas sem tipo OFICINA
  await prisma.evento.updateMany({
    where: { nomeEvento: { contains: 'Oficina' }, tipo: 'GIRA' },
    data: { tipo: 'OFICINA' },
  });

  console.log('Seed portal — 3 materiais de estudo + giras/oficinas de exemplo');
}

async function seedSupervisorOnly() {
  const pessoaSupervisor = await prisma.pessoa.upsert({
    where: { id: 10 },
    update: {},
    create: {
      id: 10,
      nomeCompleto: 'Supervisor Casa da Paz',
      telefone: '31999990001',
      tipoPerfil: 'DIRETORIA',
      maiorDeIdade: true,
    },
  });

  await prisma.usuario.upsert({
    where: { login: 'supervisor' },
    update: { senhaHash: await bcrypt.hash('supervisor123', 10), setorAcesso: 'SUPERVISOR' },
    create: {
      login: 'supervisor',
      senhaHash: await bcrypt.hash('supervisor123', 10),
      setorAcesso: 'SUPERVISOR',
      pessoaId: pessoaSupervisor.id,
    },
  });

  const pessoaIntegracao = await prisma.pessoa.upsert({
    where: { id: 11 },
    update: {},
    create: {
      id: 11,
      nomeCompleto: 'Admin Integrações',
      telefone: '31999990002',
      tipoPerfil: 'FUNCIONARIO',
      maiorDeIdade: true,
    },
  });

  await prisma.usuario.upsert({
    where: { login: 'admin.integracoes' },
    update: { senhaHash: await bcrypt.hash('integra123', 10), setorAcesso: 'ADMIN' },
    create: {
      login: 'admin.integracoes',
      senhaHash: await bcrypt.hash('integra123', 10),
      setorAcesso: 'ADMIN',
      pessoaId: pessoaIntegracao.id,
    },
  });

  console.log('Seed OK — supervisor / supervisor123 (SUPERVISOR)');
  console.log('Seed OK — admin.integracoes / integra123 (ADMIN)');
  console.log('Senha do login admin NÃO foi alterada.');
}

async function main() {
  const pessoaAdmin = await prisma.pessoa.upsert({
    where: { id: 1 },
    update: {},
    create: {
      nomeCompleto: 'Administrador Casa da Paz',
      telefone: '31999990000',
      tipoPerfil: 'DIRETORIA',
      maiorDeIdade: true,
    },
  });

  await prisma.usuario.upsert({
    where: { login: 'admin' },
    update: { setorAcesso: 'DIRETORIA' },
    create: {
      login: 'admin',
      senhaHash: await bcrypt.hash('admin123', 10),
      setorAcesso: 'DIRETORIA',
      pessoaId: pessoaAdmin.id,
    },
  });

  await seedSupervisorOnly();

  const consulente = await prisma.pessoa.upsert({
    where: { id: 2 },
    update: {},
    create: {
      nomeCompleto: 'Maria Silva Consulente',
      telefone: '31988887777',
      tipoPerfil: 'CONSULENTE',
      maiorDeIdade: true,
    },
  });

  const medium = await prisma.pessoa.upsert({
    where: { id: 3 },
    update: {},
    create: {
      nomeCompleto: 'João Medium Teste',
      telefone: '31977776666',
      tipoPerfil: 'MEDIUM',
      maiorDeIdade: true,
    },
  });

  await prisma.usuario.upsert({
    where: { login: 'medium' },
    update: {},
    create: {
      login: 'medium',
      senhaHash: await bcrypt.hash('medium123', 10),
      setorAcesso: 'MEDIUM',
      pessoaId: medium.id,
    },
  });

  const pessoaMarketing = await prisma.pessoa.upsert({
    where: { id: 12 },
    update: {},
    create: {
      id: 12,
      nomeCompleto: 'Comunicacao Marketing',
      telefone: '31999990003',
      tipoPerfil: 'FUNCIONARIO',
      maiorDeIdade: true,
    },
  });

  await prisma.usuario.upsert({
    where: { login: 'marketing' },
    update: { setorAcesso: 'MARKETING' },
    create: {
      login: 'marketing',
      senhaHash: await bcrypt.hash('marketing123', 10),
      setorAcesso: 'MARKETING',
      pessoaId: pessoaMarketing.id,
    },
  });

  await prisma.contaFinanceira.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, nome: 'Caixa físico', tipo: 'CAIXA', saldoInicial: 0, ativa: true },
  });
  await prisma.contaFinanceira.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, nome: 'Conta Asaas', tipo: 'ASAAS', saldoInicial: 0, ativa: true },
  });

  const hoje = new Date();
  const mesPassado = new Date(hoje);
  mesPassado.setMonth(mesPassado.getMonth() - 1);
  const mesFuturo = new Date(hoje);
  mesFuturo.setMonth(mesFuturo.getMonth() + 1);

  await prisma.financeiroTransacao.deleteMany({});
  await prisma.financeiroTransacao.createMany({
    data: [
      {
        pessoaId: consulente.id,
        tipo: 'RECEITA',
        categoria: 'MENSALIDADE',
        valor: 150,
        dataTransacao: hoje,
        vencimento: mesPassado,
        status: 'PENDENTE',
      },
      {
        pessoaId: consulente.id,
        tipo: 'RECEITA',
        categoria: 'MENSALIDADE',
        valor: 150,
        dataTransacao: hoje,
        vencimento: mesFuturo,
        status: 'PENDENTE',
      },
      {
        pessoaId: consulente.id,
        tipo: 'RECEITA',
        categoria: 'DOACAO',
        valor: 50,
        dataTransacao: hoje,
        status: 'CONCLUIDO',
      },
      {
        tipo: 'DESPESA',
        categoria: 'INSUMOS_TERREIRO',
        valor: 200,
        dataTransacao: hoje,
        status: 'CONCLUIDO',
      },
    ],
  });

  await prisma.inscricao.deleteMany({});
  await prisma.presenca.deleteMany({});
  await prisma.evento.deleteMany({});
  await prisma.evento.createMany({
    data: [
      {
        nomeEvento: 'Gira de Caboclos',
        dataEvento: hoje,
        tipo: 'GIRA',
        status: 'ABERTO',
        capacidadeMax: 50,
      },
      {
        nomeEvento: 'Oficina de Ervas Sagradas',
        dataEvento: mesFuturo,
        tipo: 'OFICINA',
        status: 'ABERTO',
        capacidadeMax: 15,
      },
      {
        nomeEvento: 'Oficina de Banhos de Descarrego',
        dataEvento: mesFuturo,
        tipo: 'OFICINA',
        status: 'ABERTO',
        capacidadeMax: 12,
      },
    ],
  });

  await seedPortalContent();

  await prisma.estoqueMovimentacao.deleteMany({});
  await prisma.livrariaConteudo.deleteMany({});
  await prisma.produto.deleteMany({});
  const produtos = await prisma.$transaction([
    prisma.produto.create({
      data: {
        nome: 'Livro Orixás e Arquétipos',
        tipo: 'LIVRO',
        preco: 45,
        estoqueAtual: 10,
        descricaoEcommerce: 'Estudo respeitoso dos arquétipos dos Orixás na tradição afro-indígena.',
      },
    }),
    prisma.produto.create({
      data: { nome: 'Erva Arruda', tipo: 'ERVA', preco: 8.5, estoqueAtual: 25 },
    }),
    prisma.produto.create({
      data: {
        nome: 'Guia de Pontos Cantados',
        tipo: 'LIVRO',
        preco: 35,
        estoqueAtual: 5,
        descricaoEcommerce: 'Pontos cantados com contexto litúrgico para estudo em casa.',
      },
    }),
  ]);

  await prisma.livrariaConteudo.createMany({
    data: [
      {
        tipo: 'NOVIDADE',
        titulo: 'Novidade: Orixás e Arquétipos',
        texto: 'Lançamento da Casa da Paz — leitura recomendada para quem está iniciando o estudo dos Orixás com profundidade e respeito.',
        produtoId: produtos[0].id,
        ordem: 0,
      },
      {
        tipo: 'DICA',
        titulo: 'Como escolher um livro espiritual',
        texto: 'Leia com calma, anote suas impressões e traga dúvidas para a gira ou consulta. A espiritualidade se aprofunda na prática e no diálogo com os mais velhos.',
        ordem: 0,
      },
    ],
  });

  await prisma.agendamentoPublico.deleteMany({});
  await prisma.agendamentoPublico.create({
    data: {
      protocolo: 'AGD-DEV-001',
      nome: 'Ana Paula Consulente',
      telefone: '31966665555',
      dataPreferida: mesFuturo,
      observacao: 'Primeira consulta — preferência sábado',
      status: 'PENDENTE',
    },
  });

  console.log('Seed OK — admin / admin123 (DIRETORIA)');
  console.log('Seed OK — supervisor / supervisor123 (SUPERVISOR)');
  console.log('Seed OK — admin.integracoes / integra123 (ADMIN)');
  console.log('Seed OK — marketing / marketing123 (MARKETING)');
  console.log('Seed OK — medium / medium123');
}

if (process.argv.includes('--supervisor-only')) {
  seedSupervisorOnly()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
} else if (process.argv.includes('--portal-content')) {
  seedPortalContent()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
} else {
  main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
