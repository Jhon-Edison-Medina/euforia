import React, { useState, useEffect } from 'react';
import {
  Box, VStack, Heading, Text, Button, Card, CardBody,
  Table, Thead, Tbody, Tr, Th, Td, Badge, HStack,
  IconButton, useDisclosure, Modal, ModalOverlay,
  ModalContent, ModalHeader, ModalFooter, ModalBody,
  ModalCloseButton, FormControl, FormLabel, Input,
  Textarea, Select, Alert, AlertIcon, Spinner,
  Image, SimpleGrid, Tooltip, Progress, useToast
} from '@chakra-ui/react';
import { DeleteIcon, EditIcon, CloseIcon, DownloadIcon } from '@chakra-ui/icons';
import { resourcesAPI } from '../../services/api';
import { subirArchivoMultimedia } from '../../services/cloudinary';

// Límite máximo de archivos
const MAX_FILES = 10;

const GestionRecursos = () => {
  const [recursos, setRecursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [currentRecurso, setCurrentRecurso] = useState(null);
  const [message, setMessage] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'documento',
    categoria: 'educacion',
    url: '',
    estado: 'publicado'
  });
  const [archivosSeleccionados, setArchivosSeleccionados] = useState([]);
  const [modoEdicionAntiguo, setModoEdicionAntiguo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingFiles, setProcessingFiles] = useState(false);

  const tiposRecurso = [
    { value: 'documento', label: '📄 Documento' },
    { value: 'video', label: '🎥 Video' },
    { value: 'audio', label: '🎵 Audio' },
    { value: 'enlace', label: '🔗 Enlace' },
    { value: 'imagen', label: '🖼️ Imagen' }
  ];

  const categorias = [
    { value: 'educacion', label: '📚 Educación' },
    { value: 'derechos', label: '⚖️ Derechos Humanos' },
    { value: 'genero', label: '♀️ Género' },
    { value: 'comunidad', label: '👥 Comunidad' },
    { value: 'salud', label: '🏥 Salud' },
    { value: 'medio_ambiente', label: '🌱 Medio Ambiente' }
  ];

  useEffect(() => {
    cargarRecursos();
    
    const handleUpdate = () => cargarRecursos();
    window.addEventListener('euforia_resources_updated', handleUpdate);
    
    return () => {
      window.removeEventListener('euforia_resources_updated', handleUpdate);
    };
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

  const cargarRecursos = async () => {
    setLoading(true);
    try {
      const response = await resourcesAPI.getAllAdmin();
      setRecursos(response.data || []);
    } catch (error) {
      console.error('Error cargando recursos:', error);
      setMessage('❌ Error al cargar recursos');
      
      // Fallback a localStorage
      try {
        const recursosGuardados = localStorage.getItem('euforia_resources');
        if (recursosGuardados) {
          setRecursos(JSON.parse(recursosGuardados));
        }
      } catch (fallbackError) {
        console.error('Error en fallback:', fallbackError);
      }
    }
    setLoading(false);
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
    const validDocumentTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
    const validAudioTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'];
    
    // Dependiendo del tipo seleccionado, validamos formatos
    const tipoSeleccionado = formData.tipo;
    let validTypes = [];
    if (tipoSeleccionado === 'imagen') {
      validTypes = validImageTypes;
    } else if (tipoSeleccionado === 'video') {
      validTypes = validVideoTypes;
    } else if (tipoSeleccionado === 'audio') {
      validTypes = validAudioTypes;
    } else if (tipoSeleccionado === 'documento') {
      validTypes = validDocumentTypes;
    } else {
      // Si es enlace, no se suben archivos
      setMessage(`❌ El tipo "enlace" no permite subir archivos.`);
      e.target.value = '';
      return;
    }

    const maxSize = 50 * 1024 * 1024; // 50MB

    const nuevos = [];
    files.forEach(file => {
      if (!validTypes.includes(file.type.toLowerCase()) && !file.type.startsWith(tipoSeleccionado + '/')) {
        setMessage(`❌ Formato no soportado para ${tipoSeleccionado}: ${file.type}`);
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

    // Validaciones
    if (!formData.titulo.trim()) {
      setMessage('❌ El título es obligatorio');
      setSubmitting(false);
      return;
    }
    if (!formData.descripcion.trim()) {
      setMessage('❌ La descripción es obligatoria');
      setSubmitting(false);
      return;
    }
    if (formData.tipo === 'enlace' && !formData.url.trim()) {
      setMessage('❌ La URL es obligatoria para enlaces');
      setSubmitting(false);
      return;
    }
    if (formData.tipo !== 'enlace' && archivosSeleccionados.length === 0 && !editing) {
      setMessage('❌ Debes subir al menos un archivo para este tipo de recurso');
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

      const recursoData = {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        tipo: formData.tipo,
        categoria: formData.categoria,
        estado: formData.estado,
        multimedia: multimediaFinal
      };

      if (formData.tipo === 'enlace') {
        recursoData.url = formData.url;
      }

      let result;
      if (editing && currentRecurso) {
        result = await resourcesAPI.update(currentRecurso.id || currentRecurso._id, recursoData);
      } else {
        result = await resourcesAPI.create(recursoData);
      }

      setMessage('✅ Recurso guardado correctamente');
      await cargarRecursos();
      handleCloseModal();

      toast({
        title: 'Éxito',
        description: editing ? 'Recurso actualizado correctamente' : 'Recurso creado correctamente',
        status: 'success',
        duration: 3000,
      });

    } catch (error) {
      console.error('Error guardando recurso:', error);
      setMessage(`❌ ${error.message || 'Error al guardar el recurso'}`);
      toast({
        title: 'Error',
        description: error.message || 'Error al guardar el recurso',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setSubmitting(false);
      setProcessingFiles(false);
    }
  };

  const handleEdit = (recurso) => {
    setEditing(true);
    setCurrentRecurso(recurso);
    setModoEdicionAntiguo(false);
    setArchivosSeleccionados([]);

    // Cargar multimedia existente
    if (recurso.multimedia && recurso.multimedia.length > 0) {
      const multimediaCargado = recurso.multimedia.map(m => ({
        id: m._id || Date.now() + Math.random(),
        url: m.url,
        tipo: m.tipo,
        nombre: m.nombre,
        tamaño: m.tamaño,
        thumbnail: m.thumbnail,
        existente: true
      }));
      setArchivosSeleccionados(multimediaCargado);
    } else if (recurso.archivo) {
      // Compatibilidad con recursos antiguos de un solo archivo
      const multimediaAntiguo = [{
        id: Date.now() + Math.random(),
        url: recurso.archivo,
        tipo: recurso.tipoArchivo || (recurso.nombreArchivo?.toLowerCase().endsWith('.gif') ? 'image/gif' : 'image'),
        nombre: recurso.nombreArchivo || 'archivo',
        tamaño: recurso.tamañoArchivo,
        thumbnail: null,
        existente: true
      }];
      setArchivosSeleccionados(multimediaAntiguo);
      setModoEdicionAntiguo(true);
    }

    setFormData({
      titulo: recurso.titulo || '',
      descripcion: recurso.descripcion || '',
      tipo: recurso.tipo || 'documento',
      categoria: recurso.categoria || 'educacion',
      url: recurso.url || '',
      estado: recurso.estado || 'publicado'
    });

    onOpen();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este recurso?')) return;
    try {
      setMessage('🔄 Eliminando recurso...');
      await resourcesAPI.delete(id);
      setMessage('✅ Recurso eliminado correctamente');
      toast({
        title: 'Éxito',
        description: 'Recurso eliminado correctamente',
        status: 'success',
        duration: 3000,
      });
      cargarRecursos();
    } catch (error) {
      console.error('Error eliminando recurso:', error);
      setMessage('❌ Error al eliminar el recurso');
      toast({
        title: 'Error',
        description: 'Error al eliminar el recurso',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleCreate = () => {
    setEditing(false);
    setCurrentRecurso(null);
    setArchivosSeleccionados([]);
    setModoEdicionAntiguo(false);
    setFormData({
      titulo: '',
      descripcion: '',
      tipo: 'documento',
      categoria: 'educacion',
      url: '',
      estado: 'publicado'
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
    setCurrentRecurso(null);
    setArchivosSeleccionados([]);
    setModoEdicionAntiguo(false);
    setFormData({
      titulo: '',
      descripcion: '',
      tipo: 'documento',
      categoria: 'educacion',
      url: '',
      estado: 'publicado'
    });
    setMessage('');
    setUploadProgress(0);
  };

  const getEstadoColor = (estado) => {
    switch(estado) {
      case 'publicado': return 'green';
      case 'borrador': return 'yellow';
      case 'archivado': return 'gray';
      default: return 'blue';
    }
  };

  const getTipoIcon = (tipo) => {
    const tipoObj = tiposRecurso.find(t => t.value === tipo);
    return tipoObj ? tipoObj.label.split(' ')[0] : '📄';
  };

  const renderArchivoTabla = (recurso) => {
    if (recurso.multimedia && recurso.multimedia.length > 0) {
      const primero = recurso.multimedia[0];
      const esImagen = primero.tipo.startsWith('image/');
      const esVideo = primero.tipo.startsWith('video/');
      const url = primero.thumbnail || primero.url;
      return (
        <Box position="relative" boxSize="60px" borderRadius="md" overflow="hidden">
          {esVideo ? (
            <video src={url} preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : esImagen ? (
            <Image src={url} alt={primero.nombre} boxSize="60px" objectFit="cover" />
          ) : (
            <Box boxSize="60px" bg="gray.100" display="flex" alignItems="center" justifyContent="center">
              <Text fontSize="2xl">📄</Text>
            </Box>
          )}
          {recurso.multimedia.length > 1 && (
            <Badge position="absolute" bottom={1} right={1} colorScheme="blue" fontSize="xs">+{recurso.multimedia.length-1}</Badge>
          )}
        </Box>
      );
    } else if (recurso.url) {
      return (
        <Box boxSize="60px" bg="gray.100" display="flex" alignItems="center" justifyContent="center" borderRadius="md">
          <Text fontSize="2xl">🔗</Text>
        </Box>
      );
    }
    return <Box boxSize="60px" bg="gray.100" borderRadius="md" />;
  };

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between">
          <Heading size="lg">📚 Gestión de Recursos</Heading>
          <Button colorScheme="blue" onClick={handleCreate}>
            + Nuevo Recurso
          </Button>
        </HStack>

        {message && (
          <Alert status={message.includes('✅') ? 'success' : message.includes('❌') ? 'error' : 'info'}>
            <AlertIcon />
            {message}
          </Alert>
        )}

        <Card>
          <CardBody>
            {loading ? (
              <Box textAlign="center" py={8}>
                <Spinner size="xl" />
                <Text mt={4}>Cargando recursos...</Text>
              </Box>
            ) : recursos.length === 0 ? (
              <Box textAlign="center" py={8}>
                <Text fontSize="lg" color="gray.500">
                  No hay recursos registrados
                </Text>
                <Button mt={4} colorScheme="blue" onClick={handleCreate}>
                  Crear Primer Recurso
                </Button>
              </Box>
            ) : (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Archivo</Th>
                    <Th>Título</Th>
                    <Th>Tipo</Th>
                    <Th>Categoría</Th>
                    <Th>Estado</Th>
                    <Th>Fecha</Th>
                    <Th>Acciones</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {recursos.map((recurso) => (
                    <Tr key={recurso.id || recurso._id}>
                      <Td>{renderArchivoTabla(recurso)}</Td>
                      <Td fontWeight="medium">{recurso.titulo}</Td>
                      <Td>
                        <Badge colorScheme="purple">
                          {tiposRecurso.find(t => t.value === recurso.tipo)?.label || recurso.tipo}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme="blue">
                          {categorias.find(c => c.value === recurso.categoria)?.label || recurso.categoria}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme={getEstadoColor(recurso.estado)}>
                          {recurso.estado}
                        </Badge>
                      </Td>
                      <Td>
                        {recurso.createdAt 
                          ? new Date(recurso.createdAt).toLocaleDateString('es-ES')
                          : 'N/A'
                        }
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <IconButton
                            icon={<EditIcon />}
                            size="sm"
                            colorScheme="blue"
                            onClick={() => handleEdit(recurso)}
                          />
                          <IconButton
                            icon={<DeleteIcon />}
                            size="sm"
                            colorScheme="red"
                            onClick={() => handleDelete(recurso.id || recurso._id)}
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
                {editing ? '✏️ Editar Recurso' : '➕ Nuevo Recurso'}
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Título</FormLabel>
                    <Input
                      value={formData.titulo}
                      onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                      placeholder="Título del recurso"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Descripción</FormLabel>
                    <Textarea
                      value={formData.descripcion}
                      onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                      placeholder="Descripción del recurso"
                      rows={3}
                    />
                  </FormControl>

                  <HStack width="100%" spacing={4}>
                    <FormControl isRequired>
                      <FormLabel>Tipo</FormLabel>
                      <Select
                        value={formData.tipo}
                        onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                      >
                        {tiposRecurso.map((tipo) => (
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
                  </HStack>

                  {formData.tipo === 'enlace' ? (
                    <FormControl isRequired>
                      <FormLabel>URL del recurso</FormLabel>
                      <Input
                        value={formData.url}
                        onChange={(e) => setFormData({...formData, url: e.target.value})}
                        placeholder="https://ejemplo.com/recurso"
                        type="url"
                      />
                    </FormControl>
                  ) : (
                    <FormControl>
                      <FormLabel>Archivos multimedia</FormLabel>
                      <Input
                        type="file"
                        accept={
                          formData.tipo === 'imagen' ? "image/*" :
                          formData.tipo === 'video' ? "video/*" :
                          formData.tipo === 'audio' ? "audio/*" :
                          formData.tipo === 'documento' ? ".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx" :
                          "*/*"
                        }
                        multiple
                        onChange={handleFileChange}
                        py={1}
                        mb={2}
                      />
                      <Text fontSize="sm" color="gray.500" mt={1}>
                        Puedes seleccionar varios archivos. Máximo {MAX_FILES} archivos, 50MB cada uno.
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
                  )}

                  <FormControl>
                    <FormLabel>Estado</FormLabel>
                    <Select
                      value={formData.estado}
                      onChange={(e) => setFormData({...formData, estado: e.target.value})}
                    >
                      <option value="publicado">📢 Publicado</option>
                      <option value="borrador">📝 Borrador</option>
                      <option value="archivado">🗄️ Archivado</option>
                    </Select>
                  </FormControl>
                </VStack>
              </ModalBody>

              <ModalFooter>
                <Button variant="outline" mr={3} onClick={handleCloseModal}>
                  Cancelar
                </Button>
                <Button colorScheme="blue" type="submit" isLoading={submitting} loadingText="Guardando...">
                  {editing ? 'Actualizar' : 'Crear'}
                </Button>
              </ModalFooter>
            </form>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  );
};

export default GestionRecursos;