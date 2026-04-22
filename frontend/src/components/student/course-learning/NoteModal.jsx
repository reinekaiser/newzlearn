import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Bold, Italic, List, ListOrdered } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  closeNoteModal,
  addNote,
  updateNote,
} from '@/redux/features/notesSlice';
import {
  useCreateNoteMutation,
  useUpdateNoteMutation,
} from '@/redux/api/notesApiSlice';
import { toast } from 'react-toastify'; 

const formatDuration = (s) => {
  if (!s || isNaN(s)) return '00:00';
  const h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60),
    sec = s % 60;
  return (h ? [h, m, sec] : [m, sec])
    .map((v) => String(v).padStart(2, '0'))
    .join(':');
};

const NoteModal = () => {
  const dispatch = useDispatch();
  const {
    isModalOpen,
    editingNote,
    currentTimestamp,
    currentItemId,
    currentCourseId,
  } = useSelector((state) => state.notes);

  const [createNote] = useCreateNoteMutation();
  const [updateNoteMutation] = useUpdateNoteMutation();

  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (editingNote) {
      setContent(editingNote.content || '');
    } else {
      setContent('');
    }
    if (isModalOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current.focus(), 150);
    }
  }, [editingNote, isModalOpen]);

  const handleClose = () => {
    dispatch(closeNoteModal());
  };

  const handleSave = async () => {
    if (!content.trim()) {
      toast.warning('Vui lòng nhập nội dung ghi chú');
      return;
    }

    setIsLoading(true);
    try {
      const noteData = {
        content: content.trim(),
        timestamp: currentTimestamp,
        lectureId: currentItemId,
        courseId: currentCourseId,
      };

      if (editingNote) {
        const result = await updateNoteMutation({
          id: editingNote._id,
          ...noteData,
        }).unwrap();
        dispatch(updateNote(result));
        toast.success('Đã cập nhật ghi chú thành công', { position: "bottom-right" });
      } else {
        const result = await createNote(noteData).unwrap();
        dispatch(addNote(result));
        toast.success('Tạo ghi chú mới thành công', { position: "bottom-right" });
      }


      setTimeout(() => handleClose(), 1500);
    } catch (error) {
      console.error('Lỗi khi lưu ghi chú:', error);
      toast.error('Có lỗi xảy ra khi lưu ghi chú ', { position: "bottom-right" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 ">
      {/* Modal */}
      <div className=" bg-white  w-full  rounded-t-2xl shadow-lg border border-gray-200 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingNote ? 'Chỉnh sửa ghi chú tại' : 'Thêm ghi chú tại'}
            </h2>
            <div className="bg-blue-500 text-white px-3 py-1 rounded-md font-medium text-sm">
              {formatDuration(currentTimestamp)}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-3">
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-2 p-3 bg-gray-50 border-b border-gray-300">
    
              <div className="flex items-center gap-1">
                <button className="p-2 hover:bg-gray-200 rounded">
                  <Bold size={16} />
                </button>
                <button className="p-2 hover:bg-gray-200 rounded">
                  <Italic size={16} />
                </button>
                <button className="p-2 hover:bg-gray-200 rounded">
                  <List size={16} />
                </button>
                <button className="p-2 hover:bg-gray-200 rounded">
                  <ListOrdered size={16} />
                </button>
              </div>
            </div>

            <textarea
              ref={textareaRef}
              placeholder="Nội dung ghi chú..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full p-4 min-h-20 resize-none focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-5">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="px-6"
            >
              HỦY BỎ
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading || !content.trim()}
              className="px-6 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading
                ? 'Đang lưu...'
                : editingNote
                ? 'CẬP NHẬT GHI CHÚ'
                : 'TẠO GHI CHÚ'}
            </Button>
          </div>
        </div>
      </div>

      {/* 2 cột trống bên phải */}
      <div className="col-span-2"></div>
    </div>
  );
};

export default NoteModal;
