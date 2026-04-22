export const estimateReadingTime = (content) => {
    const text = content.replace(/<[^>]+>/g, "");

    const words = text.trim().split(/\s+/).length;

    const wordsPerSecond = 3;
    const seconds = words / wordsPerSecond;

    const readTime = Math.ceil(seconds);

    return readTime;
};

export const generateThumbnailFromVideo = (videoFile, seekTo = 1.0) => {
    return new Promise((resolve, reject) => {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.muted = true;

        video.onloadeddata = () => {
            video.currentTime = seekTo;
        };

        video.onseeked = () => {
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext("2d");
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            canvas.toBlob(
                (blob) => {
                    URL.revokeObjectURL(video.src);
                    resolve(blob);
                },
                "image/jpeg",
                0.85
            );
        };

        video.onerror = (e) => {
            reject(new Error("Error loading video"));
        };

        video.src = URL.createObjectURL(videoFile);
    });
};

export const formatTimeShort = (seconds) => {
    seconds = Math.max(0, Math.floor(seconds));

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const mm = String(minutes).padStart(2, "0");
    const ss = String(secs).padStart(2, "0");

    return hours > 0 ? `${String(hours).padStart(2, "0")}:${mm}:${ss}` : `${mm}:${ss}`;
};

export const calculateCourseStats = (courseData) => {
    if (!courseData?.sections)
        return { courseDuration: 0, totalLectures: 0, totalResources: 0, sections: [] };

    let courseDuration = 0;
    let totalLectures = 0;
    let totalResources = 0;
    let totalQuizzes = 0;

    const sections = courseData.sections.map(section => {
        let sectionLectures = 0;
        let sectionResources = 0;
        let sectionQuizzes = 0;

        const sectionDuration = section.curriculumItems?.reduce((sum, ci) => {
            if ((ci.type === "video" || ci.type === "article") && ci?.content?.duration) {
                sectionLectures += 1;
                sectionResources += ci?.resources?.length || 0;
                return sum + ci.content.duration;
            }
            if (ci.itemType === "Quiz") {
                sectionQuizzes += 1
            }
            return sum;
        }, 0);

        courseDuration += sectionDuration;
        totalLectures += sectionLectures;
        totalResources += sectionResources;
        totalQuizzes += sectionQuizzes;

        return {
            sectionId: section._id,
            sectionDuration,
            sectionLectures,
            sectionResources,
            sectionQuizzes
        };
    });

    return {
        courseDuration,
        totalLectures,
        totalResources,
        totalQuizzes,
        sections
    };
};

export const getTotals = (data) => {
    if (!Array.isArray(data) || data.length === 0) {
        return { totalMinutes: 0 };
    }

    const totalMinutes = Number(
        data.reduce((sum, item) => sum + (Number(item.minutes) || 0), 0).toFixed(2)
    );

    return { totalMinutes };
};

export const getTotalLearningItems = (data) => {
    if (!Array.isArray(data) || data.length === 0) return { totalLectures: 0, totalQuizzes: 0 };

    return data.reduce(
        (totals, item) => {
            totals.totalLectures += item.lectureCount || 0;
            totals.totalQuizzes += item.quizCount || 0;
            return totals;
        },
        { totalLectures: 0, totalQuizzes: 0 }
    );
};
