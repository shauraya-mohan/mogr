import ForceDarkTheme from "@/components/ForceDarkTheme";
import SiteHeader from "@/components/SiteHeader";
import Hero from "@/components/Hero";
import HeroVideo from "@/components/HeroVideo";
import CategoryGrid from "@/components/CategoryGrid";
import HowItWorks from "@/components/HowItWorks";
import WhyMogr from "@/components/WhyMogr";
import Proof from "@/components/Proof";
import Cta from "@/components/Cta";
import SiteFooter from "@/components/SiteFooter";
import Motion from "@/components/Motion";

export default function Home() {
  return (
    <>
      <ForceDarkTheme />
      <SiteHeader />
      <main id="top">
        <Hero />
        <HeroVideo />
        <CategoryGrid />
        <HowItWorks />
        <WhyMogr />
        <Proof />
        <Cta />
      </main>
      <SiteFooter />
      <Motion />
    </>
  );
}
