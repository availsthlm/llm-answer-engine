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
import { StreamMessage } from "./page";
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
  try {
    const indexName = "chef-20241116";
    const index = pineconeClient.index<any>(indexName);
    const query = await embeddings.embedQuery(question);

    const results = await index.query({
      vector: query,
      topK: 4,
      includeMetadata: true,
      includeValues: true,
    });

    if (!results.matches) {
      throw new Error("No matches found in Pinecone");
    }

    return results.matches.map((match) => ({
      title: match.metadata?.title || "Untitled",
      content: match.metadata?.content || "No content available",
      link: match.metadata?.link,
      favicon: match.metadata?.thumbnail_url,
      cover: match.metadata?.full_image_url,
      score: match.score,
      date: match.metadata?.date,
    }));
  } catch (error) {
    console.error("Error in getSourcesFromPinecone:", error);
    return [];
  }
}

const relevantQuestions = async (
  originalQuestion: string,
  article: string
): Promise<any> => {
  return await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `
        Generate 3 follow-up questions based on the content of the provided article.

        Consider the key themes, arguments, and details presented in the article to formulate a thoughtful and relevant question. Ensure that the question encourages further exploration of the topic and prompts discussion.

        # Steps

        1. Read and understand the main arguments and key points of the article.
        2. Identify any areas that could benefit from additional inquiry or clarification.
        3. Formulate a question that aligns with the main themes and is open-ended to promote discussion.
        
        # Output Format
        The JSON schema should include:
          {
            "original": ${originalQuestion},
            "followUp": [
              "Fråga 1",
              "Fråga 2",
              "Fråga 3"
            ]
          }

          " Notes
          - Answer in Swedish
          `,
      },
      {
        role: "user",
        content: `Artikel: \n ${article} \n. Den ursprungliga sökfrågan är: ${originalQuestion}.`,
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
  try {
    if (!text?.trim()) {
      throw new Error("Empty query provided");
    }

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

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in response");
    }

    const jsonObject = JSON.parse(content);
    return jsonObject["queries"] || [];
  } catch (error) {
    console.error("Error in rewriteQuery:", error);
    return [text]; // fallback to original query
  }
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

