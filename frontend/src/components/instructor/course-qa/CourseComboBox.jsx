import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useGetInstructorCoursesQuery } from "@/redux/api/courseApiSlice";
import { useEffect, useState } from "react";

export function CourseComboBox({ value, setValue, hasAll = true }) {
  const [open, setOpen] = useState(false);
  const [courses, setCourses] = useState([]);
  const { data, isLoading } = useGetInstructorCoursesQuery();
  useEffect(() => {
    if (!data) return;
    if (!hasAll) {
      setCourses(data);
      setValue(data[0])
      return;
    }
    setCourses([
      {
        _id: "all",
        title: "Tất cả khóa học",
      },
      ...data,
    ]);    
  }, [data]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[400px] justify-between font-semibold text-xl"
        >
          {value
            ? courses.find((c) => c.title === value.title)?.title
            : "Chọn khóa học..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Chọn khóa học..." className="h-9" />
          <CommandList>
            <CommandEmpty>Không tìm thấy khóa học.</CommandEmpty>
            <CommandGroup>
              {courses.map((c) => (
                <CommandItem
                  key={c._id}
                  value={c.title}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? value : c); // không xóa nếu chọn trùng
                    setOpen(false);
                  }}
                >
                  {c.title}
                  <Check
                    className={cn(
                      "ml-auto",
                      value?.title === c.title ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
