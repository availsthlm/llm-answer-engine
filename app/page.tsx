"use client";
import { useEnterSubmit } from "@/lib/hooks/use-enter-submit";
import { readStreamableValue, useActions } from "ai/rsc";
import { useCallback, useEffect, useRef, useState } from "react";
import { type AI } from "./action";
// Custom components
import ArticleResultsComponent from "@/components/answer/ArticleResultsComponent";
import FollowUpComponent from "@/components/answer/FollowUpComponent";
import LLMResponseComponent from "@/components/answer/LLMResponseComponent";
import UserMessageComponent from "@/components/answer/UserMessageComponent";
import { useCookies } from "next-client-cookies";
//import { useSession } from "next-auth/react";
import AccessDenied from "@/components/AccessDenied";
import InputArea from "@/components/InputArea";
import Suggestions from "@/components/start/Suggestions";
import { ChatScrollAnchor } from "@/lib/hooks/chat-scroll-anchor";

// 2. Set up types
interface SearchResult {
  favicon: string;
  link: string;
  title: string;
}
interface Message {
  id: number;
  type: string;
  content: string;
  userMessage: string;
  images: Image[];
  videos: Video[];
  cover: string;
  followUp: FollowUp | null;
  isStreaming: boolean;
  searchResults?: SearchResult[];
  articleResults?: SearchResult[];
}
interface StreamMessage {
  articleResults?: any;
  searchResults?: any;
  userMessage?: string;
  llmResponse?: string;
  llmResponseEnd?: boolean;
  images?: any;
  cover?: any;
  videos?: any;
  followUp?: any;
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
  const [, setCurrentLlmResponse] = useState("");
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
              currentMessage.cover = typedMessage.articleResults
                .filter((article: any) => article.cover !== "")
                .reduce((prev: any, current: any) =>
                  prev.score > current.score ? prev : current
                ).cover;
            }

            if (typedMessage.followUp) {
              currentMessage.followUp = typedMessage.followUp;
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
                  <UserMessageComponent message={message.userMessage} />
                )}
                {message.articleResults && (
                  <ArticleResultsComponent
                    key={`articleResults-${index}`}
                    searchResults={message.articleResults}
                  />
                )}

                <LLMResponseComponent
                  llmResponse={message.content}
                  currentLlmResponse={currentLlmResponse}
                  index={index}
                  imageUrl={message.cover}
                  key={`llm-response-${index}`}
                />

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
        <ChatScrollAnchor trackVisibility={true} />
      </div>
      {/* {messages.length === 1 && (
                <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            )} */}
      {messages.length === 0 ? (
        <div className="mx-auto  max-w-2xl px-4">
          <div className="flex border rounded-md flex-col gap-2 text-left bg-background p-8 mb-8">
            <p className="leading-normal text-muted-foreground  text-md  text:lg-2xl">
              Välkommen till Chef GPT - en AI-tjänst som är laddad med 8 490
              artiklar från Chef. Ställ en fråga om ledarskap och få en
              skräddarsydd artikel som svar.
            </p>

            <p className=" text-muted-foreground text-xs text:lg-2xl">
              Chef GPT utvecklas i takt med hur den används. Alla AI-tjänster
              har begränsningar. Förlita dig inte enbart på svaren du får i Chef
              GPT, särskilt inte i komplexa eller känsliga situationer.
            </p>
            <p className=" text-muted-foreground text-xs text:lg-2xl">
              Använd alltid ditt eget omdöme och komplettera AI:s insikter med
              mänsklig intelligens när det behövs.
            </p>
          </div>
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
          <Suggestions onPress={handleSubmit} />
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
