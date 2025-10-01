const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/api'
  : '/api'; // En producción usa ruta relativa
let periodoActual = null;
let estadisticas = [];
let usuarioActual = null;
let token = null;
let modoRegistro = false;

// Variables para filtros
let todosLosUsuarios = [];
let todosLosJugadores = [];

// Cargar datos al iniciar
async function init() {
  token = localStorage.getItem('token');
  if (token) {
    await verificarSesion();
  }
  actualizarUIAuth();
  await cargarPeriodo();
  await cargarEstadisticas();
}

async function verificarSesion() {
  try {
    const response = await fetch(`${API_URL}/auth/verificar`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const data = await response.json();
      usuarioActual = data.usuario;
    } else {
      localStorage.removeItem('token');
      token = null;
    }
  } catch (error) {
    localStorage.removeItem('token');
    token = null;
  }
}

function actualizarUIAuth() {
  const authSection = document.getElementById('authSection');
  
  if (!usuarioActual) {
    authSection.innerHTML = `
      <button onclick="mostrarLogin()" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        Iniciar Sesión
      </button>
    `;
  } else {
    const rolBadge = {
      'miembro': 'bg-gray-500',
      'colider': 'bg-orange-500',
      'lider': 'bg-red-500'
    }[usuarioActual.rol];
    
    authSection.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="text-sm">
          <span class="font-semibold">${usuarioActual.nombre}</span>
          <span class="ml-2 px-2 py-1 text-xs text-white rounded ${rolBadge}">
            ${usuarioActual.rol.toUpperCase()}
          </span>
        </span>
        <button onclick="logout()" class="text-sm text-red-600 hover:underline">
          Cerrar Sesión
        </button>
      </div>
    `;
  }
  
  actualizarPermisosUI();
}

function actualizarPermisosUI() {
  const elementosColiderLider = document.querySelectorAll('[data-requiere-rol="colider,lider"]');
  const puedeModificar = usuarioActual && ['colider', 'lider'].includes(usuarioActual.rol);
  elementosColiderLider.forEach(elem => {
    elem.style.display = puedeModificar ? 'block' : 'none';
  });

  const elementosLider = document.querySelectorAll('[data-requiere-rol="lider"]');
  const esLider = usuarioActual && usuarioActual.rol === 'lider';
  elementosLider.forEach(elem => {
    elem.style.display = esLider ? 'block' : 'none';
  });
  
  const totalGuerrasInput = document.getElementById('totalGuerras');
  if (totalGuerrasInput) {
    totalGuerrasInput.disabled = !esLider;
  }
  
  const inputs = document.querySelectorAll('tbody input');
  inputs.forEach(input => {
    input.disabled = !puedeModificar;
  });

  const contador = document.getElementById('contadorJugadores');
  if (contador) {
    contador.textContent = estadisticas.length;
  }
}

function mostrarLogin() {
  document.getElementById('loginModal').classList.remove('hidden');
}

function cerrarModal() {
  document.getElementById('loginModal').classList.add('hidden');
  document.getElementById('loginError').classList.add('hidden');
  if (modoRegistro) {
    toggleModoRegistro();
  }
}

function toggleModoRegistro() {
  modoRegistro = !modoRegistro;
  const modalTitle = document.getElementById('modalTitle');
  const nombreDiv = document.getElementById('nombreRegistroDiv');
  const btnAccion = document.getElementById('btnAccion');
  const toggleBtn = document.getElementById('toggleRegistro');
  
  if (modoRegistro) {
    modalTitle.textContent = 'Registrarse';
    nombreDiv.classList.remove('hidden');
    btnAccion.textContent = 'Registrarse';
    btnAccion.onclick = registrarse;
    toggleBtn.textContent = '¿Ya tienes cuenta? Inicia sesión';
  } else {
    modalTitle.textContent = 'Iniciar Sesión';
    nombreDiv.classList.add('hidden');
    btnAccion.textContent = 'Entrar';
    btnAccion.onclick = login;
    toggleBtn.textContent = '¿No tienes cuenta? Regístrate';
  }
}

async function registrarse() {
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;
  const nombre = document.getElementById('nombreRegistro').value;
  
  if (!username || !password || !nombre) {
    document.getElementById('loginError').textContent = 'Todos los campos son requeridos';
    document.getElementById('loginError').classList.remove('hidden');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/auth/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, nombre })
    });
    
    if (response.ok) {
      alert('Registro exitoso. Ahora puedes iniciar sesión.');
      toggleModoRegistro();
      document.getElementById('loginUsername').value = '';
      document.getElementById('loginPassword').value = '';
      document.getElementById('nombreRegistro').value = '';
      document.getElementById('loginError').classList.add('hidden');
    } else {
      const error = await response.json();
      document.getElementById('loginError').textContent = error.error;
      document.getElementById('loginError').classList.remove('hidden');
    }
  } catch (error) {
    alert('Error al registrarse');
  }
}

async function login() {
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    if (response.ok) {
      const data = await response.json();
      token = data.token;
      usuarioActual = data.usuario;
      localStorage.setItem('token', token);
      
      cerrarModal();
      actualizarUIAuth();
      await cargarEstadisticas();
    } else {
      const error = await response.json();
      document.getElementById('loginError').textContent = error.error;
      document.getElementById('loginError').classList.remove('hidden');
    }
  } catch (error) {
    alert('Error al iniciar sesión');
  }
}

function logout() {
  localStorage.removeItem('token');
  token = null;
  usuarioActual = null;
  actualizarUIAuth();
  location.reload();
}

async function cargarPeriodo() {
  try {
    const response = await fetch(`${API_URL}/periodos/activo`);
    periodoActual = await response.json();
    document.getElementById('nombrePeriodo').textContent = periodoActual.nombre;
    document.getElementById('totalGuerras').value = periodoActual.totalGuerras;
  } catch (error) {
    console.log('No hay período activo');
  }
}

async function cargarEstadisticas() {
  try {
    const response = await fetch(`${API_URL}/estadisticas`);
    estadisticas = await response.json();
    renderizarTabla();
    actualizarEstadisticas();
  } catch (error) {
    console.error('Error cargando estadísticas:', error);
  }
}

function renderizarTabla() {
  todosLosJugadores = [...estadisticas];
  mostrarJugadoresFiltrados(todosLosJugadores);
}

function mostrarJugadoresFiltrados(jugadores) {
  const tbody = document.getElementById('tablaJugadores');
  tbody.innerHTML = '';
  
  const puedeEliminar = usuarioActual && ['colider', 'lider'].includes(usuarioActual.rol);
  
  if (jugadores.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="text-center py-8 text-gray-500">No se encontraron jugadores</td></tr>';
    return;
  }
  
  jugadores.forEach((stat, index) => {
    const fila = document.createElement('tr');
    fila.className = 'hover:bg-gray-50';
    fila.innerHTML = `
      <td class="px-4 py-3">#${index + 1}</td>
      <td class="px-4 py-3 font-semibold">${stat.nombre}</td>
      <td class="px-4 py-3">
        <span class="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          TH ${stat.th}
        </span>
      </td>
      <td class="px-4 py-3">
        <input type="number" value="${stat.ataques}" min="0" 
               class="w-16 px-2 py-1 border rounded text-center"
               onchange="actualizarStat('${stat._id}', 'ataques', this.value, ${stat.estrellas})">
        <span class="text-gray-500 text-sm">/${stat.ataquesEsperados}</span>
      </td>
      <td class="px-4 py-3">
        <input type="number" value="${stat.estrellas}" min="0" 
               class="w-16 px-2 py-1 border rounded text-center"
               onchange="actualizarStat('${stat._id}', 'estrellas', ${stat.ataques}, this.value)">
      </td>
      <td class="px-4 py-3 font-bold">${stat.participacion}%</td>
      <td class="px-4 py-3 font-bold">${stat.efectividad}%</td>
      <td class="px-4 py-3 font-bold text-blue-600">${stat.desempeno}%</td>
      ${puedeEliminar ? `
        <td class="px-4 py-3">
          <button onclick="eliminarJugador('${stat._id}', '${stat.nombre}')" 
                  class="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs transition duration-200">
            Eliminar
          </button>
        </td>
      ` : '<td></td>'}
    `;
    tbody.appendChild(fila);
  });
  
  actualizarPermisosUI();
}

function filtrarJugadores() {
  const busqueda = document.getElementById('buscadorJugadores').value.toLowerCase();
  const jugadoresFiltrados = todosLosJugadores.filter(j => 
    j.nombre.toLowerCase().includes(busqueda)
  );
  mostrarJugadoresFiltrados(jugadoresFiltrados);
}

function actualizarEstadisticas() {
  document.getElementById('totalJugadores').textContent = estadisticas.length;
  document.getElementById('totalAtaques').textContent = estadisticas.reduce((sum, s) => sum + s.ataques, 0);
  document.getElementById('totalEstrellas').textContent = estadisticas.reduce((sum, s) => sum + s.estrellas, 0);
  
  const promParticipacion = estadisticas.length > 0
    ? (estadisticas.reduce((sum, s) => sum + s.participacion, 0) / estadisticas.length).toFixed(1)
    : 0;
  document.getElementById('promedioParticipacion').textContent = promParticipacion + '%';
}

async function actualizarTotalGuerras(nuevoTotal) {
  if (!token) {
    alert('Debes iniciar sesión para modificar el total de guerras');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/periodos/${periodoActual._id}/guerras`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ totalGuerras: parseInt(nuevoTotal) })
    });
    
    if (response.status === 403) {
      alert('No tienes permisos para modificar el total de guerras (solo líderes)');
      await cargarPeriodo();
      return;
    }
    
    await cargarEstadisticas();
  } catch (error) {
    alert('Error actualizando total de guerras');
  }
}

