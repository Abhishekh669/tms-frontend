import LoginCard from '@/components/application/auth/LoginCard';
import { auth } from '@/utils/action/auth/auth.get';
import { redirect } from 'next/navigation';

async function page() {
    const session = await auth();
    if (session) {
        redirect("/dashboard")
    }
    return <LoginCard />
    
}

export default page
