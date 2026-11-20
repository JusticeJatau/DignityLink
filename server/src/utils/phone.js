export const normalizePhone = (raw = '') => {
  const cleaned = String(raw).replace(/[\s\-().]/g, '').trim();
  if (!cleaned) return '';

  // Normalize common Nigerian local numbers (080..., 070..., 090..., 081...) to +234...
  if (/^0[789][01]\d{8}$/.test(cleaned)) {
    return `+234${cleaned.slice(1)}`;
  }

  if (/^234\d{10}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  return `+${cleaned}`;
};

export const isValidPhone = (phone = '') => {
  const normalized = normalizePhone(phone);
  return /^\+\d{10,15}$/.test(normalized);
};
