import { useModels } from '@/hooks/use-chat';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Spinner } from '../common/spinner';

type ModelSelectorProps = {
  onModelSelect: (value: string) => void;
  defaultModel?: string;
};

export function ModelSelector({
  onModelSelect,
  defaultModel,
}: ModelSelectorProps) {
  const { data, isFetching, isLoading, isError, error } = useModels();
  
  const placeholder =
    isFetching || isLoading ? <Spinner /> : defaultModel || 'Default model';

  if (isError) {
    return (
      <div className="text-red-500 text-sm">
        <span>Unable to fetch models</span>
        <br />
        <span>Error: {error?.message}</span>
      </div>
    );
  }

  return (
    <Select disabled={isLoading || isFetching} onValueChange={onModelSelect}>
      <SelectTrigger className="w-[200px] py-2">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="py-2">
        {data?.models?.map(({ id, name }) => (
          <SelectItem key={id} value={id}>
            {name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
