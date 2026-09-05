import React from 'react';
import {
  Box,
  Flex,
  Text,
  HStack,
  Button,
  useDisclosure,
  VStack,
  IconButton,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Image
} from '@chakra-ui/react';
import { Link, useLocation } from 'react-router-dom';
import { HamburgerIcon } from '@chakra-ui/icons';

const Header = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const location = useLocation();

  const menuItems = [
    { name: 'Inicio', path: '/' },
    { name: 'Anuncios', path: '/anuncios' },
    { name: 'Quiénes Somos', path: '/quienes-somos' },
    { name: 'Actividades', path: '/actividades' },
    { name: 'Recursos', path: '/recursos' },
    { name: 'Contacto', path: '/contacto' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <Box bg="brand.primary" px={10} boxShadow="sm" position="sticky" top={0} zIndex={1000}>
        <Flex h={16} alignItems="center" justifyContent="space-between">
          {/* Logo con imagen REAL */}
          <Flex alignItems="center">
            <Box boxSize="90px" mr={3}>
              <Image 
                src="/assets/Logo.png"  // Ruta desde la carpeta public
                alt="Logo Euforia"
                objectFit="contain"
                w="100%"
                h="100%"
                borderRadius="md"
              />
            </Box>
            <Text 
              fontSize="xl" 
              fontWeight="bold" 
              color="white"
              fontFamily="heading"
            >
              Euforia
            </Text>
          </Flex>

          {/* Navegación Desktop */}
          <HStack spacing={8} alignItems="center" display={{ base: 'none', md: 'flex' }}>
            <HStack as="nav" spacing={6}>
              {menuItems.map((item) => (
                <Button
                  key={item.name}
                  as={Link}
                  to={item.path}
                  variant="ghost"
                  color="white"
                  bg={isActive(item.path) ? 'brand.accent2' : 'transparent'}
                  _hover={{ bg: 'brand.accent2', color: 'white' }}
                  fontSize="sm"
                  fontWeight="normal"
                >
                  {item.name}
                </Button>
              ))}
            </HStack>
          </HStack>

          {/* Menú móvil */}
          <IconButton
            display={{ base: 'flex', md: 'none' }}
            onClick={onOpen}
            icon={<HamburgerIcon />}
            variant="outline"
            color="white"
            aria-label="Abrir menú"
          />
        </Flex>
      </Box>

      {/* Drawer para móvil */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent bg="brand.primary">
          <DrawerCloseButton color="white" />
          <DrawerHeader>
            <Text color="white">Menú</Text>
          </DrawerHeader>
          <DrawerBody>
            <VStack spacing={4} align="start">
              {menuItems.map((item) => (
                <Button
                  key={item.name}
                  as={Link}
                  to={item.path}
                  variant="ghost"
                  color="white"
                  w="100%"
                  justifyContent="flex-start"
                  onClick={onClose}
                  bg={isActive(item.path) ? 'brand.accent2' : 'transparent'}
                >
                  {item.name}
                </Button>
              ))}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default Header;