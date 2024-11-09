// 1. Define the 'LLMResponseComponentProps' interface with properties for 'llmResponse', 'currentLlmResponse', and 'index'
interface LLMResponseComponentProps {
  llmResponse: string;
  currentLlmResponse: string;
  imageUrl: string;
  index: number;
  articles?: Article[];
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
const StreamingComponent = ({
  currentLlmResponse,
}: {
  currentLlmResponse: string;
}) => {
  console.log("StreamingComponent");
  return (
    <>
      {currentLlmResponse && (
        <div
          id="currentLlmResponse"
          className=" bg-white shadow-lg rounded-lg p-4 mt-4"
        >
          <div className="flex items-center">
            <h2 className="text-lg font-semibold flex-grow  text-black">
              Svar
            </h2>
            <img src="./groq.png" alt="groq logo" className="w-6 h-6" />
          </div>

          <div className=" text-gray-800">
            <Markdown
              components={{
                h1: "h3",
                h2: "h3",
                h3: "h4",
                p(props) {
                  const { node, ...rest } = props;
                  return <p style={{ padding: "12px" }} {...rest} />;
                },
                strong: "b",
              }}
            >
              {currentLlmResponse}
            </Markdown>
          </div>
        </div>
      )}
    </>
  );
};

// 4. Define the 'LLMResponseComponent' functional component that takes 'llmResponse', 'currentLlmResponse', and 'index' as props
const LLMResponseComponent = ({
  llmResponse,
  currentLlmResponse,
  articles,
}: LLMResponseComponentProps) => {
  const articleRef = useRef<HTMLDivElement>(null);
  // 5. Check if 'llmResponse' is not empty
  const hasLlmResponse = llmResponse && llmResponse.trim().length > 0;
  console.log("LLMResponseComponent", articles);
  return (
    <>
      {hasLlmResponse ? (
        // 6. If 'llmResponse' is not empty, render a div with the 'Markdown' component
        <div className=" bg-white shadow-lg rounded-lg  mt-4">
          <div
            id="hasLlmResponse"
            ref={articleRef}
            className=" text-gray-800 p-4"
          >
            {articles && <ArticleHeroComponent articles={articles} />}
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
      ) : (
        // 7. If 'llmResponse' is empty, render the 'StreamingComponent' with 'currentLlmResponse'
        <StreamingComponent currentLlmResponse={currentLlmResponse} />
      )}
      {/* <button onClick={handleGeneratePDF}>Generate PDF</button>; */}
    </>
  );
};

export default LLMResponseComponent;
