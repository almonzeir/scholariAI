import React, { useState } from "react";
import { Hero } from "../components/Hero";
import { FileDropPDF } from "../components/FileDropPDF";
import { Button } from "../components/ui/Button";
import { Pill } from "../components/ui/Pill";
import { Card } from "../components/ui/Card";

export function Phase4Demo() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileError, setFileError] = useState(null);

  const handleFileUpload = (file) => {
    setUploadedFile(file);
    setFileError(null);
    console.log("File uploaded:", file.name);
  };

  const handleUploadClick = () => {
    console.log("Upload CV clicked");
  };

  const handleQuestionsClick = () => {
    console.log("Answer Questions clicked");
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Hero Section */}
      <Hero
        onUploadClick={handleUploadClick}
        onQuestionsClick={handleQuestionsClick}
      />

      {/* Components Demo Section */}
      <div className="container mx-auto px-6 py-16 space-y-16">
        {/* File Drop Demo */}
        <section>
          <h2 className="text-3xl font-bold font-heading mb-8 text-center">
            File Upload Component
          </h2>
          <div className="max-w-md mx-auto">
            <FileDropPDF
              onFile={handleFileUpload}
              error={fileError}
              hint="Drop your CV here or click to browse"
            />
            {uploadedFile && (
              <div className="mt-4 p-4 bg-elevated/60 rounded-2xl border border-border">
                <p className="text-success">✅ File uploaded successfully!</p>
                <p className="text-text-lo text-sm mt-1">{uploadedFile.name}</p>
              </div>
            )}
          </div>
        </section>

        {/* Buttons Demo */}
        <section>
          <h2 className="text-3xl font-bold font-heading mb-8 text-center">
            Button Components
          </h2>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button variant="primary">Primary Button</Button>
            <Button variant="ghost">Ghost Button</Button>
            <Button variant="primary" disabled>
              Disabled Button
            </Button>
          </div>
        </section>

        {/* Pills Demo */}
        <section>
          <h2 className="text-3xl font-bold font-heading mb-8 text-center">
            Pill Components
          </h2>
          <div className="flex flex-wrap gap-3 justify-center">
            <Pill>Engineering</Pill>
            <Pill>Computer Science</Pill>
            <Pill>Full Funding</Pill>
            <Pill>International</Pill>
            <Pill>Graduate</Pill>
          </div>
        </section>

        {/* Cards Demo */}
        <section>
          <h2 className="text-3xl font-bold font-heading mb-8 text-center">
            Card Components
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <h3 className="text-xl font-semibold mb-3">Scholarship Card</h3>
              <p className="text-text-lo mb-4">
                This is a sample scholarship card showcasing the new design system.
              </p>
              <div className="flex gap-2 mb-4">
                <Pill>Full Funding</Pill>
                <Pill>PhD</Pill>
              </div>
              <Button variant="primary" className="w-full">
                Apply Now
              </Button>
            </Card>

            <Card>
              <h3 className="text-xl font-semibold mb-3">Feature Card</h3>
              <p className="text-text-lo mb-4">
                Another example card with the premium dark aesthetic and modern styling.
              </p>
              <div className="flex gap-2 mb-4">
                <Pill>AI Powered</Pill>
                <Pill>Instant</Pill>
              </div>
              <Button variant="ghost" className="w-full">
                Learn More
              </Button>
            </Card>

            <Card>
              <h3 className="text-xl font-semibold mb-3">Stats Card</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-text-lo">Success Rate</span>
                  <span className="text-success font-semibold">94%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-lo">Total Scholarships</span>
                  <span className="text-accent font-semibold">2,847</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-lo">Average Award</span>
                  <span className="text-primary font-semibold">$45,000</span>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Color Palette Demo */}
        <section>
          <h2 className="text-3xl font-bold font-heading mb-8 text-center">
            Color Palette
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="w-full h-20 bg-primary rounded-2xl mb-2"></div>
              <p className="text-sm text-text-lo">Primary</p>
            </div>
            <div className="text-center">
              <div className="w-full h-20 bg-accent rounded-2xl mb-2"></div>
              <p className="text-sm text-text-lo">Accent</p>
            </div>
            <div className="text-center">
              <div className="w-full h-20 bg-success rounded-2xl mb-2"></div>
              <p className="text-sm text-text-lo">Success</p>
            </div>
            <div className="text-center">
              <div className="w-full h-20 bg-warning rounded-2xl mb-2"></div>
              <p className="text-sm text-text-lo">Warning</p>
            </div>
            <div className="text-center">
              <div className="w-full h-20 bg-elevated rounded-2xl border border-border mb-2"></div>
              <p className="text-sm text-text-lo">Elevated</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}