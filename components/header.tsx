import { IconGitHub } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";

export async function Header() {
    return (
        <header className="sticky top-5 z-50 flex items-center justify-center w-full px-4 h-24 shrink-0  bg-white backdrop-blur-xl">
            <span className="inline-flex items-center home-links whitespace-nowrap">
                <a
                    href="https://availsthlm.se"
                    rel="noopener"
                    target="_blank"
                    className="Header__logo"
                >
                    <svg
                        className="icon icon--chef-logo"
                        fill="none"
                        height="96"
                        viewBox="0 0 279 96"
                        width="279"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <g fill="#d5251b">
                            <path d="m56.7305 63.6365c-1.8495 5.8058-4.687 14.332-14.5525 14.332-13.8128 0-16.7719-14.332-16.7719-28.7805 0-22.9746 10.2354-27.2985 16.7719-27.2985 10.8536 0 13.0729 8.6479 13.8127 13.0936l22.0771-4.324c-2.2193-12.2309-11.9633-26.80632-34.5318-26.80632-20.8406-.00529-43.536 12.10392-43.536 46.07092s21.2105 46.0762 43.536 46.0762c19.731 0 30.5846-9.3888 35.2716-27.4203z"></path>
                            <path d="m82.1841 93.899h21.7069v-46.4837c4.967-4.6256 7.736-7.0549 11.662-7.0549 6.695 0 6.695 7.6318 6.695 12.8342v40.7044h21.708v-49.2623c0-8.2086 0-22.0854-17.206-22.0854-9.469 0-15.123 4.5092-22.859 10.9871v-29.48957h-21.7069z"></path>
                            <path d="m191.946 50.7654h-21.823c0-4.2763 1.152-13.644 11.313-13.644 9.237 0 10.278 9.2512 10.505 13.644zm21.29 14.2261v-5.5518c0-25.9013-14.431-36.8884-32.677-36.8884-21.475 0-32.677 16.5389-32.677 36.772 0 12.6067 5.078 36.1952 32.677 36.1952 14.204 0 23.44-4.7421 29.676-17.9256l-18.357-6.0122c-1.501 3.2389-3.927 8.4414-10.97 8.4414-10.854 0-10.854-10.4102-10.854-15.0359h43.182z"></path>
                            <path d="m223.429 93.8989h21.707v-49.1458h13.971v-16.5337h-13.971v-4.0487c0-5.8958 3.35-9.6005 8.661-9.6005 3.926 0 5.775.5768 7.852 1.0426v-14.22617c-4.502-.926186-6.695-1.38663-11.314-1.38663-22.167 0-26.901 13.4164-26.901 25.6737v2.5457h-10.045v16.5337h10.045v49.1458z"></path>
                            <path d="m278.4 68.8549h-25.005v25.0439h25.005z"></path>
                        </g>
                    </svg>
                    <span className="block sm:inline text-md sm:text-md lg:text-md font-semibold  text-gray-600">
                        - by Avail STHLM
                    </span>
                </a>
            </span>
            <div className="flex items-center justify-end space-x-2"></div>
        </header>
    );
}
