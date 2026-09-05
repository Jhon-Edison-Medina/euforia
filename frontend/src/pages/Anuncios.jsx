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
  Tag,
  TagLabel,
  TagLeftIcon,
  Tooltip,
  Icon,
} from '@chakra-ui/react';
import {
  SearchIcon,
  CloseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  CalendarIcon,
  TimeIcon,
  StarIcon,
  AttachmentIcon,
} from '@chakra-ui/icons';
import { announcementsAPI } from '../services/api';
import { optimizarUrlCloudinary } from '../services/cloudinary';
import { Link } from 'react-router-dom';
import { FaImages, FaVideo, FaFileImage } from 'react-icons/fa';

// Configuración de paginación
const ITEMS_PER_PAGE = 9;

const Anuncios = () => {
  const [allAnuncios, setAllAnuncios] = useState([]);
  const [filteredAnuncios, setFilteredAnuncios] = useState([]);
  const [displayedAnuncios, setDisplayedAnuncios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedAnuncio, setSelectedAnuncio] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todas');
  const toast = useToast();
  const observerRef = useRef();

  // Categorías disponibles (deben coincidir con las del backend)
  const categorias = [
    { value: 'todas', label: 'Todas las categorías' },
    { value: 'Educación', label: '📚 Educación' },
    { value: 'Derechos Humanos', label: '⚖️ Derechos Humanos' },
    { value: 'Medio Ambiente', label: '🌱 Medio Ambiente' },
    { value: 'Género', label: '♀️ Género' },
    { value: 'Evento', label: '🎉 Evento' },
    { value: 'Investigación', label: '🔬 Investigación' },
    { value: 'Salud', label: '🏥 Salud' },
    { value: 'Comunidad', label: '👥 Comunidad' },
  ];

  // Cargar anuncios
  const cargarAnuncios = async () => {
    setLoading(true);
    try {
      const response = await announcementsAPI.getAll();
      const data = response.data || [];
      // Solo publicados y ordenados por fecha
      const publicados = data
        .filter(a => a.estado === 'publicado')
        .sort((a, b) => new Date(b.fecha || b.createdAt) - new Date(a.fecha || a.createdAt));
      setAllAnuncios(publicados);
      setFilteredAnuncios(publicados);
      setPage(1);
      setHasMore(publicados.length > ITEMS_PER_PAGE);
    } catch (error) {
      console.error('Error cargando anuncios:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los anuncios',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarAnuncios();
    const handleUpdate = () => cargarAnuncios();
    window.addEventListener('euforia_anuncios_updated', handleUpdate);
    return () => window.removeEventListener('euforia_anuncios_updated', handleUpdate);
  }, []);

  // Aplicar filtros
  useEffect(() => {
    let result = allAnuncios;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(a =>
        a.titulo?.toLowerCase().includes(term) ||
        a.contenido?.toLowerCase().includes(term)
      );
    }
    if (categoryFilter !== 'todas') {
      result = result.filter(a => a.categoria === categoryFilter);
    }
    setFilteredAnuncios(result);
    setPage(1);
    setHasMore(result.length > ITEMS_PER_PAGE);
  }, [searchTerm, categoryFilter, allAnuncios]);

  // Actualizar los anuncios mostrados según la página
  useEffect(() => {
    const start = 0;
    const end = page * ITEMS_PER_PAGE;
    setDisplayedAnuncios(filteredAnuncios.slice(start, end));
    setHasMore(end < filteredAnuncios.length);
  }, [filteredAnuncios, page]);

  // Observer para scroll infinito
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

  // Cargar más cuando se llega al final
  useEffect(() => {
    if (page > 1) {
      setLoadingMore(true);
      // Simular carga (ya están en memoria, solo actualizamos displayed)
      setTimeout(() => setLoadingMore(false), 300);
    }
  }, [page]);

  // Función para obtener información del primer archivo multimedia
  const getPrimerArchivo = (anuncio) => {
    if (anuncio.multimedia && anuncio.multimedia.length > 0) {
      const primero = anuncio.multimedia[0];
      return {
        url: optimizarUrlCloudinary(primero.url),
        tipo: primero.tipo,
        thumbnail: optimizarUrlCloudinary(primero.thumbnail || primero.url, 400),
        esVideo: primero.tipo.startsWith('video/'),
        esGif: primero.tipo === 'image/gif' || primero.tipo.includes('gif'),
        count: anuncio.multimedia.length,
      };
    }
    if (anuncio.archivo) {
      const esVideo = anuncio.tipoArchivo?.startsWith('video/') || anuncio.nombreArchivo?.match(/\.(mp4|avi|mov|wmv|webm|ogg)$/);
      const esGif = anuncio.tipoArchivo === 'image/gif' || anuncio.nombreArchivo?.endsWith('.gif');
      return {
        url: optimizarUrlCloudinary(anuncio.archivo),
        tipo: anuncio.tipoArchivo,
        thumbnail: optimizarUrlCloudinary(anuncio.thumbnail || anuncio.archivo, 400),
        esVideo,
        esGif,
        count: 1,
      };
    }
    return null;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleOpenModal = (anuncio) => {
    setSelectedAnuncio(anuncio);
    setCurrentMediaIndex(0);
    onOpen();
  };

  const nextMedia = () => {
    if (selectedAnuncio) {
      const total = selectedAnuncio.multimedia?.length || (selectedAnuncio.archivo ? 1 : 0);
      setCurrentMediaIndex(prev => (prev + 1) % total);
    }
  };

  const prevMedia = () => {
    if (selectedAnuncio) {
      const total = selectedAnuncio.multimedia?.length || (selectedAnuncio.archivo ? 1 : 0);
      setCurrentMediaIndex(prev => (prev - 1 + total) % total);
    }
  };

  // Renderizar la miniatura en la tarjeta
  const renderThumbnail = (anuncio) => {
    const info = getPrimerArchivo(anuncio);
    if (!info) {
      return (
        <Flex
          h="200px"
          bg="brand.primary"
          align="center"
          justify="center"
          direction="column"
          p={4}
        >
          <Text fontSize="5xl" mb={2}>
            {anuncio.categoria === 'Evento' ? '🎉' :
             anuncio.categoria === 'Educación' ? '📚' :
             anuncio.categoria === 'Derechos Humanos' ? '⚖️' :
             anuncio.categoria === 'Medio Ambiente' ? '🌱' :
             anuncio.categoria === 'Género' ? '♀️' :
             anuncio.categoria === 'Investigación' ? '🔬' :
             anuncio.categoria === 'Salud' ? '🏥' :
             anuncio.categoria === 'Comunidad' ? '👥' : '📢'}
          </Text>
          <Text fontSize="sm" color="white" textAlign="center">
            {anuncio.categoria || 'Anuncio'}
          </Text>
        </Flex>
      );
    }

    return (
      <Box position="relative" h="200px" bg="black">
        {info.esVideo ? (
          <video
            src={info.url}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            muted
            loop
            onMouseEnter={e => e.target.play()}
            onMouseLeave={e => e.target.pause()}
          />
        ) : info.esGif ? (
          <img
            src={info.url}
            alt={anuncio.titulo}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        ) : (
          <Image
            src={info.url}
            alt={anuncio.titulo}
            w="100%"
            h="100%"
            objectFit="contain"
            loading="lazy"
          />
        )}
        {info.count > 1 && (
          <Badge
            position="absolute"
            top={2}
            right={2}
            colorScheme="blue"
            fontSize="sm"
            px={2}
            py={1}
            borderRadius="full"
          >
            <HStack spacing={1}>
              <Icon as={FaImages} />
              <Text>{info.count}</Text>
            </HStack>
          </Badge>
        )}
        {info.esVideo && (
          <Badge
            position="absolute"
            top={2}
            left={2}
            colorScheme="red"
            fontSize="sm"
            px={2}
            py={1}
            borderRadius="full"
          >
            🎬 Video
          </Badge>
        )}
        {info.esGif && (
          <Badge
            position="absolute"
            top={2}
            left={2}
            colorScheme="green"
            fontSize="sm"
            px={2}
            py={1}
            borderRadius="full"
          >
            GIF
          </Badge>
        )}
      </Box>
    );
  };

  // Renderizar el modal de detalle
  const renderModal = () => {
    if (!selectedAnuncio) return null;

    const multimedia = selectedAnuncio.multimedia && selectedAnuncio.multimedia.length > 0
      ? selectedAnuncio.multimedia
      : selectedAnuncio.archivo ? [{ url: selectedAnuncio.archivo, tipo: selectedAnuncio.tipoArchivo, nombre: selectedAnuncio.nombreArchivo }] : [];
    const currentMedia = multimedia[currentMediaIndex];
    const totalMedia = multimedia.length;

    return (
      <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent borderRadius="2xl" overflow="hidden">
          <ModalHeader bg="brand.primary" color="white" py={4}>
            <HStack justify="space-between">
              <Heading size="lg" noOfLines={1}>{selectedAnuncio.titulo}</Heading>
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
                    bg="black"
                    position="relative"
                  >
                    {currentMedia.tipo.startsWith('video/') ? (
                      <AspectRatio ratio={16 / 9}>
                        <video
                          src={currentMedia.url}
                          controls
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      </AspectRatio>
                    ) : (
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

              {/* Información del anuncio */}
              <Box>
                <HStack spacing={4} mb={4} wrap="wrap">
                  <Badge colorScheme="purple" fontSize="md" px={3} py={1}>
                    {selectedAnuncio.categoria || 'General'}
                  </Badge>
                  {selectedAnuncio.destacado && (
                    <Badge colorScheme="yellow" fontSize="md" px={3} py={1}>
                      ⭐ Destacado
                    </Badge>
                  )}
                  <Badge colorScheme={selectedAnuncio.estado === 'publicado' ? 'green' : 'gray'}>
                    {selectedAnuncio.estado === 'publicado' ? '📢 Publicado' : '📝 Borrador'}
                  </Badge>
                </HStack>

                <Text fontSize="md" color="gray.500" mb={2}>
                  <CalendarIcon mr={1} /> Publicado: {formatDate(selectedAnuncio.fecha || selectedAnuncio.createdAt)}
                </Text>
                {selectedAnuncio.fechaEvento && (
                  <Text fontSize="md" color="blue.600" mb={2}>
                    <TimeIcon mr={1} /> Evento: {formatDate(selectedAnuncio.fechaEvento)}
                  </Text>
                )}

                <Text fontSize="lg" lineHeight="tall" mt={4} whiteSpace="pre-wrap">
                  {selectedAnuncio.contenido}
                </Text>

                {/* Lista de archivos adjuntos */}
                {multimedia.length > 0 && (
                  <Box mt={6}>
                    <Text fontWeight="bold" mb={2}>Archivos adjuntos:</Text>
                    <SimpleGrid columns={{ base: 2, md: 3 }} spacing={2}>
                      {multimedia.map((file, idx) => (
                        <HStack
                          key={idx}
                          p={2}
                          bg="gray.50"
                          borderRadius="md"
                          justify="space-between"
                        >
                          <HStack spacing={2} minW={0}>
                            <Icon
                              as={file.tipo.startsWith('video/') ? FaVideo : FaFileImage}
                              color={file.tipo.startsWith('video/') ? 'red.500' : 'blue.500'}
                            />
                            <Text fontSize="sm" noOfLines={1}>
                              {file.nombre || `Archivo ${idx + 1}`}
                            </Text>
                          </HStack>
                          <Tooltip label="Descargar">
                            <IconButton
                              icon={<DownloadIcon />}
                              size="xs"
                              variant="ghost"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = file.url;
                                link.download = file.nombre || `archivo-${idx+1}`;
                                link.click();
                              }}
                              aria-label="Descargar"
                            />
                          </Tooltip>
                        </HStack>
                      ))}
                    </SimpleGrid>
                  </Box>
                )}
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
        {/* Encabezado */}
        <Box textAlign="center">
          <Heading
            as="h1"
            size="2xl"
            mb={4}
            bgGradient="linear(to-r, brand.primary, brand.accent2)"
            bgClip="text"
          >
            📢 Anuncios y Novedades
          </Heading>
          <Text fontSize="lg" color="gray.600" maxW="3xl" mx="auto">
            Mantente informado sobre nuestras actividades, eventos y comunicados importantes
          </Text>
        </Box>

        {/* Filtros */}
        <Stack direction={{ base: 'column', md: 'row' }} w="100%" spacing={4}>
          <InputGroup flex={2}>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Buscar por título o contenido..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              borderRadius="full"
            />
          </InputGroup>
          <Select
            flex={1}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            borderRadius="full"
          >
            {categorias.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </Select>
        </Stack>

        {/* Grid de anuncios */}
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
        ) : filteredAnuncios.length === 0 ? (
          <Box textAlign="center" py={20}>
            <Text fontSize="xl" color="gray.500" mb={6}>
              No hay anuncios que coincidan con los filtros
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
              {displayedAnuncios.map((anuncio, index) => {
                const info = getPrimerArchivo(anuncio);
                return (
                  <Card
                    key={anuncio._id || anuncio.id}
                    borderRadius="xl"
                    overflow="hidden"
                    boxShadow="lg"
                    transition="all 0.3s"
                    _hover={{ transform: 'translateY(-8px)', boxShadow: '2xl' }}
                    cursor="pointer"
                    onClick={() => handleOpenModal(anuncio)}
                    ref={index === displayedAnuncios.length - 1 ? lastElementRef : null}
                  >
                    {renderThumbnail(anuncio)}
                    <CardBody>
                      <HStack justify="space-between" mb={2}>
                        <Badge colorScheme="purple" px={2} py={1} borderRadius="md">
                          {anuncio.categoria || 'General'}
                        </Badge>
                        <Text fontSize="sm" color="gray.500">
                          {formatDate(anuncio.fechaEvento || anuncio.fecha || anuncio.createdAt)}
                        </Text>
                      </HStack>

                      <Heading size="md" mb={2} noOfLines={2} color="brand.secondary">
                        {anuncio.titulo}
                        {anuncio.destacado && (
                          <StarIcon ml={2} color="yellow.400" boxSize={4} />
                        )}
                      </Heading>

                      <Text color="gray.600" mb={4} noOfLines={3}>
                        {anuncio.contenido}
                      </Text>

                      <Button
                        rightIcon={<ChevronRightIcon />}
                        colorScheme="brand"
                        variant="outline"
                        size="sm"
                        w="full"
                        onClick={(e) => { e.stopPropagation(); handleOpenModal(anuncio); }}
                      >
                        Ver detalles
                      </Button>
                    </CardBody>
                  </Card>
                );
              })}
            </SimpleGrid>

            {/* Indicador de carga infinita */}
            {loadingMore && (
              <Flex justify="center" py={4}>
                <Spinner size="lg" color="brand.accent2" />
              </Flex>
            )}

            {!hasMore && filteredAnuncios.length > ITEMS_PER_PAGE && (
              <Text color="gray.500" mt={4}>
                — Has llegado al final —
              </Text>
            )}
          </>
        )}

        {/* Modal de detalle */}
        {renderModal()}
      </VStack>
    </Container>
  );
};

export default Anuncios;