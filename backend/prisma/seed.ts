import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    update: { senhaHash: await bcrypt.hash('admin123', 10) },
    create: {
      login: 'admin',
      senhaHash: await bcrypt.hash('admin123', 10),
      setorAcesso: 'DIRETORIA',
      pessoaId: pessoaAdmin.id,
    },
  });

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
        status: 'ABERTO',
        capacidadeMax: 50,
      },
      {
        nomeEvento: 'Oficina de Ervas',
        dataEvento: mesFuturo,
        status: 'ABERTO',
        capacidadeMax: 15,
      },
    ],
  });

  await prisma.estoqueMovimentacao.deleteMany({});
  await prisma.produto.deleteMany({});
  await prisma.produto.createMany({
    data: [
      { nome: 'Livro Orixás e Arquétipos', tipo: 'LIVRO', preco: 45, estoqueAtual: 10 },
      { nome: 'Erva Arruda', tipo: 'ERVA', preco: 8.5, estoqueAtual: 25 },
      { nome: 'Guia de Pontos Cantados', tipo: 'LIVRO', preco: 35, estoqueAtual: 5 },
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

  console.log('Seed OK — admin / admin123');
  console.log('Seed OK — medium / medium123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
