import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const pessoa = await prisma.pessoa.upsert({
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
    where: { email: 'admin@casadapaz.local' },
    update: {},
    create: {
      email: 'admin@casadapaz.local',
      senhaHash: await bcrypt.hash('admin123', 10),
      setorAcesso: 'DIRETORIA',
      pessoaId: pessoa.id,
    },
  });

  console.log('Seed OK — admin@casadapaz.local / admin123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
