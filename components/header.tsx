import { IconGitHub } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";

export async function Header() {
    return (
        <header className="sticky top-0 z-50 flex items-center justify-between w-full px-4 h-14 shrink-0  bg-white backdrop-blur-xl">
            <span className="inline-flex items-center home-links whitespace-nowrap">
                <a href="https://availsthlm.se" rel="noopener" target="_blank">
                    <span className="block sm:inline text-lg sm:text-xl lg:text-2xl font-semibold  text-red-600">
                        CHEF
                    </span>
                </a>
            </span>
            <div className="flex items-center justify-end space-x-2"></div>
        </header>
    );
}
