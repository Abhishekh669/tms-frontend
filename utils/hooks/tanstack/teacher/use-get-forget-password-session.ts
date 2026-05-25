import { getChangePasswordSession, getForgetPasswordSession } from "@/utils/action/teacher/teacher.get";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export const fetchForgetPasswordSession= async (email : string, token : string) => {
    const res = await getForgetPasswordSession(email, token);
    return res;
   
}

export const useGetForgetPasswordSession = (email : string, token : string) => {
  return useQuery({
    queryKey: ["get-forget-password-session", email, token],
    queryFn: () => fetchForgetPasswordSession(email, token),
    placeholderData: keepPreviousData,
    enabled : !!(email && token),
  });
}

//PLAN: User will clikc change password, the change password sesiso iwll be created 
// and redirect to the route?token="returned_form_acitn"&email=""
//change-passweord chech the sesisn and if valid then aloow fo the password to keep 