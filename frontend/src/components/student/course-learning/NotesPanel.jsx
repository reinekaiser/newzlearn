import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X, Edit2, Trash2, Clock } from "lucide-react";
import {
  closeNotesPanel,
  openEditNoteModal,
  deleteNote,
} from "@/redux/features/notesSlice";
import {
  useGetNotesByLectureQuery,
  useGetNotesByCourseQuery,
  useGetNotesBySectionQuery,
  useGetSectionByLectureQuery,
  useDeleteNoteMutation,
} from "@/redux/api/notesApiSlice";
import { seekVideo } from "@/redux/features/videoControlSlice";

const formatDuration = (s) => {
  if (!s || isNaN(s)) return "00:00";
  const h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60),
    sec = s % 60;
  return (h ? [h, m, sec] : [m, sec])
    .map((v) => String(v).padStart(2, "0"))
    .join(":");
};

const NotesPanel = ({ lectureId, courseId, sectionId }) => {
  const dispatch = useDispatch();
  const { isNotesPanelOpen } = useSelector((state) => state.notes);
  const [deleteNoteMutation] = useDeleteNoteMutation();
  const [filter, setFilter] = useState("current");
  const [sortBy, setSortBy] = useState("newest");
  

  // Popup xác nhận xóa
  const [showConfirm, setShowConfirm] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);

  const {
    data: sectionData,
    isLoading: isSectionDataLoading,
  } = useGetSectionByLectureQuery(lectureId, {
    skip: !lectureId || !!sectionId,
  });

  const actualSectionId = sectionId || sectionData?.sectionId;

  const {
    data: sectionNotes = [],
    isLoading: isSectionLoading,
    error: sectionError,
  } = useGetNotesBySectionQuery(actualSectionId, {
    skip: !actualSectionId || !isNotesPanelOpen || filter !== "current",
  });

  // const {
  //   data: lectureNotes = [],
  //   isLoading: isLectureLoading,
  //   error: lectureError,
  // } = useGetNotesByLectureQuery(lectureId, {
  //   skip: !lectureId || !isNotesPanelOpen || filter !== "current" || !!actualSectionId,
  // });

  const {
    data: courseNotes = [],
    isLoading: isCourseLoading,
    error: courseError,
  } = useGetNotesByCourseQuery(courseId, {
    skip: !courseId || !isNotesPanelOpen || (filter !== "all" && filter !== "current"),
  });

  const notes =
    filter === "current"
      ? actualSectionId
        ? sectionNotes
        : courseNotes
      : courseNotes;

  const isLoading =
    filter === "current"
      ? actualSectionId
        ? isSectionLoading
        : isCourseLoading
      : isCourseLoading;

  const error =
    filter === "current"
      ? actualSectionId
        ? sectionError
        : courseError
      : courseError;

  const handleClose = () => dispatch(closeNotesPanel());
  const handleEditNote = (note) => dispatch(openEditNoteModal(note));

  const confirmDeleteNote = (noteId) => {
    setNoteToDelete(noteId);
    setShowConfirm(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!noteToDelete) return;
    try {
      await deleteNoteMutation(noteToDelete).unwrap();
      dispatch(deleteNote(noteToDelete));
      setShowConfirm(false);
      setNoteToDelete(null);
    } catch (error) {
      console.error("Lỗi khi xóa ghi chú:", error);
      alert("Có lỗi xảy ra khi xóa ghi chú");
    }
  };

  const sortedNotes = [...notes].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt) - new Date(a.createdAt);
      case "oldest":
        return new Date(a.createdAt) - new Date(b.createdAt);
      case "timestamp":
        return a.timestamp - b.timestamp;
      default:
        return 0;
    }
  });

  const handleSeekToTimestamp = (timestamp) => {
    dispatch(seekVideo(timestamp));
  };

  if (!isNotesPanelOpen) return null;

  return (
    <>
      {/* Overlay panel */}
      <div className="fixed inset-0 bg-black/50 flex justify-end z-50">
        <div className="bg-white w-full max-w-md h-full shadow-2xl animate-slide-left flex flex-col">
          {/* Header */}
          <div className="pt-2 border-b border-gray-200">
            <div className="px-2 flex justify-end">
              <button
                onClick={handleClose}
                className="py-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex items-center justify-between pb-3 px-6 ">
              <h2 className="text-2xl font-semibold text-gray-900">Ghi chú của tôi</h2>
              <div className="flex items-center gap-3">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm text-black"
                >
                  <option value="current">Trong chương hiện tại</option>
                  <option value="all">Tất cả</option>
                </select>

                {/* <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm text-black"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                  <option value="timestamp">Theo thời gian video</option>
                </select> */}
              </div>
            </div>
          </div>

          {/* Notes List */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="text-center text-red-500 py-8">
                <div className="text-lg font-medium mb-2">Có lỗi xảy ra khi tải ghi chú</div>
                <div className="text-sm text-gray-500">
                  {error?.data?.message || "Vui lòng thử lại sau"}
                </div>
              </div>
            ) : sortedNotes.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Clock size={40} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {filter === "current"
                    ? "Chưa có ghi chú trong chương này"
                    : "Chưa có ghi chú nào"}
                </h3>
                <p className="text-gray-500">
                  {filter === "current"
                    ? "Hãy thêm ghi chú khi xem video trong chương này để nhớ những điểm quan trọng!"
                    : "Hãy ghi chép để nhớ những gì bạn đã học!"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedNotes.map((note) => (
                  <div
                    key={note._id}
                    className="border-b border-gray-100 pb-4 last:border-none"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div 
                            className="bg-blue-500 text-white text-xs font-semibold px-2 py-0.5 rounded hover:cursor-pointer hover:bg-blue-600"
                            onClick={() => handleSeekToTimestamp(note.timestamp)}
                          >
                            {formatDuration(note.timestamp)}
                          </div>
                          <span className="text-sm font-semibold text-blue-600">
                            {note.lectureId?.title || "Bài học"}
                          </span>
                          {/* <span className="text-sm text-gray-500">
                            {new Date(note.createdAt).toLocaleDateString("vi-VN")}
                          </span> */}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditNote(note)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Edit2 size={14} className="text-gray-600" />
                        </button>
                        <button
                          onClick={() => confirmDeleteNote(note._id)}
                          className="p-1 hover:bg-gray-100 rounded text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-2 bg-[#F7FBFF] rounded-md p-3">
                      <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">
                        {note.content}
                      </p>
                      {note.content.length > 100 && (
                        <div className="mt-2 text-xs text-gray-500">
                          {note.content.length} ký tự
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Popup Xác nhận xóa */}
   {showConfirm && (
  <div className="fixed inset-0 z-60 flex items-center justify-center">
    {/* Nền mờ fade-in */}
    <div
      className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fadeIn"
      onClick={() => setShowConfirm(false)}
    ></div>

    {/* Popup box */}
    <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-[90%] text-center transform animate-zoomIn">
      <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
        <Trash2 className="text-red-500" size={28} />
      </div>

      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        Xóa ghi chú này?
      </h3>
      <p className="text-gray-600 text-sm mb-6">
        Ghi chú sẽ bị xóa vĩnh viễn và không thể khôi phục.
      </p>

      <div className="flex justify-center gap-3">
        <button
          onClick={() => setShowConfirm(false)}
          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-all duration-200"
        >
          Hủy
        </button>
        <button
          onClick={handleDeleteConfirmed}
          className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 shadow-sm transition-all duration-200"
        >
          Xóa
        </button>
      </div>
    </div>
  </div>
)}

    </>
  );
};

export default NotesPanel;
