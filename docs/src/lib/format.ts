export const brl = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export const brlCompact = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 }).format(v);

export const pct = (v: number, digits = 1) =>
  `${v > 0 ? '+' : ''}${v.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;

export const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

/** Simula um login local (apenas demonstração — sem autenticação real). */
export const fakeLogin = (email: string, senha: string) =>
  new Promise<void>((resolve, reject) =>
    setTimeout(() => {
      if (!email.includes('@') || senha.length < 4) reject(new Error('credenciais'));
      else resolve();
    }, 900),
  );
