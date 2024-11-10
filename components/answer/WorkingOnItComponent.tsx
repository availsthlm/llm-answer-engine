const WorkingOnItComponent = ({
  status,
  tokens,
}: {
  status: "done" | "searching" | "answering" | undefined;
  tokens: number;
}) => {
  if (!status || status === "done") return null;

  return (
    <div className="flex flex-col items-center py-4 w-full px-4">
      {status === "answering" ? (
        <>
          <div className="w-full h-2 bg-gray-200 rounded-full mb-2">
            <div
              className="h-full bg-gray-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((tokens / 500) * 100, 100)}%` }}
            />
          </div>
          <div className="text-gray-500">Sammanställer din artikel...</div>
        </>
      ) : (
        <div className="text-gray-500">Söker i arkivet...</div>
      )}
    </div>
  );
};

export default WorkingOnItComponent;
