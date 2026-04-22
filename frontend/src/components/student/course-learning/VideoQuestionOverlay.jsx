import React, { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Play, Loader2, RotateCcw, X } from "lucide-react";

const VideoQuestionOverlay = ({
    index = 0, question,
    isCompleted, savedAnswerId,
    isSubmitting, onSubmit,
    onContinue, isPreview
}) => {
    const [selectedOptionId, setSelectedOptionId] = useState(null);
    const [viewMode, setViewMode] = useState('answering'); // 'answering' | 'result'

    useEffect(() => {
        if (isCompleted && savedAnswerId) {
            setSelectedOptionId(savedAnswerId);
            setViewMode('result');
        } else {
            setSelectedOptionId(null);
            setViewMode('answering');
        }
    }, [question, isCompleted, savedAnswerId]);

    const handleConfirm = async () => {
        if (!selectedOptionId) return;

        if (isPreview) {
            setViewMode('result');
            return;
        }

        if (onSubmit) {
            await onSubmit(selectedOptionId);
            setViewMode('result');
        }
    };

    const handleRetry = () => {
        setSelectedOptionId(null);
        setViewMode('answering');
    };

    const selectedOption = question.options.find(
        opt => opt._id === selectedOptionId
    );

    return (
        <div className='absolute inset-0 flex items-center justify-center bg-black/50 p-3 animate-in fade-in duration-200 pointer-events-auto'>
            <div className="bg-white w-full max-w-xl rounded-lg overflow-hidden flex flex-col max-h-[90%] shadow-2xl">

                <div className="p-3 bg-gray-100 border-b flex justify-between items-center shrink-0">
                    <span className="font-bold text-gray-800 text-sm">Câu hỏi tương tác</span>

                    {isPreview && (
                        <button
                            onClick={onContinue}
                            className="p-1 rounded-full hover:bg-gray-200 transition"
                            aria-label="Close preview"
                        >
                            <X size={18} className="text-gray-600" />
                        </button>
                    )}
                </div>

                <div className="p-4 overflow-y-auto custom-scrollbar">
                    <div className="text-base font-medium mb-3 text-gray-800 flex items-center gap-1">
                        <span className='text-sm font-semibold tracking-wide'>Câu hỏi:</span>
                        <div className='text-sm font-semibold tracking-wide' dangerouslySetInnerHTML={{ __html: question.questionText }} />
                    </div>

                    <div className="space-y-2">
                        {question.options.map((opt) => {
                            const isSelected = selectedOptionId === opt._id;
                            const isCorrect = opt.isCorrect;

                            let containerStyle = "border-gray-200 hover:bg-gray-50 cursor-pointer hover:border-blue-300";
                            let icon = null;

                            if (viewMode === 'result') {
                                containerStyle = "cursor-default opacity-60";

                                if (isCorrect) {
                                    containerStyle = "bg-green-50 border-green-500 text-green-900 opacity-100 ring-1 ring-green-500";
                                    icon = <CheckCircle className="text-green-600 shrink-0" size={20} />;
                                } else if (isSelected && !isCorrect) {
                                    containerStyle = "bg-red-50 border-red-500 text-red-900 opacity-100 ring-1 ring-red-500";
                                    icon = <XCircle className="text-red-400 shrink-0" size={20} />;
                                }
                            } else {
                                if (isSelected) containerStyle = "bg-blue-50 border-blue-600 ring-1 ring-blue-600 shadow-sm";
                            }

                            return (
                                <div
                                    key={opt._id}
                                    onClick={() => viewMode === 'answering' && setSelectedOptionId(opt._id)}
                                    className={`py-2 px-3 border cursor-pointer rounded-md flex justify-between items-center transition-all duration-200 ${containerStyle}`}
                                >
                                    <div className="flex-1 text-sm pr-2">
                                        <div dangerouslySetInnerHTML={{ __html: opt.optionText }} />
                                    </div>
                                    {icon}
                                </div>
                            );
                        })}
                    </div>

                    {viewMode === 'result' && (
                        <div className={`mt-4 p-3 rounded-md text-sm border ${selectedOption?.isCorrect ? 'bg-green-50 border-green-200 text-green-800' : 'bg-gray-50 border-gray-200 text-gray-800'
                            } animate-in fade-in slide-in-from-top-2`}>
                            <div className="text-sm opacity-90">
                                <span className="font-semibold underline decoration-dotted mr-1">Giải thích:</span>
                                <span dangerouslySetInnerHTML={{
                                    __html: selectedOption?.textExplanation || question.options.find(o => o.isCorrect)?.textExplanation || "Không có giải thích chi tiết."
                                }} />
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-4 py-2 border-t bg-gray-50 flex justify-end shrink-0 gap-3">
                    {viewMode === 'answering' ? (
                        <button
                            disabled={!selectedOptionId || isSubmitting}
                            onClick={handleConfirm}
                            className="bg-primary text-white px-5 py-2 text-sm rounded-md font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                        >
                            {isSubmitting && <Loader2 className="animate-spin" size={16} />}
                            Trả lời
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={handleRetry}
                                className="px-4 py-2 text-sm rounded-md font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 flex items-center gap-2 transition-all"
                            >
                                <RotateCcw size={14} />
                                Làm lại
                            </button>

                            <button
                                onClick={onContinue}
                                className="bg-primary text-white px-5 py-2 text-sm rounded-md font-semibold hover:opacity-90 flex items-center gap-2 shadow-sm transition-all"
                            >
                                Tiếp tục <Play size={14} />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default VideoQuestionOverlay;