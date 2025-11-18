import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import './Dashboard.css';

function Dashboard({ user }) {
  const [tareas, setTareas] = useState([]);
  const [vistaActual, setVistaActual] = useState('todos');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [tareaEditando, setTareaEditando] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [ordenar, setOrdenar] = useState('fecha');
  
  // Formulario
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState('media');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

  // CARGAR TAREAS
  useEffect(() => {
    const q = query(
      collection(db, 'tareas'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tareasFirebase = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTareas(tareasFirebase);
    });

    return unsubscribe;
  }, [user.uid]);

  // AÑADIR TAREA
  const añadirTarea = async (e) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    try {
      await addDoc(collection(db, 'tareas'), {
        titulo,
        descripcion,
        prioridad,
        completado: false,
        userId: user.uid,
        fecha: fecha,
        createdAt: new Date().toISOString()
      });

      setTitulo('');
      setDescripcion('');
      setPrioridad('media');
      setFecha(new Date().toISOString().split('T')[0]);
      setMostrarModal(false);
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  // EDITAR TAREA
  const editarTarea = async (e) => {
    e.preventDefault();
    if (!titulo.trim() || !tareaEditando) return;

    try {
      const tareaRef = doc(db, 'tareas', tareaEditando.id);
      await updateDoc(tareaRef, {
        titulo,
        descripcion,
        prioridad,
        fecha
      });

      setTitulo('');
      setDescripcion('');
      setPrioridad('media');
      setFecha(new Date().toISOString().split('T')[0]);
      setTareaEditando(null);
      setMostrarModal(false);
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const toggleCompletado = async (tarea) => {
    try {
      const tareaRef = doc(db, 'tareas', tarea.id);
      await updateDoc(tareaRef, {
        completado: !tarea.completado
      });
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
    setFecha(tarea.fecha || new Date().toISOString().split('T')[0]);
    setMostrarModal(true);
  };

  const abrirNuevaTarea = () => {
    setTareaEditando(null);
    setTitulo('');
    setDescripcion('');
    setPrioridad('media');
    setFecha(new Date().toISOString().split('T')[0]);
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setTareaEditando(null);
    setTitulo('');
    setDescripcion('');
  };

  // FILTRAR TAREAS
  let tareasFiltradas = tareas.filter(tarea => {
    // Filtro por vista
    if (vistaActual === 'completados' && !tarea.completado) return false;
    if (vistaActual === 'pendientes' && tarea.completado) return false;
    if (vistaActual === 'hoy') {
      const hoy = new Date().toISOString().split('T')[0];
      if (tarea.fecha !== hoy) return false;
    }

    // Filtro por búsqueda
    if (busqueda) {
      return tarea.titulo.toLowerCase().includes(busqueda.toLowerCase());
    }

    return true;
  });

  // ORDENAR TAREAS
  if (ordenar === 'prioridad') {
    const prioridadOrden = { alta: 1, media: 2, baja: 3 };
    tareasFiltradas.sort((a, b) => prioridadOrden[a.prioridad] - prioridadOrden[b.prioridad]);
  } else if (ordenar === 'fecha') {
    tareasFiltradas.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  }

  const hoy = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="dashboard">
      {/* MENÚ LATERAL */}
      <aside className="sidebar">
        <div className="user-profile">
          {user.photoURL ? (
            <img src={user.photoURL} alt="Avatar" className="avatar" />
          ) : (
            <div className="avatar-placeholder">
              {user.email[0].toUpperCase()}
            </div>
          )}
          <h3>{user.displayName || 'Usuario'}</h3>
          <p className="user-email">{user.email}</p>
        </div>

        <nav className="menu">
          <button 
            className={vistaActual === 'todos' ? 'menu-item active' : 'menu-item'}
            onClick={() => setVistaActual('todos')}
          >
            <span>📋</span> Todas las tareas
          </button>
          <button 
            className={vistaActual === 'hoy' ? 'menu-item active' : 'menu-item'}
            onClick={() => setVistaActual('hoy')}
          >
            <span>☀️</span> Mi día
          </button>
          <button 
            className={vistaActual === 'pendientes' ? 'menu-item active' : 'menu-item'}
            onClick={() => setVistaActual('pendientes')}
          >
            <span>⏳</span> Pendientes
          </button>
          <button 
            className={vistaActual === 'completados' ? 'menu-item active' : 'menu-item'}
            onClick={() => setVistaActual('completados')}
          >
            <span>✅</span> Completadas
          </button>
          
          <div className="menu-divider"></div>
          
          <button className="menu-item" onClick={abrirNuevaTarea}>
            <span>➕</span> Añadir tarea
          </button>
        </nav>

        <button onClick={() => auth.signOut()} className="logout-sidebar">
          <span>🚪</span> Cerrar sesión
        </button>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="main-dashboard">
        {/* BARRA SUPERIOR */}
        <header className="top-bar">
          <div className="search-container">
            <input
              type="text"
              placeholder="🔍 Buscar tareas..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="search-input"
            />
          </div>
          
          <select 
            value={ordenar} 
            onChange={(e) => setOrdenar(e.target.value)}
            className="sort-select"
          >
            <option value="fecha">📅 Por fecha</option>
            <option value="prioridad">🔥 Por prioridad</option>
          </select>
        </header>

        {/* SALUDO */}
        <div className="welcome-section">
          <h1>
            {vistaActual === 'hoy' && '☀️ '}
            {vistaActual === 'completados' && '✅ '}
            {vistaActual === 'pendientes' && '⏳ '}
            {vistaActual === 'todos' && '📋 '}
            
            {vistaActual === 'hoy' ? 'Mi día' : 
             vistaActual === 'completados' ? 'Completadas' :
             vistaActual === 'pendientes' ? 'Pendientes' : 
             'Todas las tareas'}
          </h1>
          <p className="fecha-hoy">{hoy.charAt(0).toUpperCase() + hoy.slice(1)}</p>
          <p className="contador">
            {tareasFiltradas.length} {tareasFiltradas.length === 1 ? 'tarea' : 'tareas'}
            {vistaActual === 'todos' && ` • ${tareas.filter(t => !t.completado).length} pendientes`}
          </p>
        </div>

        {/* LISTA DE TAREAS */}
        <div className="tasks-container">
          {tareasFiltradas.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                {vistaActual === 'hoy' && '☀️'}
                {vistaActual === 'completados' && '🎉'}
                {vistaActual === 'pendientes' && '📝'}
                {vistaActual === 'todos' && '📋'}
              </div>
              <h3>
                {busqueda ? 'No se encontraron tareas' :
                 vistaActual === 'hoy' ? 'No tienes tareas para hoy' :
                 vistaActual === 'completados' ? '¡Aún no has completado ninguna tarea!' :
                 vistaActual === 'pendientes' ? '¡No tienes tareas pendientes!' :
                 'Crea tu primera tarea'}
              </h3>
              {!busqueda && (
                <button onClick={abrirNuevaTarea} className="btn-crear">
                  ➕ Crear tarea
                </button>
              )}
            </div>
          ) : (
            tareasFiltradas.map(tarea => (
              <div key={tarea.id} className={`task-card ${tarea.completado ? 'completed' : ''} prioridad-${tarea.prioridad}`}>
                <input 
                  type="checkbox" 
                  checked={tarea.completado}
                  onChange={() => toggleCompletado(tarea)}
                  className="task-checkbox"
                />
                <div className="task-info">
                  <h3>{tarea.titulo}</h3>
                  {tarea.descripcion && <p className="task-desc">{tarea.descripcion}</p>}
                  <div className="task-meta">
                    <span className={`badge prioridad ${tarea.prioridad}`}>
                      {tarea.prioridad === 'baja' && '🟢 Baja'}
                      {tarea.prioridad === 'media' && '🟡 Media'}
                      {tarea.prioridad === 'alta' && '🔴 Alta'}
                    </span>
                    {tarea.fecha && (
                      <span className="badge fecha">
                        📅 {new Date(tarea.fecha + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="task-actions">
                  <button onClick={() => abrirEditar(tarea)} className="btn-icon" title="Editar">
                    ✏️
                  </button>
                  <button onClick={() => eliminarTarea(tarea.id)} className="btn-icon" title="Eliminar">
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <button onClick={abrirNuevaTarea} className="fab" title="Nueva tarea">
          +
        </button>
      </main>

      {/* MODAL */}
      {mostrarModal && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{tareaEditando ? '✏️ Editar Tarea' : '➕ Nueva Tarea'}</h2>
              <button onClick={cerrarModal} className="btn-close">✕</button>
            </div>
            
            <form onSubmit={tareaEditando ? editarTarea : añadirTarea}>
              <label>
                Título *
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej: Hacer ejercicio"
                  required
                  autoFocus
                />
              </label>

              <label>
                Descripción
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Detalles opcionales..."
                  rows="3"
                />
              </label>

              <div className="form-row">
                <label>
                  Prioridad
                  <select value={prioridad} onChange={(e) => setPrioridad(e.target.value)}>
                    <option value="baja">🟢 Baja</option>
                    <option value="media">🟡 Media</option>
                    <option value="alta">🔴 Alta</option>
                  </select>
                </label>

                <label>
                  Fecha
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                  />
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={cerrarModal} className="btn-cancel">
                  Cancelar
                </button>
                <button type="submit" className="btn-submit">
                  {tareaEditando ? '💾 Guardar cambios' : '➕ Crear tarea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
