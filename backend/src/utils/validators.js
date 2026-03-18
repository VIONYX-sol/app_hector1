'use strict';

/**
 * Validates Spanish NIF (DNI/NIE/CIF)
 */
const validateNIF = (nif) => {
  if (!nif || typeof nif !== 'string') return false;
  const clean = nif.toUpperCase().replace(/[\s-]/g, '');

  // DNI: 8 digits + letter
  const dniRegex = /^[0-9]{8}[A-Z]$/;
  if (dniRegex.test(clean)) {
    const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
    const num = parseInt(clean.substring(0, 8), 10);
    return clean[8] === letters[num % 23];
  }

  // NIE: X/Y/Z + 7 digits + letter
  const nieRegex = /^[XYZ][0-9]{7}[A-Z]$/;
  if (nieRegex.test(clean)) {
    const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
    const prefix = { X: '0', Y: '1', Z: '2' };
    const num = parseInt(prefix[clean[0]] + clean.substring(1, 8), 10);
    return clean[8] === letters[num % 23];
  }

  // CIF: letter + 7 digits + control
  const cifRegex = /^[ABCDEFGHJKLMNPQRSUVW][0-9]{7}[0-9A-J]$/;
  if (cifRegex.test(clean)) {
    const controlLetters = 'JABCDEFGHI';
    let evenSum = 0;
    let oddSum = 0;
    for (let i = 1; i <= 6; i++) {
      const digit = parseInt(clean[i], 10);
      if (i % 2 === 0) {
        evenSum += digit;
      } else {
        const d = digit * 2;
        oddSum += d > 9 ? d - 9 : d;
      }
    }
    const total = evenSum + oddSum;
    const controlDigit = (10 - (total % 10)) % 10;
    const lastChar = clean[8];
    return lastChar === String(controlDigit) || lastChar === controlLetters[controlDigit];
  }

  return false;
};

/**
 * Validates IBAN (basic format + checksum)
 */
const validateIBAN = (iban) => {
  if (!iban || typeof iban !== 'string') return false;
  const clean = iban.replace(/\s/g, '').toUpperCase();
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/.test(clean)) return false;
  const rearranged = clean.substring(4) + clean.substring(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let remainder = 0;
  for (const char of numeric) {
    remainder = (remainder * 10 + parseInt(char, 10)) % 97;
  }
  return remainder === 1;
};

/**
 * Validates Spanish postal code (5 digits, 01-52)
 */
const validatePostalCode = (cp) => {
  if (!cp || typeof cp !== 'string') return false;
  const clean = cp.replace(/\s/g, '');
  if (!/^[0-9]{5}$/.test(clean)) return false;
  const prefix = parseInt(clean.substring(0, 2), 10);
  return prefix >= 1 && prefix <= 52;
};

/**
 * Validates Spanish phone number
 */
const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  const clean = phone.replace(/[\s\-().+]/g, '');
  // Spanish mobile: 6xx/7xx, landline: 8xx/9xx
  return /^(\+34)?[6789][0-9]{8}$/.test(clean) || /^[6789][0-9]{8}$/.test(clean);
};

/**
 * Validates email address
 */
const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * Validates password strength
 */
const validatePassword = (password) => {
  if (!password || typeof password !== 'string') return { valid: false, message: 'Password is required' };
  if (password.length < 8) return { valid: false, message: 'Password must be at least 8 characters' };
  if (!/[A-Z]/.test(password)) return { valid: false, message: 'Password must contain at least one uppercase letter' };
  if (!/[a-z]/.test(password)) return { valid: false, message: 'Password must contain at least one lowercase letter' };
  if (!/[0-9]/.test(password)) return { valid: false, message: 'Password must contain at least one number' };
  return { valid: true };
};

module.exports = {
  validateNIF,
  validateIBAN,
  validatePostalCode,
  validatePhone,
  validateEmail,
  validatePassword,
};
