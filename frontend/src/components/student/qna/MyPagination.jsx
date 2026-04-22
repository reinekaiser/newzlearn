import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

const MyPagination = ({ page, totalPage, changePage }) => {
  const getVisiblePages = () => {
    if (totalPage <= 3) return [...Array(totalPage).keys()].map((i) => i + 1);
    if (page === 1) return [1, 2, 3];
    if (page === totalPage) return [totalPage - 2, totalPage - 1, totalPage];
    return [page - 1, page, page + 1];
  };
  return (
    <Pagination className={"py-4"}>
      <PaginationContent>
        <PaginationItem>
          <PaginationLink
            href="#"
            className={`${
              page === 1
                ? "!text-gray-300 cursor-not-allowed"
                : "!text-[#098be4] hover:!text-[#098be4] hover:!bg-[#cee8fb] "
            }`}
            onClick={(e) => {
              if (page > 1) {
                e.preventDefault();
                changePage(page - 1);
              }
            }}
            aria-label="Go to previous page"
            size="icon"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </PaginationLink>
        </PaginationItem>
        {getVisiblePages().map((p) => (
          <PaginationItem key={p}>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                changePage(p);
              }}
              className={`hover:!bg-[#cee8fb] hover:!text-[#098be4] !shadow-none duration-500 transition ease-in-out
              ${page === p ? "!bg-[#098be4] !text-white" : "!text-[#098be4]"}`}
            >
              {p}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationLink
            href="#"
            className={`${
              page === totalPage
                ? "!text-gray-300 cursor-not-allowed"
                : "!text-[#098be4] hover:!text-[#098be4] hover:!bg-[#cee8fb] "
            }`}
            onClick={(e) => {
              if (page < totalPage) {
                e.preventDefault();
                changePage(page + 1);
              }
            }}
            aria-label="Go to next page"
            size="icon"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default MyPagination;
