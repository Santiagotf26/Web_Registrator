"use client";
import { useState, useEffect } from 'react';
import { Download, FileSpreadsheet, Package, UserPlus, Users, Trash2, Pencil, Save, X, RotateCcw, BarChart3, FileText, CheckCircle2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('panel');
  const [products, setProducts] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Forms
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [sellName, setSellName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('WORKER');
  
  // States
  const [editingUser, setEditingUser] = useState<string|null>(null);
  const [editUserData, setEditUserData] = useState<any>({});
  const [editingProduct, setEditingProduct] = useState<string|null>(null);
  const [editProductData, setEditProductData] = useState<any>({});
  const [editingSeller, setEditingSeller] = useState<string|null>(null);
  const [editSellerData, setEditSellerData] = useState<any>({});
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const [p,s,u,sum] = await Promise.all([
      fetch('/api/products').then(r=>r.json()),
      fetch('/api/sellers').then(r=>r.json()),
      fetch('/api/users').then(r=>r.json()),
      fetch('/api/summary').then(r=>r.json()),
    ]);
    setProducts(Array.isArray(p)?p:[]);
    setSellers(Array.isArray(s)?s:[]);
    if(!u.error) setUsers(u);
    setSummary(sum);
    setLoading(false);
  };
  
  useEffect(()=>{fetchData();},[]);

  const fmt = (v:number)=>new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(v);

  // CRUD Actions
  const addProduct = async (e:React.FormEvent)=>{e.preventDefault();await fetch('/api/products',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:prodName,purchasePrice:Number(prodPrice)})});setProdName('');setProdPrice('');fetchData();};
  const addSeller = async (e:React.FormEvent)=>{e.preventDefault();await fetch('/api/sellers',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:sellName})});setSellName('');fetchData();};
  const addUser = async (e:React.FormEvent)=>{e.preventDefault();await fetch('/api/users',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password,role})});setUsername('');setPassword('');setRole('WORKER');fetchData();};

  const saveUser = async (id:string)=>{const p:any={username:editUserData.username,role:editUserData.role};if(editUserData.password)p.password=editUserData.password;await fetch(`/api/users/${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)});setEditingUser(null);fetchData();};
  const saveProd = async (id:string)=>{await fetch(`/api/products/${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(editProductData)});setEditingProduct(null);fetchData();};
  const saveSell = async (id:string)=>{await fetch(`/api/sellers/${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(editSellerData)});setEditingSeller(null);fetchData();};
  const delUser = async (id:string)=>{if(!confirm('¿Desactivar usuario?'))return;await fetch(`/api/users/${id}`,{method:'DELETE'});fetchData();};
  const reactUser = async (id:string)=>{await fetch(`/api/users/${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({isActive:true})});fetchData();};

  // EXPORTS
  const getTx = async ()=>{const u=new URL('/api/transactions',window.location.origin);if(startDate)u.searchParams.append('startDate',startDate);if(endDate)u.searchParams.append('endDate',endDate);return fetch(u.toString()).then(r=>r.json());};
  const expXLS = async ()=>{const d=await getTx();if(!d.length)return alert('Sin datos.');const rows=d.filter((t:any)=>t.type==='VENTA').map((t:any)=>({Fecha:new Date(t.date).toLocaleString(),Producto:t.product?.name||'','P.Compra':t.purchasePrice||'','P.Venta':t.salePrice||'',Vendedor:t.seller?.name||'','Ganancia Total':t.profit||'','Comisión (40%)':t.commission||'','Almacén (60%)':t.storeProfit||'','Medio Pago':t.paymentMethod||'EFECTIVO'}));const gastos=d.filter((t:any)=>t.type==='GASTO').map((t:any)=>({Fecha:new Date(t.date).toLocaleString(),Monto:t.amount||'',Motivo:t.reason||''}));const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows),'Ventas');XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(gastos),'Gastos');XLSX.writeFile(wb,`Reporte_${new Date().toISOString().slice(0,10)}.xlsx`);};
  const expPDF = async ()=>{const d=await getTx();if(!d.length)return alert('Sin datos.');const doc=new jsPDF('landscape');doc.text('Reporte de Ventas',14,15);const cols=['Fecha','Producto','P.Compra','P.Venta','Vendedor','Ganancia','Comisión 40%','Almacén 60%','Medio Pago'];const rows=d.filter((t:any)=>t.type==='VENTA').map((t:any)=>[new Date(t.date).toLocaleString(),t.product?.name||'',fmt(t.purchasePrice||0),fmt(t.salePrice||0),t.seller?.name||'',fmt(t.profit||0),fmt(t.commission||0),fmt(t.storeProfit||0),t.paymentMethod||'EFECTIVO']);autoTable(doc,{head:[cols],body:rows,startY:20,theme:'grid',styles:{fontSize:7}});doc.save(`Reporte_${new Date().toISOString().slice(0,10)}.pdf`);};

  if(loading) return <div className="loading-container"><div className="spinner"></div><style jsx>{`.loading-container{display:flex;justify-content:center;padding:10rem;}.spinner{width:40px;height:40px;border:3px solid rgba(0,243,255,0.1);border-top-color:var(--neon-cyan);border-radius:50%;animation:spin 1s linear infinite;}@keyframes spin{to{transform:rotate(360deg);}}`}</style></div>;

  return (
    <div className="fade-in">
      {/* NAVIGATION TABS */}
      <div className="glass-card tabs-wrapper stagger-fade">
        <div className="tabs-container">
          {[
            {id:'panel',label:'Resumen',icon:<BarChart3 size={18}/>,color:'var(--neon-cyan)'},
            {id:'usuarios',label:'Usuarios',icon:<Users size={18}/>,color:'var(--neon-pink)'},
            {id:'productos',label:'Catálogo',icon:<Package size={18}/>,color:'var(--neon-violet)'},
            {id:'vendedores',label:'Staff',icon:<UserPlus size={18}/>,color:'var(--neon-green)'},
            {id:'reportes',label:'Exportar',icon:<FileSpreadsheet size={18}/>,color:'var(--warning)'},
          ].map(t=>(
            <button key={t.id} onClick={()=>setActiveTab(t.id)} className={`tab-btn ${activeTab===t.id?'active':''}`} style={{ '--active-color': t.color } as any}>
              {t.icon} <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card main-content-area stagger-fade">
        
        {/* TAB: PANEL / DASHBOARD */}
        {activeTab==='panel' && (
          <div className="tab-content fade-in">
            <header className="content-header">
              <h2 className="text-gradient">Panel Administrativo</h2>
              <p>Monitoreo global de la jornada actual</p>
            </header>

            <div className="admin-stats-grid">
              {[
                {l:'Ventas Brutas',v:summary?.ventas,c:'var(--neon-green)',i:<TrendingUp size={20}/>},
                {l:'Egresos/Gastos',v:summary?.gastos,c:'var(--neon-pink)',i:<TrendingDown size={20}/>},
                {l:'Utilidad Total',v:summary?.ganancia_total,c:'var(--neon-cyan)',i:<DollarSign size={20}/>},
                {l:'Comisiones',v:summary?.vendedores_total,c:'var(--warning)',i:<Users size={20}/>},
                {l:'Almacén (60%)',v:summary?.ganancia_almacen,c:'var(--neon-violet)',i:<Package size={20}/>}
              ].map(k=>(
                <div key={k.l} className="stat-card" style={{borderBottom:`3px solid ${k.c}`}}>
                  <div className="stat-header">
                    <span className="stat-icon" style={{background:`hsla(${k.c.includes('cyan')?'184,100%,50%':k.c.includes('pink')?'345,100%,60%':k.c.includes('green')?'142,70%,50%':k.c.includes('violet')?'258,90%,66%':'45,100%,50%'}, 0.1)`, color:k.c}}>{k.i}</span>
                    <span className="stat-label">{k.l}</span>
                  </div>
                  <div className="stat-value" style={{color:k.c}}>{fmt(k.v||0)}</div>
                </div>
              ))}
            </div>

            <div className="table-wrapper">
              <h3 className="section-title">Ventas Detalladas</h3>
              <table className="premium-table">
                <thead>
                  <tr><th>Hora</th><th>Producto</th><th>Costo</th><th>Precio</th><th>Staff</th><th>Profit</th><th>Comisión</th><th>Almacén</th><th>Pago</th></tr>
                </thead>
                <tbody>
                  {(summary?.ventasDetalle||[]).map((v:any)=>(
                    <tr key={v.id}>
                      <td className="time-td">{new Date(v.date).toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'})}</td>
                      <td className="bold-td">{v.product}</td>
                      <td className="muted-td">{fmt(v.purchasePrice)}</td>
                      <td className="success-td">{fmt(v.salePrice)}</td>
                      <td>{v.seller}</td>
                      <td className="cyan-td">{fmt(v.profit)}</td>
                      <td className="warning-td">{fmt(v.commission)}</td>
                      <td className="violet-td">{fmt(v.storeProfit)}</td>
                      <td><span className="badge">{v.paymentMethod}</span></td>
                    </tr>
                  ))}
                  {!(summary?.ventasDetalle?.length) && <tr><td colSpan={9} className="empty-td">Sin movimientos registrados hoy</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: USUARIOS */}
        {activeTab==='usuarios' && (
          <div className="tab-content fade-in">
            <header className="content-header">
              <h2 style={{color:'var(--neon-pink)'}}>Gestión de Accesos</h2>
              <p>Control de usuarios y permisos del sistema</p>
            </header>
            
            <form onSubmit={addUser} className="admin-form highlight-pink">
              <div className="form-grid">
                <div className="form-group"><label className="label">Username</label><input type="text" required className="input-field" value={username} onChange={e=>setUsername(e.target.value)} placeholder="Ej: maria_ventas"/></div>
                <div className="form-group"><label className="label">Contraseña</label><input type="password" required className="input-field" value={password} onChange={e=>setPassword(e.target.value)}/></div>
                <div className="form-group"><label className="label">Rol</label><select className="input-field" value={role} onChange={e=>setRole(e.target.value)}><option value="WORKER">Trabajador (Solo ventas)</option><option value="ADMIN">Administrador (Acceso total)</option></select></div>
              </div>
              <button type="submit" className="btn btn-primary" style={{background:'var(--neon-pink)', boxShadow:'0 4px 15px hsla(345, 100%, 60%, 0.3)'}}>Crear Usuario</button>
            </form>

            <table className="premium-table">
              <thead><tr><th>Usuario</th><th>Rango</th><th>Estado</th><th style={{textAlign:'right'}}>Acciones</th></tr></thead>
              <tbody>{users.map(u=>(
                <tr key={u.id}>
                  {editingUser===u.id?(<>
                    <td><input className="input-field" value={editUserData.username} onChange={e=>setEditUserData({...editUserData,username:e.target.value})}/></td>
                    <td><select className="input-field" value={editUserData.role} onChange={e=>setEditUserData({...editUserData,role:e.target.value})}><option value="WORKER">Trabajador</option><option value="ADMIN">Admin</option></select></td>
                    <td><span className="status-badge" style={{'--c':u.isActive?'var(--neon-green)':'var(--text-muted)'} as any}>{u.isActive?'Activo':'Inactivo'}</span></td>
                    <td style={{textAlign:'right'}}><button className="icon-btn success" onClick={()=>saveUser(u.id)}><Save size={18}/></button><button className="icon-btn muted" onClick={()=>setEditingUser(null)}><X size={18}/></button></td>
                  </>):(<>
                    <td className="bold-td">{u.username}</td>
                    <td><span className={`role-badge ${u.role==='ADMIN'?'admin':'worker'}`}>{u.role}</span></td>
                    <td><span className="status-dot" style={{'--c':u.isActive?'var(--neon-green)':'var(--text-muted)'} as any}>{u.isActive?'● Activo':'○ Inactivo'}</span></td>
                    <td style={{textAlign:'right'}}>
                      {u.username!=='admin' && (<>
                        <button className="icon-btn cyan" onClick={()=>{setEditingUser(u.id);setEditUserData({username:u.username,role:u.role,password:''});}}><Pencil size={18}/></button>
                        {u.isActive?<button className="icon-btn pink" onClick={()=>delUser(u.id)}><Trash2 size={18}/></button>:<button className="icon-btn green" onClick={()=>reactUser(u.id)}><RotateCcw size={18}/></button>}
                      </>)}
                    </td>
                  </>)}
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}

        {/* TAB: PRODUCTOS */}
        {activeTab==='productos' && (
          <div className="tab-content fade-in">
            <header className="content-header">
              <h2 style={{color:'var(--neon-violet)'}}>Catálogo de Productos</h2>
              <p>Administra los items y sus costos base</p>
            </header>
            <form onSubmit={addProduct} className="admin-form highlight-violet">
              <div className="form-grid">
                <div className="form-group" style={{flex:2}}><label className="label">Nombre del Producto</label><input type="text" required className="input-field" value={prodName} onChange={e=>setProdName(e.target.value)}/></div>
                <div className="form-group"><label className="label">Costo de Compra</label><input type="number" required className="input-field" value={prodPrice} onChange={e=>setProdPrice(e.target.value)}/></div>
              </div>
              <button type="submit" className="btn btn-primary" style={{background:'var(--neon-violet)', boxShadow:'0 4px 15px hsla(258, 90%, 66%, 0.3)'}}>Añadir al Inventario</button>
            </form>
            <table className="premium-table">
              <thead><tr><th>Producto</th><th>Costo Base</th><th style={{textAlign:'right'}}>Acciones</th></tr></thead>
              <tbody>{products.map(p=>(
                <tr key={p.id}>
                  {editingProduct===p.id?(<>
                    <td><input className="input-field" value={editProductData.name} onChange={e=>setEditProductData({...editProductData,name:e.target.value})}/></td>
                    <td><input type="number" className="input-field" value={editProductData.purchasePrice} onChange={e=>setEditProductData({...editProductData,purchasePrice:e.target.value})}/></td>
                    <td style={{textAlign:'right'}}><button className="icon-btn success" onClick={()=>saveProd(p.id)}><Save size={18}/></button><button className="icon-btn muted" onClick={()=>setEditingProduct(null)}><X size={18}/></button></td>
                  </>):(<>
                    <td className="bold-td">{p.name}</td>
                    <td className="muted-td">{fmt(p.purchasePrice)}</td>
                    <td style={{textAlign:'right'}}><button className="icon-btn cyan" onClick={()=>{setEditingProduct(p.id);setEditProductData({name:p.name,purchasePrice:p.purchasePrice});}}><Pencil size={18}/></button></td>
                  </>)}
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}

        {/* TAB: STAFF / VENDEDORES */}
        {activeTab==='vendedores' && (
          <div className="tab-content fade-in">
            <header className="content-header">
              <h2 style={{color:'var(--neon-green)'}}>Staff / Vendedores</h2>
              <p>Gestión de personal para asignación de comisiones</p>
            </header>
            <form onSubmit={addSeller} className="admin-form highlight-green">
              <div className="form-group"><label className="label">Nombre Completo</label><input type="text" required className="input-field" value={sellName} onChange={e=>setSellName(e.target.value)}/></div>
              <button type="submit" className="btn btn-primary" style={{background:'var(--neon-green)', border:'none', color:'#060912'}}>Registrar Vendedor</button>
            </form>
            <table className="premium-table">
              <thead><tr><th>Nombre</th><th style={{textAlign:'right'}}>Acciones</th></tr></thead>
              <tbody>{sellers.map(s=>(
                <tr key={s.id}>
                  {editingSeller===s.id?(<>
                    <td><input className="input-field" value={editSellerData.name} onChange={e=>setEditSellerData({...editSellerData,name:e.target.value})}/></td>
                    <td style={{textAlign:'right'}}><button className="icon-btn success" onClick={()=>saveSell(s.id)}><Save size={18}/></button><button className="icon-btn muted" onClick={()=>setEditingSeller(null)}><X size={18}/></button></td>
                  </>):(<>
                    <td className="bold-td">{s.name}</td>
                    <td style={{textAlign:'right'}}><button className="icon-btn cyan" onClick={()=>{setEditingSeller(s.id);setEditSellerData({name:s.name});}}><Pencil size={18}/></button></td>
                  </>)}
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}

        {/* TAB: REPORTES */}
        {activeTab==='reportes' && (
          <div className="tab-content fade-in">
            <header className="content-header">
              <h2 style={{color:'var(--warning)'}}>Generación de Reportes</h2>
              <p>Exporta datos históricos en formatos profesionales</p>
            </header>
            <div className="export-controls glass-card">
              <div className="filter-row">
                <div className="form-group"><label className="label">Fecha Inicio</label><input type="date" className="input-field" value={startDate} onChange={e=>setStartDate(e.target.value)}/></div>
                <div className="form-group"><label className="label">Fecha Fin</label><input type="date" className="input-field" value={endDate} onChange={e=>setEndDate(e.target.value)}/></div>
              </div>
              <div className="export-actions">
                <button onClick={expXLS} className="export-btn xls"><FileSpreadsheet size={20}/> <span>Descargar Excel</span></button>
                <button onClick={expPDF} className="export-btn pdf"><FileText size={20}/> <span>Generar PDF</span></button>
              </div>
              <p className="export-note">Si no seleccionas fechas, se exportará todo el historial disponible.</p>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .tabs-wrapper { padding: 0.5rem; margin-bottom: 2rem; border-radius: var(--radius-lg); }
        .tabs-container { display: flex; gap: 0.5rem; overflow-x: auto; }
        .tab-btn {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.75rem;
          padding: 1rem; border-radius: var(--radius-md); border: 1px solid transparent;
          background: transparent; color: var(--text-secondary); cursor: pointer;
          font-weight: 700; font-family: var(--font-accent); transition: all 0.3s ease;
          min-width: 140px;
        }
        .tab-btn:hover { background: rgba(255,255,255,0.03); color: white; }
        .tab-btn.active {
          background: hsla(184, 100%, 50%, 0.05);
          color: var(--active-color);
          border-color: hsla(184, 100%, 50%, 0.2);
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }

        .content-header { margin-bottom: 2rem; }
        .content-header h2 { font-size: 1.8rem; margin: 0; }
        .content-header p { color: var(--text-muted); margin: 0.25rem 0 0; }

        .admin-stats-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem; margin-bottom: 2.5rem;
        }
        .stat-card {
          background: var(--surface); padding: 1.5rem; border-radius: var(--radius-md);
          border: 1px solid var(--surface-border); display: flex; flex-direction: column; gap: 1rem;
        }
        .stat-header { display: flex; align-items: center; gap: 0.75rem; }
        .stat-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
        .stat-label { color: var(--text-muted); font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
        .stat-value { font-size: 1.3rem; font-weight: 800; font-family: var(--font-accent); }

        .section-title { font-size: 1.1rem; margin-bottom: 1rem; color: var(--text-primary); }
        .time-td { font-family: 'Outfit'; color: var(--text-secondary); font-weight: 600; }
        .bold-td { font-weight: 700; }
        .muted-td { color: var(--text-muted); }
        .success-td { color: var(--neon-green); font-weight: 700; }
        .cyan-td { color: var(--neon-cyan); font-weight: 700; }
        .warning-td { color: var(--warning); font-weight: 700; }
        .violet-td { color: var(--neon-violet); font-weight: 700; }
        .badge { background: rgba(255,255,255,0.07); padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.7rem; font-weight: 700; }

        .admin-form {
          background: rgba(0,0,0,0.2); padding: 1.5rem; border-radius: var(--radius-md);
          margin-bottom: 2rem; display: flex; flex-direction: column; gap: 1.5rem;
        }
        .form-grid { display: flex; gap: 1.5rem; }
        .highlight-pink { border-left: 4px solid var(--neon-pink); }
        .highlight-violet { border-left: 4px solid var(--neon-violet); }
        .highlight-green { border-left: 4px solid var(--neon-green); }

        .role-badge { padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.75rem; font-weight: 800; }
        .role-badge.admin { background: hsla(184, 100%, 50%, 0.1); color: var(--neon-cyan); }
        .role-badge.worker { background: rgba(255,255,255,0.07); color: var(--text-secondary); }
        
        .status-dot { font-size: 0.85rem; color: var(--c); font-weight: 600; }
        .icon-btn {
          background: transparent; border: none; padding: 0.5rem; cursor: pointer;
          border-radius: 6px; transition: all 0.2s; color: var(--text-muted);
        }
        .icon-btn:hover { background: rgba(255,255,255,0.05); color: white; }
        .icon-btn.cyan:hover { color: var(--neon-cyan); background: hsla(184, 100%, 50%, 0.1); }
        .icon-btn.pink:hover { color: var(--neon-pink); background: hsla(345, 100%, 60%, 0.1); }
        .icon-btn.green:hover { color: var(--neon-green); background: hsla(142, 70%, 50%, 0.1); }
        .icon-btn.success:hover { color: var(--neon-green); }

        .export-controls { padding: 2.5rem; text-align: center; }
        .filter-row { display: flex; justify-content: center; gap: 2rem; margin-bottom: 2rem; }
        .export-actions { display: flex; justify-content: center; gap: 1.5rem; }
        .export-btn {
          display: flex; align-items: center; gap: 0.75rem; padding: 1rem 2rem;
          border-radius: var(--radius-md); border: none; color: white; font-weight: 700;
          cursor: pointer; transition: all 0.3s;
        }
        .export-btn.xls { background: #107c41; box-shadow: 0 4px 15px rgba(16, 124, 65, 0.3); }
        .export-btn.pdf { background: #e11d48; box-shadow: 0 4px 15px rgba(225, 29, 72, 0.3); }
        .export-btn:hover { transform: translateY(-3px); filter: brightness(1.1); box-shadow: 0 8px 25px rgba(0,0,0,0.4); }
        .export-note { margin-top: 1.5rem; color: var(--text-muted); font-size: 0.85rem; }

        @media (max-width: 900px) {
          .form-grid { flex-direction: column; gap: 1rem; }
          .filter-row { flex-direction: column; gap: 1rem; }
        }
      `}</style>
    </div>
  );
}
