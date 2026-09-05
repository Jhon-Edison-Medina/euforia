import React, { useEffect, useState } from 'react';
import {
  Box, VStack, Heading, Text, SimpleGrid, Card, CardBody, Button,
  HStack, Icon, Stat, StatLabel, StatNumber, StatHelpText,
  Table, Thead, Tbody, Tr, Th, Td, Badge, Spinner, Alert, AlertIcon
} from '@chakra-ui/react';
import { CalendarIcon, TimeIcon, DownloadIcon, ViewIcon } from '@chakra-ui/icons';
import { activitiesAPI, resourcesAPI, statsAPI } from '../../services/api';

const Estadisticas = () => {
  const [actividadesRecientes, setActividadesRecientes] = useState([]);
  const [recursosPopulares, setRecursosPopulares] = useState([]);
  const [stats, setStats] = useState({ anuncios: 0, actividades: 0, recursos: 0, visitas: 0 });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargarEstadisticas = async () => {
    try {
      const statsRes = await statsAPI.getDashboardStats();
      setStats(statsRes.data);
      console.log('📊 Estadísticas actualizadas:', statsRes.data);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      setError('No se pudieron cargar las estadísticas');
    }
  };

  const cargarDatosDashboard = async () => {
    setCargando(true);
    setError(null);
    try {
      console.log('🔄 Cargando datos del dashboard...');
      
      const [actividadesRes, recursosRes] = await Promise.all([
        activitiesAPI.getAllAdmin(),
        resourcesAPI.getAllAdmin()
      ]);

      console.log('📋 Actividades recibidas:', actividadesRes.data?.length || 0);
      console.log('📚 Recursos recibidos:', recursosRes.data?.length || 0);

      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      // Filtrar actividades futuras o en curso
      const actividadesFiltradas = (actividadesRes.data || []).filter(act => {
        if (!act.fecha) return false;
        const fechaAct = new Date(act.fecha);
        const esValida = !isNaN(fechaAct.getTime());
        const esFutura = fechaAct >= hoy;
        const estadoValido = act.estado === 'programada' || act.estado === 'en-curso';
        return esValida && esFutura && estadoValido;
      });

      console.log('🎯 Actividades próximas encontradas:', actividadesFiltradas.length);

      const actividadesOrdenadas = actividadesFiltradas
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
        .slice(0, 3);

      const recursosOrdenados = (recursosRes.data || [])
        .sort((a, b) => (b.visualizaciones || 0) - (a.visualizaciones || 0))
        .slice(0, 3);

      setActividadesRecientes(actividadesOrdenadas);
      setRecursosPopulares(recursosOrdenados);
      await cargarEstadisticas();
    } catch (error) {
      console.error('❌ Error cargando datos del dashboard:', error);
      setError('Error al cargar los datos. Revisa tu conexión o inicia sesión nuevamente.');
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarDatosDashboard();

    const handleAnunciosUpdate = () => {
      console.log('📢 Evento: anuncios actualizados');
      cargarEstadisticas();
    };
    const handleActividadesUpdate = () => {
      console.log('🎯 Evento: actividades actualizadas');
      cargarDatosDashboard();
    };
    const handleRecursosUpdate = () => {
      console.log('📚 Evento: recursos actualizados');
      cargarDatosDashboard();
    };

    window.addEventListener('euforia_anuncios_updated', handleAnunciosUpdate);
    window.addEventListener('euforia_activities_updated', handleActividadesUpdate);
    window.addEventListener('euforia_resources_updated', handleRecursosUpdate);

    return () => {
      window.removeEventListener('euforia_anuncios_updated', handleAnunciosUpdate);
      window.removeEventListener('euforia_activities_updated', handleActividadesUpdate);
      window.removeEventListener('euforia_resources_updated', handleRecursosUpdate);
    };
  }, []);

  const formatFecha = (fechaString) => {
    if (!fechaString) return 'Sin fecha';
    try {
      const fecha = new Date(fechaString);
      return fecha.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  const getEstadoColor = (estado) => {
    switch(estado) {
      case 'programada': return 'blue';
      case 'en-curso': return 'orange';
      case 'completada': return 'green';
      case 'publicado': return 'green';
      case 'borrador': return 'yellow';
      default: return 'gray';
    }
  };

  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        <Heading size="lg">📊 Dashboard de Administración</Heading>
        
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <Card bg="blue.50" border="1px solid" borderColor="blue.200">
            <CardBody textAlign="center">
              <Stat>
                <StatLabel color="blue.700" fontWeight="medium">
                  <Icon as={CalendarIcon} mr={2} />
                  Anuncios Activos
                </StatLabel>
                <StatNumber fontSize="3xl" color="blue.600">
                  {stats.anuncios}
                </StatNumber>
                <StatHelpText>
                  {stats.anuncios > 0 ? '📢 Publicando contenido' : 'Sin anuncios'}
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card bg="green.50" border="1px solid" borderColor="green.200">
            <CardBody textAlign="center">
              <Stat>
                <StatLabel color="green.700" fontWeight="medium">
                  <Icon as={TimeIcon} mr={2} />
                  Próximas Actividades
                </StatLabel>
                <StatNumber fontSize="3xl" color="green.600">
                  {stats.actividades}
                </StatNumber>
                <StatHelpText>
                  {stats.actividades > 0 ? '🎯 Programadas' : 'Sin actividades'}
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card bg="purple.50" border="1px solid" borderColor="purple.200">
            <CardBody textAlign="center">
              <Stat>
                <StatLabel color="purple.700" fontWeight="medium">
                  <Icon as={DownloadIcon} mr={2} />
                  Recursos Disponibles
                </StatLabel>
                <StatNumber fontSize="3xl" color="purple.600">
                  {stats.recursos}
                </StatNumber>
                <StatHelpText>
                  {stats.recursos > 0 ? '📚 Publicados' : 'Sin recursos'}
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card bg="orange.50" border="1px solid" borderColor="orange.200">
            <CardBody textAlign="center">
              <Stat>
                <StatLabel color="orange.700" fontWeight="medium">
                  <Icon as={ViewIcon} mr={2} />
                  Visitas del Mes
                </StatLabel>
                <StatNumber fontSize="3xl" color="orange.600">
                  {stats.visitas}
                </StatNumber>
                <StatHelpText>
                  ↗️ 12% más que el mes anterior
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          <Card>
            <CardBody>
              <Heading size="md" mb={4}>📅 Actividades Próximas</Heading>
              {cargando ? (
                <Box textAlign="center" py={4}>
                  <Spinner size="md" />
                  <Text mt={2}>Cargando...</Text>
                </Box>
              ) : actividadesRecientes.length > 0 ? (
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Fecha</Th>
                      <Th>Actividad</Th>
                      <Th>Estado</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {actividadesRecientes.map((actividad) => (
                      <Tr key={actividad.id || actividad._id}>
                        <Td>{formatFecha(actividad.fecha)}</Td>
                        <Td>
                          <Text fontWeight="medium" fontSize="sm">
                            {actividad.titulo}
                          </Text>
                        </Td>
                        <Td>
                          <Badge colorScheme={getEstadoColor(actividad.estado)}>
                            {actividad.estado}
                          </Badge>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              ) : (
                <Text color="gray.500">No hay actividades próximas. Crea una con fecha futura.</Text>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Heading size="md" mb={4}>⭐ Recursos Populares</Heading>
              {cargando ? (
                <Box textAlign="center" py={4}>
                  <Spinner size="md" />
                  <Text mt={2}>Cargando...</Text>
                </Box>
              ) : recursosPopulares.length > 0 ? (
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Recurso</Th>
                      <Th>Visualizaciones</Th>
                      <Th>Estado</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {recursosPopulares.map((recurso) => (
                      <Tr key={recurso.id || recurso._id}>
                        <Td>
                          <Text fontWeight="medium" fontSize="sm">
                            {recurso.titulo}
                          </Text>
                        </Td>
                        <Td>
                          <Text>{recurso.visualizaciones || 0}</Text>
                        </Td>
                        <Td>
                          <Badge colorScheme={getEstadoColor(recurso.estado)}>
                            {recurso.estado}
                          </Badge>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              ) : (
                <Text color="gray.500">No hay recursos publicados</Text>
              )}
            </CardBody>
          </Card>
        </SimpleGrid>

        <Card>
          <CardBody>
            <Heading size="md" mb={4}>⚡ Acciones Rápidas</Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <Button 
                colorScheme="blue" 
                w="100%" 
                onClick={() => window.location.hash = '#anuncios'}
              >
                📢 Crear Nuevo Anuncio
              </Button>
              <Button 
                colorScheme="green" 
                w="100%"
                onClick={() => window.location.hash = '#actividades'}
              >
                🎯 Programar Actividad
              </Button>
              <Button 
                colorScheme="purple" 
                w="100%"
                onClick={() => window.location.hash = '#recursos'}
              >
                📚 Subir Recurso
              </Button>
            </SimpleGrid>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};

export default Estadisticas;