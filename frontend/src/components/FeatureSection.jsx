import { FileBadge, GraduationCap, ListCheck } from "lucide-react";

export default function FeatureSection() {
  const features = [
    {
      icon: <GraduationCap className="text-[#098be4] text-3xl" />,
      title: "Khóa học ngắn hạn",
      desc: "Rèn luyện kỹ năng mới theo nhịp độ của riêng bạn với các khóa học trực tuyến linh hoạt.",
    },
    {
      icon: <ListCheck className="text-[#098be4] text-3xl" />,
      title: "Lộ trình chuyên gia",
      desc: "Nâng cao chuyên môn của bạn với chuỗi khóa học chuyên biệt được tuyển chọn kỹ lưỡng.",
    },
    {
      icon: <FileBadge className="text-[#098be4] text-3xl" />,
      title: "Chứng chỉ vi mô",
      desc: "Đạt được các chứng chỉ nghề nghiệp hoặc học thuật được công nhận.",
    },
  ];
  return (
    <section className="w-full bg-gray-100 h-full py-5 px-20">
      <div className="max-w-screen mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((f, i) => (
          <div
            key={i}
            className="flex items-center justify-center rounded-xl space-x-4 p-6"
          >
            <div className="p-4 bg-white rounded-full">{f.icon}</div>
            <div className="flex-col">
              <h3 className="font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-600 text-sm">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
