import React from 'react';
import {
  Box, Container, Heading, Text, VStack, Grid, GridItem,
  useBreakpointValue, UnorderedList, ListItem, Divider,
} from '@chakra-ui/react';

const QuienesSomos = () => {
  const backgroundImage = useBreakpointValue({
    base: "url('/assets/Fondo 2.jpg')",
    md: "url('/assets/Fondo 2.jpg')",
  });

  return (
    <Box>
      {/* Hero Section */}
      <Box
        bgImage={backgroundImage}
        bgSize="cover"
        bgPosition="center"
        bgRepeat="no-repeat"
        color="white"
        py={20}
        position="relative"
        _before={{
          content: '""',
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          bg: 'blackAlpha.600',
          zIndex: 0,
        }}
      >
        <Container maxW="container.xl" position="relative" zIndex={1}>
          <VStack spacing={4} textAlign="center">
            <Heading as="h1" size="2xl">Quiénes Somos</Heading>
            <Text fontSize="xl">Conoce más sobre nuestra misión y visión</Text>
          </VStack>
        </Container>
      </Box>

      {/* Sección principal: Nombre + Definición */}
      <Container maxW="container.xl" py={12}>
        <VStack spacing={8} align="start">
          <Text fontSize="lg">
            Decidimos tomar el nombre <strong>EUFORIA</strong> por diversas razones, una de ellas ha sido por la raíz
            de la palabra, creemos como el maestro Juan Felipe Prieto, que las palabras pueden guiarnos en el
            camino de las acciones por tanto hay que escucharlas y reconocerlas. Creemos que esta es una
            palabra que define los y las jóvenes a través de las generaciones. Cada una con diversas maneras
            de asumir el mundo y la realidad, pero siempre intentando tener un lugar en su realidad y en el mundo.
          </Text>

          <Box
            borderLeft="4px solid"
            borderColor="brand.primary"
            pl={6}
            py={2}
          >
            <Text fontStyle="italic" color="gray.600" mb={2}>
              Euforia, del francés [Euphorie] y del griego [εúφορíα]<br />
              <em>"sensación de bienestar"</em>, <em>"capacidad de aguante"</em>
            </Text>
            <Text mb={1}><strong>1.</strong> Sensación exteriorizada de optimismo y bienestar, producida a menudo por alguna satisfacción material o espiritual.</Text>
            <Text mb={3}><strong>2.</strong> Estado del ánimo propenso al optimismo.</Text>
            <Text><strong>Sinónimos:</strong> Júbilo – exaltación – regocijo – alegría</Text>
          </Box>
        </VStack>
      </Container>

      <Divider />

      {/* Misión y Visión */}
      <Box bg="brand.accent1" py={16}>
        <Container maxW="container.xl">
          <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={10}>
            <GridItem>
              <VStack spacing={4} align="start">
                <Heading as="h2" size="lg" color="brand.secondary">Misión</Heading>
                <Text>
                  Nuestra misión busca promover procesos educativos colectivos, basados en el encuentro de
                  saberes, teniendo en cuenta las experiencias particulares de los y las jóvenes de Soacha,
                  considerando la necesidad de reconocer diversas pedagogías transformadoras y fomentar el
                  acceso a la educación superior.
                </Text>
                <Text>
                  Una de las rutas que hemos considerado para esto, es el estudio de las pruebas saber 11,
                  la construcción de pensamiento crítico y la acción política, permitiendo que los asistentes
                  sean protagonistas de sus contextos. Además, hemos visto la necesidad de construir espacios
                  colectivos en los que se pueda pensar la academia y la cultura, como una manera de fomentar
                  el interés por estas temáticas en los y las jóvenes del municipio.
                </Text>
              </VStack>
            </GridItem>
            <GridItem>
              <VStack spacing={4} align="start">
                <Heading as="h2" size="lg" color="brand.secondary">Visión</Heading>
                <Text>
                  Buscamos ser un referente en la educación popular integral e inclusiva en nuestro territorio.
                  Trabajamos por la transformación de la realidad injusta, defendiendo los derechos, especialmente
                  el de la educación. En un contexto desigual, donde se hace necesaria la pedagogía.
                </Text>
                <Text>
                  Consideramos importante contribuir con la transformación social y la construcción de sistemas
                  democráticos a través de procesos educativos que valoren la diversidad y promuevan la equidad.
                </Text>
              </VStack>
            </GridItem>
          </Grid>
        </Container>
      </Box>

      {/* Objetivos */}
      <Container maxW="container.xl" py={12}>
        <VStack spacing={6} align="start">
          <Heading as="h2" size="lg" color="brand.primary">Objetivos</Heading>
          <UnorderedList spacing={4} pl={4}>
            <ListItem>
              Reconocer la importancia de la educación como una de las fuentes primordiales para la
              renovación de la realidad desigual de las sociedades en nuestros territorios.
            </ListItem>
            <ListItem>
              Fomentar la autoestima, la resiliencia y el trabajo en equipo de las y los jóvenes que hagan
              parte de nuestros equipos de trabajo, ya que lo intelectual va muy de la mano con lo emocional.
            </ListItem>
            <ListItem>
              Diseñar un plan de estudios que responda a los contextos y necesidades específicas de los y
              las jóvenes de Soacha, con el objetivo de mejorar sus resultados en la prueba saber once y
              aumentar sus oportunidades de acceso a la educación superior de calidad.
            </ListItem>
            <ListItem>
              Promover el análisis crítico entre los jóvenes de Soacha, incentivando su participación en
              debates y discusiones que aborden problemas sociales, políticos y económicos, con el fin de
              fortalecer su capacidad para interpretar y cuestionar su entorno.
            </ListItem>
            <ListItem>
              Establecer espacios de formación y discusión política donde los jóvenes puedan aprender
              sobre sus derechos, la estructura del sistema político y las maneras de involucrarse
              activamente en procesos democráticos, fomentando su participación y liderazgo en la
              comunidad de Soacha.
            </ListItem>
          </UnorderedList>
        </VStack>
      </Container>

      <Divider />

      {/* Trayectoria */}
      <Box bg="gray.50" py={16}>
        <Container maxW="container.xl">
          <VStack spacing={6} align="start">
            <Heading as="h2" size="lg" color="brand.primary">Trayectoria</Heading>
            <Text>
              Nuestro colectivo Euforia DD-HH fue una iniciativa que inició en la Institución Educativa
              Ricaurte en el año 2019, pero que toma cuerpo y se funda oficialmente el día <strong>12 de
              marzo del 2021</strong>, por iniciativa de Daniela Barón Avella y Fabio Andrés Delgado Mican.
            </Text>
            <Text>
              Su primera sede como Euforia fue en el barrio Julio Rincón, Soacha (Cundinamarca); así mismo,
              como coordinadores líderes los estudiantes de la Institución Educativa Ricaurte cursantes de
              grado undécimo. Nuestro principal objetivo es la formación en PRE–ICFES como respuesta a la
              necesidad de los jóvenes de Soacha de acceder a una educación superior pública, luego de esto
              y con el desarrollo sólido del proceso se establecen actividades de huerta y formación política.
            </Text>
            <Text>
              Durante el primer año, iniciamos en una bodega en el barrio Julio Rincón, la cual contaba con
              algunas sillas plásticas y un tablero, asistiendo 20 chicos estudiantes de los grados undécimo
              y décimo de la Institución Educativa Ricaurte ubicada en la comuna 6 de Soacha, con la
              participación y ayuda de los docentes Fabio Andrés Delgado Mican en el área de Sociales y
              lectura crítica, Ever Camilo Pinchao en el área de matemáticas y física. Por otra parte,
              contábamos con el apoyo de Daniela Barón Avella, trabajadora social, quien dirigía en el área
              de orientación vocacional y asistencia socioemocional a los estudiantes.
            </Text>
            <Text>
              Este proyecto está enfocado en la preparación a los jóvenes de Soacha en el examen de estado
              de la educación media, reconociendo la importancia de la prueba para el acceso a la educación
              superior pública, así como las oportunidades de profesionalización de los y las jóvenes.
            </Text>
            <Text>
              Lo que distingue al Programa de PRE-ICFES de Euforia para el año 2026 es su enfoque holístico
              y centrado en los jóvenes: más allá de enseñar el contenido del examen, los educadores del
              colectivo se dedican a cultivar habilidades, fomentar la confianza y brindar apoyo a las y los
              jóvenes de Soacha. A través de clases magistrales, huertas comunitarias, formaciones políticas
              y de género, así como simulacros del examen, los estudiantes no solo adquieren el conocimiento
              necesario, sino que desarrollan la resiliencia y la determinación necesaria para pensar en su
              futuro académico.
            </Text>
            <Text>
              El Programa de PRE-ICFES ha tenido un avance y reconocimiento en el territorio, llegando a más
              instituciones educativas y espacios culturales del municipio de Soacha. Los participantes del
              programa para el año 2024 han logrado puntajes sobresalientes en el examen ICFES, abriendo
              las puertas a universidades públicas como la Universidad Pedagógica Nacional, Universidad
              Distrital, Universidad Nacional Abierta y a Distancia, y la Escuela Superior de Administración
              Pública, en carreras como Licenciaturas en Artes, Sociales, Filosofía, Biología y Educación
              Infantil; así como ingenierías, comunicación social, entre otras.
            </Text>
            <Text>
              En un territorio donde la educación a menudo está fuera del alcance para muchos, el Grupo
              Cultural Euforia es una alternativa para que los jóvenes de Soacha accedan a una educación
              superior, con un compromiso con la educación popular y su formación cultural.
            </Text>
          </VStack>
        </Container>
      </Box>

      {/* Actividades */}
      <Container maxW="container.xl" py={12}>
        <VStack spacing={6} align="start">
          <Heading as="h2" size="lg" color="brand.primary">Actividades</Heading>
          <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={8} w="full">
            <GridItem>
              <VStack align="start" spacing={3}
                p={6} borderRadius="md" borderLeft="4px solid" borderColor="brand.primary" bg="gray.50">
                <Heading as="h3" size="md" color="brand.secondary">
                  Pre-Icfes popular e integral
                </Heading>
                <Text>
                  Durante la primera semana de marzo de los años escolares, el Grupo Cultural Euforia DDHH
                  inicia sus labores académicas de Pre-Icfes teniendo en cuenta las competencias y componentes
                  de la prueba. Estas se realizan los días sábados de 8:00am a 12:00m, en todas las áreas
                  que evalúa el Icfes.
                </Text>
              </VStack>
            </GridItem>
            <GridItem>
              <VStack align="start" spacing={3}
                p={6} borderRadius="md" borderLeft="4px solid" borderColor="brand.primary" bg="gray.50">
                <Heading as="h3" size="md" color="brand.secondary">
                  Seminarios de investigación y educación
                </Heading>
                <Text>
                  Propuestos para que los estudiantes vinculados al trabajo del grupo puedan simultáneamente
                  tomar talleres de investigación y de educación. Hemos contado con la participación de
                  compañeros y compañeras de diversas áreas del conocimiento.
                </Text>
              </VStack>
            </GridItem>
            <GridItem>
              <VStack align="start" spacing={3}
                p={6} borderRadius="md" borderLeft="4px solid" borderColor="brand.primary" bg="gray.50">
                <Heading as="h3" size="md" color="brand.secondary">
                  Huerta comunitaria y soberanía alimentaria
                </Heading>
                <Text>
                  Hemos realizado de manera continua diferentes tareas en territorios de huerta urbana, bajo
                  la necesidad de hablar de la importancia de los alimentos, la cosecha y el trabajo de la tierra.
                </Text>
              </VStack>
            </GridItem>
            <GridItem>
              <VStack align="start" spacing={3}
                p={6} borderRadius="md" borderLeft="4px solid" borderColor="brand.primary" bg="gray.50">
                <Heading as="h3" size="md" color="brand.secondary">
                  Talleres de formación
                </Heading>
                <Text>
                  Luego de las actividades de Pre-Icfes, hemos venido realizando talleres de formación
                  política y de formación de género, fortaleciendo la conciencia crítica de los y las jóvenes.
                </Text>
              </VStack>
            </GridItem>
          </Grid>
        </VStack>
      </Container>
    </Box>
  );
};

export default QuienesSomos;