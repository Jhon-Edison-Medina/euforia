// src/components/Layout/Loading.jsx
import React from 'react';
import { Box, Spinner, Text, VStack } from '@chakra-ui/react';

const Loading = () => {
  return (
    <Box 
      position="fixed" 
      top="0" 
      left="0" 
      w="100%" 
      h="100%" 
      bg="white" 
      display="flex" 
      alignItems="center" 
      justifyContent="center"
      zIndex="9999"
    >
      <VStack spacing={4}>
        <Spinner size="xl" color="brand.accent2" thickness="4px" />
        <Text color="brand.secondary" fontSize="lg">Cargando Euforia...</Text>
      </VStack>
    </Box>
  );
};

export default Loading;