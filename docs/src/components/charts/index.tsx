import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis,
} from 'recharts';
import { brl, brlCompact } from '../../lib/format';

const axis = { tick: { fontSize: 12 }, stroke: 'transparent' } as const;
const tooltipStyle = {
  contentStyle: { borderRadius: 8, border: '1px solid rgba(120,120,120,.25)', fontSize: 12 },
  formatter: (v: number | string) => brl(Number(v)),
} as const;

export function LinhaEvolucao({ dados, dataKey = 'valor' }: { dados: { label: string; valor: number }[]; dataKey?: string }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={dados} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradBrand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,.18)" vertical={false} />
        <XAxis dataKey="label" {...axis} />
        <YAxis {...axis} tickFormatter={(v) => brlCompact(Number(v))} width={64} />
        <RTooltip {...tooltipStyle} />
        <Area type="monotone" dataKey={dataKey} name="Valor" stroke="#10b981" strokeWidth={2} fill="url(#gradBrand)" dot={{ r: 2 }} activeDot={{ r: 4 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

const CORES_PIE = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#14b8a6', '#6366f1', '#84cc16'];

export function PizzaCategorias({ dados }: { dados: { categoria: string; valor: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={dados} dataKey="valor" nameKey="categoria" innerRadius={60} outerRadius={95} paddingAngle={2}>
          {dados.map((_, i) => <Cell key={i} fill={CORES_PIE[i % CORES_PIE.length]} />)}
        </Pie>
        <RTooltip {...tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function BarrasAportesRendimentos({ dados }: { dados: { label: string; aportes: number; rendimentos: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={dados} margin={{ top: 8, right: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,.18)" vertical={false} />
        <XAxis dataKey="label" {...axis} />
        <YAxis {...axis} tickFormatter={(v) => brlCompact(Number(v))} width={64} />
        <RTooltip {...tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="aportes" name="Aportes" fill="#10b981" radius={[4, 4, 0, 0]} />
        <Bar dataKey="rendimentos" name="Rendimentos" fill="#6366f1" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function BarrasComparativas({ dados, series }: { dados: Record<string, unknown>[]; series: { key: string; nome: string; cor: string }[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={dados} margin={{ top: 8, right: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,.18)" vertical={false} />
        <XAxis dataKey="label" {...axis} />
        <YAxis {...axis} tickFormatter={(v) => brlCompact(Number(v))} width={64} />
        <RTooltip {...tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {series.map((s) => <Bar key={s.key} dataKey={s.key} name={s.nome} fill={s.cor} radius={[4, 4, 0, 0]} />)}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LinhaDupla({ dados }: { dados: { mes: string; aportes: number; valor: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={dados} margin={{ top: 8, right: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,.18)" vertical={false} />
        <XAxis dataKey="mes" {...axis} />
        <YAxis {...axis} tickFormatter={(v) => brlCompact(Number(v))} width={64} />
        <RTooltip {...tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area type="monotone" dataKey="valor" name="Patrimônio investido" stroke="#10b981" fill="url(#gradBrand)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="aportes" name="Aportes do mês" stroke="#8b5cf6" strokeWidth={2} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}