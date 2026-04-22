import { useGetAllReviewsQuery } from "@/redux/api/reviewSlice";

import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

export default function Testimonials() {
  const { data, isLoading: loadingInitial } = useGetAllReviewsQuery({
    courseId: "all",
    rating: undefined,
    sortBy: 'newest',
  });
  if (loadingInitial) return;
  const displayedReviews = data?.reviews.slice(0, 3);

  const getInitials = (firstName = "", lastName = "") => {
    const first = firstName.trim().charAt(0);
    const last = lastName.trim().charAt(0);
    return `${first}${last}`.toUpperCase();
  };

  const renderStars = (rating) => {
    const stars = [];
    let remaining = rating;
    for (let i = 1; i <= 5; i++) {
      if (remaining >= 1) stars.push(<FaStar key={i} className="text-yellow-500" />);
      else if (remaining >= 0.5) stars.push(<FaStarHalfAlt key={i} className="text-yellow-500" />);
      else stars.push(<FaRegStar key={i} className="text-yellow-500" />);
      remaining -= 1;
    }
    return stars;
  };

  return (
    <section className="py-16 bg-white">
      {/* Title */}
      <div className="text-center mb-12">
        <p className="text-gray-500 uppercase font-semibold">
          Học viên nói
        </p>
        <h2 className="text-3xl md:text-4xl font-bold">
          <span className="text-blue-500">Sự hài lòng</span>{" "}
          <span className="text-black">luôn hiện hữu</span>
        </h2>
      </div>

      {/* Cards */}
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6 px-4 mb-10">
        {displayedReviews.map((review) => (
          <div
            key={review._id}
            className="bg-[#f0f2f8] p-6 rounded-xl shadow-sm relative"
          >
            {/* Avatar + Info */}
            <div className="flex items-center gap-3 mb-4">
              {review.userId?.profilePicture?.url ? (
                <img
                  src={review?.userId.profilePicture.url}
                  alt={`${review.userId?.firstName} ${review.userId?.lastName}`}
                  className="w-10 h-10 rounded-full object-cover mr-3"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-800 text-white flex items-center justify-center font-semibold mr-3">
                  {getInitials(review.userId?.firstName, review.userId?.lastName)}
                </div>
              )}
              <div className="flex-1">
                <div className="font-semibold text-gray-700 mb-1">
                  {review.userId?.firstName} {review.userId?.lastName}
                </div>

                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  {renderStars(review.rating)}
                  {/* <span className='text-xs text-gray-400 ml-2'>{updatedAgo()}</span> */}
                </div>
              </div>
            </div>
            <div className="w-full border-t border-white border-2 my-5"></div>

            {/* Feedback */}
            <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-4">
              {review.comment}
            </p>

            {/* Rating */}
            {/* <div className="flex text-yellow-500">
              {Array.from({ length: review.rating }).map((_, i) => (
                <Star key={i} size={16} fill="currentColor" />
              ))}
            </div> */}
          </div>
        ))}
      </div>

      <div className="text-center font-bold text-lg">
        Hơn 10.000 sinh viên tin tưởng và theo học tại NewZLearn
      </div>
    </section>
  );
}
