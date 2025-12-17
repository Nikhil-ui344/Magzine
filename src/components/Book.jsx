import { useCursor, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useAtom } from "jotai";
import { easing } from "maath";
import { useEffect, useMemo, useRef, useState, Component } from "react";
import {
  Bone,
  BoxGeometry,
  Color,
  Float32BufferAttribute,
  MathUtils,
  MeshStandardMaterial,
  Skeleton,
  SkinnedMesh,
  SRGBColorSpace,
  Uint16BufferAttribute,
  Vector3,
} from "three";
import { degToRad } from "three/src/math/MathUtils.js";
import { pageAtom, selectedPageAtom, currentViewAtom } from "./UI";
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { fallbackImage } from '../utils/fallbackImage';

// Base pictures - these will ALWAYS load from your local textures folder
const basePictures = [
  "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22"
];

// Error Boundary for Texture Loading
class TextureErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Texture loading error caught:", error);
  }

  render() {
    if (this.state.hasError) {
      // Render a fallback page (simple white page)
      return this.props.fallback;
    }

    return this.props.children;
  }
}



// Helper function to check if a texture exists
const checkTextureExists = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
};

// Helper function to get the correct texture URL with proper extension
const getTextureUrl = async (baseName) => {
  // Try .jpg first
  const jpgUrl = `/textures/${baseName}.jpg`;
  if (await checkTextureExists(jpgUrl)) {
    return jpgUrl;
  }
  
  // Try .jpeg if .jpg doesn't exist
  const jpegUrl = `/textures/${baseName}.jpeg`;
  if (await checkTextureExists(jpegUrl)) {
    return jpegUrl;
  }
  
  // Return .jpg as fallback
  return jpgUrl;
};

const easingFactor = 0.5; // Controls the speed of the easing
const easingFactorFold = 0.3; // Controls the speed of the easing
const insideCurveStrength = 0.18; // Controls the strength of the curve
const outsideCurveStrength = 0.05; // Controls the strength of the curve
const turningCurveStrength = 0.09; // Controls the strength of the curve

const PAGE_WIDTH = 1.28;
const PAGE_HEIGHT = 1.71; // 4:3 aspect ratio
const PAGE_DEPTH = 0.003;
const PAGE_SEGMENTS = 30;
const SEGMENT_WIDTH = PAGE_WIDTH / PAGE_SEGMENTS;

const pageGeometry = new BoxGeometry(
  PAGE_WIDTH,
  PAGE_HEIGHT,
  PAGE_DEPTH,
  PAGE_SEGMENTS,
  2
);

pageGeometry.translate(PAGE_WIDTH / 2, 0, 0);

const position = pageGeometry.attributes.position;
const vertex = new Vector3();
const skinIndexes = [];
const skinWeights = [];

for (let i = 0; i < position.count; i++) {
  // ALL VERTICES
  vertex.fromBufferAttribute(position, i); // get the vertex
  const x = vertex.x; // get the x position of the vertex

  const skinIndex = Math.max(0, Math.floor(x / SEGMENT_WIDTH)); // calculate the skin index
  let skinWeight = (x % SEGMENT_WIDTH) / SEGMENT_WIDTH; // calculate the skin weight

  skinIndexes.push(skinIndex, skinIndex + 1, 0, 0); // set the skin indexes
  skinWeights.push(1 - skinWeight, skinWeight, 0, 0); // set the skin weights
}

pageGeometry.setAttribute(
  "skinIndex",
  new Uint16BufferAttribute(skinIndexes, 4)
);
pageGeometry.setAttribute(
  "skinWeight",
  new Float32BufferAttribute(skinWeights, 4)
);

const whiteColor = new Color("white");
const emissiveColor = new Color("orange");

const pageMaterials = [
  new MeshStandardMaterial({
    color: whiteColor,
  }),
  new MeshStandardMaterial({
    color: "#111",
  }),
  new MeshStandardMaterial({
    color: whiteColor,
  }),
  new MeshStandardMaterial({
    color: whiteColor,
  }),
];

