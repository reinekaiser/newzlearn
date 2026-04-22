import { useGetCurriculumItemByIdQuery } from "@/redux/api/coursePublicApiSlice";
import React, { useRef, useState, useEffect, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { IoBook } from "react-icons/io5";
import { MdAdd } from "react-icons/md";
import Quiz from "@/components/student/course-learning/Quiz";
import NoteModal from "@/components/student/course-learning/NoteModal";
import {
  useGetItemProgressQuery,
  useUpdateItemProgressMutation,
} from "@/redux/api/progressApiSlice";
import { useDispatch, useSelector } from "react-redux";
import { openAddNoteModal } from "@/redux/features/notesSlice";
import VideoPlayer from "@/components/student/course-detail/VideoPlayer";
import { clearVideoCommand } from "@/redux/features/videoControlSlice";
import { useGetLectureQuestionsQuery, useGetLectureResultsQuery, useSubmitLectureAnswerMutation } from "@/redux/api/lectureQuestionApiSlice";
import VideoQuestionOverlay from "@/components/student/course-learning/VideoQuestionOverlay";
import ArticleViewer from "@/components/student/course-learning/ArticleViewer";
import { toast } from "react-toastify";
import { useGetNotesByLectureQuery } from "@/redux/api/notesApiSlice";
import { Spinner } from "@/components/ui/spinner";


const formatDuration = (s) => {
  if (!s || isNaN(s)) return "00:00";
  const h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60),
    sec = s % 60;
  return (h ? [h, m, sec] : [m, sec])
    .map((v) => String(v).padStart(2, "0"))
    .join(":");
};

