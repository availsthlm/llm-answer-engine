// 1. Define the 'LLMResponseComponentProps' interface with properties for 'llmResponse', 'currentLlmResponse', and 'index'
interface LLMResponseComponentProps {
    llmResponse: string;
    currentLlmResponse: string;
    index: number;
}

// 2. Import the 'Markdown' component from 'react-markdown'
import Markdown from "react-markdown";

// 3. Define the 'StreamingComponent' functional component that renders the 'currentLlmResponse'
const StreamingComponent = ({
    currentLlmResponse,
}: {
    currentLlmResponse: string;
}) => {
    return (
        <>
            {currentLlmResponse && (
                <div className=" bg-white shadow-lg rounded-lg p-4 mt-4">
                    <div className="flex items-center">
                        <h2 className="text-lg font-semibold flex-grow  text-black">
                            Svar
                        </h2>
                        <img
                            src="./groq.png"
                            alt="groq logo"
                            className="w-6 h-6"
                        />
                    </div>

                    <div className=" text-gray-800">
                        <Markdown
                            components={{
                                h1: "h2",
                                h3: "h4",
                                p(props) {
                                    const { node, ...rest } = props;
                                    return (
                                        <p
                                            style={{ padding: "12px" }}
                                            {...rest}
                                        />
                                    );
                                },
                                em(props) {
                                    const { node, ...rest } = props;
                                    return (
                                        <i style={{ color: "red" }} {...rest} />
                                    );
                                },
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
    index,
}: LLMResponseComponentProps) => {
    // 5. Check if 'llmResponse' is not empty
    const hasLlmResponse = llmResponse && llmResponse.trim().length > 0;

    return (
        <>
            {hasLlmResponse ? (
                // 6. If 'llmResponse' is not empty, render a div with the 'Markdown' component
                <div className=" bg-white shadow-lg rounded-lg p-4 mt-4">
                    <div className="flex items-center mb-5">
                        <img
                            src="https://dlejuzwq61njn.cloudfront.net/wp-content/uploads/2021/02/11102943/Lonesamtal1800-640x360.jpg"
                            alt="favicon"
                            className="w-full block"
                        />
                    </div>
                    <div className=" text-gray-800">
                        <Markdown
                            components={{
                                h1: "h2",
                                h3: "h2",
                                p(props) {
                                    const { node, ...rest } = props;
                                    return (
                                        <p
                                            style={{ paddingBottom: "12px" }}
                                            {...rest}
                                        />
                                    );
                                },
                                strong: "h4",
                                em(props) {
                                    const { node, ...rest } = props;
                                    return (
                                        <i style={{ color: "red" }} {...rest} />
                                    );
                                },
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
        </>
    );
};

export default LLMResponseComponent;
