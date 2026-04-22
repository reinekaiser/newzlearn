import Button from "@/components/Button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { FaQuestion } from "react-icons/fa";
import { ArrowLeft } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

import MyPagination from "./MyPagination";
import QuestionList from "./QuestionList";
import NewQuestion from "./NewQuestion";
import QuestionDetail from "./QuestionDetail";
import { useGetQnAByPageQuery } from "@/redux/api/qnaSlice";

export function QnASheet({courseId, lectureId}) {
  const [mode, setMode] = useState("List"); // List/ Write/ Detail
  const [page, setPage] = useState(1); // trang hiện tại
  const [quesId, setQuesId] = useState(null); // câu hỏi hiện tại

  const [list, setList] = useState([]);
  const [totalQuestion, setTotalQuestion] = useState(0);
  const [totalPage, setTotalPage] = useState(1);
  const { data , isLoading: isLoadingGetQnAByPage} = useGetQnAByPageQuery({lectureId, page});

  useEffect(() => {
    if (data) {
      setList(data.data);
      setTotalPage(data.totalPages);
      setTotalQuestion(data.totalQuestions);
    }
  }, [data]);

  const changePage = (page) => {
    setPage(page);
  };

  const handleQuestionClick = async (ques) => {
    setMode("Detail");
    setQuesId(ques._id)
  };

  const getBack = () => {
    if (mode === "Detail") setQuesId(null);
    setMode("List");
  };

  const handleNewQuestionClick = () => {
    setMode("Write");
  };

  return (
    <Sheet>
      <Tooltip>
        <TooltipTrigger asChild>
          <SheetTrigger asChild>
            <button className="bg-white text-[#098be4] border border-[#098be4] hover:text-[#098be4] hover:bg-[#cee8fb] p-2 rounded-full flex justify-center items-center">
              <FaQuestion className="text-lg" />
            </button>
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent className="bg-neutral-200 text-neutral-950 [&_svg]:bg-neutral-200 [&_svg]:fill-neutral-200">
          <p className="text-[#098be4] text-sm font-semibold">
            Hỏi đáp & Trợ giúp
          </p>
        </TooltipContent>
      </Tooltip>
      <SheetContent
        aria-describedby={undefined}
        side="left"
        className="w-2/3 max-h-screen overflow-y-auto"
      >
        <SheetHeader className={"relative"}>
          <Button
            variant="outline"
            className={`absolute top-5 left-5 flex space-x-2 ${
              mode === "List" ? "hidden" : ""
            }`}
            onClick={() => getBack()}
          >
            <ArrowLeft className="w-6 h-6" />
            <p>Quay lại</p>
          </Button>
          <SheetTitle className="self-center text-2xl py-4 text-[#098be4]">
            Hỏi đáp & Trợ giúp
          </SheetTitle>
        </SheetHeader>
        {mode === "List" && (
          <div className="px-4 space-y-4">
            <p className=" text-lg font-semibold">Tặng 20+ Figma Pro</p>
            <div className="w-full border-t border-[#098be4] border-1 mt-2"></div>
            <div className="flex-col relative">
              <p className="text-sm font-semibold mb-2">
                Các câu hỏi thường gặp ({totalQuestion})
              </p>
              {isLoadingGetQnAByPage ? (
                <div className="flex h-full items-center justify-center z-50">
                  <Spinner className="size-12" color="#098ce9" />
                </div>
              ) : (
                <QuestionList
                  list={list}
                  handleQuestionClick={handleQuestionClick}
                />
              )}
            </div>
            <SheetFooter className={"absolute bottom-0 flex flex-col w-full justify-center"}>
              <MyPagination
                page={page}
                totalPage={totalPage}
                changePage={changePage}
              />
              <div className="flex justify-center items-center gap-2">
                <p>Không tìm thấy câu hỏi bạn cần?</p>
                <Button
                  variant="reverse"
                  onClick={() => handleNewQuestionClick()}
                >
                  Đặt câu hỏi mới
                </Button>
              </div>
            </SheetFooter>
          </div>
        )}
        {mode === "Detail" && 
             <QuestionDetail quesId={quesId} getBack={getBack}/>
        }
        {mode === "Write" && (          
              <NewQuestion
                lectureId={lectureId}
                courseId={courseId}
                handleQuestionClick={handleQuestionClick}
                getBack={getBack}
              />     
        )}
      </SheetContent>
    </Sheet>
  );
}