// Helper function to get the correct texture path for preloading
const getPreloadTexturePath = (imageName, firebaseImages) => {
  if (!imageName) return fallbackImage;
  if (imageName === "book-cover") return "/textures/book-cover.png";
  if (imageName === "book-back") return "/textures/book-back.jpg";

  // Check if it's a local base picture
  if (basePictures.includes(imageName)) {
    return `/textures/${imageName}.jpg`;
  }

  // Check if it's an admin uploaded image (Firebase) - Check props first
  if (firebaseImages) {
    const adminImage = firebaseImages.find(img => img.id === imageName);
    if (adminImage) {
      if (adminImage.imageUrl) return adminImage.imageUrl;
      if (adminImage.dataUrl) return adminImage.dataUrl;
    }
  }

  // Fallback to localStorage
  const adminImages = localStorage.getItem('admin_uploaded_images');
  if (adminImages) {
    try {
      const parsedImages = JSON.parse(adminImages);
      const adminImage = parsedImages.find(img => img && img.id === imageName);
      if (adminImage) {
        if (adminImage.imageUrl) return adminImage.imageUrl;
        if (adminImage.dataUrl) return adminImage.dataUrl;
      }
    } catch (e) {
      // ignore
    }
  }

  // If we still haven't found it, and it's not a base picture, return fallback
  // This prevents 404s on new images that haven't loaded yet
  return fallbackImage;
};

// Fallback Page Component that doesn't use textures
const FallbackPage = ({ number, page, opened, bookClosed, totalPages, ...props }) => {
  const group = useRef();
  const turnedAt = useRef(0);
  const lastOpened = useRef(opened);
  const skinnedMeshRef = useRef();

  const manualSkinnedMesh = useMemo(() => {
    const bones = [];
    for (let i = 0; i <= PAGE_SEGMENTS; i++) {
      let bone = new Bone();
      bones.push(bone);
      if (i === 0) {
        bone.position.x = 0;
      } else {
        bone.position.x = SEGMENT_WIDTH;
      }
      if (i > 0) {
        bones[i - 1].add(bone);
      }
    }
    const skeleton = new Skeleton(bones);

    const materials = [
      ...pageMaterials,
      new MeshStandardMaterial({
        color: "#663399", // Purple fallback color
        roughness: 0.1,
        metalness: 0,
        emissive: emissiveColor,
        emissiveIntensity: 0,
      }),
      new MeshStandardMaterial({
        color: "#663399", // Purple fallback color
        roughness: 0.1,
        metalness: 0,
        emissive: emissiveColor,
        emissiveIntensity: 0,
      }),
    ];
    const mesh = new SkinnedMesh(pageGeometry, materials);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    mesh.add(skeleton.bones[0]);
    mesh.bind(skeleton);
    return mesh;
  }, []);

  useFrame((_, delta) => {
    if (!skinnedMeshRef.current) {
      return;
    }

    const emissiveIntensity = highlighted ? 0.22 : 0;
    skinnedMeshRef.current.material[4].emissiveIntensity =
      skinnedMeshRef.current.material[5].emissiveIntensity = MathUtils.lerp(
        skinnedMeshRef.current.material[4].emissiveIntensity,
        emissiveIntensity,
        0.1
      );

    if (lastOpened.current !== opened) {
      turnedAt.current = +new Date();
      lastOpened.current = opened;
    }
    let turningTime = Math.min(400, new Date() - turnedAt.current) / 400;
    turningTime = Math.sin(turningTime * Math.PI);

    let targetRotation = opened ? -Math.PI / 2 : Math.PI / 2;
    if (!bookClosed) {
      targetRotation += degToRad(number * 0.8);
    }

    const bones = skinnedMeshRef.current.skeleton.bones;
    for (let i = 0; i < bones.length; i++) {
      const target = i === 0 ? group.current : bones[i];

      const insideCurveIntensity = i < 8 ? Math.sin(i * 0.2 + 0.25) : 0;
      const outsideCurveIntensity = i >= 8 ? Math.cos(i * 0.3 + 0.09) : 0;
      const turningIntensity =
        Math.sin(i * Math.PI * (1 / bones.length)) * turningTime;
      let rotationAngle =
        insideCurveStrength * insideCurveIntensity * targetRotation -
        outsideCurveStrength * outsideCurveIntensity * targetRotation +
        turningCurveStrength * turningIntensity * targetRotation;
      let foldRotationAngle = degToRad(Math.sign(targetRotation) * 2);
      if (bookClosed) {
        if (i === 0) {
          rotationAngle = targetRotation;
          foldRotationAngle = 0;
        } else {
          rotationAngle = 0;
          foldRotationAngle = 0;
        }
      }
      easing.dampAngle(
        target.rotation,
        "y",
        rotationAngle,
        easingFactor,
        delta
      );

      const foldIntensity =
        i > 8
          ? Math.sin(i * Math.PI * (1 / bones.length) - 0.5) * turningTime
          : 0;
      easing.dampAngle(
        target.rotation,
        "x",
        foldRotationAngle * foldIntensity,
        easingFactorFold,
        delta
      );
    }
  });

  const [_, setPage] = useAtom(pageAtom);
  const [highlighted, setHighlighted] = useState(false);
  useCursor(highlighted);

  const handlePageClick = (e) => {
    e.stopPropagation();
    if (opened) {
      setPage(page - 1);
    } else {
      setPage(page + 1);
    }
  };

  return (
    <group
      {...props}
      ref={group}
      onPointerEnter={(e) => {
        e.stopPropagation();
        setHighlighted(true);
      }}
      onPointerLeave={(e) => {
        e.stopPropagation();
        setHighlighted(false);
      }}
      onClick={handlePageClick}
    >
      <primitive
        object={manualSkinnedMesh}
        ref={skinnedMeshRef}
        position-z={-number * PAGE_DEPTH + page * PAGE_DEPTH}
      />
    </group>
  );
};

