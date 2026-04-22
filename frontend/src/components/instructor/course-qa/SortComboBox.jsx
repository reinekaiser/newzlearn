import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";

function SortComboBox({ value, setValue }) {
  const [open, setOpen] = useState(false);
  const filter = ["Mới nhất", "Cũ nhất", "Nhiều bình luận nhất"];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between font-semibold"
        >
          {value}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandList>
            <CommandGroup>
              {filter.map((f, index) => (
                <CommandItem
                  key={index}
                  value={f}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? value : f); // không xóa nếu chọn trùng
                    setOpen(false);
                  }}
                >
                  {f}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === f ? "opacity-100" : "opacity-0"
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

export default SortComboBox;
