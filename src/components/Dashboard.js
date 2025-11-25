import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot } from 'firebase/firestore';
import './Dashboard.css';

function Dashboard({ user }) {
  const [tareas, setTareas] = useState([]);
  const [proyectos] = useState(['Personal', 'Trabajo', 'Universidad', 'Hogar']);
  const [vistaActual, setVistaActual] = useState('todos');
  const [proyectoActual, setProyectoActual] = useState('todos');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [tareaEditando, setTareaEditando] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [ordenar, setOrdenar] = useState('fecha');
  
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState('media');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [proyecto, setProyecto] = useState('Personal');

  useEffect(() => {
    const q = query(collection(db, 'tareas'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tareasFirebase = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTareas(tareasFirebase);
    });
    return unsubscribe;
  }, [user.uid]);

  const añadirTarea = async (e) => {
  e.preventDefault();
  if (!titulo.trim()) return;
  
  // Guardar valores antes de limpiar
  const tareaData = {
    titulo,
    descripcion,
    prioridad,
    proyecto,
    completado: false,
    userId: user.uid,
    fecha: fecha,
    createdAt: new Date().toISOString()
  };
  
  // Cerrar modal PRIMERO
  setMostrarModal(false);
  
  // Limpiar campos
  setTitulo('');
  setDescripcion('');
  setPrioridad('media');
  setProyecto('Personal');
  setFecha(new Date().toISOString().split('T')[0]);
  setTareaEditando(null);
  
  // Guardar en Firebase DESPUÉS
  try {
    await addDoc(collection(db, 'tareas'), tareaData);
  } catch (error) {
    alert('Error: ' + error.message);
    // Si falla, reabrir el modal con los datos
    setMostrarModal(true);
    setTitulo(tareaData.titulo);
    setDescripcion(tareaData.descripcion);
    setPrioridad(tareaData.prioridad);
    setProyecto(tareaData.proyecto);
    setFecha(tareaData.fecha);
  }
};

  const editarTarea = async (e) => {
  e.preventDefault();
  if (!titulo.trim() || !tareaEditando) return;
  
  // Guardar valores antes de limpiar
  const tareaId = tareaEditando.id;
  const tareaData = {
    titulo,
    descripcion,
    prioridad,
    proyecto,
    fecha
  };
  
  // Cerrar modal PRIMERO
  setMostrarModal(false);
  
  // Limpiar campos
  setTitulo('');
  setDescripcion('');
  setPrioridad('media');
  setProyecto('Personal');
  setFecha(new Date().toISOString().split('T')[0]);
  setTareaEditando(null);
  
  // Actualizar en Firebase DESPUÉS
  try {
    await updateDoc(doc(db, 'tareas', tareaId), tareaData);
  } catch (error) {
    alert('Error: ' + error.message);
  }
};

  const cerrarModal = () => {
    setMostrarModal(false);
    setTareaEditando(null);
    setTitulo('');
    setDescripcion('');
    setPrioridad('media');
    setProyecto('Personal');
    setFecha(new Date().toISOString().split('T')[0]);
  };

  const toggleCompletado = async (tarea) => {
    try {
      await updateDoc(doc(db, 'tareas', tarea.id), { completado: !tarea.completado });
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const eliminarTarea = async (id) => {
    if (!window.confirm('¿Eliminar esta tarea?')) return;
    try {
      await deleteDoc(doc(db, 'tareas', id));
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const abrirEditar = (tarea) => {
    setTareaEditando(tarea);
    setTitulo(tarea.titulo);
    setDescripcion(tarea.descripcion || '');
    setPrioridad(tarea.prioridad);
    setProyecto(tarea.proyecto || 'Personal');
    setFecha(tarea.fecha || new Date().toISOString().split('T')[0]);
    setMostrarModal(true);
  };

  const abrirNuevaTarea = () => {
    setTareaEditando(null);
    setTitulo('');
    setDescripcion('');
    setPrioridad('media');
    setProyecto('Personal');
    setFecha(new Date().toISOString().split('T')[0]);
    setMostrarModal(true);
  };

  let tareasFiltradas = tareas.filter(tarea => {
    if (vistaActual === 'completados' && !tarea.completado) return false;
    if (vistaActual === 'pendientes' && tarea.completado) return false;
    if (vistaActual === 'hoy' && tarea.fecha !== new Date().toISOString().split('T')[0]) return false;
    if (proyectoActual !== 'todos' && tarea.proyecto !== proyectoActual) return false;
    if (busqueda && !tarea.titulo.toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  });

  if (ordenar === 'prioridad') {
    const orden = { alta: 1, media: 2, baja: 3 };
    tareasFiltradas.sort((a, b) => orden[a.prioridad] - orden[b.prioridad]);
  } else {
    tareasFiltradas.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  }

  const hoy = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  const contarPorProyecto = (p) => tareas.filter(t => t.proyecto === p && !t.completado).length;

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="user-profile">
          {user.photoURL ? (
            <img src={user.photoURL} alt="Avatar" className="avatar" />
          ) : (
            <div className="avatar-placeholder">{user.email[0].toUpperCase()}</div>
          )}
          <h3>{user.displayName || 'Usuario'}</h3>
          <p className="user-email">{user.email}</p>
        </div>

        <nav className="menu">
          <div className="menu-section">
            <p className="menu-title">VISTAS</p>
            <button className={vistaActual === 'todos' && proyectoActual === 'todos' ? 'menu-item active' : 'menu-item'}
              onClick={() => { setVistaActual('todos'); setProyectoActual('todos'); }}>
              <span>📋</span> Todas <span className="badge-count">{tareas.length}</span>
            </button>
            <button className={vistaActual === 'hoy' ? 'menu-item active' : 'menu-item'}
              onClick={() => { setVistaActual('hoy'); setProyectoActual('todos'); }}>
              <span>☀️</span> Mi día <span className="badge-count">
                {tareas.filter(t => t.fecha === new Date().toISOString().split('T')[0]).length}
              </span>
            </button>
            <button className={vistaActual === 'pendientes' ? 'menu-item active' : 'menu-item'}
              onClick={() => { setVistaActual('pendientes'); setProyectoActual('todos'); }}>
              <span>⏳</span> Pendientes <span className="badge-count">{tareas.filter(t => !t.completado).length}</span>
            </button>
            <button className={vistaActual === 'completados' ? 'menu-item active' : 'menu-item'}
              onClick={() => { setVistaActual('completados'); setProyectoActual('todos'); }}>
              <span>✅</span> Completadas <span className="badge-count">{tareas.filter(t => t.completado).length}</span>
            </button>
          </div>

          <div className="menu-section">
            <p className="menu-title">PROYECTOS</p>
            {proyectos.map(p => (
              <button key={p} className={proyectoActual === p ? 'menu-item active' : 'menu-item'}
                onClick={() => { setProyectoActual(p); setVistaActual('todos'); }}>
                <span>📂</span> {p} <span className="badge-count">{contarPorProyecto(p)}</span>
              </button>
            ))}
          </div>
          
          <div className="menu-divider"></div>
          <button className="menu-item btn-add" onClick={abrirNuevaTarea}>
            <span>➕</span> Añadir tarea
          </button>
        </nav>

        <button onClick={() => auth.signOut()} className="logout-sidebar">
          <span>🚪</span> Cerrar sesión
        </button>
      </aside>

      <main className="main-dashboard">
        <header className="top-bar">
          <div className="search-container">
            <input type="text" placeholder="🔍 Buscar..." value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)} className="search-input" />
          </div>
          <select value={ordenar} onChange={(e) => setOrdenar(e.target.value)} className="sort-select">
            <option value="fecha">📅 Por fecha</option>
            <option value="prioridad">🔥 Por prioridad</option>
          </select>
        </header>

        <div className="welcome-section">
          <h1>
            {proyectoActual !== 'todos' ? `📂 ${proyectoActual}` :
             vistaActual === 'hoy' ? '☀️ Mi día' : 
             vistaActual === 'completados' ? '✅ Completadas' :
             vistaActual === 'pendientes' ? '⏳ Pendientes' : '📋 Todas'}
          </h1>
          <p className="fecha-hoy">{hoy.charAt(0).toUpperCase() + hoy.slice(1)}</p>
          <p className="contador">{tareasFiltradas.length} tareas</p>
        </div>

        <div className="tasks-container">
          {tareasFiltradas.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>{busqueda ? 'No se encontraron tareas' : 'No hay tareas aquí'}</h3>
              {!busqueda && <button onClick={abrirNuevaTarea} className="btn-crear">➕ Crear tarea</button>}
            </div>
          ) : (
            tareasFiltradas.map(tarea => (
              <div key={tarea.id} className={`task-card ${tarea.completado ? 'completed' : ''} prioridad-${tarea.prioridad}`}>
                <input type="checkbox" checked={tarea.completado} onChange={() => toggleCompletado(tarea)} className="task-checkbox" />
                <div className="task-info">
                  <h3>{tarea.titulo}</h3>
                  {tarea.descripcion && <p className="task-desc">{tarea.descripcion}</p>}
                  <div className="task-meta">
                    <span className={`badge prioridad ${tarea.prioridad}`}>
                      {tarea.prioridad === 'baja' ? '🟢 Baja' : tarea.prioridad === 'media' ? '🟡 Media' : '🔴 Alta'}
                    </span>
                    {tarea.proyecto && <span className="badge proyecto">📂 {tarea.proyecto}</span>}
                    {tarea.fecha && <span className="badge fecha">
                      📅 {new Date(tarea.fecha + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </span>}
                  </div>
                </div>
                <div className="task-actions">
                  <button onClick={() => abrirEditar(tarea)} className="btn-icon">✏️</button>
                  <button onClick={() => eliminarTarea(tarea.id)} className="btn-icon">🗑️</button>
                </div>
              </div>
            ))
          )}
        </div>
        <button onClick={abrirNuevaTarea} className="fab">+</button>
      </main>

      {mostrarModal && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{tareaEditando ? '✏️ Editar Tarea' : '➕ Nueva Tarea'}</h2>
              <button onClick={cerrarModal} className="btn-close" type="button">✕</button>
            </div>
            <form onSubmit={tareaEditando ? editarTarea : añadirTarea}>
              <label>Título *
                <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej: Hacer ejercicio" required autoFocus />
              </label>
              <label>Descripción
                <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Detalles opcionales..." rows="3" />
              </label>
              <div className="form-row">
                <label>Proyecto
                  <select value={proyecto} onChange={(e) => setProyecto(e.target.value)}>
                    {proyectos.map(p => <option key={p} value={p}>📂 {p}</option>)}
                  </select>
                </label>
                <label>Prioridad
                  <select value={prioridad} onChange={(e) => setPrioridad(e.target.value)}>
                    <option value="baja">🟢 Baja</option>
                    <option value="media">🟡 Media</option>
                    <option value="alta">🔴 Alta</option>
                  </select>
                </label>
              </div>
              <label>Fecha
                <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
              </label>
              <div className="modal-actions">
                <button type="button" onClick={cerrarModal} className="btn-cancel">Cancelar</button>
                <button type="submit" className="btn-submit">{tareaEditando ? '💾 Guardar' : '➕ Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
