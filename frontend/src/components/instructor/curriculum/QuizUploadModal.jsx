import { useEffect, useState } from "react";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";
import { FaRegTrashAlt } from "react-icons/fa";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useUploadQuestionsToQuizMutation } from "@/redux/api/sectionApiSlice";

const QuizUploadModal = ({ sectionId, quizId, open, onOpenChange }) => {
    const [file, setFile] = useState(null);
    const [workbook, setWorkbook] = useState(null);
    const [sheetNames, setSheetNames] = useState([]);
    const [selectedSheet, setSelectedSheet] = useState("");
    const [sheetData, setSheetData] = useState([]);
    const [startRow, setStartRow] = useState(1);

    const [questionColumn, setQuestionColumn] = useState("");
    const [correctAnswerColumn, setCorrectAnswerColumn] = useState("");
    const [optionMappings, setOptionMappings] = useState([
        { id: 1, column: "" },
        { id: 2, column: "" },
    ]);
    const [explanationMappings, setExplanationMappings] = useState([]);

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const columnIndexToLetter = (index) => {
        let letter = "";
        while (index >= 0) {
            letter = String.fromCharCode(65 + (index % 26)) + letter;
            index = Math.floor(index / 26) - 1;
        }

        return letter;
    };

    const columnLetterToIndex = (letter) => {
        if (!letter) return -1;
        let index = 0;
        for (let i = 0; i < letter.length; i++) {
            index = index * 26 + (letter.toUpperCase().charCodeAt(i) - 64);
        }
        return index - 1;
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        const fileExtension = selectedFile.name.split(".").pop().toLowerCase();
        if (!["xlsx", "xls"].includes(fileExtension)) {
            setError("Vui lòng chọn file Excel (.xlsx hoặc .xls)");
            return;
        }

        setFile(selectedFile);
        setError("");

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const wb = XLSX.read(data, { type: "array" });
                setWorkbook(wb);
                setSheetNames(wb.SheetNames);

                if (wb.SheetNames.length > 0) {
                    setSelectedSheet(wb.SheetNames[0]);
                }
            } catch (error) {
                setError("Không thể đọc file Excel");
            }
        };

        reader.readAsArrayBuffer(selectedFile);
    };

    useEffect(() => {
        if (workbook && selectedSheet) {
            const workSheet = workbook.Sheets[selectedSheet];
            const jsonData = XLSX.utils.sheet_to_json(workSheet, {
                header: 1,
                defval: "",
                blankrows: true,
            });

            setSheetData(jsonData);
        }
    }, [workbook, selectedSheet]);

    const addOptionMapping = () => {
        const newId =
            optionMappings.length > 0 ? Math.max(...optionMappings.map((m) => m.id)) + 1 : 1;
        setOptionMappings([...optionMappings, { id: newId, column: "" }]);
    };

    const removeOptionMapping = (id) => {
        if (optionMappings.length <= 2) {
            setError("Phải có ít nhất 2 option");
            return;
        }
        setOptionMappings(optionMappings.filter((m) => m.id !== id));
    };

    const updateOptionMapping = (id, column) => {
        setOptionMappings(
            optionMappings.map((m) => (m.id === id ? { ...m, column: column.toUpperCase() } : m))
        );
    };

    const addExplanationMapping = () => {
        const newId =
            explanationMappings.length > 0
                ? Math.max(...explanationMappings.map((m) => m.id)) + 1
                : 1;
        setExplanationMappings([...explanationMappings, { id: newId, column: "" }]);
    };

    const removeExplanationMapping = (id) => {
        setExplanationMappings(explanationMappings.filter((m) => m.id !== id));
    };

    const updateExplanationMapping = (id, column) => {
        setExplanationMappings(
            explanationMappings.map((m) =>
                m.id === id ? { ...m, column: column.toUpperCase() } : m
            )
        );
    };

    const textToHtml = (text) => {
        if (!text) return "";
        let html = String(text);

        html = html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

        html = html.replace(/\n/g, "<br>");

        html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
        html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");

        // Italic: *text* or _text_
        html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
        html = html.replace(/_(.+?)_/g, "<em>$1</em>");

        // Underline: ~text~
        html = html.replace(/~(.+?)~/g, "<u>$1</u>");

        // Wrap in paragraph if not already wrapped
        if (!html.startsWith("<p>")) {
            html = `<p>${html}</p>`;
        }

        return html;
    };

    const parseQuestions = () => {
        if (!workbook || !selectedSheet) return [];

        const questions = [];
        const questionColIdx = columnLetterToIndex(questionColumn);
        const correctedAnswerColIdx = correctAnswerColumn
            ? columnLetterToIndex(correctAnswerColumn)
            : -1;

        if (questionColIdx < 0) {
            throw new Error("Cột câu hỏi không hợp lệ");
        }

        if (correctedAnswerColIdx < 0) {
            throw new Error("Cột câu trả lời đúng không hợp lệ");
        }

        for (let i = startRow - 1; i < sheetData.length; i++) {
            const row = sheetData[i];
            if (!row || row.length === 0) continue;

            const questionText = row[questionColIdx];
            if (!questionText) continue;

            const correctAnswerValue =
                correctedAnswerColIdx >= 0
                    ? !isNaN(row[correctedAnswerColIdx])
                        ? Number(row[correctedAnswerColIdx])
                        : row[correctedAnswerColIdx]
                    : null;
            const options = [];
            optionMappings.forEach((mapping, idx) => {
                if (!mapping.column) return;
                const colIdx = columnLetterToIndex(mapping.column);
                if (colIdx < 0) return;

                const optionText = row[colIdx];

                if (optionText) {
                    const explanationMapping = explanationMappings[idx];
                    const explanationColIdx = explanationMapping
                        ? columnLetterToIndex(explanationMapping.column)
                        : -1;
                    const explanation = explanationColIdx >= 0 ? row[explanationColIdx] : "";

                    let isCorrect = false;
                    
                    if (correctAnswerValue !== null && correctAnswerValue !== "") {
                        if (typeof correctAnswerValue === "number") {
                            isCorrect = correctAnswerValue === idx + 1;
                            console.log(isCorrect);
                        } else if (typeof correctAnswerValue === "string") {
                            const letter = correctAnswerValue.trim().toUpperCase();
                            console.log(letter, String.fromCharCode(65 + idx));
                            isCorrect = letter === String.fromCharCode(65 + idx);
                            console.log(isCorrect);
                        }
                        console.log(isCorrect);
                    }

                    options.push({
                        optionText: textToHtml(optionText),
                        optionExplanation: textToHtml(explanation),
                        isCorrect,
                    });
                }
            });

            if (options.length >= 2) {
                questions.push({
                    questionText: textToHtml(questionText),
                    options,
                });
            }
        }
        return questions;
    };

    const [uploadQuestions] = useUploadQuestionsToQuizMutation();
    const handleUpload = async () => {
        setError("");
        if (!questionColumn) {
            setError("Vui lòng nhập cột chứa câu hỏi");
            return;
        }

        if (!correctAnswerColumn) {
            setError("Vui lòng nhập cột chứa đáp án đúng");
            return;
        }

        if (startRow < 1 || startRow > sheetData.length) {
            setError("Hàng bắt đầu không hợp lệ");
            return;
        }

        const validOptions = optionMappings.filter((m) => m.column);

        if (validOptions.length < 2) {
            setError("Phải có ít nhất 2 lựa chọn được nhập");
            return;
        }
        setLoading(true);

        try {
            const questions = parseQuestions();

            console.log(questions);
            if (questions.length === 0) {
                setError("Không tìm thấy câu hỏi nào trong file");
                setLoading(false);
                return;
            }

            await uploadQuestions({ sectionId, quizId, questions });

            // Reset và đóng modal
            onOpenChange(false);
            // resetState();
        } catch (error) {
            setError(`Lỗi khi xử lý dữ liệu: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const resetState = () => {
        setFile(null);
        setWorkbook(null);
        setSheetNames([]);
        setSelectedSheet("");
        setSheetData([]);
        setStartRow(1);
        setQuestionColumn("");
        setCorrectAnswerColumn("");
        setOptionMappings([
            { id: 1, column: "" },
            { id: 2, column: "" },
        ]);
        setExplanationMappings([]);
        setError("");
    };

    const isHighlightedColumn = (colIndex) => {
        const letter = columnIndexToLetter(colIndex);
        if (letter === questionColumn) return "bg-blue-100";
        if (letter === correctAnswerColumn) return "bg-green-100";
        if (optionMappings.some((m) => m.column === letter)) return "bg-yellow-100";
        if (explanationMappings.some((m) => m.column === letter)) return "bg-purple-100";
        return "";
    };

    const isHighlightedRow = (rowIndex) => {
        return rowIndex === startRow - 1 ? "bg-orange-50" : "";
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) {
                    resetState();
                }
                onOpenChange(isOpen);
            }}
        >
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Upload câu hỏi từ Excel</DialogTitle>
                    <DialogDescription>
                        Chọn file Excel và cấu hình cột dữ liệu (nhập chữ cái cột A, B, C,...)
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label>Chọn file Excel</Label>
                        <input
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                    </div>
                    {sheetNames.length > 0 && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Chọn Sheet</Label>
                                <Select value={selectedSheet} onValueChange={setSelectedSheet}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn sheet" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sheetNames.map((name) => (
                                            <SelectItem key={name} value={name}>
                                                {name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Hàng bắt đầu có dữ liệu câu hỏi</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={startRow}
                                    onChange={(e) => setStartRow(parseInt(e.target.value) || 1)}
                                    placeholder="Ví dụ: 1, 2, 3..."
                                />
                            </div>
                        </div>
                    )}

                    {/* Column Mappings */}
                    {sheetData.length > 0 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                {/* Question Column */}
                                <div className="space-y-2">
                                    <Label>
                                        Cột chứa câu hỏi <span className="text-red-500">*</span> (A,
                                        B, C...)
                                    </Label>
                                    <Input
                                        value={questionColumn}
                                        onChange={(e) =>
                                            setQuestionColumn(e.target.value.toUpperCase())
                                        }
                                        placeholder="Ví dụ: A"
                                        className="uppercase"
                                    />
                                </div>

                                {/* Correct Answer Column */}
                                <div className="space-y-2">
                                    <Label>
                                        Cột đáp án đúng <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        value={correctAnswerColumn}
                                        onChange={(e) =>
                                            setCorrectAnswerColumn(e.target.value.toUpperCase())
                                        }
                                        placeholder="Ví dụ: E (tùy chọn)"
                                        className="uppercase"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Options */}
                                <div className="space-y-2">
                                    <Label>
                                        Các cột lựa chọn<span className="text-red-500">*</span> (A,
                                        B, C...)
                                    </Label>
                                    {optionMappings.map((mapping, idx) => (
                                        <div key={mapping.id} className="flex items-center gap-2">
                                            <span className="text-sm font-medium w-20">
                                                Lựa chọn {idx + 1}
                                            </span>
                                            <Input
                                                value={mapping.column}
                                                onChange={(e) =>
                                                    updateOptionMapping(mapping.id, e.target.value)
                                                }
                                                placeholder="Ví dụ: B"
                                                className="flex-1 uppercase"
                                            ></Input>
                                            {optionMappings.length > 2 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeOptionMapping(mapping.id)}
                                                >
                                                    <FaRegTrashAlt className="w-4 h-4 text-red-500" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}

                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addOptionMapping}
                                        className="cursor-pointer flex items-center gap-1 rounded-sm border-primary text-primary hover:text-primary hover:bg-inherit"
                                    >
                                        <Plus className="w-3 h-3" />
                                        Thêm lựa chọn
                                    </Button>
                                </div>

                                {/* Explanations */}
                                <div className="space-y-2">
                                    <Label>Các cột giải thích (tùy chọn)</Label>
                                    {explanationMappings.map((mapping, idx) => (
                                        <div key={mapping.id} className="flex items-center gap-2">
                                            <span className="text-sm font-medium w-20">
                                                Exp {idx + 1}:
                                            </span>
                                            <Input
                                                value={mapping.column}
                                                onChange={(e) =>
                                                    updateExplanationMapping(
                                                        mapping.id,
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Ví dụ: F"
                                                className="flex-1 uppercase"
                                            />
                                            <button
                                                onClick={() => removeExplanationMapping(mapping.id)}
                                            >
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </button>
                                        </div>
                                    ))}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addExplanationMapping}
                                        className="cursor-pointer flex items-center gap-1 rounded-sm border-primary text-primary hover:text-primary hover:bg-inherit"
                                    >
                                        <Plus className="w-3 h-3" />
                                        Thêm giải thích
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Preview - Excel Style */}
                    {sheetData.length > 0 && (
                        <div className="space-y-2 w-full">
                            <Label>Xem trước dữ liệu</Label>
                            {/* Color Legend */}
                            <div className="flex flex-wrap gap-3 text-xs">
                                <div className="flex items-center gap-1">
                                    <div className="w-4 h-4 bg-blue-100 border"></div>
                                    <span>Câu hỏi</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-4 h-4 bg-green-100 border"></div>
                                    <span>Đáp án đúng</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-4 h-4 bg-yellow-100 border"></div>
                                    <span>Lựa chọn</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-4 h-4 bg-purple-100 border"></div>
                                    <span>Giải thích</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-4 h-4 bg-orange-50 border"></div>
                                    <span>Hàng bắt đầu</span>
                                </div>
                            </div>
                            <div className="border rounded-lg overflow-auto max-h-96 w-[740px]">
                                <table className="w-full text-sm border-collapse">
                                    <thead className="bg-gray-100 sticky top-0">
                                        <tr>
                                            <th className="border px-2 py-1 text-center font-medium w-12">
                                                #
                                            </th>
                                            {sheetData[0] &&
                                                sheetData[0].map((_, colIndex) => (
                                                    <th
                                                        key={colIndex}
                                                        className={`border px-3 py-1 text-center font-medium min-w-[100px] ${isHighlightedColumn(
                                                            colIndex
                                                        )}`}
                                                    >
                                                        {columnIndexToLetter(colIndex)}
                                                    </th>
                                                ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sheetData.slice(0, 20).map((row, rowIndex) => (
                                            <tr
                                                key={rowIndex}
                                                className={isHighlightedRow(rowIndex)}
                                            >
                                                <td className="border px-2 py-1 text-center text-gray-500 bg-gray-50 font-medium">
                                                    {rowIndex + 1}
                                                </td>
                                                {row.map((cell, cellIndex) => (
                                                    <td
                                                        key={cellIndex}
                                                        className={`border px-3 py-1 ${isHighlightedColumn(
                                                            cellIndex
                                                        )}`}
                                                    >
                                                        {cell || ""}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-xs text-gray-500">
                                Hiển thị tối đa 20 hàng đầu tiên
                            </p>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                onOpenChange(false);
                                resetState();
                            }}
                            className="rounded-sm"
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={handleUpload}
                            disabled={
                                loading ||
                                !questionColumn ||
                                optionMappings.filter((m) => m.column).length < 2
                            }
                            className="rounded-sm"
                        >
                            {loading ? "Đang xử lý..." : "Upload"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default QuizUploadModal;
