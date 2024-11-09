// 1. Import dependencies
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { createAI, createStreamableValue } from "ai/rsc";
import { OpenAI } from "openai";
import "server-only";
// 1.5 Configuration file for inference model, embeddings model, and other parameters
import { ChatCompletionMessageParam } from "openai/resources/chat/completions.mjs";
import { config } from "./config";
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

async function getSourcesFromPinecone(question: string) {
  // Target the index
  const indexName = "chef-index";
  const index = pineconeClient.index<any>(indexName);

  const query = await embeddings.embedQuery(question);

  // Query the index using the query embedding
  const results = await index.query({
    vector: query,
    topK: 4,
    includeMetadata: true,
    includeValues: true,
  });

  return results.matches?.map((match) => ({
    title: match.metadata?.title,
    content: match.metadata?.content,
    link: match.metadata?.link,
    favicon: match.metadata?.thumbnail_url,
    cover: match.metadata?.full_image_url,
    score: match.score,
    date: match.metadata?.date,
  }));
}

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

/**
 * You are a helpful assistant that finds the intent of a user query. Answer with one sentence that with confidence states the intent.
 *
 */
const rewriteQuery = async (text: string) => {
  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `You are a helpful assistant that generates multiple search queries based on a  single input query. Generate 3 search queries, related to the user query. The response format MUST be a json aobject { queries: [ "query 1", "query 2", "query 3"]} 
                       `,
    },
    {
      role: "user",
      content: `${text} `,
    },
  ];

  const response = await openai.chat.completions.create({
    messages: messages,
    stream: false,
    model: config.inferenceModel,
    response_format: { type: "json_object" },
  });
  if (response.choices[0].message.content) {
    const jsonObject = JSON.parse(response.choices[0].message.content);
    return jsonObject["queries"];
  }
  return response.choices[0].message.content;
};

const findQueryIntent = async (text: string) => {
  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `You are a helpful assistant that finds the intent of a user query. Answer with one sentence that with confidence states the intent. 
                       `,
    },
    {
      role: "user",
      content: `${text} `,
    },
  ];

  const response = await openai.chat.completions.create({
    messages: messages,
    stream: false,
    model: config.inferenceModel,
    response_format: { type: "text" },
  });

  return response.choices[0].message.content;
};
// 10. Main action function that orchestrates the entire process
async function myAction(userMessage: string): Promise<any> {
  "use server";
  //Array of queries
  const queries = await rewriteQuery(userMessage);
  console.log("Queries", queries);
  const streamable = createStreamableValue({});
  (async () => {
    const [articles, articles2, articles3, articles4] = await Promise.all([
      getSourcesFromPinecone(userMessage),
      getSourcesFromPinecone(queries[0]),
      getSourcesFromPinecone(queries[1]),
      getSourcesFromPinecone(queries[2]),
    ]);

    const allArticles = articles.concat(articles2, articles3, articles4);

    const sources = allArticles
      .filter((article) => article.score && article.score > 0.6)
      .map((article) => ({
        title: article.title,
        link: article.link,
        favicon: article.favicon,
        cover: article.cover,
      }));

    const uniqueSources = [
      ...new Map(sources.map((item) => [JSON.stringify(item), item])).values(),
    ];

    streamable.update({ articleResults: uniqueSources });

    const vectorResults = articles
      .map(
        (article) => `RUBRIK:${article.title},   INNEHÅLL:${article.content}`
      )
      .join(" ");

    const queryIntent = await findQueryIntent(userMessage);
    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `Du är en erfaren journalist på tidningen Chef och har precis fått i uppdrag att skriva en artikel på 3000 tecken som besvarar frågan: ${userMessage}.
                        Tänkbara vinklar på frågan kan vara: ${queries.join(",")}.
                        Intentionen från din redaktör är att du ska skriva så att det här besvaras: ${queryIntent}.
                        Tänk på att Chef är en tidning inrikat på ledarskap och karriär.
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
        content: `Använd endast information efter CONTEXT för att skriva artikeln. Informationen efter context är ett antal artiklar, varje artikel börjar med en RUBRIK följt av INNEHÅLL. Om möjligt, inkludera källor och citat från  för att stödja dina påståenden.  En bra artikel kommer lyfta din karriär till nya höjder. Lycka till!  CONTEXT: ${JSON.stringify(vectorResults)}. `,
      },
    ];

    const chatCompletion = await openai.chat.completions.create({
      messages: messages,
      stream: true,
      model: config.inferenceModel,
    });
    // console.log("Start reading chat completion");
    for await (const chunk of chatCompletion) {
      if (chunk.choices[0].delta && chunk.choices[0].finish_reason !== "stop") {
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
  // console.log("Returning streamable value");

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
