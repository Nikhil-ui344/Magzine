import { useState, useEffect } from "react";

const Admin = () => {
  const [uploadedImages, setUploadedImages] = useState([]);
  const [imageContent, setImageContent] = useState({});
  const [newImageFile, setNewImageFile] = useState(null);
  const [newImageData, setNewImageData] = useState({
    title: "",
    eventName: "",
    line1: "",
    line2: ""
  });

  // Load existing data from localStorage
  useEffect(() => {
    const savedImages = localStorage.getItem('admin_uploaded_images');
    const savedContent = localStorage.getItem('admin_image_content');
    
    if (savedImages) {
      setUploadedImages(JSON.parse(savedImages));
    }
    if (savedContent) {
      setImageContent(JSON.parse(savedContent));
    }
  }, []);

  const handleImageUpload = () => {
    if (!newImageFile || !newImageData.title || !newImageData.eventName) {
      alert("Please fill all fields and select an image!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageId = Date.now().toString(); // Simple ID generation
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

      // Update state
      const updatedImages = [...uploadedImages, imageData];
      const updatedContent = { ...imageContent, [imageId]: contentData };
      
      setUploadedImages(updatedImages);
      setImageContent(updatedContent);

      // Save to localStorage
      localStorage.setItem('admin_uploaded_images', JSON.stringify(updatedImages));
      localStorage.setItem('admin_image_content', JSON.stringify(updatedContent));

      // Trigger a custom event to notify other components
      window.dispatchEvent(new CustomEvent('admin-content-updated'));

      // Reset form
      setNewImageFile(null);
      setNewImageData({ title: "", eventName: "", line1: "", line2: "" });
      document.getElementById('imageUpload').value = '';

      alert("Image uploaded successfully! The book will update shortly.");
    };
    reader.readAsDataURL(newImageFile);
  };

  const handleDeleteImage = (imageId) => {
    if (confirm("Are you sure you want to delete this image?")) {
      const updatedImages = uploadedImages.filter(img => img.id !== imageId);
      const updatedContent = { ...imageContent };
      delete updatedContent[imageId];

      setUploadedImages(updatedImages);
      setImageContent(updatedContent);

      localStorage.setItem('admin_uploaded_images', JSON.stringify(updatedImages));
      localStorage.setItem('admin_image_content', JSON.stringify(updatedContent));
    }
  };

  const handleUpdateContent = (imageId, field, value) => {
    const updatedContent = { ...imageContent };
    if (field === 'line1' || field === 'line2') {
      const lineIndex = field === 'line1' ? 0 : 1;
      updatedContent[imageId] = {
        ...updatedContent[imageId],
        lines: [
          lineIndex === 0 ? value : updatedContent[imageId].lines[0],
          lineIndex === 1 ? value : updatedContent[imageId].lines[1]
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
            <h1 className="text-3xl font-bold text-white">Magazine Admin Panel</h1>
            <div className="flex gap-4">
              <button
                onClick={exportData}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all duration-300"
              >
                Export Data
              </button>
            </div>
          </div>
        </div>

        {/* Upload New Image Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">Upload New Image</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-white text-sm font-semibold mb-2">Select Image</label>
              <input
                id="imageUpload"
                type="file"
                accept="image/*"
                onChange={(e) => setNewImageFile(e.target.files[0])}
                className="w-full px-3 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:border-white/60"
              />
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
                />
              </div>
              <button
                onClick={handleImageUpload}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-lg transition-all duration-300"
              >
                Upload Image
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
                        src={image.dataUrl}
                        alt={image.name}
                        className="w-full max-w-xs h-48 object-cover rounded-lg border-2 border-white/20"
                      />
                      <p className="text-white/60 text-sm mt-2">{image.name}</p>
                      <p className="text-white/40 text-xs">ID: {image.id}</p>
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