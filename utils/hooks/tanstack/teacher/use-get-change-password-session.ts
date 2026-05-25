import { getChangePasswordSession } from "@/utils/action/teacher/teacher.get";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export const fetchChangePasswordSession= async (email : string, token : string) => {
    const res = await getChangePasswordSession(email, token);
    return res;
   
}

export const useGetChangePasswordSession = (email : string, token : string) => {
  return useQuery({
    queryKey: ["get-change-password-session", email, token],
    queryFn: () => fetchChangePasswordSession(email, token),
    placeholderData: keepPreviousData,
    enabled : !!(email && token),
  });
}

//PLAN: User will clikc change password, the change password sesiso iwll be created 
// and redirect to the route?token="returned_form_acitn"&email=""
//change-passweord chech the sesisn and if valid then aloow fo the password to keep 