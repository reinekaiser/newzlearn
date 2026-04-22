export const streamToString = (stream) => {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on("data", (chunk) => chunks.push(chunk));
        stream.on("error", reject);
        stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    });
};

const parseVTT = (vttContent) => {
    const lines = vttContent.split("\n");
    const captions = [];
    let currentCaption = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line === "WEBVTT" || line === "") {
            if (currentCaption) {
                captions.push(currentCaption);
                currentCaption = null;
            }
            continue;
        }

        if (line.includes("-->")) {
            const [start, end] = line.split("-->").map((t) => t.trim());
            currentCaption = {
                start: timeToSeconds(start),
                end: timeToSeconds(end),
                text: "",
            };
        } else if (currentCaption) {
            currentCaption.text += (currentCaption.text ? "\n" : "") + line;
        }
    }

    if (currentCaption) {
        captions.push(currentCaption);
    }

    return captions;
};

const timeToSeconds = (timeString) => {
    const parts = timeString.split(":");
    const secondsPart = parts[parts.length - 1].split(".");
    const seconds = secondsPart[0];
    const milliseconds = secondsPart[1] || "0";
    const minutes = parts.length > 1 ? parts[parts.length - 2] : "0";
    const hours = parts.length > 2 ? parts[0] : "0";

    return (
        parseInt(hours) * 3600 +
        parseInt(minutes) * 60 +
        parseInt(seconds) +
        parseInt(milliseconds) / 1000
    );
};

const secondsToVTTTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 1000);
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(
        secs
    ).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`;
};

const generateVTT = (captions) => {
    let vtt = "WEBVTT\n\n";

    captions.map((caption) => {
        const startTime = secondsToVTTTime(caption.start);
        const endTime = secondsToVTTTime(caption.end);
        vtt += `${startTime} --> ${endTime}\n`;
        vtt += `${caption.text}\n\n`;
    });

    return vtt;
};

const parseHTML = (htmlContent) => {
    const root = parse(htmlContent);
    
    // Remove script và style tags
    root.querySelectorAll('script, style').forEach(el => el.remove());
    
    // Get text content
    let text = root.textContent || '';
    
    // Clean up
    text = text
        .replace(/\s+/g, ' ') // Multiple spaces to single space
        .replace(/\n+/g, '\n') // Multiple newlines to single
        .trim();
    
    return text;
}

const chunkVideoTranscript = (cues, maxWords = 150, overlapWords = 30) => {
    const chunks = [];
    let currentChunk = {
        text: '',
        startTime: null,
        endTime: null,
        wordCount: 0
    };
    
    for (const cue of cues) {
        const words = cue.text.split(' ');

        if (currentChunk.wordCount + words.length > maxWords && currentChunk.text) {
            chunks.push({
                text: currentChunk.text.trim(),
                startTime: currentChunk.startTime,
                endTime: currentChunk.endTime
            });
            
            // Tạo overlap: lấy một số từ cuối của chunk trước
            const overlapText = currentChunk.text
                .split(' ')
                .slice(-overlapWords)
                .join(' ');
            
            currentChunk = {
                text: overlapText + ' ' + cue.text,
                startTime: cue.startTime,
                endTime: cue.endTime,
                wordCount: overlapWords + words.length
            };
        } else {
            if (!currentChunk.startTime) {
                currentChunk.startTime = cue.startTime;
            }
            currentChunk.endTime = cue.endTime;
            currentChunk.text += (currentChunk.text ? ' ' : '') + cue.text;
            currentChunk.wordCount += words.length;
        }
    }
    
    if (currentChunk.text.trim()) {
        chunks.push({
            text: currentChunk.text.trim(),
            startTime: currentChunk.startTime,
            endTime: currentChunk.endTime
        });
    }
    
    return chunks;
}

const chunkArticleText = (text, maxWords = 150, overlapWords = 30) => {
    const words = text.split(' ');
    const chunks = [];
    
    for (let i = 0; i < words.length; i += maxWords - overlapWords) {
        const chunkWords = words.slice(i, i + maxWords);
        const chunk = chunkWords.join(' ').trim();
        
        if (chunk) {
            chunks.push({ text: chunk });
        }
    }
    
    return chunks;
}

export {
    parseVTT,
    secondsToVTTTime,
    parseHTML,
    generateVTT,
    chunkVideoTranscript,
    chunkArticleText,
};