const generateSummary = async (completeResponse: string) => {
  // Add summary generation after the main response
  const summaryMessages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `
              Summarize the provided article into three key points.

- Focus on the main ideas, arguments, and conclusions expressed in the article.
- Ensure that each key point is concise and captures the essence of the article without extraneous details.

# Steps

1. Read the entire article carefully.
2. Identify the main themes and messages conveyed by the author.
3. Condense these themes into three succinct key points.

# Output Format

Output should be in plain text, consisting of exactly three bullet points, each not exceeding two sentences.

# Examples

**Input:**  
An article discussing the impact of climate change on global agriculture. 

**Output JSON:**  
{
  "keyPoints": [
    " Climate change is leading to unpredictable weather patterns, affecting crop yields worldwide.",
    "Increased temperatures and drought conditions are causing food insecurity in vulnerable regions.",
    " Sustainable farming practices are essential to adapt and mitigate the effects of climate change on agriculture."
  ]
}

- Increased temperatures and drought conditions are causing food insecurity in vulnerable regions.  
- Sustainable farming practices are essential to adapt and mitigate the effects of climate change on agriculture. 

(*Real examples should reflect the actual content and nuances of the article, thereby being more specific and tailored to the original text.*) 

# Notes

Focus on clarity and relevance in the key points, ensuring they reflect the fundamental aspects of the article.
Always verify factual accuracy and context while summarizing.
              `,
    },
    {
      role: "user",
      content: `Sammanfatta följande artikel: ${completeResponse}`,
    },
  ];

  const summaryCompletion = await openai.chat.completions.create({
    messages: summaryMessages,
    model: config.inferenceModel,
    stream: false,
    response_format: { type: "json_object" },
  });
  return summaryCompletion.choices[0].message.content;
};
// 10. Main action function that orchestrates the entire process
async function myAction(userMessage: string): Promise<any> {
  "use server";

  const streamable = createStreamableValue<StreamMessage>({});

  try {
    if (!userMessage?.trim()) {
      throw new Error("Empty user message");
    }

    const queries = await rewriteQuery(userMessage);
    console.log("Queries", queries);

    streamable.update({ status: "searching" });
    (async () => {
      try {
        const [articles, articles2, articles3, articles4] = await Promise.all([
          getSourcesFromPinecone(userMessage),
          getSourcesFromPinecone(queries[0]),
          getSourcesFromPinecone(queries[1]),
          getSourcesFromPinecone(queries[2]),
        ]);

        const allArticles = [
          ...new Set(
            [...articles, ...articles2, ...articles3, ...articles4]
              .filter((article) => article.score && article.score > 0.7)
              .map((article) => JSON.stringify(article))
          ),
        ].map((str) => JSON.parse(str));

        // Add check for empty articles
        console.log("All articles", allArticles.length);
        if (allArticles.length === 0) {
          streamable.update({
            status: "done",
            llmResponse:
              "Jag kunde tyvärr inte hitta några relevanta artiklar för din fråga. Försök gärna omformulera dig eller var mer specifik.",
            llmResponseEnd: true,
          });
          streamable.done({ status: "done" });
          return streamable.value;
        }

        console.log(
          "All articles",
          allArticles.map((a) => {
            return `${a.title} ${a.date}, ${a.score}`;
          })
        );

        const sources = allArticles.map((article) => ({
          title: article.title,
          link: article.link,
          favicon: article.favicon,
          cover: article.cover,
          date: article.date
            ? new Date(article.date).getFullYear().toString()
            : null,
        }));

        const uniqueSources = [
          ...new Map(
            sources.map((item) => [JSON.stringify(item), item])
          ).values(),
        ];

        const vectorResults = allArticles
          .map(
            (article) =>
              `RUBRIK:${article.title},   INNEHÅLL:${article.content}`
          )
          .join("\n");
        // Add article results to the streamable value
        streamable.update({ articleResults: uniqueSources });

        const queryIntent = await findQueryIntent(userMessage);
        streamable.update({ status: "answering" });
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
            content: `Använd endast information efter CONTEXT för att skriva artikeln. 
        Om du inte hittar något relevant innehåll efter CONTEXT, så be användaren om att skriva om frågan.
        Informationen efter context är ett antal artiklar, varje artikel börjar med en RUBRIK följt av INNEHÅLL.
        Om möjligt, inkludera källor och citat från  för att stödja dina påståenden.  
        En bra artikel kommer lyfta din karriär till nya höjder. Lycka till!  
        CONTEXT: ${JSON.stringify(vectorResults)}. `,
          },
        ];

        const chatCompletion = await openai.chat.completions.create({
          messages: messages,
          stream: true,
          model: config.inferenceModel,
        });
        // console.log("Start reading chat completion");
        let completeResponse = "";
        for await (const chunk of chatCompletion) {
          if (
            chunk.choices[0].delta &&
            chunk.choices[0].finish_reason !== "stop"
          ) {
            completeResponse += chunk.choices[0].delta.content || ""; // Accumulate the complete response

            streamable.update({
              llmResponse: chunk.choices[0].delta.content,
            });
          } else if (chunk.choices[0].finish_reason === "stop") {
            streamable.update({ llmResponseEnd: true });

            const summary = await generateSummary(completeResponse);
            streamable.update({
              summary: summary,
            });

            const followUp = await relevantQuestions(
              userMessage,
              completeResponse
            );
            streamable.update({ followUp: followUp });
          }
        }

        streamable.done({ status: "done" });
      } catch (error) {
        console.error("Error fetching articles:", error);
        streamable.update({
          status: "done",
          llmResponse:
            "Ett fel uppstod när vi försökte hämta artiklar. Vänligen försök igen senare.",
          llmResponseEnd: true,
        });
        streamable.done({ status: "done" });
        return streamable.value;
      }
    })();
  } catch (error) {
    console.error("Error in myAction:", error);
    streamable.update({
      status: "done",
      llmResponse: "Ett oväntat fel uppstod. Vänligen försök igen senare.",
      llmResponseEnd: true,
    });
    streamable.done({ status: "done" });
  }

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
