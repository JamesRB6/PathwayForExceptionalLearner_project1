"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ky from "ky";

const Page: React.FC = () => {
  const [ltik, setLtik] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get ltik from search parameters and determine redirection
  useEffect(() => {
    // Get ltik from search parameters
    const ltikValue = searchParams.get("ltik");
    if (ltikValue) {
      setLtik(ltikValue);

      const getInfo = async () => {
        try {
          const launchInfo: { roles?: string[] } = await ky
            .get("https://amusing-happily-tomcat.ngrok-free.app/info", {
              credentials: "include",
              headers: { Authorization: "Bearer " + ltikValue },
            })
            .json();

          // Redirect based on user role
          if (
            launchInfo.roles &&
            launchInfo.roles.includes(
              "http://purl.imsglobal.org/vocab/lis/v2/membership#Learner"
            )
          ) {
            router.replace(`/assignments?ltik=${ltikValue}`); // Redirect to the student page
          } else if (
            launchInfo.roles &&
            launchInfo.roles.includes(
              "http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor"
            )
          ) {
            router.replace(`/admin/assignments?ltik=${ltikValue}`); // Redirect to the teacher page
          } else {
            setIsLoading(false); // If no valid role found, stop loading
          }
        } catch (err) {
          console.error("Failed trying to retrieve custom parameters!", err);
          setIsLoading(false); // Stop loading in case of error
        }
      };

      getInfo();
    } else {
      setIsLoading(false); // No ltik found, stop loading
    }
  }, [searchParams, router]);

  // Render nothing until the role evaluation or redirection is complete
  if (isLoading) {
    return null; // Optionally, you can add a loading spinner here
  }

  // If no ltik or no valid role, display a fallback message or nothing
  return (
    <div>
      <p>No valid LTI key provided or user role could not be determined.</p>
    </div>
  );
};

export default Page;
