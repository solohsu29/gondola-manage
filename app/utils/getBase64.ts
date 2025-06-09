export default function getBase64(data: any): string {
    if (!data) return '';
    if (typeof data === 'string') {
      if (/^[A-Za-z0-9+/=]+$/.test(data) && data.length > 20) return data;
      if (data.startsWith('data:image')) {
        const match = data.match(/base64,(.*)$/);
        return match ? match[1] : '';
      }
      return '';
    }
    // Handle Node.js Buffer serialized as { type: 'Buffer', data: [...] }
    if (data && typeof data === 'object' && data.type === 'Buffer' && Array.isArray(data.data)) {
      try {
        // Browser-safe: convert byte array to binary string, then to base64
        const byteArray = data.data as number[];
        let binary = '';
        for (let i = 0; i < byteArray.length; i++) {
          binary += String.fromCharCode(byteArray[i]);
        }
        return btoa(binary);
      } catch {
        return '';
      }
    }
    // Handle Uint8Array
    if (typeof Uint8Array !== 'undefined' && data instanceof Uint8Array) {
      try {
        let binary = '';
        for (let i = 0; i < data.length; i++) {
          binary += String.fromCharCode(data[i]);
        }
        return btoa(binary);
      } catch {
        return '';
      }
    }
    return '';
  }