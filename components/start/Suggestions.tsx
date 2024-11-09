function Suggestion({
  query,
  onPress,
}: {
  query: string;
  onPress: (query: string) => void;
}) {
  return (
    <div
      onClick={() => onPress(query)}
      style={{ opacity: 1, transform: "none" }}
    >
      <div className="group p-2 col-span-1 flex cursor-pointer items-center gap-x-sm rounded-lg border p-xs border-borderMain/50 ring-borderMain/50 divide-borderMain/50 dark:divide-borderMainDark/50 dark:ring-borderMainDark/50 dark:border-borderMainDark/50 transition duration-300 bg-transparent hover:bg-gray-100">
        <div className="default font-sans text-sm font-medium text-textMain dark:text-textMainDark selection:bg-super/50 selection:text-textMain dark:selection:bg-superDuper/10 dark:selection:text-superDark">
          {query}
        </div>
      </div>
    </div>
  );
}

export default function Suggestions({
  onPress,
}: {
  onPress: (query: string) => void;
}) {
  const handleSubmit = (query: string) => {
    onPress(query);
  };

  return (
    <div className="mt-md">
      <div className="mb-8">
        <div className="grid grid-cols-1 gap-sm md:grid-cols-2 gap-4">
          <Suggestion
            query="Vad ska jag tänka på inför lönesamtalet?"
            onPress={handleSubmit}
          />
          <Suggestion
            query=" När är det dags att byta jobb?"
            onPress={handleSubmit}
          />
          <Suggestion
            query="  Hur motiverar jag mina medarbetare?"
            onPress={handleSubmit}
          />
          <Suggestion query=" Fack eller inte fack?" onPress={handleSubmit} />
        </div>
      </div>
    </div>
  );
}
