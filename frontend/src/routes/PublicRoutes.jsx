import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "@/pages/Student/HomePage";
import CourseDetail from "@/pages/Student/CourseDetail";
import { CoursesCatalog } from "@/pages/Student/CourseCatalog";
import Layout from "@/components/student/Layout";
import Payment from "@/pages/Student/Payment";
import PaypalSuccess from "@/pages/Student/PayPalSuccess";
import VNPaySuccess from "@/pages/Student/VNPaySuccess";
import VNPayFailed from "@/pages/Student/VNPayFailed";
import MomoSuccess from "@/pages/Student/MoMoSuccess";
import VerifyEmail from "@/pages/Student/VerifyEmail";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import AnnouncementsPage from "@/pages/Student/AnnouncementsPage";

const PublicRoutes = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/course/:courseAlias/payment" element={<Payment />} />
      </Route>
      <Route path="/courses" element={<CoursesCatalog />} />
      <Route path="/course/:courseAlias" element={<CourseDetail />} />
      <Route
        path="/course/:courseAlias/paypal-success"
        element={<PaypalSuccess />}
      />
      <Route
        path="/course/:courseAlias/vnpay-success"
        element={<VNPaySuccess />}
      />
      <Route
        path="/course/:courseAlias/vnpay-failed"
        element={<VNPayFailed />}
      />
      <Route
        path="/course/:courseAlias/momo-success"
        element={<MomoSuccess />}
      />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/announcements" element={<AnnouncementsPage />} />
    </Routes>
  );
};

export default PublicRoutes;
