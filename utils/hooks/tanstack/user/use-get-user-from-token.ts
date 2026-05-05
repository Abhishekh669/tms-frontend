import { auth } from "@/utils/action/auth/auth.get";
import { useQuery } from "@tanstack/react-query";

export const getUserFromToken = async () => {
    const session = await auth();
    if(!session)return null;
    return session?.user;
};

export const useGetUserFromToken = () =>{
    return useQuery({
    queryKey: ["get-user-from-token"],
    queryFn: getUserFromToken,
    retry: false,
    refetchOnWindowFocus: true, // refresh on tab focus
  });
}