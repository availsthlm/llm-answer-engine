// 1. Define the 'LLMResponseComponentProps' interface with properties for 'llmResponse', 'currentLlmResponse', and 'index'
interface LLMResponseComponentProps {
  llmResponse: string;
  currentLlmResponse: string;
  imageUrl: string;
  index: number;
  articles?: SearchResult[];
  summary?: string;
}

import { useRef } from "react";
// 2. Import the 'Markdown' component from 'react-markdown'
import Markdown from "react-markdown";
import ArticleResultsComponent, {
  SearchResult,
} from "./ArticleResultsComponent";
// 3. Define the 'StreamingComponent' functional component that renders the 'currentLlmResponse'

// 4. Define the 'LLMResponseComponent' functional component that takes 'llmResponse', 'currentLlmResponse', and 'index' as props
const LLMResponseComponent = ({
  llmResponse,
  articles,
  summary,
}: LLMResponseComponentProps) => {
  const articleRef = useRef<HTMLDivElement>(null);

  // 5. Check if 'llmResponse' is not empty
  return (
    <>
      <div className=" bg-white shadow-lg rounded-lg  mt-4">
        <div
          id="hasLlmResponse"
          ref={articleRef}
          className=" text-gray-800 p-4 transition-opacity duration-500 opacity-100 animate-fade-in"
        >
          {articles && llmResponse.length > 0 && (
            <ArticleResultsComponent searchResults={articles} />
          )}
          {summary && <div className="text-gray-500 text-sm">{summary}</div>}
          <Markdown
            components={{
              h1: "h3",
              h2: "h3",
              h3: "h4",
              p(props) {
                const { node, ...rest } = props;
                return <p style={{ paddingBottom: "12px" }} {...rest} />;
              },
              strong: "b",
            }}
          >
            {llmResponse}
          </Markdown>
        </div>
      </div>
    </>
  );
};

export default LLMResponseComponent;
