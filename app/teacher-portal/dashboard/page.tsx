import Link from 'next/link'
import React from 'react'
import { ArrowRight, Clock, FileText } from 'lucide-react'

function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 to-sky-50/50 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-12 sm:px-6 sm:py-16 md:py-24 max-w-4xl">
        
        {/* Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-6 sm:p-8 md:p-12 text-center">
            
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-6">
              <Clock className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            
            {/* Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-3">
              Coming Soon
            </h1>
            
            {/* Description */}
            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
              For now, you can enter your weekly test records through the link below.
            </p>
            
            {/* Button */}
            <Link
              href={"/teacher-portal/vacancy-records"}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <FileText className="w-5 h-5" />
              Access Weekly Records
              <ArrowRight className="w-5 h-5" />
            </Link>
            
            {/* Decorative Line */}
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-500">
                This feature is currently under development
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Page