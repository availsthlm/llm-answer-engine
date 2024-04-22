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
    date?: string;
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
