import React, { useState, useEffect } from 'react';
import {
  Box, VStack, Heading, Text, Button, Card, CardBody,
  Table, Thead, Tbody, Tr, Th, Td, Badge, HStack,
  IconButton, useDisclosure, Modal, ModalOverlay,
  ModalContent, ModalHeader, ModalFooter, ModalBody,
  ModalCloseButton, FormControl, FormLabel, Input,
  Textarea, Select, Alert, AlertIcon, Spinner,
  InputGroup, InputRightElement, Image,
  SimpleGrid, Switch, Flex, useToast,
  Progress, Tooltip
} from '@chakra-ui/react';
import { SearchIcon, AddIcon, EditIcon, DeleteIcon, CloseIcon } from '@chakra-ui/icons';
import { announcementsAPI, generateThumbnail } from '../../services/api';
import { subirArchivoMultimedia } from '../../services/cloudinary';

// Límite máximo de archivos
const MAX_FILES = 10;

const GestionAnuncios = ({ onUpdate }) => {
  const [anuncios, setAnuncios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [currentAnuncio, setCurrentAnuncio] = useState(null);
  const [message, setMessage] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const [formData, setFormData] = useState({
    titulo: '',
    contenido: '',
    categoria: 'Educación',
    fechaEvento: '',
    destacado: false,
    estado: 'publicado',
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [archivosSeleccionados, setArchivosSeleccionados] = useState([]);
  const [modoEdicionAntiguo, setModoEdicionAntiguo] = useState(false);

  // Estados para filtros
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroDestacado, setFiltroDestacado] = useState('todos');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');

  // Previews generados client-side (para thumbnails)
  const [previews, setPreviews] = useState({});

  // Progreso de subida
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingFiles, setProcessingFiles] = useState(false);

  const categorias = [
    { value: 'Educación', label: '📚 Educación' },
    { value: 'Derechos Humanos', label: '⚖️ Derechos Humanos' },
    { value: 'Medio Ambiente', label: '🌱 Medio Ambiente' },
    { value: 'Género', label: '♀️ Género' },
    { value: 'Evento', label: '🎉 Evento' },
    { value: 'Investigación', label: '🔬 Investigación' },
    { value: 'Salud', label: '🏥 Salud' },
    { value: 'Comunidad', label: '👥 Comunidad' }
  ];

  // Limpieza de object URLs al desmontar o cerrar modal
  useEffect(() => {
    return () => {
      archivosSeleccionados.forEach(item => {
        if (item.preview && !item.existente) {
          URL.revokeObjectURL(item.preview);
        }
      });
    };
  }, [archivosSeleccionados]);

  useEffect(() => {
    cargarAnuncios();
    const handleUpdate = () => {
      cargarAnuncios();
      if (onUpdate) onUpdate();
    };
    window.addEventListener('euforia_anuncios_updated', handleUpdate);
    return () => {
      window.removeEventListener('euforia_anuncios_updated', handleUpdate);
    };
  }, [onUpdate]);

  // Generar previews client-side para anuncios sin thumbnail (solo para la tabla)
  useEffect(() => {
    if (!loading && anuncios.length > 0) {
      anuncios.forEach(async (anuncio) => {
        const id = anuncio.id || anuncio._id;
        if (!previews[id] && !anuncio.thumbnail && anuncio.archivo && anuncio.archivo.startsWith('data:')) {
          try {
            const thumb = await generateThumbnail(anuncio.archivo, anuncio.tipoArchivo);
            setPreviews(prev => ({ ...prev, [id]: thumb }));
            console.log(`✅ Preview generado client-side para ${id}`);
          } catch (error) {
            console.warn(`⚠️ Error generando preview para ${id}:`, error);
          }
        }
      });
    }
  }, [loading, anuncios]);

  const cargarAnuncios = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await announcementsAPI.getAllAdmin();
      const anunciosData = response.data || [];
      const sorted = anunciosData.sort((a, b) => {
        const dateA = new Date(a.fecha || a.createdAt || 0);
        const dateB = new Date(b.fecha || b.createdAt || 0);
        return dateB - dateA;
      });
      setAnuncios(sorted);
    } catch (error) {
      console.error('❌ Error cargando anuncios:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast({
          title: 'Sesión expirada',
          description: 'Redirigiendo al login...',
          status: 'warning',
          duration: 3000,
        });
        localStorage.removeItem('euforia_token');
        localStorage.removeItem('euforia_user');
        setTimeout(() => {
          window.location.href = '/admin';
        }, 2000);
        return;
      }
      setMessage('Error al cargar los anuncios');
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

  // Función para obtener el primer archivo multimedia (para la tabla)
  const getPrimerArchivo = (anuncio) => {
    if (anuncio.multimedia && anuncio.multimedia.length > 0) {
      const primero = anuncio.multimedia[0];
      return {
        url: primero.url,
        tipo: primero.tipo,
        thumbnail: primero.thumbnail || primero.url,
        esVideo: primero.tipo.startsWith('video/'),
        esGif: primero.tipo === 'image/gif' || primero.tipo.includes('gif')
      };
    }
    if (anuncio.archivo) {
      const esVideo = anuncio.tipoArchivo?.startsWith('video/') || anuncio.nombreArchivo?.match(/\.(mp4|avi|mov|wmv|webm|ogg)$/);
      const esGif = anuncio.tipoArchivo === 'image/gif' || anuncio.nombreArchivo?.endsWith('.gif');
      return {
        url: anuncio.archivo,
        tipo: anuncio.tipoArchivo,
        thumbnail: anuncio.thumbnail || anuncio.archivo,
        esVideo,
        esGif
      };
    }
    return null;
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validar cantidad máxima
    if (archivosSeleccionados.length + files.length > MAX_FILES) {
      setMessage(`❌ Solo se permiten hasta ${MAX_FILES} archivos.`);
      e.target.value = '';
      return;
    }

    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    const validVideoTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm', 'video/ogg'];
    const validTypes = [...validImageTypes, ...validVideoTypes];
    const maxSize = 50 * 1024 * 1024; // 50MB

    const nuevos = [];
    files.forEach(file => {
      if (!validTypes.includes(file.type.toLowerCase())) {
        setMessage(`❌ Formato no soportado: ${file.type}`);
        return;
      }
      if (file.size > maxSize) {
        setMessage(`❌ El archivo ${file.name} es muy grande (${(file.size / (1024 * 1024)).toFixed(2)}MB). Máximo: 50MB`);
        return;
      }

      // Crear preview con objectURL
      const preview = URL.createObjectURL(file);
      nuevos.push({
        id: Date.now() + Math.random(),
        file,
        tipo: file.type,
        nombre: file.name,
        tamaño: file.size,
        preview,
        existente: false
      });
    });

    if (nuevos.length > 0) {
      setArchivosSeleccionados(prev => [...prev, ...nuevos]);
      setMessage(`✅ ${nuevos.length} archivo(s) agregado(s)`);
    }
    e.target.value = ''; // permitir volver a seleccionar
  };

  const eliminarArchivo = (id) => {
    setArchivosSeleccionados(prev => {
      const archivo = prev.find(a => a.id === id);
      if (archivo && archivo.preview && !archivo.existente) {
        URL.revokeObjectURL(archivo.preview);
      }
      return prev.filter(a => a.id !== id);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.titulo.trim() || !formData.contenido.trim()) {
      setMessage('❌ Título y contenido son obligatorios');
      return;
    }

    setSubmitting(true);
    setProcessingFiles(true);
    setMessage('🔄 Procesando archivos...');
    setUploadProgress(0);

    try {
      const multimediaFinal = [];
      const errores = [];

      // Función para procesar un archivo individual
      const procesarArchivo = async (item) => {
        if (item.existente) {
          multimediaFinal.push({
            url: item.url,
            tipo: item.tipo,
            nombre: item.nombre,
            tamaño: item.tamaño,
            thumbnail: item.thumbnail
          });
          return;
        }

        try {
          const multimediaItem = await subirArchivoMultimedia(item.file);
          multimediaFinal.push(multimediaItem);
        } catch (err) {
          errores.push(`${item.nombre}: ${err.message}`);
        }
      };

      // Procesar en lotes de 3 para no saturar el navegador
      const BATCH_SIZE = 3;
      for (let i = 0; i < archivosSeleccionados.length; i += BATCH_SIZE) {
        const batch = archivosSeleccionados.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(procesarArchivo));
        const progress = Math.round(((i + batch.length) / archivosSeleccionados.length) * 100);
        setUploadProgress(progress);
        setMessage(`🔄 Procesados ${i + batch.length} de ${archivosSeleccionados.length} archivos...`);
      }

      if (errores.length > 0) {
        setMessage(`⚠️ Algunos archivos no se pudieron procesar: ${errores.join('; ')}`);
        // Continuamos con los que sí se procesaron
      }

      const anuncioData = {
        titulo: formData.titulo,
        contenido: formData.contenido,
        categoria: formData.categoria,
        destacado: formData.destacado,
        estado: formData.estado,
        fechaEvento: formData.fechaEvento ? new Date(formData.fechaEvento).toISOString() : null,
        multimedia: multimediaFinal
      };

      setMessage('🔄 Guardando anuncio en el servidor...');
      setUploadProgress(0);

      let result;
      if (editing && currentAnuncio) {
        result = await announcementsAPI.update(currentAnuncio.id || currentAnuncio._id, anuncioData, true);
      } else {
        result = await announcementsAPI.create(anuncioData);
      }

      setMessage('✅ Anuncio guardado correctamente');
      window.dispatchEvent(new CustomEvent('euforia_anuncios_updated'));
      await cargarAnuncios();
      handleCloseModal();

      toast({
        title: 'Éxito',
        description: editing ? 'Anuncio actualizado correctamente' : 'Anuncio creado correctamente',
        status: 'success',
        duration: 3000,
      });

    } catch (error) {
      console.error('Error guardando anuncio:', error);
      setMessage(`❌ ${error.message || 'Error al guardar el anuncio'}`);
      toast({
        title: 'Error',
        description: error.message || 'Error al guardar el anuncio',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setSubmitting(false);
      setProcessingFiles(false);
    }
  };

  const handleEdit = (anuncio) => {
    setEditing(true);
    setCurrentAnuncio(anuncio);
    setModoEdicionAntiguo(false);
    setArchivosSeleccionados([]);

    if (anuncio.multimedia && anuncio.multimedia.length > 0) {
      const multimediaCargado = anuncio.multimedia.map(m => ({
        id: m._id || Date.now() + Math.random(),
        url: m.url,
        tipo: m.tipo,
        nombre: m.nombre,
        tamaño: m.tamaño,
        thumbnail: m.thumbnail,
        existente: true
      }));
      setArchivosSeleccionados(multimediaCargado);
    } else if (anuncio.archivo) {
      const multimediaAntiguo = [{
        id: Date.now() + Math.random(),
        url: anuncio.archivo,
        tipo: anuncio.tipoArchivo || (anuncio.nombreArchivo?.toLowerCase().endsWith('.gif') ? 'image/gif' : 'image'),
        nombre: anuncio.nombreArchivo || 'archivo',
        tamaño: anuncio.tamañoArchivo,
        thumbnail: anuncio.thumbnail,
        existente: true
      }];
      setArchivosSeleccionados(multimediaAntiguo);
      setModoEdicionAntiguo(true);
    }

    setFormData({
      titulo: anuncio.titulo || '',
      contenido: anuncio.contenido || '',
      categoria: anuncio.categoria || 'Educación',
      fechaEvento: anuncio.fechaEvento ? anuncio.fechaEvento.split('T')[0] : '',
      destacado: anuncio.destacado || false,
      estado: anuncio.estado || 'publicado',
    });

    onOpen();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este anuncio?')) return;
    try {
      setMessage('🔄 Eliminando anuncio...');
      await announcementsAPI.delete(id);
      setMessage('✅ Anuncio eliminado correctamente');
      toast({
        title: 'Éxito',
        description: 'Anuncio eliminado correctamente',
        status: 'success',
        duration: 3000,
      });
      window.dispatchEvent(new CustomEvent('euforia_anuncios_updated'));
      cargarAnuncios();
    } catch (error) {
      console.error('Error eliminando anuncio:', error);
      setMessage('❌ Error al eliminar el anuncio');
      toast({
        title: 'Error',
        description: 'Error al eliminar el anuncio',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleCreate = () => {
    setEditing(false);
    setCurrentAnuncio(null);
    setArchivosSeleccionados([]);
    setModoEdicionAntiguo(false);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setFormData({
      titulo: '',
      contenido: '',
      categoria: 'Educación',
      fechaEvento: tomorrow.toISOString().split('T')[0],
      destacado: false,
      estado: 'publicado',
    });
    onOpen();
  };

  const handleCloseModal = () => {
    // Liberar object URLs de archivos nuevos
    archivosSeleccionados.forEach(item => {
      if (item.preview && !item.existente) {
        URL.revokeObjectURL(item.preview);
      }
    });
    onClose();
    setEditing(false);
    setCurrentAnuncio(null);
    setArchivosSeleccionados([]);
    setModoEdicionAntiguo(false);
    setFormData({
      titulo: '',
      contenido: '',
      categoria: 'Educación',
      fechaEvento: '',
      destacado: false,
      estado: 'publicado',
    });
    setMessage('');
    setUploadProgress(0);
  };

  // Función para limpiar caché
  const limpiarCacheLocal = () => {
    try {
      const ahora = new Date();
      const haceUnMes = new Date(ahora.setMonth(ahora.getMonth() - 1));
      const anunciosCache = JSON.parse(localStorage.getItem('euforia_anuncios') || '[]');
      const anunciosRecientes = anunciosCache.filter(anuncio => {
        const fechaAnuncio = new Date(anuncio.fecha || anuncio.createdAt);
        return fechaAnuncio > haceUnMes;
      });
      localStorage.setItem('euforia_anuncios', JSON.stringify(anunciosRecientes));
      toast({
        title: 'Éxito',
        description: 'Caché limpiado correctamente',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error limpiando caché:', error);
    }
  };

  // Función para reparar anuncios antiguos
  const repararAnunciosAntiguos = async () => {
    if (!window.confirm('¿Reparar anuncios antiguos? Esto intentará corregir problemas de imágenes y generar thumbnails.')) return;
    try {
      setMessage('🔄 Reparando anuncios antiguos...');
      const response = await announcementsAPI.getAllAdmin();
      const anunciosParaReparar = response.data || [];
      let reparados = 0;

      for (const anuncio of anunciosParaReparar) {
        let needsUpdate = false;
        const updatedAnuncio = { ...anuncio };

        if (anuncio.archivo && !anuncio.tipoArchivo) {
          let tipoArchivo = 'image';
          if (anuncio.archivo.includes('data:video')) {
            tipoArchivo = 'video';
          } else if (anuncio.archivo.includes('image/gif')) {
            tipoArchivo = 'image/gif';
          } else if (anuncio.nombreArchivo) {
            if (anuncio.nombreArchivo.toLowerCase().endsWith('.gif')) {
              tipoArchivo = 'image/gif';
            } else if (anuncio.nombreArchivo.toLowerCase().match(/\.(mp4|avi|mov|wmv|webm|ogg)$/)) {
              tipoArchivo = 'video';
            }
          }
          updatedAnuncio.tipoArchivo = tipoArchivo;
          needsUpdate = true;
        }

        if (anuncio.archivo && !anuncio.thumbnail) {
          try {
            updatedAnuncio.thumbnail = await generateThumbnail(anuncio.archivo, updatedAnuncio.tipoArchivo);
            needsUpdate = true;
          } catch (error) {
            console.warn(`⚠️ No se pudo generar thumbnail para anuncio ${anuncio.id}:`, error);
          }
        }

        if (needsUpdate) {
          await announcementsAPI.update(anuncio.id || anuncio._id, updatedAnuncio, true);
          reparados++;
        }
      }

      setMessage(`✅ ${reparados} anuncios reparados`);
      cargarAnuncios();
      toast({
        title: 'Éxito',
        description: `${reparados} anuncios reparados correctamente`,
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error reparando anuncios:', error);
      setMessage('❌ Error al reparar anuncios');
    }
  };

  // Filtrar anuncios
  const filteredAnuncios = anuncios.filter(ann => {
    const searchLower = searchTerm.toLowerCase();
    const matchSearch = searchLower === '' ||
      ann.titulo?.toLowerCase().includes(searchLower) ||
      ann.contenido?.toLowerCase().includes(searchLower) ||
      ann.categoria?.toLowerCase().includes(searchLower);
    const matchEstado = filtroEstado === 'todos' || ann.estado === filtroEstado;
    const matchDestacado = filtroDestacado === 'todos' ||
      (filtroDestacado === 'destacados' && ann.destacado === true) ||
      (filtroDestacado === 'no-destacados' && ann.destacado === false);
    const matchCategoria = filtroCategoria === 'todas' || ann.categoria === filtroCategoria;
    return matchSearch && matchEstado && matchDestacado && matchCategoria;
  });

  const formatFecha = (dateString) => {
    if (!dateString) return 'Sin fecha';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'publicado': return 'green';
      case 'borrador': return 'yellow';
      case 'archivado': return 'gray';
      default: return 'blue';
    }
  };

  const getEstadoLabel = (estado) => {
    switch (estado) {
      case 'publicado': return '📢 Publicado';
      case 'borrador': return '📝 Borrador';
      case 'archivado': return '🗄️ Archivado';
      default: return estado;
    }
  };

  const renderArchivoTabla = (anuncio) => {
    const primerArchivo = getPrimerArchivo(anuncio);
    const id = anuncio.id || anuncio._id;
    let smallUrl = previews[id] || primerArchivo?.thumbnail || primerArchivo?.url;
    let esVideo = primerArchivo?.esVideo;
    let esGif = primerArchivo?.esGif;
    let tipoLabel = esGif ? 'GIF' : (esVideo ? '🎥' : 'IMG');
    let tieneArchivo = !!(primerArchivo || anuncio.archivo || (anuncio.multimedia?.length > 0));

    if (!smallUrl) {
      return (
        <Box
          position="relative"
          boxSize="60px"
          bg="gray.100"
          borderRadius="md"
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexDirection="column"
          p={1}
        >
          <Text fontSize="xs" color="gray.500" textAlign="center">
            {tieneArchivo ? 'Vista previa' : 'Sin archivo'}
          </Text>
          {tieneArchivo && (
            <Badge
              colorScheme={esGif ? 'green' : esVideo ? 'red' : 'blue'}
              fontSize="xs"
              mt={1}
            >
              {tipoLabel}
            </Badge>
          )}
        </Box>
      );
    }

    return (
      <Box position="relative" boxSize="60px" borderRadius="md" overflow="hidden">
        {esVideo ? (
          <video
            src={smallUrl}
            preload="metadata"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            title={anuncio.nombreArchivo}
          />
        ) : (
          <Image
            src={smallUrl}
            alt={`Vista previa ${tipoLabel}`}
            boxSize="60px"
            objectFit="cover"
            borderRadius="md"
            cursor="pointer"
            onClick={() => window.open(primerArchivo?.url || smallUrl, '_blank')}
            title={`Haz clic para ver completo`}
            fallback={
              <Box
                boxSize="60px"
                bg="gray.100"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Spinner size="sm" />
              </Box>
            }
          />
        )}
        <Badge
          position="absolute"
          bottom={1}
          right={1}
          colorScheme={esGif ? 'green' : esVideo ? 'red' : 'blue'}
          fontSize="xs"
          opacity={0.9}
          px={1}
        >
          {tipoLabel}
        </Badge>
      </Box>
    );
  };

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        {/* Cabecera con título y botones */}
        <HStack justify="space-between" wrap="wrap" spacing={4}>
          <Heading size="lg">📢 Gestión de Anuncios</Heading>
          <HStack spacing={2}>
            <Button
              colorScheme="orange"
              variant="outline"
              size="sm"
              onClick={() => {
                localStorage.removeItem('euforia_token');
                localStorage.removeItem('euforia_user');
                window.location.reload();
              }}
            >
              🔄 Reconectar Sesión
            </Button>
            <Button colorScheme="blue" onClick={handleCreate} leftIcon={<AddIcon />}>
              Nuevo Anuncio
            </Button>
          </HStack>
        </HStack>

        {message && (
          <Alert status={message.includes('✅') ? 'success' : message.includes('❌') ? 'error' : 'info'} borderRadius="md">
            <AlertIcon />
            {message}
          </Alert>
        )}

        <HStack spacing={4}>
          <InputGroup maxW="500px">
            <Input
              placeholder="Buscar anuncios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <InputRightElement>
              <SearchIcon color="gray.500" />
            </InputRightElement>
          </InputGroup>

          <Button
            size="sm"
            colorScheme="orange"
            variant="outline"
            onClick={limpiarCacheLocal}
            title="Limpiar caché para liberar espacio"
          >
            🧹 Limpiar Caché
          </Button>

          <Button
            size="sm"
            colorScheme="green"
            variant="outline"
            onClick={repararAnunciosAntiguos}
            title="Reparar anuncios antiguos con problemas de imágenes y generar previews"
          >
            🔧 Reparar Anuncios
          </Button>
        </HStack>

        {/* Filtros */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="100%">
          <FormControl>
            <FormLabel fontSize="sm" mb={1}>Filtrar por estado</FormLabel>
            <Select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              size="sm"
            >
              <option value="todos">Todos los estados</option>
              <option value="publicado">📢 Publicados</option>
              <option value="borrador">📝 Borradores</option>
              <option value="archivado">🗄️ Archivados</option>
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm" mb={1}>Filtrar por destacado</FormLabel>
            <Select
              value={filtroDestacado}
              onChange={(e) => setFiltroDestacado(e.target.value)}
              size="sm"
            >
              <option value="todos">Todos</option>
              <option value="destacados">⭐ Solo destacados</option>
              <option value="no-destacados">No destacados</option>
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm" mb={1}>Filtrar por categoría</FormLabel>
            <Select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              size="sm"
            >
              <option value="todas">Todas las categorías</option>
              {categorias.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </Select>
          </FormControl>
        </SimpleGrid>

        <Card>
          <CardBody>
            {loading ? (
              <Box textAlign="center" py={8}>
                <Spinner size="xl" />
                <Text mt={4}>Cargando anuncios...</Text>
              </Box>
            ) : filteredAnuncios.length === 0 ? (
              <Box textAlign="center" py={8}>
                <Text fontSize="lg" color="gray.500">
                  No hay anuncios con los filtros seleccionados
                </Text>
                <Button mt={4} colorScheme="blue" onClick={handleCreate}>
                  Crear nuevo anuncio
                </Button>
              </Box>
            ) : (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Fechas</Th>
                    <Th>Anuncio</Th>
                    <Th>Categoría</Th>
                    <Th>Estado</Th>
                    <Th>Archivo</Th>
                    <Th>Acciones</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredAnuncios.map((anuncio) => (
                    <Tr key={anuncio.id || anuncio._id}>
                      <Td>
                        <VStack align="start" spacing={2}>
                          <Box>
                            <Text fontSize="xs" color="gray.500" mb={0.5}>
                              📅 Publicación:
                            </Text>
                            <Text fontWeight="medium" fontSize="sm">
                              {formatFecha(anuncio.fecha || anuncio.createdAt)}
                            </Text>
                          </Box>
                          {anuncio.fechaEvento && (
                            <Box>
                              <Text fontSize="xs" color="blue.600" fontWeight="medium" mb={0.5}>
                                🗓️ Evento:
                              </Text>
                              <Text fontSize="sm" color="blue.700">
                                {formatFecha(anuncio.fechaEvento)}
                              </Text>
                            </Box>
                          )}
                        </VStack>
                      </Td>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <HStack spacing={2}>
                            <Text fontWeight="medium">{anuncio.titulo}</Text>
                            {anuncio.destacado && (
                              <Badge
                                colorScheme="yellow"
                                fontSize="xs"
                                display="flex"
                                alignItems="center"
                                gap={1}
                              >
                                ⭐ Destacado
                              </Badge>
                            )}
                          </HStack>
                          <Text fontSize="sm" color="gray.600" noOfLines={2} mt={1}>
                            {anuncio.contenido?.substring(0, 80)}...
                          </Text>
                        </VStack>
                      </Td>
                      <Td>
                        <Badge colorScheme="purple">
                          {anuncio.categoria || 'General'}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme={getEstadoColor(anuncio.estado)}>
                          {getEstadoLabel(anuncio.estado)}
                        </Badge>
                      </Td>
                      <Td>
                        {renderArchivoTabla(anuncio)}
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <IconButton
                            icon={<EditIcon />}
                            size="sm"
                            colorScheme="blue"
                            onClick={() => handleEdit(anuncio)}
                          />
                          <IconButton
                            icon={<DeleteIcon />}
                            size="sm"
                            colorScheme="red"
                            onClick={() => handleDelete(anuncio.id || anuncio._id)}
                          />
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </CardBody>
        </Card>

        {/* Modal de creación/edición */}
        <Modal isOpen={isOpen} onClose={handleCloseModal} size="xl">
          <ModalOverlay />
          <ModalContent maxH="90vh" overflowY="auto">
            <form onSubmit={handleSubmit}>
              <ModalHeader>
                {editing ? '✏️ Editar Anuncio' : '➕ Nuevo Anuncio'}
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Título del anuncio</FormLabel>
                    <Input
                      value={formData.titulo}
                      onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                      placeholder="Ej: Taller de derechos humanos"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Contenido</FormLabel>
                    <Textarea
                      value={formData.contenido}
                      onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
                      placeholder="Descripción detallada del anuncio..."
                      rows={4}
                    />
                  </FormControl>

                  <SimpleGrid columns={2} spacing={4} width="100%">
                    <FormControl>
                      <FormLabel>Categoría</FormLabel>
                      <Select
                        value={formData.categoria}
                        onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                      >
                        {categorias.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Estado</FormLabel>
                      <Select
                        value={formData.estado}
                        onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                      >
                        <option value="publicado">📢 Publicado</option>
                        <option value="borrador">📝 Borrador</option>
                        <option value="archivado">🗄️ Archivado</option>
                      </Select>
                    </FormControl>
                  </SimpleGrid>

                  <FormControl>
                    <FormLabel>Fecha del evento (opcional)</FormLabel>
                    <Input
                      type="date"
                      value={formData.fechaEvento}
                      onChange={(e) => setFormData({ ...formData, fechaEvento: e.target.value })}
                    />
                  </FormControl>

                  <FormControl display="flex" alignItems="center">
                    <Switch
                      isChecked={formData.destacado}
                      onChange={(e) => setFormData({ ...formData, destacado: e.target.checked })}
                      colorScheme="yellow"
                      mr={3}
                    />
                    <FormLabel mb={0}>Destacar este anuncio</FormLabel>
                  </FormControl>

                  {/* Sección de archivos múltiples MEJORADA */}
                  <FormControl>
                    <FormLabel>Archivos multimedia (opcional)</FormLabel>
                    <Input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={handleFileChange}
                      py={1}
                      mb={2}
                    />
                    <Text fontSize="sm" color="gray.500" mt={1}>
                      Puedes seleccionar varios archivos (JPG, PNG, GIF, WEBP, MP4, AVI, MOV, máx 50MB c/u). 
                      Máximo {MAX_FILES} archivos.
                    </Text>

                    {archivosSeleccionados.length > 0 && (
                      <>
                        <Text fontSize="sm" fontWeight="bold" mt={3}>
                          {archivosSeleccionados.length} archivo(s) seleccionado(s)
                        </Text>
                        <SimpleGrid columns={{ base: 2, md: 3 }} spacing={3} mt={4}>
                          {archivosSeleccionados.map((item) => (
                            <Box
                              key={item.id}
                              position="relative"
                              border="1px solid"
                              borderColor="gray.200"
                              borderRadius="md"
                              p={2}
                            >
                              {item.tipo.startsWith('image/') ? (
                                <Image
                                  src={item.preview || item.url}
                                  alt={item.nombre}
                                  boxSize="80px"
                                  objectFit="cover"
                                  borderRadius="md"
                                />
                              ) : item.tipo.startsWith('video/') ? (
                                <Box
                                  boxSize="80px"
                                  bg="gray.900"
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                  borderRadius="md"
                                >
                                  <video src={item.preview || item.url} style={{ maxWidth: '100%', maxHeight: '100%' }} />
                                </Box>
                              ) : null}
                              <Badge
                                position="absolute"
                                top={1}
                                right={1}
                                colorScheme={item.tipo.startsWith('video/') ? 'red' : item.tipo === 'image/gif' ? 'green' : 'blue'}
                              >
                                {item.tipo.startsWith('video/') ? '🎥' : item.tipo === 'image/gif' ? 'GIF' : 'IMG'}
                              </Badge>
                              <Tooltip label="Eliminar archivo">
                                <IconButton
                                  icon={<CloseIcon />}
                                  size="xs"
                                  colorScheme="red"
                                  position="absolute"
                                  top={1}
                                  left={1}
                                  onClick={() => eliminarArchivo(item.id)}
                                  aria-label="Eliminar"
                                />
                              </Tooltip>
                              <Text fontSize="xs" noOfLines={1} mt={1}>
                                {item.nombre}
                              </Text>
                            </Box>
                          ))}
                        </SimpleGrid>
                      </>
                    )}

                    {/* Barra de progreso durante el procesamiento */}
                    {processingFiles && uploadProgress > 0 && (
                      <Box mt={4}>
                        <Progress value={uploadProgress} size="sm" colorScheme="blue" borderRadius="md" />
                        <Text fontSize="sm" mt={1} textAlign="center">
                          Procesando archivos... {uploadProgress}%
                        </Text>
                      </Box>
                    )}
                  </FormControl>
                </VStack>
              </ModalBody>

              <ModalFooter>
                <Button variant="outline" mr={3} onClick={handleCloseModal}>
                  Cancelar
                </Button>
                <Button
                  colorScheme="blue"
                  type="submit"
                  isLoading={submitting}
                  loadingText="Guardando..."
                >
                  {editing ? 'Actualizar' : 'Crear Anuncio'}
                </Button>
              </ModalFooter>
            </form>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  );
};

export default GestionAnuncios;