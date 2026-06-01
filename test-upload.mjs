import fs from 'fs';

async function testUpload() {
  const formData = new FormData();
  
  // Create a small mock MP3 file
  const blob = new Blob(["mock mp3 content"], { type: "audio/mpeg" });
  formData.append("file", blob, "test.mp3");

  try {
    const res = await fetch("http://localhost:3000/api/upload-backsound", {
      method: "POST",
      body: formData,
    });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

testUpload();
