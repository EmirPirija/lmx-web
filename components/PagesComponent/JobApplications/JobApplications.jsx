"use client";
import { formatDateMonthYear, t } from "@/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { CurrentLanguageData } from "@/redux/reducer/languageSlice";
import NoData from "@/components/EmptyStates/NoData";
import { Badge } from "@/components/ui/badge";
import JobApplicationSkeleton from "@/components/Skeletons/JobApplicationSkeleton";
import { toast } from "@/utils/toastBs";
import Pagination from "@/components/Common/Pagination";
import { getMyJobApplicationsList } from "@/utils/api";
import CustomLink from "@/components/Common/CustomLink";

const JobApplications = () => {
  const CurrentLanguage = useSelector(CurrentLanguageData);
  const [jobApplication, setJobApplication] = useState({
    data: [],
    currentPage: 1,
    totalItems: 0,
    perPage: 15,
    totalPages: 0,
    isLoading: false,
  });

  useEffect(() => {
    fetchJobApplicationsData(1);
  }, [jobApplication?.currentPage, CurrentLanguage.code]);

  const fetchJobApplicationsData = async (page) => {
    try {
      setJobApplication((prev) => ({ ...prev, isLoading: true }));
      const response = await getMyJobApplicationsList.getMyJobApplications({
        page,
      });
      if (response.data.error === false) {
        setJobApplication((prev) => ({
          ...prev,
          data: response?.data?.data?.data,
          totalItems: response?.data?.data?.total,
          perPage: response?.data?.data?.per_page,
          totalPages: response?.data?.data?.last_page,
          currentPage: response?.data?.data?.current_page,
        }));
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setJobApplication((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handlePageChange = (page) => {
    setJobApplication((prev) => ({ ...prev, currentPage: page }));
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500">{"Na čekanju"}</Badge>;
      case "accepted":
        return <Badge className="bg-green-600">{"Prihvaćeno"}</Badge>;
      case "rejected":
        return <Badge className="bg-red-500">{"Odbijeno"}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };




  return (
    <>
      {jobApplication?.isLoading ? (
        <JobApplicationSkeleton />
      ) : jobApplication?.data?.length > 0 ? (
        <>
          <div className="overflow-hidden border rounded-md">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow className="text-xs sm:text-sm">
                  <TableHead>{"Naziv posla"}</TableHead>
                  <TableHead>{"Regruter"}</TableHead>
                  <TableHead>{"Status"}</TableHead>
                  <TableHead>{"Datum prijave"}</TableHead>
                  <TableHead>{"CV"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs sm:text-sm">
                {jobApplication?.data?.map((application) => (
                  <TableRow
                    key={application?.id}
                    className="hover:bg-muted text-center"
                  >
                    <TableCell>{application.item?.translated_name || "-"}</TableCell>
                    <TableCell>{application.recruiter?.name || "-"}</TableCell>
                    <TableCell>
                      {getStatusBadge(application.status || "Pending")}
                    </TableCell>
                    <TableCell>
                      {formatDateMonthYear(application.created_at)}
                    </TableCell>
                    <TableCell>
                      {application?.resume ? (
                        <CustomLink
                          href={application?.resume}
                          target="_blank"
                          className="text-primary underline font-medium"
                          rel="noopener noreferrer"
                        >
                          {"Pogledaj CV"}
                        </CustomLink>
                      ) : (
                        <span className="text-muted-foreground italic text-sm">
                          {"Nije dostupno"}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-end items-center mb-2">
              <Pagination
                className="mt-7"
                currentPage={jobApplication?.currentPage}
                totalPages={jobApplication?.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        </>
      ) : (
        <NoData name={"Prijave za posao"} />
      )}
    </>
  );
};

export default JobApplications;
