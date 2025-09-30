export const setCookie = (name: string, value: string, days: number = 7) => {
  if (typeof window === "undefined") return;

  // For very large values (like JWTs with many permissions), split into chunks
  const CHUNK_SIZE = 3000; // Safe size under 4KB limit

  if (value.length > CHUNK_SIZE) {
    // Clear any existing chunks first
    for (let i = 0; i < 10; i++) {
      deleteCookie(`${name}_${i}`);
    }

    // Split into chunks
    const chunks = Math.ceil(value.length / CHUNK_SIZE);
    for (let i = 0; i < chunks; i++) {
      const chunk = value.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      const chunkName = `${name}_${i}`;

      const expires = new Date();
      expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
      const isSecure = window.location.protocol === "https:";
      const secureFlag = isSecure ? ";Secure" : "";

      document.cookie = `${chunkName}=${encodeURIComponent(chunk)};expires=${expires.toUTCString()};path=/;SameSite=Lax${secureFlag}`;
    }

    // Set a marker cookie with the number of chunks
    document.cookie = `${name}_chunks=${chunks};expires=${new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()};path=/;SameSite=Lax`;
    console.log(`[setCookie] Split ${name} into ${chunks} chunks`);
    return;
  }

  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

  const isSecure = window.location.protocol === "https:";
  const secureFlag = isSecure ? ";Secure" : "";

  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax${secureFlag}`;

  console.log(`[setCookie] Set cookie: ${name} (${value.length} chars)`);
};

export const getCookie = (name: string): string | null => {
  if (typeof window === "undefined") return null;

  // Check if this is a chunked cookie
  const chunksMarker = `${name}_chunks=`;
  const ca = document.cookie.split(";");

  let chunkCount = 0;
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(chunksMarker) === 0) {
      chunkCount = parseInt(c.substring(chunksMarker.length), 10);
      break;
    }
  }

  if (chunkCount > 0) {
    // Reassemble chunks
    let fullValue = "";
    for (let i = 0; i < chunkCount; i++) {
      const chunkName = `${name}_${i}=`;
      for (let j = 0; j < ca.length; j++) {
        let c = ca[j];
        while (c.charAt(0) === " ") c = c.substring(1, c.length);
        if (c.indexOf(chunkName) === 0) {
          fullValue += decodeURIComponent(c.substring(chunkName.length));
          break;
        }
      }
    }
    return fullValue || null;
  }

  // Regular cookie
  const nameEQ = name + "=";
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
  }
  return null;
};

export const deleteCookie = (name: string) => {
  if (typeof window === "undefined") return;

  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};
