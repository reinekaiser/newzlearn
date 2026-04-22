import Course from "../models/course.js";
import Order from "../models/order.js";
import User from "../models/user.js";

export const getStudentsInCourse = async(req,res)=>{
    try {
        const { courseId } = req.params;
        const course = await Course.findById(courseId)
        if ( !course ){
            return res.status(404).json({message:"Course not found"})
        }
        // Học viên đã mua khóa học sẽ lưu trong order
        const students = await Order.find({courseId:courseId, isPaid: true}).populate('userId', "firstName lastName email profilePicture").lean();
        res.json(students);
    } catch (error) {
        console.log(error)
        return res.status(500).json({message:"Server Error"})
    }
}

export const getStudentProfile = async(req,res)=>{
    try {
        const { studentId } = req.params;
        const user = await User.findById(studentId).select("-password").lean();
        const courses = await Order.find({userId: studentId}).populate('courseId', "title thumbnail subtitle alias").lean();
        res.json({user, courses});
    } catch (error) {
        console.log(error)
        return res.status(500).json({message:"Server Error"})
    }
}