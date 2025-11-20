import { atom, useAtom } from "jotai";
import { useEffect, useState } from "react";
import jsPDF from "jspdf";

const pictures = [
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14"
];

export const pageAtom = atom(0);
export const selectedPageAtom = atom(null);
export const currentViewAtom = atom("home");
export const isLoggedInAtom = atom(false);
export const userInfoAtom = atom({ name: "", usn: "", branch: "" });
export const hasDownloadedTicketAtom = atom(false);
export const pages = [
  {
    front: "book-cover",
    back: "book-back", // Standard cover
  },
];
// Create pages with images on both front and back
// Page 1 (odd): image 2.jpg on front, image 3.jpg on back
// Page 2 (even): image 4.jpg on front, image 5.jpg on back
// Page 3 (odd): image 6.jpg on front, image 7.jpg on back
// And so on...
for (let i = 1; i < pictures.length - 1; i += 2) {
  if (i + 1 < pictures.length) {
    pages.push({
      front: pictures[i],   // 2, 4, 6, 8, 10, 12
      back: pictures[i + 1], // 3, 5, 7, 9, 11, 13
    });
  }
}
// Last page: image 14 on front, back cover on back
pages.push({
  front: pictures[pictures.length - 1], // 14
  back: "book-back",
});

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
    eventName: "Sports Day",
    lines: [
      "Fresh AIML jerseys revealed ahead of Sports Day celebrations.",
      "Led by the AIML HOD, the launch charged up the teams.",
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
    eventName: "Freshers Day Launch",
    lines: [
      "ANEXSA presents the Freshers Day title reveal poster.",
      "Excitement builds as the campaign is unveiled to the campus.",
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
    title: "Mini AI Car Reveal",
    eventName: "Freshers Day Launch",
    lines: [
      "Innovative mini remote-control car used to introduce the Freshers Day title.",
      "Technology and creativity merge for a memorable reveal moment.",
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
    title: "Hacknex Highlights",
    eventName: "COGNEX Club",
    lines: [
      "Cognex Club's Hacknex program brings innovators under one roof.",
      "Hands-on workshops encouraged quick prototyping and teamwork.",
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
};

const getPageContent = (pageId) => pageContentMap[pageId] ?? defaultPageContent;

export const UI = () => {
  const [page, setPage] = useAtom(pageAtom);
  const [selectedPage, setSelectedPage] = useAtom(selectedPageAtom);
  const [currentView, setCurrentView] = useAtom(currentViewAtom);
  const [foodPreference, setFoodPreference] = useState("veg");
  const [isLoggedIn, setIsLoggedIn] = useAtom(isLoggedInAtom);
  const [userInfo, setUserInfo] = useAtom(userInfoAtom);
  const [hasDownloadedTicket, setHasDownloadedTicket] = useAtom(hasDownloadedTicketAtom);
  
  // Login form state
  const [loginName, setLoginName] = useState("");
  const [loginUSN, setLoginUSN] = useState("");
  const [loginBranch, setLoginBranch] = useState("");

  useEffect(() => {
    const audio = new Audio("/audios/page-flip-01a.mp3");
    audio.play();
  }, [page]);

  const closePageView = () => {
    setSelectedPage(null);
    setCurrentView("home");
  };

  const handleBackToBook = () => {
    setSelectedPage(null);
    setCurrentView("home");
  };

  const handleLogin = () => {
    if (!loginName || !loginUSN || !loginBranch) {
      alert("Please fill in all fields");
      return;
    }
    
    // Check if user has already logged in before
    const usedCredentials = localStorage.getItem('anexsa_used_credentials');
    const credentials = usedCredentials ? JSON.parse(usedCredentials) : [];
    
    // Check if this USN and name combination has been used before
    const isDuplicate = credentials.some(cred => 
      cred.usn === loginUSN && cred.name === loginName
    );
    
    if (isDuplicate) {
      alert("This USN and Name combination has already been used. You cannot log in again.");
      return;
    }
    
    // Store user info and mark as logged in
    setUserInfo({ name: loginName, usn: loginUSN, branch: loginBranch });
    setIsLoggedIn(true);
    
    // Store login state in localStorage to prevent re-login
    localStorage.setItem('anexsa_logged_in', 'true');
    localStorage.setItem('anexsa_user_info', JSON.stringify({ name: loginName, usn: loginUSN, branch: loginBranch }));
    
    // Add credentials to used credentials list
    const newCredentials = [...credentials, { name: loginName, usn: loginUSN, branch: loginBranch }];
    localStorage.setItem('anexsa_used_credentials', JSON.stringify(newCredentials));
  };

  // Check if user is already logged in on component mount
  useEffect(() => {
    const isAlreadyLoggedIn = localStorage.getItem('anexsa_logged_in');
    const savedUserInfo = localStorage.getItem('anexsa_user_info');
    const ticketDownloaded = localStorage.getItem('anexsa_ticket_downloaded');
    
    if (isAlreadyLoggedIn === 'true' && savedUserInfo) {
      const parsedUserInfo = JSON.parse(savedUserInfo);
      setUserInfo(parsedUserInfo);
      setIsLoggedIn(true);
    }
    
    if (ticketDownloaded === 'true') {
      setHasDownloadedTicket(true);
    }
  }, [setUserInfo, setIsLoggedIn, setHasDownloadedTicket]);

  const downloadTicket = () => {
    if (!userInfo.name || !userInfo.usn) {
      alert("User information is missing");
      return;
    }

    if (hasDownloadedTicket) {
      alert("You have already downloaded your ticket!");
      return;
    }

    // Create PDF
    const doc = new jsPDF();
    
    // Set colors and fonts
    doc.setFillColor(139, 69, 19); // Brown color for header
    doc.rect(0, 0, 210, 40, 'F');
    
    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont(undefined, 'bold');
    doc.text('FRESHERS DAY 2025', 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'normal');
    doc.text('Presented By: ANEXSA', 105, 32, { align: 'center' });
    
    // Reset text color for body
    doc.setTextColor(0, 0, 0);
    
    // Welcome Message Box
    let yPos = 55;
    doc.setFillColor(240, 230, 255); // Light purple background
    doc.rect(15, yPos, 180, 35, 'F');
    doc.setDrawColor(139, 69, 19);
    doc.rect(15, yPos, 180, 35, 'S');
    
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text(`Welcome, ${userInfo.name}!`, 105, yPos + 10, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const welcomeText = "We're thrilled to have you join us for an unforgettable";
    const welcomeText2 = "celebration filled with exciting performances and fun activities!";
    doc.text(welcomeText, 105, yPos + 20, { align: 'center' });
    doc.text(welcomeText2, 105, yPos + 27, { align: 'center' });
    
    // Ticket details
    yPos = 105;
    
    // Name
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Name:', 20, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(userInfo.name, 50, yPos);
    
    // USN
    yPos += 15;
    doc.setFont(undefined, 'bold');
    doc.text('USN:', 20, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(userInfo.usn, 50, yPos);
    
    // Branch
    yPos += 15;
    doc.setFont(undefined, 'bold');
    doc.text('Branch:', 20, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(userInfo.branch, 50, yPos);
    
    // Ticket ID
    yPos += 25;
    doc.setFillColor(240, 240, 240);
    doc.rect(15, yPos - 5, 180, 20, 'F');
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Ticket ID:', 20, yPos + 5);
    doc.setFont(undefined, 'normal');
    doc.text(`ANEXSA-2025-${userInfo.usn}`, 105, yPos + 5, { align: 'center' });
    
    // Footer
    yPos += 40;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Please present this ticket at the event entrance.', 105, yPos, { align: 'center' });
    doc.text('Thank you for registering!', 105, yPos + 7, { align: 'center' });
    
    // Save PDF
    doc.save(`FreshersDay_Ticket_${userInfo.name.replace(/\s+/g, '_')}_${userInfo.usn}.pdf`);
    
    // Mark ticket as downloaded
    setHasDownloadedTicket(true);
    localStorage.setItem('anexsa_ticket_downloaded', 'true');
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
      {/* Login Page */}
      {!isLoggedIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Scrolling Background Text */}
          <div className="fixed inset-0 flex items-center -rotate-2 select-none opacity-20">
            <div className="relative">
              <div className="bg-white/0 animate-horizontal-scroll flex items-center gap-4 md:gap-8 w-max px-4 md:px-8">
                <h1 className="shrink-0 text-white text-4xl md:text-6xl lg:text-10xl font-black">Get Ready for Freshers Day</h1>
                <h2 className="shrink-0 text-white text-3xl md:text-5xl lg:text-8xl italic font-light">Get Ready for Freshers Day</h2>
                <h2 className="shrink-0 text-white text-5xl md:text-7xl lg:text-12xl font-bold">Get Ready for Freshers Day</h2>
              </div>
              <div className="absolute top-0 left-0 bg-white/0 animate-horizontal-scroll-2 flex items-center gap-4 md:gap-8 px-4 md:px-8 w-max">
                <h1 className="shrink-0 text-white text-4xl md:text-6xl lg:text-10xl font-black">Get Ready for Freshers Day</h1>
                <h2 className="shrink-0 text-white text-3xl md:text-5xl lg:text-8xl italic font-light">Get Ready for Freshers Day</h2>
                <h2 className="shrink-0 text-white text-5xl md:text-7xl lg:text-12xl font-bold">Get Ready for Freshers Day</h2>
              </div>
            </div>
          </div>

          {/* Login Form */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 md:p-10 max-w-md w-full mx-4 border-2 border-white/20 shadow-2xl z-10">
            <div className="text-center mb-4 sm:mb-6 md:mb-8">
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-1 sm:mb-2">ANEXSA</h1>
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-white/90">Freshers Day 2025</h2>
              <p className="text-white/70 mt-1 sm:mt-2 text-xs sm:text-sm md:text-base">Please login to continue</p>
            </div>

            <div className="space-y-3 sm:space-y-4 md:space-y-5">
              <div>
                <label className="block text-white text-xs sm:text-sm font-semibold mb-1 md:mb-2">Name</label>
                <input
                  type="text"
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-3 text-xs sm:text-sm md:text-base rounded-lg bg-white/20 text-white placeholder-gray-300 border border-white/30 focus:outline-none focus:border-white/60 focus:ring-2 focus:ring-white/20"
                />
              </div>

              <div>
                <label className="block text-white text-xs sm:text-sm font-semibold mb-1 md:mb-2">USN</label>
                <input
                  type="text"
                  value={loginUSN}
                  onChange={(e) => setLoginUSN(e.target.value)}
                  placeholder="Enter your USN"
                  className="w-full px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-3 text-xs sm:text-sm md:text-base rounded-lg bg-white/20 text-white placeholder-gray-300 border border-white/30 focus:outline-none focus:border-white/60 focus:ring-2 focus:ring-white/20"
                />
              </div>

              <div>
                <label className="block text-white text-xs sm:text-sm font-semibold mb-1 md:mb-2">Branch</label>
                <select
                  value={loginBranch}
                  onChange={(e) => setLoginBranch(e.target.value)}
                  className="w-full px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-3 text-xs sm:text-sm md:text-base rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:border-white/60 focus:ring-2 focus:ring-white/20"
                  style={{ color: loginBranch ? 'white' : '#9ca3af' }}
                >
                  <option value="" style={{ color: '#000' }}>Select your branch</option>
                  <option value="AIML" style={{ color: '#000' }}>AIML - AI & ML</option>
                  <option value="CE" style={{ color: '#000' }}>CE - Computer Engineering</option>
                </select>
              </div>

              <button
                onClick={handleLogin}
                className="w-full py-2 sm:py-2.5 md:py-3 mt-3 sm:mt-4 md:mt-6 text-sm sm:text-base md:text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Only shown after login */}
      {isLoggedIn && (
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
                      src={`/textures/${selectedPage}.jpg`}
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

      {/* Navigation Buttons */}
      <div className="fixed top-2 sm:top-3 md:top-10 right-2 sm:right-3 md:right-10 z-20 flex gap-1 sm:gap-2 md:gap-4">
        <button
          onClick={() => setCurrentView("home")}
          className={`px-2 sm:px-4 md:px-6 py-1 sm:py-1.5 md:py-3 rounded-md sm:rounded-lg md:rounded-xl font-bold text-[0.6rem] xs:text-xs sm:text-sm md:text-lg transition-all duration-300 ${
            currentView === "home"
              ? "bg-white text-black shadow-lg"
              : "bg-black/50 text-white hover:bg-white/20 border border-white/30"
          }`}
        >
          Home
        </button>
        <button
          onClick={() => setCurrentView("ticket")}
          className={`px-2 sm:px-4 md:px-6 py-1 sm:py-1.5 md:py-3 rounded-md sm:rounded-lg md:rounded-xl font-bold text-[0.6rem] xs:text-xs sm:text-sm md:text-lg transition-all duration-300 ${
            currentView === "ticket"
              ? "bg-white text-black shadow-lg"
              : "bg-black/50 text-white hover:bg-white/20 border border-white/30"
          }`}
        >
          Ticket
        </button>
      </div>

      {/* Ticket View */}
      {currentView === "ticket" && (
        <div className="fixed inset-0 z-40">
          {/* Scrolling Background Text */}
          <div className="fixed inset-0 flex items-center -rotate-2 select-none">
            <div className="relative">
              <div className="bg-white/0 animate-horizontal-scroll flex items-center gap-4 md:gap-8 w-max px-4 md:px-8">
                <h1 className="shrink-0 text-white text-3xl md:text-5xl lg:text-10xl font-black ">
                  Get Ready for Freshers Day
                </h1>
                <h2 className="shrink-0 text-white text-2xl md:text-4xl lg:text-8xl italic font-light">
                  Get Ready for Freshers Day
                </h2>
                <h2 className="shrink-0 text-white text-4xl md:text-6xl lg:text-12xl font-bold">
                  Get Ready for Freshers Day
                </h2>
                <h2 className="shrink-0 text-transparent text-4xl md:text-6xl lg:text-12xl font-bold italic outline-text">
                  Get Ready for Freshers Day
                </h2>
                <h2 className="shrink-0 text-white text-3xl md:text-5xl lg:text-9xl font-medium">
                  Get Ready for Freshers Day
                </h2>
                <h2 className="shrink-0 text-white text-3xl md:text-5xl lg:text-9xl font-extralight italic">
                  Get Ready for Freshers Day
                </h2>
                <h2 className="shrink-0 text-white text-4xl md:text-6xl lg:text-13xl font-bold">
                  Get Ready for Freshers Day
                </h2>
                <h2 className="shrink-0 text-transparent text-4xl md:text-6xl lg:text-13xl font-bold outline-text italic">
                  Get Ready for Freshers Day
                </h2>
              </div>
              <div className="absolute top-0 left-0 bg-white/0 animate-horizontal-scroll-2 flex items-center gap-4 md:gap-8 px-4 md:px-8 w-max">
                <h1 className="shrink-0 text-white text-3xl md:text-5xl lg:text-10xl font-black ">
                  Get Ready for Freshers Day
                </h1>
                <h2 className="shrink-0 text-white text-2xl md:text-4xl lg:text-8xl italic font-light">
                  Get Ready for Freshers Day
                </h2>
                <h2 className="shrink-0 text-white text-4xl md:text-6xl lg:text-12xl font-bold">
                  Get Ready for Freshers Day
                </h2>
                <h2 className="shrink-0 text-transparent text-4xl md:text-6xl lg:text-12xl font-bold italic outline-text">
                  Get Ready for Freshers Day
                </h2>
                <h2 className="shrink-0 text-white text-3xl md:text-5xl lg:text-9xl font-medium">
                  Get Ready for Freshers Day
                </h2>
                <h2 className="shrink-0 text-white text-3xl md:text-5xl lg:text-9xl font-extralight italic">
                  Get Ready for Freshers Day
                </h2>
                <h2 className="shrink-0 text-white text-4xl md:text-6xl lg:text-13xl font-bold">
                  Get Ready for Freshers Day
                </h2>
                <h2 className="shrink-0 text-transparent text-4xl md:text-6xl lg:text-13xl font-bold outline-text italic">
                  Get Ready for Freshers Day
                </h2>
              </div>
            </div>
          </div>

          {/* ANEXSA Logo on Ticket Page */}
          <div className="fixed top-2 sm:top-3 md:top-10 left-2 sm:left-3 md:left-10 z-50">
            <h1 className="text-xl sm:text-2xl md:text-4xl lg:text-6xl font-bold tracking-wider text-white">
              ANEXSA
            </h1>
          </div>

          {/* Navigation Buttons on Ticket Page */}
          <div className="fixed top-2 sm:top-3 md:top-10 right-2 sm:right-3 md:right-10 z-50 flex gap-1 sm:gap-2 md:gap-4">
            <button
              onClick={() => setCurrentView("home")}
              className={`px-2 sm:px-4 md:px-6 py-1 sm:py-1.5 md:py-3 rounded-md sm:rounded-lg md:rounded-xl font-bold text-[0.6rem] xs:text-xs sm:text-sm md:text-lg transition-all duration-300 ${
                currentView === "home"
                  ? "bg-white text-black shadow-lg"
                  : "bg-black/50 text-white hover:bg-white/20 border border-white/30"
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setCurrentView("ticket")}
              className={`px-2 sm:px-4 md:px-6 py-1 sm:py-1.5 md:py-3 rounded-md sm:rounded-lg md:rounded-xl font-bold text-[0.6rem] xs:text-xs sm:text-sm md:text-lg transition-all duration-300 ${
                currentView === "ticket"
                  ? "bg-white text-black shadow-lg"
                  : "bg-black/50 text-white hover:bg-white/20 border border-white/30"
              }`}
            >
              Ticket
            </button>
          </div>

          {/* Ticket Content */}
          <div className="fixed inset-0 z-45 flex items-center justify-center p-2 pt-8 sm:p-4 sm:pt-12 md:p-8 md:pt-24">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 lg:p-8 max-w-md sm:max-w-lg md:max-w-2xl w-full border-2 border-white/20 shadow-2xl overflow-y-auto max-h-[calc(100vh-60px)] sm:max-h-[calc(100vh-80px)] md:max-h-[calc(100vh-100px)] lg:max-h-[calc(100vh-120px)] mt-2 sm:mt-3 md:mt-4">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4 md:mb-6 text-center">Event Ticket</h2>
            
              {/* User Information */}
              <div className="space-y-2 sm:space-y-3 md:space-y-4 mb-3 sm:mb-4 md:mb-6">
                <div>
                  <label className="block text-white text-[0.6rem] xs:text-xs sm:text-sm font-semibold mb-1">Name</label>
                  <input
                    type="text"
                    value={userInfo.name}
                    readOnly
                    className="w-full px-2 py-1 sm:px-3 sm:py-2 md:px-4 md:py-2 text-xs sm:text-sm md:text-base rounded-lg bg-white/10 text-white border border-white/30 cursor-not-allowed opacity-75"
                  />
                </div>
                <div>
                  <label className="block text-white text-[0.6rem] xs:text-xs sm:text-sm font-semibold mb-1">USN</label>
                  <input
                    type="text"
                    value={userInfo.usn}
                    readOnly
                    className="w-full px-2 py-1 sm:px-3 sm:py-2 md:px-4 md:py-2 text-xs sm:text-sm md:text-base rounded-lg bg-white/10 text-white border border-white/30 cursor-not-allowed opacity-75"
                  />
                </div>
                <div>
                  <label className="block text-white text-[0.6rem] xs:text-xs sm:text-sm font-semibold mb-1">Branch</label>
                  <input
                    type="text"
                    value={userInfo.branch}
                    readOnly
                    className="w-full px-2 py-1 sm:px-3 sm:py-2 md:px-4 md:py-2 text-xs sm:text-sm md:text-base rounded-lg bg-white/10 text-white border border-white/30 cursor-not-allowed opacity-75"
                  />
                </div>
              </div>

              {/* Event Details */}
              <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 mb-3 sm:mb-4 md:mb-6 border border-white/10">
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-2 sm:mb-3 md:mb-4 text-center">Event Information</h3>
                <div className="space-y-1.5 sm:space-y-2 md:space-y-3 text-white">
                  <div className="flex justify-between items-center border-b border-white/20 pb-1 sm:pb-2">
                    <p className="text-gray-300 text-[0.6rem] xs:text-xs sm:text-sm">Event Name</p>
                    <p className="text-xs sm:text-sm md:text-base font-bold">Freshers Day 2025</p>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/20 pb-1 sm:pb-2">
                    <p className="text-gray-300 text-[0.6rem] xs:text-xs sm:text-sm">Presented By</p>
                    <p className="text-xs sm:text-sm md:text-base font-bold">ANEXSA</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-gray-300 text-[0.6rem] xs:text-xs sm:text-sm">Ticket ID</p>
                    <p className="text-[0.6rem] xs:text-xs sm:text-sm font-mono text-purple-300 truncate">ANEXSA-2025-{userInfo.usn}</p>
                  </div>
                </div>
              </div>

              {/* Download Button */}
              <button
                onClick={downloadTicket}
                disabled={hasDownloadedTicket}
                className={`w-full py-2 sm:py-2.5 md:py-3 text-white font-bold text-sm sm:text-base md:text-lg rounded-lg sm:rounded-xl transition-all duration-300 shadow-lg ${
                  hasDownloadedTicket
                    ? "bg-gray-600 cursor-not-allowed opacity-50"
                    : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 hover:shadow-xl hover:scale-105"
                }`}
              >
                {hasDownloadedTicket ? "✓ Ticket Downloaded" : "Download Ticket PDF"}
              </button>
            
              <p className="text-white/60 text-[0.6rem] xs:text-xs sm:text-sm text-center mt-2 sm:mt-3 md:mt-4">
                Please present this ticket at the event entrance.
              </p>
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
              Get Ready for Freshers Day
            </h1>
            <h2 className="shrink-0 text-white text-2xl md:text-4xl lg:text-8xl italic font-light">
              Get Ready for Freshers Day
            </h2>
            <h2 className="shrink-0 text-white text-4xl md:text-6xl lg:text-12xl font-bold">
              Get Ready for Freshers Day
            </h2>
            <h2 className="shrink-0 text-transparent text-4xl md:text-6xl lg:text-12xl font-bold italic outline-text">
              Get Ready for Freshers Day
            </h2>
            <h2 className="shrink-0 text-white text-3xl md:text-5xl lg:text-9xl font-medium">
              Get Ready for Freshers Day
            </h2>
            <h2 className="shrink-0 text-white text-3xl md:text-5xl lg:text-9xl font-extralight italic">
              Get Ready for Freshers Day
            </h2>
            <h2 className="shrink-0 text-white text-4xl md:text-6xl lg:text-13xl font-bold">
              Get Ready for Freshers Day
            </h2>
            <h2 className="shrink-0 text-transparent text-4xl md:text-6xl lg:text-13xl font-bold outline-text italic">
              Get Ready for Freshers Day
            </h2>
          </div>
          <div className="absolute top-0 left-0 bg-white/0 animate-horizontal-scroll-2 flex items-center gap-4 md:gap-8 px-4 md:px-8 w-max">
            <h1 className="shrink-0 text-white text-3xl md:text-5xl lg:text-10xl font-black ">
              Get Ready for Freshers Day
            </h1>
            <h2 className="shrink-0 text-white text-2xl md:text-4xl lg:text-8xl italic font-light">
              Get Ready for Freshers Day
            </h2>
            <h2 className="shrink-0 text-white text-4xl md:text-6xl lg:text-12xl font-bold">
              Get Ready for Freshers Day
            </h2>
            <h2 className="shrink-0 text-transparent text-4xl md:text-6xl lg:text-12xl font-bold italic outline-text">
              Get Ready for Freshers Day
            </h2>
            <h2 className="shrink-0 text-white text-3xl md:text-5xl lg:text-9xl font-medium">
              Get Ready for Freshers Day
            </h2>
            <h2 className="shrink-0 text-white text-3xl md:text-5xl lg:text-9xl font-extralight italic">
              Get Ready for Freshers Day
            </h2>
            <h2 className="shrink-0 text-white text-4xl md:text-6xl lg:text-13xl font-bold">
              Get Ready for Freshers Day
            </h2>
            <h2 className="shrink-0 text-transparent text-4xl md:text-6xl lg:text-13xl font-bold outline-text italic">
              Get Ready for Freshers Day
            </h2>
          </div>
        </div>
      </div>
      </>
      )}
    </>
  );
};
