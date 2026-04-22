import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Button from "@/components/Button";
import { Spinner } from "@/components/ui/spinner";
import { useGetStudentProfileQuery } from "@/redux/api/studentApiSlice";
import { Clock, GraduationCap, Mail, Signature } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useNavigate } from "react-router-dom";

function formatDate(date) {
  if (!(date instanceof Date) || isNaN(date)) {
    throw new Error("Invalid Date object");
  }
  const pad = (num) => String(num).padStart(2, "0");
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function StudentProfile({ order }) {
  const student = order.userId;
  const navigate = useNavigate()
  const { data, isLoading } = useGetStudentProfileQuery(student._id);
  const studentInfo = data?.user;
  const studentCourses = data?.courses;
  console.log("studentCourses", studentCourses);
  if (isLoading)
    return (
      <div className="flex h-full items-center justify-center z-50">
        <Spinner className="size-12" color="#098ce9" />
      </div>
    );
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card
          className={"outline outline-0 hover:outline-2 hover:outline-primary"}
        >
          <CardContent className="flex justify-center px-0">
            <img
              src={student?.profilePicture?.url || "https://placehold.co/96x96"}
              alt="User Avatar"
              className="aspect-square h-24 rounded-full object-cover outline outline-1 outline-primary"
            />
          </CardContent>
          <CardHeader className="flex flex-col justify-center items-center my-2 gap-3">
            <CardTitle>
              {student?.firstName} {student?.lastName}
            </CardTitle>
            <CardDescription>
              Nhập học ngày {formatDate(new Date(order?.createdAt))}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button variant="outline">Xem học viên</Button>
          </CardFooter>
        </Card>
      </DialogTrigger>
      <DialogContent
        aria-describedby={undefined}
        className="flex min-h-[300px] max-h-[min(600px,80vh)] flex-col gap-0 p-0 sm:max-w-xl max-w-3xl overflow-y-auto"
      >
        <DialogHeader>
          <div className="w-full rounded-lg flex justify-center relative bg-[#e0f3ff] text-black h-[80px] lg:h-[120px]">
            <div className="w-[80%] flex gap-5 items-center absolute bottom-0 translate-y-1/3">
              <img
                src={
                  studentInfo?.profilePicture?.url ||
                  "https://placehold.co/128x128"
                }
                alt="User Avatar"
                className="aspect-square h-24 lg:h-32 rounded-full object-cover outline outline-4 outline-white"
              />
              <DialogTitle className="text-lg lg:text-4xl font-bold leading-tight">
                {studentInfo.firstName} {studentInfo.lastName}
              </DialogTitle>
              {studentInfo?.isEmailVerified && (
                <img
                  src={"/verify.png"}
                  alt="Verify Badge"
                  title="Đã xác thực"
                  className="aspect-square h-6 bg-transparent"
                />
              )}
            </div>
          </div>
        </DialogHeader>
        <Card className={"mt-12 mx-auto w-auto py-5 px-10 lg:w-[90%]"}>
          <div className="flex text-primary">
            <Mail className="inline mr-2 mb-1" />
            <p>
              Email: <span className="text-black">{studentInfo?.email}</span>
            </p>
          </div>
          <div className="flex text-primary">
            <GraduationCap className="inline mr-2 mb-1" />
            <p>
              Chuyên ngành:{" "}
              <span className="text-black">
                {studentInfo?.major || "Chưa cập nhật"}
              </span>
            </p>
          </div>
          <div className="flex text-primary">
            <Signature className="flex-shrink-0 inline mr-2 mb-1" />
            <p className="flex-shrink-0">Tiểu sử:&nbsp;</p>
            <p className="text-black">
              {studentInfo?.major || "Chưa cập nhật"}
            </p>
          </div>
          <div className="flex text-primary">
            <Clock className="inline mr-2 mb-1" />
            <p>
              Tham gia NewZLearn từ:{" "}
              <span className="text-black">
                {formatDate(new Date(studentInfo?.createdAt))}
              </span>
            </p>
          </div>
        </Card>
        <div className="mt-5">
          <p className="text-center text-lg font-semibold">
            Khóa học của học viên
          </p>
          <div className="w-full sm:max-w-xl max-w-3xl py-5 px-20 min-h-[100px]">
            <Carousel>
              <CarouselContent>
                {studentCourses?.map((course, index) => {
                  return (
                    <CarouselItem key={index}>
                      <Card className={"hover:bg-[#cee8fb] hover:cursor-pointer"}
                      onClick={()=>navigate(`/course/${course.courseId.alias}`)}
                      >
                        <CardHeader>
                          <img
                            src={course.courseId.thumbnail.publicURL}
                            alt={course.courseId.title}
                            className="w-full aspect-video object-cover rounded-t-lg"
                          />
                          <CardTitle>{course?.courseId.title}</CardTitle>
                          <CardDescription>{course?.courseId.subtitle}</CardDescription>
                        </CardHeader>
                      </Card>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default StudentProfile;
