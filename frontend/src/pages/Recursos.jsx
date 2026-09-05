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
  Tooltip,
  Icon,
} from '@chakra-ui/react';
import {
  SearchIcon,
  CloseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  ExternalLinkIcon,
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
import { resourcesAPI } from '../services/api';
import { optimizarUrlCloudinary } from '../services/cloudinary';
import MediaPlaceholder from '../components/MediaPlaceholder';
import { Link } from 'react-router-dom';

const ITEMS_PER_PAGE = 9;

// Función auxiliar para obtener el icono según el tipo de archivo
const getFileIcon = (tipo, nombre) => {
  if (!tipo && !nombre) return FaFileAlt;
  
  const lowerName = nombre?.toLowerCase() || '';
  const lowerTipo = tipo?.toLowerCase() || '';

  // Imágenes
  if (lowerTipo.startsWith('image/')) return FaFileImage;
  // Videos
  if (lowerTipo.startsWith('video/')) return FaVideo;
  // Audio
  if (lowerTipo.startsWith('audio/')) return FaFileAudio;

  // Por extensión de nombre
  if (lowerName.endsWith('.pdf')) return FaFilePdf;
  if (lowerName.endsWith('.doc') || lowerName.endsWith('.docx')) return FaFileWord;
  if (lowerName.endsWith('.xls') || lowerName.endsWith('.xlsx')) return FaFileExcel;
  if (lowerName.endsWith('.ppt') || lowerName.endsWith('.pptx')) return FaFilePowerpoint;
  if (lowerName.endsWith('.zip') || lowerName.endsWith('.rar') || lowerName.endsWith('.7z')) return FaFileArchive;
  if (lowerName.endsWith('.js') || lowerName.endsWith('.html') || lowerName.endsWith('.css') || lowerName.endsWith('.json')) return FaFileCode;

  // Por tipo MIME
  if (lowerTipo.includes('pdf')) return FaFilePdf;
  if (lowerTipo.includes('word') || lowerTipo.includes('document')) return FaFileWord;
  if (lowerTipo.includes('excel') || lowerTipo.includes('spreadsheet')) return FaFileExcel;
  if (lowerTipo.includes('powerpoint') || lowerTipo.includes('presentation')) return FaFilePowerpoint;
  if (lowerTipo.includes('zip') || lowerTipo.includes('compressed')) return FaFileArchive;

  return FaFileAlt;
};

const Recursos = () => {
  const [allRecursos, setAllRecursos] = useState([]);
  const [filteredRecursos, setFilteredRecursos] = useState([]);
  const [displayedRecursos, setDisplayedRecursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedRecurso, setSelectedRecurso] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todas');
  const [typeFilter, setTypeFilter] = useState('todos');
  const toast = useToast();
  const observerRef = useRef();

  const categorias = [
    { value: 'todas', label: 'Todas las categorías' },
    { value: 'educacion', label: '📚 Educación' },
    { value: 'derechos', label: '⚖️ Derechos Humanos' },
    { value: 'genero', label: '♀️ Género' },
    { value: 'comunidad', label: '👥 Comunidad' },
    { value: 'salud', label: '🏥 Salud' },
    { value: 'medio_ambiente', label: '🌱 Medio Ambiente' },
  ];

  const tipos = [
    { value: 'todos', label: 'Todos los tipos' },
    { value: 'documento', label: '📄 Documento' },
    { value: 'video', label: '🎥 Video' },
    { value: 'audio', label: '🎵 Audio' },
    { value: 'imagen', label: '🖼️ Imagen' },
    { value: 'enlace', label: '🔗 Enlace' },
  ];

  const cargarRecursos = async () => {
    setLoading(true);
    try {
      const response = await resourcesAPI.getAll();
      const data = response.data || [];
      const publicados = data.filter(r => r.estado === 'publicado');
      setAllRecursos(publicados);
      setFilteredRecursos(publicados);
      setPage(1);
      setHasMore(publicados.length > ITEMS_PER_PAGE);
    } catch (error) {
      console.error('Error cargando recursos:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los recursos',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarRecursos();
    const handleUpdate = () => cargarRecursos();
    window.addEventListener('euforia_resources_updated', handleUpdate);
    return () => window.removeEventListener('euforia_resources_updated', handleUpdate);
  }, []);

  useEffect(() => {
    let result = allRecursos;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(r =>
        r.titulo?.toLowerCase().includes(term) ||
        r.descripcion?.toLowerCase().includes(term)
      );
    }
    if (categoryFilter !== 'todas') {
      result = result.filter(r => r.categoria === categoryFilter);
    }
    if (typeFilter !== 'todos') {
      result = result.filter(r => r.tipo === typeFilter);
    }
    setFilteredRecursos(result);
    setPage(1);
    setHasMore(result.length > ITEMS_PER_PAGE);
  }, [searchTerm, categoryFilter, typeFilter, allRecursos]);

  useEffect(() => {
    const start = 0;
    const end = page * ITEMS_PER_PAGE;
    setDisplayedRecursos(filteredRecursos.slice(start, end));
    setHasMore(end < filteredRecursos.length);
  }, [filteredRecursos, page]);

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

  const getPrimerArchivo = (recurso) => {
    if (recurso.multimedia && recurso.multimedia.length > 0) {
      const primero = recurso.multimedia[0];
      return {
        url: optimizarUrlCloudinary(primero.url),
        tipo: primero.tipo,
        thumbnail: optimizarUrlCloudinary(primero.thumbnail || primero.url, 400),
        nombre: primero.nombre,
        tamaño: primero.tamaño,
        count: recurso.multimedia.length,
      };
    }
    if (recurso.archivo) {
      const esVideo = recurso.tipoArchivo?.startsWith('video/') || recurso.nombreArchivo?.match(/\.(mp4|avi|mov|wmv|webm|ogg)$/);
      const esGif = recurso.tipoArchivo === 'image/gif' || recurso.nombreArchivo?.endsWith('.gif');
      return {
        url: optimizarUrlCloudinary(recurso.archivo),
        tipo: recurso.tipoArchivo || (esGif ? 'image/gif' : esVideo ? 'video' : 'image'),
        thumbnail: optimizarUrlCloudinary(recurso.thumbnail || recurso.archivo, 400),
        nombre: recurso.nombreArchivo,
        tamaño: recurso.tamañoArchivo,
        count: 1,
      };
    }
    return null;
  };

  const getTipoIcon = (tipo) => {
    switch(tipo) {
      case 'documento': return '📄';
      case 'video': return '🎬';
      case 'audio': return '🎧';
      case 'enlace': return '🔗';
      case 'imagen': return '🖼️';
      default: return '📁';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleOpenModal = (recurso) => {
    setSelectedRecurso(recurso);
    setCurrentMediaIndex(0);
    onOpen();
  };

  const nextMedia = () => {
    if (selectedRecurso) {
      const multimedia = selectedRecurso.multimedia || (selectedRecurso.archivo ? [selectedRecurso.archivo] : []);
      setCurrentMediaIndex(prev => (prev + 1) % multimedia.length);
    }
  };

  const prevMedia = () => {
    if (selectedRecurso) {
      const multimedia = selectedRecurso.multimedia || (selectedRecurso.archivo ? [selectedRecurso.archivo] : []);
      setCurrentMediaIndex(prev => (prev - 1 + multimedia.length) % multimedia.length);
    }
  };

  const handleDownload = (file) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.nombre || 'recurso';
    link.click();
  };

  const renderThumbnail = (recurso) => {
    const info = getPrimerArchivo(recurso);
    if (!info) {
      // Sin archivo multimedia, mostrar icono según tipo de recurso
      const IconComponent = getFileIcon(recurso.tipo, null);
      return (
        <MediaPlaceholder icon={IconComponent} label={recurso.categoria || 'Recurso'} />
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
            alt={recurso.titulo}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
          />
        ) : esImagen ? (
          <Image
            src={info.url}
            alt={recurso.titulo}
            w="100%"
            h="100%"
            objectFit="cover"
            objectPosition="top"
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
        {esImagen && !esGif && (
          <Badge position="absolute" top={2} left={2} colorScheme="blue" fontSize="sm" px={2} py={1} borderRadius="full">
            🖼️ Imagen
          </Badge>
        )}
      </Box>
    );
  };

  const renderModal = () => {
    if (!selectedRecurso) return null;

    const multimedia = selectedRecurso.multimedia && selectedRecurso.multimedia.length > 0
      ? selectedRecurso.multimedia
      : selectedRecurso.archivo ? [{ url: selectedRecurso.archivo, tipo: selectedRecurso.tipoArchivo, nombre: selectedRecurso.nombreArchivo }] : [];
    const currentMedia = multimedia[currentMediaIndex];
    const totalMedia = multimedia.length;

    return (
      <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent borderRadius="2xl" overflow="hidden">
          <ModalHeader bg="brand.primary" color="white" py={4}>
            <HStack justify="space-between">
              <Heading size="lg" noOfLines={1}>{selectedRecurso.titulo}</Heading>
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

              {/* Información del recurso */}
              <Box>
                <HStack spacing={4} mb={4} wrap="wrap">
                  <Badge colorScheme="purple" fontSize="md" px={3} py={1}>
                    {selectedRecurso.categoria || 'General'}
                  </Badge>
                  <Badge colorScheme="green" fontSize="md" px={3} py={1}>
                    {selectedRecurso.tipo}
                  </Badge>
                  {selectedRecurso.estado === 'publicado' && (
                    <Badge colorScheme="blue">📢 Publicado</Badge>
                  )}
                </HStack>

                <Text fontSize="md" color="gray.500" mb={2}>
                  Publicado: {formatDate(selectedRecurso.createdAt)}
                </Text>

                <Text fontSize="lg" lineHeight="tall" mt={4} whiteSpace="pre-wrap">
                  {selectedRecurso.descripcion}
                </Text>

                {/* Lista de archivos adjuntos */}
                {multimedia.length > 0 && (
                  <Box mt={6}>
                    <Text fontWeight="bold" mb={2}>Archivos:</Text>
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
                              as={getFileIcon(file.tipo, file.nombre)}
                              color={file.tipo?.startsWith('video/') ? 'red.500' : file.tipo?.startsWith('image/') ? 'blue.500' : 'gray.500'}
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
                              onClick={() => handleDownload(file)}
                              aria-label="Descargar"
                            />
                          </Tooltip>
                        </HStack>
                      ))}
                    </SimpleGrid>
                  </Box>
                )}
                {selectedRecurso.url && selectedRecurso.tipo === 'enlace' && (
                  <Box mt={4}>
                    <Button
                      as="a"
                      href={selectedRecurso.url}
                      target="_blank"
                      leftIcon={<ExternalLinkIcon />}
                      colorScheme="brand"
                      variant="solid"
                    >
                      Ir al enlace
                    </Button>
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
        <Box textAlign="center">
          <Heading
            as="h1"
            size="2xl"
            mb={4}
            bgGradient="linear(to-r, brand.primary, brand.accent2)"
            bgClip="text"
          >
            📚 Recursos Educativos
          </Heading>
          <Text fontSize="lg" color="gray.600" maxW="3xl" mx="auto">
            Materiales descargables, documentos de análisis y recursos educativos
            para el trabajo comunitario y la formación crítica.
          </Text>
        </Box>

        <Stack direction={{ base: 'column', md: 'row' }} w="100%" spacing={4}>
          <InputGroup flex={2}>
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
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            borderRadius="full"
          >
            {tipos.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
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
        ) : filteredRecursos.length === 0 ? (
          <Box textAlign="center" py={20}>
            <Text fontSize="xl" color="gray.500" mb={6}>
              No hay recursos que coincidan con los filtros
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
              {displayedRecursos.map((recurso, index) => (
                <Card
                  key={recurso._id || recurso.id}
                  borderRadius="xl"
                  overflow="hidden"
                  boxShadow="lg"
                  transition="all 0.3s"
                  _hover={{ transform: 'translateY(-8px)', boxShadow: '2xl' }}
                  cursor="pointer"
                  onClick={() => handleOpenModal(recurso)}
                  ref={index === displayedRecursos.length - 1 ? lastElementRef : null}
                >
                  {renderThumbnail(recurso)}
                  <CardBody>
                    <HStack justify="space-between" mb={2}>
                      <Badge colorScheme="purple" px={2} py={1} borderRadius="md">
                        {categorias.find(c => c.value === recurso.categoria)?.label || recurso.categoria}
                      </Badge>
                      <Badge colorScheme="green" px={2} py={1} borderRadius="md">
                        {tipos.find(t => t.value === recurso.tipo)?.label || recurso.tipo}
                      </Badge>
                    </HStack>

                    <Heading size="md" mb={2} noOfLines={2} color="brand.secondary">
                      {recurso.titulo}
                    </Heading>

                    <Text color="gray.600" mb={4} noOfLines={3}>
                      {recurso.descripcion}
                    </Text>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>

            {loadingMore && (
              <Flex justify="center" py={4}>
                <Spinner size="lg" color="brand.accent2" />
              </Flex>
            )}

            {!hasMore && filteredRecursos.length > ITEMS_PER_PAGE && (
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

export default Recursos;