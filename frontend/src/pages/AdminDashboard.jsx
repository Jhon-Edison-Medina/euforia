import React, { useState, useEffect } from 'react';
import {
  Box, Container, Grid, GridItem, VStack, Heading, Text,
  Card, CardBody, Button, SimpleGrid, Badge, HStack,
  Alert, AlertIcon, Spinner
} from '@chakra-ui/react';

// Importa los componentes de cada módulo
import GestionAnuncios from '../components/admin/GestionAnuncios';
import GestionActividades from '../components/admin/GestionActividades';
import GestionRecursos from '../components/admin/GestionRecursos';
import Estadisticas from '../components/admin/Estadisticas';
import { announcementsAPI, activitiesAPI, resourcesAPI, authAPI } from '../services/api';

const AdminDashboard = () => {
  const [moduloActivo, setModuloActivo] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState({
    anuncios: 0,
    actividades: 0,
    recursos: 0,
    visitas: 156
  });

  // Verificar autenticación al cargar
  useEffect(() => {
    const token = localStorage.getItem('euforia_token');
    if (token) {
      setIsAuthenticated(true);
      cargarEstadisticas();
    }
  }, []);

  const cargarEstadisticas = async () => {
    try {
      // Usar Promise.all para cargar todas las estadísticas simultáneamente
      const [anunciosRes, actividadesRes, recursosRes] = await Promise.all([
        announcementsAPI.getAllAdmin(),
        activitiesAPI.getAllAdmin(),
        resourcesAPI.getAllAdmin()
      ]);

      // Calcular estadísticas
      const anunciosPublicados = anunciosRes.data.filter(ann => 
        ann.estado === 'publicado'
      ).length;

      const actividadesProximas = actividadesRes.data.filter(act => {
        if (act.estado !== 'programada') return false;
        if (act.fecha) {
          const fechaAct = new Date(act.fecha);
          const hoy = new Date();
          return fechaAct >= hoy;
        }
        return true;
      }).length;

      const recursosPublicados = recursosRes.data.filter(rec => 
        rec.estado === 'publicado'
      ).length;

      setStats({
        anuncios: anunciosPublicados,
        actividades: actividadesProximas,
        recursos: recursosPublicados,
        visitas: 156
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      // Estadísticas por defecto
      setStats({
        anuncios: 0,
        actividades: 0,
        recursos: 0,
        visitas: 156
      });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      const response = await authAPI.login(loginData);
      localStorage.setItem('euforia_token', response.data.token);
      setIsAuthenticated(true);
      cargarEstadisticas();
      setMessage('✅ ¡Bienvenido al panel de administración!');
    } catch (error) {
      setMessage('❌ ' + (error.response?.data?.message || 'Usuario o contraseña incorrectos'));
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('euforia_token');
    setIsAuthenticated(false);
    setLoginData({ username: '', password: '' });
    setMessage('✅ Sesión cerrada correctamente');
  };

  // PANTALLA DE LOGIN
  if (!isAuthenticated) {
    return (
      <Container maxW="container.md" py={20}>
        <VStack spacing={8}>
          <VStack textAlign="center" spacing={4}>
            <Heading as="h1" size="2xl" color="brand.primary">
              🛠️ Panel de Administración
            </Heading>
            <Text fontSize="xl" color="gray.600">
              Centro de Derechos Humanos y Educación - Euforia
            </Text>
          </VStack>
          
          <Card w="100%" maxW="400px" boxShadow="xl">
            <CardBody>
              {message && (
                <Alert status={message.includes('❌') ? 'error' : 'success'} mb={4} borderRadius="md">
                  <AlertIcon />
                  {message}
                </Alert>
              )}
              
              <form onSubmit={handleLogin}>
                <VStack spacing={4}>
                  <Box w="100%">
                    <Text fontWeight="bold" mb={2}>Usuario</Text>
                    <input
                      value={loginData.username}
                      onChange={(e) => setLoginData(prev => ({...prev, username: e.target.value}))}
                      placeholder="admin"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #E2E8F0',
                        borderRadius: '8px',
                        fontSize: '16px'
                      }}
                    />
                  </Box>
                  
                  <Box w="100%">
                    <Text fontWeight="bold" mb={2}>Contraseña</Text>
                    <input
                      type="password"
                      value={loginData.password}
                      onChange={(e) => setLoginData(prev => ({...prev, password: e.target.value}))}
                      placeholder="euforia2024"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #E2E8F0',
                        borderRadius: '8px',
                        fontSize: '16px'
                      }}
                    />
                  </Box>
                  
                  <Button
                    type="submit"
                    colorScheme="blue"
                    size="lg"
                    w="100%"
                    isLoading={loading}
                    loadingText="Iniciando sesión..."
                    bg="brand.accent2"
                    _hover={{ bg: 'brand.accent5' }}
                  >
                    🚀 Iniciar Sesión
                  </Button>
                </VStack>
              </form>
              
              <Box mt={6} p={4} bg="blue.50" borderRadius="md">
                <Text fontSize="sm" color="blue.700" textAlign="center">
                  <strong>Credenciales de prueba:</strong><br/>
                  Usuario: <strong>admin</strong><br/>
                  Contraseña: <strong>euforia2024</strong>
                </Text>
              </Box>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    );
  }

  // PANTALLA PRINCIPAL DE ADMINISTRACIÓN
  return (
    <Container maxW="100%" p={0} minH="100vh">
      <Grid templateColumns="280px 1fr" minH="100vh">
        
        {/* SIDEBAR */}
        <GridItem bg="gray.50" borderRight="1px" borderColor="gray.200">
          <VStack spacing={0} align="stretch">
            {/* Header del Sidebar */}
            <Box p={6} borderBottom="1px" borderColor="gray.200" bg="brand.primary">
              <VStack spacing={2} align="start">
                <Heading size="md" color="white">
                  🛠️ Euforia Admin
                </Heading>
                <Text fontSize="sm" color="brand.accent1">
                  Centro de Derechos Humanos
                </Text>
              </VStack>
            </Box>

            {/* Menú de Navegación */}
            <VStack spacing={1} p={4} align="stretch">
              <NavItem 
                icon="📊" 
                label="Dashboard" 
                active={moduloActivo === 'dashboard'}
                onClick={() => setModuloActivo('dashboard')}
              />
              <NavItem 
                icon="📢" 
                label="Gestión de Anuncios" 
                active={moduloActivo === 'anuncios'}
                onClick={() => setModuloActivo('anuncios')}
                badge={stats.anuncios}
              />
              <NavItem 
                icon="🎯" 
                label="Actividades" 
                active={moduloActivo === 'actividades'}
                onClick={() => setModuloActivo('actividades')}
                badge={stats.actividades}
              />
              <NavItem 
                icon="📚" 
                label="Recursos" 
                active={moduloActivo === 'recursos'}
                onClick={() => setModuloActivo('recursos')}
                badge={stats.recursos}
              />
              
              <Box pt={4}>
                <Button
                  onClick={handleLogout}
                  colorScheme="red"
                  variant="outline"
                  size="sm"
                  w="100%"
                >
                  Cerrar Sesión
                </Button>
              </Box>
            </VStack>
          </VStack>
        </GridItem>

        {/* CONTENIDO PRINCIPAL */}
        <GridItem bg="white" p={6}>
          {message && (
            <Alert status={message.includes('❌') ? 'error' : 'success'} mb={6} borderRadius="md">
              <AlertIcon />
              {message}
            </Alert>
          )}

          {/* Renderizar módulo activo */}
          {moduloActivo === 'dashboard' && <Estadisticas stats={stats} />}
          {moduloActivo === 'anuncios' && <GestionAnuncios onUpdate={cargarEstadisticas} />}
          {moduloActivo === 'actividades' && <GestionActividades onUpdate={cargarEstadisticas} />}
          {moduloActivo === 'recursos' && <GestionRecursos onUpdate={cargarEstadisticas} />}
        </GridItem>
      </Grid>
    </Container>
  );
};

// Componente de ítem del menú
const NavItem = ({ icon, label, active, onClick, badge }) => (
  <Box
    p={3}
    borderRadius="md"
    bg={active ? 'white' : 'transparent'}
    color={active ? 'brand.primary' : 'gray.700'}
    cursor="pointer"
    border={active ? '1px solid' : '1px solid transparent'}
    borderColor={active ? 'gray.200' : 'transparent'}
    boxShadow={active ? 'sm' : 'none'}
    _hover={{ 
      bg: active ? 'white' : 'gray.100',
      transform: 'translateX(2px)'
    }}
    transition="all 0.2s"
    onClick={onClick}
    position="relative"
  >
    <HStack spacing={3}>
      <Text fontSize="lg">{icon}</Text>
      <Text fontWeight="medium">{label}</Text>
      {badge !== undefined && badge > 0 && (
        <Badge colorScheme="blue" borderRadius="full" px={2}>
          {badge}
        </Badge>
      )}
    </HStack>
  </Box>
);

export default AdminDashboard;