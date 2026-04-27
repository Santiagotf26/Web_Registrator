import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const targetDate = dateParam ? new Date(dateParam) : new Date();

    const start = startOfDay(targetDate);
    const end = endOfDay(targetDate);

    const transactions = await prisma.transaction.findMany({
      where: {
        date: { gte: start, lte: end },
      },
      include: { seller: true, product: true },
      orderBy: { date: 'asc' },
    });

    let ventas = 0;
    let gastos = 0;
    let vendedores_total = 0;
    let ganancia_almacen = 0;
    let ganancia_total = 0;
    const resumen_vendedores: Record<string, number> = {};

    // Find the LAST INICIO and LAST CIERRE to support multiple open/close cycles per day
    let lastInicioIndex = -1;
    let lastCierreIndex = -1;

    transactions.forEach((t: any, i: number) => {
      if (t.type === 'INICIO') lastInicioIndex = i;
      if (t.type === 'CIERRE') lastCierreIndex = i;
    });

    // The cash register is open if there's an INICIO after the last CIERRE (or no CIERRE at all)
    const hasOpenCaja = lastInicioIndex > lastCierreIndex;
    const hasCierre = lastCierreIndex >= 0 && lastCierreIndex > lastInicioIndex;

    // Get the caja_ini from the LAST INICIO
    let caja_ini = 0;
    if (lastInicioIndex >= 0) {
      caja_ini = transactions[lastInicioIndex].amount || 0;
    }

    // Only count transactions AFTER the last INICIO for the current session
    const sessionStart = lastInicioIndex >= 0 ? lastInicioIndex : 0;
    const sessionEnd = hasCierre ? lastCierreIndex : transactions.length;

    for (let i = sessionStart; i < sessionEnd; i++) {
      const t = transactions[i] as any;
      if (t.type === 'VENTA') {
        ventas += t.salePrice || 0;
        ganancia_total += t.profit || 0;
        ganancia_almacen += t.storeProfit || 0;
        const comision = t.commission || 0;
        vendedores_total += comision;
        if (t.seller) {
          resumen_vendedores[t.seller.name] = (resumen_vendedores[t.seller.name] || 0) + comision;
        }
      } else if (t.type === 'GASTO') {
        gastos += t.amount || 0;
      }
    }

    const caja_actual = caja_ini + ventas - gastos;

    // Get today's sales for the admin detail view
    const ventasDetalle = transactions
      .filter((t: any) => t.type === 'VENTA')
      .map((t: any) => ({
        id: t.id,
        date: t.date,
        product: t.product?.name || '',
        purchasePrice: t.purchasePrice,
        salePrice: t.salePrice,
        seller: t.seller?.name || '',
        profit: t.profit,
        commission: t.commission,
        storeProfit: t.storeProfit,
        paymentMethod: t.paymentMethod || 'EFECTIVO',
      }));

    const gastosDetalle = transactions
      .filter((t: any) => t.type === 'GASTO')
      .map((t: any) => ({
        id: t.id,
        date: t.date,
        amount: t.amount,
        reason: t.reason,
      }));

    return NextResponse.json({
      ventas,
      gastos,
      vendedores_total,
      ganancia_almacen,
      ganancia_total,
      caja_ini,
      caja_actual,
      resumen_vendedores,
      // hasInicio is false when there's no open caja (either never opened or was closed)
      hasInicio: hasOpenCaja,
      hasCierre: hasCierre,
      ventasDetalle,
      gastosDetalle,
      totalTransactions: transactions.length,
    });

  } catch (error) {
    console.error('Summary error:', error);
    return NextResponse.json({ error: 'Error calculating summary' }, { status: 500 });
  }
}