const Page = ({ number, front, back, page, opened, bookClosed, totalPages, firebaseImages, ...props }) => {
  // Load textures - for covers use book-cover.png, for inner pages use their textures
  // Handle different image extensions (.jpg vs .jpeg) and admin uploaded images
  const getTexturePath = (imageName) => {
    if (!imageName) {
      return fallbackImage; // Fallback to first image if undefined
    }
    if (imageName === "book-cover") return "/textures/book-cover.png";
    if (imageName === "book-back") return "/textures/book-back.jpg";
    
    // Check if it's a local base picture
    if (basePictures.includes(imageName)) {
      return `/textures/${imageName}.jpg`;
    }

    // Check firebase images prop first (Real-time)
    if (firebaseImages) {
      const adminImage = firebaseImages.find(img => img.id === imageName);
      if (adminImage) {
        if (adminImage.imageUrl) return adminImage.imageUrl;
        if (adminImage.dataUrl) return adminImage.dataUrl;
      }
    }
    
    // Check if it's an admin uploaded image (Firebase) - Fallback to localStorage
    const adminImages = localStorage.getItem('admin_uploaded_images');
    if (adminImages) {
      try {
        const parsedImages = JSON.parse(adminImages);
        const adminImage = parsedImages.find(img => img && img.id === imageName);
        if (adminImage) {
          // Prefer Firebase URL over local dataUrl
          if (adminImage.imageUrl) {
            return adminImage.imageUrl; // Firebase Storage URL
          } else if (adminImage.dataUrl) {
            return adminImage.dataUrl; // Local base64 backup
          }
        }
      } catch (e) {
        console.warn('Error parsing admin images:', e);
      }
    }
    
    // If not found in any list, return fallback instead of broken link
    return fallbackImage;
  };

  const textures = (number === 0 || number === totalPages - 1) ? [
    `/textures/book-cover.png`,
    `/textures/book-cover.png`,
  ] : [
    getTexturePath(front),
    getTexturePath(back),
  ];
  
  const [picture, picture2] = useTexture(textures);
  picture.colorSpace = picture2.colorSpace = SRGBColorSpace;
  const group = useRef();
  const turnedAt = useRef(0);
  const lastOpened = useRef(opened);

  const skinnedMeshRef = useRef();

  const manualSkinnedMesh = useMemo(() => {
    const bones = [];
    for (let i = 0; i <= PAGE_SEGMENTS; i++) {
      let bone = new Bone();
      bones.push(bone);
      if (i === 0) {
        bone.position.x = 0;
      } else {
        bone.position.x = SEGMENT_WIDTH;
      }
      if (i > 0) {
        bones[i - 1].add(bone); // attach the new bone to the previous bone
      }
    }
    const skeleton = new Skeleton(bones);

    const materials = [
      ...pageMaterials,
      new MeshStandardMaterial({
        color: whiteColor,
        map: picture,
        roughness: number === 0 || number === totalPages - 1 ? 0.15 : 0.1,
        metalness: 0,
        emissive: emissiveColor,
        emissiveIntensity: 0,
      }),
      new MeshStandardMaterial({
        color: whiteColor,
        map: picture2,
        roughness: number === 0 || number === totalPages - 1 ? 0.15 : 0.1,
        metalness: 0,
        emissive: emissiveColor,
        emissiveIntensity: 0,
      }),
    ];
    const mesh = new SkinnedMesh(pageGeometry, materials);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    mesh.add(skeleton.bones[0]);
    mesh.bind(skeleton);
    return mesh;
  }, []);

  // Update materials when textures change
  useEffect(() => {
    if (skinnedMeshRef.current) {
      skinnedMeshRef.current.material[4].map = picture;
      skinnedMeshRef.current.material[5].map = picture2;
      skinnedMeshRef.current.material[4].needsUpdate = true;
      skinnedMeshRef.current.material[5].needsUpdate = true;
    }
  }, [picture, picture2]);

  useFrame((_, delta) => {
    if (!skinnedMeshRef.current) {
      return;
    }

    const emissiveIntensity = highlighted ? 0.22 : 0;
    skinnedMeshRef.current.material[4].emissiveIntensity =
      skinnedMeshRef.current.material[5].emissiveIntensity = MathUtils.lerp(
        skinnedMeshRef.current.material[4].emissiveIntensity,
        emissiveIntensity,
        0.1
      );

    if (lastOpened.current !== opened) {
      turnedAt.current = +new Date();
      lastOpened.current = opened;
    }
    let turningTime = Math.min(400, new Date() - turnedAt.current) / 400;
    turningTime = Math.sin(turningTime * Math.PI);

    let targetRotation = opened ? -Math.PI / 2 : Math.PI / 2;
    if (!bookClosed) {
      targetRotation += degToRad(number * 0.8);
    }

    const bones = skinnedMeshRef.current.skeleton.bones;
    for (let i = 0; i < bones.length; i++) {
      const target = i === 0 ? group.current : bones[i];

      const insideCurveIntensity = i < 8 ? Math.sin(i * 0.2 + 0.25) : 0;
      const outsideCurveIntensity = i >= 8 ? Math.cos(i * 0.3 + 0.09) : 0;
      const turningIntensity =
        Math.sin(i * Math.PI * (1 / bones.length)) * turningTime;
      let rotationAngle =
        insideCurveStrength * insideCurveIntensity * targetRotation -
        outsideCurveStrength * outsideCurveIntensity * targetRotation +
        turningCurveStrength * turningIntensity * targetRotation;
      let foldRotationAngle = degToRad(Math.sign(targetRotation) * 2);
      if (bookClosed) {
        if (i === 0) {
          rotationAngle = targetRotation;
          foldRotationAngle = 0;
        } else {
          rotationAngle = 0;
          foldRotationAngle = 0;
        }
      }
      easing.dampAngle(
        target.rotation,
        "y",
        rotationAngle,
        easingFactor,
        delta
      );

      const foldIntensity =
        i > 8
          ? Math.sin(i * Math.PI * (1 / bones.length) - 0.5) * turningTime
          : 0;
      easing.dampAngle(
        target.rotation,
        "x",
        foldRotationAngle * foldIntensity,
        easingFactorFold,
        delta
      );
    }
  });

  const [_, setPage] = useAtom(pageAtom);
  const [selectedPage, setSelectedPage] = useAtom(selectedPageAtom);
  const [currentView, setCurrentView] = useAtom(currentViewAtom);
  const [highlighted, setHighlighted] = useState(false);
  useCursor(highlighted);

  const clickTimeout = useRef(null);
  const clickCount = useRef(0);

  const handlePageClick = (e) => {
    e.stopPropagation();
    
    clickCount.current += 1;
    
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
    }
    
    clickTimeout.current = setTimeout(() => {
      if (clickCount.current === 1) {
        // Single click - navigate to next page
        setPage(opened ? number : number + 1);
      } else if (clickCount.current === 2) {
        // Double click - navigate to detail page view
        const pageToShow = opened ? back : front;
        setSelectedPage(pageToShow);
        setCurrentView("detail");
      }
      clickCount.current = 0;
      setHighlighted(false);
    }, 250);
  };

  const handlePageDoubleClick = (e) => {
    e.stopPropagation();
    
    // Double click - open full page view (only for inner pages)
    if (number !== 0 && number !== totalPages - 1) {
      const pageToShow = opened ? back : front;
      setSelectedPage(pageToShow);
    }
    setHighlighted(false);
  };

  return (
    <group
      {...props}
      ref={group}
      onPointerEnter={(e) => {
        e.stopPropagation();
        setHighlighted(true);
      }}
      onPointerLeave={(e) => {
        e.stopPropagation();
        setHighlighted(false);
      }}
      onClick={handlePageClick}
      onDoubleClick={handlePageDoubleClick}
    >
      <primitive
        object={manualSkinnedMesh}
        ref={skinnedMeshRef}
        position-z={-number * PAGE_DEPTH + page * PAGE_DEPTH}
      />
    </group>
  );
};

