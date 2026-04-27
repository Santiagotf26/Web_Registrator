import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getSession();
  if (session?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name } = body;
    
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;

    const updatedSeller = await prisma.seller.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(updatedSeller);
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar vendedor' }, { status: 500 });
  }
}
