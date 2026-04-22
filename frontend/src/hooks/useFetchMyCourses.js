import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useGetMyCoursesProgressQuery } from "@/redux/api/progressApiSlice";
import { setMyCoursesId } from "@/redux/features/authSlice";


export const useFetchMyCourses = () => {
    const dispatch = useDispatch();
    
    const { userInfo } = useSelector((state) => state.auth);

    const { data: myCourses } = useGetMyCoursesProgressQuery(undefined, {
        skip: !userInfo, 
        refetchOnMountOrArgChange: true,
    });

    useEffect(() => {
        if (myCourses) {
            const courseIds = myCourses.map((c) => c.courseId._id);
            dispatch(setMyCoursesId(courseIds));
        }
    }, [myCourses, dispatch]);
};