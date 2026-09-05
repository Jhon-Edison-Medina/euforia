// En src/components/Layout/Footer.jsx - versión compacta
import React from 'react';
import { Box, Container, Text, VStack, HStack, Link, Image, SimpleGrid } from '@chakra-ui/react';

const Footer = () => {
  return (
    <Box bg="brand.secondary" color="white" py={8} mt={16}>
      <Container maxW="container.xl">
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} alignItems="center">
          {/* Logo y nombre */}
          <VStack spacing={3} align="start">
            <HStack spacing={3}>
              <Box boxSize="70px">
                <Image 
                  src="/assets/Logo.png"
                  alt="Logo Euforia"
                  objectFit="contain"
                  w="100%"
                  h="100%"
                  borderRadius="md"
                />
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontSize="lg" fontWeight="bold">Euforia</Text>
                <Text fontSize="sm" opacity={0.8}>Derechos Humanos y Educación</Text>
              </VStack>
            </HStack>
          </VStack>

          {/* Redes sociales */}
          <VStack spacing={3}>
            <Text fontWeight="bold">Síguenos:</Text>
            <HStack spacing={4}>
              <Link 
                href="https://www.facebook.com/profile.php?id=100083302912878" 
                isExternal
                _hover={{ color: 'brand.accent4' }}
              >
                Facebook
              </Link>
              <Link 
                href="https://www.instagram.com/euforiaddhheducacion/" 
                isExternal
                _hover={{ color: 'brand.accent4' }}
              >
                Instagram
              </Link>
              <Link 
                href="https://www.tiktok.com/@euforiaddhheducac6" 
                isExternal
                _hover={{ color: 'brand.accent4' }}
              >
                TikTok
              </Link>
            </HStack>
          </VStack>

          {/* Contacto */}
          <VStack spacing={3} align="start">
            <Text fontWeight="bold">Contacto:</Text>
            <Link 
              href="mailto:euforiacddhheducacion@gmail.com"
              color="brand.accent1"
              _hover={{ color: 'brand.accent4' }}
            >
              euforiacddhheducacion@gmail.com
            </Link>
            <Text fontSize="sm" opacity={0.8}>Soacha, Colombia</Text>
          </VStack>
        </SimpleGrid>
          <VStack spacing={1}>
           <Text fontSize="sm" fontWeight="bold">Administración:</Text>
           <Link 
           href="/admin"
           color="brand.accent1"
          _hover={{ color: 'brand.accent4' }}
          fontSize="sm"
         >
    Panel de Administración
  </Link>
</VStack>
        {/* Línea separadora y derechos */}
        <Box borderTop="1px solid" borderColor="brand.accent1" mt={6} pt={6}>
          <Text fontSize="sm" textAlign="center" opacity={0.8}>
            © {new Date().getFullYear()} Euforia - Centro de Derechos Humanos y Educación. 
            Todos los derechos reservados.
          </Text>
        </Box>
      </Container>
    </Box>
  );
};
export default Footer;