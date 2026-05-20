import { teacherAuth } from "@/utils/action/teacher/teacher.get";
import { useQuery } from "@tanstack/react-query";

export const getTeacherFromToken = async () => {
    const session = await teacherAuth();
    if(!session)return null;
    return session?.teacher;
};

export const useGetTeacherFromToken = () =>{
    return useQuery({
    queryKey: ["get-teacher-from-token"],
    queryFn: getTeacherFromToken,
    retry: false,
    refetchOnWindowFocus: true, // refresh on tab focus
  });
}