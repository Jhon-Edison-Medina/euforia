import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  Card,
  CardBody,
  Badge,
  Image,
  Button,
  HStack,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  IconButton,
  Flex,
  AspectRatio,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Stack,
  Skeleton,
  useToast,
  Icon,
} from '@chakra-ui/react';
import {
  SearchIcon,
  CloseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  TimeIcon,
} from '@chakra-ui/icons';
import {
  FaImages,
  FaVideo,
  FaFileImage,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFilePowerpoint,
  FaFileAlt,
  FaFileAudio,
  FaFileArchive,
  FaFileCode,
} from 'react-icons/fa';
import { activitiesAPI } from '../services/api';
import { optimizarUrlCloudinary } from '../services/cloudinary';
import { Link } from 'react-router-dom';

const ITEMS_PER_PAGE = 9;

// Función auxiliar para obtener el icono según el tipo de archivo
const getFileIcon = (tipo, nombre) => {
  if (!tipo && !nombre) return FaFileAlt;
  
  const lowerName = nombre?.toLowerCase() || '';
  const lowerTipo = tipo?.toLowerCase() || '';

  if (lowerTipo.startsWith('image/')) return FaFileImage;
  if (lowerTipo.startsWith('video/')) return FaVideo;
  if (lowerTipo.startsWith('audio/')) return FaFileAudio;

  if (lowerName.endsWith('.pdf')) return FaFilePdf;
  if (lowerName.endsWith('.doc') || lowerName.endsWith('.docx')) return FaFileWord;
  if (lowerName.endsWith('.xls') || lowerName.endsWith('.xlsx')) return FaFileExcel;
  if (lowerName.endsWith('.ppt') || lowerName.endsWith('.pptx')) return FaFilePowerpoint;
  if (lowerName.endsWith('.zip') || lowerName.endsWith('.rar') || lowerName.endsWith('.7z')) return FaFileArchive;
  if (lowerName.endsWith('.js') || lowerName.endsWith('.html') || lowerName.endsWith('.css') || lowerName.endsWith('.json')) return FaFileCode;

  if (lowerTipo.includes('pdf')) return FaFilePdf;
  if (lowerTipo.includes('word') || lowerTipo.includes('document')) return FaFileWord;
  if (lowerTipo.includes('excel') || lowerTipo.includes('spreadsheet')) return FaFileExcel;
  if (lowerTipo.includes('powerpoint') || lowerTipo.includes('presentation')) return FaFilePowerpoint;
  if (lowerTipo.includes('zip') || lowerTipo.includes('compressed')) return FaFileArchive;

  return FaFileAlt;
};

