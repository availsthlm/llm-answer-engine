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
          <div className="text-gray-600 transition-opacity duration-500 opacity-100 animate-fade-in">
            Sammanställer din artikel
            <span className="inline-flex w-[3ch] justify-start overflow-hidden">
              <span className="animate-[ellipsis_1.5s_steps(4,end)_infinite]">
                ...
              </span>
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full mb-2">
            <div
              className="h-full bg-gray-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((tokens / 500) * 100, 100)}%` }}
            />
          </div>
        </>
      ) : (
        <div className="text-gray-600 transition-opacity duration-500 opacity-100 animate-fade-in ">
          Söker i arkivet
          <span className="inline-flex w-[3ch] justify-start overflow-hidden">
            <span className="animate-[ellipsis_1.5s_steps(4,end)_infinite]">
              ...
            </span>
            <span className="animate-spin rounded-full h-3 w-3 border-t-1 border-b-1 border-primary"></span>
          </span>
          
        </div>
      )}
    </div>
  );
};

export default WorkingOnItComponent;
