import crypto from 'crypto';

/**
 * Generates an authentic-looking certificate number (e.g. NDLEA/DT/054981)
 */
export const generateCertificateNumber = (): string => {
  const digits = Math.floor(100000 + Math.random() * 900000); // 6 digits
  return `NDLEA/DT/${digits}`;
};

/**
 * Generates an authentic-looking applicant ID (e.g. NDLEA/0000047890)
 */
export const generateApplicantId = (): string => {
  const digits = Math.floor(1000000000 + Math.random() * 9000000000); // 10 digits
  return `NDLEA/${digits}`;
};

/**
 * Generates a cryptographically secure activation key (e.g. DT-ABCD-EFGH-IJKL)
 */
export const generateActivationKey = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segment = () => {
    let result = '';
    const bytes = crypto.randomBytes(4);
    for (let i = 0; i < 4; i++) {
      result += chars[bytes[i] % chars.length];
    }
    return result;
  };
  return `DT-${segment()}-${segment()}-${segment()}`;
};
