export function generateId(prefix = ''): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `${prefix}${prefix ? '_' : ''}${time}${rand}`;
}

export function generateBarcode(): string {
  let code = '2';
  for (let i = 0; i < 11; i++) code += Math.floor(Math.random() * 10);
  let sum = 0;
  for (let i = 0; i < code.length; i++) {
    sum += Number(code[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return code + check;
}

export function generateSKU(name: string, categoryPrefix = 'GEN'): string {
  const clean = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4) || 'PROD';
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${categoryPrefix.slice(0, 3).toUpperCase()}-${clean}-${num}`;
}
