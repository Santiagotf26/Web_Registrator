import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, parseISO } from 'date-fns';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        date: {
          gte: startOfDay(parseISO(startDate)),
          lte: endOfDay(parseISO(endDate)),
        },
      };
    }

    const transactions = await prisma.transaction.findMany({
      where: dateFilter,
      include: {
        product: true,
        seller: true,
      },
      orderBy: { date: 'asc' },
    });
    
    return NextResponse.json(transactions);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching transactions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { type } = data; // "INICIO", "VENTA", "GASTO", "CIERRE"
    
    let transactionData: any = { type };

    if (type === 'INICIO' || type === 'CIERRE') {
      transactionData.amount = Number(data.amount);
    } else if (type === 'GASTO') {
      transactionData.amount = Number(data.amount);
      transactionData.reason = data.reason;
    } else if (type === 'VENTA') {
      const salePrice = Number(data.salePrice);
      const purchasePrice = Number(data.purchasePrice);
      const profit = salePrice - purchasePrice;
      const commission = profit * 0.4;
      const storeProfit = profit * 0.6;

      transactionData = {
        ...transactionData,
        productId: data.productId,
        sellerId: data.sellerId,
        purchasePrice,
        salePrice,
        profit,
        commission,
        storeProfit,
        paymentMethod: data.paymentMethod || 'EFECTIVO',
      };
    }

    const transaction = await prisma.transaction.create({
      data: transactionData,
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error creating transaction' }, { status: 500 });
  }
}
