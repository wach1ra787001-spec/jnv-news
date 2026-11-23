import SubscribeSection from "@/components/SubscribeSection";

export default function Page() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-[920px]">
        <SubscribeSection />
        <p className="mt-5 text-center text-sm text-[#5a6b85]">
          Already a member?{" "}
          <a
            href="https://app.jnvtradingjournal.com"
            className="underline underline-offset-4 hover:text-[#1a2b4c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2674D9]"
          >
            Continue to your trading dashboard
          </a>
        </p>
      </div>
    </main>
  );
}
