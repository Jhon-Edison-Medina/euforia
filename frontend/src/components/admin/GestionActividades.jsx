import React, { useState, useEffect } from 'react';
import {
  Box, VStack, Heading, Text, Button, Card, CardBody,
  Table, Thead, Tbody, Tr, Th, Td, Badge, HStack,
  IconButton, useDisclosure, Modal, ModalOverlay,
  ModalContent, ModalHeader, ModalFooter, ModalBody,
  ModalCloseButton, FormControl, FormLabel, Input,
  Textarea, Select, Alert, AlertIcon, Spinner,
  InputGroup, InputLeftAddon, SimpleGrid, Image,
  Tooltip, Progress, useToast
} from '@chakra-ui/react';
import { DeleteIcon, EditIcon, CloseIcon } from '@chakra-ui/icons';
import { activitiesAPI } from '../../services/api';
import { subirArchivoMultimedia } from '../../services/cloudinary';

// Límite máximo de archivos
const MAX_FILES = 10;

const GestionActividades = () => {
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [currentActividad, setCurrentActividad] = useState(null);
  const [message, setMessage] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fecha: '',
    hora: '',
    duracion: '',
    ubicacion: '',
    tipo: 'taller',
    categoria: 'educacion',
    cupo: '',
    estado: 'programada'
  });
  const [archivosSeleccionados, setArchivosSeleccionados] = useState([]);
  const [modoEdicionAntiguo, setModoEdicionAntiguo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingFiles, setProcessingFiles] = useState(false);

  const tiposActividad = [
    { value: 'taller', label: '🎨 Taller' },
    { value: 'charla', label: '💬 Charla' },
    { value: 'evento', label: '🎉 Evento' },
    { value: 'curso', label: '📚 Curso' },
    { value: 'reunion', label: '👥 Reunión' }
  ];

  const categorias = [
    { value: 'educacion', label: '📚 Educación' },
    { value: 'derechos', label: '⚖️ Derechos Humanos' },
    { value: 'genero', label: '♀️ Género' },
    { value: 'comunidad', label: '👥 Comunidad' },
    { value: 'salud', label: '🏥 Salud' },
    { value: 'cultural', label: '🎭 Cultural' }
  ];

  useEffect(() => {
    cargarActividades();
  }, []);

  // Limpiar object URLs al desmontar
  useEffect(() => {
    return () => {
      archivosSeleccionados.forEach(item => {
        if (item.preview && !item.existente) {
          URL.revokeObjectURL(item.preview);
        }
      });
    };
  }, [archivosSeleccionados]);

  const cargarActividades = async () => {
    setLoading(true);
    try {
      const response = await activitiesAPI.getAllAdmin();
      const sorted = (response.data || []).sort((a, b) => 
        new Date(b.fecha) - new Date(a.fecha)
      );
      setActividades(sorted);
    } catch (error) {
      console.error('Error cargando actividades:', error);
      setMessage('❌ Error al cargar actividades');
    }
    setLoading(false);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (archivosSeleccionados.length + files.length > MAX_FILES) {
      setMessage(`❌ Solo se permiten hasta ${MAX_FILES} archivos.`);
      e.target.value = '';
      return;
    }

    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const validVideoTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/webm', 'video/ogg'];
    const validDocumentTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    const validTypes = [...validImageTypes, ...validVideoTypes, ...validDocumentTypes];
    const maxSize = 50 * 1024 * 1024; // 50MB

    const nuevos = [];
    files.forEach(file => {
      if (!validTypes.includes(file.type.toLowerCase()) && !file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        setMessage(`❌ Formato no soportado: ${file.type}`);
        return;
      }
      if (file.size > maxSize) {
        setMessage(`❌ El archivo ${file.name} es muy grande (${(file.size / (1024 * 1024)).toFixed(2)}MB). Máximo: 50MB`);
        return;
      }

      const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
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
    e.target.value = '';
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
    setSubmitting(true);
    setMessage('');

    if (!formData.titulo.trim() || !formData.descripcion.trim() || !formData.tipo || !formData.categoria) {
      setMessage('❌ Título, descripción, tipo y categoría son obligatorios');
      setSubmitting(false);
      return;
    }

    setProcessingFiles(true);
    setUploadProgress(0);

    try {
      const multimediaFinal = [];
      const errores = [];

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
      }

      const actividadData = {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        fecha: formData.fecha ? new Date(formData.fecha).toISOString() : null,
        hora: formData.hora,
        duracion: formData.duracion,
        ubicacion: formData.ubicacion,
        tipo: formData.tipo,
        categoria: formData.categoria,
        cupo: formData.cupo ? parseInt(formData.cupo) : null,
        estado: formData.estado,
        multimedia: multimediaFinal
      };

      let result;
      if (editing && currentActividad) {
        result = await activitiesAPI.update(currentActividad.id || currentActividad._id, actividadData);
      } else {
        result = await activitiesAPI.create(actividadData);
      }

      setMessage('✅ Actividad guardada correctamente');
      await cargarActividades();
      handleCloseModal();

      toast({
        title: 'Éxito',
        description: editing ? 'Actividad actualizada correctamente' : 'Actividad creada correctamente',
        status: 'success',
        duration: 3000,
      });

    } catch (error) {
      console.error('Error guardando actividad:', error);
      setMessage(`❌ ${error.message || 'Error al guardar la actividad'}`);
      toast({
        title: 'Error',
        description: error.message || 'Error al guardar la actividad',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setSubmitting(false);
      setProcessingFiles(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta actividad?')) {
      try {
        await activitiesAPI.delete(id);
        setMessage('✅ Actividad eliminada correctamente');
        cargarActividades();
      } catch (error) {
        setMessage('❌ Error al eliminar la actividad');
      }
    }
  };

  const handleEdit = (actividad) => {
    setEditing(true);
    setCurrentActividad(actividad);
    setModoEdicionAntiguo(false);
    setArchivosSeleccionados([]);

    if (actividad.multimedia && actividad.multimedia.length > 0) {
      const multimediaCargado = actividad.multimedia.map(m => ({
        id: m._id || Date.now() + Math.random(),
        url: m.url,
        tipo: m.tipo,
        nombre: m.nombre,
        tamaño: m.tamaño,
        thumbnail: m.thumbnail,
        existente: true
      }));
      setArchivosSeleccionados(multimediaCargado);
    } else if (actividad.materiales && actividad.materiales.length > 0) {
      // Compatibilidad con actividades antiguas que usaban 'materiales'
      const multimediaAntiguo = actividad.materiales.map(m => ({
        id: m._id || Date.now() + Math.random(),
        url: m.archivo || m.url,
        tipo: m.tipo || m.tipoArchivo || 'image',
        nombre: m.nombre || 'archivo',
        tamaño: m.tamaño || 0,
        thumbnail: m.thumbnail || null,
        existente: true
      }));
      setArchivosSeleccionados(multimediaAntiguo);
      setModoEdicionAntiguo(true);
    }

    setFormData({
      titulo: actividad.titulo || '',
      descripcion: actividad.descripcion || '',
      fecha: actividad.fecha ? actividad.fecha.split('T')[0] : '',
      hora: actividad.hora || '',
      duracion: actividad.duracion || '',
      ubicacion: actividad.ubicacion || '',
      tipo: actividad.tipo || 'taller',
      categoria: actividad.categoria || 'educacion',
      cupo: actividad.cupo || '',
      estado: actividad.estado || 'programada'
    });
    onOpen();
  };

  const handleCreate = () => {
    setEditing(false);
    setCurrentActividad(null);
    setArchivosSeleccionados([]);
    setModoEdicionAntiguo(false);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setFormData({
      titulo: '',
      descripcion: '',
      fecha: tomorrow.toISOString().split('T')[0],
      hora: '15:00',
      duracion: '2',
      ubicacion: 'Sede Euforia - Soacha',
      tipo: 'taller',
      categoria: 'educacion',
      cupo: '20',
      estado: 'programada'
    });
    onOpen();
  };

  const handleCloseModal = () => {
    archivosSeleccionados.forEach(item => {
      if (item.preview && !item.existente) {
        URL.revokeObjectURL(item.preview);
      }
    });
    onClose();
    setEditing(false);
    setCurrentActividad(null);
    setArchivosSeleccionados([]);
    setModoEdicionAntiguo(false);
    setFormData({
      titulo: '',
      descripcion: '',
      fecha: '',
      hora: '',
      duracion: '',
      ubicacion: '',
      tipo: 'taller',
      categoria: 'educacion',
      cupo: '',
      estado: 'programada'
    });
    setMessage('');
    setUploadProgress(0);
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

  const formatFecha = (fechaString) => {
    if (!fechaString) return 'Sin fecha';
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderArchivoTabla = (actividad) => {
    const multimedia = actividad.multimedia || actividad.materiales || [];
    if (multimedia.length > 0) {
      const primero = multimedia[0];
      const esImagen = primero.tipo?.startsWith('image/') || primero.archivo?.startsWith('data:image');
      const esVideo = primero.tipo?.startsWith('video/');
      const url = primero.thumbnail || primero.url || primero.archivo;
      return (
        <Box position="relative" boxSize="60px" borderRadius="md" overflow="hidden">
          {esVideo ? (
            <video src={url} preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : esImagen ? (
            <Image src={url} alt={primero.nombre} boxSize="60px" objectFit="cover" />
          ) : (
            <Box boxSize="60px" bg="gray.100" display="flex" alignItems="center" justifyContent="center">
              <Text fontSize="2xl">📎</Text>
            </Box>
          )}
          {multimedia.length > 1 && (
            <Badge position="absolute" bottom={1} right={1} colorScheme="blue" fontSize="xs">+{multimedia.length-1}</Badge>
          )}
        </Box>
      );
    }
    return <Box boxSize="60px" bg="gray.100" borderRadius="md" />;
  };

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between">
          <Heading size="lg">🎯 Gestión de Actividades</Heading>
          <Button colorScheme="green" onClick={handleCreate}>
            + Nueva Actividad
          </Button>
        </HStack>

        {message && (
          <Alert status={message.includes('✅') ? 'success' : message.includes('❌') ? 'error' : 'info'} borderRadius="md">
            <AlertIcon />
            {message}
          </Alert>
        )}

        <Card>
          <CardBody>
            {loading ? (
              <Box textAlign="center" py={8}>
                <Spinner size="xl" />
                <Text mt={4}>Cargando actividades...</Text>
              </Box>
            ) : actividades.length === 0 ? (
              <Box textAlign="center" py={8}>
                <Text fontSize="lg" color="gray.500">
                  No hay actividades programadas
                </Text>
                <Button mt={4} colorScheme="green" onClick={handleCreate}>
                  Crear primera actividad
                </Button>
              </Box>
            ) : (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Archivos</Th>
                    <Th>Fecha</Th>
                    <Th>Actividad</Th>
                    <Th>Tipo</Th>
                    <Th>Ubicación</Th>
                    <Th>Estado</Th>
                    <Th>Acciones</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {actividades.map((actividad) => (
                    <Tr key={actividad.id || actividad._id}>
                      <Td>{renderArchivoTabla(actividad)}</Td>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="bold">{formatFecha(actividad.fecha)}</Text>
                          {actividad.hora && (
                            <Text fontSize="sm" color="gray.600">
                              🕒 {actividad.hora}
                            </Text>
                          )}
                        </VStack>
                      </Td>
                      <Td>
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="medium">{actividad.titulo}</Text>
                          <Text fontSize="sm" color="gray.600" noOfLines={1}>
                            {actividad.descripcion?.substring(0, 50)}...
                          </Text>
                        </VStack>
                      </Td>
                      <Td>
                        <Badge colorScheme="purple">
                          {tiposActividad.find(t => t.value === actividad.tipo)?.label || actividad.tipo}
                        </Badge>
                      </Td>
                      <Td>
                        <Text fontSize="sm">{actividad.ubicacion}</Text>
                      </Td>
                      <Td>
                        <Badge colorScheme={getEstadoColor(actividad.estado)}>
                          {getEstadoLabel(actividad.estado)}
                        </Badge>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <IconButton
                            icon={<EditIcon />}
                            size="sm"
                            colorScheme="blue"
                            onClick={() => handleEdit(actividad)}
                          />
                          <IconButton
                            icon={<DeleteIcon />}
                            size="sm"
                            colorScheme="red"
                            onClick={() => handleDelete(actividad.id || actividad._id)}
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

        {/* Modal */}
        <Modal isOpen={isOpen} onClose={handleCloseModal} size="xl">
          <ModalOverlay />
          <ModalContent maxH="90vh" overflowY="auto">
            <form onSubmit={handleSubmit}>
              <ModalHeader>
                {editing ? '✏️ Editar Actividad' : '➕ Nueva Actividad'}
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Título de la actividad</FormLabel>
                    <Input
                      value={formData.titulo}
                      onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                      placeholder="Taller de derechos humanos"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Descripción</FormLabel>
                    <Textarea
                      value={formData.descripcion}
                      onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                      placeholder="Descripción detallada de la actividad..."
                      rows={3}
                    />
                  </FormControl>

                  <SimpleGrid columns={2} spacing={4} width="100%">
                    <FormControl>
                      <FormLabel>Fecha</FormLabel>
                      <Input
                        type="date"
                        value={formData.fecha}
                        onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Hora</FormLabel>
                      <Input
                        type="time"
                        value={formData.hora}
                        onChange={(e) => setFormData({...formData, hora: e.target.value})}
                      />
                    </FormControl>
                  </SimpleGrid>

                  <SimpleGrid columns={2} spacing={4} width="100%">
                    <FormControl>
                      <FormLabel>Duración (horas)</FormLabel>
                      <Input
                        type="number"
                        value={formData.duracion}
                        onChange={(e) => setFormData({...formData, duracion: e.target.value})}
                        placeholder="2"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Cupo máximo</FormLabel>
                      <Input
                        type="number"
                        value={formData.cupo}
                        onChange={(e) => setFormData({...formData, cupo: e.target.value})}
                        placeholder="20"
                      />
                    </FormControl>
                  </SimpleGrid>

                  <FormControl>
                    <FormLabel>Ubicación</FormLabel>
                    <Input
                      value={formData.ubicacion}
                      onChange={(e) => setFormData({...formData, ubicacion: e.target.value})}
                      placeholder="Sede Euforia, Soacha"
                    />
                  </FormControl>

                  <SimpleGrid columns={2} spacing={4} width="100%">
                    <FormControl isRequired>
                      <FormLabel>Tipo</FormLabel>
                      <Select
                        value={formData.tipo}
                        onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                      >
                        {tiposActividad.map((tipo) => (
                          <option key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Categoría</FormLabel>
                      <Select
                        value={formData.categoria}
                        onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                      >
                        {categorias.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                  </SimpleGrid>

                  <FormControl isRequired>
                    <FormLabel>Estado</FormLabel>
                    <Select
                      value={formData.estado}
                      onChange={(e) => setFormData({...formData, estado: e.target.value})}
                    >
                      <option value="programada">📅 Programada</option>
                      <option value="en-curso">⏳ En curso</option>
                      <option value="completada">✅ Completada</option>
                      <option value="cancelada">❌ Cancelada</option>
                    </Select>
                  </FormControl>

                  {/* Sección de Archivos Multimedia */}
                  <FormControl>
                    <FormLabel>Materiales de apoyo (opcional)</FormLabel>
                    <Input
                      type="file"
                      accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                      multiple
                      onChange={handleFileChange}
                      py={1}
                      mb={2}
                    />
                    <Text fontSize="sm" color="gray.500" mt={1}>
                      Puedes adjuntar múltiples archivos (imágenes, videos, documentos). Máximo {MAX_FILES} archivos, 50MB cada uno.
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
                              ) : (
                                <Box
                                  boxSize="80px"
                                  bg="gray.100"
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                  borderRadius="md"
                                >
                                  <Text fontSize="3xl">📄</Text>
                                </Box>
                              )}
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
                <Button colorScheme="green" type="submit" isLoading={submitting} loadingText="Guardando...">
                  {editing ? 'Actualizar' : 'Crear Actividad'}
                </Button>
              </ModalFooter>
            </form>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  );
};

export default GestionActividades;