export const Book = ({ ...props }) => {
  const [page] = useAtom(pageAtom);
  const [delayedPage, setDelayedPage] = useState(page);
  const [pages, setPages] = useState([]);
  const [firebaseImages, setFirebaseImages] = useState([]);

  // 1. Fetch images from Firestore (Real-time) - Matches UI.jsx logic
  useEffect(() => {
    const q = query(collection(db, "magazine-images"), orderBy("uploadedAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const images = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFirebaseImages(images);
      
      // Update localStorage for other components if needed, but Book relies on state now
      localStorage.setItem('admin_uploaded_images', JSON.stringify(images));
    });
    return () => unsubscribe();
  }, []);

  // 2. Generate Pages - Matches UI.jsx logic exactly
  useEffect(() => {
    // basePictures is now defined at top level
    
    const allPictureIds = [...basePictures, ...firebaseImages.map(img => img.id)];
    
    const generatedPages = [
      { front: "book-cover", back: "book-back" },
    ];

    // Loop through ALL images starting from 0
    for (let i = 0; i < allPictureIds.length; i += 2) {
      const front = allPictureIds[i];
      const back = (i + 1 < allPictureIds.length) ? allPictureIds[i + 1] : "book-back";
      
      generatedPages.push({ front, back });
    }

    generatedPages.push({ front: "book-back", back: "book-back" });
    setPages(generatedPages);

    // Preload textures for the new pages
    generatedPages.forEach((pageData) => {
      useTexture.preload(getPreloadTexturePath(pageData.front, firebaseImages));
      useTexture.preload(getPreloadTexturePath(pageData.back, firebaseImages));
    });

  }, [firebaseImages]);

  useEffect(() => {
    let timeout;
    const goToPage = () => {
      setDelayedPage((delayedPage) => {
        if (page === delayedPage) {
          return delayedPage;
        } else {
          timeout = setTimeout(
            () => {
              goToPage();
            },
            Math.abs(page - delayedPage) > 2 ? 50 : 150
          );
          if (page > delayedPage) {
            return delayedPage + 1;
          }
          if (page < delayedPage) {
            return delayedPage - 1;
          }
        }
      });
    };
    goToPage();
    return () => {
      clearTimeout(timeout);
    };
  }, [page]);

  return (
    <group {...props} rotation-y={-Math.PI / 2}>
      {[...pages].map((pageData, index) => (
        <TextureErrorBoundary 
          key={index} 
          fallback={
            <FallbackPage
              page={delayedPage}
              number={index}
              totalPages={pages.length}
              opened={delayedPage > index}
              bookClosed={delayedPage === 0 || delayedPage === pages.length}
              {...pageData}
            />
          }
        >
          <Page
            page={delayedPage}
            number={index}
            totalPages={pages.length}
            opened={delayedPage > index}
            bookClosed={delayedPage === 0 || delayedPage === pages.length}
            firebaseImages={firebaseImages}
            {...pageData}
          />
        </TextureErrorBoundary>
      ))}
    </group>
  );
};

export { TextureErrorBoundary };
