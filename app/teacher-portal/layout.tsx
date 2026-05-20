import TeacherPortalWrapper from "@/components/application/teacher-portal/TeacherPortalWrapper"

function TeacherPortalLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <TeacherPortalWrapper>
            {children}
        </TeacherPortalWrapper>
    )
}

export default TeacherPortalLayout