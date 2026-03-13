import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

/**
 * Seed do banco de dados.
 *
 * Cria dados iniciais para desenvolvimento e testes:
 * - 1 propriedade (pousada)
 * - 1 usuário admin
 * - 1 tipo de quarto
 * - 2 quartos
 *
 * Execute com: pnpm run db:seed (ou npx prisma db seed)
 */
const prisma = new PrismaClient();

async function main() {
  // 1. Criar usuário
  const passwordHash = await bcrypt.hash('admin123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'admin@pousada.com' },
    update: {},
    create: {
      email: 'admin@pousada.com',
      passwordHash,
      name: 'Administrador',
      isActive: true,
    },
  });

  // 2. Criar propriedade
  const property = await prisma.property.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Pousada Exemplo',
      legalName: 'Pousada Exemplo Ltda',
      document: '12.345.678/0001-90',
      email: 'contato@pousadaexemplo.com.br',
      phone: '(11) 99999-9999',
      addressStreet: 'Rua das Flores',
      addressNumber: '100',
      addressCity: 'São Paulo',
      addressState: 'SP',
      addressZip: '01234-567',
      country: 'BR',
      checkinTime: '14:00',
      checkoutTime: '12:00',
      currency: 'BRL',
    },
  });

  // 3. Vincular usuário à propriedade como admin
  await prisma.propertyUser.upsert({
    where: {
      propertyId_userId: {
        propertyId: property.id,
        userId: user.id,
      },
    },
    update: {},
    create: {
      propertyId: property.id,
      userId: user.id,
      role: 'admin',
      isActive: true,
    },
  });

  // 4. Criar tipo de quarto
  const roomType = await prisma.roomType.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      propertyId: property.id,
      name: 'Quarto Standard',
      description: 'Quarto com cama de casal, ar condicionado e Wi-Fi',
      maxGuests: 2,
      basePrice: 250,
      sortOrder: 0,
    },
  });

  // 5. Criar quartos
  await prisma.room.upsert({
    where: { propertyId_number: { propertyId: property.id, number: '101' } },
    update: {},
    create: {
      propertyId: property.id,
      roomTypeId: roomType.id,
      number: '101',
      floor: 1,
      status: 'available',
    },
  });

  await prisma.room.upsert({
    where: { propertyId_number: { propertyId: property.id, number: '102' } },
    update: {},
    create: {
      propertyId: property.id,
      roomTypeId: roomType.id,
      number: '102',
      floor: 1,
      status: 'available',
    },
  });

  // 6. Criar hóspede de exemplo (para testar reservas)
  await prisma.guest.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      propertyId: property.id,
      name: 'João Silva',
      email: 'joao@email.com',
      phone: '(11) 98888-7777',
      documentType: 'CPF',
      documentNumber: '123.456.789-00',
    },
  });

  console.log('✅ Seed concluído com sucesso!');
  console.log('   Login: admin@pousada.com');
  console.log('   Senha: admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
