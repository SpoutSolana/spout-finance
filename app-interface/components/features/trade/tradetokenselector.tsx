import { Button } from "@/components/ui/button";

type TradeTokenSelectorProps = {
  tokens: { label: string; value: string }[];
  selectedToken: string;
  setSelectedToken: (token: string) => void;
};

export default function TradeTokenSelector({
  tokens,
  selectedToken,
  setSelectedToken,
}: TradeTokenSelectorProps) {
  return (
    <div className="flex justify-center gap-4 mt-4">
      {tokens.map((token) => (
        <Button
          key={token.value}
          variant={selectedToken === token.value ? "default" : "outline"}
          onClick={() => setSelectedToken(token.value)}
          className="min-w-[80px]"
        >
          {token.label}
        </Button>
      ))}
    </div>
  );
}
