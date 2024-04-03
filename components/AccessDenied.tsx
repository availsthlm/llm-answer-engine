import { signIn } from "next-auth/react";
import { Button } from "./ui/button";

export default function AccessDenied() {
    return (
        <div className="mt-52 flex flex-col items-center">
            <Button
                size="lg"
                onClick={(e) => {
                    e.preventDefault();
                    signIn();
                }}
            >
                Logga in
            </Button>
        </div>
    );
}
