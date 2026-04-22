import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setMyCoursesId } from "@/redux/features/authSlice";
import { useGetMyCoursesProgressQuery } from "@/redux/api/progressApiSlice";

const MyCoursesLoader = () => {
    const dispatch = useDispatch();
    const { userInfo } = useSelector((state) => state.auth);

    const { data: myCourses } = useGetMyCoursesProgressQuery(undefined, {
        skip: !userInfo,
        refetchOnMountOrArgChange: true,
    });

    useEffect(() => {
        if (myCourses?.length) {
            dispatch(setMyCoursesId(myCourses.map(c => c.courseId._id)));
        }
    }, [myCourses, dispatch]);

    return null; 
};

export default MyCoursesLoader;