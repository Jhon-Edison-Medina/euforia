import React from 'react';
import { Flex, Icon, Image, Text } from '@chakra-ui/react';

// Placeholder de marca para anuncios/actividades/recursos sin foto ni video.
// Muestra la mariposa del logo como marca de agua en vez de un color plano vacío.
// Acepta un emoji (string) o un ícono de react-icons (componente) para el tipo de contenido.
const MediaPlaceholder = ({ emoji, icon, label, height = '200px' }) => (
  <Flex
    h={height}
    w="100%"
    bg="brand.primary"
    align="center"
    justify="center"
    direction="column"
    p={4}
    position="relative"
    overflow="hidden"
  >
    <Image
      src="/assets/Logo.png"
      alt=""
      position="absolute"
      right="-15px"
      bottom="-20px"
      boxSize="140px"
      opacity={0.18}
      pointerEvents="none"
    />
    {icon && <Icon as={icon} boxSize={14} color="white" mb={2} zIndex={1} />}
    {emoji && (
      <Text fontSize="5xl" mb={2} zIndex={1}>
        {emoji}
      </Text>
    )}
    {label && (
      <Text fontSize="sm" color="white" textAlign="center" zIndex={1} fontWeight="medium">
        {label}
      </Text>
    )}
  </Flex>
);

export default MediaPlaceholder;
