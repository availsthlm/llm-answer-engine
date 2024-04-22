// 1. Import dependencies
import "server-only";
import { createAI, createStreamableValue } from "ai/rsc";
import { OpenAI } from "openai";
import { Pinecone } from "@pinecone-database/pinecone";
import cheerio from "cheerio";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Document as DocumentInterface } from "langchain/document";
import { OpenAIEmbeddings } from "@langchain/openai";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
// 1.5 Configuration file for inference model, embeddings model, and other parameters
import { config } from "./config";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions.mjs";
// 2. Determine which embeddings mode and which inference model to use based on the config.tsx. Currently suppport for OpenAI, Groq and partial support for Ollama embeddings and inference
let openai: OpenAI;

console.log("config", JSON.stringify(config));

if (config.useOllamaInference) {
    openai = new OpenAI({
        baseURL: config.ollamaBaseUrl,
        apiKey: "ollama",
    });
} else {
    openai = new OpenAI({
        baseURL: config.nonOllamaBaseURL,
        apiKey: config.inferenceAPIKey,
    });
}

const pineconeClient = new Pinecone({
    apiKey: config.pineconeApiKey as string,
});

// 2.5 Set up the embeddings model based on the config.tsx
let embeddings: OllamaEmbeddings | OpenAIEmbeddings;
if (config.useOllamaEmbeddings) {
    embeddings = new OllamaEmbeddings({
        model: config.embeddingsModel,
        baseUrl: "http://localhost:11434",
    });
} else {
    embeddings = new OpenAIEmbeddings({
        modelName: config.embeddingsModel,
    });
}
// 3. Define interfaces for search results and content results
interface SearchResult {
    title: string;
    link: string;
    snippet: string;
    favicon: string;
}

interface ArticleResult {
    title: string;
    link: string;
    content: string;
    image: string;
}
interface ContentResult extends SearchResult {
    html: string;
}
// 4. Fetch search results from Brave Search API
async function getSources(
    message: string,
    numberOfPagesToScan = config.numberOfPagesToScan
): Promise<SearchResult[]> {
    try {
        const response = await fetch(
            `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(message)}&count=${numberOfPagesToScan}`,
            {
                headers: {
                    Accept: "application/json",
                    "Accept-Encoding": "gzip",
                    "X-Subscription-Token": process.env
                        .BRAVE_SEARCH_API_KEY as string,
                },
            }
        );
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonResponse = await response.json();
        if (!jsonResponse.web || !jsonResponse.web.results) {
            throw new Error("Invalid API response format");
        }
        const final = jsonResponse.web.results.map(
            (result: any): SearchResult => ({
                title: result.title,
                link: result.url,
                snippet: result.description,
                favicon: result.profile.img,
            })
        );
        return final;
    } catch (error) {
        console.error("Error fetching search results:", error);
        throw error;
    }
}

