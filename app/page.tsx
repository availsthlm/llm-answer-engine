"use client";
import FollowUpComponent from "@/components/answer/FollowUpComponent";
import LLMResponseComponent from "@/components/answer/LLMResponseComponent";
import UserMessageComponent from "@/components/answer/UserMessageComponent";
import { useEnterSubmit } from "@/lib/hooks/use-enter-submit";
import { readStreamableValue, useActions } from "ai/rsc";
import { useCookies } from "next-client-cookies";
import { useCallback, useEffect, useRef, useState } from "react";
import { type AI } from "./action";
// Custom components
import { ChatScrollAnchor } from "@/lib/hooks/chat-scroll-anchor";
//import { useSession } from "next-auth/react";
import AccessDenied from "@/components/AccessDenied";
import { SearchResult } from "@/components/answer/ArticleResultsComponent";
import WorkingOnItComponent from "@/components/answer/WorkingOnItComponent";
import InputArea from "@/components/InputArea";
import Suggestions from "@/components/start/Suggestions";

export interface StreamMessage {
  articleResults?: any;
  searchResults?: any;
  userMessage?: string;
  llmResponse?: string | null;
  llmResponseEnd?: boolean;
  summary?: string | null;
  images?: any;
  cover?: any;
  videos?: any;
  followUp?: any;
  status?: "done" | "searching" | "answering";
}

interface Message {
  id: number;
  type: string;
  content: string;
  userMessage: string;
  summary?: string | null;
  images: Image[];
  videos: Video[];
  cover: string;
  followUp: FollowUp | null;
  isStreaming: boolean;
  searchResults?: SearchResult[];
  articleResults?: SearchResult[];

  status?: "done" | "searching" | "answering";
}

interface Image {
  link: string;
}

interface Video {
  link: string;
  imageUrl: string;
}
interface FollowUp {
  choices: {
    message: {
      content: string;
    };
  }[];
}

