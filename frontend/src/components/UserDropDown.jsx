import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import Button from "./Button";
import { useDispatch } from "react-redux";
import { useLogoutMutation } from "@/redux/api/authSlice";
import { useNavigate } from "react-router-dom";
import { logout } from "@/redux/features/authSlice";
import { LogOut, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

function UserDropDown({user}) {
  const [logoutApi] = useLogoutMutation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
      dispatch(logout());
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Logout thất bại, thử lại");
    }
  };
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="p-0 rounded-full">
          <Avatar className="w-8 h-8 border border-[#098be4]">
            <AvatarImage src={user.profilePicture?.url} />
            <AvatarFallback>{user.firstName[0].toUpperCase()}</AvatarFallback>
          </Avatar>
        </Button>
      </PopoverTrigger>
      <PopoverContent className={"max-w-md w-auto p-2"}>
        <Button className={"w-full flex gap-2 text-[0.9rem]"} onClick={()=>navigate("/student/profile")}>
            <User />
            Hồ sơ
        </Button>
        <Button className={"w-full flex gap-2 text-[0.9rem]"} onClick={handleLogout}>
            <LogOut />
            Đăng xuất
        </Button>
      </PopoverContent>
    </Popover>
  );
}

export default UserDropDown;