async function getSourcesFromPinecone(question: string) {
    // Target the index
    const indexName = "land-artiklar";
    const index = pineconeClient.index<any>(indexName);

    const query = await embeddings.embedQuery(question);

    // Query the index using the query embedding
    const results = await index.query({
        vector: query,
        topK: 6,
        includeMetadata: true,
        includeValues: true,
    });

    return results.matches?.map((match) => ({
        title: match.metadata?.title,
        content: match.metadata?.content,
        link: match.metadata?.link,
        favicon: match.metadata?.full_image_url,
        cover: match.metadata?.full_image_url,
        date: match.metadata?.date,
        score: match.score,
    }));
}
// 5. Fetch contents of top 10 search results
async function get10BlueLinksContents(
    sources: SearchResult[]
): Promise<ContentResult[]> {
    async function fetchWithTimeout(
        url: string,
        options: RequestInit = {},
        timeout = 800
    ): Promise<Response> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            if (error) {
                console.log(`Skipping ${url}!`);
            }
            throw error;
        }
    }
    function extractMainContent(html: string): string {
        try {
            const $ = cheerio.load(html);
            $("script, style, head, nav, footer, iframe, img").remove();
            return $("body").text().replace(/\s+/g, " ").trim();
        } catch (error) {
            console.error("Error extracting main content:", error);
            throw error;
        }
    }
    const promises = sources.map(
        async (source): Promise<ContentResult | null> => {
            try {
                const response = await fetchWithTimeout(source.link, {}, 800);
                if (!response.ok) {
                    throw new Error(
                        `Failed to fetch ${source.link}. Status: ${response.status}`
                    );
                }
                const html = await response.text();
                const mainContent = extractMainContent(html);
                return { ...source, html: mainContent };
            } catch (error) {
                // console.error(`Error processing ${source.link}:`, error);
                return null;
            }
        }
    );
    try {
        const results = await Promise.all(promises);
        return results.filter(
            (source): source is ContentResult => source !== null
        );
    } catch (error) {
        console.error(
            "Error fetching and processing blue links contents:",
            error
        );
        throw error;
    }
}
// 6. Process and vectorize content using LangChain
async function processAndVectorizeContent(
    contents: ContentResult[],
    query: string,
    textChunkSize = config.textChunkSize,
    textChunkOverlap = config.textChunkOverlap,
    numberOfSimilarityResults = config.numberOfSimilarityResults
): Promise<DocumentInterface[]> {
    try {
        for (let i = 0; i < contents.length; i++) {
            const content = contents[i];
            if (content.html.length > 0) {
                try {
                    const splitText = await new RecursiveCharacterTextSplitter({
                        chunkSize: textChunkSize,
                        chunkOverlap: textChunkOverlap,
                    }).splitText(content.html);
                    const vectorStore = await MemoryVectorStore.fromTexts(
                        splitText,
                        { title: content.title, link: content.link },
                        embeddings
                    );
                    return await vectorStore.similaritySearch(
                        query,
                        numberOfSimilarityResults
                    );
                } catch (error) {
                    console.error(
                        `Error processing content for ${content.link}:`,
                        error
                    );
                }
            }
        }
        return [];
    } catch (error) {
        console.error("Error processing and vectorizing content:", error);
        throw error;
    }
}
// 7. Fetch image search results from Brave Search API
async function getImages(
    message: string
): Promise<{ title: string; link: string }[]> {
    try {
        const response = await fetch(
            `https://api.search.brave.com/res/v1/images/search?q=${message}&spellcheck=1`,
            {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    "Accept-Encoding": "gzip",
                    "X-Subscription-Token": process.env
                        .BRAVE_SEARCH_API_KEY as string,
                },
            }
        );
        if (!response.ok) {
            throw new Error(
                `Network response was not ok. Status: ${response.status}`
            );
        }
        const data = await response.json();
        const validLinks = await Promise.all(
            data.results.map(async (result: any) => {
                const link = result.properties.url;
                if (typeof link === "string") {
                    try {
                        const imageResponse = await fetch(link, {
                            method: "HEAD",
                        });
                        if (imageResponse.ok) {
                            const contentType =
                                imageResponse.headers.get("content-type");
                            if (
                                contentType &&
                                contentType.startsWith("image/")
                            ) {
                                return {
                                    title: result.properties.title,
                                    link: link,
                                };
                            }
                        }
                    } catch (error) {
                        console.error(
                            `Error fetching image link ${link}:`,
                            error
                        );
                    }
                }
                return null;
            })
        );
        const filteredLinks = validLinks.filter(
            (link): link is { title: string; link: string } => link !== null
        );
        return filteredLinks.slice(0, 9);
    } catch (error) {
        console.error("There was a problem with your fetch operation:", error);
        throw error;
    }
}
// 8. Fetch video search results from Google Serper API
async function getVideos(
    message: string
): Promise<{ imageUrl: string; link: string }[] | null> {
    const url = "https://google.serper.dev/videos";
    const data = JSON.stringify({
        q: message,
    });
    const requestOptions: RequestInit = {
        method: "POST",
        headers: {
            "X-API-KEY": process.env.SERPER_API as string,
            "Content-Type": "application/json",
        },
        body: data,
    };
    try {
        const response = await fetch(url, requestOptions);
        if (!response.ok) {
            throw new Error(
                `Network response was not ok. Status: ${response.status}`
            );
        }
        const responseData = await response.json();
        const validLinks = await Promise.all(
            responseData.videos.map(async (video: any) => {
                const imageUrl = video.imageUrl;
                if (typeof imageUrl === "string") {
                    try {
                        const imageResponse = await fetch(imageUrl, {
                            method: "HEAD",
                        });
                        if (imageResponse.ok) {
                            const contentType =
                                imageResponse.headers.get("content-type");
                            if (
                                contentType &&
                                contentType.startsWith("image/")
                            ) {
                                return { imageUrl, link: video.link };
                            }
                        }
                    } catch (error) {
                        console.error(
                            `Error fetching image link ${imageUrl}:`,
                            error
                        );
                    }
                }
                return null;
            })
        );
        const filteredLinks = validLinks.filter(
            (link): link is { imageUrl: string; link: string } => link !== null
        );
        return filteredLinks.slice(0, 9);
    } catch (error) {
        console.error("Error fetching videos:", error);
        throw error;
    }
}
// 9. Generate follow-up questions using OpenAI API
const relevantQuestions = async (
    originalQuestion: string,
    sources: string[]
): Promise<any> => {
    return await openai.chat.completions.create({
        messages: [
            {
                role: "system",
                content: `
          Du är en frågegenerator som genererar en array med 3 uppföljningsfrågor i JSON-format.
          The JSON schema should include:
          {
            "original": ${originalQuestion},
            "followUp": [
              "Fråga 1",
              "Fråga 2",
              "Fråga 3"
            ]
          }
          `,
            },
            {
                role: "user",
                content: `Generera uppföljningsfrågor baserat på de bästa resultaten från: ${JSON.stringify(sources)}. Den ursprungliga sökfrågan är: ${originalQuestion}.`,
            },
        ],
        model: config.inferenceModel,
        response_format: { type: "json_object" },
    });
};
// 10. Main action function that orchestrates the entire process
async function myAction(userMessage: string): Promise<any> {
    "use server";
    const streamable = createStreamableValue({});
    (async () => {
        const [articles] = await Promise.all([
            getSourcesFromPinecone(userMessage),
        ]);

        const sources = articles.map((article) => ({
            title: article.title,
            link: article.link,
            favicon: article.favicon,
            cover: article.cover,
            date: article.date,
            score: article.score,
        }));
        streamable.update({ articleResults: sources });
        const vectorResults = articles
            .map((article) => ({
                content: article.title + " - " + article.content,
            }))
            .join("/n");
        // const html = await get10BlueLinksContents(sources);
        // const vectorResults = await processAndVectorizeContent(
        //     html,
        //     userMessage
        // );
        // console.log("Vectorized results:", vectorResults);
        const messages: ChatCompletionMessageParam[] = [
            {
                role: "system",
                content: `Du är en erfaren journalist på tidningen Land och har precis fått i uppdrag att skriva en artikel på 3000 tecken som besvarar frågan: ${userMessage},
                        Använd en objektiv och informativ ton.
                        Använd en tydlig struktur med rubrik, ingress, huvuddel och avslutning: 
                        ## Rubrik 
                        ** ingress text **
                        Huvudelen ska vara uppdelad i stycken och innehålla fakta och citat.
                        Avslutningen ska sammanfatta artikeln och ge en tydlig slutsats.

                        Exkludera datum och byline. 
                        Använd markdown format i din text. Detta är mycket viktigt! 
                       `,
            },
            {
                role: "user",
                content: `Använd endast information efter CONTEXT för att skriva artikeln. Om möjligt, inkludera källor och citat från  för att stödja dina påståenden.  En bra artikel kommer lyfta din karriär till nya höjder. Lycka till!  CONTEXT: ${JSON.stringify(vectorResults)}. `,
            },
        ];

        const chatCompletion = await openai.chat.completions.create({
            messages: messages,
            stream: true,
            model: config.inferenceModel,
        });
        console.log("Start reading chat completion");
        for await (const chunk of chatCompletion) {
            if (
                chunk.choices[0].delta &&
                chunk.choices[0].finish_reason !== "stop"
            ) {
                streamable.update({
                    llmResponse: chunk.choices[0].delta.content,
                });
            } else if (chunk.choices[0].finish_reason === "stop") {
                streamable.update({ llmResponseEnd: true });
            }
        }
        if (!config.useOllamaInference) {
            const followUp = await relevantQuestions(
                userMessage,
                articles.map((article) => article.content)
            );
            streamable.update({ followUp: followUp });
        }
        streamable.done({ status: "done" });
    })();
    console.log("Returning streamable value");

    return streamable.value;
}
// 11. Define initial AI and UI states
const initialAIState: {
    role: "user" | "assistant" | "system" | "function";
    content: string;
    id?: string;
    name?: string;
}[] = [];
const initialUIState: {
    id: number;
    display: React.ReactNode;
}[] = [];
// 12. Export the AI instance
export const AI = createAI({
    actions: {
        myAction,
    },
    initialUIState,
    initialAIState,
});
