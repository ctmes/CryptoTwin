import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUPPORTED_CURRENCIES } from "@/lib/api";

interface CurrencySelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

const CurrencySelector = ({ value, onValueChange }: CurrencySelectorProps) => {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[120px] bg-gray-50 border-gray-100">
        <SelectValue placeholder="Currency" />
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_CURRENCIES.map((currency) => (
          <SelectItem
            key={currency.value}
            value={currency.value}
            className="text-gray-900"
          >
            {currency.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CurrencySelector;
