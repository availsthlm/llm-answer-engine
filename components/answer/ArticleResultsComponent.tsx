// 1. Import the 'useState' and 'useEffect' hooks from React
import { useEffect, useState } from "react";

// 2. Define the 'SearchResult' interface with properties for 'favicon', 'link', and 'title'
export interface SearchResult {
  favicon: string;
  link: string;
  title: string;
}

// 3. Define the 'SearchResultsComponentProps' interface with a 'searchResults' property of type 'SearchResult[]'
export interface SearchResultsComponentProps {
  searchResults: SearchResult[];
}

// 4. Define the 'SearchResultsComponent' functional component that takes 'searchResults' as a prop
const ArticleResultsComponent = ({
  searchResults,
}: {
  searchResults: SearchResult[];
}) => {
  // 5. Use the 'useState' hook to manage the 'isExpanded' and 'loadedFavicons' state
  const [isExpanded, setIsExpanded] = useState(false);
  const [loadedFavicons, setLoadedFavicons] = useState<boolean[]>([]);

  // 6. Use the 'useEffect' hook to initialize the 'loadedFavicons' state based on the 'searchResults' length
  useEffect(() => {
    setLoadedFavicons(Array(searchResults.length).fill(false));
  }, [searchResults]);

  // 7. Define the 'toggleExpansion' function to toggle the 'isExpanded' state
  const toggleExpansion = () => setIsExpanded(!isExpanded);

  // 8. Define the 'visibleResults' variable to hold the search results to be displayed based on the 'isExpanded' state
  const visibleResults = isExpanded ? searchResults : searchResults.slice(0, 4);

  // 9. Define the 'handleFaviconLoad' function to update the 'loadedFavicons' state when a favicon is loaded
  const handleFaviconLoad = (index: number) => {
    setLoadedFavicons((prevLoadedFavicons) => {
      const updatedLoadedFavicons = [...prevLoadedFavicons];
      updatedLoadedFavicons[index] = true;
      return updatedLoadedFavicons;
    });
  };

  // 10. Define the 'SearchResultsSkeleton' component to render a loading skeleton
  const SearchResultsSkeleton = () => (
    <div className="space-y-2">
      {Array.from({ length: isExpanded ? searchResults.length : 3 }).map(
        (_, index) => (
          <div
            key={index}
            className="flex items-center space-x-2 bg-gray-100 p-3 rounded-lg"
          >
            <div className="w-5 h-5 bg-gray-400 rounded animate-pulse"></div>
            <div className="w-full h-4 bg-gray-400 rounded animate-pulse"></div>
          </div>
        )
      )}
    </div>
  );

  // 11. Render the 'SearchResultsComponent'
  return (
    <div className="bg-white shadow-lg rounded-lg p-4 mt-4">
      <div className="flex items-center mb-4">
        <h2 className="text-lg font-semibold flex-grow text-black">Källor</h2>
      </div>

      <div className="space-y-2">
        {searchResults.length === 0 ? (
          <SearchResultsSkeleton />
        ) : (
          <>
            {visibleResults.map((result, index) => (
              <a
                key={index}
                href={result.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-1 p-1">
                  <div className="w-5 h-5 flex-shrink-0">
                    <img
                      src={result.favicon || "/favicon-16x16.png"}
                      alt="favicon"
                      className={`w-full h-full object-contain ${
                        result.favicon ? "" : "grayscale"
                      } ${loadedFavicons[index] ? "block" : "hidden"}`}
                      onLoad={() => handleFaviconLoad(index)}
                    />
                  </div>
                  <p className="text-sm font-medium text-gray-900 line-clamp-1">
                    {result.title}
                  </p>
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
          </>
        )}
      </div>
    </div>
  );
};

export default ArticleResultsComponent;
