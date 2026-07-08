import { Outlet } from "react-router-dom";
import { Navbar } from "@/shared/components/navigation/PublicNavbar";
import { Footer } from "@/shared/components/navigation/PublicFooter";

export const PublicLayout = () => {
    return (
        <div>
            <Navbar />
            <main className="flex-1 mt-12 mb-10">
                <Outlet />
            </main>
            
            <Footer />
        </div>
    )
}