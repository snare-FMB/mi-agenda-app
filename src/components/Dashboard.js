import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot } from 'firebase/firestore';
import './Dashboard.css';

function Dashboard({ user }) {
  const [tareas, setTareas] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [vistaActual, setVistaActual] = useState('todos');
  const [proyectoActual, setProyectoActual] = useState('todos');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalProyecto, setMostrarModalProyecto] = useState(false);
  const [mostrarModalPerfil, setMostrarModalPerfil] = useState(false);
  const [tareaEditando, setTareaEditando] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [ordenar, setOrdenar] = useState('fecha');
  const [menuAbierto, setMenuAbierto] = useState(true);
  
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState('media');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [proyecto, setProyecto] = useState('');
  const [nombreProyecto, setNombreProyecto] = useState('');

  // Cargar tareas
  useEffect(() => {
    const q = query(collection(db, 'tareas'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tareasFirebase = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTareas(tareasFirebase);
    });
    return unsubscribe;
  }, [user.uid]);

  // Cargar proyectos
  useEffect(() => {
    const q = query(collection(db, 'proyectos'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const proyectosFirebase = snapshot.docs.map(doc => ({ id: doc.id, nombre: doc.data().nombre }));
      setProyectos(proyectosFirebase);
    });
    return unsubscribe;
  }, [user.uid]);

  const añadirTarea = async (e) => {
    e.preventDefault();
    if (!titulo.trim()) return;
    
    const tareaData = {
      titulo,
      descripcion,
      prioridad,
      proyecto: proyecto || null,
      completado: false,
      userId: user.uid,
      fecha: fecha,
      createdAt: new Date().toISOString()
    };
    
    setMostrarModal(false);
    setTitulo('');
    setDescripcion('');
    setPrioridad('media');
    setProyecto('');
    setFecha(new Date().toISOString().split('T')[0]);
    setTareaEditando(null);
    
    try {
      await addDoc(collection(db, 'tareas'), tareaData);
    } catch (error) {
      alert('Error: ' + error.message);
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
    
    const tareaId = tareaEditando.id;
    const tareaData = {
      titulo,
      descripcion,
      prioridad,
      proyecto: proyecto || null,
      fecha
    };
    
    setMostrarModal(false);
    setTitulo('');
    setDescripcion('');
    setPrioridad('media');
    setProyecto('');
    setFecha(new Date().toISOString().split('T')[0]);
    setTareaEditando(null);
    
    try {
      await updateDoc(doc(db, 'tareas', tareaId), tareaData);
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const añadirProyecto = async (e) => {
    e.preventDefault();
    if (!nombreProyecto.trim()) return;
    
    const proyectoData = {
      nombre: nombreProyecto,
      userId: user.uid,
      createdAt: new Date().toISOString()
    };
    
    setMostrarModalProyecto(false);
    setNombreProyecto('');
    
    try {
      await addDoc(collection(db, 'proyectos'), proyectoData);
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const eliminarProyecto = async (id) => {
    if (!window.confirm('¿Eliminar este proyecto? Las tareas asociadas no se eliminarán.')) return;
    try {
      await deleteDoc(doc(db, 'proyectos', id));
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
    setProyecto('');
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
    setProyecto(tarea.proyecto || '');
    setFecha(tarea.fecha || new Date().toISOString().split('T')[0]);
    setMostrarModal(true);
  };

  const abrirNuevaTarea = () => {
    setTareaEditando(null);
    setTitulo('');
    setDescripcion('');
    setPrioridad('media');
    setProyecto('');
    setFecha(new Date().toISOString().split('T')[0]);
    setMostrarModal(true);
  };

  let tareasFiltradas = tareas.filter(tarea => {
    if (vistaActual === 'completados' && !tarea.completado) return false;
    if (vistaActual === 'pendientes' && tarea.completado) return false;
    if (vistaActual === 'hoy' && tarea.fecha !== new Date().toISOString().split('T')[0]) return false;
    if (vistaActual === 'sin-proyecto' && tarea.proyecto) return false;
    if (proyectoActual !== 'todos' && proyectoActual !== 'sin-proyecto' && tarea.proyecto !== proyectoActual) return false;
    if (proyectoActual === 'sin-proyecto' && tarea.proyecto) return false;
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
  const contarSinProyecto = () => tareas.filter(t => !t.proyecto && !t.completado).length;

  return (
    <div className="dashboard">
      <aside className={`sidebar ${menuAbierto ? '' : 'cerrado'}`}>
        <div className="sidebar-header">
          <button className="menu-toggle" onClick={() => setMenuAbierto(!menuAbierto)}>
            <span></span>
            <span></span>
            <span></span>
          </button>
          
          <div className="user-profile-mini" onClick={() => setMostrarModalPerfil(true)}>
            {user.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="avatar-mini" />
            ) : (
              <div className="avatar-mini-placeholder">{user.email[0].toUpperCase()}</div>
            )}
            <span className="user-name-mini">{user.displayName || 'Usuario'}</span>
          </div>
        </div>

        <nav className="menu">
          <div className="menu-section-botones">
            <div className="btn-con-nombre">
              <button className="menu-btn-icon" onClick={abrirNuevaTarea} title="Añadir tarea">
                ➕
              </button>
              <span>Añadir tarea</span>
            </div>
            <div className="btn-con-nombre">
              <button className="menu-btn-icon" onClick={() => setVistaActual('hoy')} title="Mi día">
                ☀️
              </button>
              <span>Mi día</span>
            </div>
            <div className="btn-con-nombre">
              <button className="menu-btn-icon" title="Calendario">
                📅
              </button>
              <span>Calendario</span>
            </div>
            <div className="btn-con-nombre">
              <button className="menu-btn-icon" onClick={() => { setProyectoActual('sin-proyecto'); setVistaActual('sin-proyecto'); }} title="Sin proyecto">
                🗂️
              </button>
              <span>Sin proyecto</span>
            </div>
          </div>

          <div className="menu-section">
            <p className="menu-title">MIS PROYECTOS</p>
            <button className="menu-item btn-add-proyecto" onClick={() => setMostrarModalProyecto(true)}>
              <span>➕</span> Nuevo proyecto
            </button>
            {proyectos.map(p => (
              <div key={p.id} className="proyecto-item">
                <button className={proyectoActual === p.nombre ? 'menu-item active' : 'menu-item'}
                  onClick={() => { setProyectoActual(p.nombre); setVistaActual('todos'); }}>
                  <span>📂</span> {p.nombre} <span className="badge-count">{contarPorProyecto(p.nombre)}</span>
                </button>
                <button onClick={() => eliminarProyecto(p.id)} className="btn-delete-proyecto">🗑️</button>
              </div>
            ))}
          </div>
        </nav>
      </aside>

      <main className="main-dashboard">
        <header className="top-bar">
          <div className="top-bar-actions">
            <div className="btn-top-con-nombre">
              <button className={vistaActual === 'completados' ? 'btn-circle active' : 'btn-circle'}
                onClick={() => { setVistaActual('completados'); setProyectoActual('todos'); }}
                title="Completados">
                ✓
              </button>
              <span>Completados</span>
            </div>

            <div className="separador-vertical"></div>

            <div className="btn-top-con-nombre">
              <button className={vistaActual === 'pendientes' ? 'btn-circle active' : 'btn-circle'}
                onClick={() => { setVistaActual('pendientes'); setProyectoActual('todos'); }}
                title="Pendientes">
                ⏳
              </button>
              <span>Pendientes</span>
            </div>

            <div className="separador-vertical"></div>

            <div className="btn-top-con-nombre">
              <button className="btn-circle" title="Ordenar">
                ⚙️
              </button>
              <span>Ordenar</span>
            </div>

            <div className="separador-vertical"></div>

            <div className="btn-top-con-nombre">
              <div className="search-box-inline">
                <input type="text" placeholder="🔍 Buscar..." value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)} className="search-input-inline" />
              </div>
              <span>Buscar</span>
            </div>
          </div>

          <div className="flecha-centro">▼</div>
        </header>

        <div className="welcome-section">
          <h1>
            {proyectoActual !== 'todos' && proyectoActual !== 'sin-proyecto' ? `📂 ${proyectoActual}` :
             proyectoActual === 'sin-proyecto' ? '🗂️ Sin proyecto' :
             vistaActual === 'hoy' ? '☀️ Mi día' : 
             vistaActual === 'completados' ? '✅ Completadas' :
             vistaActual === 'pendientes' ? '⏳ Pendientes' : '📋 Todas mis tareas'}
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
                    {!tarea.proyecto && <span className="badge sin-proyecto">🗂️ Sin proyecto</span>}
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
                <label>Proyecto (opcional)
                  <select value={proyecto} onChange={(e) => setProyecto(e.target.value)}>
                    <option value="">🗂️ Sin proyecto</option>
                    {proyectos.map(p => <option key={p.id} value={p.nombre}>📂 {p.nombre}</option>)}
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

      {mostrarModalProyecto && (
        <div className="modal-overlay" onClick={() => setMostrarModalProyecto(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📂 Nuevo Proyecto</h2>
              <button onClick={() => setMostrarModalProyecto(false)} className="btn-close" type="button">✕</button>
            </div>
            <form onSubmit={añadirProyecto}>
              <label>Nombre del proyecto *
                <input type="text" value={nombreProyecto} onChange={(e) => setNombreProyecto(e.target.value)}
                  placeholder="Ej: Trabajo, Estudios, Personal..." required autoFocus />
              </label>
              <div className="modal-actions">
                <button type="button" onClick={() => setMostrarModalProyecto(false)} className="btn-cancel">Cancelar</button>
                <button type="submit" className="btn-submit">➕ Crear proyecto</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarModalPerfil && (
        <div className="modal-overlay" onClick={() => setMostrarModalPerfil(false)}>
          <div className="modal modal-perfil" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>👤 Mi Perfil</h2>
              <button onClick={() => setMostrarModalPerfil(false)} className="btn-close" type="button">✕</button>
            </div>
            <div className="perfil-content">
              <div className="perfil-avatar-grande">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" />
                ) : (
                  <div className="avatar-grande-placeholder">{user.email[0].toUpperCase()}</div>
                )}
              </div>
              <h3 className="perfil-nombre">{user.displayName || 'Usuario'}</h3>
              <p className="perfil-email">{user.email}</p>
              
              <div className="perfil-estadisticas">
                <div className="stat-item">
                  <span className="stat-numero">{proyectos.length}</span>
                  <span className="stat-label">Proyectos creados</span>
                </div>
                <div className="stat-item">
                  <span className="stat-numero">{tareas.length}</span>
                  <span className="stat-label">Tareas creadas</span>
                </div>
                <div className="stat-item">
                  <span className="stat-numero">{tareas.filter(t => t.completado).length}</span>
                  <span className="stat-label">Tareas completadas</span>
                </div>
              </div>

              <button onClick={() => auth.signOut()} className="btn-logout-perfil">
                <span>🚪</span> Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
