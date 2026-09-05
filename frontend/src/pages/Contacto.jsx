import React from 'react';
import {
  Container, VStack, Heading, Text, Card, CardBody,
  SimpleGrid, Link, Box, Image
} from '@chakra-ui/react';

const Contacto = () => {
  const contactInfo = [
    {
      icon: '📧',
      title: 'Correo Electrónico',
      content: 'euforiacddhheducacion@gmail.com',
      link: 'mailto:euforiacddhheducacion@gmail.com',
      description: 'Escríbenos para consultas, colaboraciones o información sobre nuestras actividades'
    },
    {
      icon: '📍',
      title: 'Ubicación',
      content: 'Soacha, Cundinamarca, Colombia',
      link: null,
      description: 'Trabajamos en diferentes espacios comunitarios del municipio'
    },
    {
      icon: '🕐',
      title: 'Horarios de Atención',
      content: 'Lunes a Viernes: 8:00 AM - 5:00 PM\nSábados: 9:00 AM - 1:00 PM',
      link: null,
      description: 'Disponibilidad para reuniones y coordinación'
    }
  ];

  const redesSociales = [
    {
      name: 'Facebook',
      icon: '/assets/facebook.png',
      url: 'https://www.facebook.com/profile.php?id=100083302912878',
      user: 'Euforia DDHH Educación',
      description: 'Síguenos para noticias y eventos'
    },
    {
      name: 'Instagram', 
      icon: '/assets/instagram.png',
      url: 'https://www.instagram.com/euforiaddhheducacion/',
      user: '@euforiaddhheducacion',
      description: 'Mira nuestro trabajo en imágenes'
    },
    {
      name: 'TikTok',
      icon: '/assets/tik-tok.png',
      url: 'https://www.tiktok.com/@euforiaddhheducac6',
      user: '@euforiaddhheducac6',
      description: 'Contenido en video de nuestras actividades'
    }
  ];

  const colaboraciones = [
    {
      titulo: 'Voluntariado',
      descripcion: 'Únete a nuestro equipo y contribuye a la transformación social en Soacha',
      accion: 'Ser voluntario',
      link: 'mailto:euforiacddhheducacion@gmail.com?subject=Voluntariado'
    },
    {
      titulo: 'Propuestas',
      descripcion: '¿Tienes una idea para taller o actividad? Queremos escucharte',
      accion: 'Enviar propuesta',
      link: 'mailto:euforiacddhheducacion@gmail.com?subject=Propuesta'
    },
    {
      titulo: 'Colaboraciones',
      descripcion: 'Trabajemos juntos en proyectos comunitarios y educativos',
      accion: 'Colaborar',
      link: 'mailto:euforiacddhheducacion@gmail.com?subject=Colaboración'
    }
  ];

  return (
    <Container maxW="container.xl" py={10}>
      <VStack spacing={12}>
        
        {/* Header - Estilo Recursos */}
        <Box textAlign="center">
          <Heading as="h1" size="2xl" color="brand.secondary" mb={4}>
            📞 Contáctanos
          </Heading>
          <Text fontSize="xl" color="gray.600" maxW="2xl" mx="auto">
            Estamos aquí para responder tus preguntas, escuchar tus ideas y construir comunidad juntos
          </Text>
        </Box>

        {/* Información de Contacto - Estilo Recursos */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} w="100%">
          {contactInfo.map((item, index) => (
            <Card 
              key={index}
              border="2px solid"
              borderColor="brand.accent1"
              _hover={{ transform: 'translateY(-4px)', boxShadow: 'lg' }}
              transition="all 0.3s"
            >
              <CardBody textAlign="center">
                <Text fontSize="4xl" mb={4}>{item.icon}</Text>
                <Heading as="h3" size="md" mb={3} color="brand.secondary">
                  {item.title}
                </Heading>
                <Text color="gray.600" mb={4}>
                  {item.description}
                </Text>
                {item.link ? (
                  <Link
                    href={item.link}
                    color="brand.accent2"
                    fontWeight="bold"
                    fontSize="lg"
                    _hover={{ color: 'brand.accent5' }}
                  >
                    {item.content}
                  </Link>
                ) : (
                  <Text color="brand.secondary" fontWeight="medium" whiteSpace="pre-line">
                    {item.content}
                  </Text>
                )}
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>

        {/* Redes Sociales - Estilo Recursos */}
        <Box w="100%">
          <VStack spacing={8}>
            <Heading size="lg" color="brand.secondary" textAlign="center">
              Síguenos en redes sociales
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} w="100%">
              {redesSociales.map((red, index) => (
                <Card 
                  key={index}
                  border="2px solid"
                  borderColor="brand.accent1"
                  _hover={{ transform: 'translateY(-4px)', boxShadow: 'lg' }}
                  transition="all 0.3s"
                >
                  <CardBody textAlign="center">
                    <Image 
                      src={red.icon} 
                      alt={red.name}
                      boxSize="50px"
                      objectFit="contain"
                      mx="auto"
                      mb={4}
                    />
                    <Heading size="md" mb={2} color="brand.secondary">
                      {red.name}
                    </Heading>
                    <Text fontSize="sm" color="gray.600" mb={2}>
                      {red.user}
                    </Text>
                    <Text fontSize="sm" color="gray.500" mb={4}>
                      {red.description}
                    </Text>
                    <Link 
                      href={red.url}
                      isExternal
                      color="brand.accent2"
                      fontWeight="medium"
                      _hover={{ color: 'brand.accent5' }}
                    >
                      Seguir
                    </Link>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </VStack>
        </Box>

        {/* Formas de Colaborar - Estilo Recursos */}
        <Box w="100%">
          <VStack spacing={8}>
            <Heading size="lg" color="brand.secondary" textAlign="center">
              Formas de colaborar
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} w="100%">
              {colaboraciones.map((colab, index) => (
                <Card 
                  key={index}
                  border="2px solid"
                  borderColor="brand.accent1"
                  _hover={{ transform: 'translateY(-4px)', boxShadow: 'lg' }}
                  transition="all 0.3s"
                >
                  <CardBody textAlign="center">
                    <Heading as="h3" size="md" mb={3} color="brand.secondary">
                      {colab.titulo}
                    </Heading>
                    <Text color="gray.600" mb={4}>
                      {colab.descripcion}
                    </Text>
                    <Link
                      href={colab.link}
                      color="brand.accent2"
                      fontWeight="bold"
                      _hover={{ color: 'brand.accent5' }}
                    >
                      {colab.accion} →
                    </Link>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </VStack>
        </Box>

        {/* Información Adicional */}
        <Card bg="brand.secondary">
          <CardBody textAlign="center">
            <VStack spacing={4}>
              <Heading size="md" color="white">
                ¿Necesitas más información?
              </Heading>
              <Text color="white">
                No dudes en contactarnos para cualquier consulta sobre nuestras actividades, 
                talleres o formas de participación.
              </Text>
              <Link
                href="mailto:euforiacddhheducacion@gmail.com"
                color="brand.accent1"
                fontWeight="bold"
                fontSize="lg"
                _hover={{ color: 'white' }}
              >
                euforiacddhheducacion@gmail.com
              </Link>
            </VStack>
          </CardBody>
        </Card>

      </VStack>
    </Container>
  );
};

export default Contacto;