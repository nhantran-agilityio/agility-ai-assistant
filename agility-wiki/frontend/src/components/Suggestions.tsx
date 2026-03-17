type Props = {
  suggestions: string[];
  onSelect: (text: string) => void;
};

export default function Suggestions({ suggestions, onSelect }: Props) {
  return (
    <div className="p-4 flex flex-wrap gap-2">
      {suggestions.map((suggestion, i) => (
        <button
          key={i}
          onClick={() => onSelect(suggestion)}
          className="cursor-pointer text-xs bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded-lg"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
