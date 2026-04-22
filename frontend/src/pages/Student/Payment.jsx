import Button from "@/components/Button";
import { Spinner } from "@/components/ui/spinner";
import { useGetCourseByAliasQuery } from "@/redux/api/coursePublicApiSlice";
import { useCreateMoMoPaymentMutation, useCreatePaypalOrderMutation } from "@/redux/api/paymentApiSlice";
import { ArrowLeft } from "lucide-react";
import React, { useState } from "react";
import { FaRegStar, FaStar, FaStarHalfAlt } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { useCreateVNPayPaymentMutation } from "@/redux/api/paymentApiSlice";

const AverageRating = ({ averageRating }) => {
  const r = Number(averageRating) || 0;
  const rounded = Math.round(r * 2) / 2;
  const fullStars = Math.floor(rounded);
  const hasHalfStar = rounded - fullStars === 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-3">
      <div
        className="flex items-center text-yellow-500 mb-1"
        aria-hidden="true"
      >
        {Array.from({ length: fullStars }).map((_, i) => (
          <FaStar key={`full-${i}`} />
        ))}
        {hasHalfStar && <FaStarHalfAlt key="half" />}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <FaRegStar key={`empty-${i}`} />
        ))}
      </div>
      <p className="text-sm">
        <span className="font-semibold text-yellow-500 text-[14px]">
          {r.toFixed(1)}
        </span>{" "}
        /5.0 – {r >= 4 ? "Tuyệt vời" : r >= 3 ? "Tốt" : "Trung bình"}
      </p>
    </div>
  );
};
const RightCard = ({ course }) => {
  return (
    <div className="bg-white flex-col rounded-md shadow-xl text-gray-800 max-h-[800px] p-4 outline outline-1 outline-gray-300">
      <div className="mx-auto w-full h-80 self-center space-y-2 h-48 overflow-hidden mb-2">
        {course?.thumbnail?.publicURL ? (
          <img
            src={course?.thumbnail.publicURL || "/logo.png"}
            alt={course?.title}
            className="w-full h-full object-cover border border-gray-200"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-100">
            No Image
          </div>
        )}
      </div>
      <div className="space-y-2">
        <p className="text-lg font-bold">{course?.title} </p>
        <p className="text-sm text-gray-500 leading-relaxed">
          {course?.subtitle}
        </p>
        <div className="flex items-center gap-2">
          <AverageRating averageRating={course?.averageRating} />
        </div>
      </div>
      <hr className="my-4 border-gray-300" />
      <div className="space-y-2">
        <p className="text-gray-500 text-sm">
          Tổng số tiền:{" "}
          <span className="font-semibold text-black hover:underline text-lg cursor-pointer">
            {course.price.toLocaleString()} ₫
          </span>
        </p>
      </div>
    </div>
  );
};

function Payment() {
  const param = useParams();
  const navigate = useNavigate();
  const { data: course, isLoading: isCourseLoading } = useGetCourseByAliasQuery(
    param.courseAlias
  );
  const [payPalMessage, setPayPalMessage] = useState("");
  const [createOrder, { isLoading: isPayPalLoading }] =
    useCreatePaypalOrderMutation();
  const [loadingStripe, setLoadingStripe] = useState(false);
  const [loadingVNPAY, setLoadingVNPAY] = useState(false);
  const [stripeMessage, setStripeMessage] = useState("");
  const [createVNPayPayment] = useCreateVNPayPaymentMutation();
  const [loadingMoMo, setLoadingMoMo] = useState(false);
  const [createMoMoPayment] = useCreateMoMoPaymentMutation();

  const handleMoMo = async () => {
  try {
    setLoadingMoMo(true);

    const res = await createMoMoPayment({
      amount: course.price,
      courseId: course._id,
      courseAlias: course.alias,
    }).unwrap();

    if (res.payUrl) {
      window.location.href = res.payUrl; // redirect sang MoMo
    } else {
      alert("Không lấy được link thanh toán MoMo");
    }
  } catch (err) {
    console.error(err);
    alert("Thanh toán MoMo thất bại");
  } finally {
    setLoadingMoMo(false);
  }
};


  const handleVNPay = async () => {
    try {
      setLoadingVNPAY(true);

      const res = await createVNPayPayment({
        amount: course.price,
        courseId: course._id,
        courseAlias: course.alias,
      }).unwrap();

      if (res.paymentUrl) {
        window.location.href = res.paymentUrl;
      }
    } catch (err) {
      console.error(err);
      alert("Thanh toán VNPAY thất bại");
    } finally {
      setLoadingVNPAY(false);
    }
  };

  const handlePayPal = async () => {
    try {
      const orderData = await createOrder({
        intent: "CAPTURE",
        amount: (course.price / 27000).toFixed(2), // VND => USD
        courseId: course._id,
        courseAlias: course.alias,
      }).unwrap();

      if (!orderData || !orderData.links) {
        alert("Không thể tạo đơn hàng!");
        return;
      }

      const approveUrl = orderData.links.find(
        (link) => link.rel === "approve"
      )?.href;
      if (approveUrl) {
        window.location.href = approveUrl; // chuyển đến PayPal
      } else {
        setPayPalMessage("Không tìm thấy link thanh toán PayPal.");
      }
    } catch (error) {
      console.error("Lỗi tạo đơn hàng:", error);
      setPayPalMessage("Có lỗi xảy ra khi tạo đơn hàng PayPal.");
    }
  };
  const handleStripe = () => {};
  if (isCourseLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner className="size-12" color="#098ce9" />
      </div>
    );
  }
  return (
    <div className="bg-[#e0f3ff] text-black ">
      <div className="container bg-white mx-auto p-5 xl:p-10">
        <Button
          variant="outline"
          className="flex space-x-2 mb-4"
          onClick={() => navigate(`/course/${param.courseAlias}`)}
        >
          <ArrowLeft className="w-6 h-6" />
          <p>Quay lại</p>
        </Button>
        <div className="grid grid-cols-3 gap-14">
          <div className="col-span-2">
            <RightCard course={course} />
          </div>
          <div className="col-span-1 flex flex-col gap-5 items-center justify-center">
            <p className="mb-4 font-bold text-2xl">Thanh toán bằng</p>
            {payPalMessage && <p className="text-red-500">{payPalMessage}</p>}
            <button
              className="bg-yellow-500 w-full py-2 flex justify-center rounded cursor-pointer hover:bg-yellow-300"
              disabled={isPayPalLoading}
              onClick={() => handlePayPal()}
            >
              {isPayPalLoading && (
                <Spinner className="size-8 mr-2" color="#098ce9" />
              )}
              <img src="/paypalIcon.png" alt="Paypal Icon" className="h-8" />
            </button>

            <button
              className="bg-white border border-gray-300 w-full py-2 flex justify-center rounded cursor-pointer hover:bg-gray-100"
              onClick={handleVNPay}
            >
              {loadingVNPAY && (
                <Spinner className="size-8 mr-2" color="#098ce9" />
              )}
              <img src="/VNPAY.png" alt="VNPAY Icon" className="h-8" />
            </button>

            <button
              className="bg-[#A50064] w-full py-2 flex justify-center rounded cursor-pointer hover:bg-[#A50064] opacity-100 hover:opacity-80"
              onClick={handleMoMo}
              disabled={loadingMoMo}
            >
              {loadingMoMo && <Spinner className="size-8 mr-2" color="#fff" />}
              <img src="/momo.png" alt="MoMo Icon" className="h-8" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Payment;
