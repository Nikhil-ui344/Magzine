import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';

const Admin = () => {
  const [uploadedImages, setUploadedImages] = useState([]);
  const [imageContent, setImageContent] = useState({});
  const [newImageFile, setNewImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [firebaseStatus, setFirebaseStatus] = useState('checking'); // checking, connected, error
  const [newImageData, setNewImageData] = useState({
    title: "",
    eventName: "",
    line1: "",
    line2: ""
  });

  // Load existing data from Firebase and localStorage
  useEffect(() => {
    loadImagesFromFirebase();
  }, []);

  const testFirebaseConnection = async () => {
    try {
      console.log("🔥 Testing Firebase connection...");
      setFirebaseStatus('checking');
      
      // Test Firestore read
      const querySnapshot = await getDocs(collection(db, "magazine-images"));
      console.log("✅ Firestore connection successful");
      
      // Test Storage by trying to create a reference
      const testRef = ref(storage, 'test-connection');
      console.log("✅ Storage connection successful");
      
      setFirebaseStatus('connected');
      alert("🎉 Firebase connection successful!\n\nYou can now upload images that will appear on the live website.");
      
    } catch (error) {
      console.error("❌ Firebase connection failed:", error);
      setFirebaseStatus('error');
      alert("❌ Firebase connection failed:\n\n" + error.message + "\n\nPlease check your Firebase Storage rules.");
    }
  };

  const loadImagesFromFirebase = async () => {
    try {
      console.log("🔥 Loading images from Firebase...");
      setFirebaseStatus('checking');
      
      const querySnapshot = await getDocs(collection(db, "magazine-images"));
      const images = [];
      const content = {};
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        images.push({
          id: doc.id,
          ...data
        });
        content[doc.id] = {
          title: data.title,
          eventName: data.eventName,
          lines: data.lines
        };
      });
      
      setUploadedImages(images);
      setImageContent(content);
      setFirebaseStatus('connected');
      console.log("✅ Loaded", images.length, "images from Firebase");
      
      // Also save to localStorage as backup
      localStorage.setItem('admin_uploaded_images', JSON.stringify(images));
      localStorage.setItem('admin_image_content', JSON.stringify(content));
      
    } catch (error) {
      console.error("❌ Firebase connection error:", error);
      setFirebaseStatus('error');
      
      // Fallback to localStorage
      console.log("📦 Falling back to localStorage...");
      const savedImages = localStorage.getItem('admin_uploaded_images');
      const savedContent = localStorage.getItem('admin_image_content');
      
      if (savedImages) {
        setUploadedImages(JSON.parse(savedImages));
        console.log("📦 Loaded from localStorage backup");
      }
      if (savedContent) {
        setImageContent(JSON.parse(savedContent));
      }
    }
  };

  const handleImageUpload = async () => {
    if (!newImageFile || !newImageData.title || !newImageData.eventName) {
      alert("Please fill all fields and select an image!");
      return;
    }

    setUploading(true);
    
    try {
      console.log("🔥 Starting Firebase upload...");
      
      // Create unique filename
      const timestamp = Date.now();
      const fileName = `${timestamp}_${newImageFile.name}`;
      const storageRef = ref(storage, `magazine-images/${fileName}`);
      
      // Upload image to Firebase Storage
      console.log("📤 Uploading to Firebase Storage...");
      const snapshot = await uploadBytes(storageRef, newImageFile);
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log("✅ Image uploaded to Firebase Storage!");
      console.log("🔗 URL:", downloadURL);
      
      // Save metadata to Firestore
      const imageData = {
        name: newImageFile.name,
        fileName: fileName,
        imageUrl: downloadURL,
        title: newImageData.title,
        eventName: newImageData.eventName,
        lines: [newImageData.line1, newImageData.line2],
        uploadedAt: new Date().toISOString()
      };
      
      console.log("💾 Saving metadata to Firestore...");
      const docRef = await addDoc(collection(db, "magazine-images"), imageData);
      console.log("✅ Saved to Firestore with ID:", docRef.id);
      
      // Update local state
      const newImage = { id: docRef.id, ...imageData };
      const updatedImages = [...uploadedImages, newImage];
      const updatedContent = { 
        ...imageContent, 
        [docRef.id]: {
          title: newImageData.title,
          eventName: newImageData.eventName,
          lines: [newImageData.line1, newImageData.line2]
        }
      };
      
      setUploadedImages(updatedImages);
      setImageContent(updatedContent);
      setFirebaseStatus('connected');
      
      // Update localStorage as backup
      localStorage.setItem('admin_uploaded_images', JSON.stringify(updatedImages));
      localStorage.setItem('admin_image_content', JSON.stringify(updatedContent));
      
      // Trigger update event for the book
      window.dispatchEvent(new CustomEvent('admin-content-updated'));
      
      // Reset form
      setNewImageFile(null);
      setNewImageData({ title: "", eventName: "", line1: "", line2: "" });
      document.getElementById('imageUpload').value = '';
      
      alert("🎉 SUCCESS!\n\nImage uploaded to Firebase and will appear on the LIVE WEBSITE for all users!");
      
    } catch (error) {
      console.error("❌ Firebase upload failed:", error);
      setFirebaseStatus('error');
      
      if (error.code === 'storage/unauthorized') {
        alert("❌ Firebase Storage Permission Denied!\n\nPlease update your Firebase Storage rules:\n\nallow read, write: if true;");
      } else if (error.message.includes('network') || error.message.includes('CORS') || error.code === 'storage/retry-limit-exceeded') {
         alert("❌ Upload Blocked by CORS!\n\nThis is a Google Cloud security setting. You MUST run the 'gsutil' command in Google Cloud Console to allow uploads from localhost.");
      } else {
        alert("❌ Firebase upload failed:\n\n" + error.message + "\n\nFalling back to localStorage...");
        
        // Fallback to localStorage
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageId = Date.now().toString();
          const imageData = {
            id: imageId,
            name: newImageFile.name,
            dataUrl: e.target.result,
            uploadedAt: new Date().toISOString()
          };

          const contentData = {
            title: newImageData.title,
            eventName: newImageData.eventName,
            lines: [newImageData.line1, newImageData.line2]
          };

          const updatedImages = [...uploadedImages, imageData];
          const updatedContent = { ...imageContent, [imageId]: contentData };
          
          setUploadedImages(updatedImages);
          setImageContent(updatedContent);

          localStorage.setItem('admin_uploaded_images', JSON.stringify(updatedImages));
          localStorage.setItem('admin_image_content', JSON.stringify(updatedContent));

          window.dispatchEvent(new CustomEvent('admin-content-updated'));
          
          setNewImageFile(null);
          setNewImageData({ title: "", eventName: "", line1: "", line2: "" });
          document.getElementById('imageUpload').value = '';

          alert("⚠️ Uploaded to localStorage only.\nFix Firebase rules for web deployment.");
        };
        reader.readAsDataURL(newImageFile);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!confirm("Are you sure you want to delete this image?")) {
      return;
    }

    try {
      console.log("🗑️ Deleting image:", imageId);
      
      // Find the image to get the filename for storage deletion
      const imageToDelete = uploadedImages.find(img => img.id === imageId);
      
      if (imageToDelete && imageToDelete.fileName) {
        // Delete from Firebase Storage
        console.log("🗑️ Deleting from Storage:", imageToDelete.fileName);
        const storageRef = ref(storage, `magazine-images/${imageToDelete.fileName}`);
        await deleteObject(storageRef);
        console.log("✅ Deleted from Storage");
      }

      // Delete from Firestore
      console.log("🗑️ Deleting from Firestore:", imageId);
      await deleteDoc(doc(db, "magazine-images", imageId));
      console.log("✅ Deleted from Firestore");

      // Update local state
      const updatedImages = uploadedImages.filter(img => img.id !== imageId);
      const updatedContent = { ...imageContent };
      delete updatedContent[imageId];

      setUploadedImages(updatedImages);
      setImageContent(updatedContent);

      localStorage.setItem('admin_uploaded_images', JSON.stringify(updatedImages));
      localStorage.setItem('admin_image_content', JSON.stringify(updatedContent));
      
      // Trigger update event
      window.dispatchEvent(new CustomEvent('admin-content-updated'));
      
      alert("✅ Image deleted successfully from Firebase and local!");
      
    } catch (error) {
      console.error("❌ Error deleting image:", error);
      alert("Delete failed: " + error.message);
    }
  };

  const handleUpdateContent = (imageId, field, value) => {
    try {
      const updatedContent = { ...imageContent };
      if (field === 'line1' || field === 'line2') {
        const lineIndex = field === 'line1' ? 0 : 1;
        const currentLines = updatedContent[imageId]?.lines || ['', ''];
        updatedContent[imageId] = {
          ...updatedContent[imageId],
          lines: [
            lineIndex === 0 ? value : currentLines[0],
            lineIndex === 1 ? value : currentLines[1]
          ]
        };
      } else {
        updatedContent[imageId] = {
          ...updatedContent[imageId],
          [field]: value
        };
      }

      setImageContent(updatedContent);
      localStorage.setItem('admin_image_content', JSON.stringify(updatedContent));
      
    } catch (error) {
      console.error("❌ Error updating content:", error);
    }
  };

  const exportData = () => {
    const exportData = {
      images: uploadedImages,
      content: imageContent,
      exportedAt: new Date().toISOString()
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `magazine_data_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white">
              🔥 Firebase Magazine Admin 
              <span className={`ml-3 px-2 py-1 rounded-full text-sm ${
                firebaseStatus === 'connected' ? 'bg-green-600' : 
                firebaseStatus === 'error' ? 'bg-red-600' : 'bg-yellow-600'
              }`}>
                {firebaseStatus === 'connected' ? '✅ Connected' : 
                 firebaseStatus === 'error' ? '❌ Disconnected' : '🔄 Checking...'}
              </span>
            </h1>
            <div className="flex gap-4">
              <button
                onClick={testFirebaseConnection}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all duration-300"
              >
                🔥 Test Firebase
              </button>
              <button
                onClick={loadImagesFromFirebase}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all duration-300"
              >
                🔄 Refresh from Firebase
              </button>
              <button
                onClick={exportData}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all duration-300"
              >
                📦 Export Data
              </button>
            </div>
          </div>
        </div>

        {/* Upload New Image Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">
            🔥 Upload to Firebase Storage
            <span className={`ml-3 px-2 py-1 rounded text-sm ${
              firebaseStatus === 'connected' ? 'bg-green-600/20 text-green-400' : 
              firebaseStatus === 'error' ? 'bg-red-600/20 text-red-400' : 'bg-yellow-600/20 text-yellow-400'
            }`}>
              {firebaseStatus === 'connected' ? 'Ready for Web Upload' : 
               firebaseStatus === 'error' ? 'Check Firebase Rules' : 'Testing Connection...'}
            </span>
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-white text-sm font-semibold mb-2">Select Image</label>
              <input
                id="imageUpload"
                type="file"
                accept="image/*"
                onChange={(e) => setNewImageFile(e.target.files[0])}
                className="w-full px-3 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:border-white/60"
                disabled={uploading}
              />
              {newImageFile && (
                <p className="text-green-400 text-sm mt-1">✅ Selected: {newImageFile.name}</p>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-white text-sm font-semibold mb-1">Title</label>
                <input
                  type="text"
                  value={newImageData.title}
                  onChange={(e) => setNewImageData({...newImageData, title: e.target.value})}
                  placeholder="Image title"
                  className="w-full px-3 py-2 rounded-lg bg-white/20 text-white placeholder-gray-300 border border-white/30 focus:outline-none focus:border-white/60"
                />
              </div>
              <div>
                <label className="block text-white text-sm font-semibold mb-1">Event Name</label>
                <input
                  type="text"
                  value={newImageData.eventName}
                  onChange={(e) => setNewImageData({...newImageData, eventName: e.target.value})}
                  placeholder="Event name"
                  className="w-full px-3 py-2 rounded-lg bg-white/20 text-white placeholder-gray-300 border border-white/30 focus:outline-none focus:border-white/60"
                />
              </div>
              <div>
                <label className="block text-white text-sm font-semibold mb-1">Description Line 1</label>
                <input
                  type="text"
                  value={newImageData.line1}
                  onChange={(e) => setNewImageData({...newImageData, line1: e.target.value})}
                  placeholder="First description line"
                  className="w-full px-3 py-2 rounded-lg bg-white/20 text-white placeholder-gray-300 border border-white/30 focus:outline-none focus:border-white/60"
                />
              </div>
              <div>
                <label className="block text-white text-sm font-semibold mb-1">Description Line 2</label>
                <input
                  type="text"
                  value={newImageData.line2}
                  onChange={(e) => setNewImageData({...newImageData, line2: e.target.value})}
                  placeholder="Second description line"
                  className="w-full px-3 py-2 rounded-lg bg-white/20 text-white placeholder-gray-300 border border-white/30 focus:outline-none focus:border-white/60"
                  disabled={uploading}
                />
              </div>
              <button
                onClick={handleImageUpload}
                disabled={uploading}
                className={`w-full py-3 font-bold rounded-lg transition-all duration-300 ${
                  uploading 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                } text-white`}
              >
                {uploading ? "🔄 Uploading to Firebase..." : "🔥 Upload to Firebase (Live Web)"}
              </button>
            </div>
          </div>
        </div>

        {/* Uploaded Images Management */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">Manage Uploaded Images ({uploadedImages.length})</h2>
          
          {uploadedImages.length === 0 ? (
            <p className="text-white/60 text-center py-8">No images uploaded yet. Upload your first image above!</p>
          ) : (
            <div className="grid gap-6">
              {uploadedImages.map((image) => (
                <div key={image.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="grid md:grid-cols-3 gap-4">
                    {/* Image Preview */}
                    <div className="flex flex-col items-center">
                      <img
                        src={image.imageUrl || image.dataUrl}
                        alt={image.name}
                        className="w-full max-w-xs h-48 object-cover rounded-lg border-2 border-white/20"
                      />
                      <p className="text-white/60 text-sm mt-2">{image.name}</p>
                      <p className="text-white/40 text-xs">ID: {image.id}</p>
                      {image.imageUrl && <p className="text-green-400 text-xs">✅ In Firebase</p>}
                      {image.dataUrl && !image.imageUrl && <p className="text-yellow-400 text-xs">⚠ Local only</p>}
                    </div>

                    {/* Content Management */}
                    <div className="md:col-span-2 space-y-3">
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-white text-sm font-semibold mb-1">Title</label>
                          <input
                            type="text"
                            value={imageContent[image.id]?.title || ''}
                            onChange={(e) => handleUpdateContent(image.id, 'title', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:border-white/60"
                          />
                        </div>
                        <div>
                          <label className="block text-white text-sm font-semibold mb-1">Event Name</label>
                          <input
                            type="text"
                            value={imageContent[image.id]?.eventName || ''}
                            onChange={(e) => handleUpdateContent(image.id, 'eventName', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:border-white/60"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-white text-sm font-semibold mb-1">Description Line 1</label>
                        <input
                          type="text"
                          value={imageContent[image.id]?.lines?.[0] || ''}
                          onChange={(e) => handleUpdateContent(image.id, 'line1', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:border-white/60"
                        />
                      </div>
                      <div>
                        <label className="block text-white text-sm font-semibold mb-1">Description Line 2</label>
                        <input
                          type="text"
                          value={imageContent[image.id]?.lines?.[1] || ''}
                          onChange={(e) => handleUpdateContent(image.id, 'line2', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:border-white/60"
                        />
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => handleDeleteImage(image.id)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all duration-300"
                        >
                          Delete Image
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;