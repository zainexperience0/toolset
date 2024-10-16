import React, { useState } from "react";
import "../assets/css/App.css";
import { getYTSubtitles, getVideoTags, getVideoMeta } from "../lib/utils"; // Import the function

const App = () => {
  const [subtitles, setSubtitles] = useState<any>("");
  const [tags, setTags] = useState<any>([]);
  const [error, setError] = useState("");

  const handleFetchSubtitles = async () => {
    setError(""); // Reset any previous errors
    try {
      const result = await getYTSubtitles();
      setSubtitles(result);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleFetchTags = async () => {
    setError(""); // Reset any previous errors
    try {
      const result = await getVideoTags();
      setTags(result);
      console.log({ result });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handlefetchMeta = () => {
    setError(""); // Reset any previous errors
    try {
      const result = getVideoMeta();
      console.log({ result });
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="container mx-auto p-6 bg-gray-100 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">YouTube Tools</h1>

      <div className="flex space-x-4 mb-4">
        <button
          onClick={handleFetchSubtitles}
          className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
        >
          Fetch Subtitles
        </button>
        <button
          onClick={handleFetchTags}
          className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
        >
          Fetch Video Tags
        </button>
        <button
          onClick={handlefetchMeta}
          className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
        >
          Fetch Video Meta
        </button>
      </div>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      {subtitles && (
        <div className="result bg-gray-200 p-4 rounded mt-4">
          <h2 className="font-semibold">Subtitles:</h2>
          <p>{subtitles}</p>
        </div>
      )}

      {tags.length > 0 && tags && (
        <div className="result bg-gray-200 p-4 rounded mt-4">
          {tags.map((tag: any) => (
            <div key={tag}>
              <h2 className="font-semibold">{tag}</h2>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default App;
