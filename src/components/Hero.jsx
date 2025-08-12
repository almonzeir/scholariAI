import { Button } from "./ui/Button";

export function Hero({
  videoSrc = "/videos/scholarship-bg.mp4",
  onUploadClick,
  onQuestionsClick,
}) {
  return (
    <section className="relative h-screen overflow-hidden flex items-center justify-center text-white bg-bg">
      <video
        autoPlay muted loop playsInline
        className="absolute inset-0 w-full h-full object-cover brightness-50 z-0 pointer-events-none"
        poster="/videos/hero-poster.jpg"
      >
        <source src={videoSrc} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/40 z-10" />

      <div className="relative z-20 text-center px-6 max-w-2xl">
        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight font-heading">
          Find Your <span className="text-primary">Fully Funded Scholarship</span><br /> Instantly with AI
        </h1>
        <p className="mt-4 text-text-lo text-lg md:text-xl">
          Upload your CV or answer a few quick questions — we'll handle the rest.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={onUploadClick}>📄 Upload CV</Button>
          <Button variant="ghost" onClick={onQuestionsClick}>✍️ Answer Questions</Button>
        </div>
      </div>
    </section>
  );
}