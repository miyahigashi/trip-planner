import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex justify-center p-8">
      <SignUp routing="path" path="/sign-up" />
    </div>
  );
}
