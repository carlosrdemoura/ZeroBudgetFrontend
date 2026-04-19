interface Props {
  amount: number;
  className?: string;
}

export function CurrencyDisplay({ amount, className }: Props) {
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  const colorClass = amount < 0 ? 'text-error' : amount === 0 ? 'text-base-content/40' : '';

  return (
    <span className={`${colorClass} ${className ?? ''}`.trim()}>
      {formatted}
    </span>
  );
}
