import { atom, useAtom } from "jotai";
import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

// Base pictures - these will ALWAYS load from your local textures folder
const basePictures = [
  "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22"
];

export const pageAtom = atom(0);
export const selectedPageAtom = atom(null);
export const currentViewAtom = atom("home");






const defaultPageContent = {
  title: "Captured Moments",
  eventName: "Freshers Day 2025",
  lines: [
    "A snapshot from Freshers Day 2025 highlighting the AIML community.",
    "Every page reveals a different moment from the celebration.",
  ],
};

const pageContentMap = {
  "book-cover": {
    title: "Front Cover",
    eventName: "Freshers Day 2025",
    lines: [
      "Welcome to the ANEXSA Freshers Day 2025 memory book.",
      "Flip through to relive the celebration highlights.",
    ],
  },
  "book-back": {
    title: "Back Cover",
    eventName: "Freshers Day 2025",
    lines: [
      "Thank you for exploring the highlights from Freshers Day 2025.",
      "Stay tuned with ANEXSA for more memories and milestones.",
    ],
  },
  "1": {
    title: "AIML Jersey Launch",
    eventName: "Sports Day Preparation",
    lines: [
      "The AIML department unveils their new sports jerseys with pride.",
      "Department head leads the ceremonial launch, energizing the sports teams.",
    ],
  },
  "2": {
    title: "Final-Year AIML Group",
    eventName: "Ethnics Day",
    lines: [
      "Final-year AIML students unite for a traditional Ethnics Day shot.",
      "Their vibrant attire captures the branch's spirit and pride.",
    ],
  },
  "3": {
    title: "3rd Year CE Ensemble",
    eventName: "Ethnics Day",
    lines: [
      "Third-year Computer Engineering students showcase coordinated looks.",
      "A cheerful group portrait from the Ethnics Day festivities.",
    ],
  },
  "4": {
    title: "3rd Year AIML Crew",
    eventName: "Ethnics Day",
    lines: [
      "AIML juniors pose together after the Ethnics Day celebrations.",
      "Their unity and color palette brighten the campus courtyard.",
    ],
  },
  "5": {
    title: "ANEXSA Title Reveal",
    eventName: "Freshers Day Campaign Launch",
    lines: [
      "ANEXSA unveils the official Freshers Day title with great fanfare.",
      "The anticipation builds as the community sees the grand theme revealed.",
    ],
  },
  "6": {
    title: "Principal's Title Reveal",
    eventName: "Freshers Day Launch",
    lines: [
      "Principal Sir unveils the Freshers Day title with faculty and team.",
      "The ceremonial launch sets the vision for the upcoming fest.",
    ],
  },
  "7": {
    title: "ANVAYA Poster Launch",
    eventName: "Anvaya",
    lines: [
      "Anvaya promotional poster revealed for the Freshers Day celebration.",
      "Creative design elements highlight the spirit of community and culture.",
    ],
  },
  "8": {
    title: "AIML & CE Flash Mob",
    eventName: "Freshers Day Launch",
    lines: [
      "Joint flash mob performance by AIML and CE branches.",
      "Energetic display marks the beginning of the festivities.",
    ],
  },
  "9": {
    title: "Innovative Title Reveal",
    eventName: "Mini AI Car Demonstration",
    lines: [
      "A remote-controlled mini car adds a tech twist to the title reveal.",
      "Innovation meets tradition in this creative announcement approach.",
    ],
  },
  "10": {
    title: "CE Title Reveal Crew",
    eventName: "Freshers Day Launch",
    lines: [
      "Third-year CE students gather post-title reveal for a commemorative photo.",
      "Their support ensured a seamless and spectacular launch presentation.",
    ],
  },
  "11": {
    title: "AIML Football Champions",
    eventName: "Sports Triumphs",
    lines: [
      "Victorious AIML football squad celebrates their tournament win.",
      "Their teamwork and determination shine through the trophy moment.",
    ],
  },
  "12": {
    title: "AIML Cricket Podium",
    eventName: "Sports Triumphs",
    lines: [
      "AIML cricket team celebrates securing second runners-up position.",
      "Medals and smiles mark their consistent tournament run.",
    ],
  },
  "13": {
    title: "Hacknex Innovation Hub",
    eventName: "COGNEX Club Workshop",
    lines: [
      "Students collaborate and innovate during the intensive Hacknex program.",
      "Hands-on learning and rapid prototyping bring ideas to life.",
    ],
  },
  "14": {
    title: "Cognex Leadership",
    eventName: "COGNEX Club",
    lines: [
      "Portrait of the Cognex Club president and vice president.",
      "Their guidance continues to elevate AIML technical initiatives.",
    ],
  },
  "15": {
    title: "Anvaya Launch Celebration",
    eventName: "Title Reveal Event",
    lines: [
      "The grand unveiling of Anvaya brings excitement and anticipation.",
      "Students and faculty gather to witness this momentous launch.",
    ],
  },
  "16": {
    title: "Lynx Freshers Welcome",
    eventName: "Ice Breaking Session",
    lines: [
      "New students bond and connect during the engaging ice-breaking activities.",
      "Building friendships and creating lasting memories from day one.",
    ],
  },
  "17": {
    title: "AIML Throwball Champions",
    eventName: "Sports Victory Celebration",
    lines: [
      "The AIML throwball team celebrates their championship victory.",
      "Teamwork, dedication, and skill led to this triumphant moment.",
    ],
  },
  "18": {
    title: "Overall Champions Glory",
    eventName: "AIML & CE Sports Triumph",
    lines: [
      "The combined strength of AIML and CE secures the overall championship.",
      "A moment of pride as both departments celebrate their collective success.",
    ],
  },
  "19": {
    title: "Mini Project Excellence",
    eventName: "KALAKAR 2024-2025 Awards",
    lines: [
      "Outstanding students receive recognition for their innovative mini projects.",
      "Academic excellence and creativity are celebrated and honored.",
    ],
  },
   "20":  {
    title: "AI&ML Title Reveal Crew",
    eventName: "Freshers Day Launch",
    lines: [
      "Third-year AI&ML students gather post-title reveal for a commemorative photo.",
      "Their support ensured a seamless and spectacular launch presentation.",
    ],
  },
  "21": {
    title:"Proud of AI&ML",
    eventName: "MIT Hackthon",
    lines: [
      "AI&ML team showcases their innovative projects at the MIT Hackthon and managed to placed top 5.",
      "Collaboration and creativity drive their success in the competition.",
    ],
  },

};