async function actualizarStat(id, campo, ataques, estrellas) {
  if (!token) {
    alert('Debes iniciar sesión para modificar datos');
    await cargarEstadisticas();
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/estadisticas/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        ataques: parseInt(ataques), 
        estrellas: parseInt(estrellas) 
      })
    });
    
    if (response.status === 403) {
      alert('No tienes permisos para modificar datos');
      await cargarEstadisticas();
      return;
    }
    
    if (!response.ok) {
      const error = await response.json();
      alert(error.error);
      await cargarEstadisticas();
      return;
    }
    
    await cargarEstadisticas();
  } catch (error) {
    alert('Error actualizando datos');
    await cargarEstadisticas();
  }
}

async function cargarExcel(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  if (!token) {
    alert('Debes iniciar sesión para importar datos');
    event.target.value = '';
    return;
  }
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    const jugadores = data.map(row => ({
      nombre: String(row.Nombre || '').trim(),
      th: parseInt(row.TH || 0),
      ataques: parseInt(row.ATAQUES || 0),
      estrellas: parseInt(row.ESTRELLAS || 0)
    })).filter(j => j.nombre && j.th > 0);
    
    if (jugadores.length > 50) {
      alert('El archivo excede el límite de 50 jugadores');
      event.target.value = '';
      return;
    }
    
    const maxAtaques = Math.max(...jugadores.map(j => j.ataques));
    const guerrasInferidas = Math.ceil(maxAtaques / 2);
    
    const periodoNombre = prompt('Nombre del período:', 'Septiembre 2025');
    if (!periodoNombre) return;
    
    const response = await fetch(`${API_URL}/estadisticas/importar`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        periodoNombre,
        totalGuerras: guerrasInferidas,
        jugadores
      })
    });
    
    if (response.status === 403) {
      alert('No tienes permisos para importar datos');
      event.target.value = '';
      return;
    }
    
    alert(`Importados ${jugadores.length} jugadores`);
    await init();
  } catch (error) {
    alert('Error importando Excel: ' + error.message);
  }
  
  event.target.value = '';
}

