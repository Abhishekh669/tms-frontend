import TMSWrapper from '@/components/application/tms/tms-wrapper'
import React from 'react'

function RMSLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <TMSWrapper>
                {children}
            </TMSWrapper>
        </>
    )
}

export default RMSLayout
