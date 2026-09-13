export function calculateKisht(principal, type = 'outer') {
  const p = Number(principal) || 0;
  if (type === 'self') {
    // 10% flat interest, 12 months
    const total = p * 1.10;
    return Math.round(total / 12);
  } else {
    // 16% flat interest, 12 months
    const total = p * 1.16;
    return Math.round(total / 12);
  }
}

export function calculateSecurityFee(principal, type = 'outer') {
  if (type === 'self') return 0;
  // 0.5% security fee for outer loans (e.g. ₹500 on 1 Lakh, ₹250 on 50k)
  const p = Number(principal) || 0;
  return Math.round(p * 0.005);
}

export function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0);
}
