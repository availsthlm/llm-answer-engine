// 1. Define the 'LLMResponseComponentProps' interface with properties for 'llmResponse', 'currentLlmResponse', and 'index'
interface LLMResponseComponentProps {
  llmResponse: string;
  currentLlmResponse: string;
  imageUrl: string;
  index: number;
  articles?: Article[];
  writing: boolean;
}

interface Article {
  title: string;
  favicon: string;
}

import { useRef } from "react";
// 2. Import the 'Markdown' component from 'react-markdown'
import Markdown from "react-markdown";
import ArticleHeroComponent from "./ArticleHeroComponent";
// 3. Define the 'StreamingComponent' functional component that renders the 'currentLlmResponse'

const WritingComponent = ({ tokens }: { tokens: number }) => (
  <div className="flex flex-col items-center py-4 w-full px-4">
    <div className="w-full h-2 bg-gray-200 rounded-full mb-2">
      <div
        className="h-full bg-gray-500 rounded-full transition-all duration-300"
        style={{ width: `${Math.min((tokens / 500) * 100, 100)}%` }}
      />
    </div>
    <div className="text-gray-500">Sammanställer din artikel...</div>
  </div>
);
// 4. Define the 'LLMResponseComponent' functional component that takes 'llmResponse', 'currentLlmResponse', and 'index' as props
const LLMResponseComponent = ({
  llmResponse,
  articles,
  writing = true,
}: LLMResponseComponentProps) => {
  const articleRef = useRef<HTMLDivElement>(null);
  // 5. Check if 'llmResponse' is not empty
  return (
    <>
      <div className=" bg-white shadow-lg rounded-lg  mt-4">
        {writing ? (
          <WritingComponent tokens={llmResponse.split(" ").length} />
        ) : (
          <div
            id="hasLlmResponse"
            ref={articleRef}
            className=" text-gray-800 p-4 transition-opacity duration-500 opacity-100 animate-fade-in"
          >
            {articles && llmResponse.length > 0 && (
              <ArticleHeroComponent articles={articles} />
            )}
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
        )}
      </div>
    </>
  );
};

export default LLMResponseComponent;
