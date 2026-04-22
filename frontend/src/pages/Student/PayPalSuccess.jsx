import Button from "@/components/Button";
import { useCompletePaypalOrderMutation } from "@/redux/api/paymentApiSlice";
import { Undo2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

function PaypalSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { courseAlias } = useParams();
  const token = searchParams.get("token"); // order_id
  const status = searchParams.get("status"); // có thể là success hoặc cancel
  const hasRun = useRef(false);
  const [link, setLink] = useState("");
  const [message, setMessage] = useState("Vui lòng chờ...");
  const [completeOrder] = useCompletePaypalOrderMutation();
  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    const handlePayment = async () => {
      if (!token) return;

      if (status === "success") {
        try {
          const data = await completeOrder({
            order_id: token,
            intent: "capture",
            courseAlias: courseAlias,
          }).unwrap();

          console.log("Kết quả PayPal:", data);

          if (data.status === "COMPLETED") {
            setMessage("Thanh toán PayPal thành công!");
            setLink(`/course/${courseAlias}`);
          } else {
            setMessage("Thanh toán chưa hoàn tất, vui lòng thử lại.");
            setLink(`/course/${courseAlias}/payment`);
          }
        } catch (error) {
          console.error("Lỗi khi hoàn tất thanh toán:", error);
          setMessage("Có lỗi xảy ra khi xử lý thanh toán.");
          setLink(`/course/${courseAlias}/payment`);
        }
      } else if (status === "cancel") {
        setMessage("Bạn đã hủy thanh toán PayPal.");
        setLink(`/course/${courseAlias}/payment`);
      }
    };

    handlePayment();
  }, [token, status, courseAlias, navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      {message.startsWith("Vui lòng chờ") ? (
        <img src="/loadingGIF.gif" alt="loading" className="w-[256px]" />
      ) : status === "success" ? (
        <img src="/successGIF.gif" alt="success" className="w-[720px]" />
      ) : (
        <img src="/errorGIF.gif" alt="error" className="w-[720px]" />
      )}
      <h2 className="text-2xl font-semibold mb-3">{message}</h2>
      <Button
        variant="reverse"
        className={`flex gap-2 px-4 py-2 ${
          message.startsWith("Vui lòng chờ") ? "hidden" : ""
        }`}
        onClick={() => navigate(link)}
      >
        <Undo2 />
        {status === "success"
          ? "Quay lại trang khóa học"
          : "Quay lại trang thanh toán"}
      </Button>
    </div>
  );
}

export default PaypalSuccess;