async function exportarExcel() {
  if (estadisticas.length === 0) {
    alert('No hay datos para exportar');
    return;
  }
  
  const datosExport = estadisticas.map(s => ({
    'Nombre': s.nombre,
    'TH': s.th,
    'ATAQUES': s.ataques,
    'ESTRELLAS': s.estrellas,
    'PARTICIPACIÓN': s.participacion,
    'EFECTIVIDAD': s.efectividad,
    'DESEMPEÑO': s.desempeno
  }));
  
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(datosExport);
  XLSX.utils.book_append_sheet(wb, ws, "Guerra");
  
  const fecha = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `Guerra_${periodoActual.nombre}_${fecha}.xlsx`);
}

async function agregarJugadorManual() {
  if (!token) {
    alert('Debes iniciar sesión');
    return;
  }
  
  const nombre = document.getElementById('nuevoNombre').value.trim();
  const th = parseInt(document.getElementById('nuevoTH').value);
  const ataques = parseInt(document.getElementById('nuevoAtaques').value) || 0;
  const estrellas = parseInt(document.getElementById('nuevoEstrellas').value) || 0;
  
  if (!nombre || !th) {
    alert('Nombre y TH son obligatorios');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/estadisticas/agregar`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ nombre, th, ataques, estrellas })
    });
    
    if (response.ok) {
      alert('Jugador agregado exitosamente');
      document.getElementById('nuevoNombre').value = '';
      document.getElementById('nuevoTH').value = '';
      document.getElementById('nuevoAtaques').value = '0';
      document.getElementById('nuevoEstrellas').value = '0';
      await cargarEstadisticas();
    } else {
      const error = await response.json();
      alert(error.error);
    }
  } catch (error) {
    alert('Error agregando jugador');
  }
}

async function cargarUsuarios() {
  if (!token) return;
  
  try {
    const response = await fetch(`${API_URL}/auth/usuarios`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    todosLosUsuarios = await response.json();
    mostrarUsuariosFiltrados(todosLosUsuarios);
  } catch (error) {
    console.error('Error cargando usuarios');
  }
}

function mostrarUsuariosFiltrados(usuarios) {
  const lista = document.getElementById('listaUsuarios');
  
  if (!lista) return;
  
  if (usuarios.length === 0) {
    lista.innerHTML = '<p class="text-gray-500 text-center py-4">No se encontraron usuarios</p>';
    return;
  }
  
  lista.innerHTML = usuarios.map(u => `
    <div class="flex justify-between items-center p-3 border rounded bg-gray-50 hover:bg-gray-100">
      <div>
        <span class="font-semibold">${u.nombre}</span>
        <span class="text-sm text-gray-600 ml-2">(@${u.username})</span>
      </div>
      <div class="flex items-center gap-3">
        <select onchange="cambiarRol('${u._id}', this.value)" 
                class="px-3 py-1 border rounded ${
                  u.rol === 'lider' ? 'bg-red-100' : 
                  u.rol === 'colider' ? 'bg-orange-100' : 'bg-gray-100'
                }">
          <option value="miembro" ${u.rol === 'miembro' ? 'selected' : ''}>Miembro</option>
          <option value="colider" ${u.rol === 'colider' ? 'selected' : ''}>Colíder</option>
          <option value="lider" ${u.rol === 'lider' ? 'selected' : ''}>Líder</option>
        </select>
      </div>
    </div>
  `).join('');
}

function filtrarUsuarios() {
  const busqueda = document.getElementById('buscadorUsuarios').value.toLowerCase();
  const usuariosFiltrados = todosLosUsuarios.filter(u => 
    u.nombre.toLowerCase().includes(busqueda) || 
    u.username.toLowerCase().includes(busqueda)
  );
  mostrarUsuariosFiltrados(usuariosFiltrados);
}

async function abrirModalUsuarios() {
  await cargarUsuarios();
  document.getElementById('usuariosModal').classList.remove('hidden');
  document.getElementById('buscadorUsuarios').value = '';
}

function cerrarModalUsuarios() {
  document.getElementById('usuariosModal').classList.add('hidden');
}

async function cambiarRol(userId, nuevoRol) {
  if (!confirm('¿Cambiar el rol de este usuario?')) {
    await cargarUsuarios();
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/auth/usuarios/${userId}/rol`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ rol: nuevoRol })
    });
    
    if (response.ok) {
      alert('Rol actualizado');
      await cargarUsuarios();
    }
  } catch (error) {
    alert('Error actualizando rol');
  }
}

