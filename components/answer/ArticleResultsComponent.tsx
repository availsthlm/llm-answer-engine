// 1. Import the 'useState' and 'useEffect' hooks from React
import { useEffect, useState } from "react";

// 2. Define the 'SearchResult' interface with properties for 'favicon', 'link', and 'title'
export interface SearchResult {
  favicon: string;
  link: string;
  title: string;
  date: string;
}

// 3. Define the 'SearchResultsComponentProps' interface with a 'searchResults' property of type 'SearchResult[]'
export interface SearchResultsComponentProps {
  searchResults: SearchResult[];
}

// 4. Define the 'SearchResultsComponent' functional component that takes 'searchResults' as a prop
const ArticleResultsComponent = ({
  searchResults = [],
}: {
  searchResults: SearchResult[] | undefined;
}) => {
  // 5. Use the 'useState' hook to manage the 'isExpanded' and 'loadedFavicons' state
  const [isExpanded, setIsExpanded] = useState(false);
  const [loadedFavicons, setLoadedFavicons] = useState<boolean[]>([]);

  // Add new state for managing animation
  const [, setIsVisible] = useState(false);

  // Add effect to trigger animation
  useEffect(() => {
    if (searchResults.length > 0) {
      setIsVisible(true);
    }
  }, [searchResults.length]);

  // 6. Use the 'useEffect' hook to initialize the 'loadedFavicons' state based on the 'searchResults' length
  useEffect(() => {
    setLoadedFavicons(Array(searchResults.length).fill(false));
  }, [searchResults.length]);

  // 7. Define the 'toggleExpansion' function to toggle the 'isExpanded' state
  const toggleExpansion = () => setIsExpanded(!isExpanded);

  // 8. Define the 'visibleResults' variable to hold the search results to be displayed based on the 'isExpanded' state
  //const visibleResults = isExpanded ? searchResults : searchResults.slice(0, 4);
  const visibleResults = searchResults
    .filter((result) => result.favicon && result.favicon.trim() !== "")
    .slice(0, isExpanded ? undefined : 4);

  // 9. Define the 'handleFaviconLoad' function to update the 'loadedFavicons' state when a favicon is loaded
  const handleFaviconLoad = (index: number) => {
    setLoadedFavicons((prevLoadedFavicons) => {
      const updatedLoadedFavicons = [...prevLoadedFavicons];
      updatedLoadedFavicons[index] = true;
      return updatedLoadedFavicons;
    });
  };

  // 10. Define the 'SearchResultsSkeleton' component to render a loading skeleton

  // 11. Render the 'SearchResultsComponent'
  if (searchResults.length === 0) return null;
  return (
    <>
      <div className="flex items-center mb-4">
        <h2 className="text-lg font-semibold flex-grow text-black">Källor</h2>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {visibleResults.map((result, index) => (
          <a
            key={index}
            href={result.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block hover:bg-gray-50 rounded-lg"
          >
            <div className=" overflow-hidden">
              <div className="aspect-[4/3] relative bg-gray-100">
                <img
                  src={result.favicon || "/favicon-16x16.png"}
                  alt="favicon"
                  className={`w-full h-full object-cover ${
                    result.favicon ? "" : "grayscale"
                  } ${loadedFavicons[index] ? "block" : "hidden"}`}
                  onLoad={() => handleFaviconLoad(index)}
                />
                <p className="text-sm font-medium text-gray-900 line-clamp-1">
                  {result.title}
                </p>
                <p className="text-sm font-medium text-gray-900 line-clamp-1">
                  Publicerad: {result.date}
                </p>
              </div>
            </div>
          </a>
        ))}

        {searchResults.length > 3 && (
          <div
            onClick={toggleExpansion}
            className="text-center p-2 cursor-pointer hover:bg-gray-50 rounded-lg"
          >
            <span className="text-sm font-medium text-gray-700">
              {isExpanded ? "Visa färre" : "Visa fler"}
            </span>
          </div>
        )}
      </div>
    </>
  );
};

export default ArticleResultsComponent;