export default function Page() {
  const cookies = useCookies();
  // 3. Set up action that will be used to stream all the messages
  const { myAction } = useActions<typeof AI>();
  // 4. Set up form submission handling
  const { formRef, onKeyDown } = useEnterSubmit();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [inputValue, setInputValue] = useState("");
  // 5. Set up state for the messages
  const [messages, setMessages] = useState<Message[]>([]);
  // 6. Set up state for the CURRENT LLM response (for displaying in the UI while streaming)
  const [currentLlmResponse, setCurrentLlmResponse] = useState("");
  const [, setWaitingForLLMResponse] = useState(false);
  // 7. Set up handler for when the user clicks on the follow up button
  const handleFollowUpClick = useCallback(async (question: string) => {
    setCurrentLlmResponse("");
    await handleUserMessageSubmission(question);
  }, []);
  // 8. For the form submission, we need to set up a handler that will be called when the user submits the form
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/") {
        if (
          e.target &&
          ["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).nodeName)
        ) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        if (inputRef?.current) {
          inputRef.current.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [inputRef]);

  // 9. Set up handler for when a submission is made, which will call the myAction function
  const handleSubmit = async (message: string) => {
    if (!message) return;
    await handleUserMessageSubmission(message);
  };
  const handleFormSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    const messageToSend = inputValue.trim();
    if (!messageToSend) return;
    setInputValue("");
    await handleSubmit(messageToSend);
  };
  const handleUserMessageSubmission = async (
    userMessage: string
  ): Promise<void> => {
    setWaitingForLLMResponse(true);
    const newMessageId = Date.now();
    const newMessage = {
      id: newMessageId,
      type: "userMessage",
      userMessage: userMessage,
      content: "",
      images: [],
      cover: "",
      videos: [],
      followUp: null,
      isStreaming: true,
      searchResults: [] as SearchResult[],
    };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    let lastAppendedResponse = "";
    try {
      const streamableValue = await myAction(userMessage);
      let llmResponseString = "";
      for await (const message of readStreamableValue(streamableValue)) {
        const typedMessage = message as StreamMessage;
        setMessages((prevMessages) => {
          const messagesCopy = [...prevMessages];
          const messageIndex = messagesCopy.findIndex(
            (msg) => msg.id === newMessageId
          );
          if (messageIndex !== -1) {
            const currentMessage = messagesCopy[messageIndex];
            if (
              typedMessage.llmResponse &&
              typedMessage.llmResponse !== lastAppendedResponse
            ) {
              currentMessage.content += typedMessage.llmResponse;
              lastAppendedResponse = typedMessage.llmResponse; // Update last appended response
            }
            if (typedMessage.llmResponseEnd) {
              currentMessage.isStreaming = false;
            }

            if (typedMessage.articleResults) {
              currentMessage.articleResults = typedMessage.articleResults;
              const articlesWithCover = typedMessage.articleResults.filter(
                (article: any) => article.cover !== ""
              );
              currentMessage.cover =
                articlesWithCover.length > 0
                  ? articlesWithCover.reduce((prev: any, current: any) =>
                      prev.score > current.score ? prev : current
                    ).cover
                  : "";
            }

            if (typedMessage.status) {
              currentMessage.status = typedMessage.status;
            }

            if (typedMessage.followUp) {
              currentMessage.followUp = typedMessage.followUp;
            }

            if (typedMessage.summary) {
              currentMessage.summary = typedMessage.summary;
            }
          }

          return messagesCopy;
        });
        if (typedMessage.llmResponse) {
          llmResponseString += typedMessage.llmResponse;
          setCurrentLlmResponse(llmResponseString);
        }
      }
    } catch (error) {
      console.error("Error streaming data for user message:", error);
    }
  };
  if (!cookies.get("auth")) return <AccessDenied />;

  return (
    <div>
      {messages.length > 0 && (
        <div className="flex flex-col">
          {messages.map((message, index) => (
            <div
              key={`message-${index}`}
              className="flex flex-col items-center"
            >
              <div className="w-full md:w-3/4 md:pr-2">
                {message.type === "userMessage" && (
                  <div
                    ref={(el) => {
                      if (el && index === messages.length - 1) {
                      el.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}>
                    <UserMessageComponent message={message.userMessage} />
                  </div>
                )}

                <WorkingOnItComponent
                  status={message.status}
                  tokens={message.content.split(" ").length}
                />

                {message.status === "done" && (
                  <LLMResponseComponent
                    llmResponse={message.content}
                    currentLlmResponse={currentLlmResponse}
                    summary={message.summary || ""}
                    index={index}
                    imageUrl={message.cover}
                    articles={message.articleResults}
                    key={`llm-response-${index}`}
                  />
                )}

                {message.followUp && (
                  <div className="flex flex-col">
                    <FollowUpComponent
                      key={`followUp-${index}`}
                      followUp={message.followUp}
                      handleFollowUpClick={handleFollowUpClick}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="pb-[80px] pt-4 md:pt-10">
        <ChatScrollAnchor trackVisibility={false} />
      </div>
      {/* {messages.length === 1 && (
                <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            )} */}
      {messages.length === 0 ? (
        <div className="mx-auto  max-w-2xl px-4">
          <Suggestions onPress={handleSubmit} />
          <InputArea
            {...{
              formRef,
              handleFormSubmit,
              setCurrentLlmResponse,
              inputValue,
              setInputValue,
              inputRef,
              onKeyDown,
            }}
          />
        </div>
      ) : (
        <div className="fixed inset-x-0 bottom-0 w-full bg-gradient-to-b duration-300 ease-in-out animate-in   peer-[[data-state=open]]:group-[]:lg:pl-[250px] peer-[[data-state=open]]:group-[]:xl:pl-[300px]] mb-4">
          <InputArea
            {...{
              formRef,
              handleFormSubmit,
              setCurrentLlmResponse,
              inputValue,
              setInputValue,
              inputRef,
              onKeyDown,
            }}
          />
        </div>
      )}
    </div>
  );
}
