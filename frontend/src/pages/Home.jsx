import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Button,
  Grid,
  GridItem,
  Card,
  CardBody,
  Badge,
  HStack,
  SimpleGrid,
  Spinner,
  Image,
  Flex,
  IconButton
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { announcementsAPI, activitiesAPI, resourcesAPI } from '../services/api';
import { optimizarUrlCloudinary } from '../services/cloudinary';

const Home = () => {
  const [featuredAnnouncements, setFeaturedAnnouncements] = useState([]);
  const [activities, setActivities] = useState([]);
  const [destacadasActividades, setDestacadasActividades] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Función mejorada para obtener la imagen principal de un anuncio
  const getImagenAnuncio = (anuncio) => {
    // 1. Prioridad: multimedia array
    if (anuncio.multimedia && Array.isArray(anuncio.multimedia) && anuncio.multimedia.length > 0) {
      // Buscar el primer elemento que sea imagen (preferiblemente)
      const primeraImagen = anuncio.multimedia.find(item => 
        item.tipo && (item.tipo.startsWith('image/') || item.tipo === 'image/gif')
      );
      if (primeraImagen) {
        return {
          url: optimizarUrlCloudinary(primeraImagen.url),
          tipo: primeraImagen.tipo,
          esVideo: false,
          esGif: primeraImagen.tipo === 'image/gif' || primeraImagen.tipo.includes('gif')
        };
      }
      // Si no hay imagen, tomar el primer elemento (puede ser video)
      const primero = anuncio.multimedia[0];
      return {
        url: optimizarUrlCloudinary(primero.url),
        tipo: primero.tipo,
        esVideo: primero.tipo.startsWith('video/'),
        esGif: primero.tipo === 'image/gif' || primero.tipo.includes('gif')
      };
    }

    // 2. Compatibilidad con anuncios antiguos (campo archivo)
    if (anuncio.archivo) {
      const esVideo = anuncio.tipoArchivo?.startsWith('video/') || anuncio.nombreArchivo?.match(/\.(mp4|avi|mov|wmv|webm|ogg)$/);
      const esGif = anuncio.tipoArchivo === 'image/gif' || anuncio.nombreArchivo?.endsWith('.gif');
      return {
        url: optimizarUrlCloudinary(anuncio.archivo),
        tipo: anuncio.tipoArchivo,
        esVideo,
        esGif
      };
    }

    // 3. Campo imagen (para compatibilidad muy antigua)
    if (anuncio.imagen) {
      return {
        url: optimizarUrlCloudinary(anuncio.imagen),
        tipo: 'image',
        esVideo: false,
        esGif: false
      };
    }

    return null;
  };

  // Función para obtener la primera imagen de una actividad (desde multimedia o materiales)
  const getImagenActividad = (actividad) => {
    // 1. Buscar en multimedia (campo actual)
    if (actividad.multimedia && Array.isArray(actividad.multimedia) && actividad.multimedia.length > 0) {
      const primeraImagen = actividad.multimedia.find(item => 
        item.tipo && (item.tipo.startsWith('image/') || item.tipo === 'image/gif')
      );
      if (primeraImagen) {
        return optimizarUrlCloudinary(primeraImagen.url); // o primeraImagen.thumbnail si existe
      }
      // Si no hay imagen, puede ser video, pero no mostramos video como miniatura
    }
    // 2. Buscar en materiales (legacy)
    if (actividad.materiales && Array.isArray(actividad.materiales) && actividad.materiales.length > 0) {
      const imagenMaterial = actividad.materiales.find(m =>
        m.tipo && m.tipo.startsWith('image/')
      );
      if (imagenMaterial && imagenMaterial.archivo) {
        return optimizarUrlCloudinary(imagenMaterial.archivo);
      }
    }
    // 3. Campos antiguos
    if (actividad.imagenUrl) return optimizarUrlCloudinary(actividad.imagenUrl);
    if (actividad.imagen) return optimizarUrlCloudinary(actividad.imagen);
    
    return null;
  };

  // Función para cargar todos los datos DESDE LA BASE DE DATOS
  const cargarTodosLosDatos = async () => {
    setLoading(true);
    try {
      console.log('📥 Cargando datos desde MongoDB...');
      
      const [anunciosResponse, actividadesResponse, recursosResponse] = await Promise.all([
        announcementsAPI.getAll(),
        activitiesAPI.getAll(),
        resourcesAPI.getAll()
      ]);
      const anuncios = anunciosResponse.data || [];
      const actividadesData = actividadesResponse.data || [];
      const recursosData = recursosResponse.data || [];
      
      // A. ANUNCIOS PARA CARRUSEL
      if (anuncios.length > 0) {
        const anunciosOrdenados = anuncios.sort((a, b) => {
          const fechaA = a.fecha ? new Date(a.fecha).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
          const fechaB = b.fecha ? new Date(b.fecha).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
          return fechaB - fechaA;
        });
        
        const anunciosRecientes = anunciosOrdenados.slice(0, 2);
        setFeaturedAnnouncements(anunciosRecientes);
        
        const anunciosParaActividades = anunciosOrdenados.slice(0, 3);
        setActivities(anunciosParaActividades);
      } else {
        setFeaturedAnnouncements([]);
        setActivities([]);
      }
      
      // B. ACTIVIDADES DESTACADAS
      if (actividadesData.length > 0) {
        // Filtrar actividades que estén programadas o en curso (para mostrar las próximas)
        const actividadesFiltradas = actividadesData.filter(act => 
          act.estado === 'planificado' || act.estado === 'en-curso' || act.estado === 'programada'
        );
        
        const actividadesOrdenadas = actividadesFiltradas.sort((a, b) => {
          const fechaA = a.fecha ? new Date(a.fecha).getTime() : 0;
          const fechaB = b.fecha ? new Date(b.fecha).getTime() : 0;
          return fechaA - fechaB;
        });
        
        const actividadesDestacadas = actividadesOrdenadas.slice(0, 3);
        
        // Ya no necesitamos mapear para agregar imagenUrl, lo haremos directamente en el render con getImagenActividad
        setDestacadasActividades(actividadesDestacadas);
      } else {
        setDestacadasActividades([]);
      }
      
      // C. RECURSOS RECIENTES
      if (recursosData.length > 0) {
        const recursosFiltrados = recursosData.filter(r => 
          r.estado === 'disponible' || r.estado === 'publicado'
        );
        
        const recursosOrdenados = recursosFiltrados.sort((a, b) => {
          const fechaA = a.createdAt ? new Date(a.createdAt).getTime() : (a.fecha ? new Date(a.fecha).getTime() : 0);
          const fechaB = b.createdAt ? new Date(b.createdAt).getTime() : (b.fecha ? new Date(b.fecha).getTime() : 0);
          return fechaB - fechaA;
        });
        
        const recursosRecientes = recursosOrdenados.slice(0, 3);
        setResources(recursosRecientes);
      } else {
        setResources([]);
      }
      
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      cargarDesdeLocalStorage();
    } finally {
      setLoading(false);
    }
  };
  
  // Función de fallback a localStorage
  const cargarDesdeLocalStorage = () => {
    console.log('⚠️ Usando datos de localStorage como respaldo...');
    
    try {
      const anunciosGuardados = localStorage.getItem('euforia_anuncios');
      if (anunciosGuardados) {
        const anuncios = JSON.parse(anunciosGuardados)
          .filter(ann => ann.estado === 'publicado')
          .sort((a, b) => {
            const fechaA = a.fecha ? new Date(a.fecha).getTime() : (parseInt(a.id) || 0);
            const fechaB = b.fecha ? new Date(b.fecha).getTime() : (parseInt(b.id) || 0);
            return fechaB - fechaA;
          });
        
        setFeaturedAnnouncements(anuncios.slice(0, 2));
        setActivities(anuncios.slice(0, 3));
      }
      
      const actividadesGuardadas = localStorage.getItem('euforia_activities');
      if (actividadesGuardadas) {
        const actividadesData = JSON.parse(actividadesGuardadas);
        const actividadesDestacadas = actividadesData
          .filter(act => (act.estado === 'programada' || act.estado === 'planificado') && act.titulo)
          .sort((a, b) => {
            const dateA = a.fecha ? new Date(a.fecha) : new Date(0);
            const dateB = b.fecha ? new Date(b.fecha) : new Date(0);
            return dateA - dateB;
          })
          .slice(0, 3);
        
        setDestacadasActividades(actividadesDestacadas);
      }
      
      const recursosGuardados = localStorage.getItem('euforia_resources');
      if (recursosGuardados) {
        const recursosData = JSON.parse(recursosGuardados);
        const recursosRecientes = recursosData
          .filter(r => r.estado === 'publicado' || r.estado === 'disponible')
          .sort((a, b) => {
            const dateA = a.creado ? new Date(a.creado) : new Date(parseInt(a.id) || 0);
            const dateB = b.creado ? new Date(b.creado) : new Date(parseInt(b.id) || 0);
            return dateB - dateA;
          })
          .slice(0, 3);
        
        setResources(recursosRecientes);
      }
      
    } catch (localError) {
      console.error('Error cargando desde localStorage:', localError);
      setFeaturedAnnouncements([]);
      setActivities([]);
      setDestacadasActividades([]);
      setResources([]);
    }
  };

  useEffect(() => {
    cargarTodosLosDatos();
    
    const handleUpdates = () => {
      console.log('🔄 Evento recibido, recargando datos...');
      cargarTodosLosDatos();
    };
    
    window.addEventListener('euforia_anuncios_updated', handleUpdates);
    window.addEventListener('euforia_activities_updated', handleUpdates);
    window.addEventListener('euforia_resources_updated', handleUpdates);
    
    return () => {
      window.removeEventListener('euforia_anuncios_updated', handleUpdates);
      window.removeEventListener('euforia_activities_updated', handleUpdates);
      window.removeEventListener('euforia_resources_updated', handleUpdates);
    };
  }, []);

  useEffect(() => {
    let interval;
    if (featuredAnnouncements.length > 1) {
      interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % featuredAnnouncements.length);
      }, 4000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [featuredAnnouncements.length, currentSlide]);

  const nextSlide = () => {
    if (featuredAnnouncements.length > 1) {
      setCurrentSlide((prev) => (prev + 1) % featuredAnnouncements.length);
    }
  };

  const prevSlide = () => {
    if (featuredAnnouncements.length > 1) {
      setCurrentSlide((prev) => (prev - 1 + featuredAnnouncements.length) % featuredAnnouncements.length);
    }
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'Próximamente';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Próximamente';
      return date.toLocaleDateString('es-ES', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Próximamente';
    }
  };

  const getResourceIcon = (tipo) => {
    switch(tipo) {
      case 'video': return '🎬';
      case 'audio': return '🎧';
      case 'enlace': return '🔗';
      case 'imagen': return '🖼️';
      default: return '📄';
    }
  };

  const getTipoActividad = (tipo) => {
    switch(tipo) {
      case 'taller': return '🎨 Taller';
      case 'charla': return '💬 Charla';
      case 'evento': return '🎉 Evento';
      case 'curso': return '📚 Curso';
      case 'reunión': return '👥 Reunión';
      case 'voluntariado': return '🤝 Voluntariado';
      default: return '🎯 Actividad';
    }
  };

  return (
    <Box>
      {/* Hero Section */}
      <Box 
        color="white" 
        py={{ base: 12, md: 20 }}
        position="relative"
        background="linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('/assets/Fondo.jpg')"
        backgroundSize="cover"
        backgroundPosition="center"
        backgroundRepeat="no-repeat"
      >
        <Container maxW="container.xl" position="relative" zIndex={1}>
          <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={10} alignItems="center">
            <GridItem>
              <VStack align="start" spacing={6}>
                <Heading as="h1" size={{ base: "xl", md: "2xl" }} fontFamily="heading" lineHeight="1.2">
                  CENTRO DE DERECHOS<br />HUMANOS Y EDUCACIÓN
                </Heading>
                <Text fontSize={{ base: "lg", md: "xl" }} opacity={0.9}>
                  Incentivamos el pensamiento crítico para el cambio social a través de 
                  la educación popular y la agricultura urbana en Soacha.
                </Text>
                <HStack spacing={4} flexWrap="wrap">
                  <Button 
                    as={Link} 
                    to="/actividades" 
                    size={{ base: "md", md: "lg" }}
                    colorScheme="white" 
                    variant="solid"
                  >
                    Ver Actividades
                  </Button>
                  <Button 
                    as={Link} 
                    to="/quienes-somos" 
                    size={{ base: "md", md: "lg" }}
                    variant="outline" 
                    color="white"
                    borderColor="white"
                    _hover={{ bg: 'white', color: 'brand.primary' }}
                  >
                    Conócenos
                  </Button>
                </HStack>
              </VStack>
            </GridItem>
            <GridItem>
              {/* CARRUSEL */}
              {loading ? (
                <Flex h="300px" align="center" justify="center">
                  <Spinner size="xl" color="white" />
                </Flex>
              ) : featuredAnnouncements.length > 0 ? (
                <Box position="relative" maxW="400px" mx="auto">
                  <Box
                    borderRadius="lg"
                    overflow="hidden"
                    boxShadow="2xl"
                    border="2px solid"
                    borderColor="white"
                    height="300px"
                    position="relative"
                    bg="black"
                  >
                    {featuredAnnouncements.map((announcement, index) => {
                      const imagenInfo = getImagenAnuncio(announcement);
                      const tieneImagen = imagenInfo && imagenInfo.url;
                      return (
                        <Box
                          key={announcement._id || announcement.id || index}
                          position="absolute"
                          top={0}
                          left={0}
                          width="100%"
                          height="100%"
                          opacity={index === currentSlide ? 1 : 0}
                          transition="opacity 0.5s ease-in-out"
                        >
                          {tieneImagen ? (
                            imagenInfo.esGif ? (
                              <img
                                src={imagenInfo.url}
                                alt={announcement.titulo}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'contain',
                                  backgroundColor: '#000'
                                }}
                              />
                            ) : imagenInfo.esVideo ? (
                              <Box
                                bg="black"
                                w="100%"
                                h="100%"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                              >
                                <video
                                  src={imagenInfo.url}
                                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                  muted
                                  loop
                                  onMouseEnter={e => e.target.play()}
                                  onMouseLeave={e => e.target.pause()}
                                />
                              </Box>
                            ) : (
                              <Image
                                src={imagenInfo.url}
                                alt={announcement.titulo}
                                w="100%"
                                h="100%"
                                objectFit="contain"
                                bg="black"
                              />
                            )
                          ) : (
                            <Box
                              bg="brand.primary"
                              w="100%"
                              h="100%"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              p={6}
                            >
                              <VStack spacing={4} color="white" textAlign="center">
                                <Text fontSize="2xl">📢</Text>
                                <Heading size="md">{announcement.titulo}</Heading>
                                <Text noOfLines={3}>{announcement.contenido}</Text>
                              </VStack>
                            </Box>
                          )}
                          
                          <Box
                            position="absolute"
                            bottom={0}
                            left={0}
                            right={0}
                            bg="linear-gradient(transparent, rgba(0,0,0,0.8))"
                            color="white"
                            p={4}
                          >
                            {imagenInfo?.esGif && (
                              <Badge colorScheme="green" mb={2} mr={2}>
                                🎬 GIF
                              </Badge>
                            )}
                            {imagenInfo?.esVideo && (
                              <Badge colorScheme="red" mb={2} mr={2}>
                                🎥 Video
                              </Badge>
                            )}
                            <Badge colorScheme="blue" mb={2}>
                              {announcement.categoria || 'Anuncio'}
                            </Badge>
                            <Heading size="sm" noOfLines={1}>
                              {announcement.titulo}
                            </Heading>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                  
                  {featuredAnnouncements.length > 1 && (
                    <>
                      <IconButton
                        icon={<ChevronLeftIcon />}
                        position="absolute"
                        left="-40px"
                        top="50%"
                        transform="translateY(-50%)"
                        onClick={prevSlide}
                        colorScheme="whiteAlpha"
                        aria-label="Anterior"
                      />
                      <IconButton
                        icon={<ChevronRightIcon />}
                        position="absolute"
                        right="-40px"
                        top="50%"
                        transform="translateY(-50%)"
                        onClick={nextSlide}
                        colorScheme="whiteAlpha"
                        aria-label="Siguiente"
                      />
                      
                      <HStack spacing={2} justify="center" mt={4}>
                        {featuredAnnouncements.map((_, index) => (
                          <Box
                            key={index}
                            w="10px"
                            h="10px"
                            borderRadius="full"
                            bg={index === currentSlide ? 'brand.accent2' : 'gray.300'}
                            onClick={() => setCurrentSlide(index)}
                            cursor="pointer"
                            _hover={{ bg: 'brand.accent2' }}
                          />
                        ))}
                      </HStack>
                    </>
                  )}
                </Box>
              ) : (
                <Image 
                  src="/assets/Anuncio 21-11-2025.png" 
                  alt="Centro Euforia"
                  w="100%"
                  maxW="400px"
                  mx="auto"
                  borderRadius="lg"
                  boxShadow="2xl"
                />
              )}
            </GridItem>
          </Grid>
        </Container>
      </Box>

      {/* Sección de Próximas Actividades (Anuncios) */}
      <Container maxW="container.xl" py={16}>
        <VStack spacing={8}>
          <Box textAlign="center">
            <Heading as="h2" size={{ base: "lg", md: "xl" }} color="brand.secondary" mb={4}>
              Entérate de todo lo que pasa en Euforia
            </Heading>
            <Text fontSize={{ base: "md", md: "lg" }} color="gray.600" maxW="2xl">
              Descubre nuestros anuncios, actividades y eventos en Soacha, y sé parte del cambio 💜✨
            </Text>
          </Box>

          {loading ? (
            <Spinner size="xl" color="brand.accent2" />
          ) : activities.length > 0 ? (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} w="100%">
              {activities.map((activity) => {
                const imagenInfo = getImagenAnuncio(activity);
                return (
                  <Card 
                    key={activity._id || activity.id}
                    boxShadow="lg" 
                    border="1px solid"
                    borderColor="brand.accent1"
                    _hover={{ transform: 'translateY(-4px)', boxShadow: 'xl' }}
                    transition="all 0.3s"
                  >
                    <CardBody p={0} overflow="hidden">
                      {imagenInfo ? (
                        imagenInfo.esGif ? (
                          <Box bg="gray.900" h="180px" display="flex" alignItems="center" justifyContent="center">
                            <img
                              src={imagenInfo.url}
                              alt={activity.titulo}
                              style={{
                                maxHeight: '180px',
                                maxWidth: '100%',
                                objectFit: 'contain'
                              }}
                            />
                          </Box>
                        ) : imagenInfo.esVideo ? (
                          <Box
                            h="180px"
                            w="100%"
                            bg="black"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <video
                              src={imagenInfo.url}
                              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                              muted
                              loop
                              onMouseEnter={e => e.target.play()}
                              onMouseLeave={e => e.target.pause()}
                            />
                          </Box>
                        ) : (
                          <Box bg="gray.900" h="180px" display="flex" alignItems="center" justifyContent="center">
                            <Image
                              src={imagenInfo.url}
                              alt={activity.titulo}
                              maxH="180px"
                              maxW="100%"
                              objectFit="contain"
                            />
                          </Box>
                        )
                      ) : (
                        <Box
                          h="180px"
                          w="100%"
                          bg="brand.primary"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Text fontSize="4xl" color="white">
                            {activity.categoria === 'Evento' ? '🎉' : 
                             activity.categoria === 'Educación' ? '📚' : '📢'}
                          </Text>
                        </Box>
                      )}
                      
                      <Box p={6}>
                        <HStack mb={3}>
                          {imagenInfo?.esGif && (
                            <Badge colorScheme="green" mr={2}>
                              GIF
                            </Badge>
                          )}
                          {imagenInfo?.esVideo && (
                            <Badge colorScheme="red" mr={2}>
                              Video
                            </Badge>
                          )}
                          <Badge
                            bg="brand.accent4"
                            color="white"
                            px={3}
                            py={1}
                            borderRadius="full"
                          >
                            {activity.categoria || 'Anuncio'}
                          </Badge>
                        </HStack>
                        
                        <Heading as="h3" size="md" mb={3} color="brand.secondary">
                          {activity.titulo}
                        </Heading>
                        
                        <Text color="gray.600" mb={4} noOfLines={3}>
                          {activity.contenido}
                        </Text>
                        
                        <VStack align="start" spacing={2} color="gray.600" mb={4}>
                          {activity.fechaEvento && (
                            <Text>📅 {formatDateForDisplay(activity.fechaEvento)}</Text>
                          )}
                          {activity.fecha && !activity.fechaEvento && (
                            <Text>📅 {formatDateForDisplay(activity.fecha)}</Text>
                          )}
                        </VStack>
                        
                        <Button
                          as={Link}
                          to="/anuncios"
                          colorScheme="brand"
                          variant="solid"
                          w="100%"
                          bg="brand.accent2"
                          _hover={{ bg: 'brand.accent5' }}
                        >
                          Más Información
                        </Button>
                      </Box>
                    </CardBody>
                  </Card>
                );
              })}
            </SimpleGrid>
          ) : (
            <Box textAlign="center" py={10}>
              <Text fontSize="lg" color="gray.500">
                No hay anuncios publicados en este momento.
              </Text>
              <Button as={Link} to="/contacto" mt={4} colorScheme="brand">
                Contáctanos para más información
              </Button>
            </Box>
          )}

          <Button 
            as={Link} 
            to="/anuncios" 
            size="lg" 
            colorScheme="brand" 
            variant="outline"
            borderColor="brand.accent2"
            color="brand.accent2"
          >
            Ver Todos los Anuncios
          </Button>
        </VStack>
      </Container>

      {/* Sección de Enfoques */}
      <Box bg="brand.accent1" py={16}>
        <Container maxW="container.xl">
          <VStack spacing={12}>
            <Box textAlign="center">
              <Heading as="h2" size={{ base: "lg", md: "xl" }} color="brand.secondary" mb={4}>
                Nuestros Enfoques
              </Heading>
            </Box>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} w="100%">
              {[
                {
                  title: 'Género y Feminismo',
                  description: 'Trabajando por el respeto hacia las mujeres y diversidades sexuales.',
                  icon: '⚧️',
                  color: 'brand.accent2'
                },
                {
                  title: 'Derechos Humanos',
                  description: 'Dignidad de las infancias y la juventud.',
                  icon: '👥',
                  color: 'brand.accent5'
                },
                {
                  title: 'Enfoque Ambiental',
                  description: 'Construcción de seguridad y soberanía alimentaria.',
                  icon: '🌱',
                  color: 'brand.accent4'
                }
              ].map((enfoque, index) => (
                <Card key={index} bg="white" boxShadow="xl" border="2px solid" borderColor={enfoque.color}>
                  <CardBody textAlign="center" p={8}>
                    <Text fontSize="4xl" mb={4}>{enfoque.icon}</Text>
                    <Heading as="h3" size="md" mb={4} color="brand.secondary">
                      {enfoque.title}
                    </Heading>
                    <Text color="gray.600">{enfoque.description}</Text>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* Sección de Actividades Destacadas */}
      <Container maxW="container.xl" py={16}>
        <VStack spacing={8}>
          <Box textAlign="center">
            <Heading as="h2" size={{ base: "lg", md: "xl" }} color="brand.secondary" mb={4}>
              🎯 Actividades Destacadas
            </Heading>
            <Text fontSize={{ base: "md", md: "lg" }} color="gray.600" maxW="2xl">
              Únete a nuestras próximas actividades y talleres comunitarios
            </Text>
          </Box>

          {loading ? (
            <Spinner size="xl" color="brand.accent2" />
          ) : destacadasActividades.length > 0 ? (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} w="100%">
              {destacadasActividades.map((actividad) => {
                const imagenActividad = getImagenActividad(actividad);
                return (
                  <Card 
                    key={actividad._id || actividad.id} 
                    border="1px solid" 
                    borderColor="brand.accent1" 
                    _hover={{ shadow: 'lg', transform: 'translateY(-4px)' }} 
                    transition="all 0.3s"
                    overflow="hidden"
                  >
                    <CardBody p={0}>
                      {imagenActividad ? (
                        <Box h="180px" w="100%" bg="gray.900" display="flex" alignItems="center" justifyContent="center">
                          <Image
                            src={imagenActividad}
                            alt={actividad.titulo}
                            maxH="180px"
                            maxW="100%"
                            objectFit="contain"
                            fallback={
                              <Flex w="100%" h="100%" align="center" justify="center" bg="brand.primary">
                                <Text fontSize="4xl" color="white">
                                  {actividad.tipo === 'taller' ? '🎨' :
                                   actividad.tipo === 'charla' ? '💬' :
                                   actividad.tipo === 'evento' ? '🎉' :
                                   actividad.tipo === 'curso' ? '📚' :
                                   actividad.tipo === 'reunión' ? '👥' :
                                   actividad.tipo === 'voluntariado' ? '🤝' : '🎯'}
                                </Text>
                              </Flex>
                            }
                          />
                        </Box>
                      ) : (
                        <Box
                          h="180px"
                          w="100%"
                          bg="brand.primary"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Text fontSize="4xl" color="white">
                            {actividad.tipo === 'taller' ? '🎨' :
                             actividad.tipo === 'charla' ? '💬' :
                             actividad.tipo === 'evento' ? '🎉' :
                             actividad.tipo === 'curso' ? '📚' :
                             actividad.tipo === 'reunión' ? '👥' :
                             actividad.tipo === 'voluntariado' ? '🤝' : '🎯'}
                          </Text>
                        </Box>
                      )}
                      
                      <Box p={6}>
                        <Badge colorScheme="blue" mb={3}>
                          {getTipoActividad(actividad.tipo)}
                        </Badge>
                        <Heading size="md" mb={2}>{actividad.titulo}</Heading>
                        <Text color="gray.600" mb={4} noOfLines={3}>
                          {actividad.descripcion || actividad.contenido || 'Actividad comunitaria'}
                        </Text>
                        
                        <VStack align="start" spacing={1} fontSize="sm" color="gray.600" mb={4}>
                          {actividad.fecha && (
                            <Text>📅 {formatDateForDisplay(actividad.fecha)}</Text>
                          )}
                          {actividad.hora && (
                            <Text>🕒 {actividad.hora}</Text>
                          )}
                          {actividad.ubicacion && (
                            <Text>📍 {actividad.ubicacion}</Text>
                          )}
                        </VStack>
                        
                        <Button
                          as={Link}
                          to="/actividades"
                          colorScheme="brand"
                          variant="outline"
                          size="sm"
                          w="100%"
                        >
                          Ver más actividades
                        </Button>
                      </Box>
                    </CardBody>
                  </Card>
                );
              })}
            </SimpleGrid>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} w="100%">
              {[1, 2, 3].map((index) => (
                <Card key={index} border="1px solid" borderColor="brand.accent1" _hover={{ shadow: 'lg' }}>
                  <CardBody>
                    <Badge colorScheme="blue" mb={3}>Próximamente</Badge>
                    <Heading size="md" mb={2}>Actividad {index}</Heading>
                    <Text color="gray.600" mb={4}>
                      Descripción breve de la actividad con detalles importantes.
                    </Text>
                    <Button
                      as={Link}
                      to="/actividades"
                      colorScheme="brand"
                      variant="outline"
                      size="sm"
                      w="100%"
                    >
                      Ver más actividades
                    </Button>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          )}

          <Button 
            as={Link} 
            to="/actividades" 
            size="lg" 
            colorScheme="brand" 
            variant="outline"
            borderColor="brand.accent2"
            color="brand.accent2"
          >
            Ver Todas las Actividades
          </Button>
        </VStack>
      </Container>

      {/* Sección de Recursos Recientes */}
      <Box bg="brand.accent1" py={16}>
        <Container maxW="container.xl">
          <VStack spacing={8}>
            <Box textAlign="center">
              <Heading as="h2" size={{ base: "lg", md: "xl" }} color="brand.secondary" mb={4}>
                📚 Recursos Recientes
              </Heading>
              <Text fontSize={{ base: "md", md: "lg" }} color="gray.600" maxW="2xl">
                Materiales educativos y documentos para descargar y compartir
              </Text>
            </Box>

            {loading ? (
              <Spinner size="xl" color="brand.accent2" />
            ) : resources.length > 0 ? (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} w="100%">
                {resources.map((recurso) => (
                  <Card key={recurso._id || recurso.id} bg="white" shadow="lg">
                    <CardBody textAlign="center">
                      <Text fontSize="3xl" mb={3}>
                        {getResourceIcon(recurso.tipo)}
                      </Text>
                      
                      <Badge colorScheme="purple" mb={3}>
                        {recurso.categoria || 'Recurso'}
                      </Badge>
                      
                      <Heading as="h3" size="md" mb={3}>
                        {recurso.titulo}
                      </Heading>
                      
                      <Text color="gray.600" mb={4} noOfLines={3}>
                        {recurso.descripcion}
                      </Text>
                      
                      <Button
                        as={Link}
                        to="/recursos"
                        colorScheme="brand"
                        variant="solid"
                        size="sm"
                        w="100%"
                        bg="brand.accent2"
                        _hover={{ bg: 'brand.accent5' }}
                      >
                        Ver Recurso
                      </Button>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} w="100%">
                {[1, 2, 3].map((index) => (
                  <Card key={index} bg="white" shadow="lg">
                    <CardBody textAlign="center">
                      <Text fontSize="3xl" mb={3}>📄</Text>
                      <Heading as="h3" size="md" mb={3}>
                        Recurso {index}
                      </Heading>
                      <Text color="gray.600" mb={4}>
                        Descripción breve del recurso educativo.
                      </Text>
                      <Button
                        as={Link}
                        to="/recursos"
                        colorScheme="brand"
                        variant="solid"
                        size="sm"
                        w="100%"
                        bg="brand.accent2"
                        _hover={{ bg: 'brand.accent5' }}
                      >
                        Ver Recurso
                      </Button>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            )}

            <Button 
              as={Link} 
              to="/recursos" 
              size="lg" 
              variant="outline" 
              color="white"
              borderColor="white"
              _hover={{ bg: 'white', color: 'brand.primary' }}
            >
              Ver Todos los Recursos
            </Button>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;