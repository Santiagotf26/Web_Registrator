import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching products', details: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, purchasePrice } = await request.json();
    
    // Check if exists
    const existing = await prisma.product.findUnique({ where: { name } });
    if (existing) {
      const updated = await prisma.product.update({
        where: { id: existing.id },
        data: { purchasePrice, isActive: true },
      });
      return NextResponse.json(updated);
    }

    const product = await prisma.product.create({
      data: { name, purchasePrice },
    });
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: 'Error creating product' }, { status: 500 });
  }
}
