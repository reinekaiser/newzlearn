import { Link } from "react-router-dom"

const InstructorHeader = () => {
    return (
        <div className="container flex justify-between">
            <Link to={"/instructor"}><img src="/logo_with_text.png" alt="NewZLearn" /></Link>
            <div>
                <button to={"/"} className="hover:">Học viên</button>
            </div>
        </div>
    )
}
export default InstructorHeader