import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from "@radix-ui/react-tooltip";
import React, { FormEvent } from "react";
import { Button } from "./ui/button";
import { IconArrowElbow } from "./ui/icons";
import { Textarea } from "./ui/textarea";

interface InputAreaProps {
    inputValue: string;
    setInputValue: (value: string) => void;
    handleFormSubmit: (e: FormEvent<HTMLFormElement>) => void;
    formRef: React.RefObject<HTMLFormElement>;
    inputRef: React.RefObject<HTMLTextAreaElement>;
    onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    setCurrentLlmResponse: (value: string) => void;
}

export default function InputArea({
    formRef,
    handleFormSubmit,
    setCurrentLlmResponse,
    inputValue,
    setInputValue,
    inputRef,
    onKeyDown,
}: InputAreaProps) {
    return (
        <div className="mx-auto sm:max-w-2xl ">
            <div className=" space-y-4  shadow-lg  bg-gray-100 rounded-md">
                <form
                    ref={formRef}
                    onSubmit={async (e: FormEvent<HTMLFormElement>) => {
                        e.preventDefault();
                        handleFormSubmit(e);
                        setCurrentLlmResponse("");
                        if (window.innerWidth < 600) {
                            (e.target as HTMLFormElement)["message"]?.blur();
                        }
                        const value = inputValue.trim();
                        setInputValue("");
                        if (!value) return;
                    }}
                >
                    <div className="relative flex flex-col w-full overflow-hidden max-h-60 grow  bg-gray-100 ">
                        <Textarea
                            ref={inputRef}
                            tabIndex={0}
                            onKeyDown={onKeyDown}
                            placeholder=""
                            className="min-h-[60px] w-full resize-none bg-transparent px-4 py-[1.3rem] focus-within:outline-none sm:text-sm  text-black"
                            autoFocus
                            spellCheck={false}
                            autoComplete="off"
                            autoCorrect="off"
                            name="message"
                            rows={1}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                        />
                        <div className="absolute right-0 top-4 sm:right-4">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="submit"
                                        size="icon"
                                        disabled={inputValue === ""}
                                    >
                                        <IconArrowElbow />
                                        <span className="sr-only">
                                            Send message
                                        </span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Send message</TooltipContent>
                            </Tooltip>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
