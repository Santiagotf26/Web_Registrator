"use client";

import { useState, useEffect, useCallback } from 'react';
import { DollarSign, Lock, Play, ShoppingCart, TrendingDown, TrendingUp, Users, Wallet, CreditCard, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [inicioAmount, setInicioAmount] = useState('');
  const [saleProduct, setSaleProduct] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [saleSeller, setSaleSeller] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');
  const [gastoAmount, setGastoAmount] = useState('');
  const [gastoReason, setGastoReason] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, prodRes, sellRes] = await Promise.all([
        fetch('/api/summary'),
        fetch('/api/products'),
        fetch('/api/sellers')
      ]);
      const sumData = await sumRes.json();
      const prodData = await prodRes.json();
      const sellData = await sellRes.json();
      setSummary(sumData);
      setProducts(Array.isArray(prodData) ? prodData : []);
      setSellers(Array.isArray(sellData) ? sellData : []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Live clock + auto-close at 23:59
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      if (now.getHours() === 23 && now.getMinutes() === 59 && now.getSeconds() === 0) {
        if (summary?.hasInicio && !summary?.hasCierre) {
          autoCloseCaja();
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [summary]);

  const autoCloseCaja = async () => {
    const realCaja = (summary?.caja_actual || 0) - (summary?.vendedores_total || 0);
    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'CIERRE', amount: realCaja })
    });
    fetchData();
  };

  const formatCOP = (val: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  const handleInicio = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'INICIO', amount: inicioAmount })
    });
    setInicioAmount('');
    fetchData();
  };

  const handleCierre = async () => {
    if (!confirm("¿Estás seguro de cerrar la caja?")) return;
    const realCaja = (summary?.caja_actual || 0) - (summary?.vendedores_total || 0);
    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'CIERRE', amount: realCaja })
    });
    alert(`Cierre exitoso. Caja final: ${formatCOP(realCaja)}`);
    fetchData();
  };

  const handleSale = async (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find(p => p.id === saleProduct);
    if (!prod) return;
    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'VENTA',
        productId: prod.id,
        sellerId: saleSeller,
        purchasePrice: prod.purchasePrice,
        salePrice: salePrice,
        paymentMethod,
      })
    });
    setSaleProduct(''); setSalePrice(''); setSaleSeller(''); setPaymentMethod('EFECTIVO');
    fetchData();
  };

  const handleGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'GASTO', amount: gastoAmount, reason: gastoReason })
    });
    setGastoAmount(''); setGastoReason('');
    fetchData();
  };

  if (loading) return (
    <div className="flex justify-center items-center" style={{ minHeight: '60vh' }}>
      <div className="loading-spinner"></div>
      <span style={{ marginLeft: '1rem', color: 'var(--neon-cyan)', fontWeight: 600 }}>Iniciando Sistema...</span>
      <style jsx>{`
        .loading-spinner {
          width: 40px; height: 40px;
          border: 3px solid rgba(0, 243, 255, 0.1);
          border-top-color: var(--neon-cyan);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );

  const cajaAbierta = summary?.hasInicio && !summary?.hasCierre;
  const cajaCerrada = summary?.hasCierre;

  return (
    <div className="fade-in">
      {/* STATUS HEADER */}
      <div className="glass-card status-header stagger-fade" style={{ marginBottom: '2rem', padding: '1.25rem 2rem' }}>
        <div className="flex items-center gap-4">
          <div className={`status-indicator ${cajaAbierta ? 'open' : 'closed'}`}>
            {cajaAbierta ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', margin: 0 }}>
              {cajaAbierta ? 'Sistema Operativo' : 'Caja Cerrada'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
              {cajaAbierta ? 'Registrando transacciones en tiempo real' : 'Inicia una nueva jornada para comenzar'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="time-display">
            <Clock size={16} />
            <span>{currentTime.toLocaleTimeString('es-CO')}</span>
          </div>
          {cajaAbierta && (
            <button onClick={handleCierre} className="btn-close-caja">
              <Lock size={16} /> Cerrar Caja
            </button>
          )}
        </div>
      </div>

      <div className="dashboard-grid">
        {/* LEFT COLUMN: FORMS */}
        <div className="forms-column stagger-fade">
          
          {/* ABRIR CAJA */}
          {!cajaAbierta && (
            <div className="glass-card form-section highlight-warning">
              <div className="section-header">
                <Play size={24} className="text-neon" />
                <h3>{cajaCerrada ? 'Reabrir Jornada' : 'Iniciar Jornada'}</h3>
              </div>
              <form onSubmit={handleInicio} className="flex gap-4 items-end">
                <div style={{ flex: 1 }}>
                  <label className="label">Base de Caja Inicial</label>
                  <div className="input-with-symbol">
                    <span>$</span>
                    <input type="number" required className="input-field" value={inicioAmount} onChange={e => setInicioAmount(e.target.value)} placeholder="0" />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ height: '3.3rem' }}>Abrir Caja</button>
              </form>
            </div>
          )}

          {/* REGISTRAR VENTA */}
          <div className={`glass-card form-section highlight-cyan ${!cajaAbierta ? 'disabled' : ''}`}>
            <div className="section-header">
              <ShoppingCart size={24} color="var(--neon-cyan)" />
              <h3>Nueva Venta</h3>
            </div>
            <form onSubmit={handleSale} className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">Producto</label>
                <select required className="input-field" value={saleProduct} onChange={e => setSaleProduct(e.target.value)}>
                  <option value="">Seleccione producto...</option>
                  {products.filter(p => p.isActive !== false).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Vendedor</label>
                <select required className="input-field" value={saleSeller} onChange={e => setSaleSeller(e.target.value)}>
                  <option value="">Seleccione vendedor...</option>
                  {sellers.filter(s => s.isActive !== false).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Precio Final</label>
                <div className="input-with-symbol">
                  <span>$</span>
                  <input type="number" required className="input-field" value={salePrice} onChange={e => setSalePrice(e.target.value)} placeholder="0" />
                </div>
              </div>
              <div className="form-group">
                <label className="label">Medio de Pago</label>
                <select className="input-field" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                  <option value="EFECTIVO">💵 Efectivo</option>
                  <option value="TRANSFERENCIA">🏦 Transferencia</option>
                  <option value="NEQUI">📱 Nequi</option>
                  <option value="DAVIPLATA">📲 Daviplata</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ gridColumn: 'span 2', marginTop: '0.5rem' }}>
                Confirmar Venta
              </button>
            </form>
          </div>

          {/* REGISTRAR GASTO */}
          <div className={`glass-card form-section highlight-pink ${!cajaAbierta ? 'disabled' : ''}`}>
            <div className="section-header">
              <TrendingDown size={24} color="var(--neon-pink)" />
              <h3>Registrar Egreso</h3>
            </div>
            <form onSubmit={handleGasto} className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">Monto del Gasto</label>
                <div className="input-with-symbol">
                  <span>$</span>
                  <input type="number" required className="input-field" value={gastoAmount} onChange={e => setGastoAmount(e.target.value)} placeholder="0" />
                </div>
              </div>
              <div className="form-group">
                <label className="label">Concepto / Motivo</label>
                <input type="text" required className="input-field" value={gastoReason} onChange={e => setGastoReason(e.target.value)} placeholder="Ej: Pago servicios" />
              </div>
              <button type="submit" className="btn btn-danger" style={{ gridColumn: 'span 2' }}>
                Registrar Egreso
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: SUMMARY */}
        <div className="summary-column stagger-fade">
          
          {/* MAIN BALANCE */}
          <div className="glass-card main-balance">
            <span className="balance-label">Efectivo en Caja</span>
            <h2 className="balance-amount">{formatCOP(summary?.caja_actual || 0)}</h2>
            <div className="balance-footer">
              <span>Base: {formatCOP(summary?.caja_ini || 0)}</span>
              <div className="divider"></div>
              <span>Total Ventas: {formatCOP(summary?.ventas || 0)}</span>
            </div>
          </div>

          {/* STATS GRID */}
          <div className="stats-grid">
            <div className="stat-item highlight-pink">
              <span className="stat-label">Gastos</span>
              <span className="stat-value">{formatCOP(summary?.gastos || 0)}</span>
            </div>
            <div className="stat-item highlight-warning">
              <span className="stat-label">Comisiones</span>
              <span className="stat-value">{formatCOP(summary?.vendedores_total || 0)}</span>
            </div>
            <div className="stat-item highlight-cyan" style={{ gridColumn: 'span 2' }}>
              <span className="stat-label">Utilidad Almacén (60%)</span>
              <span className="stat-value">{formatCOP(summary?.ganancia_almacen || 0)}</span>
            </div>
          </div>

          {/* SELLERS BREAKDOWN */}
          <div className="glass-card sellers-breakdown">
            <div className="section-header-sm">
              <Users size={18} />
              <h4>Comisiones por Vendedor</h4>
            </div>
            <div className="sellers-list">
              {summary?.resumen_vendedores && Object.entries(summary.resumen_vendedores).length > 0 ? (
                Object.entries(summary.resumen_vendedores).map(([name, amount]) => (
                  <div key={name} className="seller-row">
                    <span className="seller-name">{name}</span>
                    <span className="seller-amount">{formatCOP(amount as number)}</span>
                  </div>
                ))
              ) : (
                <div className="empty-state">No hay ventas registradas hoy</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .status-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-left: 4px solid var(--neon-cyan);
        }
        .status-indicator {
          width: 42px; height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .status-indicator.open { background: hsla(var(--cyan-primary), 0.1); color: var(--neon-cyan); }
        .status-indicator.closed { background: hsla(var(--pink-primary), 0.1); color: var(--neon-pink); }
        
        .time-display {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: 'Outfit';
          font-weight: 600;
          color: var(--text-secondary);
          background: rgba(255, 255, 255, 0.05);
          padding: 0.5rem 1rem;
          border-radius: 8px;
        }

        .btn-close-caja {
          background: hsla(var(--pink-primary), 0.1);
          color: var(--neon-pink);
          border: 1px solid hsla(var(--pink-primary), 0.2);
          padding: 0.6rem 1.2rem;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
        }
        .btn-close-caja:hover { background: var(--neon-pink); color: white; }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 2rem;
        }

        .form-section {
          padding: 2rem;
          margin-bottom: 1.5rem;
        }
        .section-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .section-header h3 { font-size: 1.25rem; margin: 0; }
        
        .highlight-cyan { border-top: 3px solid var(--neon-cyan); }
        .highlight-pink { border-top: 3px solid var(--neon-pink); }
        .highlight-warning { border-top: 3px solid var(--warning); }
        
        .disabled { opacity: 0.4; pointer-events: none; filter: grayscale(0.5); }
        
        .input-with-symbol {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-with-symbol span {
          position: absolute;
          left: 1rem;
          color: var(--text-muted);
          font-weight: 700;
        }
        .input-with-symbol input { padding-left: 2rem; }

        .main-balance {
          padding: 2.5rem 2rem;
          text-align: center;
          background: linear-gradient(145deg, rgba(0, 243, 255, 0.05) 0%, rgba(6, 9, 18, 0.95) 100%);
          border-bottom: 3px solid var(--neon-cyan);
          margin-bottom: 1.5rem;
        }
        .balance-label { color: var(--text-muted); text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.2em; font-weight: 700; }
        .balance-amount { font-size: 2.8rem; font-weight: 800; color: var(--neon-cyan); margin: 0.5rem 0; text-shadow: 0 0 20px hsla(var(--cyan-primary), 0.3); }
        .balance-footer { display: flex; justify-content: center; align-items: center; gap: 1rem; color: var(--text-secondary); font-size: 0.85rem; margin-top: 1rem; font-weight: 500; }
        .divider { width: 1px; height: 12px; background: var(--surface-border); }

        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
        .stat-item {
          background: var(--surface);
          padding: 1.25rem;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          border: 1px solid var(--surface-border);
        }
        .stat-label { color: var(--text-muted); font-size: 0.7rem; font-weight: 700; text-transform: uppercase; margin-bottom: 0.25rem; }
        .stat-value { font-size: 1.2rem; font-weight: 700; }
        .stat-item.highlight-pink .stat-value { color: var(--neon-pink); }
        .stat-item.highlight-warning .stat-value { color: var(--warning); }
        .stat-item.highlight-cyan .stat-value { color: var(--neon-cyan); }

        .sellers-breakdown { padding: 1.5rem; }
        .section-header-sm { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; color: var(--warning); }
        .section-header-sm h4 { margin: 0; font-size: 0.9rem; text-transform: uppercase; }
        .sellers-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .seller-row {
          display: flex;
          justify-content: space-between;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--surface-border);
        }
        .seller-name { color: var(--text-secondary); font-size: 0.9rem; }
        .seller-amount { font-weight: 700; color: var(--warning); }
        .empty-state { color: var(--text-muted); font-size: 0.85rem; font-style: italic; text-align: center; padding: 1rem 0; }

        @media (max-width: 1100px) {
          .dashboard-grid { grid-template-columns: 1fr; }
          .summary-column { order: -1; }
        }
      `}</style>
    </div>
  );
}
