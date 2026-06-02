import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`insert into storage.buckets (id, name, public) values ('arsip', 'arsip', true) on conflict do nothing;`);
    await prisma.$executeRawUnsafe(`create policy "Public Access" on storage.objects for all using ( bucket_id = 'arsip' );`);
    console.log('Success creating bucket and policies');
  } catch(e) {
    console.log('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
