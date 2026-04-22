import PreJoinPage from "@/components/PreJoinPage";
import SessionPage from "@/components/SessionPage";
import CourseLearning from "@/pages/Student/CourseLearning";
import MyCourses from "@/pages/Student/MyCourses";
import ProfilePage from "@/pages/Student/ProfilePage";
import WishlistPage from "@/pages/Student/WishlistPage";
import ProtectedRoutes from "@/routes/ProtectedRoutes";
import { Routes, Route, Navigate } from "react-router-dom";

const StudentRoutes = () => {

    return (
        <Routes>
            <Route
                element={<ProtectedRoutes allowedRoles={["user"]} />}
            >
                <Route path="/learning/:courseAlias" element={<CourseLearning/>} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/my-courses" element={ <MyCourses/>} />
                <Route path="/wishlist" element={ <WishlistPage/>} />
                <Route  path="/sessions/prejoin/:sessionId" element={<PreJoinPage />} />
                <Route path="/sessions/join/:sessionId" element={<SessionPage />}  />
            </Route>
        </Routes>
    );
};

export default StudentRoutes;
