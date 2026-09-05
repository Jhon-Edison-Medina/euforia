// Ejecuta esto en la consola del navegador cuando tengas problemas

function fixAuth() {
  console.log('🛠️ Reparando autenticación...');
  
  // 1. Limpiar todo
  localStorage.removeItem('euforia_token');
  localStorage.removeItem('euforia_user');
  
  // 2. Crear token temporal (solo para desarrollo)
  const tempToken = 'temp_token_' + Date.now();
  const tempUser = JSON.stringify({
    username: 'admin',
    role: 'admin',
    email: 'euforiacddhheducacion@gmail.com'
  });
  
  localStorage.setItem('euforia_token', tempToken);
  localStorage.setItem('euforia_user', tempUser);
  
  console.log('✅ Token temporal creado');
  console.log('🔄 Recargando página...');
  
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}

// También agrega un botón en la interfaz
const button = document.createElement('button');
button.textContent = '🔧 Reparar Sesión';
button.style.position = 'fixed';
button.style.bottom = '20px';
button.style.right = '20px';
button.style.zIndex = '9999';
button.style.padding = '10px';
button.style.background = '#f56565';
button.style.color = 'white';
button.style.border = 'none';
button.style.borderRadius = '5px';
button.style.cursor = 'pointer';

button.onclick = fixAuth;

document.body.appendChild(button);
console.log('🔧 Botón de reparación añadido');