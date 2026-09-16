import LandingHeader from './landing/LandingHeader';
import LandingHero from './landing/LandingHero';
import LandingModulos from './landing/LandingModulos';
import LandingPlanes from './landing/LandingPlanes';
import LandingContacto from './landing/LandingContacto';
import LandingFooter from './landing/LandingFooter';

export default function Landing() {
  return (
    <div className="min-h-screen w-full bg-[#0A1413]">
      <LandingHeader />
      <LandingHero />
      <LandingModulos />
      <LandingPlanes />
      <LandingContacto />
      <LandingFooter />
    </div>
  );
}
