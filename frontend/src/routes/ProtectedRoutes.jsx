import { useSelector } from "react-redux";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";

const ProtectedRoutes = ({ allowedRoles }) => {
    const { userInfo } = useSelector((state) => state.auth);
    if (!userInfo) {
        return <Navigate to="/" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(userInfo.role)) {
        return <Navigate to="/" replace />;
    }

    return (
        <Outlet/>
    );
};

export default ProtectedRoutes;
