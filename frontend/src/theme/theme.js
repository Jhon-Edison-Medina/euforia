import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    brand: {
      primary: '#657e92',
      secondary: '#434164',
      accent1: '#b4aec1',
      accent2: '#725cde',
      accent3: '#7875cc',
      accent4: '#bdb017',
      accent5: '#7665db',
      background: '#f8f9fa'
    }
  },
  fonts: {
    heading: 'Poppins, sans-serif',
    body: 'Open Sans, sans-serif'
  },
  styles: {
    global: {
      body: {
        bg: 'brand.background',
        color: 'gray.800',
        fontFamily: "'Open Sans', sans-serif",
        minHeight: '100vh'
      },
      'html, body': {
        margin: 0,
        padding: 0,
        boxSizing: 'border-box'
      },
      a: {
        color: 'brand.accent2',
        _hover: {
          color: 'brand.accent5'
        }
      }
    }
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'semibold',
        borderRadius: 'md'
      },
      variants: {
        solid: {
          bg: 'brand.accent2',
          color: 'white',
          _hover: {
            bg: 'brand.accent5'
          }
        },
        outline: {
          borderColor: 'brand.accent2',
          color: 'brand.accent2',
          _hover: {
            bg: 'brand.accent2',
            color: 'white'
          }
        }
      }
    },
    Card: {
      baseStyle: {
        container: {
          borderRadius: 'lg',
          overflow: 'hidden'
        }
      }
    }
  }
});

export default theme;