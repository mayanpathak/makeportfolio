import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { setCurrentEdit } from "@/slices/editModeSlice";
import { supabase } from "@/lib/supabase-client";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import EditButton from "@/components/EditButton";
import SectionHeader from "./SectionHeader";

const ProfessionalJourney = ({ currentPortTheme, customCSS }: any) => {
  interface Technology {
    name: string;
    logo: string;
  }

  interface Experience {
    role?: string;
    companyName?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    techStack?: Technology[];
  }

  const { portfolioData } = useSelector((state: RootState) => state.data);
  const inTheme = portfolioData?.find((item: any) => item.type === "themes");
  const theme = inTheme.data[currentPortTheme];
  const titleColor = theme.colors.primary;

  const experienceSection = portfolioData?.find(
    (item: any) => item.type === "experience"
  );
  const sectionTitle =
    experienceSection?.sectionTitle || "Professional Journey";
  const sectionDescription =
    experienceSection?.sectionDescription ||
    "Building real-world experience through innovative projects";

  const [experienceData, setExperienceData] = useState<Experience[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const params = useParams();
  const dispatch = useDispatch();

  const portfolioId = params.portfolioId as string;

  const [isHeadingVisible, setIsHeadingVisible] = useState(false);
  const [visibleItems, setVisibleItems] = useState<boolean[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsHeadingVisible(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (portfolioData) {
      const experienceSectionData = portfolioData.find(
        (section: any) => section.type === "experience"
      )?.data;
      if (experienceSectionData) {
        setExperienceData(experienceSectionData || []);
        setIsLoading(false);
      }
    }
  }, [portfolioData]);

  useEffect(() => {
    if (experienceData.length > 0) {
      setVisibleItems(Array(experienceData.length).fill(false));

      experienceData.forEach((_, index) => {
        setTimeout(() => {
          setVisibleItems((prev) => {
            const newState = [...prev];
            newState[index] = true;
            return newState;
          });
        }, 500 + index * 200); // Staggered timing
      });
    }
  }, [experienceData]);

  useEffect(() => {
    const subscription = supabase
      .channel(`portfolio-experience-${portfolioId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Portfolio",
          filter: `id=eq.${portfolioId}`,
        },
        (payload) => {
          // console.log("project experience detected!", payload);
        }
      )
      .subscribe((status) => {
        // console.log(`Supabase subscription status experience: ${status}`);
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [portfolioId]);

  const handleSectionEdit = () => {
    dispatch(setCurrentEdit("experience"));
  };

  if (isLoading) {
    return (
      <section className="py-24 w-full overflow-hidden min-h-screen text-white">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex items-center justify-center h-64">
            Loading...
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="text-white custom-bg p-2 sm:p-4 md:p-8">
      <style>{customCSS}</style>
      <SectionHeader
        sectionName="experience"
        sectionTitle={sectionTitle}
        sectionDescription={sectionDescription}
        titleColor={titleColor}
      />
      <div className="max-w-4xl mx-auto">
        {experienceData.length === 0 ? (
          <div className="text-center py-8 sm:py-12 text-gray-400">
            No professional experience added yet.
          </div>
        ) : (
          <div className="relative">
            {experienceData.map((experience, index) => (
              <div
                key={index}
                className={`relative section-card max-w-[95%] mx-auto md:max-w-[90%] transition-all duration-700 ${
                  visibleItems[index] ? "opacity-100" : "opacity-0"
                } ${
                  index !== experienceData.length - 1 ? "mb-10 sm:mb-16" : ""
                }`}
              >
                <div
                  className="absolute left-2 sm:left-6 transform -translate-x-1/2 w-3 h-3 rounded-full border-4 border-gray-900"
                  style={{ backgroundColor: titleColor }}
                ></div>
                <div
                  className="absolute left-2 sm:left-6 top-0 bottom-0 w-0.5"
                  style={{ backgroundColor: `${titleColor}30` }}
                ></div>
                <div
                  className="ml-4 sm:ml-16 transition-all duration-300 ease-in bg-stone-900/60 rounded-lg p-4 sm:p-6 border border-gray-700"
                  style={{ borderColor: `${titleColor}30` }}
                >
                  <h2
                    className={`text-lg sm:text-2xl section-sub-title font-bold mb-1 sm:mb-2 transition-all duration-700 delay-100 ${
                      visibleItems[index]
                        ? "opacity-100 translate-x-0"
                        : "opacity-0 -translate-x-4"
                    }`}
                  >
                    {experience.role}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-4 text-gray-400">
                    <span className="truncate max-w-[60vw] sm:max-w-none">
                      {experience.companyName}
                    </span>
                    <span
                      className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm"
                      style={{
                        backgroundColor: `${titleColor}20`,
                        color: titleColor,
                      }}
                    >
                      {experience.location}
                    </span>
                    <span
                      className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm"
                      style={{
                        backgroundColor: `${titleColor}20`,
                        color: titleColor,
                      }}
                    >
                      {experience.startDate} - {experience.endDate}
                    </span>
                  </div>
                  <p
                    className={`text-gray-300 section-sub-description mb-2 sm:mb-4 text-sm sm:text-base transition-all duration-700 delay-200 ${
                      visibleItems[index]
                        ? "opacity-100 translate-x-0"
                        : "opacity-0 -translate-x-4"
                    }`}
                  >
                    {experience.description}
                  </p>
                  {experience.techStack && experience.techStack.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
                      {experience.techStack.map((tech, techIndex) => (
                        <span
                          key={techIndex}
                          className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm flex items-center gap-1 border"
                          style={{
                            backgroundColor: `${titleColor}20`,
                            color: titleColor,
                            border: `1px solid ${titleColor}30`,
                          }}
                        >
                          <img
                            src={
                              tech.logo ||
                              `https://placehold.co/100x100?text=${tech.name}&font=montserrat&fontsize=18`
                            }
                            alt={tech.name}
                            className="h-4 w-4 inline-block mr-1"
                          />{" "}
                          {tech.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfessionalJourney;