const CoursePlayer = ({ itemId, itemType, onDoneChange }) => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);
  const { data: item, isLoading: isItemLoading } =
    useGetCurriculumItemByIdQuery(
      { itemId, itemType },
      { skip: !itemId || !itemType }
    );
  const { data: itemProgress, isLoading: isProgressLoading } =
    useGetItemProgressQuery(
      {
        courseId: item?.courseId,
        sectionId: item?.sectionId,
        itemId: item?._id,
      },
      { skip: !item || !item?._id, refetchOnMountOrArgChange: true }
    );
  const { data: questions, isLoading: isQuestionsLoading } = useGetLectureQuestionsQuery(itemId, {
    skip: !itemId,
    selectFromResult: ({ data }) => ({
      data: data ? data.questions : [],
    }),
  });
  const { data: resultData } = useGetLectureResultsQuery(
    { userId: userInfo?._id, lectureId: itemId },
    { skip: !userInfo?._id || !itemId }
  );
  const { data: notes = [] } = useGetNotesByLectureQuery(itemId, {
    skip: !itemId
  });
  const [submitAnswer, { isLoading: isSubmitting }] = useSubmitLectureAnswerMutation();

  const [updateProgress] = useUpdateItemProgressMutation();
  const videoRef = useRef(null);
  const lastTriggeredTime = useRef(-1);
  const currentTimeRef = useRef(0);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [currentQuestionId, setCurrentQuestionId] = useState(null);


  //seek to note
  const { seekTo, play, pause } = useSelector(
    (state) => state.videoControl
  );
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (seekTo !== null) {
      video.setCurrentTime(Math.min(seekTo, video.getDuration()));
      dispatch(clearVideoCommand());
    }
    if (play) {
      video.play();
      dispatch(clearVideoCommand());
    }

    if (pause) {
      video.pause();
      dispatch(clearVideoCommand());
    }
  }, [seekTo, play, pause, dispatch]);

  const handleAddNote = () => {
    videoRef.current?.pause();
    dispatch(
      openAddNoteModal({
        timestamp: currentTime,
        itemId: itemId,
        courseId: item?.courseId,
      })
    );
  };

  const noteMarkers = useMemo(() => {
    if (!notes || notes.length === 0) return [];
    return notes.map((note) => ({
      id: note._id,
      time: Number(note.timestamp),
      content: note.content,
      type: "note",
    }));
  }, [notes]);

  //done
  useEffect(() => {
    setIsDone(itemProgress?.isCompleted);
  }, [itemProgress]);
  useEffect(() => {
    if (onDoneChange) {
      onDoneChange(isDone);
    }
  }, [isDone, onDoneChange]);

  //lưu progress
  useEffect(() => {
    if (!item || !videoRef.current) return;

    const currentVideo = videoRef.current;
    let hasSavedInitialProgress = false;
    let hasSavedCompletion = false;
    let interval = null;

    const handleSaveProgress = async (currentTime, isUnmounting = false) => {
      let current;
      if (currentTime) current = currentTime;
      else current = currentVideo.getCurrentTime?.() || 0;
      currentTimeRef.current = current;
      const watchedSeconds = current || itemProgress?.watchedSeconds || 0;
      // if (watchedSeconds < (itemProgress?.watchedSeconds || 0)) return;
      const totalSeconds = item?.content.duration || itemProgress?.totalSeconds || 0;
      const progressPercent = totalSeconds
        ? Math.round((watchedSeconds / totalSeconds) * 100)
        : 0;
      const payload = {
        courseId: item.courseId,
        sectionId: item.sectionId,
        itemId: item._id,
        itemType: "video",
        watchedSeconds,
        totalSeconds,
        progressPercent,
      };
      try {
        if (isUnmounting) {
          updateProgress(payload);
        } else {
          await updateProgress(payload).unwrap();
        }
        // console.log("Progress video saved:", res);
      } catch (err) {
        console.error("Update video failed:", err);
      }
    };
    const saveInitialProgress = async () => {
      if (!hasSavedInitialProgress) {
        hasSavedInitialProgress = true;
        await handleSaveProgress();
      }
    };

    setTimeout(() => {
      saveInitialProgress();
    }, 300);

    interval = setInterval(() => {
      if (!videoRef.current) return;
      const watchedSeconds = videoRef.current.getCurrentTime?.() || 0;
      const totalSeconds = videoRef.current.getDuration?.() || 0;
      const progressPercent = totalSeconds
        ? Math.round((watchedSeconds / totalSeconds) * 100)
        : 0;
      currentTimeRef.current = watchedSeconds;
      if (
        progressPercent >= 85 &&
        watchedSeconds > (itemProgress?.watchedSeconds || 0) &&
        watchedSeconds != totalSeconds
      ) {
        if (!hasSavedCompletion) {
          hasSavedCompletion = true;
          setIsDone(true);
        }
        handleSaveProgress();
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      if (currentTimeRef.current != 0) {
        handleSaveProgress(currentTimeRef.current, true);
      }
      setCurrentQuestionId(null);
    };
  }, [item?._id, itemProgress, updateProgress, videoRef]);



  //question
  const questionsMap = useMemo(() => {
    if (!questions || questions.length === 0) return new Map();
    const map = new Map();
    questions.forEach((q) => {
      map.set(q.displayedAt, q);
    });
    return map;
  }, [questions]);
  const currentQuestion = useMemo(() => {
    if (!currentQuestionId) return null;
    return questions.find(q => q._id === currentQuestionId) || null;
  }, [questions, currentQuestionId]);

  useEffect(() => {
    if (!currentQuestionId) return;

    const exists = questions.some(q => q._id === currentQuestionId);

    if (!exists) {
      setCurrentQuestionId(null);
      videoRef.current?.play();
    }
  }, [questions, currentQuestionId]);

  const handleVideoTimeUpdate = (currentTime) => {
    const currentSecond = Math.floor(currentTime);
    setCurrentTime(currentSecond);
    if (currentSecond < lastTriggeredTime.current) {
      lastTriggeredTime.current = -1;
    }

    if (currentSecond !== lastTriggeredTime.current) {
      const match = questionsMap.get(currentSecond);
      if (match) {
        videoRef.current?.pause();
        setCurrentQuestionId(match._id);
        lastTriggeredTime.current = currentSecond;
      }
    }
  }

  const handleContinue = () => {
    setCurrentQuestionId(null);
    videoRef.current?.play();
  };

  useEffect(() => {
    lastTriggeredTime.current = -1;
  }, [questions]);

  const questionMarkers = useMemo(() => {
    if (!questions || questions.length === 0) return [];

    return questions.map((q) => ({
      id: q._id,
      time: Number(q.displayedAt) - 0.00001,
      type: "question",
    }));
  }, [questions]);

  //answer
  const answeredMap = useMemo(() => {
    if (!resultData?.answers) return {};
    const map = {};
    resultData.answers.forEach(ans => {
      map[ans.questionId] = ans.selectedOptionId;
    });
    return map;
  }, [resultData]);

  const handleSubmitAnswer = async (selectedOptionId) => {
    if (!currentQuestion) return;
    try {
      await submitAnswer({
        userId: userInfo?._id,
        lectureId: itemId,
        questionId: currentQuestion._id,
        selectedOptionId
      }).unwrap();
    } catch (error) {
      console.error("Lỗi submit:", error);
      toast.error("Không thể gửi câu trả lời");
    }
  };
  const savedAnswerId = currentQuestion ? answeredMap[currentQuestion._id] : null

  if ((isItemLoading && !item) || (isProgressLoading && !itemProgress)) {
    return (
      <div className="px-4 md:px-12 lg:px-24 mt-12 space-y-4">
        <Skeleton className="h-10 w-3/5" />
        <Skeleton className="h-5 w-1/4" />
        <Skeleton className="h-px w-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-4/5" />
      </div>
    );
  }

  if (!item || !itemId || !itemType) {
    return (
      <div className="px-4 md:px-12 lg:px-24 mt-12 space-y-4">
        <Skeleton className="h-10 w-3/5" />
        <p className="mt-4">Không tìm thấy nội dung bài học.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="grow">
        {itemType === "Lecture" ? (
          item.type === "article" ? (
            <ArticleRender
              item={item}
              itemProgress={itemProgress}
              setIsDone={setIsDone}
            />
          ) : (
            <div className="flex flex-col">
              <div className="relative w-full bg-black h-[45vh] md:h-[50vh] lg:h-[calc(60vh-3px)]">
                {item?.content?.publicURL ? (
                  <>
                    {!isVideoReady && (
                      <div className="absolute inset-0 z-60 flex flex-col justify-center items-center bg-gray-900 w-full h-full">
                        <Skeleton className="h-full w-full" />
                        <div className="absolute flex items-center gap-2">
                          <Spinner className={``} />
                          <div className="font-semibold text-sm text-gray-500">Đang tải video...</div>
                        </div>
                      </div>
                    )}

                    <VideoPlayer
                      key={item._id + "_" + itemProgress?.watchedSeconds}
                      ref={videoRef}
                      videoUrl={item.content.hlsURL || item.content.publicURL}
                      onTimeUpdate={handleVideoTimeUpdate}
                      onPlayStateChange={setIsPlaying}
                      startTime={itemProgress?.watchedSeconds ? itemProgress?.watchedSeconds : 0}
                      captions={item.content.captions || []}
                      videoHeight={`h-[45vh] md:h-[50vh] lg:h-[calc(60vh-3px)]`}
                      poster={item?.content.thumbnailURL || "/logo.png"}
                      questionMarkers={questionMarkers}
                      noteMarkers={noteMarkers}
                      onReady={(data) => {
                        console.log("[Parent] Đã nhận tín hiệu onReady từ con!");
                        console.log(" -> Data nhận được:", data);
                        setIsVideoReady(true);
                      }}
                    >
                      {currentQuestion && (
                        <VideoQuestionOverlay
                          question={currentQuestion}
                          onContinue={handleContinue}
                          isCompleted={!!savedAnswerId}
                          savedAnswerId={savedAnswerId}
                          isSubmitting={isSubmitting}
                          onSubmit={handleSubmitAnswer}
                        />
                      )}
                    </VideoPlayer>
                  </>


                ) : (
                  <Skeleton className="w-full h-full" />
                )}

              </div>
              <div className=" mx-12 mt-8 md:mx-12 md:mt-12 lg:mx-20 lg:mt-12 overflow-auto">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="text-2xl lg:text-3xl font-semibold mb-1">
                    <p>{item.title}</p>
                    <span className="text-gray-500 text-sm font-normal">
                      Cập nhật{" "}
                      {new Date(item?.updatedAt).toLocaleDateString("vi-VN", {
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <button
                    onClick={handleAddNote}
                    className="flex-shrink-0 rounded-md bg-blue-100 hover:bg-blue-200 px-3 py-2 flex items-center justify-center transition-colors"
                  >
                    <MdAdd className="h-5 w-5" />
                    <p className="text-sm font-normal ml-2">
                      Thêm ghi chú tại{" "}
                      <span className="font-semibold">
                        {formatDuration(currentTime)}
                      </span>
                    </p>
                  </button>
                </div>
                <div className="py-5 text-gray-600">{item.description}</div>
              </div>
            </div>
          )
        ) : (
          <div className="flex flex-col">
            <div className="w-full border-b-2 border-b-gray-200 h-[45vh] md:h-[50vh] lg:h-[calc(60vh+3px)] overflow-y-auto">
              <Quiz
                item={item}
                setIsDone={setIsDone}
                itemProgress={itemProgress}
                isProgressLoading={isProgressLoading}
              />
            </div>
            <div className="mx-12 mt-8 md:mx-12 md:mt-12 lg:mx-20 lg:mt-12">
              <div className="text-2xl lg:text-3xl font-semibold mb-1">
                <p>{item.title}</p>
                <span className="text-gray-500 text-sm font-normal">
                  Cập nhật{" "}
                  {new Date(item?.updatedAt).toLocaleDateString("vi-VN", {
                    month: "2-digit",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        )}
        <NoteModal />
      </div>

      <footer className="w-full text-sm text-center py-5 flex items-center justify-center">
        © {new Date().getFullYear()} <IoBook className="mx-3 text-blue-500" />{" "}
        Newzlearn
      </footer>
    </div>
  );
};

const ArticleRender = ({ item, itemProgress, setIsDone }) => {
  const articleRef = useRef(null);
  const [updateProgress] = useUpdateItemProgressMutation();
  const lastProgressRef = useRef(0);
  const saveTimeoutRef = useRef(null);
  const hasCompletedRef = useRef(false);

  const saveProgress = async (progressPercentToSave) => {
    if (!item) return;
    try {
      await updateProgress({
        courseId: item.courseId,
        sectionId: item.sectionId,
        itemId: item._id,
        itemType: "article",
        watchedSeconds: null,
        totalSeconds: item.content?.duration,
        progressPercent: progressPercentToSave,
      }).unwrap();
      // console.log("Article progress saved:", progressPercentToSave);

      if (
        progressPercentToSave >= 85 &&
        progressPercentToSave > itemProgress?.progressPercent
      ) {
        hasCompletedRef.current = true;
        setIsDone(true);
        // console.log("Article completed (>85%)");
      }
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  const getProgressPercent = (container) => {
    const { scrollTop, scrollHeight, clientHeight } = container;
    const denominator = scrollHeight - clientHeight;
    if (denominator <= 0) return 100;
    return Math.min(100, Math.round((scrollTop / denominator) * 100));
  };

  useEffect(() => {
    if (!articleRef.current || !itemProgress) return;
    const container = articleRef.current;
    const { progressPercent } = itemProgress;
    if (
      progressPercent > 0 &&
      container.scrollHeight > container.clientHeight
    ) {
      const scrollTop =
        ((container.scrollHeight - container.clientHeight) * progressPercent) /
        100;
      container.scrollTop = scrollTop;
    }
  }, [itemProgress]);

  useEffect(() => {
    if (!item || !articleRef.current) return;
    const container = articleRef.current;
    const initialProgress = itemProgress?.progressPercent || 0;
    saveProgress(initialProgress);
    lastProgressRef.current = initialProgress;

    const handleScroll = () => {
      const currentProgress = getProgressPercent(container);
      if (lastProgressRef.current >= 100) return;

      if (currentProgress > lastProgressRef.current) {
        lastProgressRef.current = currentProgress;

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
          saveProgress(currentProgress);
        }, 800);
      }
    };

    container.addEventListener("scroll", handleScroll);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      const finalProgress = lastProgressRef.current;
      if (finalProgress > 0 && finalProgress > itemProgress?.progressPercent) {
        saveProgress(finalProgress);
      }
    };
  }, [item?._id, item.courseId, item.sectionId]);

  if (!itemProgress) {
    return (
      <div className="px-4 md:px-12 lg:px-24 mt-12 space-y-4">
        <Skeleton className="h-10 w-3/5" />
        <Skeleton className="h-5 w-1/4" />
        <Skeleton className="h-[1px] w-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-4/5" />
      </div>
    );
  }

  return (
    <div
      ref={articleRef}
      className="px-4 sm:px-8 md:px-12 lg:px-24 py-8 overflow-y-auto max-h-[90vh]"
    >
      <p className="text-2xl lg:text-3xl font-semibold mb-1">{item.title}</p>
      <span className="text-gray-600 text-sm">
        Cập nhật{" "}
        {new Date(item?.updatedAt).toLocaleDateString("vi-VN", {
          month: "2-digit",
          year: "numeric",
        })}
      </span>
      <div className="border-b border-gray-200 my-6"></div>
      <ArticleViewer content={item.content?.text} />
    </div>
  );
};

export default CoursePlayer;
