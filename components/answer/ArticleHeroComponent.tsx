// 1. Import the 'useState' and 'useEffect' hooks from React
import { memo, useEffect, useState } from "react";

// 2. Define the 'SearchResult' interface with properties for 'favicon', 'link', and 'title'
export interface Article {
  favicon: string;
  title: string;
}

// 3. Define the 'ArticleHero' interface with a 'searchResults' property of type 'SearchResult[]'
export interface ArticleHero {
  articles: Article[];
}

// 4. Define the 'SearchResultsComponent' functional component that takes 'searchResults' as a prop
const ArticleHeroComponent = memo(({ articles }: { articles: Article[] }) => {
  // 5. Use the 'useState' hook to manage the 'isExpanded' and 'loadedFavicons' state
  const [isExpanded] = useState(false);
  const [loadedFavicons, setLoadedFavicons] = useState<boolean[]>([]);

  // 6. Use the 'useEffect' hook to initialize the 'loadedFavicons' state based on the 'articles' length
  useEffect(() => {
    setLoadedFavicons(Array(articles.length).fill(false));
  }, [articles]);

  // 7. Define the 'toggleExpansion' function to toggle the 'isExpanded' state

  // 8. Define the 'visibleResults' variable to hold the search results to be displayed based on the 'isExpanded' state
  const visibleResults = articles
    .filter((article) => article.favicon && article.favicon.trim() !== "")
    .slice(0, isExpanded ? undefined : 4);

  // 9. Define the 'handleFaviconLoad' function to update the 'loadedFavicons' state when a favicon is loaded
  const handleFaviconLoad = (index: number) => {
    setLoadedFavicons((prevLoadedFavicons) => {
      const updatedLoadedFavicons = [...prevLoadedFavicons];
      updatedLoadedFavicons[index] = true;
      return updatedLoadedFavicons;
    });
  };

  // 10. Define the 'ArticlesSkeleton' component to render a loading skeleton
  const ArticlesSkeleton = () => (
    <div className="w-full h-full bg-gray-300 rounded animate-pulse"></div>
  );

  // 11. Render the 'articlesComponent'

  return (
    <div className="p-2 mt-2">
      <div className="grid grid-cols-2">
        {articles.length === 0 ? (
          <ArticlesSkeleton />
        ) : (
          visibleResults.map((result, index) => (
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
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
});

export default ArticleHeroComponent;