const Actividades = () => {
  const [allActividades, setAllActividades] = useState([]);
  const [filteredActividades, setFilteredActividades] = useState([]);
  const [displayedActividades, setDisplayedActividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedActividad, setSelectedActividad] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todas');
  const [typeFilter, setTypeFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  const toast = useToast();
  const observerRef = useRef();

  const categorias = [
    { value: 'todas', label: 'Todas las categorías' },
    { value: 'educacion', label: '📚 Educación' },
    { value: 'derechos', label: '⚖️ Derechos Humanos' },
    { value: 'genero', label: '♀️ Género' },
    { value: 'comunidad', label: '👥 Comunidad' },
    { value: 'salud', label: '🏥 Salud' },
    { value: 'cultural', label: '🎭 Cultural' },
  ];

  const tipos = [
    { value: 'todos', label: 'Todos los tipos' },
    { value: 'taller', label: '🎨 Taller' },
    { value: 'charla', label: '💬 Charla' },
    { value: 'evento', label: '🎉 Evento' },
    { value: 'curso', label: '📚 Curso' },
    { value: 'reunion', label: '👥 Reunión' },
  ];

  const estados = [
    { value: 'todos', label: 'Todos los estados' },
    { value: 'programada', label: '📅 Programada' },
    { value: 'en-curso', label: '⏳ En curso' },
    { value: 'completada', label: '✅ Completada' },
    { value: 'cancelada', label: '❌ Cancelada' },
  ];

  const cargarActividades = async () => {
    setLoading(true);
    try {
      console.log('🔄 Cargando actividades desde API...');
      const response = await activitiesAPI.getAll();
      console.log('✅ Respuesta de activitiesAPI.getAll():', response);
      const data = response.data || [];
      console.log('📊 Datos recibidos:', data);
      setAllActividades(data);
      setFilteredActividades(data);
      setPage(1);
      setHasMore(data.length > ITEMS_PER_PAGE);
    } catch (error) {
      console.error('❌ Error cargando actividades:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las actividades',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarActividades();
    const handleUpdate = () => cargarActividades();
    window.addEventListener('euforia_activities_updated', handleUpdate);
    return () => window.removeEventListener('euforia_activities_updated', handleUpdate);
  }, []);

  // Aplicar filtros combinados (búsqueda, categoría, tipo, estado)
  useEffect(() => {
    let result = allActividades;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(a =>
        a.titulo?.toLowerCase().includes(term) ||
        a.descripcion?.toLowerCase().includes(term)
      );
    }
    if (categoryFilter !== 'todas') {
      result = result.filter(a => a.categoria === categoryFilter);
    }
    if (typeFilter !== 'todos') {
      result = result.filter(a => a.tipo === typeFilter);
    }
    if (statusFilter !== 'todos') {
      result = result.filter(a => a.estado === statusFilter);
    }
    console.log('🔍 Resultado después de filtros:', { searchTerm, categoryFilter, typeFilter, statusFilter, count: result.length });
    setFilteredActividades(result);
    setPage(1);
    setHasMore(result.length > ITEMS_PER_PAGE);
  }, [searchTerm, categoryFilter, typeFilter, statusFilter, allActividades]);

  useEffect(() => {
    const start = 0;
    const end = page * ITEMS_PER_PAGE;
    setDisplayedActividades(filteredActividades.slice(start, end));
    setHasMore(end < filteredActividades.length);
  }, [filteredActividades, page]);

  const lastElementRef = useCallback(node => {
    if (loadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1);
      }
    });
    if (node) observerRef.current.observe(node);
  }, [loadingMore, hasMore]);

  useEffect(() => {
    if (page > 1) {
      setLoadingMore(true);
      setTimeout(() => setLoadingMore(false), 300);
    }
  }, [page]);

  const getPrimerArchivo = (actividad) => {
    if (actividad.multimedia && actividad.multimedia.length > 0) {
      const primero = actividad.multimedia[0];
      return {
        url: optimizarUrlCloudinary(primero.url),
        tipo: primero.tipo,
        thumbnail: optimizarUrlCloudinary(primero.thumbnail || primero.url, 400),
        nombre: primero.nombre,
        count: actividad.multimedia.length,
      };
    }
    if (actividad.materiales && actividad.materiales.length > 0) {
      const primero = actividad.materiales[0];
      return {
        url: optimizarUrlCloudinary(primero.archivo || primero.url),
        tipo: primero.tipo || primero.tipoArchivo || 'image',
        thumbnail: optimizarUrlCloudinary(primero.thumbnail || primero.archivo || primero.url, 400),
        nombre: primero.nombre,
        count: actividad.materiales.length,
      };
    }
    return null;
  };

  const formatFecha = (fechaString) => {
    if (!fechaString) return 'Fecha por confirmar';
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getEstadoColor = (estado) => {
    switch(estado) {
      case 'programada': return 'blue';
      case 'en-curso': return 'orange';
      case 'completada': return 'green';
      case 'cancelada': return 'red';
      default: return 'gray';
    }
  };

  const getEstadoLabel = (estado) => {
    switch(estado) {
      case 'programada': return '📅 Programada';
      case 'en-curso': return '⏳ En curso';
      case 'completada': return '✅ Completada';
      case 'cancelada': return '❌ Cancelada';
      default: return estado;
    }
  };

  const handleOpenModal = (actividad) => {
    setSelectedActividad(actividad);
    setCurrentMediaIndex(0);
    onOpen();
  };

  const nextMedia = () => {
    if (selectedActividad) {
      const multimedia = selectedActividad.multimedia || selectedActividad.materiales || [];
      setCurrentMediaIndex(prev => (prev + 1) % multimedia.length);
    }
  };

  const prevMedia = () => {
    if (selectedActividad) {
      const multimedia = selectedActividad.multimedia || selectedActividad.materiales || [];
      setCurrentMediaIndex(prev => (prev - 1 + multimedia.length) % multimedia.length);
    }
  };

  const renderThumbnail = (actividad) => {
    const info = getPrimerArchivo(actividad);
    if (!info) {
      return (
        <Flex h="200px" bg="brand.primary" align="center" justify="center" direction="column" p={4}>
          <Text fontSize="5xl" mb={2}>
            {actividad.tipo === 'taller' ? '🎨' :
             actividad.tipo === 'charla' ? '💬' :
             actividad.tipo === 'evento' ? '🎉' :
             actividad.tipo === 'curso' ? '📚' :
             actividad.tipo === 'reunion' ? '👥' : '📅'}
          </Text>
          <Text fontSize="sm" color="white" textAlign="center">{actividad.categoria || 'Actividad'}</Text>
        </Flex>
      );
    }

    const esImagen = info.tipo?.startsWith('image/');
    const esVideo = info.tipo?.startsWith('video/');
    const esGif = info.tipo === 'image/gif' || info.tipo?.includes('gif');

    return (
      <Box position="relative" h="200px" bg="gray.100" overflow="hidden">
        {esVideo ? (
          <video
            src={info.url}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            muted
            loop
            onMouseEnter={e => e.target.play()}
            onMouseLeave={e => e.target.pause()}
          />
        ) : esGif ? (
          <img
            src={info.url}
            alt={actividad.titulo}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : esImagen ? (
          <Image
            src={info.thumbnail || info.url}
            alt={actividad.titulo}
            w="100%"
            h="100%"
            objectFit="cover"
            loading="lazy"
          />
        ) : (
          <Flex w="100%" h="100%" align="center" justify="center" bg="brand.primary">
            <Icon as={getFileIcon(info.tipo, info.nombre)} boxSize={16} color="white" />
          </Flex>
        )}
        {info.count > 1 && (
          <Badge position="absolute" top={2} right={2} colorScheme="blue" fontSize="sm" px={2} py={1} borderRadius="full">
            <HStack spacing={1}>
              <Icon as={FaImages} />
              <Text>{info.count}</Text>
            </HStack>
          </Badge>
        )}
        {esVideo && (
          <Badge position="absolute" top={2} left={2} colorScheme="red" fontSize="sm" px={2} py={1} borderRadius="full">
            🎬 Video
          </Badge>
        )}
        {esGif && (
          <Badge position="absolute" top={2} left={2} colorScheme="green" fontSize="sm" px={2} py={1} borderRadius="full">
            GIF
          </Badge>
        )}
      </Box>
    );
  };

  const renderModal = () => {
    if (!selectedActividad) return null;

    const multimedia = selectedActividad.multimedia && selectedActividad.multimedia.length > 0
      ? selectedActividad.multimedia
      : selectedActividad.materiales && selectedActividad.materiales.length > 0
        ? selectedActividad.materiales.map(m => ({ url: m.archivo || m.url, tipo: m.tipo || m.tipoArchivo, nombre: m.nombre }))
        : [];
    const currentMedia = multimedia[currentMediaIndex];
    const totalMedia = multimedia.length;

    return (
      <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent borderRadius="2xl" overflow="hidden">
          <ModalHeader bg="brand.primary" color="white" py={4}>
            <HStack justify="space-between">
              <Heading size="lg" noOfLines={1}>{selectedActividad.titulo}</Heading>
              <IconButton
                icon={<CloseIcon />}
                onClick={onClose}
                variant="ghost"
                color="white"
                _hover={{ bg: 'whiteAlpha.300' }}
                aria-label="Cerrar"
              />
            </HStack>
          </ModalHeader>
          <ModalCloseButton display="none" />

          <ModalBody p={6}>
            <VStack spacing={6} align="stretch">
              {/* Área multimedia */}
              {multimedia.length > 0 && (
                <Box>
                  <Box
                    borderRadius="xl"
                    overflow="hidden"
                    border="1px solid"
                    borderColor="gray.200"
                    bg="gray.100"
                    position="relative"
                  >
                    {currentMedia.tipo?.startsWith('video/') ? (
                      <AspectRatio ratio={16 / 9}>
                        <video
                          src={currentMedia.url}
                          controls
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      </AspectRatio>
                    ) : currentMedia.tipo?.startsWith('image/') ? (
                      <Image
                        src={currentMedia.url}
                        alt={`archivo-${currentMediaIndex}`}
                        maxH="60vh"
                        w="100%"
                        objectFit="contain"
                        fallback={
                          <Flex align="center" justify="center" h="400px">
                            <Spinner size="xl" />
                          </Flex>
                        }
                      />
                    ) : (
                      <Flex align="center" justify="center" h="400px" bg="gray.100">
                        <Icon as={getFileIcon(currentMedia.tipo, currentMedia.nombre)} boxSize={16} color="gray.400" />
                      </Flex>
                    )}
                    {totalMedia > 1 && (
                      <>
                        <IconButton
                          icon={<ChevronLeftIcon />}
                          position="absolute"
                          left={2}
                          top="50%"
                          transform="translateY(-50%)"
                          onClick={prevMedia}
                          colorScheme="whiteAlpha"
                          aria-label="Anterior"
                          zIndex={2}
                        />
                        <IconButton
                          icon={<ChevronRightIcon />}
                          position="absolute"
                          right={2}
                          top="50%"
                          transform="translateY(-50%)"
                          onClick={nextMedia}
                          colorScheme="whiteAlpha"
                          aria-label="Siguiente"
                          zIndex={2}
                        />
                      </>
                    )}
                  </Box>
                  {totalMedia > 1 && (
                    <HStack spacing={2} justify="center" mt={2}>
                      {multimedia.map((_, idx) => (
                        <Box
                          key={idx}
                          w="8px"
                          h="8px"
                          borderRadius="full"
                          bg={idx === currentMediaIndex ? 'brand.accent2' : 'gray.300'}
                          onClick={() => setCurrentMediaIndex(idx)}
                          cursor="pointer"
                        />
                      ))}
                    </HStack>
                  )}
                </Box>
              )}

              {/* Información de la actividad */}
              <Box>
                <HStack spacing={4} mb={4} wrap="wrap">
                  <Badge colorScheme="purple" fontSize="md" px={3} py={1}>
                    {categorias.find(c => c.value === selectedActividad.categoria)?.label || selectedActividad.categoria}
                  </Badge>
                  <Badge colorScheme="green" fontSize="md" px={3} py={1}>
                    {tipos.find(t => t.value === selectedActividad.tipo)?.label || selectedActividad.tipo}
                  </Badge>
                  <Badge colorScheme={getEstadoColor(selectedActividad.estado)} fontSize="md" px={3} py={1}>
                    {getEstadoLabel(selectedActividad.estado)}
                  </Badge>
                </HStack>

                <VStack align="start" spacing={2} fontSize="md" color="gray.600" mb={4}>
                  {selectedActividad.fecha && (
                    <Text><CalendarIcon mr={2} /> {formatFecha(selectedActividad.fecha)}</Text>
                  )}
                  {selectedActividad.hora && (
                    <Text><TimeIcon mr={2} /> {selectedActividad.hora}</Text>
                  )}
                  {selectedActividad.ubicacion && (
                    <Text>📍 {selectedActividad.ubicacion}</Text>
                  )}
                  {selectedActividad.cupo && (
                    <Text>👥 Cupo: {selectedActividad.cupo} personas</Text>
                  )}
                  {selectedActividad.duracion && (
                    <Text>⏱️ Duración: {selectedActividad.duracion} horas</Text>
                  )}
                </VStack>

                <Text fontSize="lg" lineHeight="tall" mt={4} whiteSpace="pre-wrap">
                  {selectedActividad.descripcion}
                </Text>

              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter bg="gray.50" borderTop="1px solid" borderColor="gray.200">
            <Button colorScheme="brand" onClick={onClose}>
              Cerrar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  };

  return (
    <Container maxW="container.xl" py={12}>
      <VStack spacing={10}>
        <Box textAlign="center">
          <Heading
            as="h1"
            size="2xl"
            mb={4}
            bgGradient="linear(to-r, brand.primary, brand.accent2)"
            bgClip="text"
          >
            🎯 Nuestras Actividades
          </Heading>
          <Text fontSize="lg" color="gray.600" maxW="3xl" mx="auto">
            Conoce y participa en nuestras actividades comunitarias, educativas y culturales en Soacha
          </Text>
        </Box>

        <Stack direction={{ base: 'column', md: 'row' }} w="100%" spacing={4} flexWrap="wrap">
          <InputGroup flex={2} minW="200px">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Buscar por título o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              borderRadius="full"
            />
          </InputGroup>
          <Select
            flex={1}
            minW="150px"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            borderRadius="full"
          >
            {categorias.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </Select>
          <Select
            flex={1}
            minW="150px"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            borderRadius="full"
          >
            {tipos.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Select>
          <Select
            flex={1}
            minW="150px"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            borderRadius="full"
          >
            {estados.map(est => (
              <option key={est.value} value={est.value}>{est.label}</option>
            ))}
          </Select>
        </Stack>

        {loading ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8} w="100%">
            {[...Array(6)].map((_, i) => (
              <Card key={i} borderRadius="xl" overflow="hidden">
                <Skeleton h="200px" />
                <CardBody>
                  <Skeleton height="20px" mb={2} />
                  <Skeleton height="15px" mb={1} />
                  <Skeleton height="15px" width="60%" />
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        ) : filteredActividades.length === 0 ? (
          <Box textAlign="center" py={20}>
            <Text fontSize="xl" color="gray.500" mb={6}>
              No hay actividades que coincidan con los filtros
            </Text>
            <Button
              as={Link}
              to="/"
              colorScheme="brand"
              size="lg"
              variant="solid"
            >
              Volver al inicio
            </Button>
          </Box>
        ) : (
          <>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8} w="100%">
              {displayedActividades.map((actividad, index) => (
                <Card
                  key={actividad._id || actividad.id}
                  borderRadius="xl"
                  overflow="hidden"
                  boxShadow="lg"
                  transition="all 0.3s"
                  _hover={{ transform: 'translateY(-8px)', boxShadow: '2xl' }}
                  cursor="pointer"
                  onClick={() => handleOpenModal(actividad)}
                  ref={index === displayedActividades.length - 1 ? lastElementRef : null}
                >
                  {renderThumbnail(actividad)}
                  <CardBody>
                    <HStack justify="space-between" mb={2} flexWrap="wrap">
                      <Badge colorScheme="purple" px={2} py={1} borderRadius="md">
                        {categorias.find(c => c.value === actividad.categoria)?.label || actividad.categoria}
                      </Badge>
                      <Badge colorScheme="green" px={2} py={1} borderRadius="md">
                        {tipos.find(t => t.value === actividad.tipo)?.label || actividad.tipo}
                      </Badge>
                    </HStack>
                    <Badge colorScheme={getEstadoColor(actividad.estado)} mb={2} px={2} py={1} borderRadius="md">
                      {getEstadoLabel(actividad.estado)}
                    </Badge>

                    <Heading size="md" mb={2} noOfLines={2} color="brand.secondary">
                      {actividad.titulo}
                    </Heading>

                    <Text color="gray.600" mb={2} noOfLines={2}>
                      {actividad.descripcion}
                    </Text>

                    <VStack align="start" spacing={1} fontSize="sm" color="gray.600" mb={4}>
                      {actividad.fecha && (
                        <Text>📅 {formatFecha(actividad.fecha).substring(0, 20)}</Text>
                      )}
                      {actividad.ubicacion && (
                        <Text>📍 {actividad.ubicacion.substring(0, 25)}...</Text>
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>

            {loadingMore && (
              <Flex justify="center" py={4}>
                <Spinner size="lg" color="brand.accent2" />
              </Flex>
            )}

            {!hasMore && filteredActividades.length > ITEMS_PER_PAGE && (
              <Text color="gray.500" mt={4}>
                — Has llegado al final —
              </Text>
            )}
          </>
        )}

        {renderModal()}
      </VStack>
    </Container>
  );
};

export default Actividades;