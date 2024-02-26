import React from 'react'

const Layout = ({children}: { children: React.ReactNode }) => {
    return (
        <main className="h-screen w-screen">
            <div className=" py-5 px-5 mb-3">
                <h1 className="font-bold text-3xl text-black">Graph generator</h1>
            </div>
            <div>
                {children}
            </div>
        </main>
    )
}

export default Layout
