import CoursesList from "../../components/CoursesList";
import FeatureSection from "../../components/FeatureSection";
import HeroSection from "../../components/HeroSection";
import Testimonials from "../../components/Testimonials";
import { useEffect, useState } from "react";
import useInView from "../../hooks/tiptap/useInView";
import RecommendList from "@/components/RecommendList";

export default function HomePage() {
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [featureRef, featureVisible] = useInView();
  const [courseRef, courseVisible] = useInView();
  const [recommendRef, recommendVisible] = useInView();
  const [testiRef, testiVisible] = useInView();
  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  return (
    <div className="w-full min-h-screen">
      <div className="flex-col mt-18">
        <section
          id="heroSection"
          className={`transition-all duration-1000 delay-200 ${
            isPageLoaded
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <HeroSection />
        </section>
        <section
          id="feature"
          ref={featureRef}
          className={`mt-10 transition-all duration-1000 ${
            featureVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <FeatureSection />
        </section>
        <section
          id="courseList"
          ref={recommendRef}
          className={`mt-10 transition-all duration-1000 ${
            recommendVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <RecommendList />
        </section>
        <section
          id="courseList"
          ref={courseRef}
          className={`mt-10 transition-all duration-1000 ${
            courseVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <CoursesList />
        </section>
        <section
          id="testimonial"
          ref={testiRef}
          className={`mt-10 transition-all duration-1000 ${
            testiVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <Testimonials />
        </section>
      </div>
    </div>
  );
}
