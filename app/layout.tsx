import './globals.css'
import React from 'react'
import {Inter, Space_Grotesk} from "next/font/google";
import type {Metadata} from "next";
import {ThemeProvider} from "../context/ThemeProvider";

const inter = Inter({
    subsets: ['latin'],
    weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
    variable: '--font-inter'
})

export const metadata: Metadata = {
    title: 'Graph Generator',
    description: 'Website for generating graphs from csv files',
    icons: {
        icon: '/assets/images/site-logo.svg'
    }
}
export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (

        <html lang="en">
        <body className={`${inter.variable} ${inter.variable} min-h-screen bg-gradient-to-br from-white to-gray-500 tracking-tighter`}>
        <ThemeProvider>
            {children}
        </ThemeProvider>
        </body>
        </html>

    )
}