export const UI = () => {
  const [page, setPage] = useAtom(pageAtom);
  const [selectedPage, setSelectedPage] = useAtom(selectedPageAtom);
  const [currentView, setCurrentView] = useAtom(currentViewAtom);
  const [pages, setPages] = useState([]);
  const [firebaseImages, setFirebaseImages] = useState([]);

  // 1. Fetch images from Firestore (Real-time)
  useEffect(() => {
    const q = query(collection(db, "magazine-images"), orderBy("uploadedAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const images = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFirebaseImages(images);
    });
    return () => unsubscribe();
  }, []);

  // 2. Generate Pages - FIXED LOGIC to prevent gaps
  useEffect(() => {
    // Combine local base pictures with dynamic firebase images
    const allPictureIds = [...basePictures, ...firebaseImages.map(img => img.id)];
    
    const generatedPages = [
      { front: "book-cover", back: "book-back" },
    ];

    // Loop through ALL images starting from 0
    // This ensures Image 1 is Front, Image 2 is Back, Image 3 is Front, etc.
    for (let i = 0; i < allPictureIds.length; i += 2) {
      const front = allPictureIds[i];
      // If there is a next image, use it for back. If not, use book-back.
      const back = (i + 1 < allPictureIds.length) ? allPictureIds[i + 1] : "book-back";
      
      generatedPages.push({ front, back });
    }

    generatedPages.push({ front: "book-back", back: "book-back" });
    setPages(generatedPages);
  }, [firebaseImages]);

  useEffect(() => {
    const audio = new Audio("/audios/page-flip-01a.mp3");
    audio.play().catch(error => {
      // Ignore autoplay restriction errors
      console.log("Audio autoplay prevented:", error.message);
    });
  }, [page]);

  const closePageView = () => {
    setSelectedPage(null);
    setCurrentView("home");
  };

  const handleBackToBook = () => {
    setSelectedPage(null);
    setCurrentView("home");
  };







  // Helper to get image source
  const getImageSource = (pageId) => {
    if (!pageId) return "";
    if (pageId === "book-cover") {
      return "/textures/book-cover.png";
    }
    if (pageId === "book-back") {
      return "/textures/book-back.jpg";
    }
    
    // Check if it's a local base picture
    if (basePictures.includes(pageId)) {
      return `/textures/${pageId}.jpg`;
    }
    
    // Check if it's a firebase image
    const firebaseImg = firebaseImages.find(img => img.id === pageId);
    if (firebaseImg) {
      return firebaseImg.imageUrl;
    }
    
    // Fallback
    return `/textures/${pageId}.jpg`;
  };

  // Helper to get page content
  const getPageContent = (pageId) => {
    // Check if it's a firebase image with content
    const firebaseImg = firebaseImages.find(img => img.id === pageId);
    if (firebaseImg) {
      return {
        title: firebaseImg.title || "Captured Moment",
        eventName: firebaseImg.eventName || "Freshers Day 2025",
        lines: firebaseImg.description ? [firebaseImg.description] : ["A special moment from the event."]
      };
    }
    
    // Fall back to static content
    return pageContentMap[pageId] ?? defaultPageContent;
  };

  const detailContent =
    selectedPage !== null ? getPageContent(selectedPage) : defaultPageContent;
  const pageNumber =
    selectedPage !== null
      ? pages.findIndex(
          (p) => p.front === selectedPage || p.back === selectedPage
        ) + 1
      : null;

  return (
    <>


      {/* Detail View Page */}
      {selectedPage !== null && currentView === "detail" && (
        <div className="fixed inset-0 z-50 bg-gradient-to-br from-purple-900 via-black to-indigo-900">
          {/* Decorative Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '20px 20px'
            }}></div>
          </div>

          {/* Back Button */}
          <div className="fixed top-2 sm:top-4 md:top-8 left-2 sm:left-4 md:left-8 z-[60]">
            <button
              onClick={handleBackToBook}
              className="px-2 py-1.5 sm:px-4 sm:py-2.5 md:px-6 md:py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm md:text-base transition-all duration-300 flex items-center gap-1 sm:gap-2 backdrop-blur-xl border-2 border-white/30 shadow-xl hover:shadow-2xl hover:scale-105"
            >
              <span className="text-lg sm:text-xl md:text-2xl">←</span>
              <span className="hidden xs:block">Back to Book</span>
            </button>
          </div>

          {/* Page Content */}
          <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4 md:p-8">
            <div className="w-full max-w-7xl">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 items-center">
                {/* Image Section */}
                <div className="order-2 lg:order-1 flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 blur-xl sm:blur-2xl md:blur-3xl"></div>
                    <img
                      src={getImageSource(selectedPage)}
                      alt={`Page ${selectedPage}`}
                      className="relative w-full h-auto max-h-[50vh] sm:max-h-[60vh] md:max-h-[70vh] lg:max-h-[80vh] object-contain rounded-lg sm:rounded-xl md:rounded-2xl shadow-xl sm:shadow-2xl border-2 sm:border-4 border-white/20 backdrop-blur-sm"
                    />
                  </div>
                </div>

                {/* Details Section */}
                <div className="order-1 lg:order-2 text-white space-y-3 sm:space-y-4 md:space-y-6">
                  <div className="bg-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border-2 border-white/10 shadow-2xl sm:shadow-2xl space-y-3 sm:space-y-4">
                    <div>
                      {pageNumber && selectedPage !== "book-cover" && selectedPage !== "book-back" && (
                        <p className="text-xs sm:text-sm uppercase tracking-[0.1em] sm:tracking-[0.2em] text-white/60 mb-1 sm:mb-2">
                          Page {pageNumber}
                        </p>
                      )}
                      <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        {detailContent.title}
                      </h2>
                    </div>
                    <p className="text-sm sm:text-base md:text-lg font-semibold text-white/80">
                      {detailContent.eventName}
                    </p>
                    <div className="space-y-1.5 sm:space-y-2 md:space-y-3 text-xs sm:text-sm md:text-base text-white/90">
                      {detailContent.lines.map((line, index) => (
                        <p key={index} className="leading-relaxed">
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Additional Info Card */}
                  <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-xl rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-white/10">
                    <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2 text-purple-300">Page Information</h3>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm md:text-base">
                      <div>
                        <p className="text-white/60 text-[0.6rem] xs:text-xs sm:text-sm">Image ID</p>
                        <p className="font-mono text-white truncate">{selectedPage}</p>
                      </div>
                      <div>
                        <p className="text-white/60 text-[0.6rem] xs:text-xs sm:text-sm">Event</p>
                        <p className="font-semibold text-white truncate">{detailContent.eventName}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className={` pointer-events-none select-none z-10 fixed  inset-0  flex justify-between flex-col ${currentView === "ticket" ? "hidden" : ""}`}>
        <div className="pointer-events-auto mt-2 sm:mt-3 md:mt-10 ml-2 sm:ml-3 md:ml-10">
          <h1 className="text-xl sm:text-2xl md:text-4xl lg:text-6xl font-bold tracking-wider text-white">
            ANEXSA
          </h1>
        </div>
        <div className="w-full overflow-auto pointer-events-auto flex justify-center">
          <div className="overflow-auto flex items-center gap-1 sm:gap-2 md:gap-4 max-w-full p-2 sm:p-4 md:p-10">
            {[...pages].map((_, index) => (
              <button
                key={index}
                className={`border-transparent hover:border-white transition-all duration-300 px-2 sm:px-3 md:px-4 py-1 sm:py-2 md:py-3 rounded-full text-[0.6rem] xs:text-xs sm:text-sm md:text-lg uppercase shrink-0 border ${
                index === page
                  ? "bg-white/90 text-black"
                  : "bg-black/30 text-white"
              }`}
                onClick={() => setPage(index)}
              >
                {index === 0 ? "Cover" : `Page ${index}`}
              </button>
            ))}
            <button
              className={`border-transparent hover:border-white transition-all duration-300 px-2 sm:px-3 md:px-4 py-1 sm:py-2 md:py-3 rounded-full text-[0.6rem] xs:text-xs sm:text-sm md:text-lg uppercase shrink-0 border ${
                page === pages.length
                  ? "bg-white/90 text-black"
                  : "bg-black/30 text-white"
              }`}
              onClick={() => setPage(pages.length)}
            >
              Back Cover
            </button>
          </div>
        </div>
      </main>

      <div className={`fixed inset-0 flex items-center -rotate-2 select-none ${currentView === "ticket" ? "hidden" : ""}`}>
        <div className="relative">
          <div className="bg-white/0  animate-horizontal-scroll flex items-center gap-4 md:gap-8 w-max px-4 md:px-8">
            <h1 className="shrink-0 text-white text-3xl md:text-5xl lg:text-10xl font-black ">
              Welcome to ANEXSA
            </h1>
            <h2 className="shrink-0 text-white text-2xl md:text-4xl lg:text-8xl italic font-light">
              AI-CE Association
            </h2>
            <h2 className="shrink-0 text-white text-4xl md:text-6xl lg:text-12xl font-bold">
              AI-ML
            </h2>
            <h2 className="shrink-0 text-transparent text-4xl md:text-6xl lg:text-12xl font-bold italic outline-text">
              CE
            </h2>
            <h2 className="shrink-0 text-white text-3xl md:text-5xl lg:text-9xl font-medium">
              Welcome to ANEXSA
            </h2>
            <h2 className="shrink-0 text-white text-3xl md:text-5xl lg:text-9xl font-extralight italic">
              AI-CE Association
            </h2>
            <h2 className="shrink-0 text-white text-4xl md:text-6xl lg:text-13xl font-bold">
              AI-ML
            </h2>
            <h2 className="shrink-0 text-transparent text-4xl md:text-6xl lg:text-13xl font-bold italic outline-text">
              CE
            </h2>
          </div>
          <div className="absolute top-0 left-0 bg-white/0 animate-horizontal-scroll-2 flex items-center gap-4 md:gap-8 px-4 md:px-8 w-max">
            <h1 className="shrink-0 text-white text-3xl md:text-5xl lg:text-10xl font-black ">
              AI-CE Association
            </h1>
            <h2 className="shrink-0 text-white text-2xl md:text-4xl lg:text-8xl italic font-light">
              Welcome to ANEXSA
            </h2>
            <h2 className="shrink-0 text-white text-4xl md:text-6xl lg:text-12xl font-bold">
              AI-ML
            </h2>
            <h2 className="shrink-0 text-transparent text-4xl md:text-6xl lg:text-12xl font-bold italic outline-text">
              CE
            </h2>
            <h2 className="shrink-0 text-white text-3xl md:text-5xl lg:text-9xl font-medium">
              AI-CE Association
            </h2>
            <h2 className="shrink-0 text-white text-3xl md:text-5xl lg:text-9xl font-extralight italic">
              Welcome to ANEXSA
            </h2>
            <h2 className="shrink-0 text-white text-4xl md:text-6xl lg:text-13xl font-bold">
              AI-ML
            </h2>
            <h2 className="shrink-0 text-transparent text-4xl md:text-6xl lg:text-13xl font-bold italic outline-text">
              CE
            </h2>
          </div>
        </div>
      </div>
    </>
  );
};


