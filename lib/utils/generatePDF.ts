import html2PDF from "jspdf-html2canvas";

export const generatePDF = async (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (!section) {
        console.error("Section not found");
        return;
    }

    html2PDF(section, {
        jsPDF: {
            format: "a4",
        },
        imageType: "image/jpeg",
        output: "./pdf/generate.pdf",
    });
};
