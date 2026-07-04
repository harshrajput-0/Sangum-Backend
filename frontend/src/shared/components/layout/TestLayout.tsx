import { Outlet } from "react-router-dom";
import { Navbar } from "../navigation/PublicNavbar";
import { Footer } from "../navigation/PublicFooter";

export const Layout = () => {
    return (
        <div className="min-h-screen flex flex-col bg-[#0A0D0F] text-[#FFFDFC]">
            <Navbar />
            <main className="flex-1 pt-16">
                <Outlet />
            </main>
            <Footer />
        </div>
    )
}