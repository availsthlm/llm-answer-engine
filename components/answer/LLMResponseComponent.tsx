// 1. Define the 'LLMResponseComponentProps' interface with properties for 'llmResponse', 'currentLlmResponse', and 'index'
interface LLMResponseComponentProps {
    llmResponse: string;
    currentLlmResponse: string;
    imageUrl: string;
    index: number;
}

import { useRef } from "react";
// 2. Import the 'Markdown' component from 'react-markdown'
import Markdown from "react-markdown";
import { generatePDF } from "@/lib/utils/generatePDF";

// 3. Define the 'StreamingComponent' functional component that renders the 'currentLlmResponse'
const StreamingComponent = ({
    currentLlmResponse,
}: {
    currentLlmResponse: string;
}) => {
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
                        <img
                            src="./groq.png"
                            alt="groq logo"
                            className="w-6 h-6"
                        />
                    </div>

                    <div className=" text-gray-800">
                        <Markdown
                            components={{
                                h1: "h3",
                                h2: "h3",
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
    imageUrl,
    index,
}: LLMResponseComponentProps) => {
    const articleRef = useRef<HTMLDivElement>(null);
    const handleGeneratePDF = async () => {
        if (articleRef.current) {
            await generatePDF(articleRef.current.id);
        }
    };
    // 5. Check if 'llmResponse' is not empty
    const hasLlmResponse = llmResponse && llmResponse.trim().length > 0;

    return (
        <>
            {hasLlmResponse ? (
                // 6. If 'llmResponse' is not empty, render a div with the 'Markdown' component
                <div className=" bg-white shadow-lg rounded-lg  mt-4">
                    {imageUrl && (
                        <div className="flex items-center p-4">
                            <img
                                src={imageUrl}
                                alt="Chef GPT"
                                className="w-full block"
                            />
                        </div>
                    )}
                    <div
                        id="hasLlmResponse"
                        ref={articleRef}
                        className=" text-gray-800 p-4"
                    >
                        <Markdown
                            components={{
                                h1: "h3",
                                h2: "h3",
                                h3: "h4",
                                p(props) {
                                    const { node, ...rest } = props;
                                    return (
                                        <p
                                            style={{ paddingBottom: "12px" }}
                                            {...rest}
                                        />
                                    );
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

function HardCodedArticle() {
    return (
        <div className=" bg-white shadow-lg rounded-lg  mt-4">
            <div className="flex items-center p-4 mb-5">
                <img
                    src="https://dlejuzwq61njn.cloudfront.net/wp-content/uploads/2017/04/21134350/Lonesamtal.jpg"
                    alt="Chef GPT"
                    className="w-full block"
                />
            </div>
            <div id="hasLlmResponse" className=" text-gray-800 p-4">
                <h3>Vad ska jag tänka på inför lönesamtalet?</h3>
                <p style={{ paddingBottom: "12px" }}>
                    <b>
                        Lönesamtalet är ett viktigt tillfälle för både
                        arbetsgivare och arbetstagare att diskutera
                        prestationer, sätta upp mål och justera lönenivåer.
                        Förberedelser är nyckeln till framgång, och det är
                        viktigt att både chefer och anställda tar samtalet på
                        allvar för att nå ett tillfredsställande resultat.
                    </b>
                </p>
                <h4>Förberedelser är A och O</h4>
                <p style={{ paddingBottom: "12px" }}>
                    Enlig AnnCharlotte Bretan, Chefs löneexpert och kursledare i
                    webbkursen ”Lönesättning och lönesamtal”, är det av största
                    betydelse att ha goda förberedelser inför lönesamtalet. Hon
                    betonar att även om inte alla blir nöjda med själva lönen,
                    kan de bli nöjda med hur samtalet genomförs. Här är några
                    punkter du bör tänka på:
                </p>
                <ol>
                    <li>
                        <p style={{ paddingBottom: "12px" }}>
                            <b>Sätt en tydlig tidsram</b> - Boka mötet flera
                            veckor i förväg och avsätt tillräckligt med tid,
                            gärna en timme. Detta ger både dig och din
                            medarbetare tid att förbereda er noggrant.
                        </p>
                    </li>
                    <li>
                        <p style={{ paddingBottom: "12px" }}>
                            <b>Bakgrundsfakta</b> - Se över personuppgifter,
                            ansvarsområden, arbetsuppgifter och tidigare
                            överenskommelser. Att ha en tydlig bild av
                            medarbetarens prestation och utveckling är centralt.
                        </p>
                    </li>
                    <li>
                        <p style={{ paddingBottom: "12px" }}>
                            <b>Använd en mall</b> - Genom att följa en
                            fördefinierad struktur för samtalet, säkerställer du
                            att inget viktigt förbises och att samtalet hålls
                            konsekvent.
                        </p>
                    </li>
                </ol>
                <h4>Praktiska Förberedelser</h4>
                <p style={{ paddingBottom: "12px" }}>
                    Georg Frick, arbetsgivarkonsult inom lönefrågor och
                    arbetsrätt, anser att det är viktigt att ta hänsyn till
                    flera grundläggande aspekter för att lyckas med
                    lönesamtalet. Här är några praktiska tips:
                </p>
                <ol>
                    <li>
                        <p style={{ paddingBottom: "12px" }}>
                            <b>Lönestatistik</b> - Gör din research och ta reda
                            på hur lönen ligger till jämfört med andra
                            medarbetare inom företaget och branschen i stort.
                            Använd källor som fackföreningar eller
                            lönekartläggningar.
                        </p>
                    </li>
                    <li>
                        <p style={{ paddingBottom: "12px" }}>
                            <b>Företagets budget</b> - Var medveten om den
                            ekonomiska ramen du har att arbeta med. Om budgeten
                            är begränsad, överväg alternativa erbjudanden som
                            ökad flexibilitet eller vidareutbildning.
                        </p>
                    </li>
                    <li>
                        <p style={{ paddingBottom: "12px" }}>
                            <b>Ostörd miljö</b> - Stäng av mobil och dator och
                            håll samtalet i ett privat rum där ni inte blir
                            störda. Detta säkerställer att samtalet får den
                            fokus och respekt det förtjänar.
                        </p>
                    </li>
                </ol>
                <h4>Mål och Bedömningar</h4>
                <p style={{ paddingBottom: "12px" }}>
                    Att ha tydliga mål och vara medveten om medarbetarens
                    prestation är kritiskt för en rättvis och konstruktiv
                    dialog. Enligt Chefs undersökning om löneförhandling från
                    2015 är temat att motivera medarbetarna inte främst en fråga
                    om lönen, utan om att undanröja missnöje. Här är några tips
                    från Chef:
                </p>
                <ol>
                    <li>
                        <p style={{ paddingBottom: "12px" }}>
                            <b>Lönekriterier</b> - Dessa bör vara tydligt
                            definierade och baserade på företagets egna mål och
                            verksamhetsbehov. Bedöm prestationer utifrån dessa
                            och håll samtalet fritt från personliga egenskaper.
                        </p>
                    </li>
                    <li>
                        <p style={{ paddingBottom: "12px" }}>
                            <b>Självskattning</b> - Låt medarbetaren själv
                            skatta sin prestation i förhållande till specifika
                            mål som satts upp under året. Detta ger ett underlag
                            som ni båda kan utgå ifrån under samtalet.
                        </p>
                    </li>
                </ol>
                <h4>Att hantera reaktioner</h4>
                <p style={{ paddingBottom: "12px" }}>
                    Förutsäg och planera hur du ska hantera möjliga reaktioner
                    på ditt löneförslag. "Fundera på hur du tror att din
                    medarbetare kan komma att reagera på din bedömning och ditt
                    löneförslag. Det är lättare att möta starka reaktioner om du
                    har förberett dig”, säger AnnCharlotte Bretan. Om en
                    medarbetare inte är nöjd med utfallet kan det vara klokt att
                    pausa samtalet och planera in ett uppföljande möte.
                </p>
                <h4>Sammanfattning</h4>
                <p style={{ paddingBottom: "12px" }}>
                    En väl förberedd chef och medarbetare kan göra lönesamtalet
                    till en givande diskussion där båda parter känner sig nöjda.
                    Använd konkreta verktyg som lönestatistik och tydliga
                    lönekriterier för att skapa en rättvis och transparent
                    dialog. Kom också ihåg att dokumentera det som diskuteras
                    och de överenskommelser som görs.
                </p>
                <p style={{ paddingBottom: "12px" }}>
                    Att se lönesamtalet som en möjlighet att bygga vidare på
                    medarbetarens utveckling och engagemang inom företaget,
                    snarare än bara en förhandlingssituation, kan skapa bättre
                    förutsättningar för både trivsel och prestation i framtiden.
                </p>
            </div>
        </div>
    );
}

export default LLMResponseComponent;
