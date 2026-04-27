import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const sellers = await prisma.seller.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(sellers);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching sellers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    
    // Check if exists
    const existing = await prisma.seller.findUnique({ where: { name } });
    if (existing) {
      const updated = await prisma.seller.update({
        where: { id: existing.id },
        data: { isActive: true },
      });
      return NextResponse.json(updated);
    }

    const seller = await prisma.seller.create({
      data: { name },
    });
    return NextResponse.json(seller);
  } catch (error) {
    return NextResponse.json({ error: 'Error creating seller' }, { status: 500 });
  }
}
