import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Users } from "lucide-react";

// Shadcn components
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-toastify";
import { useCreateSessionMutation, useUpdateSessionMutation } from "@/redux/api/sessionApiSlice";

const SessionModal = ({
    open,
    onOpenChange,
    mode = "create", // 'create' | 'edit'
    courses = [],
    sessionData = null,
    onSuccess,
    trigger,
}) => {
    const [loading, setLoading] = useState(false);

    const form = useForm({
        defaultValues: {
            course: "",
            sessionName: "",
            sessionDescription: "",
            maxParticipants: 50,
            scheduledStart: new Date(Date.now() + 3600000),
            scheduledEnd: new Date(Date.now() + 7200000),
        },
    });

    // Initialize data based on mode
    useEffect(() => {
        if (mode === "edit" && sessionData) {
            form.reset({
                course: sessionData.course?._id || sessionData.course,
                sessionName: sessionData.sessionName,
                sessionDescription: sessionData.sessionDescription || "",
                maxParticipants: sessionData.maxParticipants || 50,
                scheduledStart: new Date(sessionData.scheduledStart),
                scheduledEnd: new Date(sessionData.scheduledEnd),
            });
        }
    }, [mode, sessionData, form]);

    const [createSession, { isLoading: isCreatingSession }] = useCreateSessionMutation();
    const [updateSession, { isLoading: isUpdatingSession }] = useUpdateSessionMutation();

    const isLoading = isCreatingSession || isUpdatingSession;
    // Handle form submission
    const onSubmit = async (data) => {
        try {
            setLoading(true);
            const payload = {
                ...data,
                status: mode === "edit" ? sessionData.status : "scheduled",
            };

            // Remove undefined values
            Object.keys(payload).forEach((key) => {
                if (payload[key] === undefined) {
                    delete payload[key];
                }
            });

            console.log(payload);
            let result;
            if (mode === "create") {
                result = await createSession(payload).unwrap();
            } else {
                result = await updateSession({
                    sessionId: sessionData._id,
                    ...payload,
                }).unwrap();
            }

            toast.success(
                mode === "create" ? "Buổi học đã được tạo thành công" : "Buổi học đã được cập nhật",
            );

            onOpenChange(false);
            form.reset();

            if (onSuccess) onSuccess();
        } catch (error) {
            console.log(error);
            toast.error(`Không thể ${mode === "create" ? "tạo" : "cập nhật"} buổi học. ${error.data.error}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">
                        {mode === "create" ? "Tạo buổi học mới" : "Chỉnh sửa buổi học"}
                    </DialogTitle>
                    {mode === "create" && (
                        <DialogDescription>Tạo buổi học trực tuyến mới</DialogDescription>
                    )}
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
                        {/* Basic Information Tab */}
                        <div className="space-y-4">
                            {/* Course Selection */}
                            <FormField
                                control={form.control}
                                name="course"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base font-medium">
                                            Khóa học <span className="text-red-500">*</span>
                                        </FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={mode === "edit"} // Không cho sửa khóa học khi edit
                                        >
                                            <FormControl>
                                                <SelectTrigger className="h-10">
                                                    <SelectValue placeholder="Chọn khóa học" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {courses.map((course) => (
                                                    <SelectItem key={course._id} value={course._id}>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">
                                                                {course.title}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Session Name */}
                            <FormField
                                control={form.control}
                                name="sessionName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base font-medium">
                                            Tên buổi học <span className="text-red-500">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Ví dụ: Giới thiệu JavaScript"
                                                className="h-10 focus-visible:ring-0 focus-visible:border-primary"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Description */}
                            <FormField
                                control={form.control}
                                name="sessionDescription"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base font-medium">
                                            Mô tả
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Nhập mô tả chi tiết về buổi học..."
                                                className="resize-none min-h-[100px] focus-visible:ring-0 focus-visible:border-primary"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Schedule */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Thời gian buổi học</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Start Time */}
                                    <FormField
                                        control={form.control}
                                        name="scheduledStart"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>
                                                    Bắt đầu <span className="text-red-500">*</span>
                                                </FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant="outline"
                                                                className="h-10 justify-start text-left font-normal"
                                                            >
                                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                                {field.value ? (
                                                                    format(
                                                                        field.value,
                                                                        "dd/MM/yyyy HH:mm",
                                                                    )
                                                                ) : (
                                                                    <span>Chọn ngày và giờ</span>
                                                                )}
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent
                                                        className="w-auto p-0"
                                                        align="start"
                                                    >
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value}
                                                            onSelect={field.onChange}
                                                            disabled={(date) => {
                                                                const today = new Date();
                                                                today.setHours(0, 0, 0, 0);
                                                                const dateOnly = new Date(date);
                                                                dateOnly.setHours(0, 0, 0, 0);
                                                                return dateOnly < today;
                                                            }}
                                                            initialFocus
                                                        />
                                                        <div className="p-3 border-t">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-medium">
                                                                    Giờ:
                                                                </span>
                                                                <Input
                                                                    type="time"
                                                                    value={
                                                                        field.value
                                                                            ? format(
                                                                                  field.value,
                                                                                  "HH:mm",
                                                                              )
                                                                            : ""
                                                                    }
                                                                    onChange={(e) => {
                                                                        const time = e.target.value;
                                                                        if (!time) return;

                                                                        const [hours, minutes] =
                                                                            time.split(":");
                                                                        const newDate = new Date(
                                                                            field.value ||
                                                                                new Date(),
                                                                        );
                                                                        newDate.setHours(
                                                                            parseInt(hours),
                                                                            parseInt(minutes),
                                                                        );
                                                                        field.onChange(newDate);
                                                                    }}
                                                                    className="w-32"
                                                                />
                                                            </div>
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* End Time */}
                                    <FormField
                                        control={form.control}
                                        name="scheduledEnd"
                                        render={({ field }) => {
                                            const startDateValue = form.watch("scheduledStart");

                                            return (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel>
                                                        Kết thúc{" "}
                                                        <span className="text-red-500">*</span>
                                                    </FormLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                    variant="outline"
                                                                    className="h-10 justify-start text-left font-normal"
                                                                >
                                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                                    {field.value ? (
                                                                        format(
                                                                            field.value,
                                                                            "dd/MM/yyyy HH:mm",
                                                                        )
                                                                    ) : (
                                                                        <span>
                                                                            Chọn ngày và giờ
                                                                        </span>
                                                                    )}
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent
                                                            className="w-auto p-0"
                                                            align="start"
                                                        >
                                                            <Calendar
                                                                mode="single"
                                                                selected={field.value}
                                                                onSelect={(selectedDate) => {
                                                                    if (!selectedDate) return;

                                                                    // Giữ nguyên giờ hiện tại nếu có
                                                                    if (field.value) {
                                                                        selectedDate.setHours(
                                                                            field.value.getHours(),
                                                                            field.value.getMinutes(),
                                                                        );
                                                                    } else if (startDateValue) {
                                                                        // Nếu chưa có giờ kết thúc, mặc định = giờ bắt đầu + 1
                                                                        selectedDate.setHours(
                                                                            startDateValue.getHours() +
                                                                                1,
                                                                            startDateValue.getMinutes(),
                                                                        );
                                                                    }

                                                                    field.onChange(selectedDate);
                                                                }}
                                                                disabled={(date) => {
                                                                    // Chỉ disabled ngày quá khứ nếu chưa có ngày bắt đầu
                                                                    if (!startDateValue) {
                                                                        const today = new Date();
                                                                        today.setHours(0, 0, 0, 0);
                                                                        const dateOnly = new Date(
                                                                            date,
                                                                        );
                                                                        dateOnly.setHours(
                                                                            0,
                                                                            0,
                                                                            0,
                                                                            0,
                                                                        );
                                                                        return dateOnly < today;
                                                                    }

                                                                    // Nếu đã có ngày bắt đầu
                                                                    const startDate = new Date(
                                                                        startDateValue,
                                                                    );
                                                                    const dateOnly = new Date(date);

                                                                    // So sánh chỉ ngày (không so giờ)
                                                                    startDate.setHours(0, 0, 0, 0);
                                                                    dateOnly.setHours(0, 0, 0, 0);

                                                                    // Chỉ disabled ngày TRƯỚC ngày bắt đầu
                                                                    return dateOnly < startDate;
                                                                }}
                                                                initialFocus
                                                            />
                                                            <div className="p-3 border-t">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-medium">
                                                                        Giờ:
                                                                    </span>
                                                                    <Input
                                                                        type="time"
                                                                        value={
                                                                            field.value
                                                                                ? format(
                                                                                      field.value,
                                                                                      "HH:mm",
                                                                                  )
                                                                                : startDateValue
                                                                                  ? format(
                                                                                        new Date(
                                                                                            startDateValue.getTime() +
                                                                                                3600000,
                                                                                        ), // +1 giờ
                                                                                        "HH:mm",
                                                                                    )
                                                                                  : ""
                                                                        }
                                                                        onChange={(e) => {
                                                                            const time =
                                                                                e.target.value;
                                                                            if (!time) return;

                                                                            const [hours, minutes] =
                                                                                time.split(":");
                                                                            let newDate =
                                                                                field.value
                                                                                    ? new Date(
                                                                                          field.value,
                                                                                      )
                                                                                    : startDateValue
                                                                                      ? new Date(
                                                                                            startDateValue.getTime() +
                                                                                                3600000,
                                                                                        ) // +1 giờ
                                                                                      : new Date();

                                                                            newDate.setHours(
                                                                                parseInt(hours),
                                                                                parseInt(minutes),
                                                                            );

                                                                            // Validation: thời gian kết thúc phải sau thời gian bắt đầu
                                                                            if (
                                                                                startDateValue &&
                                                                                newDate <=
                                                                                    startDateValue
                                                                            ) {
                                                                                toast.error(
                                                                                    "Thời gian kết thúc phải sau thời gian bắt đầu",
                                                                                );
                                                                                // Tự động điều chỉnh
                                                                                const correctedDate =
                                                                                    new Date(
                                                                                        startDateValue,
                                                                                    );
                                                                                correctedDate.setHours(
                                                                                    startDateValue.getHours() +
                                                                                        1,
                                                                                );
                                                                                field.onChange(
                                                                                    correctedDate,
                                                                                );
                                                                            } else {
                                                                                field.onChange(
                                                                                    newDate,
                                                                                );
                                                                            }
                                                                        }}
                                                                        className="w-32"
                                                                    />
                                                                </div>
                                                                {startDateValue && (
                                                                    <div className="mt-2 text-xs space-y-1">
                                                                        <p className="text-gray-500">
                                                                            Bắt đầu:{" "}
                                                                            {format(
                                                                                startDateValue,
                                                                                "HH:mm",
                                                                            )}
                                                                        </p>
                                                                        {field.value &&
                                                                            field.value <=
                                                                                startDateValue && (
                                                                                <p className="text-red-500 font-medium">
                                                                                    ⚠️ Thời gian kết
                                                                                    thúc phải sau
                                                                                    thời gian bắt
                                                                                    đầu
                                                                                </p>
                                                                            )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                    <FormMessage />
                                                </FormItem>
                                            );
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Max Participants */}
                            <FormField
                                control={form.control}
                                name="maxParticipants"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base font-medium flex items-center gap-2">
                                            <Users className="h-4 w-4" />
                                            Số người tham gia tối đa
                                        </FormLabel>
                                        <FormControl>
                                            <div className="flex items-center gap-4">
                                                <Input
                                                    type="range"
                                                    min="1"
                                                    max="1000"
                                                    step="1"
                                                    value={field.value || 50}
                                                    onChange={(e) =>
                                                        field.onChange(parseInt(e.target.value))
                                                    }
                                                    className="w-full"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg font-semibold min-w-[60px] text-center">
                                                        {field.value || 50}
                                                    </span>
                                                    <span className="text-gray-500">người</span>
                                                </div>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Footer Buttons */}
                        <DialogFooter className="pt-6 border-t gap-3">
                            {mode === "edit" && (
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Badge
                                        variant={
                                            sessionData?.status === "live"
                                                ? "destructive"
                                                : "outline"
                                        }
                                    >
                                        {sessionData?.status === "scheduled" && "Đã lên lịch"}
                                        {sessionData?.status === "live" && "Đang diễn ra"}
                                        {sessionData?.status === "ended" && "Đã kết thúc"}
                                        {sessionData?.status === "cancelled" && "Đã hủy"}
                                    </Badge>
                                    {sessionData?.createdAt && (
                                        <span>
                                            Tạo ngày{" "}
                                            {format(new Date(sessionData.createdAt), "dd/MM/yyyy")}
                                        </span>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-2 ml-auto">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    disabled={loading}
                                    className="h-10 px-5 cursor-pointer"
                                >
                                    Huỷ
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="h-10 px-4 bg-primary cursor-pointer"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {mode === "create" ? "Đang tạo..." : "Đang cập nhật..."}
                                        </>
                                    ) : mode === "create" ? (
                                        "Tạo buổi học"
                                    ) : (
                                        "Cập nhật"
                                    )}
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default SessionModal;