async function verHistorial() {
  if (!token) {
    alert('Debes iniciar sesión');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/estadisticas/historial`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.status === 403) {
      alert('No tienes permisos para ver el historial');
      return;
    }
    
    const historial = await response.json();
    mostrarHistorial(historial);
  } catch (error) {
    alert('Error cargando historial');
  }
}

function mostrarHistorial(historial) {
  const modal = document.getElementById('historialModal');
  const contenido = document.getElementById('historialContenido');
  
  if (historial.length === 0) {
    contenido.innerHTML = '<p class="text-gray-500 text-center py-8">No hay cambios registrados</p>';
  } else {
    contenido.innerHTML = historial.map(h => {
      const fecha = new Date(h.fecha).toLocaleString('es-MX');
      return `
        <div class="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 rounded">
          <p class="font-semibold text-gray-800">${h.jugadorNombre || 'Sistema'}</p>
          <p class="text-sm text-gray-600">
            ${h.campoModificado}${h.valorAnterior || h.valorNuevo ? `: ${h.valorAnterior} → ${h.valorNuevo}` : ''}
          </p>
          <p class="text-xs text-gray-500">
            Por: ${h.modificadoPor} | ${fecha}
          </p>
        </div>
      `;
    }).join('');
  }
  
  modal.classList.remove('hidden');
}

function cerrarHistorial() {
  document.getElementById('historialModal').classList.add('hidden');
}

async function eliminarJugador(id, nombre) {
  if (!token) {
    alert('Debes iniciar sesión para eliminar jugadores');
    return;
  }
  
  if (!confirm(`¿Estás seguro de eliminar a ${nombre} del período actual?`)) {
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/estadisticas/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.status === 403) {
      alert('No tienes permisos para eliminar jugadores');
      return;
    }
    
    if (response.ok) {
      alert('Jugador eliminado del período actual');
      await cargarEstadisticas();
    }
  } catch (error) {
    alert('Error eliminando jugador');
  }
}

window.onload = init;