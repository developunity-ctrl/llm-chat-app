import { cn } from '@/lib/utils';
import { LoaderCircle, LucideProps } from 'lucide-react';

interface SpinnerProps extends LucideProps {
  className?: string;
}

export function Spinner({ className, ...props }: SpinnerProps) {
  return <LoaderCircle className={cn('animate-spin', className)} {...props} />;
}
